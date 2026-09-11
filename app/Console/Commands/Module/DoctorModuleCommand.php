<?php

namespace OGame\Console\Commands\Module;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Nwidart\Modules\Facades\Module;
use Nwidart\Modules\Module as ModuleInstance;
use OGame\Modules\ModuleContributionInspector;

/**
 * Read-only companion to install/uninstall. Everything the host knows about a
 * module's queue lanes, supervisor fragments, entrypoint hooks and Redis wiring is
 * printed here, so an operator can diagnose a module that installs cleanly but
 * never runs inside the container.
 *
 * Nothing is changed, which makes it safe on production and safe to run in a loop.
 */
#[Description("Report whether a module's queue, container and Redis wiring is complete.")]
#[Signature('ogamex:module:doctor {module? : The module to inspect; every module when omitted}')]
class DoctorModuleCommand extends Command
{
    private int $warnings = 0;

    public function handle(ModuleContributionInspector $inspector): int
    {
        $name = $this->argument('module');

        if (is_string($name) && $name !== '') {
            return $this->inspectNamed($inspector, $name);
        }

        $modules = array_values(Module::all());

        if ($modules === []) {
            $this->components->warn('No modules are installed. Add a module under [Modules/] and run [php artisan module:list].');

            return self::SUCCESS;
        }

        return $this->inspect($inspector, $modules);
    }

    private function inspectNamed(ModuleContributionInspector $inspector, string $name): int
    {
        $module = Module::find($name);

        if ($module === null) {
            $this->components->error("Module [{$name}] was not found. Run [php artisan module:list] to see the available modules.");

            return self::FAILURE;
        }

        return $this->inspect($inspector, [$module]);
    }

    /**
     * @param  list<ModuleInstance>  $modules
     */
    private function inspect(ModuleContributionInspector $inspector, array $modules): int
    {
        $errors = 0;
        $multiple = count($modules) > 1;

        foreach ($modules as $module) {
            $errors += $this->inspectModule($inspector, $module, $multiple);
        }

        if ($errors > 0) {
            $this->components->error("Found {$errors} blocking problem(s). Fix them, then run [php artisan ogamex:module:doctor] again.");

            return self::FAILURE;
        }

        if ($this->warnings > 0) {
            $this->components->warn("No blocking problems. The {$this->warnings} warning(s) above are informational and do not stop the module from running.");

            return self::SUCCESS;
        }

        $this->components->info('The module wiring is complete.');

        return self::SUCCESS;
    }

    private function inspectModule(ModuleContributionInspector $inspector, ModuleInstance $module, bool $verbose): int
    {
        $name = $module->getName();
        $enabled = $module->isEnabled();

        if ($verbose) {
            $this->newLine();
        }

        $this->components->twoColumnDetail($name, $enabled ? '<fg=green>enabled</>' : '<fg=yellow>disabled</>');

        $errors = 0;

        foreach ($inspector->inspect($module) as $finding) {
            $this->line('  '.$this->symbolFor($finding['level']).' '.$finding['message']);

            if ($finding['level'] === ModuleContributionInspector::LEVEL_ERROR) {
                $errors++;

                continue;
            }

            if ($finding['level'] === ModuleContributionInspector::LEVEL_WARNING) {
                $this->warnings++;
            }
        }

        if (!$enabled) {
            // Disabled is the normal state for a module that is not installed yet, so
            // say what it means rather than leaving the operator guessing.
            $this->line('  <fg=blue>i</> The module is disabled: its lanes, worker pool and entrypoint hooks are inactive.');
            $this->line('    Run [php artisan ogamex:module:install '.$name.'] to install and enable it.');
        }

        if ($errors > 0) {
            $this->line('    Fix the errors above, then run [php artisan ogamex:module:install '.$name.'].');
        }

        return $errors;
    }

    private function symbolFor(string $level): string
    {
        return match ($level) {
            ModuleContributionInspector::LEVEL_ERROR => '<fg=red>×</>',
            ModuleContributionInspector::LEVEL_WARNING => '<fg=yellow>!</>',
            default => '<fg=blue>i</>',
        };
    }
}
