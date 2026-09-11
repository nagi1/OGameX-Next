#!/bin/sh
#
# Liveness probe for the queue container, whichever backend it runs.
#
# The entrypoint hands supervisord either docker/supervisor/horizon.conf (Redis
# backend) or a generated /tmp/queue-worker.conf (database backend, with module
# pools appended), so the probe asks supervisord which programs are RUNNING instead
# of guessing which backend is active. The runtime image has no ps or pgrep, so
# supervisorctl is the reliable source of truth here.
#
# Exits 0 as soon as one program is RUNNING and 1 when every candidate config is
# missing or has no running program, which is what makes a stuck worker pool visible
# to `docker compose ps` and to orchestrators.
set -u

for conf in /var/www/docker/supervisor/horizon.conf /tmp/queue-worker.conf; do
    [ -f "$conf" ] || continue

    if supervisorctl -c "$conf" status 2>/dev/null | grep -q "RUNNING"; then
        exit 0
    fi
done

echo "queue-healthcheck: no RUNNING queue program found" >&2

exit 1
