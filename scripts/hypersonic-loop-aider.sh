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

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# shellcheck source=./hypersonic-common.sh
. "$SCRIPT_DIR/hypersonic-common.sh"

PROJECT_DIR="${1:-.}"
VISION="${2:-Make this codebase production-quality with full test coverage}"
PLAN_FILE="${3:-}"
cd "$PROJECT_DIR" || { echo "❌ Cannot cd to $PROJECT_DIR"; exit 1; }
eval "$(hs_load_runtime_env "$(pwd)")"

MODEL_ARGS=()
if [ -n "$AIDER_MODEL" ]; then
    MODEL_ARGS=(--model "$AIDER_MODEL")
fi

ITERATION=0
RESTART_DELAY_SECONDS="$(hs_restart_delay_seconds)"
trap 'echo ""; echo "🛑 Stopped after $ITERATION session(s)."; exit 0' INT

echo "⚡ Hypersonic Infinite Loop — Aider (FREE)"
echo "   Project: $(pwd)"
echo "   Vision:  $VISION"
echo "   Plan:    ${PLAN_FILE:-none}"
echo "   Model:   ${AIDER_MODEL:-default}"
echo "   Params:  velocity=$HYPERSONIC_VELOCITY, rigor=$HYPERSONIC_RIGOR, test_mode=$HYPERSONIC_TEST_MODE, max_questions=$HYPERSONIC_MAX_QUESTIONS"
echo "   Config:  ${HYPERSONIC_CONFIG_PATH:-defaults}"
echo "   Stop:    Ctrl+C"
echo ""

while true; do
    ITERATION=$((ITERATION + 1))
    echo "━━━ Session $ITERATION | $(date '+%H:%M:%S') ━━━"

    PROMPT="$(hs_build_prompt "$(pwd)" "$VISION" "$PLAN_FILE")"

    aider --yes-always --no-suggest-shell-commands "${MODEL_ARGS[@]}" --message "$PROMPT" 2>&1 || true

    echo "━━━ Session $ITERATION ended | $(date '+%H:%M:%S') ━━━"
    echo "   Restarting in ${RESTART_DELAY_SECONDS}s..."
    sleep "$RESTART_DELAY_SECONDS"
done
