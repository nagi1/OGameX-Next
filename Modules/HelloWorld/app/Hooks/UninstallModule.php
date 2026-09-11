<?php

namespace Modules\HelloWorld\Hooks;

use OGame\Modules\Contracts\ModuleHook;
use OGame\Modules\ModuleHookContext;

/**
 * Example uninstall hook for the reference module.
 *
 * Runs before the module is disabled and before any optional data rollback, so it
 * is the place to release host resources the module acquired during install.
 */
class UninstallModule implements ModuleHook
{
    public function handle(ModuleHookContext $context): void
    {
        $context->line('HelloWorld uninstall hook completed.');
    }
}
