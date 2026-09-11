# Module lifecycle: install, uninstall and container hooks

OGameX modules are independent codebases under `Modules/`. The host gives operators
one safe command per action and gives module authors convention-based hooks, so a
module can own everything it needs without editing host files.

## For server owners

```bash
# Install: run the module migrations, run its install hook, enable it,
# clear caches and restart the queue workers.
php artisan ogamex:module:install Marketplace

# Preview the exact steps without changing anything.
php artisan ogamex:module:install Marketplace --dry-run

# Uninstall: run its uninstall hook, disable it and refresh caches/workers.
# Module data is KEPT unless you explicitly ask to drop it.
php artisan ogamex:module:uninstall Marketplace

# Destructive: also roll back every module migration (asks for confirmation).
php artisan ogamex:module:uninstall Marketplace --drop-data

# Read-only diagnosis of the wiring: queue driver, Horizon, phpredis, Redis,
# supervisor fragments and entrypoint hooks. Exits non-zero on real problems.
php artisan ogamex:module:doctor Marketplace
php artisan ogamex:module:doctor          # every module at once
```

Both lifecycle commands are idempotent and safe to re-run. `uninstall` never
deletes the module's files — use `php artisan module:delete Marketplace` for that.

What the host does automatically:

- `install`: migrate the module's own `database/migrations` path (when the module
  ships migrations) → install hook → `module:enable` → refresh module cache →
  `optimize:clear` → `queue:restart`.
- `uninstall`: uninstall hook → optional `module:migrate-reset` (every module
  migration, not just the newest batch) → `module:disable` → refresh module cache
  → `optimize:clear` → `queue:restart`.

Both migration directions work while the module is still disabled, which matters:
`module:migrate` silently skips disabled modules (a fresh install would report
success having applied nothing) and `module:migrate-rollback` only reverts the
newest batch (a drop-data run would silently keep older tables).

Every step is verified and failures are explicit. A step that fails stops the run
with the reason, an actionable next command and a pointer at
`php artisan ogamex:module:doctor`, so an install never reports a false success.

Refreshing caches matters: nWidart freezes the `modules_statuses.json` **path** in
the config cache, so a module enabled after `php artisan config:cache` needs the
compiled caches refreshed before its provider is registered.

Module activation is stored in `modules_statuses.json` at the project root. Commit
it so a team shares the same activation state.

## For module authors

Nothing is required beyond normal module structure. Opt in to what you need:

### 1. Optional install / uninstall hooks

Create the class; the host discovers it by convention.

```php
namespace Modules\Marketplace\Hooks;

use OGame\Modules\Contracts\ModuleHook;
use OGame\Modules\ModuleHookContext;

class InstallModule implements ModuleHook
{
    public function handle(ModuleHookContext $context): void
    {
        // Seed reference data, publish assets, warm an external index, ...
        $context->line('Marketplace ready.');
    }
}
```

- File: `Modules/<Name>/app/Hooks/InstallModule.php` (or `UninstallModule.php`).
- Classes are autoloaded through the module's own PSR-4 mapping, so they run even
  while the module is disabled. They run **outside the module's service provider**:
  use host services, not module container bindings.
- `ModuleHookContext` exposes `$module`, `$dryRun`, `line(string)` and
  `path(string $relative = '')`.

### 2. Container and supervisor hooks

Drop files under the module; the host loader (`docker/module-hooks.sh`) applies
them only while the module is enabled, so disabling a module removes its workers
and startup hooks with no host edit.

| Path | Applied by | Purpose |
| --- | --- | --- |
| `Modules/<Name>/docker/supervisor/*.conf` | queue container start (database driver) | Extra Supervisor programs, e.g. a worker pool for the module's queues |
| `Modules/<Name>/docker/entrypoint.d/*.sh` | every container start | Startup hooks, sourced with the container's `$role` available |

Example: `Modules/AI/docker/supervisor/queue-worker.conf` adds an `ai-queue-worker`
pool that drains the module's `ai` and `ai-language` queues when the database queue
driver is active. With `QUEUE_CONNECTION=redis`, Horizon manages the equivalent
pools instead.

### 3. Queue / Horizon lanes

A module can own its Horizon configuration at runtime. See
`Modules/AI/config/horizon.php` and `Modules/AI/app/Providers/HorizonServiceProvider.php`:
the module contributes its supervisors to `config('horizon.*')` only while enabled,
registering its queue names in `config('queue.module_queue_names')` so the host's
Horizon guard test knows they are module-owned. This works with a cached config,
including the case where the module is enabled after `php artisan config:cache`.

The host side of that contract — pools, dashboard gate, backend selection, env
knobs, health commands and troubleshooting — is documented in
[`horizon.md`](horizon.md).

## Testing your module lifecycle

Host tests cover the generic behaviour end to end:

- `tests/Feature/ModuleLifecycleTest.php` — install/uninstall (isolated process with
  a throwaway statuses file), `--dry-run`, `--drop-data` gating, rollback listing only
  when migrations exist, aborting destructive actions without confirmation, and a
  helpful "module not found" failure.
- `tests/Feature/ModuleDoctorCommandTest.php` — the read-only diagnosis: healthy wire,
  disabled module, a module with no container configuration, a broken environment
  (exit code 1) and an unknown module.
- `tests/Feature/ModuleHooksLoaderTest.php` — supervisor fragments and entrypoint
  hooks apply only to enabled modules, missing status files contribute nothing,
  non-file fragments are skipped, and a non-writable supervisor target fails loudly.
- `Modules/AI/tests/Feature/AiQueueHorizonTest.php` — the AI Horizon plan builds a
  valid `ProvisioningPlan` for production, local and unlisted environments, and still
  loads from a stale config cache.

`Modules/AI/scripts/e2e-queue-horizon.sh` is the real container trial: 74 checks
against the live docker stack. It runs inside the application container
(`docker compose exec -T ogamex-app bash Modules/AI/scripts/e2e-queue-horizon.sh`)
and covers, with throwaway status files so the tracked one is never touched:

1. runtime readiness — phpredis loaded, Horizon reaches Redis;
2. a disabled module leaves no Horizon lane and no worker pool;
3. the enabled plan registers its lanes for production, staging, local and qa;
4. the generated supervisor pool really starts the module worker under supervisord;
5. Horizon provisions both module supervisors for real (`horizon:supervisors`);
6. loader edge cases — malformed or missing status file, status path that is a
   directory, a module without a status entry, a directory named `*.conf`, a missing
   `php` binary, and a non-writable supervisor target;
7. failure paths — unknown module, unreachable Redis, a dry run that changes nothing,
   and the doctor's exit codes;
8. install/uninstall dry runs reporting docker, shell, phpredis and Redis findings;
9. a real install/uninstall cycle against a cached config;
10. `--drop-data` on a disabled module removing every module table, and a fresh
    install recreating the full schema;
11. a **real job run**: `Modules/AI/scripts/e2e-dispatch-ai-job.php` queues a genuine
    `ProcessAiWork` job on the module's `ai` lane, a real Horizon master executes it,
    and the work item transitions to a terminal state (`state=4`, i.e. Completed) before
    the trial deletes its own work item and profile again.

`Modules/AI/app/Hooks/` is a real install/uninstall hook in the AI module and
`Modules/HelloWorld/app/Hooks/` is the minimal reference. A module should additionally
assert its own hook side effects with real host services.

### Host trial: not installed → installed → uninstalled

`scripts/e2e-module-install-trial.sh` proves the *host* side of a module's life on a
running `local-docker-dev` stack. It runs on the host (it needs `docker compose` and
moves the module directory aside), so it also covers what no in-container test can:
the module simply not being there.

```bash
bash scripts/e2e-module-install-trial.sh                # AI module
MODULE=Marketplace PROGRAM=marketplace-queue-worker \
  HORIZON_SUPERVISOR=supervisor-marketplace TABLE_PREFIX=marketplace_ \
  bash scripts/e2e-module-install-trial.sh              # another module
```

Its 22 checks walk through:

1. the queue container is stopped, then the module directory is moved out of
   `Modules/` — `module:list` no longer mentions it, `config:show horizon` has no
   module lane, the shell loader contributes zero lines, and `module:doctor` reports no
   blocking problems;
2. the queue container starts healthy with host-only pools and no module program;
3. restoring the directory makes the module discoverable again as `[Disabled]`, and the
   doctor finds its supervisor fragment and entrypoint hooks;
4. `ogamex:module:install` migrates (18 tables for AI), runs the module hook and enables
   it in `modules_statuses.json`;
5. restarting the queue container makes supervisord start the module pool, so a
   deployment picks the module up with the next container boot;
6. a real Horizon master provisions the module's Redis lanes;
7. `ogamex:module:uninstall` disables it, and the next container boot drops the pool and
   the lane again.

Nothing is dropped and nothing is left behind: the trial uninstalls without
`--drop-data`, restores the tracked `modules_statuses.json` byte for byte, puts the
module directory back and restarts the queue container even when it is interrupted.

Two container facts the trial depends on:

- Supervisord builds its pools at container start, so an install is picked up on the
  next **container** boot (`docker compose restart ogamex-queue-worker`), while Horizon
  lanes only need the next **Horizon master** boot.
- The generated `/tmp/queue-worker.conf` is rebuilt on every container start, so a
  module that is removed again leaves no stale pool behind.

Assertions in the trial match captured output with bash patterns rather than piping into
`grep -q`/`grep -c`: those exit early or with status 1 at a count of zero, and under
`set -o pipefail` the upstream `docker compose exec` then reports a pipe error even
though the check itself succeeded.

## Error handling contract

- A missing module fails with the requested name and points at `module:list`.
- A step that fails stops the run with the underlying message; the command never
  reports success after a failed migration, enable, cache or worker step.
- A blocking finding (no Horizon while `QUEUE_CONNECTION=redis`, phpredis missing,
  Redis unreachable, an unreadable fragment) fails the install and says what to fix;
  recoverable findings (database queue driver, array cache store) are warnings.
- A module hook that exists but does not implement `ModuleHook`, or cannot be
  resolved, raises a clear error instead of being silently ignored.
- The shell loader reports missing, unreadable or non-writable files on stderr and
  continues with the remaining modules, so one broken module cannot stop a container.
