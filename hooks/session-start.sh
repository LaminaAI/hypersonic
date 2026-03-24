#!/bin/sh
# Hypersonic session-start hook
# Injected at the start of every Claude Code / Codex session

cat << 'HYPERSONIC_BOOTSTRAP'
You have Hypersonic active.

FIRST: Check if `.autopilot-state.md` exists in the project root. If it does, you are RESUMING a previous autopilot session — read it immediately, say "Resuming autopilot", and continue where the last session left off. Do NOT ask the user anything. Do NOT re-plan. Just continue.

If no state file exists, proceed normally:

Before any development task, invoke `hypersonic-core` to classify the velocity tier:
- V1 (Patch): No ceremony, just do it.
- V2 (Task): Quick plan in chat, then build.
- V3 (Feature): Design brief → tasks → build → review → ship.
- V4 (System): Architecture brief → decompose → execute → review → ship.

If the user wants to explore/prototype/vibecode → invoke `rapid-build`.

If the user says "autopilot", "don't stop", "keep going", "iterate infinitely", "I'm going to sleep", "make it as good as possible" → invoke `autopilot`. Autopilot is ALWAYS infinite. There is no finite mode. The agent works through the plan, then continuously improves the codebase forever until the human interrupts.

Available skills: hypersonic-core, rapid-build, architect, surgical-debug, tdd-engine, code-review, ship-it, evolution-engine, autopilot

Do NOT announce that you have Hypersonic unless the user asks. Just use the skills.
HYPERSONIC_BOOTSTRAP
