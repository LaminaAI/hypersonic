#!/bin/sh
# Hypersonic session-start hook
# Injected at the start of every Claude Code / Codex session

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
RUNTIME_CLI="$SCRIPT_DIR/../cli/hypersonic-runtime.mjs"

if command -v node >/dev/null 2>&1; then
  RUNTIME_ENV=$(node "$RUNTIME_CLI" env --project "${PWD:-.}" 2>/dev/null) || RUNTIME_ENV=""
  RUNTIME_CONTRACT=$(node "$RUNTIME_CLI" contract --project "${PWD:-.}" 2>/dev/null) || RUNTIME_CONTRACT=""
else
  RUNTIME_ENV=""
  RUNTIME_CONTRACT=""
fi

if [ -n "$RUNTIME_ENV" ]; then
  eval "$RUNTIME_ENV"
fi

: "${HYPERSONIC_VELOCITY:=high}"
: "${HYPERSONIC_RIGOR:=medium}"
: "${HYPERSONIC_MAX_QUESTIONS:=1}"
: "${HYPERSONIC_TEST_MODE:=auto}"
: "${HYPERSONIC_AUTO_COMMIT:=false}"
BT='`'

cat << HYPERSONIC_BOOTSTRAP
You have Hypersonic active.

Defaults: ${BT}velocity=${HYPERSONIC_VELOCITY}${BT}, ${BT}rigor=${HYPERSONIC_RIGOR}${BT}, ${BT}max_questions=${HYPERSONIC_MAX_QUESTIONS}${BT}, ${BT}test_mode=${HYPERSONIC_TEST_MODE}${BT}, ${BT}auto_commit=${HYPERSONIC_AUTO_COMMIT}${BT}. If a ${BT}.hypersonic/config.yml${BT} exists in the repo, those values are already reflected above. Only raise rigor when risk demands it.

${RUNTIME_CONTRACT}

FIRST: Check if ${BT}.hsonic-autopilot-state.md${BT} exists in the project root. If not, check legacy ${BT}.autopilot-state.md${BT}. If either exists, you are RESUMING a previous autopilot session — read it immediately, say "Resuming autopilot", and continue where the last session left off. Do NOT ask the user anything. Do NOT re-plan. Future checkpoints should use ${BT}.hsonic-autopilot-state.md${BT}. Local run history should go to ${BT}.hsonic-autopilot-log.md${BT}.

If no state file exists, proceed normally:

Before any development task, invoke ${BT}hypersonic-core${BT} to classify the velocity tier:
- V1 (Patch): No ceremony, just do it.
- V2 (Task): Quick plan in chat, then build.
- V3 (Feature): Design brief → tasks → build → review → ship.
- V4 (System): Architecture brief → decompose → execute → review → ship.

If the user wants to explore/prototype/vibecode → invoke ${BT}rapid-build${BT}.

If the user says "autopilot", "don't stop", "keep going", "iterate infinitely", "I'm going to sleep", "make it as good as possible" → invoke ${BT}autopilot${BT}. Autopilot is ALWAYS infinite. There is no finite mode. The agent works through the plan, then continuously improves the codebase forever until the human interrupts.

Available skills: hypersonic-core, rapid-build, architect, surgical-debug, tdd-engine, code-review, ship-it, evolution-engine, autopilot

Do NOT announce that you have Hypersonic unless the user asks. Just use the skills.
HYPERSONIC_BOOTSTRAP
