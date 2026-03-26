#!/bin/bash
# hypersonic-loop-gemini.sh — Auto-restart wrapper for Gemini CLI (FREE)
#
# Gemini CLI gives 1,000 free requests/day with Gemini 2.5 Pro.
# When context runs out, this script restarts. Agent resumes via .hsonic-autopilot-state.md.
#
# Setup: npm install -g @anthropic-ai/gemini-cli  (or however gemini is installed)
# Usage: ./hypersonic-loop-gemini.sh /path/to/project "vision" "plan.md"
# Stop:  Ctrl+C

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
RESTART_DELAY_SECONDS="$(hs_restart_delay_seconds)"
trap 'echo ""; echo "🛑 Stopped after $ITERATION session(s)."; exit 0' INT

echo "⚡ Hypersonic Infinite Loop — Gemini CLI (FREE)"
echo "   Project: $(pwd)"
echo "   Vision:  $VISION"
echo "   Plan:    ${PLAN_FILE:-none}"
echo "   Params:  velocity=$HYPERSONIC_VELOCITY, rigor=$HYPERSONIC_RIGOR, test_mode=$HYPERSONIC_TEST_MODE, max_questions=$HYPERSONIC_MAX_QUESTIONS"
echo "   Config:  ${HYPERSONIC_CONFIG_PATH:-defaults}"
echo "   Stop:    Ctrl+C"
echo ""

while true; do
    ITERATION=$((ITERATION + 1))
    echo "━━━ Session $ITERATION | $(date '+%H:%M:%S') ━━━"

    PROMPT="$(hs_build_prompt "$(pwd)" "$VISION" "$PLAN_FILE")"

    printf '%s\n' "$PROMPT" | gemini 2>&1 || true

    echo "━━━ Session $ITERATION ended | $(date '+%H:%M:%S') ━━━"
    echo "   Restarting in ${RESTART_DELAY_SECONDS}s..."
    sleep "$RESTART_DELAY_SECONDS"
done
