<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Event;
use OGame\Events\Game\BattleResolved;
use OGame\GameMissions\AttackMission;
use OGame\GameObjects\Models\Units\UnitCollection;
use OGame\Models\Resources;
use OGame\Services\FleetMissionService;
use OGame\Services\ObjectService;
use OGame\Services\SettingsService;
use Tests\FleetDispatchTestCase;

/**
 * Verify the battle resolved event fires when combat is simulated.
 */
class DomainBattleEventTest extends FleetDispatchTestCase
{
    protected int $missionType = 1;

    protected string $missionName = 'Attack';

    protected function tearDown(): void
    {
        resolve(SettingsService::class)->set('attack_block_until', 0);
        parent::tearDown();
    }

    protected function basicSetup(): void
    {
        $this->planetAddUnit('light_fighter', 5);
        $this->playerSetResearchLevel('computer_technology', objectLevel: 1);

        $settingsService = resolve(SettingsService::class);
        $settingsService->set('economy_speed', 8);
        $settingsService->set('fleet_speed_war', 1);
        $settingsService->set('fleet_speed_holding', 1);
        $settingsService->set('fleet_speed_peaceful', 1);
        $settingsService->set('attack_block_until', 0);

        $this->planetAddResources(new Resources(0, 0, 1000000, 0));
    }

    public function test_battle_resolved_event_is_dispatched(): void
    {
        $this->basicSetup();

        $unitCollection = new UnitCollection();
        $unitCollection->addUnit(ObjectService::getUnitObjectByMachineName('light_fighter'), 1);
        $foreignPlanet = $this->sendMissionToOtherPlayerPlanet($unitCollection, new Resources(0, 0, 0, 0));

        $fleetMissionService = resolve(FleetMissionService::class, ['player' => $this->planetService->getPlayer()]);

        $duration = $fleetMissionService->calculateFleetMissionDuration(
            $this->planetService,
            $foreignPlanet->getPlanetCoordinates(),
            $unitCollection,
            resolve(AttackMission::class),
        );

        $this->travel($duration + 1)->seconds();

        $attackerPlayer = $this->planetService->getPlayer();
        $defenderPlayer = $foreignPlanet->getPlayer();
        if ($attackerPlayer === null || $defenderPlayer === null) {
            $this->fail('Attacker or defender player is null.');
        }

        Event::fake();

        $this->get('/overview')->assertStatus(200);

        Event::assertDispatched(BattleResolved::class, static fn (BattleResolved $event): bool =>
            $event->defenderPlayerId === $defenderPlayer->getId()
            && in_array($attackerPlayer->getId(), $event->attackerPlayerIds, true));
    }
}
