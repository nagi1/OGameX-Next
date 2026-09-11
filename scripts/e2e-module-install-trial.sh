#!/usr/bin/env bash
#
# Real lifecycle trial: the host with the module absent, then installed, then removed.
#
# Run from the host (it needs `docker compose` and moves the module directory), against
# the already-running local-docker-dev stack:
#
#   bash scripts/e2e-module-install-trial.sh            # AI module
#   MODULE=Marketplace bash scripts/e2e-module-install-trial.sh
#
# It proves, against the live containers and the real database:
#   1. the host boots, lists and diagnoses cleanly while the module is not installed;
#   2. an uninstalled module therefore contributes no Horizon lane and no worker pool;
#   3. the queue container starts healthy with host-only pools;
#   4. after restoring the module it is discovered as available but disabled;
#   5. ogamex:module:install migrates, runs the hook and enables it;
#   6. restarting the queue container makes supervisord pick the module pool up;
#   7. a real Horizon master provisions the module's Redis lanes;
#   8. uninstalling disables it, and the next container start drops its pool.
#
# Nothing is dropped: the trial uninstalls without --drop-data, restores the tracked
# modules_statuses.json byte for byte, and puts the module directory back even when it
# is interrupted.
#
# Assertions capture output and match it with bash patterns instead of piping into
# `grep -q`/`grep -c`: those exit early (or with status 1 at a count of zero), and under
# `pipefail` the upstream `docker compose exec` then reports a pipe error even though the
# check itself succeeded.
set -uo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-local-docker-dev}"
APP_SERVICE="${APP_SERVICE:-ogamex-app}"
QUEUE_SERVICE="${QUEUE_SERVICE:-ogamex-queue-worker}"
MODULE="${MODULE:-AI}"
# Module-specific markers; the defaults describe the AI module.
PROGRAM="${PROGRAM:-ai-queue-worker}"
HORIZON_SUPERVISOR="${HORIZON_SUPERVISOR:-supervisor-ai}"
TABLE_PREFIX="${TABLE_PREFIX:-ai_}"

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
module_dir="${repo_root}/Modules/${MODULE}"
statuses_file="${repo_root}/modules_statuses.json"
module_backup="/tmp/e2e-module-${MODULE}-backup"
statuses_backup="/tmp/e2e-module-statuses-backup.json"

FAILS=0
pass() { printf '  \033[32mPASS\033[0m %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAILS=$((FAILS + 1)); }
step() { printf '\n== %s ==\n' "$1"; }
# 0 means the check passed; the third argument is optional failure evidence.
check() { if [ "$1" = 0 ]; then pass "$2"; else fail "${2}${3:+ — $3}"; fi; }

contains() { [[ "$1" == *"$2"* ]]; }
count_of() { grep -c -- "$2" <<<"$1" || true; }

compose() { (cd "${repo_root}/${COMPOSE_DIR}" && docker compose "$@"); }

app() { compose exec -T "${APP_SERVICE}" "$@"; }

artisan() { app sh -c "cd /var/www && php artisan $*"; }

module_is_moved() { [ -d "$module_backup" ] && [ ! -d "$module_dir" ]; }

queue_container_id() { compose ps -q "${QUEUE_SERVICE}" 2>/dev/null; }
queue_started_at() { docker inspect -f '{{.State.StartedAt}}' "$(queue_container_id)" 2>/dev/null; }
queue_status() { compose ps "${QUEUE_SERVICE}" --format '{{.Status}}' 2>/dev/null; }
queue_conf() { compose exec -T "${QUEUE_SERVICE}" sh -c 'cat /tmp/queue-worker.conf 2>/dev/null'; }
queue_programs() { compose exec -T "${QUEUE_SERVICE}" sh -c 'supervisorctl -c /tmp/queue-worker.conf status 2>/dev/null' 2>/dev/null; }

# Supervisord only rebuilds its pools when the queue container boots, so the trial waits
# for a genuinely new container instance instead of the previous one's health.
restart_queue() {
    local before; before="$(queue_started_at)"
    compose restart "${QUEUE_SERVICE}" >/dev/null 2>&1 || true
    local waited=0
    while [ "$waited" -lt 90 ]; do
        if [ "$(queue_started_at)" != "$before" ] && contains "$(queue_status)" "healthy"; then
            return 0
        fi
        sleep 3
        waited=$((waited + 3))
    done

    return 1
}

start_queue() {
    compose start "${QUEUE_SERVICE}" >/dev/null 2>&1 || true
    local waited=0
    while [ "$waited" -lt 90 ]; do
        if contains "$(queue_status)" "healthy"; then
            return 0
        fi
        sleep 3
        waited=$((waited + 3))
    done

    return 1
}

report_queue() {
    printf '  --- queue container ---\n'
    printf '  status: %s\n' "$(queue_status)"
    printf '  programs in /tmp/queue-worker.conf:\n'
    printf '%s\n' "$(queue_conf)" | grep -E '^\[program:' | sed 's/^/    /'
    printf '  supervisord:\n'
    printf '%s\n' "$(queue_programs)" | sed 's/^/    /'
}

cleanup() {
    if module_is_moved; then
        mv "$module_backup" "$module_dir" >/dev/null 2>&1 || true
    fi

    if [ -f "$statuses_backup" ]; then
        cp "$statuses_backup" "$statuses_file" >/dev/null 2>&1 || true
    fi

    artisan "config:clear" >/dev/null 2>&1 || true
    artisan "horizon:terminate" >/dev/null 2>&1 || true
    compose restart "${QUEUE_SERVICE}" >/dev/null 2>&1 || true

    rm -f "$statuses_backup" /tmp/e2e-install-trial-horizon.log
}
trap cleanup EXIT

echo "Module lifecycle trial — ${MODULE} on ${COMPOSE_DIR}"

step "0. Preflight"
if [ ! -d "$module_dir" ]; then
    fail "module directory ${module_dir} does not exist, so the trial cannot start"
    exit 1
fi
pass "module directory found (${module_dir})"

if contains "$(compose ps "${APP_SERVICE}" --format '{{.Status}}' 2>/dev/null)" "Up"; then
    pass "application container is running"
else
    fail "application container is not running; start ${COMPOSE_DIR} first"
    exit 1
fi

cp "$statuses_file" "$statuses_backup"
pass "tracked statuses file backed up"

compose stop "${QUEUE_SERVICE}" >/dev/null 2>&1 || true

step "1. Module not installed"
mv "$module_dir" "$module_backup"
if [ -d "$module_dir" ]; then
    fail "module directory could not be moved aside"
else
    pass "module directory removed from Modules/"
fi

LIST_OUT="$(artisan "module:list" 2>&1)"
if contains "$LIST_OUT" "[Disabled] ${MODULE}"; then
    fail "a module that is not installed is still listed"
else
    pass "module:list runs and no longer lists ${MODULE}"
fi

check "$(count_of "$(artisan "config:show horizon" 2>&1)" "${HORIZON_SUPERVISOR}")" \
    "horizon configuration contains no ${HORIZON_SUPERVISOR} lane"

LOADER_OUT="$(app sh -c ". /var/www/docker/module-hooks.sh; : > /tmp/absent.conf; append_module_supervisor_config /tmp/absent.conf; cat /tmp/absent.conf" 2>&1)"
if [ -z "$LOADER_OUT" ]; then
    pass "container loader contributes nothing for an absent module"
else
    fail "container loader contributed configuration for an absent module: ${LOADER_OUT}"
fi

DOCTOR_OUT="$(artisan "ogamex:module:doctor" 2>&1)"
check "$(count_of "$DOCTOR_OUT" "blocking problem(s)")" \
    "the doctor reports no blocking problems with the module absent" \
    "$(printf '%s\n' "$DOCTOR_OUT" | tail -2 | tr '\n' ' ')"

if start_queue; then
    pass "queue container starts healthy with the module absent"
else
    fail "queue container did not become healthy with the module absent"
fi

if contains "$(queue_conf)" "[program:${PROGRAM}]" || contains "$(queue_programs)" "${PROGRAM}"; then
    fail "supervisord runs a ${PROGRAM} program although the module is absent"
    report_queue
else
    pass "supervisord runs host pools only"
fi

step "2. Module available but not installed"
mv "$module_backup" "$module_dir"
LIST_OUT="$(artisan "module:list" 2>&1)"
if contains "$LIST_OUT" "[Disabled] ${MODULE}"; then
    pass "module:list discovers ${MODULE} as available but disabled"
else
    fail "module:list does not list ${MODULE} after it was restored"
    printf '%s\n' "$LIST_OUT" | sed 's/^/    /'
fi

if contains "$(artisan "ogamex:module:doctor ${MODULE}" 2>&1)" "Supervisor fragment: docker/supervisor"; then
    pass "the doctor finds the module's supervisor fragment"
else
    fail "the doctor did not find the module's supervisor fragment"
fi

step "3. Install"
INSTALL_OUT="$(artisan "ogamex:module:install ${MODULE}" 2>&1)"
if contains "$INSTALL_OUT" "is installed and enabled"; then
    pass "ogamex:module:install reports success"
else
    fail "ogamex:module:install failed" "$(printf '%s\n' "$INSTALL_OUT" | tail -3 | tr '\n' ' ')"
fi

if contains "$(cat "$statuses_file")" "\"${MODULE}\": true"; then
    pass "the module is enabled in the tracked statuses file"
else
    fail "the module was not enabled in the tracked statuses file"
fi

TABLES="$(app sh -c "mysql --skip-ssl -h \"\$DB_HOST\" -P \"\${DB_PORT:-3306}\" -u \"\$DB_USERNAME\" \"\$DB_DATABASE\" -N -e \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='\$DB_DATABASE' AND MID(table_name, 1, ${#TABLE_PREFIX}) = '${TABLE_PREFIX}';\" 2>/dev/null" | tr -d '[:space:]')"
if [ "${TABLES:-0}" -gt 0 ]; then
    pass "the module migrations ran (${TABLES} module tables)"
else
    fail "no module tables exist after the install" "run [php artisan ogamex:module:doctor ${MODULE}]"
fi

step "4. The queue container picks the module pool up"
if restart_queue; then
    pass "queue container restarted and is healthy"
else
    fail "queue container did not become healthy after the restart"
fi

if contains "$(queue_conf)" "[program:${PROGRAM}]" && contains "$(queue_programs)" "${PROGRAM}"; then
    pass "supervisord started the module pool (${PROGRAM})"
else
    fail "${PROGRAM} is not running after the container restart"
    report_queue
fi

step "5. Horizon provisions the module lanes"
HORIZON_OUT="$(app sh -c "cd /var/www && QUEUE_CONNECTION=redis php artisan horizon >/tmp/e2e-install-trial-horizon.log 2>&1 & sleep 14; QUEUE_CONNECTION=redis php artisan horizon:supervisors 2>&1; QUEUE_CONNECTION=redis php artisan horizon:terminate >/dev/null 2>&1")"
if contains "$HORIZON_OUT" "${HORIZON_SUPERVISOR}"; then
    pass "a real Horizon master provisioned ${HORIZON_SUPERVISOR}"
else
    fail "Horizon did not provision ${HORIZON_SUPERVISOR}" "$(printf '%s\n' "$HORIZON_OUT" | tail -3 | tr '\n' ' ')"
fi

step "6. Uninstall"
UNINSTALL_OUT="$(artisan "ogamex:module:uninstall ${MODULE}" 2>&1)"
if contains "$UNINSTALL_OUT" "is uninstalled and disabled"; then
    pass "ogamex:module:uninstall reports success"
else
    fail "ogamex:module:uninstall failed" "$(printf '%s\n' "$UNINSTALL_OUT" | tail -3 | tr '\n' ' ')"
fi

if contains "$(cat "$statuses_file")" "\"${MODULE}\": false"; then
    pass "the module is disabled in the tracked statuses file"
else
    fail "the module was not disabled in the tracked statuses file"
fi

if restart_queue; then
    pass "queue container restarted and is healthy after the uninstall"
else
    fail "queue container did not become healthy after the uninstall restart"
fi

if contains "$(queue_conf)" "[program:${PROGRAM}]" || contains "$(queue_programs)" "${PROGRAM}"; then
    fail "${PROGRAM} still runs after the module was uninstalled"
    report_queue
else
    pass "the module pool is gone from the restarted container"
fi

check "$(count_of "$(artisan "config:show horizon" 2>&1)" "${HORIZON_SUPERVISOR}")" \
    "the module lane is gone while the module is disabled"

printf '\n%s\n' "---------------------------------------------"
if [ "$FAILS" -eq 0 ]; then
    printf '\033[32mMODULE LIFECYCLE TRIAL PASSED\033[0m — the host is clean without the module and picks it up after install\n'
    exit 0
fi

printf '\033[31mMODULE LIFECYCLE TRIAL FAILED\033[0m — %s check(s) failed\n' "$FAILS"
exit 1
