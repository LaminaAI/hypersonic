---
name: rapid-build
description: "Use when the user wants to explore, prototype, or move fast without heavy process. Visible progress matters more than polish. Build the first useful version quickly, let the user react to something real, then iterate."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Rapid Build — Show It Fast

Rapid-build is for momentum. The goal is not to produce the perfect solution. The goal is to produce a real draft the user can see, run, click, or react to as quickly as possible.

Ship the first useful version fast. Prefer visible progress over invisible preparation.

---

## How Parameters Change Behavior

- `velocity=high`: default to the thinnest useful slice, shortest feedback loop, and fastest visible result
- `velocity=medium|low`: allow a little more structure, cleanup, and edge-case handling before showing the draft
- `rigor=low`: tolerate rough edges if the prototype is useful and honest
- `rigor=medium`: keep the prototype simple but not messy
- `rigor=high`: if the work starts looking permanent or risky, stop treating it as rapid-build and route back through `hypersonic-core`
- `max_questions=N`: ask at most `N` setup questions; if the user can react to the output, prefer building over asking
- `test_mode=none`: verify manually through the happy path
- `test_mode=auto|relevant|full`: add that level of verification only when the draft is becoming real work or the risk justifies it
- `auto_commit=true`: if the prototype is verified and clearly ready to keep, commit it without another ship round
- `auto_commit=false`: leave the draft ready for review, but do not commit unless asked

---

## The Build Spectrum

Not every "fast" task is the same. Match the speed mode to the kind of draft the user wants.

### High speed — Build FIRST
Use this when the user clearly wants to move fast and the work is exploratory.

Use for:
- Rough UI screens
- Throwaway prototypes
- Proof-of-concept integrations
- "Can you just make one version?"

**Flow:**
1. Ask zero questions if you can infer the shape.
2. Build the thinnest working slice.
3. Show the result quickly.
4. Refine from feedback.

**Examples:**
- "Make a quick dashboard for orders" → build one screen with mock data first
- "Try a file upload flow" → build the happy path before storage hardening

### Medium speed — Build WITH structure
Use this when the prototype may become real code.

Use for:
- Small features likely to stick
- Internal tools
- One-off automations
- User-facing flows where structure matters a bit

**Flow:**
1. Make one short call on approach.
2. Build the first useful version.
3. Keep the structure simple but not sloppy.
4. Add only the minimum verification needed to avoid obvious breakage.

**Examples:**
- "Add a settings page quickly" → build the main route and form first, keep files organized, skip deep hardening
- "Make a CLI for this task" → get one command working end to end before expanding flags

### Stop and reclassify
Rapid-build should end when the work stops being a draft.

Signals:
- The user wants production quality
- Error handling now matters
- The code touches money, auth, or important data
- The prototype is becoming permanent
- The change needs design, tests, or staged rollout

When that happens, route back through `hypersonic-core`.

---

## First 60 Seconds

Before writing code:

1. Confirm the output form: page, component, script, endpoint, CLI, etc.
2. Reuse the repo's existing stack and patterns.
3. Ask at most one question if the output target is truly unclear.

Good:
- "I’m building this as a React page in the existing app."
- "I’ll wire one working CLI command first."

Bad:
- Long discovery chats
- Speculative architecture
- Asking for every edge case before iteration one

Wrong guesses that the user can quickly see and correct are usually faster than long Q&A sessions about hypotheticals.

---

## What To Build First

Build the smallest thing the user can run, see, or react to.

Priority order:
1. Visible output or runnable path
2. Happy path
3. Basic polish
4. Error cases
5. Cleanup and hardening

Do not invert this order. Working rough code teaches more than polished scaffolding.

---

## Rules For Fast Progress

### Build the thing, not the scaffolding
Start with the feature, not with support files that only prepare for the feature.

**Example:**
- Better: render the first chart with mock data
- Worse: create six empty folders, types, and TODO files

### Make reasonable assumptions
If the user can quickly react to the result, it is usually faster to build one sensible version than to ask several setup questions.

### Prefer one rough working path over many partial ones
A complete happy path teaches more than three unfinished options.

### Reuse what already exists
Follow the repo's stack, routing, components, and conventions. Rapid-build is fast work, not random work.

### Keep the structure simple
One file is fine to start. Split only when the code starts fighting you.

### Do not fake polish
Avoid placeholder refactors, TODO-heavy cleanup, and "future-proof" abstractions that do not help the current draft.

---

## After Each Iteration

Do three things:
1. Show what works now
2. Say what is still rough
3. Name the next likely improvement

**Example:**
- "The page renders, the filters work with mock data, and mobile layout is still rough. Next I’d wire real data or improve interaction states."

Do not turn each iteration into a planning ceremony. The point is to keep the loop short.

---

## Testing In Rapid Build

Do not lead with tests. Lead with working behavior.

Still verify enough to stay honest:
- Run it if it is runnable
- Render it if it is UI
- Hit the happy path if it is an endpoint or script
- Add a small test only when the logic is risky or the prototype is clearly turning into real code

If the user wants more rigor, switch out of rapid-build instead of stretching this skill into a full delivery workflow.

---

## Anti-Patterns

**Planning instead of building.** If the user asked to move fast, the first response should usually be code, not strategy.

**Asking multiple rounds of setup questions.** If a visible draft would answer the question faster, build it.

**Building infrastructure before the feature exists.** The user cannot react to scaffolding.

**Adding tests before the prototype proves value.** Test when the code starts to matter.

**Rewriting instead of iterating.** The first draft is allowed to be rough. Improve it in place unless it is fundamentally wrong.

**Lecturing about technical debt during active prototyping.** Save that for the formalization step.

---

## Anti-Rationalization Table

Rapid-build fails when agents use "fast" as an excuse for sloppy or invisible work.

| What you're thinking | What's actually true |
|---|---|
| "I should plan this out first" | If the user wants speed, a visible draft beats a better theory. |
| "I need to ask about every edge case" | If the user can react to a draft, one good guess is faster than five questions. |
| "Let me set up the architecture before building" | Architecture without a working draft is often just delay. |
| "I should make this production-ready now" | If it is still a prototype, focus on usefulness first. |
| "This draft is rough, I should rewrite it cleanly" | Iterate on the draft unless it is fundamentally wrong. |
| "Tests can wait forever because this is rapid-build" | Tests can wait for low-risk prototyping, not for risky logic or code that is becoming permanent. |

---

## When To Formalize

Move out of rapid-build when the user says:
- Keep this
- Productionize this
- Add tests
- Clean this up
- Ship this

Then:
1. State what already works
2. List the obvious gaps
3. Route back through `hypersonic-core`

The prototype code is not "wrong." It is the first draft. Clean it up, do not throw it away for ceremony.

---

## Completion Checklist

Before you pause:

1. Make sure the prototype actually runs or renders
2. Verify the happy path once
3. Keep the diff focused on the draft you built
4. Leave the next step obvious

The standard is simple: show real progress fast, keep the shape sane, and do not let process kill momentum.
