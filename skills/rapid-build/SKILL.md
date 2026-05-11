---
name: rapid-build
description: "Use when the user wants to explore, prototype, vibecode, or move fast without heavy process. Build the first useful version quickly, show something real, and iterate from feedback."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Rapid Build - Show It Fast

Rapid-build is for momentum. Produce a real draft the user can run, see, click, or react to before polishing the idea.

## Dials

- Higher `velocity`: thinner slice, faster visible result.
- Higher `rigor`: keep structure sane and re-route if the draft becomes production work.
- `max_questions`: ask at most one setup question; prefer a reasonable guess when feedback will be quick.
- `test_mode`: verify enough to stay honest, but do not let tests replace a visible draft.
- `auto_commit`: commit only if the prototype is clearly meant to be kept.

## Use This For

- rough UI screens
- throwaway prototypes
- proof-of-concept integrations
- quick CLIs or scripts
- "just try one version"

Do not use it for auth, money, migrations, security boundaries, or changes where correctness is more important than speed.

## First 60 Seconds

1. Identify the output: page, component, endpoint, script, CLI, doc, or asset.
2. Reuse the repo's existing stack and nearby patterns.
3. Ask one question only if the output target is truly unclear.
4. Build the thinnest useful slice.

Wrong guesses the user can see are often cheaper than long setup chats.

## Build Order

1. Visible or runnable path.
2. Happy path.
3. Basic polish.
4. Error cases.
5. Cleanup and hardening.

Do not start with folder scaffolding, abstractions, or future-proofing.

## Fast Progress Rules

- Build the thing, not preparation for the thing.
- Prefer one rough working path over several partial paths.
- Keep structure simple; split files only when the code starts fighting back.
- Use mock data only when it gets the draft visible faster; label it clearly.
- Remove fake polish: dead TODOs, decorative abstractions, unused hooks, empty layers.

## Verification

Run the cheapest check that proves the draft is real:

- UI: render or open the screen.
- API/script: run the happy path once.
- Integration: confirm the boundary call shape.
- Risky logic: add a small focused test.

If you cannot run it, say exactly what was not verified.

## Iteration Report

After each pass, say:

1. what works now
2. what is still rough
3. the next best improvement

Keep this short. The loop is build -> show -> refine.

## Formalize When

Leave rapid-build when the user says:

- keep this
- productionize this
- add tests
- clean this up
- ship this

Then route back through `hypersonic-core` and treat the prototype as the starting draft, not as disposable failure.

## Avoid

- planning instead of building
- asking multiple rounds of edge-case questions
- infrastructure before a working feature
- tests before the prototype proves value
- rewrites when iteration would work
- technical-debt lectures during active exploration

The standard: show useful progress fast, keep it honest, and make the next choice obvious.
