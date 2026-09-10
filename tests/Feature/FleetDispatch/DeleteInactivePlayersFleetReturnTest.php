<?php

namespace Tests\Feature\FleetDispatch;

use Illuminate\Support\Facades\Date;
use OGame\GameObjects\Models\Units\UnitCollection;
use OGame\Models\FleetMission;
use OGame\Models\Resources;
use OGame\Models\User;
use OGame\Services\FleetMissionService;
use OGame\Services\ObjectService;
use OGame\Services\SettingsService;
use RuntimeException;
use Tests\FleetDispatchTestCase;

/**
 * Regression test for inactive-account deletion while another player has a fleet in flight.
 */
class DeleteInactivePlayersFleetReturnTest extends FleetDispatchTestCase
{
    /**
     * @var int The mission type for the test (attack).
     */
    protected int $missionType = 1;

    /**
     * @var string The mission name for the test, displayed in UI.
     */
    protected string $missionName = 'Attack';

    /**
     * Reset feature settings after each test to avoid state leaking between tests.
     */
    protected function tearDown(): void
    {
        $settingsService = resolve(SettingsService::class);
        $settingsService->set('inactive_player_deletion_days', 0);
        $settingsService->set('attack_block_until', 0);
        parent::tearDown();
    }

    /**
     * Prepare the attacker planet so it can dispatch an attack fleet.
     *
     * @return void
     */
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

        // Add deuterium so the dispatch is not blocked by fuel capacity restrictions.
        $this->planetAddResources(new Resources(0, 0, 1000000, 0));
    }

    /**
     * An enemy fleet already in flight toward an inactive player's planet must turn around and
     * return home when that player and their target planet are permanently deleted mid-flight.
     */
    public function testIncomingEnemyFleetReturnsHomeWhenTargetPlayerDeleted(): void
    {
        $this->basicSetup();

        // Attacker (current player) sends an attack fleet toward another player's planet.
        $unitCollection = new UnitCollection();
        $unitCollection->addUnit(ObjectService::getUnitObjectByMachineName('light_fighter'), 1);
        $targetPlanet = $this->sendMissionToOtherPlayerCleanPlanet($unitCollection, new Resources(0, 0, 0, 0));
        $targetPlayer = $targetPlanet->getPlayer();
        if ($targetPlayer === null) {
            throw new RuntimeException('Target planet has no player.');
        }
        $targetPlayerId = $targetPlayer->getId();
        $attackerPlanetId = $this->planetService->getPlanetId();

        // Capture the outgoing attack mission before it arrives.
        $fleetMissionService = resolve(FleetMissionService::class, ['player' => $this->planetService->getPlayer()]);
        $mission = $fleetMissionService->getActiveFleetMissionsForCurrentPlayer()->first();
        $this->assertNotNull($mission, 'Attack mission should exist');
        $missionId = $mission->id;

        // Make the target player inactive and remove the account while the fleet is in flight.
        // Permanent planet deletion recalls incoming fleets before the target planet is removed.
        resolve(SettingsService::class)->set('inactive_player_deletion_days', 35);
        $targetUser = User::findOrFail($targetPlayerId);
        $targetUser->time = (string) Date::now()->subDays(40)->timestamp;
        $targetUser->save();

        // @phpstan-ignore-next-line
        $this->artisan('ogamex:scheduler:delete-inactive-players')->assertSuccessful();

        $this->assertDatabaseMissing('users', ['id' => $targetPlayerId]);
        $this->assertDatabaseMissing('planets', ['id' => $targetPlanet->getPlanetId()]);

        // The account deletion recalls the outgoing fleet immediately. The canceled parent keeps
        // its audit trail while the new return mission targets the attacker's home planet.
        $originalMission = FleetMission::findOrFail($missionId);
        $this->assertSame(1, (int) $originalMission->canceled);
        $this->assertSame(1, (int) $originalMission->processed);

        $returnMission = FleetMission::where('parent_id', $missionId)->where('canceled', 0)->first();
        $this->assertNotNull($returnMission, 'A return mission should be created for the incoming fleet');
        $this->assertSame($attackerPlanetId, $returnMission->planet_id_to);
        $this->assertGreaterThanOrEqual(Date::now()->timestamp, $returnMission->time_arrival);
    }
}
