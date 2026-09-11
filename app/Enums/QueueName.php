<?php

namespace OGame\Enums;

/**
 * Enum that represents the queue names used by the application.
 *
 * Queue names are defined here so that dispatch sites, the Horizon supervisor
 * configuration and the Docker worker commands all reference the same source of
 * truth instead of repeating string literals.
 */
enum QueueName: string
{
    /**
     * General-purpose lane. Jobs that do not need their own worker pool are
     * dispatched here.
     */
    case Default = 'default';

    /**
     * Light fleet-arrival lane. Transports, deployments, returns and other
     * arrivals that cannot run a large battle are processed here, so a storm of
     * battles never blocks them.
     */
    case FleetArrivals = 'fleet-arrivals';

    /**
     * Heavy fleet-arrival lane. Outbound combat arrivals that can run a large
     * fleet battle are routed here and handled by a dedicated worker pool.
     */
    case FleetArrivalsHeavy = 'fleet-arrivals-heavy';

    /**
     * Get the backing values of every queue name.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $queueName): string => $queueName->value, self::cases());
    }
}
