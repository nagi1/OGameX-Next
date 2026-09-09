<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Event;
use OGame\Events\Game\FleetMissionArrived;
use OGame\GameMissions\TransportMission;
use OGame\GameObjects\Models\Units\UnitCollection;
use OGame\Models\Resources;
use OGame\Services\FleetMissionService;
use OGame\Services\ObjectService;
use Tests\FleetDispatchTestCase;

/**
 * Verify the fleet mission arrived event fires when a mission is processed.
 */
class DomainFleetMissionEventTest extends FleetDispatchTestCase
{
    protected int $missionType = 3;

    protected string $missionName = 'Transport';

    protected function basicSetup(): void
    {
        $this->planetSetObjectLevel('robot_factory', 2);
        $this->planetSetObjectLevel('shipyard', 1);
        $this->planetSetObjectLevel('research_lab', 1);
        $this->playerSetResearchLevel('energy_technology', 1);
        $this->playerSetResearchLevel('combustion_drive', 1);
        $this->planetAddUnit('small_cargo', 5);
        $this->planetAddResources(new Resources(5000, 5000, 100000, 0));
    }

    public function test_fleet_mission_arrived_event_is_dispatched(): void
    {
        $this->basicSetup();

        $unitCollection = new UnitCollection();
        $unitCollection->addUnit(ObjectService::getUnitObjectByMachineName('small_cargo'), 1);
        $this->sendMissionToSecondPlanet($unitCollection, new Resources(100, 0, 0, 0));

        $fleetMissionService = resolve(FleetMissionService::class, ['player' => $this->planetService->getPlayer()]);

        if ($this->secondPlanetService === null) {
            $this->fail('Second planet service is not initialized.');
        }

        $duration = $fleetMissionService->calculateFleetMissionDuration(
            $this->planetService,
            $this->secondPlanetService->getPlanetCoordinates(),
            $unitCollection,
            resolve(TransportMission::class),
        );

        $this->travel($duration + 1)->seconds();

        Event::fake();

        $this->get('/overview')->assertStatus(200);

        Event::assertDispatched(FleetMissionArrived::class, static fn (FleetMissionArrived $event): bool => $event->missionType === 3);
    }
}
