<?php

namespace OGame\Events\Game;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a planet or moon has been created.
 */
class PlanetCreated
{
    use Dispatchable;

    public function __construct(
        public int $planetId,
        public int $playerId,
        public int $planetType,
    ) {
    }
}
