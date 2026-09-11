# Local Docker development with host services

Use this setup when Lerd, Laravel Herd, Valet, or another local environment already provides your web server, MySQL, or Redis. It starts only OGameX PHP services in Docker and does not bind ports 80, 443, 3306, or 8080.

There is only one environment file to maintain: the repository root `.env`.
Compose reads its `LOCAL_DB_*` and `LOCAL_REDIS_*` values directly and injects
the resolved `DB_*` and `REDIS_*` values into every container. This includes
commands launched with `docker exec`, such as the parallel test suite. Set
`LOCAL_DB_DATABASE` to a dedicated development or test database, and add
`LOCAL_DB_HOST`, `LOCAL_DB_PORT`, `LOCAL_DB_USERNAME`, or `LOCAL_DB_PASSWORD`
only when your host services differ from the defaults.

Build the image once from the repository root, then start the app and scheduler:

```bash
docker build -f local-docker-dev/Dockerfile -t ogamex-local-docker-dev:latest .
docker compose -f local-docker-dev/docker-compose.yml up -d
```

The app publishes PHP-FPM on port 9000. Configure your existing web server to pass PHP requests to `127.0.0.1:9000`. The containers reach host MySQL and Redis at `host.docker.internal`; the Linux `host-gateway` mapping is included in the Compose file.

Reverb starts with the core stack and serves secure WebSockets on port 8090 using
Yerd's local certificate. This is required when the site is served at an HTTPS
`.test` URL. Set the root `.env` client values to:

```dotenv
REVERB_HOST=ogamex-next.test
REVERB_PORT=8090
REVERB_SCHEME=https
```

The app container still broadcasts to Reverb over the private Docker network.
The queue worker is opt-in:

```bash
docker compose -f local-docker-dev/docker-compose.yml --profile queue up -d
```

### Laravel Horizon

The queue worker can run Laravel Horizon instead of the database worker pools. Set
`QUEUE_CONNECTION=redis` in the root `.env` and start the same `queue` profile; the
container detects the driver and starts Horizon, and Compose recreates the other
containers with the new value. Redis is reached through the host service configured
by `LOCAL_REDIS_*`.

```bash
docker compose -f local-docker-dev/docker-compose.yml --profile queue up -d
```

The dashboard is served at `/admin/horizon` and is limited to users with the
`admin` role. Worker pools, queue names and their timeouts live in
`config/horizon.php` and use the enum in `app/Enums/QueueName.php`. Pool sizes and
worker limits have per-environment defaults and can be tuned from `.env` with the
`HORIZON_*` variables listed in `.env.example`. Enabled modules may contribute
their own Horizon lanes at runtime. Rebuild the
image once (`docker build -f local-docker-dev/Dockerfile -t ogamex-local-docker-dev:latest .`)
so the phpredis extension required by Horizon is installed.

Keep `LOCAL_DB_DATABASE` pointed at a dedicated development or test database. This setup runs migrations when the app container starts.
