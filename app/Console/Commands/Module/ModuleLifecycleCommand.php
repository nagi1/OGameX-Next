<?php

namespace OGame\Console\Commands\Module;

use Closure;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Nwidart\Modules\Facades\Module;
use Nwidart\Modules\Module as ModuleInstance;
use OGame\Modules\ModuleHooks;
use RuntimeException;
use Throwable;

/**
 * Shared machinery for the module lifecycle commands.
 *
 * A command only declares what it does — the steps it runs and the line it prints when
 * they pass. This base class resolves the module, renders each step, honours --dry-run
 * and turns a failed step into an actionable message.
 */
abstract class ModuleLifecycleCommand extends Command
{
    /** @var list<string> */
    private array $findings = [];

    /** The verb used in progress and failure messages, for example "install". */
    abstract protected function verb(): string;

    /** The line printed once every step passed. */
    abstract protected function summary(string $module): string;

    /** The progress line, for example "Installing" or "Would install". */
    abstract protected function activity(bool $dryRun): string;

    /**
     * @param  Closure(string): void  $report
     * @return list<array{label: string, run: Closure(): void, mutates: bool}>
     */
    abstract protected function steps(ModuleInstance $module, Closure $report): array;

    /** Returning false stops before any step runs, for example when an operator aborts. */
    protected function guard(ModuleInstance $module, bool $dryRun): bool
    {
        return true;
    }

    public function handle(ModuleHooks $hooks): int
    {
        $name = (string) $this->argument('module');
        $module = Module::find($name);

        if ($module === null) {
            $this->components->error("Module [{$name}] was not found. Run [php artisan module:list] to see the available modules.");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');

        if (!$this->guard($module, $dryRun)) {
            return self::FAILURE;
        }

        try {
            $steps = $this->steps($module, $this->report(...));
        } catch (Throwable $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->components->info($this->activity($dryRun)." module [{$module->getName()}]");

        foreach ($steps as $step) {
            // Read-only steps also run during a dry run, so operators see the real
            // environment findings before they change anything.
            if ($dryRun && $step['mutates']) {
                $this->line('  • '.$step['label']);

                continue;
            }

            if ($this->runStep($step['label'], $step['run'])) {
                continue;
            }

            $this->components->error($dryRun
                ? "Module [{$module->getName()}] could not be verified. Fix the errors above and re-run; [php artisan ogamex:module:doctor {$module->getName()}] re-checks without changing anything."
                : "Module [{$module->getName()}] was not fully {$this->verb()}ed. Fix the errors above and re-run; [php artisan ogamex:module:doctor {$module->getName()}] re-checks without changing anything.");

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->components->info('Dry run complete. Nothing was changed.');

            return self::SUCCESS;
        }

        $this->components->info($this->summary($module->getName()));

        return self::SUCCESS;
    }

    /**
     * @param  Closure(): void  $run
     * @return array{label: string, run: Closure(): void, mutates: bool}
     */
    protected function write(string $label, Closure $run): array
    {
        return ['label' => $label, 'run' => $run, 'mutates' => true];
    }

    /**
     * @param  Closure(): void  $run
     * @return array{label: string, run: Closure(): void, mutates: bool}
     */
    protected function read(string $label, Closure $run): array
    {
        return ['label' => $label, 'run' => $run, 'mutates' => false];
    }

    protected function report(string $line): void
    {
        $this->findings[] = $line;
    }

    /**
     * @param  Closure(): void  $step
     */
    private function runStep(string $label, Closure $step): bool
    {
        $passed = false;

        $this->components->task($label, function () use ($step, &$passed): bool {
            try {
                $step();
                $passed = true;
            } catch (Throwable $exception) {
                $this->components->error($exception->getMessage());
            }

            return $passed;
        });

        // Buffered so the step's own task line stays readable.
        foreach ($this->findings as $finding) {
            $this->line('    '.$finding);
        }

        $this->findings = [];

        return $passed;
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    protected function runArtisan(string $command, array $parameters = []): void
    {
        $exitCode = $this->callSilent($command, $parameters);

        if ($exitCode !== self::SUCCESS) {
            throw new RuntimeException("Command [{$command}] failed with exit code {$exitCode}.");
        }
    }

    /**
     * nWidart v13 ships no module:clear-compiled command, so the cached provider files
     * are removed directly; they regenerate on the next boot.
     */
    protected function refreshModuleCache(): void
    {
        $cachePath = base_path('bootstrap/cache');

        if (!is_dir($cachePath) || !is_writable($cachePath)) {
            throw new RuntimeException("Module cache directory [{$cachePath}] is not writable.");
        }

        foreach (array_merge(File::glob($cachePath.DIRECTORY_SEPARATOR.'*_module.php') ?: [], [$cachePath.DIRECTORY_SEPARATOR.'modules.php']) as $cached) {
            if (!is_file($cached)) {
                continue;
            }

            if (!is_writable($cached)) {
                throw new RuntimeException("Module cache file [{$cached}] is not writable.");
            }

            File::delete($cached);
        }
    }

    protected function hasMigrations(ModuleInstance $module): bool
    {
        $migrations = $this->migrationDirectory($module);

        if (!is_dir($migrations)) {
            return false;
        }

        if (!is_readable($migrations)) {
            throw new RuntimeException("Module migration directory [{$migrations}] is not readable.");
        }

        return true;
    }

    protected function migrationDirectory(ModuleInstance $module): string
    {
        return $module->getPath().DIRECTORY_SEPARATOR.'database'.DIRECTORY_SEPARATOR.'migrations';
    }
}
