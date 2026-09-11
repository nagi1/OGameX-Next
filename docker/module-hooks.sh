#!/bin/sh
#
# Generic loader for module-provided container configuration.
#
# A module opts in simply by creating a file; the host needs no per-module edit:
#
#   Modules/<Name>/docker/supervisor/*.conf   appended to the generated supervisor
#                                             config (database queue driver)
#   Modules/<Name>/docker/entrypoint.d/*.sh   sourced once at container start
#
# Only enabled modules contribute. Enablement is read from the same status file
# nWidart uses (modules_statuses.json, or MODULES_STATUSES_FILE when set), so
# disabling a module removes its workers and hooks without touching host files.
#
# Every step is guarded: a missing, unreadable or non-writable file is reported on
# stderr and skipped, so a broken module degrades to "no contribution" instead of
# preventing the container from starting.

modules_root() {
    printf '%s' "${MODULES_ROOT:-/var/www/Modules}"
}

module_statuses_file() {
    printf '%s' "${MODULES_STATUSES_FILE:-/var/www/modules_statuses.json}"
}

module_warn() {
    printf 'module-hooks: %s\n' "$1" >&2
}

module_is_enabled() {
    name="$1"
    statuses="$(module_statuses_file)"

    if [ -z "$name" ]; then
        return 1
    fi

    if [ ! -f "$statuses" ]; then
        return 1
    fi

    if [ ! -r "$statuses" ]; then
        module_warn "cannot read module status file [${statuses}]; treating [${name}] as disabled"
        return 1
    fi

    if ! command -v php >/dev/null 2>&1; then
        module_warn "php is not available; treating module [${name}] as disabled"
        return 1
    fi

    php -r 'exit((json_decode((string) file_get_contents($argv[1]), true)[$argv[2]] ?? false) ? 0 : 1);' "$statuses" "$name" 2>/dev/null
}

module_name_for_path() {
    path="$1"
    root="$(modules_root)"
    rest="${path#"$root"/}"

    [ "$rest" != "$path" ] || return 0

    printf '%s' "${rest%%/*}"
}

# Verify a file exists and is writable, or that it can be created in its directory.
module_target_is_writable() {
    target="$1"

    if [ -e "$target" ]; then
        [ -w "$target" ]
        return $?
    fi

    dir="$(dirname "$target")"
    [ -d "$dir" ] && [ -w "$dir" ]
}

# Append every enabled module's supervisor fragments to the given config file.
append_module_supervisor_config() {
    target="$1"

    if [ -z "$target" ]; then
        module_warn 'no supervisor config target was given'
        return 1
    fi

    if ! module_target_is_writable "$target"; then
        module_warn "supervisor config [${target}] is not writable; module worker pools were not added"
        return 1
    fi

    for fragment in "$(modules_root)"/*/docker/supervisor/*.conf; do
        [ -f "$fragment" ] || continue

        if [ ! -r "$fragment" ]; then
            module_warn "cannot read supervisor fragment [${fragment}]; skipped"
            continue
        fi

        name="$(module_name_for_path "$fragment")"
        [ -n "$name" ] || continue
        module_is_enabled "$name" || continue

        printf '\n; --- contributed by module %s: %s ---\n' "$name" "$(basename "$fragment")" >> "$target"
        cat "$fragment" >> "$target"
    done
}

# Source every enabled module's entrypoint hooks. Hooks run with the container
# environment available and can inspect the current "$role".
run_module_entrypoint_hooks() {
    role="$1"

    for hook in "$(modules_root)"/*/docker/entrypoint.d/*.sh; do
        [ -f "$hook" ] || continue

        if [ ! -r "$hook" ]; then
            module_warn "cannot read entrypoint hook [${hook}]; skipped"
            continue
        fi

        name="$(module_name_for_path "$hook")"
        [ -n "$name" ] || continue
        module_is_enabled "$name" || continue

        # shellcheck disable=SC1090
        . "$hook"
    done
}
