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
 * One safe command to uninstall a module: run its optional uninstall hook, then
 * disable it and refresh caches and workers. Module data is kept unless the
 * operator explicitly passes --drop-data, so a routine uninstall cannot destroy
 * player history by accident.
 *
 * The module's files are never deleted; use `module:delete` for that.
 */
#[Description('Uninstall a module: run its uninstall hook, disable it, and refresh caches and workers.')]
#[Signature('ogamex:module:uninstall {module : The module name, for example AI} {--drop-data : Roll every module migration back and delete its data} {--force : Do not ask before dropping data} {--dry-run : Print the steps without changing anything}')]
class UninstallModuleCommand extends Command
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
        $dropData = (bool) $this->option('drop-data');

        if (!$dryRun && $dropData && !$this->option('force') && !$this->confirm('This permanently rolls back the module migrations and deletes its data. Continue?')) {
            $this->components->warn('Aborted. Module data was not dropped.');

            return self::FAILURE;
        }

        $findings = [];
        $report = function (string $line) use (&$findings): void {
            $findings[] = $line;
        };

        try {
            $steps = $this->steps($module, $hooks, $dropData, $report);
        } catch (Throwable $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->components->info(($dryRun ? 'Would uninstall' : 'Uninstalling')." module [{$module->getName()}]");

        foreach ($steps as $step) {
            // Read-only steps run during a dry run too, so operators see the real
            // environment findings before they change anything.
            if ($dryRun && $step['changes']) {
                $this->line('  • '.$step['label']);

                continue;
            }

            if ($this->runStep($step['label'], $step['run'], $findings)) {
                continue;
            }

            $this->components->error($dryRun
                ? "Module [{$module->getName()}] could not be verified. Fix the errors above and re-run; [php artisan ogamex:module:doctor {$module->getName()}] re-checks without changing anything."
                : "Module [{$module->getName()}] was not fully uninstalled. Fix the errors above and re-run; [php artisan ogamex:module:doctor {$module->getName()}] re-checks without changing anything.");

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->components->info('Dry run complete. Nothing was changed.');

            return self::SUCCESS;
        }

        $this->components->info("Module [{$module->getName()}] is uninstalled and disabled.");

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
    private function steps(ModuleInstance $module, ModuleHooks $hooks, bool $dropData, Closure $report): array
    {
        $name = $module->getName();
        $steps = [];

        $hook = $hooks->uninstall($module);
        if ($hook instanceof ModuleHook) {
            $steps[] = [
                'label' => 'Run the module uninstall hook',
                'changes' => true,
                'run' => function () use ($hook, $module, $report): void {
                    $hook->handle(new ModuleHookContext($module, false, $report));
                },
            ];
        }

        if ($dropData && $this->hasMigrations($module)) {
            $steps[] = [
                'label' => 'Roll back every module migration',
                'changes' => true,
                'run' => function () use ($name): void {
                    // module:migrate-rollback only reverts the newest batch, which would
                    // silently leave room for old module tables to survive a drop-data run.
                    $this->runArtisan('module:migrate-reset', ['module' => $name, '--force' => true]);
                },
            ];
        }

        $steps[] = [
            'label' => 'Disable the module',
            'changes' => true,
            'run' => function () use ($name): void {
                $this->runArtisan('module:disable', ['module' => $name]);
            },
        ];
        $steps[] = [
            'label' => 'Report container cleanup',
            'changes' => false,
            'run' => function () use ($module, $report): void {
                $report('The module keeps its data; pass --drop-data to roll every module migration back.');
                $report('Restart the queue container (and Horizon) to drop the module worker pools and entrypoint hooks.');
                app(ModuleContributionInspector::class)->report($module, $report);
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
        $migrations = $module->getPath().DIRECTORY_SEPARATOR.'database'.DIRECTORY_SEPARATOR.'migrations';

        if (!is_dir($migrations)) {
            return false;
        }

        if (!is_readable($migrations)) {
            throw new RuntimeException("Module migration directory [{$migrations}] is not readable.");
        }

        return true;
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
