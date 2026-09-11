<?php

namespace OGame\Modules\Contracts;

use OGame\Modules\ModuleHookContext;

/**
 * Optional module lifecycle hook.
 *
 * A module opts in by convention: create Modules\<Name>\Hooks\InstallModule or
 * Modules\<Name>\Hooks\UninstallModule implementing this interface. The class is
 * autoloaded through the module's own PSR-4 mapping, so it runs even while the
 * module is disabled (install runs before enabling, uninstall can run after
 * disabling).
 */
interface ModuleHook
{
    public function handle(ModuleHookContext $context): void;
}
