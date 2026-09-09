<?php

namespace OGame\Events\Game;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a research queue item has completed.
 */
class ResearchCompleted
{
    use Dispatchable;

    public function __construct(
        public int $playerId,
        public string $machineName,
        public int $level,
    ) {
    }
}
