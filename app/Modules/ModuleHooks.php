<?php

namespace OGame\Modules;

use Nwidart\Modules\Module;
use OGame\Modules\Contracts\ModuleHook;
use RuntimeException;
use Throwable;

/**
 * Resolves a module's optional lifecycle hooks by convention.
 *
 * The classes live under the module's own namespace (Modules\<Name>\Hooks\...), which the
 * merge plugin autoloads regardless of module status, so they are available before the
 * module is enabled. A hook that exists but cannot be used fails loudly, so a module
 * author is never left wondering why it was ignored.
 */
final class ModuleHooks
{
    public function install(Module $module): ModuleHook|null
    {
        return $this->resolve($module, 'InstallModule');
    }

    public function uninstall(Module $module): ModuleHook|null
    {
        return $this->resolve($module, 'UninstallModule');
    }

    private function resolve(Module $module, string $class): ModuleHook|null
    {
        $namespace = (string) config('modules.namespace', 'Modules');
        $hookClass = $namespace.'\\'.$module->getStudlyName().'\\Hooks\\'.$class;

        if (!class_exists($hookClass)) {
            return null;
        }

        try {
            $hook = app($hookClass);
        } catch (Throwable $exception) {
            throw new RuntimeException("Module hook [{$hookClass}] could not be resolved: {$exception->getMessage()}", 0, $exception);
        }

        if (!$hook instanceof ModuleHook) {
            throw new RuntimeException("Module hook [{$hookClass}] must implement [".ModuleHook::class.'].');
        }

        return $hook;
    }
}
