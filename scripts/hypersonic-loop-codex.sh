#!/bin/bash
# hypersonic-loop-codex.sh — Auto-restart wrapper for infinite autopilot (Codex)
#
# Same concept as hypersonic-loop.sh but for OpenAI Codex CLI.
# When context runs out, restarts the session. Agent resumes via .autopilot-state.md.
#
# Usage:
#   chmod +x hypersonic-loop-codex.sh
#   ./hypersonic-loop-codex.sh /path/to/project "your vision" "path/to/plan.md"
#   ./hypersonic-loop-codex.sh /path/to/project "your vision"  # no plan, pure Phase 2
#
# Stop: Ctrl+C

set -e

PROJECT_DIR="${1:-.}"
VISION="${2:-Make this codebase production-quality with full test coverage}"
PLAN_FILE="${3:-}"

cd "$PROJECT_DIR" || { echo "❌ Cannot cd to $PROJECT_DIR"; exit 1; }

ITERATION=0
START_TIME=$(date '+%Y-%m-%d %H:%M')

trap 'echo ""; echo "🛑 Hypersonic stopped after $ITERATION session(s). Started: $START_TIME | Stopped: $(date "+%H:%M")"; exit 0' INT

echo "⚡ Hypersonic Infinite Loop — Codex"
echo "   Project: $(pwd)"
echo "   Vision:  $VISION"
echo "   Plan:    ${PLAN_FILE:-none (Phase 2 only)}"
echo "   Started: $START_TIME"
echo "   Stop:    Ctrl+C"
echo ""

while true; do
    ITERATION=$((ITERATION + 1))
    echo "━━━ Session $ITERATION | $(date '+%H:%M:%S') ━━━"

    if [ -f ".autopilot-state.md" ]; then
        PROMPT="Resume autopilot. Read .autopilot-state.md and continue exactly where the last session left off. Do not ask me anything. Do not re-plan. Just continue."
    elif [ -n "$PLAN_FILE" ]; then
        PROMPT="Activate autopilot. Vision: $VISION. Plan file: $PLAN_FILE. Read the plan file completely, then execute every task in order. After the plan is done, iterate infinitely on T1-T6 improvements toward the vision. Never stop. Never ask. I am going away."
    else
        PROMPT="Activate autopilot in infinite improvement mode. Vision: $VISION. No plan file — go straight to Phase 2. Scan the codebase, find highest-value improvement, implement, test, commit or discard, repeat forever. Never stop. Never ask. I am going away."
    fi

    # Codex uses --full-auto for unattended mode, --quiet to suppress interactive prompts
    codex --full-auto --quiet "$PROMPT" 2>&1 || true

    echo "━━━ Session $ITERATION ended | $(date '+%H:%M:%S') ━━━"
    echo "   Restarting in 5s... (Ctrl+C to stop)"
    sleep 5
done
