<?php

namespace Tests\Feature;

use OGame\Services\ObjectService;
use Tests\IsolatedAccountTestCase;

class FacilitiesMenuShortcutTest extends IsolatedAccountTestCase
{
    public function test_facilities_menu_shortcut_opens_space_dock_on_planet(): void
    {
        $spaceDock = ObjectService::getObjectByMachineName('space_dock');
        $this->planetService->setObjectLevel($spaceDock->id, 0, true);

        $response = $this->get(route('overview.index'));

        $response->assertStatus(200);

        $spaceDockUrl = route('facilities.index', ['openSpaceDock' => 1]);

        $response->assertSee(
            'href="' . $spaceDockUrl . '"',
            false
        );
        $response->assertSee('class="menuImage station"></div>', false);
    }

    public function test_facilities_menu_shortcut_is_highlighted_when_space_dock_exists(): void
    {
        $spaceDock = ObjectService::getObjectByMachineName('space_dock');
        $this->planetService->setObjectLevel($spaceDock->id, 1, true);

        $response = $this->get(route('overview.index'));

        $response->assertStatus(200);
        $response->assertSee('class="menuImage station highlighted"></div>', false);
    }

    public function test_facilities_menu_shortcut_is_active_on_facilities_page(): void
    {
        $response = $this->get(route('facilities.index'));

        $response->assertStatus(200);
        $response->assertSee('class="menuImage station active"></div>', false);
    }
}
