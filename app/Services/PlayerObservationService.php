<?php

namespace OGame\Services;

use OGame\Factories\PlayerServiceFactory;

/** Read-only, actor-scoped state for module policies. */
class PlayerObservationService
{
    public function __construct(private PlayerServiceFactory $playerServiceFactory)
    {
    }

    /** @return array{player_id:int, observed_at:int, planets:array<int, array{id:int, resources:array<string, float|int>}>} */
    public function ownedState(int $playerId): array
    {
        $player = $this->playerServiceFactory->make($playerId, true);
        $planets = [];
        foreach ($player->planets->all() as $planet) {
            $planets[] = [
                'id' => $planet->getPlanetId(),
                'resources' => [
                    'metal' => $planet->metal()->get(),
                    'crystal' => $planet->crystal()->get(),
                    'deuterium' => $planet->deuterium()->get(),
                ],
            ];
        }

        return ['player_id' => $player->getId(), 'observed_at' => now()->timestamp, 'planets' => $planets];
    }
}
