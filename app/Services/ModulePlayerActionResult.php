<?php

namespace OGame\Services;

/**
 * Transport-neutral result for an action requested by an installed module.
 */
readonly class ModulePlayerActionResult
{
    private function __construct(
        public bool $successful,
        public string $reason,
        public int|null $queueId = null,
    ) {
    }

    public static function succeeded(int $queueId): self
    {
        return new self(true, 'queued', $queueId);
    }

    public static function rejected(string $reason): self
    {
        return new self(false, $reason);
    }
}
