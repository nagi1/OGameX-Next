<?php

namespace OGame\Modules;

use Closure;
use Nwidart\Modules\Module;

/**
 * Context passed to a module lifecycle hook.
 *
 * Hooks run outside the module's service provider (the module may be disabled), so they
 * should use host services only, and they report progress through line() instead of
 * depending on the console.
 */
final class ModuleHookContext
{
    /** @param Closure(string): void $report */
    public function __construct(
        public readonly Module $module,
        private readonly Closure $report,
    ) {
    }

    public function line(string $message): void
    {
        ($this->report)($message);
    }
}
