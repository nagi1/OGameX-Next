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
        // Enabled modules register their own queue names in
        // config('queue.module_queue_names') so they can own Horizon lanes without
        // editing the host enum; treat those as known here.
        $known = array_values(array_unique(array_merge(
            QueueName::values(),
            (array) config('queue.module_queue_names', []),
        )));

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

        $admin = $this->createStub(User::class);
        $admin->method('hasRole')->willReturn(true);
        $this->assertTrue(Gate::forUser($admin)->check('viewHorizon'));

        $player = $this->createStub(User::class);
        $player->method('hasRole')->willReturn(false);
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

    public function testHorizonSnapshotIsScheduledOnlyForTheRedisDriver(): void
    {
        $console = file_get_contents(base_path('routes/console.php'));
        $this->assertIsString($console);

        // The dashboard graphs read these snapshots, and the snapshot command needs
        // Horizon's Redis state, so the schedule must stay behind the driver guard.
        $this->assertStringContainsString("Schedule::command('horizon:snapshot')->everyFiveMinutes();", $console);
        $this->assertStringContainsString("if (config('queue.default') === 'redis')", $console);
    }

    public function testSupervisorKeepsTheHorizonMasterAliveDuringDeploys(): void
    {
        $supervisor = file_get_contents(base_path('docker/supervisor/horizon.conf'));
        $this->assertIsString($supervisor);

        $this->assertStringContainsString('command=php /var/www/artisan horizon', $supervisor);
        $this->assertStringContainsString('autostart=true', $supervisor);
        $this->assertStringContainsString('autorestart=true', $supervisor);
        $this->assertStringContainsString('stopsignal=TERM', $supervisor);
        $this->assertStringContainsString('user=www-data', $supervisor);

        $stopWait = $this->supervisorOption($supervisor, 'stopwaitsecs');
        $this->assertNotNull($stopWait, 'The Horizon supervisor must declare stopwaitsecs.');
        $this->assertGreaterThanOrEqual(
            (int) config('horizon.defaults.supervisor-fleet-arrivals-heavy.timeout'),
            $stopWait,
            'Stopping the container must give the master time to drain its workers instead of killing a running battle.'
        );
    }

    public function testQueueHealthcheckRecognisesBothWorkerBackends(): void
    {
        $healthcheck = base_path('docker/queue-healthcheck.sh');
        $this->assertFileExists($healthcheck);

        $script = file_get_contents($healthcheck);
        $this->assertIsString($script);

        // The probe must not assume one backend: supervisord runs either the Horizon
        // config or the generated database pool config.
        $this->assertStringContainsString('docker/supervisor/horizon.conf', $script);
        $this->assertStringContainsString('/tmp/queue-worker.conf', $script);
        $this->assertStringContainsString('RUNNING', $script);

        foreach (['docker-compose.yml', 'docker-compose.prod.yml'] as $compose) {
            $contents = file_get_contents(base_path($compose));
            $this->assertIsString($contents);
            $this->assertStringContainsString(
                'sh /var/www/docker/queue-healthcheck.sh',
                $contents,
                "{$compose} must probe the queue container so a stopped worker pool is visible."
            );
        }
    }

    public function testFastTerminationIsConfigurableAndGracefulByDefault(): void
    {
        $this->assertIsBool(
            config('horizon.fast_termination'),
            'fast_termination must be a boolean so Horizon reads it consistently.'
        );
        $this->assertFalse(
            config('horizon.fast_termination'),
            'Deploys must wait for in-flight fleet-arrival work unless HORIZON_FAST_TERMINATION is set.'
        );
    }

    private function supervisorOption(string $supervisor, string $option): int|null
    {
        $pattern = '/^'.preg_quote($option, '/').'=(\d+)$/m';

        if (preg_match($pattern, $supervisor, $matches) !== 1) {
            return null;
        }

        return (int) $matches[1];
    }
}
