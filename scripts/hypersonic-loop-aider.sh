#!/bin/bash
# hypersonic-loop-aider.sh — Auto-restart wrapper for Aider (FREE)
#
# Aider is free and open source. Git-native. Works with ANY LLM.
# For truly $0 cost: use with Ollama local models.
#   aider --model ollama/deepseek-coder-v2
#
# Setup: pip install aider-chat
# Usage: ./hypersonic-loop-aider.sh /path/to/project "vision" "plan.md"
# Stop:  Ctrl+C
#
# Set AIDER_MODEL env var to choose model (default: uses aider's default)
# Examples:
#   AIDER_MODEL=ollama/deepseek-coder-v2 ./hypersonic-loop-aider.sh ...  # free local
#   AIDER_MODEL=gemini/gemini-2.5-pro ./hypersonic-loop-aider.sh ...     # free API
#   AIDER_MODEL=claude-sonnet-4-20250514 ./hypersonic-loop-aider.sh ...  # paid API

set -e
PROJECT_DIR="${1:-.}"
VISION="${2:-Make this codebase production-quality with full test coverage}"
PLAN_FILE="${3:-}"
cd "$PROJECT_DIR" || { echo "❌ Cannot cd to $PROJECT_DIR"; exit 1; }

MODEL_FLAG=""
if [ -n "$AIDER_MODEL" ]; then
    MODEL_FLAG="--model $AIDER_MODEL"
fi

ITERATION=0
trap 'echo ""; echo "🛑 Stopped after $ITERATION session(s)."; exit 0' INT

echo "⚡ Hypersonic Infinite Loop — Aider (FREE)"
echo "   Project: $(pwd)"
echo "   Vision:  $VISION"
echo "   Plan:    ${PLAN_FILE:-none}"
echo "   Model:   ${AIDER_MODEL:-default}"
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

    aider --yes-always --no-suggest-shell-commands $MODEL_FLAG --message "$PROMPT" 2>&1 || true

    echo "━━━ Session $ITERATION ended | $(date '+%H:%M:%S') ━━━"
    echo "   Restarting in 5s..."
    sleep 5
done
