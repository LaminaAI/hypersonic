#!/bin/bash

HYPERSONIC_COMMON_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HYPERSONIC_REPO_ROOT="$(CDPATH= cd -- "$HYPERSONIC_COMMON_DIR/../.." && pwd)"
HYPERSONIC_RUNTIME_CLI="$HYPERSONIC_REPO_ROOT/cli/hypersonic-runtime.mjs"

hs_load_runtime_env() {
    node "$HYPERSONIC_RUNTIME_CLI" env --project "$1"
}

hs_build_prompt() {
    local project_dir="$1"
    local vision="$2"
    local plan_file="$3"

    if [ -n "$plan_file" ]; then
        node "$HYPERSONIC_RUNTIME_CLI" prompt --project "$project_dir" --vision "$vision" --plan "$plan_file"
    else
        node "$HYPERSONIC_RUNTIME_CLI" prompt --project "$project_dir" --vision "$vision"
    fi
}

hs_restart_delay_seconds() {
    local ms="${HYPERSONIC_RESTART_DELAY_MS:-5000}"
    local whole_seconds=$((ms / 1000))
    local remainder_ms=$((ms % 1000))

    if [ "$remainder_ms" -eq 0 ]; then
        printf '%s' "$whole_seconds"
    else
        printf '%s.%03d' "$whole_seconds" "$remainder_ms"
    fi
}
