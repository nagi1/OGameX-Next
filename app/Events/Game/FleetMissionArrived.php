<?php

namespace OGame\Events\Game;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a fleet mission has been processed at its destination.
 *
 * Return missions are also emitted, distinguishable by their parent id.
 */
class FleetMissionArrived
{
    use Dispatchable;

    public function __construct(
        public int $missionId,
        public int $missionType,
        public int|null $parentId,
    ) {
    }
}
