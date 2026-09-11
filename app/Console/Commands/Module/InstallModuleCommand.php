<?php

namespace OGame\Console\Commands\Module;

use Closure;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Nwidart\Modules\Module as ModuleInstance;
use OGame\Modules\Contracts\ModuleHook;
use OGame\Modules\ModuleContributionInspector;
use OGame\Modules\ModuleHookContext;
use OGame\Modules\ModuleHooks;

/**
 * Installs a module: run its migrations, run its optional install hook, enable it, then
 * refresh caches and queue workers. A failure stops the run with an actionable message
 * instead of reporting a false success.
 */
#[Description('Install a module: run its migrations, run its install hook, enable it, and refresh caches and workers.')]
#[Signature('ogamex:module:install {module : The module name, for example AI} {--dry-run : Print the steps without changing anything}')]
class InstallModuleCommand extends ModuleLifecycleCommand
{
    protected function verb(): string
    {
        return 'install';
    }

    protected function activity(bool $dryRun): string
    {
        return $dryRun ? 'Would install' : 'Installing';
    }

    protected function summary(string $module): string
    {
        return "Module [{$module}] is installed and enabled.";
    }

    /**
     * @param  Closure(string): void  $report
     */
    protected function steps(ModuleInstance $module, Closure $report): array
    {
        $name = $module->getName();

        $steps = [
            $this->read(
                'Verify the runtime and container wiring',
                fn () => app(ModuleContributionInspector::class)->verify($module, $report),
            ),
        ];

        if ($this->hasMigrations($module)) {
            // nWidart only migrates enabled modules, so a fresh install would otherwise
            // report success while applying nothing. Migrating the module's own path
            // also works while the module is still disabled.
            $migrations = $this->migrationDirectory($module);

            $steps[] = $this->write(
                'Run the module migrations',
                fn () => $this->runArtisan('migrate', ['--path' => $migrations, '--realpath' => true, '--force' => true]),
            );
        }

        $hook = app(ModuleHooks::class)->install($module);

        if ($hook instanceof ModuleHook) {
            $steps[] = $this->write(
                'Run the module install hook',
                fn () => $hook->handle(new ModuleHookContext($module, $report)),
            );
        }

        $steps[] = $this->write('Enable the module', fn () => $this->runArtisan('module:enable', ['module' => $name]));
        $steps[] = $this->write('Refresh the compiled module cache', fn () => $this->refreshModuleCache());
        $steps[] = $this->write('Clear the application caches', fn () => $this->runArtisan('optimize:clear'));
        $steps[] = $this->write('Restart the queue workers', fn () => $this->runArtisan('queue:restart'));

        return $steps;
    }
}
