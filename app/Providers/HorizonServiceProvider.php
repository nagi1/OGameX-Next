<?php

namespace OGame\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\HorizonApplicationServiceProvider;
use OGame\Models\User;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Register the Horizon gate.
     *
     * The dashboard is registered under the admin panel's middleware group, so
     * it is restricted to the same users: those with the "admin" role. This
     * matches the middleware in app/Http/Middleware/Admin.php.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', static function (User|null $user = null): bool {
            return $user?->hasRole('admin') ?? false;
        });
    }
}
