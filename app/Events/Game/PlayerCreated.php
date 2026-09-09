<?php

namespace OGame\Events\Game;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a player account and its initial data have been created.
 */
class PlayerCreated
{
    use Dispatchable;

    public function __construct(
        public int $playerId,
    ) {
    }
}
