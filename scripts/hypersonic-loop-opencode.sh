#!/bin/bash
# hypersonic-loop-opencode.sh — Auto-restart wrapper for OpenCode (FREE)
#
# OpenCode is free and open source. Ships with free models built-in.
# Supports 75+ LLM providers including local models via Ollama.
#
# Setup: npm install -g opencode (or see opencode.ai)
# Usage: ./hypersonic-loop-opencode.sh /path/to/project "vision" "plan.md"
# Stop:  Ctrl+C

set -e
PROJECT_DIR="${1:-.}"
VISION="${2:-Make this codebase production-quality with full test coverage}"
PLAN_FILE="${3:-}"
cd "$PROJECT_DIR" || { echo "❌ Cannot cd to $PROJECT_DIR"; exit 1; }

ITERATION=0
trap 'echo ""; echo "🛑 Stopped after $ITERATION session(s)."; exit 0' INT

echo "⚡ Hypersonic Infinite Loop — OpenCode (FREE)"
echo "   Project: $(pwd)"
echo "   Vision:  $VISION"
echo "   Plan:    ${PLAN_FILE:-none}"
echo "   Stop:    Ctrl+C"
echo ""

while true; do
    ITERATION=$((ITERATION + 1))
    echo "━━━ Session $ITERATION | $(date '+%H:%M:%S') ━━━"

    if [ -f ".autopilot-state.md" ]; then
        PROMPT="Resume autopilot. Read .autopilot-state.md and continue exactly where the last session left off. Do not ask me anything. Just continue."
    elif [ -n "$PLAN_FILE" ]; then
        PROMPT="Activate autopilot. Vision: $VISION. Plan file: $PLAN_FILE. Read the plan completely, execute every task in order. After done, iterate infinitely on T1-T6 improvements. Never stop. Never ask."
    else
        PROMPT="Activate autopilot infinite improvement mode. Vision: $VISION. Scan codebase, find highest-value improvement, implement, test, commit or discard, repeat forever. Never stop."
    fi

    echo "$PROMPT" | opencode -p 2>&1 || true

    echo "━━━ Session $ITERATION ended | $(date '+%H:%M:%S') ━━━"
    echo "   Restarting in 5s..."
    sleep 5
done
