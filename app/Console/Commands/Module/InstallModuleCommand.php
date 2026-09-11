<?php

namespace OGame\Console\Commands\Module;

use Closure;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Nwidart\Modules\Facades\Module;
use Nwidart\Modules\Module as ModuleInstance;
use OGame\Modules\Contracts\ModuleHook;
use OGame\Modules\ModuleContributionInspector;
use OGame\Modules\ModuleHookContext;
use OGame\Modules\ModuleHooks;
use RuntimeException;
use Throwable;

/**
 * One safe command to install a module: run its migrations, run its optional
 * install hook, enable it, and refresh caches and queue workers.
 *
 * Every step is checked; a failure stops the run with an actionable message
 * instead of reporting a false success.
 */
#[Description('Install a module: run its migrations, run its install hook, enable it, and refresh caches and workers.')]
#[Signature('ogamex:module:install {module : The module name, for example AI} {--dry-run : Print the steps without changing anything}')]
class InstallModuleCommand extends Command
{
    public function handle(ModuleHooks $hooks): int
    {
        $name = (string) $this->argument('module');
        $module = Module::find($name);

        if ($module === null) {
            $this->components->error("Module [{$name}] was not found. Run [php artisan module:list] to see the available modules.");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $findings = [];
        $report = function (string $line) use (&$findings): void {
            $findings[] = $line;
        };

        try {
            $steps = $this->steps($module, $hooks, $report);
        } catch (Throwable $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->components->info(($dryRun ? 'Would install' : 'Installing')." module [{$module->getName()}]");

        foreach ($steps as $step) {
            // Read-only steps run during a dry run too, so operators see the real
            // environment findings before they commit to an install.
            if ($dryRun && $step['changes']) {
                $this->line('  • '.$step['label']);

                continue;
            }

            if ($this->runStep($step['label'], $step['run'], $findings)) {
                continue;
            }

            $this->components->error($dryRun
                ? "Module [{$module->getName()}] could not be verified. Fix the errors above and re-run; [php artisan ogamex:module:doctor {$module->getName()}] re-checks without changing anything."
                : "Module [{$module->getName()}] was not fully installed. Fix the errors above and re-run; [php artisan ogamex:module:doctor {$module->getName()}] re-checks without changing anything.");

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->components->info('Dry run complete. Nothing was changed.');

            return self::SUCCESS;
        }

        $this->components->info("Module [{$module->getName()}] is installed and enabled.");

        return self::SUCCESS;
    }

    /**
     * @param  Closure(): void  $step
     * @param  array<int, string>  $findings
     */
    private function runStep(string $label, Closure $step, array &$findings): bool
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

        $this->flushFindings($findings);

        return $passed;
    }

    /**
     * Findings are buffered so a step's own task line stays readable.
     *
     * @param  array<int, string>  $findings
     */
    private function flushFindings(array &$findings): void
    {
        foreach ($findings as $finding) {
            $this->line('    '.$finding);
        }

        $findings = [];
    }

    /**
     * @param  Closure(string): void  $report
     * @return list<array{label: string, run: Closure(): void, changes: bool}>
     */
    private function steps(ModuleInstance $module, ModuleHooks $hooks, Closure $report): array
    {
        $name = $module->getName();
        $steps = [[
            'label' => 'Verify the runtime and container wiring',
            'changes' => false,
            'run' => function () use ($module, $report): void {
                app(ModuleContributionInspector::class)->verify($module, $report);
            },
        ]];

        if ($this->hasMigrations($module)) {
            $migrations = $this->migrationPath($module);

            $steps[] = [
                'label' => 'Run the module migrations',
                'changes' => true,
                'run' => function () use ($migrations): void {
                    // nWidart only migrates enabled modules, so a fresh install would
                    // otherwise report success while applying nothing. Migrating the
                    // module's own path also works while the module is still disabled.
                    $this->runArtisan('migrate', ['--path' => $migrations, '--realpath' => true, '--force' => true]);
                },
            ];
        }

        $hook = $hooks->install($module);
        if ($hook instanceof ModuleHook) {
            $steps[] = [
                'label' => 'Run the module install hook',
                'changes' => true,
                'run' => function () use ($hook, $module, $report): void {
                    $hook->handle(new ModuleHookContext($module, false, $report));
                },
            ];
        }

        $steps[] = [
            'label' => 'Enable the module',
            'changes' => true,
            'run' => function () use ($name): void {
                $this->runArtisan('module:enable', ['module' => $name]);
            },
        ];
        $steps[] = [
            'label' => 'Refresh the compiled module cache',
            'changes' => true,
            'run' => function (): void {
                $this->refreshModuleCache();
            },
        ];
        $steps[] = [
            'label' => 'Clear the application caches',
            'changes' => true,
            'run' => function (): void {
                $this->runArtisan('optimize:clear');
            },
        ];
        $steps[] = [
            'label' => 'Restart the queue workers',
            'changes' => true,
            'run' => function (): void {
                $this->runArtisan('queue:restart');
            },
        ];

        return $steps;
    }

    private function hasMigrations(ModuleInstance $module): bool
    {
        $migrations = $this->migrationPath($module);

        if (!is_dir($migrations)) {
            return false;
        }

        if (!is_readable($migrations)) {
            throw new RuntimeException("Module migration directory [{$migrations}] is not readable.");
        }

        return true;
    }

    private function migrationPath(ModuleInstance $module): string
    {
        return $module->getPath().DIRECTORY_SEPARATOR.'database'.DIRECTORY_SEPARATOR.'migrations';
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    private function runArtisan(string $command, array $parameters = []): void
    {
        $exitCode = $this->callSilent($command, $parameters);

        if ($exitCode !== self::SUCCESS) {
            throw new RuntimeException("Command [{$command}] failed with exit code {$exitCode}.");
        }
    }

    private function refreshModuleCache(): void
    {
        $cachePath = base_path('bootstrap/cache');

        if (!is_dir($cachePath) || !is_writable($cachePath)) {
            throw new RuntimeException("Module cache directory [{$cachePath}] is not writable.");
        }

        // nWidart v13 ships no module:clear-compiled command, so remove its cached
        // provider files directly; they regenerate on the next boot.
        foreach (File::glob($cachePath.DIRECTORY_SEPARATOR.'*_module.php') ?: [] as $cached) {
            if (!is_writable($cached)) {
                throw new RuntimeException("Module cache file [{$cached}] is not writable.");
            }
            File::delete($cached);
        }

        $manifest = $cachePath.DIRECTORY_SEPARATOR.'modules.php';

        if (is_file($manifest) && !is_writable($manifest)) {
            throw new RuntimeException("Module cache file [{$manifest}] is not writable.");
        }

        File::delete($manifest);
    }
}
