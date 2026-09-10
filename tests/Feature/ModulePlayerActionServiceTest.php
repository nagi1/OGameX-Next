<?php

namespace Tests\Feature;

use OGame\Models\BuildingQueue;
use OGame\Models\Resources;
use OGame\Services\ModulePlayerActionService;
use OGame\Services\ObjectService;
use Tests\IsolatedAccountTestCase;

class ModulePlayerActionServiceTest extends IsolatedAccountTestCase
{
    public function test_it_queues_a_legal_building_for_its_owner(): void
    {
        $this->planetAddResources(new Resources(1_000_000, 1_000_000, 1_000_000));
        $building = ObjectService::getObjectByMachineName('metal_mine');

        $result = resolve(ModulePlayerActionService::class)->queueBuilding(
            $this->currentUserId,
            $this->currentPlanetId,
            $building->id,
        );

        $this->assertTrue($result->successful);
        $this->assertNotNull($result->queueId);
        $this->assertDatabaseHas('building_queues', [
            'id' => $result->queueId,
            'planet_id' => $this->currentPlanetId,
            'object_id' => $building->id,
        ]);
    }

    public function test_it_rejects_a_planet_not_owned_by_the_actor(): void
    {
        $building = ObjectService::getObjectByMachineName('metal_mine');
        $otherUser = $this->createUser();
        $otherPlanetId = resolve(\OGame\Factories\PlayerServiceFactory::class)
            ->make($otherUser->id, true)
            ->planets
            ->current()
            ->getPlanetId();

        $result = resolve(ModulePlayerActionService::class)->queueBuilding(
            $this->currentUserId,
            $otherPlanetId,
            $building->id,
        );

        $this->assertFalse($result->successful);
        $this->assertSame('planet_not_owned', $result->reason);
        $this->assertDatabaseMissing('building_queues', ['planet_id' => $otherPlanetId]);
    }

    public function test_invalid_buildings_do_not_create_a_queue_item(): void
    {
        $ship = ObjectService::getObjectByMachineName('small_cargo');

        $result = resolve(ModulePlayerActionService::class)->queueBuilding(
            $this->currentUserId,
            $this->currentPlanetId,
            $ship->id,
        );

        $this->assertFalse($result->successful);
        $this->assertSame('not_a_building', $result->reason);
        $this->assertSame(0, BuildingQueue::query()->where('planet_id', $this->currentPlanetId)->count());
    }
}
