<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Gate;
use OGame\Enums\QueueName;
use OGame\Jobs\ProcessFleetArrival;
use OGame\Models\User;
use Tests\TestCase;

/**
 * Guards the Horizon configuration.
 *
 * config/horizon.php is the single place where the queue names from
 * app/Enums/QueueName.php become worker pools. These tests keep the dashboard
 * behind the admin gate and make sure the fleet-arrival pools retain the same
 * timing and memory guarantees as docker/supervisor/queue-worker.conf, so the two
 * queue backends cannot silently drift apart.
 */
class HorizonConfigTest extends TestCase
{
    /**
     * Options for every Horizon supervisor, keyed by supervisor name.
     *
     * @return array<string, array<string, mixed>>
     */
    private function supervisors(): array
    {
        /** @var array<string, array<string, mixed>> $supervisors */
        $supervisors = config('horizon.defaults', []);

        return $supervisors;
    }

    /**
     * Queue names assigned to every Horizon supervisor, keyed by supervisor name.
     *
     * @return array<string, array<int, string>>
     */
    private function supervisorQueues(): array
    {
        $queues = [];

        foreach ($this->supervisors() as $supervisor => $options) {
            $assigned = $options['queue'] ?? [];

            $queues[$supervisor] = is_array($assigned)
                ? array_values(array_map(static fn (mixed $queue): string => (string) $queue, $assigned))
                : [];
        }

        return $queues;
    }

    /**
     * Options for every Horizon environment, keyed by environment name and then by
     * supervisor name. The "*" key is the wildcard fallback for unlisted environments.
     *
     * @return array<string, array<string, array<string, mixed>>>
     */
    private function environments(): array
    {
        /** @var array<string, array<string, array<string, mixed>>> $environments */
        $environments = config('horizon.environments', []);

        return $environments;
    }

    /**
     * The maxProcesses value for one supervisor in one environment, or null when the
     * environment or supervisor is missing.
     */
    private function poolSize(string $environment, string $supervisor): mixed
    {
        return $this->environments()[$environment][$supervisor]['maxProcesses'] ?? null;
    }

    /**
     * The queue names handled by the fleet-arrival lanes.
     *
     * @return array<int, string>
     */
    private function fleetQueues(): array
    {
        return [QueueName::FleetArrivals->value, QueueName::FleetArrivalsHeavy->value];
    }

    public function testSupervisorsOnlyUseQueueNamesFromTheEnum(): void
    {
        $known = QueueName::values();

        foreach ($this->supervisorQueues() as $supervisor => $queues) {
            $this->assertNotEmpty($queues, "Horizon supervisor '{$supervisor}' must define at least one queue.");

            foreach ($queues as $queue) {
                $this->assertContains(
                    $queue,
                    $known,
                    "Horizon supervisor '{$supervisor}' uses unknown queue '{$queue}'. Add it to OGame\\Enums\\QueueName."
                );
            }
        }
    }

    public function testEveryQueueNameIsDrainedByASupervisor(): void
    {
        $assigned = [];

        foreach ($this->supervisorQueues() as $queues) {
            $assigned = array_merge($assigned, $queues);
        }

        foreach (QueueName::cases() as $queueName) {
            $this->assertContains(
                $queueName->value,
                $assigned,
                "Queue '{$queueName->value}' is not assigned to any Horizon supervisor."
            );
        }
    }

    public function testFleetSupervisorsTimeoutClearsTheJobTimeoutAndStaysUnderRetryAfter(): void
    {
        $jobTimeout = (new ProcessFleetArrival(0))->timeout;
        $retryAfter = config('queue.connections.redis.retry_after');

        $this->assertIsInt($retryAfter, 'The redis queue connection must define retry_after.');

        foreach ($this->supervisorQueues() as $supervisor => $queues) {
            if (array_intersect($queues, $this->fleetQueues()) === []) {
                continue;
            }

            $timeout = $this->supervisors()[$supervisor]['timeout'] ?? null;

            $this->assertIsInt($timeout, "Horizon supervisor '{$supervisor}' must set an integer timeout.");

            // Horizon force-kills "hanging" workers at the supervisor timeout while
            // auto-balancing, so it has to stay above the job's own timeout...
            $this->assertGreaterThan(
                $jobTimeout,
                $timeout,
                "Horizon supervisor '{$supervisor}' timeout ({$timeout}s) must exceed ProcessFleetArrival::\$timeout ({$jobTimeout}s), "
                . 'or Horizon can kill a battle mid-run while scaling down.'
            );

            // ...and below retry_after, or the job can be handed to a second worker.
            $this->assertLessThan(
                $retryAfter,
                $timeout,
                "Horizon supervisor '{$supervisor}' timeout ({$timeout}s) must stay below the redis retry_after ({$retryAfter}s), "
                . 'or a long battle job is re-dispatched to a second worker while it is still running.'
            );
        }
    }

    public function testFleetSupervisorsRecycleOnMemory(): void
    {
        foreach ($this->supervisorQueues() as $supervisor => $queues) {
            if (array_intersect($queues, $this->fleetQueues()) === []) {
                continue;
            }

            $memory = $this->supervisors()[$supervisor]['memory'] ?? null;

            $this->assertIsInt($memory, "Horizon supervisor '{$supervisor}' must set a memory limit.");
            $this->assertGreaterThan(
                0,
                $memory,
                "Horizon supervisor '{$supervisor}' must recycle its workers on memory."
            );
        }
    }

    public function testEverySupervisorCanReserveItsMinimumProcesses(): void
    {
        // Check the merged config Horizon actually deploys: the environment block is
        // applied on top of the shared defaults.
        foreach ($this->environments() as $environment => $overrides) {
            foreach ($this->supervisors() as $supervisor => $defaults) {
                $options = array_replace_recursive($defaults, $overrides[$supervisor] ?? []);
                $queues = is_array($options['queue'] ?? null) ? $options['queue'] : [];
                $minProcesses = $options['minProcesses'] ?? null;
                $maxProcesses = $options['maxProcesses'] ?? null;

                $this->assertIsInt($minProcesses, "'{$environment}.{$supervisor}' must set minProcesses.");
                $this->assertGreaterThanOrEqual(
                    1,
                    $minProcesses,
                    "'{$environment}.{$supervisor}' minProcesses must be >= 1."
                );
                $this->assertIsInt($maxProcesses, "'{$environment}.{$supervisor}' must set maxProcesses.");

                // Under the "auto" strategy minProcesses applies per queue, so maxProcesses
                // must cover minProcesses x the number of queues the supervisor watches.
                $required = $minProcesses * count($queues);
                $this->assertGreaterThanOrEqual(
                    $required,
                    $maxProcesses,
                    "'{$environment}.{$supervisor}' maxProcesses ({$maxProcesses}) must cover minProcesses ({$minProcesses}) x "
                    . "its {$required} required process slots."
                );
            }
        }
    }

    public function testEveryEnvironmentProvisionsEverySupervisor(): void
    {
        $expectedSupervisors = array_keys($this->supervisors());
        $this->assertNotEmpty($expectedSupervisors);

        $environments = $this->environments();
        $this->assertNotEmpty($environments);

        foreach ($environments as $environment => $supervisors) {
            $this->assertEqualsCanonicalizing(
                $expectedSupervisors,
                array_keys($supervisors),
                "Horizon environment '{$environment}' must provision every supervisor defined in horizon.defaults."
            );
        }
    }

    public function testSupportsLocalStagingProductionAndAFallback(): void
    {
        $environments = $this->environments();

        foreach (['production', 'staging', 'local', '*'] as $environment) {
            $this->assertArrayHasKey(
                $environment,
                $environments,
                "config/horizon.php must define the '{$environment}' environment (\"*\" is the fallback for any other APP_ENV)."
            );
        }
    }

    public function testProductionScalesAtLeastAsLargeAsLocal(): void
    {
        // Every pool can be overridden from .env, so assert the relationship rather than
        // exact numbers: the production defaults must never be smaller than staging's,
        // and staging's never smaller than local's.
        foreach (array_keys($this->supervisors()) as $supervisor) {
            $local = $this->poolSize('local', $supervisor);
            $staging = $this->poolSize('staging', $supervisor);
            $production = $this->poolSize('production', $supervisor);

            $this->assertIsInt($local, "Horizon supervisor '{$supervisor}' must define a local maxProcesses.");
            $this->assertIsInt($staging, "Horizon supervisor '{$supervisor}' must define a staging maxProcesses.");
            $this->assertIsInt($production, "Horizon supervisor '{$supervisor}' must define a production maxProcesses.");

            $this->assertGreaterThanOrEqual($local, $staging, "Staging must not run fewer '{$supervisor}' processes than local.");
            $this->assertGreaterThanOrEqual($staging, $production, "Production must not run fewer '{$supervisor}' processes than staging.");
        }
    }

    public function testEverySupervisorHasAtLeastOneProcess(): void
    {
        foreach ($this->environments() as $environment => $supervisors) {
            foreach ($supervisors as $supervisor => $options) {
                $this->assertGreaterThanOrEqual(
                    1,
                    $options['maxProcesses'],
                    "Horizon supervisor '{$supervisor}' in '{$environment}' must have maxProcesses >= 1, or Horizon skips it."
                );
            }
        }
    }

    public function testDashboardIsRestrictedToAdmins(): void
    {
        $middleware = config('horizon.middleware', []);
        $this->assertIsArray($middleware);
        $this->assertContains('web', $middleware);
        $this->assertContains('auth', $middleware);
        $this->assertContains('admin', $middleware);

        $path = config('horizon.path');
        $this->assertIsString($path);
        $this->assertStringStartsWith(
            'admin/',
            $path,
            'The Horizon dashboard must live under the admin panel URL space.'
        );

        $admin = $this->createMock(User::class);
        $admin->method('hasRole')->with('admin')->willReturn(true);
        $this->assertTrue(Gate::forUser($admin)->check('viewHorizon'));

        $player = $this->createMock(User::class);
        $player->method('hasRole')->with('admin')->willReturn(false);
        $this->assertFalse(Gate::forUser($player)->check('viewHorizon'));
    }

    public function testQueueContainerPicksTheWorkerBackendFromTheDriver(): void
    {
        $entrypoint = file_get_contents(base_path('docker/entrypoint.sh'));
        $this->assertIsString($entrypoint);

        // One queue container serves both backends: Horizon when the driver is redis,
        // the database pools otherwise. There is deliberately no separate Horizon
        // service or container role, so operators never have to pick one.
        $redisCheck = strpos($entrypoint, '"$queue_connection" = "redis"');
        $horizonConf = strpos($entrypoint, 'docker/supervisor/horizon.conf');

        $this->assertIsInt($redisCheck, 'The queue entrypoint must compare the configured driver to redis.');
        $this->assertIsInt($horizonConf, 'The queue entrypoint must start Horizon.');
        $this->assertLessThan(
            $horizonConf,
            $redisCheck,
            'Horizon must be started from the redis branch, not unconditionally.'
        );
        $this->assertStringNotContainsString(
            '"$role" = "horizon"',
            $entrypoint,
            'Horizon must not need its own container role; the queue role selects it from the driver.'
        );
    }
}
