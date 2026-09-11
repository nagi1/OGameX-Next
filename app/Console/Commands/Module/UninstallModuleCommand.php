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
 * Uninstalls a module: run its optional uninstall hook, disable it, then refresh caches
 * and queue workers. Module data is kept unless the operator passes --drop-data, so a
 * routine uninstall cannot destroy player history by accident. The module's files are
 * never deleted; use `module:delete` for that.
 */
#[Description('Uninstall a module: run its uninstall hook, disable it, and refresh caches and workers.')]
#[Signature('ogamex:module:uninstall {module : The module name, for example AI} {--drop-data : Roll every module migration back and delete its data} {--force : Do not ask before dropping data} {--dry-run : Print the steps without changing anything}')]
class UninstallModuleCommand extends ModuleLifecycleCommand
{
    protected function verb(): string
    {
        return 'uninstall';
    }

    protected function activity(bool $dryRun): string
    {
        return $dryRun ? 'Would uninstall' : 'Uninstalling';
    }

    protected function summary(string $module): string
    {
        return "Module [{$module}] is uninstalled and disabled.";
    }

    protected function guard(ModuleInstance $module, bool $dryRun): bool
    {
        if ($dryRun || !$this->option('drop-data') || $this->option('force')) {
            return true;
        }

        if ($this->confirm('This permanently rolls back the module migrations and deletes its data. Continue?')) {
            return true;
        }

        $this->components->warn('Aborted. Module data was not dropped.');

        return false;
    }

    /**
     * @param  Closure(string): void  $report
     */
    protected function steps(ModuleInstance $module, Closure $report): array
    {
        $name = $module->getName();
        $steps = [];

        $hook = app(ModuleHooks::class)->uninstall($module);

        if ($hook instanceof ModuleHook) {
            $steps[] = $this->write(
                'Run the module uninstall hook',
                fn () => $hook->handle(new ModuleHookContext($module, $report)),
            );
        }

        if ($this->option('drop-data') && $this->hasMigrations($module)) {
            // module:migrate-rollback only reverts the newest batch, which would leave
            // older module tables behind on a drop-data run.
            $steps[] = $this->write(
                'Roll back every module migration',
                fn () => $this->runArtisan('module:migrate-reset', ['module' => $name, '--force' => true]),
            );
        }

        $steps[] = $this->write('Disable the module', fn () => $this->runArtisan('module:disable', ['module' => $name]));
        $steps[] = $this->read('Report container cleanup', fn () => $this->reportContainerCleanup($module, $report));
        $steps[] = $this->write('Refresh the compiled module cache', fn () => $this->refreshModuleCache());
        $steps[] = $this->write('Clear the application caches', fn () => $this->runArtisan('optimize:clear'));
        $steps[] = $this->write('Restart the queue workers', fn () => $this->runArtisan('queue:restart'));

        return $steps;
    }

    /**
     * @param  Closure(string): void  $report
     */
    private function reportContainerCleanup(ModuleInstance $module, Closure $report): void
    {
        $report('The module keeps its data; pass --drop-data to roll every module migration back.');
        $report('Restart the queue container (and Horizon) to drop the module worker pools and entrypoint hooks.');

        app(ModuleContributionInspector::class)->report($module, $report);
    }
}
