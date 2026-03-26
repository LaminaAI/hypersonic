#!/bin/bash
# hypersonic-loop.sh — Auto-restart wrapper for infinite autopilot (Claude Code)
#
# When the agent session dies (context exhaustion), this script restarts it.
# The agent resumes from .hsonic-autopilot-state.md (or legacy .autopilot-state.md).
#
# Usage:
#   chmod +x hypersonic-loop.sh
#   ./hypersonic-loop.sh /path/to/project "your vision" "path/to/plan.md"
#   ./hypersonic-loop.sh /path/to/project "your vision"  # no plan, pure Phase 2
#
# Stop: Ctrl+C

set -e

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# shellcheck source=./hypersonic-common.sh
. "$SCRIPT_DIR/hypersonic-common.sh"

PROJECT_DIR="${1:-.}"
VISION="${2:-Make this codebase production-quality with full test coverage}"
PLAN_FILE="${3:-}"

cd "$PROJECT_DIR" || { echo "❌ Cannot cd to $PROJECT_DIR"; exit 1; }
eval "$(hs_load_runtime_env "$(pwd)")"

ITERATION=0
START_TIME=$(date '+%Y-%m-%d %H:%M')
RESTART_DELAY_SECONDS="$(hs_restart_delay_seconds)"

trap 'echo ""; echo "🛑 Hypersonic stopped after $ITERATION session(s). Started: $START_TIME | Stopped: $(date "+%H:%M")"; exit 0' INT

echo "⚡ Hypersonic Infinite Loop — Claude Code"
echo "   Project: $(pwd)"
echo "   Vision:  $VISION"
echo "   Plan:    ${PLAN_FILE:-none (Phase 2 only)}"
echo "   Params:  velocity=$HYPERSONIC_VELOCITY, rigor=$HYPERSONIC_RIGOR, test_mode=$HYPERSONIC_TEST_MODE, max_questions=$HYPERSONIC_MAX_QUESTIONS"
echo "   Config:  ${HYPERSONIC_CONFIG_PATH:-defaults}"
echo "   Started: $START_TIME"
echo "   Stop:    Ctrl+C"
echo ""

while true; do
    ITERATION=$((ITERATION + 1))
    echo "━━━ Session $ITERATION | $(date '+%H:%M:%S') ━━━"

    PROMPT="$(hs_build_prompt "$(pwd)" "$VISION" "$PLAN_FILE")"

    printf '%s\n' "$PROMPT" | claude --dangerously-skip-permissions 2>&1 || true

    echo "━━━ Session $ITERATION ended | $(date '+%H:%M:%S') ━━━"
    echo "   Restarting in ${RESTART_DELAY_SECONDS}s... (Ctrl+C to stop)"
    sleep "$RESTART_DELAY_SECONDS"
done
