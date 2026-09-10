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

The queue worker and Reverb are opt-in so they do not start or claim ports unless you need them:

```bash
docker compose -f local-docker-dev/docker-compose.yml --profile queue up -d
docker compose -f local-docker-dev/docker-compose.yml --profile reverb up -d
```

Keep `LOCAL_DB_DATABASE` pointed at a dedicated development or test database. This setup runs migrations when the app container starts.
