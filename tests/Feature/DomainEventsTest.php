<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Event;
use OGame\Events\Game\BuildingCompleted;
use OGame\Events\Game\PlanetCreated;
use OGame\Events\Game\PlayerCreated;
use OGame\Events\Game\ResearchCompleted;
use OGame\Factories\PlanetServiceFactory;
use OGame\Factories\PlayerServiceFactory;
use OGame\Models\Enums\PlanetType;
use OGame\Models\Resources;
use OGame\Services\SettingsService;
use Tests\IsolatedAccountTestCase;

/**
 * Verify the core gameplay domain events fire from their real code paths.
 */
class DomainEventsTest extends IsolatedAccountTestCase
{
    public function test_player_created_event_is_dispatched(): void
    {
        Event::fake();

        $user = $this->createUser();

        Event::assertDispatched(PlayerCreated::class, static fn (PlayerCreated $event): bool => $event->playerId === $user->id);
    }

    public function test_planet_created_event_is_dispatched(): void
    {
        $player = resolve(PlayerServiceFactory::class)->make($this->currentUserId);
        $coordinate = $this->getSafeEmptyCoordinate($this->planetService->getPlanetCoordinates());

        Event::fake();

        $planet = resolve(PlanetServiceFactory::class)->createAdditionalPlanetForPlayer($player, $coordinate);

        Event::assertDispatched(PlanetCreated::class, fn (PlanetCreated $event): bool =>
            $event->planetId === $planet->getPlanetId()
            && $event->playerId === $this->currentUserId
            && $event->planetType === PlanetType::Planet->value);
    }

    public function test_building_completed_event_is_dispatched(): void
    {
        resolve(SettingsService::class)->set('economy_speed', 8);

        $this->addResourceBuildRequest('metal_mine');

        $this->travel(1)->minutes();

        Event::fake();

        $this->get('/resources')->assertStatus(200);

        Event::assertDispatched(BuildingCompleted::class, fn (BuildingCompleted $event): bool =>
            $event->planetId === $this->currentPlanetId
            && $event->machineName === 'metal_mine'
            && $event->level === 1);
    }

    public function test_research_completed_event_is_dispatched(): void
    {
        resolve(SettingsService::class)->set('economy_speed', 8);
        resolve(SettingsService::class)->set('research_speed', 2);

        $this->planetAddResources(new Resources(0, 800, 400, 0));
        $this->planetSetObjectLevel('research_lab', 1);

        $this->addResearchBuildRequest('energy_technology');

        $this->travel(10)->minutes();

        Event::fake();

        $this->get('/research')->assertStatus(200);

        Event::assertDispatched(ResearchCompleted::class, fn (ResearchCompleted $event): bool =>
            $event->playerId === $this->currentUserId
            && $event->machineName === 'energy_technology'
            && $event->level === 1);
    }
}
