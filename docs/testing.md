# Testing

## Run the suites

```bash
# Everything (host + modules), in parallel, fail fast
composer tests

# A single suite or file (still parallel)
./vendor/bin/pest --parallel --bail --testsuite=Feature
./vendor/bin/pest --parallel --bail tests/Feature/HorizonConfigTest.php

# The AI module suite, from the module checkout
cd Modules/AI && OGAMEX_RUNNER=local-docker-dev bash scripts/ogamex test
```

**Tests always run in parallel, with `--bail`.** Every worker owns its own cloned
database (see below), so parallelism costs nothing in isolation, and `--bail` stops
a run at the first failure instead of finishing work that is already known to be
red. Concretely:

- `composer tests`, the CI workflow, the VS Code *Run Laravel Tests* task and the
  module runner all pass `--parallel --bail`.
- Use `--processes=<n>` to pin the worker count for a focused run; everything else
  defaults to one worker per core.
- `--bail` stops at the first failure. Drop it only when you deliberately need the
  complete list of failures for one broken run.
- Local tools may append a filter: `composer tests -- --filter=PlanetServiceTest`
  keeps the parallel and bail flags.

The single exception is **coverage**, which stays serial: Laravel's parallel runner
cannot merge PCOV coverage across workers here (ParaTest fails with missing worker
coverage files). See *Coverage* below.

CI runs the host's own testsuites only (`--testsuite=Feature,Unit`), sharded against
the host-owned timings in `tests/.pest/shards.json`. Modules are separately
maintained repositories with their own pipeline, so the host workflow never
clones, discovers or shards module tests. `composer tests` still runs host and
module tests together locally.

## How parallel workers stay isolated

`OGame\Providers\ParallelTestSchemaServiceProvider` (registered in
`bootstrap/providers.php`) gives every worker its own database:

1. The first worker builds a migrated template database
   (`<database>_parallel_template`) from the host migrations plus every
   `Modules/*/database/migrations` directory. The template is rebuilt only when a
   migration file changes (its content hash is stored in
   `parallel_test_schema_meta`).
2. Each worker clones the template into `<database>_test_<token>` with
   `CREATE TABLE`/`INSERT ... SELECT`, so no schema dump files or external
   database client binaries are involved.
3. Laravel's own parallel testing support switches each worker's connection to
   that clone and takes care of cache prefixes and compiled views.

Worker databases persist between runs; they are reused when the migration version
matches. Run `./vendor/bin/pest --parallel --recreate-databases` after changing
migrations, or `--drop-databases` to clean up.

## Keep the tests fast

Two environment details dominate the runtime of a test:

- **Ignition recorders.** `spatie/laravel-ignition` records every query, model and
  log line for its error pages. That recorder costs milliseconds per query, so
  `Tests\TestCase` disables `ignition.recorders` inside the test application. Error
  pages keep the recorders everywhere else.
- **Prepared statements.** PDO's native prepares (`PDO::ATTR_EMULATE_PREPARES =>
  false`, Laravel's default) add a round trip per statement. On a database link
  where that round trip costs tens of milliseconds — a database reachable through
  the Docker host gateway is the common case — every query and every test pays it.
  Setting `DB_EMULATE_PREPARES=true` switches to client-side statement emulation
  and removes the stall:

  ```dotenv
  # .env, for the browser/app running in this environment
  DB_EMULATE_PREPARES=true
  ```

  `phpunit.xml` already enables it for the test suites so a CI runner or a fresh
  checkout is fast by default. Leave it unset in production: there the database
  round trip is cheap and native prepares are the better choice.

Measure before changing anything else: `./vendor/bin/pest --parallel --bail` and
`docker compose exec -T ogamex-app php artisan horizon:status` are the two commands
that show whether a slow run is the suite or the environment.

## Coverage

PCOV is the coverage driver (never Xdebug). It is installed in the dev image but
stays disabled, so enabling it per command is enough:

```bash
# Module coverage, from the module checkout: the runner owns the whole recipe and
# fails when any module statement is untested
cd Modules/AI && bash scripts/ogamex coverage
# Module coverage (Modules/AI/app, excluding app/Rules): 1952/1952 = 100.00%

# Host-side clover report for a one-off inspection (also serial)
php -d opcache.enable_cli=0 -d pcov.enabled=1 ./vendor/bin/pest --bail --coverage
```

Three details matter for trustworthy numbers:

- **Coverage is the one serial run.** Laravel's parallel runner cannot merge PCOV
  coverage across ParaTest workers in this stack; a parallel coverage run fails with
  `Missing coverage files` instead of producing a report.
- **Disable the CLI opcode cache** (`-d opcache.enable_cli=0`). Opcache shares
  compiled opcodes between CLI processes, and PCOV cannot instrument opcodes that
  were interned before it was enabled. Leaving opcache on silently reports covered
  lines as uncovered.
- **Keep the database quiet.** A test run that is interrupted can leave an open
  transaction behind, and the next run then fails on `Lock wait timeout` while it
  updates shared rows. Restart the application container to clear it:
  `docker compose restart ogamex-app`.

The module's `app/Rules` classes are PHPStan rules: they are verified by the
PHPStan gate and are excluded from test coverage in `Modules/AI/phpunit.xml`.

## Test data concurrency

Tests run against separate databases, so fixtures do not contend for rows.
Tests that must observe a real race use the host's dedicated commands
(`php artisan ogamex:test:race-condition-*`) instead of assuming serial
execution.
