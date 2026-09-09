<?php

namespace OGame\Events\Game;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a battle has been resolved, before the result is returned to the
 * mission that started it. Carries only identifiers; listeners can query the
 * battle report or current state if they need more detail.
 */
class BattleResolved
{
    use Dispatchable;

    /**
     * @param array<int, int> $attackerPlayerIds
     */
    public function __construct(
        public array $attackerPlayerIds,
        public int $defenderPlayerId,
        public int $defenderPlanetId,
    ) {
    }
}
