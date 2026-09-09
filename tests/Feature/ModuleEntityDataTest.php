<?php

namespace Tests\Feature;

use OGame\Models\Planet;
use OGame\Models\User;
use Tests\IsolatedAccountTestCase;

/**
 * Verify the module-namespaced entity data store used by modules.
 */
class ModuleEntityDataTest extends IsolatedAccountTestCase
{
    private function currentUser(): User
    {
        return User::findOrFail($this->currentUserId);
    }

    private function currentPlanet(): Planet
    {
        return Planet::findOrFail($this->currentPlanetId);
    }

    public function test_set_and_get_scalar(): void
    {
        $user = $this->currentUser();
        $user->moduleData('myfeature')->set('rank', 5);

        $this->assertSame(5, $user->moduleData('myfeature')->get('rank'));
    }

    public function test_get_returns_null_when_key_missing(): void
    {
        $user = $this->currentUser();

        $this->assertNull($user->moduleData('myfeature')->get('missing'));
    }

    public function test_set_overwrites_existing_value(): void
    {
        $user = $this->currentUser();
        $user->moduleData('myfeature')->set('rank', 5);
        $user->moduleData('myfeature')->set('rank', 'ten');

        $this->assertSame('ten', $user->moduleData('myfeature')->get('rank'));
    }

    public function test_forget_removes_key(): void
    {
        $user = $this->currentUser();
        $user->moduleData('myfeature')->set('rank', 5);
        $user->moduleData('myfeature')->forget('rank');

        $this->assertNull($user->moduleData('myfeature')->get('rank'));
    }

    public function test_modules_are_isolated(): void
    {
        $user = $this->currentUser();
        $user->moduleData('alpha')->set('key', 'a');
        $user->moduleData('beta')->set('key', 'b');

        $this->assertSame('a', $user->moduleData('alpha')->get('key'));
        $this->assertSame('b', $user->moduleData('beta')->get('key'));
    }

    public function test_entities_are_isolated(): void
    {
        $user = $this->currentUser();
        $planet = $this->currentPlanet();

        $user->moduleData('myfeature')->set('key', 'user');
        $planet->moduleData('myfeature')->set('key', 'planet');

        $this->assertSame('user', $user->moduleData('myfeature')->get('key'));
        $this->assertSame('planet', $planet->moduleData('myfeature')->get('key'));
    }

    public function test_array_values_round_trip(): void
    {
        $user = $this->currentUser();
        $user->moduleData('myfeature')->set('state', ['a' => 1, 'b' => [2, 3]]);

        $this->assertSame(['a' => 1, 'b' => [2, 3]], $user->moduleData('myfeature')->get('state'));
    }

    public function test_all_returns_only_this_module_and_entity(): void
    {
        $user = $this->currentUser();
        $planet = $this->currentPlanet();

        $user->moduleData('myfeature')->set('one', 1);
        $user->moduleData('myfeature')->set('two', 2);
        $user->moduleData('other')->set('three', 3);
        $planet->moduleData('myfeature')->set('four', 4);

        $this->assertSame(['one' => 1, 'two' => 2], $user->moduleData('myfeature')->all());
    }

    public function test_planet_uses_planet_entity_type(): void
    {
        $planet = $this->currentPlanet();
        $planet->moduleData('myfeature')->set('key', 'value');

        $this->assertSame('value', $planet->moduleData('myfeature')->get('key'));
    }
}
