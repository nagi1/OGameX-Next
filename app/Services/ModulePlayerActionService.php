<?php

namespace OGame\Services;

use Exception;
use OGame\Factories\PlanetServiceFactory;
use OGame\GameObjects\Models\Enums\GameObjectType;
use OGame\Models\BuildingQueue;
use OGame\Models\Planet;

/**
 * The narrow, validated game-action boundary available to installed modules.
 *
 * A module supplies intent only. This service resolves a fresh actor and
 * applies the same building validation and queue service used by the UI.
 */
class ModulePlayerActionService
{
    public function __construct(
        private PlayerGameStateService $playerGameStateService,
        private PlanetServiceFactory $planetServiceFactory,
        private BuildingQueueService $buildingQueueService,
    ) {
    }

    public function queueBuilding(int $playerId, int $planetId, int $buildingId): ModulePlayerActionResult
    {
        $ownedPlanet = Planet::query()
            ->whereKey($planetId)
            ->where('user_id', $playerId)
            ->exists();

        if (!$ownedPlanet) {
            return ModulePlayerActionResult::rejected('planet_not_owned');
        }

        try {
            $player = $this->playerGameStateService->advance($playerId, $planetId);

            if ($player->isInVacationMode()) {
                return ModulePlayerActionResult::rejected('vacation_mode');
            }

            $planet = $this->planetServiceFactory->makeForPlayer($player, $planetId, false);
            $building = ObjectService::getObjectById($buildingId);

            if ($building->type !== GameObjectType::Building && $building->type !== GameObjectType::Station) {
                return ModulePlayerActionResult::rejected('not_a_building');
            }

            if (in_array($building->machine_name, ['shipyard', 'nano_factory'], true) && $player->isBuildingShipsOrDefense()) {
                return ModulePlayerActionResult::rejected('shipyard_busy');
            }

            $this->buildingQueueService->add($planet, $buildingId);

            $queueId = BuildingQueue::query()
                ->where('planet_id', $planetId)
                ->where('object_id', $buildingId)
                ->latest('id')
                ->value('id');

            if ($queueId === null) {
                return ModulePlayerActionResult::rejected('queue_not_created');
            }

            return ModulePlayerActionResult::succeeded($queueId);
        } catch (Exception $exception) {
            return ModulePlayerActionResult::rejected($exception->getMessage());
        }
    }
}
