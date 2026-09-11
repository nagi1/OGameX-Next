<?php

use Illuminate\Support\Str;
use OGame\Enums\QueueName;

/*
|--------------------------------------------------------------------------
| Shared Worker Tunables
|--------------------------------------------------------------------------
|
| Read once here and reused by every supervisor below, so the numbers live in one
| place instead of being repeated as bare literals. Each is overridable from .env;
| the fallback is used when the variable is unset.
|
*/

// General-purpose lane: small, quick jobs. These are Horizon's own defaults, named so
// they sit alongside the fleet lane values below.
$generalMemory = (int) env('HORIZON_DEFAULT_MEMORY', 128);
$generalTimeout = (int) env('HORIZON_DEFAULT_TIMEOUT', 60);

// Fleet-arrival lanes run battles, so they share a larger memory ceiling, a longer
// timeout and a snappier poll interval.
//
// ProcessFleetArrival pins a 600s job-level timeout, so Horizon's supervisor timeout
// must be GREATER than that: during auto-balancing Horizon force-kills "hanging"
// workers at the supervisor timeout and would otherwise kill a battle mid-run. It must
// also stay below the redis retry_after in config/queue.php (660s), or the job can be
// handed to a second worker while the first is still running. The 900MB ceiling keeps a
// battle worker below the 1024M PHP memory limit.
$fleetMemory = (int) env('HORIZON_FLEET_MEMORY', 900);
$fleetTimeout = (int) env('HORIZON_FLEET_TIMEOUT', 630);

// Delayed arrivals are latency sensitive, so poll as often as the database worker does
// (docker/supervisor/queue-worker.conf runs with --sleep=0.5) rather than Horizon's 3s.
$fleetSleep = (float) env('HORIZON_FLEET_SLEEP', 0.5);

// Smallest workable pools, shared by the local and fallback environments: one general
// worker, two light and three heavy fleet-arrival workers.
$smallPools = [
    'supervisor-default' => [
        'maxProcesses' => (int) env('HORIZON_DEFAULT_MAX_PROCESSES', 1),
    ],
    'supervisor-fleet-arrivals-light' => [
        'maxProcesses' => (int) env('HORIZON_FLEET_LIGHT_MAX_PROCESSES', 2),
    ],
    'supervisor-fleet-arrivals-heavy' => [
        'maxProcesses' => (int) env('HORIZON_FLEET_HEAVY_MAX_PROCESSES', 3),
    ],
];

return [
    /*
    |--------------------------------------------------------------------------
    | Horizon Name
    |--------------------------------------------------------------------------
    |
    | This name appears in notifications and in the Horizon UI. Unique names
    | can be useful while running multiple instances of Horizon within an
    | application, allowing you to identify the Horizon you're viewing.
    |
    */

    'name' => env('HORIZON_NAME'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    |
    | This is the subdomain where Horizon will be accessible from. If this
    | setting is null, Horizon will reside under the same domain as the
    | application. Otherwise, this value will serve as the subdomain.
    |
    */

    'domain' => env('HORIZON_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Path
    |--------------------------------------------------------------------------
    |
    | This is the URI path where Horizon will be accessible from. Feel free
    | to change this path to anything you like. Note that the URI will not
    | affect the paths of its internal API that aren't exposed to users.
    |
    | The default nests the dashboard under the admin panel's URL space so it
    | sits alongside the other admin tooling and can reuse its middleware.
    |
    */

    'path' => env('HORIZON_PATH', 'admin/horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    |
    | This is the name of the Redis connection where Horizon will store the
    | meta information required for it to function. It includes the list
    | of supervisors, failed jobs, job metrics, and other information.
    |
    */

    'use' => 'default',

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    |
    | This prefix will be used when storing all Horizon data in Redis. You
    | may modify the prefix when you are running multiple installations
    | of Horizon on the same server so that they don't have problems.
    |
    */

    'prefix' => env(
        'HORIZON_PREFIX',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_horizon:'
    ),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will get attached onto each Horizon route, giving you
    | the chance to add your own middleware to this list or change any of
    | the existing middleware. Or, you can simply stick with this list.
    |
    | The dashboard is guarded by the same authentication and admin-role
    | middleware as the rest of the admin panel.
    |
    */

    'middleware' => ['web', 'auth', 'admin'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds
    |--------------------------------------------------------------------------
    |
    | This option allows you to configure when the LongWaitDetected event
    | will be fired. Every connection / queue combination may have its
    | own, unique threshold (in seconds) before this event is fired.
    |
    */

    'waits' => [
        'redis:'.QueueName::Default->value => 60,
        'redis:'.QueueName::FleetArrivals->value => 60,
        'redis:'.QueueName::FleetArrivalsHeavy->value => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Trimming Times
    |--------------------------------------------------------------------------
    |
    | Here you can configure for how long (in minutes) you desire Horizon to
    | persist the recent and failed jobs. Typically, recent jobs are kept
    | for one hour while all failed jobs are stored for an entire week.
    |
    */

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 10080,
        'monitored' => 10080,
    ],

    /*
    |--------------------------------------------------------------------------
    | Silenced Jobs
    |--------------------------------------------------------------------------
    |
    | Silencing a job will instruct Horizon to not place the job in the list
    | of completed jobs within the Horizon dashboard. This setting may be
    | used to fully remove any noisy jobs from the completed jobs list.
    |
    */

    'silenced' => [
        // App\Jobs\ExampleJob::class,
    ],

    'silenced_tags' => [
        // 'notifications',
    ],

    /*
    |--------------------------------------------------------------------------
    | Metrics
    |--------------------------------------------------------------------------
    |
    | Here you can configure how many snapshots should be kept to display in
    | the metrics graph. This will get used in combination with Horizon's
    | `horizon:snapshot` schedule to define how long to retain metrics.
    |
    */

    'metrics' => [
        'trim_snapshots' => [
            'job' => 24,
            'queue' => 24,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Termination
    |--------------------------------------------------------------------------
    |
    | When this option is enabled, Horizon's "terminate" command will not
    | wait on all of the workers to terminate unless the --wait option
    | is provided. Fast termination can shorten deployment delay by
    | allowing a new instance of Horizon to start while the last
    | instance will continue to terminate each of its workers.
    |
    | The default is the graceful behaviour: a deploy that returns before its
    | fleet-arrival workers stopped can leave a battle writing to a database the
    | new container already owns. Set HORIZON_FAST_TERMINATION=true only when the
    | orchestrator itself waits for the old queue container to exit.
    */

    'fast_termination' => filter_var(env('HORIZON_FAST_TERMINATION', false), FILTER_VALIDATE_BOOLEAN),

    /*
    |--------------------------------------------------------------------------
    | Memory Limit (MB)
    |--------------------------------------------------------------------------
    |
    | This value describes the maximum amount of memory the Horizon master
    | supervisor may consume before it is terminated and restarted. For
    | configuring these limits on your workers, see the next section.
    |
    */

    'memory_limit' => (int) env('HORIZON_MEMORY_LIMIT', 64),

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may define the queue worker settings used by your application
    | in all environments. These supervisors and settings handle all your
    | queued jobs and will be provisioned by Horizon during deployment.
    |
    */

    'defaults' => [
        // General-purpose lane for jobs that do not need a dedicated pool.
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => [QueueName::Default->value],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            // The auto-balancer never drops below minProcesses, so a lane always has a
            // worker ready instead of paying for a cold start on the first job.
            'minProcesses' => 1,
            'maxProcesses' => 1,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => $generalMemory,
            'tries' => 1,
            'timeout' => $generalTimeout,
            'nice' => 0,
        ],

        // Light fleet-arrival lane. Battles are never queued here, so transports,
        // deployments and returns always have at least one worker available.
        'supervisor-fleet-arrivals-light' => [
            'connection' => 'redis',
            'queue' => [QueueName::FleetArrivals->value],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 1,
            'maxProcesses' => 1,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => $fleetMemory,
            // Mirrors ProcessFleetArrival::$tries; the job property wins over this value.
            'tries' => 20,
            'timeout' => $fleetTimeout,
            'sleep' => $fleetSleep,
            'nice' => 0,
        ],

        // Heavy fleet-arrival lane. It also drains the light lane so spare battle
        // capacity is not wasted. Note that the "auto" strategy balances by queue load
        // and ignores the order below; the light lane's own supervisor is what
        // guarantees light traffic keeps its workers.
        'supervisor-fleet-arrivals-heavy' => [
            'connection' => 'redis',
            'queue' => [QueueName::FleetArrivalsHeavy->value, QueueName::FleetArrivals->value],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 1,
            // Two queues x minProcesses, so the lane stays valid even before an
            // environment applies its own ceiling.
            'maxProcesses' => 2,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => $fleetMemory,
            'tries' => 20,
            'timeout' => $fleetTimeout,
            'sleep' => $fleetSleep,
            'nice' => 0,
        ],
    ],

    'environments' => [
        // Only the pool ceilings change per environment; every other supervisor option
        // comes from the shared defaults above (including Horizon's own balanced defaults
        // for balanceMaxShift and balanceCooldown). Each ceiling is overridable from .env
        // so the same build can be scaled without editing this file:
        //
        //   HORIZON_DEFAULT_MAX_PROCESSES       - general (default) lane
        //   HORIZON_FLEET_LIGHT_MAX_PROCESSES   - light fleet-arrival lane
        //   HORIZON_FLEET_HEAVY_MAX_PROCESSES   - heavy fleet-arrival lane
        //
        // A supervisor needs maxProcesses >= minProcesses x its queue count (the light
        // lane watches 1 queue, the heavy lane watches 2), so these stay >= 1 and the
        // heavy lane stays >= 2.
        'production' => [
            'supervisor-default' => [
                'maxProcesses' => (int) env('HORIZON_DEFAULT_MAX_PROCESSES', 5),
            ],
            'supervisor-fleet-arrivals-light' => [
                'maxProcesses' => (int) env('HORIZON_FLEET_LIGHT_MAX_PROCESSES', 10),
            ],
            'supervisor-fleet-arrivals-heavy' => [
                'maxProcesses' => (int) env('HORIZON_FLEET_HEAVY_MAX_PROCESSES', 10),
            ],
        ],

        // Staging behaves like production but with a small footprint, so a load test or
        // a large battle cannot exhaust the host.
        'staging' => [
            'supervisor-default' => [
                'maxProcesses' => (int) env('HORIZON_DEFAULT_MAX_PROCESSES', 2),
            ],
            'supervisor-fleet-arrivals-light' => [
                'maxProcesses' => (int) env('HORIZON_FLEET_LIGHT_MAX_PROCESSES', 4),
            ],
            'supervisor-fleet-arrivals-heavy' => [
                'maxProcesses' => (int) env('HORIZON_FLEET_HEAVY_MAX_PROCESSES', 4),
            ],
        ],

        // Local, and the fallback for any environment not listed above (qa, demo, a
        // custom APP_ENV, ...), share the smallest pools. Horizon matches environment
        // names with Str::is(), so "*" catches everything and keeps workers running
        // instead of silently provisioning nothing.
        'local' => $smallPools,
        '*' => $smallPools,
    ],

    /*
    |--------------------------------------------------------------------------
    | File Watcher Configuration
    |--------------------------------------------------------------------------
    |
    | The following list of directories and files will be watched when using
    | the `horizon:listen` command. Whenever any directories or files are
    | changed, Horizon will automatically restart to apply all changes.
    |
    */

    'watch' => [
        'app',
        'bootstrap',
        'config/**/*.php',
        'database/**/*.php',
        'public/**/*.php',
        'resources/**/*.php',
        'routes',
        'composer.lock',
        'composer.json',
        '.env',
    ],
];
