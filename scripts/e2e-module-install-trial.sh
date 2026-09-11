#!/usr/bin/env bash
#
# Real lifecycle trial: the host with the module absent, then installed, then removed.
# Run from the host, against a running local-docker-dev stack:
#
#   bash scripts/e2e-module-install-trial.sh            # AI module
#   MODULE=Marketplace PROGRAM=marketplace-queue-worker \
#     HORIZON_SUPERVISOR=supervisor-marketplace TABLE_PREFIX=marketplace_ \
#     bash scripts/e2e-module-install-trial.sh
#
# It proves what no in-container test can: the module is not there, then installed, then
# picked up by supervisord and Horizon, then removed without a trace. Nothing is dropped
# and nothing is left behind — the tracked status file, the module directory and the
# container are restored even when the trial is interrupted.
set -uo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-local-docker-dev}"
APP_SERVICE="${APP_SERVICE:-ogamex-app}"
QUEUE_SERVICE="${QUEUE_SERVICE:-ogamex-queue-worker}"
MODULE="${MODULE:-AI}"
# Identifiers the host looks for, defaulting to the AI module.
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

# Text is matched with bash patterns instead of `grep -q`: a pipeline ending in a
# fast-exiting grep makes the upstream command report a pipe error under pipefail even
# when the pattern matched.
assert_contains() { if [[ "$2" == *"$3"* ]]; then pass "$1"; else fail "$1 (missing: $3)"; fi; }
assert_absent() { if [[ "$2" != *"$3"* ]]; then pass "$1"; else fail "$1 (unexpected: $3)"; fi; }
assert_empty() { if [ -z "$2" ]; then pass "$1"; else fail "$1 (got: $2)"; fi; }
assert_nonempty() { if [ -n "$2" ]; then pass "$1"; else fail "$1 (nothing found)"; fi; }
assert_equal() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected ${3}, got ${2})"; fi; }
assert_ok() { if [ "$2" = 0 ]; then pass "$1"; else fail "$1"; fi; }

compose() { (cd "${repo_root}/${COMPOSE_DIR}" && docker compose "$@"); }
app() { compose exec -T "${APP_SERVICE}" "$@"; }
artisan() { app sh -c "cd /var/www && php artisan $*"; }
count_of() { grep -c -- "$2" <<<"$1" || true; }

queue_status() { compose ps "${QUEUE_SERVICE}" --format '{{.Status}}' 2>/dev/null; }
queue_started_at() { docker inspect -f '{{.State.StartedAt}}' "$(compose ps -q "${QUEUE_SERVICE}" 2>/dev/null)" 2>/dev/null; }
queue_conf() { compose exec -T "${QUEUE_SERVICE}" sh -c 'cat /tmp/queue-worker.conf 2>/dev/null'; }
queue_programs() { compose exec -T "${QUEUE_SERVICE}" sh -c 'supervisorctl -c /tmp/queue-worker.conf status 2>/dev/null' 2>/dev/null; }

module_is_moved() { [ -d "$module_backup" ] && [ ! -d "$module_dir" ]; }

# Supervisord rebuilds its pools when the queue container boots, so wait for a new
# instance instead of trusting the previous one's health.
wait_for_queue() {
    local waited=0 alive="${1:-}"

    while [ "$waited" -lt 90 ]; do
        if [ "$(queue_started_at)" != "$alive" ] && [[ "$(queue_status)" == *healthy* ]]; then
            return 0
        fi
        sleep 3
        waited=$((waited + 3))
    done

    return 1
}

restart_queue() { local before; before="$(queue_started_at)"; compose restart "${QUEUE_SERVICE}" >/dev/null 2>&1 || true; wait_for_queue "$before"; }

start_queue() { compose start "${QUEUE_SERVICE}" >/dev/null 2>&1 || true; wait_for_queue ""; }

report_queue() {
    printf '  --- queue container ---\n  status: %s\n  programs: %s\n' "$(queue_status)" "$(queue_programs)"
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

assert_contains "application container is running" "$(compose ps "${APP_SERVICE}" --format '{{.Status}}' 2>/dev/null)" "Up"

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
assert_absent "module:list no longer lists ${MODULE}" "$(artisan module:list)" "[Disabled] ${MODULE}"
assert_equal "horizon configuration has no ${HORIZON_SUPERVISOR} lane" "$(count_of "$(artisan 'config:show horizon')" "${HORIZON_SUPERVISOR}")" "0"
assert_empty "container loader contributes nothing for an absent module" \
    "$(app sh -c '. /var/www/docker/module-hooks.sh; : > /tmp/absent.conf; append_module_supervisor_config /tmp/absent.conf; cat /tmp/absent.conf' 2>&1)"
assert_absent "the doctor reports no blocking problems" "$(artisan 'ogamex:module:doctor')" "blocking problem(s)"

assert_ok "queue container starts healthy with the module absent" "$(start_queue && echo 0 || echo 1)"
if [[ "$(queue_conf)" == *"[program:${PROGRAM}]"* ]] || [[ "$(queue_programs)" == *"${PROGRAM}"* ]]; then
    fail "supervisord runs a ${PROGRAM} program although the module is absent"
    report_queue
else
    pass "supervisord runs host pools only"
fi

step "2. Module available but not installed"
mv "$module_backup" "$module_dir"
assert_contains "module:list discovers ${MODULE} as available but disabled" "$(artisan module:list)" "[Disabled] ${MODULE}"
assert_contains "the doctor finds the module's supervisor fragment" \
    "$(artisan "ogamex:module:doctor ${MODULE}")" "Supervisor fragment: docker/supervisor"

step "3. Install"
assert_contains "ogamex:module:install reports success" \
    "$(artisan "ogamex:module:install ${MODULE}")" "is installed and enabled"
assert_contains "the module is enabled in the tracked statuses file" "$(cat "$statuses_file")" "\"${MODULE}\": true"

TABLES="$(app sh -c "mysql --skip-ssl -h \"\$DB_HOST\" -P \"\${DB_PORT:-3306}\" -u \"\$DB_USERNAME\" \"\$DB_DATABASE\" -N -e \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='\$DB_DATABASE' AND MID(table_name, 1, ${#TABLE_PREFIX}) = '${TABLE_PREFIX}';\" 2>/dev/null" | tr -d '[:space:]')"
if [ "${TABLES:-0}" -gt 0 ]; then
    pass "the module migrations ran (${TABLES} module tables)"
else
    fail "no module tables exist after the install (run [php artisan ogamex:module:doctor ${MODULE}])"
fi

step "4. The queue container picks the module pool up"
assert_ok "queue container restarted and is healthy" "$(restart_queue && echo 0 || echo 1)"
if [[ "$(queue_conf)" == *"[program:${PROGRAM}]"* ]] && [[ "$(queue_programs)" == *"${PROGRAM}"* ]]; then
    pass "supervisord started the module pool (${PROGRAM})"
else
    fail "${PROGRAM} is not running after the container restart"
    report_queue
fi

step "5. Horizon provisions the module lanes"
HORIZON_OUT="$(app sh -c "cd /var/www && QUEUE_CONNECTION=redis php artisan horizon >/tmp/e2e-install-trial-horizon.log 2>&1 & sleep 14; QUEUE_CONNECTION=redis php artisan horizon:supervisors 2>&1; QUEUE_CONNECTION=redis php artisan horizon:terminate >/dev/null 2>&1")"
assert_contains "a real Horizon master provisioned ${HORIZON_SUPERVISOR}" "$HORIZON_OUT" "${HORIZON_SUPERVISOR}"

step "6. Uninstall"
assert_contains "ogamex:module:uninstall reports success" \
    "$(artisan "ogamex:module:uninstall ${MODULE}")" "is uninstalled and disabled"
assert_contains "the module is disabled in the tracked statuses file" "$(cat "$statuses_file")" "\"${MODULE}\": false"

assert_ok "queue container restarted and is healthy after the uninstall" "$(restart_queue && echo 0 || echo 1)"
if [[ "$(queue_conf)" == *"[program:${PROGRAM}]"* ]] || [[ "$(queue_programs)" == *"${PROGRAM}"* ]]; then
    fail "${PROGRAM} still runs after the module was uninstalled"
    report_queue
else
    pass "the module pool is gone from the restarted container"
fi
assert_equal "the module lane is gone while the module is disabled" "$(count_of "$(artisan 'config:show horizon')" "${HORIZON_SUPERVISOR}")" "0"

printf '\n---------------------------------------------\n'
if [ "$FAILS" -ne 0 ]; then
    printf '\033[31mMODULE LIFECYCLE TRIAL FAILED\033[0m — %s check(s) failed\n' "$FAILS"

    exit 1
fi

printf '\033[32mMODULE LIFECYCLE TRIAL PASSED\033[0m — the host is clean without the module and picks it up after install\n'
