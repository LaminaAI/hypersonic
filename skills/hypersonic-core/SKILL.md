---
name: hypersonic-core
description: "Use before any development task. This is the router for Hypersonic. It classifies scope, picks the lightest workflow that fits, loads repo knowledge when it matters, and routes to the right supporting skills."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Hypersonic Core — Route First, Then Build

The job of `hypersonic-core` is simple: classify the task fast, choose the lightest safe workflow, and get into execution. If this router is too heavy, every other skill gets slower. If it is too loose, the wrong work gets the wrong process.

Match rigor to scope. Do not add process because it feels safe.

---

## How Parameters Change Behavior

- `velocity=high`: bias toward V1 or V2 when safe, shorter plans, and faster execution
- `velocity=medium|low`: allow more planning, more explicit tradeoffs, and more cautious routing
- `rigor=low`: choose lighter process and lighter verification unless risk forces escalation
- `rigor=medium`: use the normal process for the chosen tier
- `rigor=high`: escalate sooner, ask stronger questions, and require stronger verification
- `max_questions=N`: ask at most `N` clarification questions before acting; after that, state assumptions and continue unless blocked by real risk
- `test_mode=none`: permit lighter verification where risk is low
- `test_mode=auto|relevant|full`: raise the verification floor for the chosen workflow
- `auto_commit=true`: V1 and V2 work can commit automatically once verified; later workflows can finalize without another ship prompt when appropriate
- `auto_commit=false`: do not commit unless the user asks to ship or the workflow explicitly requires it

---

## The Velocity Tiers

Pick exactly one tier.

### V1 — Patch
Use for:
- typo
- config tweak
- rename
- one-file low-risk fix

Typical shape:
- obvious scope
- low blast radius
- no design needed

### V2 — Task
Use for:
- focused bugfix
- small feature
- one endpoint
- one user-facing behavior change

Typical shape:
- clear target
- a few files
- limited blast radius

### V3 — Feature
Use for:
- multi-part feature
- user-facing flow
- capability that spans several components

Typical shape:
- needs a short design before coding
- breaks into V2-sized tasks

### V4 — System
Use for:
- subsystem
- large refactor
- architecture change

Typical shape:
- cross-cutting
- multi-stage
- easy to get wrong without boundaries

**Examples:**
- change a label, fix a typo, update a flag -> V1
- add one endpoint, fix one failing flow, add one validation path -> V2
- add a settings flow, build a notifications feature -> V3
- replace auth model, redesign sync pipeline, split a monolith area -> V4

When unsure, start lower and escalate quickly if the scope expands.

---

## Step 1: Say The Route In One Short Message

State the tier and the next move in one line.

Examples:
- "This is a V1 patch. I’ll make the change and verify it."
- "This is a V2 task. I’ll plan briefly, implement it, and run relevant tests."
- "This is a V3 feature. I’ll do a short design brief first, then break it into tasks."
- "This is a V4 system change. I’ll define boundaries and a staged execution plan before coding."

Do not turn classification into a meeting.

---

## Step 2: Load Repo Knowledge When It Pays Off

For V2, V3, and V4:
1. Check whether `.hypersonic/learned.md` exists
2. Read it before planning or coding
3. Apply the conventions and gotchas you find

For V1, skip it unless the task touches a known fragile area.

---

## Routing Rules

### V1 Patch
1. Make the change
2. Run the smallest useful verification
3. Summarize the result
4. Commit only if `auto_commit=true` or the user asked to ship

Do not create a plan. Do not invoke other skills unless the task stops being V1.

### V2 Task
1. State the plan in 1-3 sentences
2. If it is a bug, use `surgical-debug`
3. Implement the change
4. Add or update the core test unless `test_mode=none`
5. Use `tdd-engine` when the testing approach is not obvious
6. Run relevant verification
7. Commit only if `auto_commit=true` or the user asked to ship
8. Use `evolution-engine` if you learned something repo-specific

### V3 Feature
1. Use `architect` for a short design brief
2. Get a quick user checkpoint if the direction is not already clear
3. Break the work into V2-sized tasks
4. Execute task by task with tests
5. Use `code-review` before finalizing
6. Use `ship-it` when the user wants to finalize
7. Use `evolution-engine` if the work produced reusable repo knowledge

### V4 System
1. Use `architect` for an architecture brief with boundaries and sequence
2. Split the work into ordered units
3. Execute per unit, not as one giant build
4. Reuse V2 and V3 flows inside the units
5. Run integration verification after the units come together
6. Use `code-review`, then `ship-it`, then `evolution-engine`

---

## Specialized Skill Handoffs

Use:
- `rapid-build` for exploration, prototyping, or explicit speed over ceremony
- `surgical-debug` for diagnosis-first work
- `tdd-engine` when tests matter and the right level is not obvious
- `architect` when design needs to happen before coding
- `code-review` before shipping feature or system work
- `ship-it` when the user wants commit, PR, merge, or finalization
- `autopilot` when the user wants continuous unattended progress
- `evolution-engine` when you learned something worth keeping in repo memory

---

## Escalate Or De-Escalate Fast

Escalate when:
- the file count or blast radius grows
- the task needs design to avoid thrash
- hidden dependencies appear
- verification becomes broader than expected

De-escalate when:
- the change is smaller than it looked
- the design is already obvious
- the real work fits in a focused implementation pass

Say the tier change plainly. Do not silently change process.

---

## Anti-Patterns

**Process inflation.** Do not force a design brief on a one-line fix.

**Under-routing.** Do not treat a V4 system as if it were a patch.

**Verification amnesia.** Routing still needs the right level of proof.

**Process words instead of progress.** If the router keeps talking without moving to execution, it failed.

---

## Anti-Rationalization Table

| What you're thinking | What's actually true |
|---|---|
| "This is too simple to classify" | Classification takes seconds and avoids hours of wrong process. |
| "I’ll just start coding and see where it goes" | That is only valid if this is really rapid-build, not hidden V3 work. |
| "This needs a full design" | Maybe not. Many V2 tasks only need 1-3 sentences of approach. |
| "Let me just do it all at once" | Large work must be decomposed or it becomes harder to verify. |
| "The user said it’s simple, so it must be V1" | Users can underestimate scope. Classify by real blast radius. |

---

## Completion Checklist

Before you leave the router:

1. The tier is clear
2. The next move is clear
3. Repo knowledge was loaded if it mattered
4. The chosen workflow matches the real scope
5. `auto_commit`, `test_mode`, and `max_questions` are now shaping the next skill

The standard is simple: classify quickly, route correctly, and get into execution.
