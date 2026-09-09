<?php

namespace OGame\Events\Game;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a building or station queue item has completed.
 */
class BuildingCompleted
{
    use Dispatchable;

    public function __construct(
        public int $planetId,
        public string $machineName,
        public int $level,
    ) {
    }
}
