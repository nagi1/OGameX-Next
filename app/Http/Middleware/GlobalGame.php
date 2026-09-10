<?php

namespace OGame\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OGame\Factories\PlanetServiceFactory;
use OGame\Services\BuildingQueueService;
use OGame\Services\DarkMatterService;
use OGame\Services\FleetMissionService;
use OGame\Services\PlanetMoveService;
use OGame\Services\PlayerGameStateService;
use OGame\Services\PlayerService;
use OGame\Services\ResearchQueueService;
use OGame\Services\SettingsService;
use OGame\Services\UnitQueueService;
use Throwable;

class GlobalGame
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return mixed
     * @throws Throwable
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if (Auth::check()) {
            $user = $request->user();
            if ($user === null) {
                return $next($request);
            }

            $currentPlanetId = $request->query('cp');
            $player = resolve(PlayerGameStateService::class)->advance(
                $user->id,
                $currentPlanetId === null || $currentPlanetId === '' ? null : (int) $currentPlanetId,
            );

            /** @var PlayerService $player */
            app()->instance(PlayerService::class, $player);

            // Process any due planet moves.
            $planetMoveService = resolve(PlanetMoveService::class);
            $planetMoveService->processDueMoves(
                resolve(PlanetServiceFactory::class),
                resolve(DarkMatterService::class),
                resolve(SettingsService::class),
                resolve(BuildingQueueService::class),
                resolve(ResearchQueueService::class),
                resolve(UnitQueueService::class),
                resolve(FleetMissionService::class),
            );

            // Share planet_move_in_progress for all views.
            $activeMove = $planetMoveService->getActiveMoveForPlanet($player->planets->current());
            view()->share('planet_move_in_progress', $activeMove !== null);
        }

        return $next($request);
    }
}
