<?php

namespace Modules\HelloWorld\Hooks;

use OGame\Modules\Contracts\ModuleHook;
use OGame\Modules\ModuleHookContext;

/**
 * Example install hook for the reference module.
 *
 * Hooks run outside the module's service provider (the module may still be
 * disabled), so use host services only. Create Modules\<Name>\Hooks\InstallModule
 * to add setup logic; it is optional.
 */
class InstallModule implements ModuleHook
{
    public function handle(ModuleHookContext $context): void
    {
        $context->line('HelloWorld install hook completed.');
    }
}
