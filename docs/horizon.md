# Horizon on the host

Laravel Horizon owns the Redis queue backend of OGameX. This document is the
host-side operating contract: which part the host owns, which part a module owns,
how the queue container picks its backend, and what to do when something is not
running.

## Ownership split

| Concern | Owner | Where |
| --- | --- | --- |
| Supervisor pools, timeouts, memory, waits for host queues | Host | `config/horizon.php` |
| Queue names | Host | `app/Enums/QueueName.php` |
| Dashboard route, middleware and gate | Host | `config/horizon.php`, `app/Providers/HorizonServiceProvider.php` |
| Queue container (Horizon **or** database pools) | Host | `docker/entrypoint.sh`, `docker/supervisor/horizon.conf`, `docker/supervisor/queue-worker.conf` |
| Module lanes, waits and queue names | Module | runtime contribution, e.g. `Modules/AI/app/Support/HorizonConfiguration.php` |

A module never edits `config/horizon.php`. Its provider injects
`horizon.defaults.*`, `horizon.waits.*` and one `maxProcesses` entry per
environment while the module is enabled, and `Modules/*/docker/supervisor/*.conf`
is appended to the database worker pools by `docker/module-hooks.sh`. That is why
disabling a module removes its lanes without touching a host file, and why a
fully disabled module leaves no trace in the Horizon dashboard.

## Backend selection

There is exactly one queue container and no `horizon` container role:

1. `CONTAINER_ROLE=queue` runs `docker/entrypoint.sh`.
2. The entrypoint reads `QUEUE_CONNECTION` (container environment first, then
   `.env`, because Laravel's env repository is immutable).
3. `redis` → `supervisord -c docker/supervisor/horizon.conf` runs the Horizon
   master, which provisions its pools from `config/horizon.php`.
4. Any other driver → supervisord runs the database fleet-arrival pools from
   `docker/supervisor/queue-worker.conf`, with module pools appended.

Horizon **requires Redis**. `phpredis` (not `predis`) is the client; the dev image
installs it with `pecl install redis`.

## Environment knobs

Everything below is optional and read from `.env` or the container environment:

| Variable | Purpose |
| --- | --- |
| `HORIZON_PATH` | Dashboard path; defaults to `admin/horizon` |
| `HORIZON_NAME`, `HORIZON_PREFIX` | Identifying name and Redis key prefix |
| `HORIZON_FAST_TERMINATION` | Skip waiting for workers on terminate; keep `false` unless the orchestrator waits for the container |
| `HORIZON_MEMORY_LIMIT` | Master supervisor memory ceiling (MB) |
| `HORIZON_DEFAULT_MEMORY`, `HORIZON_DEFAULT_TIMEOUT` | General lane limits |
| `HORIZON_FLEET_MEMORY`, `HORIZON_FLEET_TIMEOUT`, `HORIZON_FLEET_SLEEP` | Fleet-arrival lanes (battles) |
| `HORIZON_DEFAULT_MAX_PROCESSES`, `HORIZON_FLEET_LIGHT_MAX_PROCESSES`, `HORIZON_FLEET_HEAVY_MAX_PROCESSES` | Per-environment pool ceilings |
| `QUEUE_WORKERS_LIGHT`, `QUEUE_WORKERS_HEAVY` | Database backend pool sizes (ignored by Horizon) |

Two invariants are enforced by `tests/Feature/HorizonConfigTest.php`:

- A fleet-arrival supervisor timeout must stay **above** `ProcessFleetArrival`'s
  600 s job timeout (otherwise Horizon force-kills a running battle) and **below**
  the Redis `retry_after` (otherwise the job runs twice).
- Every queue name in `QueueName` plus every `queue.module_queue_names` entry is
  drained by some supervisor, in every environment block.

## Running it

```bash
# Development: the queue profile is opt-in so a live worker never races the tests.
docker compose --profile queue up -d
docker compose --profile queue logs -f ogamex-queue-worker

# With local-docker-dev and host services
cd local-docker-dev && docker compose --profile queue up -d

# Production: the queue container runs unconditionally.
docker compose -f docker-compose.prod.yml up -d
```

The container reports unhealthy when no worker program is running: the healthcheck
(`docker/queue-healthcheck.sh`) asks supervisord whether any program is `RUNNING`,
whichever backend the entrypoint picked. A stopped master or pool therefore shows
up in `docker compose ps` instead of looking healthy.

## Operating and diagnosis

```bash
php artisan horizon:status        # active / inactive / paused
php artisan horizon:supervisors   # supervisors the master actually provisioned
php artisan horizon:pause         # stop picking up new jobs, keep workers
php artisan horizon:continue
php artisan horizon:terminate     # graceful stop; honours fast_termination
php artisan horizon:snapshot      # manual metrics sample
```

`horizon:snapshot` is scheduled every five minutes by `routes/console.php`, but
only while `QUEUE_CONNECTION=redis`, because the dashboard graphs read those
snapshots.

When lanes are missing, the module's own code is usually not the problem — the
module is simply disabled, or its provider never booted:

```bash
php artisan ogamex:module:doctor AI   # queue driver, Horizon, phpredis, Redis, fragments, hooks
php artisan ogamex:module:list
php artisan ogamex:module:install AI  # migrate, hook, enable, refresh caches, restart workers
```

| Symptom | First check |
| --- | --- |
| `horizon:status` says inactive | Redis reachable (`REDIS_HOST`/`REDIS_PORT`), `php -m` lists `redis` |
| No supervisors in `horizon:supervisors` | `QUEUE_CONNECTION=redis`, then `php artisan horizon` output |
| Module lanes missing while enabled | `php artisan ogamex:module:doctor <Module>`; clear the config cache if the module was enabled after `config:cache` |
| Jobs dispatched but never run | `php artisan queue:failed`, then `horizon:supervisors` for the queue name |
| Container unhealthy | `docker compose logs ogamex-queue-worker`, then the healthcheck output |
| Fleet jobs killed mid-battle | Supervisor timeout must exceed the job timeout (see invariants above) |

`Modules/AI/scripts/e2e-queue-horizon.sh` exercises all of this against a live
stack, including real Horizon provisioning, real supervisord startup, the
disabled-module case and the container/loader edge cases.

`scripts/e2e-module-install-trial.sh` (host) covers the other direction: the module is
not installed at all, then installed, then uninstalled, while checking that the queue
container stays healthy, that supervisord picks the module pool up on the next boot and
that a real Horizon master provisions the module's lanes (and drops them again).
