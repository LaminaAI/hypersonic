---
name: hypersonic-core
description: "Classify coding work into Hypersonic V1-V4 tiers, choose the lightest safe workflow, set verification depth, and hand off to focused skills. Use at the start of software tasks or when scope changes."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Hypersonic Core - Route First

Classify fast, choose one workflow, then move. Hypersonic should add judgment, not ceremony.

## Dials

- `velocity`: higher means shorter feedback loops and fewer words before action.
- `rigor`: higher means earlier escalation, stronger verification, and clearer boundaries.
- `max_questions`: ask only the highest-leverage blocking question; otherwise state assumptions and continue.
- `test_mode`: sets the verification floor: `none`, `auto`, `relevant`, or `full`.
- `auto_commit`: commit only when true or when the user explicitly asks to ship.

## Before Routing

For V2-V4, read `.hypersonic/learned.md` if it exists. For V1, skip it unless the area is known-fragile.

Treat external reference packs as source material only. Do not route into their workflows unless the user explicitly asks.

If the user scopes the work to a file, folder, or module, treat that as an edit boundary. Read outside it when useful, but do not edit outside it without saying why.

## Velocity Tiers

Pick exactly one.

| Tier | Use For | Shape |
|---|---|---|
| V1 Patch | typo, rename, config tweak, one-file low-risk fix | edit -> smallest verification -> summary |
| V2 Task | focused bugfix, small feature, one endpoint or behavior | short approach -> build -> relevant tests |
| V3 Feature | user-facing flow or multi-part capability | short design brief -> V2-sized tasks -> review |
| V4 System | subsystem, large refactor, architecture change | boundaries -> staged units -> integration checks |

When unsure, start lower and escalate as soon as the blast radius proves larger.

## Say The Route

Use one short status line:

- "This is a V1 patch. I will make the change and verify it."
- "This is a V2 task. I will plan briefly, implement, and run relevant checks."
- "This is a V3 feature. I will write a short brief, then break it into tasks."
- "This is a V4 system change. I will define boundaries and sequence before coding."

Do not turn classification into a meeting.

## Route Rules

### V1 Patch

1. Make the change.
2. Run the smallest useful verification.
3. Summarize what changed and what was checked.
4. Commit only if `auto_commit=true` or the user asked.

No plan. No extra skills unless the task stops being V1.

### V2 Task

1. State the approach in 1-3 sentences.
2. If it is a bug, use `surgical-debug`.
3. Implement the focused change.
4. Add or update the core test unless risk and `test_mode` make manual verification enough.
5. Use `tdd-engine` when the right test depth is not obvious.
6. Run relevant verification.
7. Use `evolution-engine` only for durable repo learnings.

### V3 Feature

1. Use `architect` for a short design brief.
2. Get a quick checkpoint only if the direction is ambiguous or risky.
3. Break work into V2-sized tasks.
4. Implement task by task with tests.
5. Use `code-review` before finalizing.
6. Use `ship-it` when the user wants commit, PR, or merge work.

### V4 System

1. Use `architect` for boundaries, contracts, sequence, and verification.
2. Split into ordered units that can each be verified.
3. Execute unit by unit; do not do one giant build.
4. Run integration verification after units come together.
5. Use `code-review`, then `ship-it`, then `evolution-engine` when useful.

## Handoffs

- `rapid-build`: exploration, prototype, "just make one version".
- `surgical-debug`: bugs, failures, unexpected behavior.
- `tdd-engine`: tests matter and depth is unclear.
- `architect`: design must reduce implementation thrash.
- `code-review`: feature/system work is ready for risk review.
- `ship-it`: commit, PR, push, merge, or final shipping work.
- `autopilot`: unattended continuous progress.
- `evolution-engine`: confirmed repo knowledge worth keeping.

Do not use `rapid-build` for auth, billing, migrations, destructive operations, or security-critical boundaries. Route those through normal V2-V4 rigor.

## Escalate Or De-escalate

Escalate when scope grows, dependencies appear, design is needed, or verification broadens.

De-escalate when the change is smaller than expected or the design is already obvious.

Say the tier change plainly.

## Completion Gate

Before claiming success:

1. Identify what evidence proves the claim.
2. Run or inspect that evidence fresh.
3. Read the result.
4. State the actual status, including gaps.

The standard: route correctly, avoid borrowed ceremony, and get to useful work fast.
