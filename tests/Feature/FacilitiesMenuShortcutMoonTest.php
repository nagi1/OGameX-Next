<?php

namespace Tests\Feature;

use OGame\Services\ObjectService;
use Tests\MoonTestCase;

class FacilitiesMenuShortcutMoonTest extends MoonTestCase
{
    public function test_moon_without_jump_gate_keeps_station_icon_non_clickable(): void
    {
        $response = $this->get(route('overview.index'));

        $response->assertStatus(200);
        $response->assertSee('class="menuImage station"></div>', false);
        $response->assertDontSee('href="' . route('jumpgate.index') . '"', false);
    }

    public function test_moon_with_jump_gate_keeps_jump_gate_shortcut(): void
    {
        $jumpGate = ObjectService::getObjectByMachineName('jump_gate');
        $this->moonService->setObjectLevel($jumpGate->id, 1, true);

        $response = $this->get(route('overview.index'));

        $response->assertStatus(200);
        $response->assertSee('href="' . route('jumpgate.index') . '"', false);
        $response->assertSee('class="menuImage station highlighted ipiHintable"', false);
    }
}
