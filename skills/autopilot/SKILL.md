---
name: autopilot
description: "Use when the user wants the agent to keep working without waiting for more input. Autopilot is always infinite. Phase 1 completes the given plan in order. Phase 2 keeps improving the repo toward the vision with one meaningful, verified change per iteration. Resume from `.hsonic-autopilot-state.md`, keep local history in `.hsonic-autopilot-log.md`, and continue until the human interrupts."
parameters:
  velocity: high
  rigor: medium
  max_questions: 0
  test_mode: auto
  auto_commit: true
---

# Autopilot — Infinite, But Not Aimless

Autopilot is for long unattended runs. The human is away. You do not wait for approval. You decide, verify, checkpoint, and continue.

Move continuously, but do not confuse motion with progress. Prefer fewer meaningful iterations over many shallow ones.

---

## How Parameters Change Behavior

- `velocity=high`: prefer smaller meaningful iterations, shorter checkpoints, and faster keep-or-discard decisions
- `velocity=medium|low`: allow deeper planning, larger iterations, and more deliberate backlog refreshes
- `rigor=low`: keep checkpoints and verification minimal but honest
- `rigor=medium`: use balanced baselines, balanced verification, and balanced iteration depth
- `rigor=high`: use stronger baselines, broader verification, and avoid cosmetic or weak iterations
- `max_questions=0`: do not ask the human anything during autopilot
- `test_mode=none`: only keep a change if direct evidence proves it and the risk is acceptable
- `test_mode=auto|relevant|full`: that verification depth is the minimum before keeping an iteration
- `auto_commit=true`: kept iterations must commit so the loop can resume cleanly

Autopilot does not support "work forever but never commit." That breaks resumability.

---

## Local Hypersonic Files

Use Hypersonic-prefixed local files for autopilot memory:

- `.hsonic-autopilot-state.md` -> current checkpoint for resume
- `.hsonic-autopilot-log.md` -> local run history
- `.hypersonic/learned.md` -> repo knowledge shared across sessions

These are working files. They should not be committed unless the human explicitly asks.

Legacy support:
- If `.hsonic-autopilot-state.md` does not exist but `.autopilot-state.md` does, treat it as the old checkpoint
- On the next checkpoint, write to `.hsonic-autopilot-state.md`

---

## Resume Protocol

Before doing anything else:
1. Check `.hsonic-autopilot-state.md`
2. If missing, check legacy `.autopilot-state.md`
3. Read `.hypersonic/learned.md` if it exists
4. Read `.hsonic-autopilot-log.md` if it exists

If a checkpoint exists:
1. Read it fully
2. Resume from its `Next action`
3. Do not restart discovery
4. Do not rebuild the plan from scratch
5. Do not ask the human for input

Say only:
> Resuming autopilot. Picking up at [task or iteration].

If no checkpoint exists:
1. Read `.hypersonic/learned.md` if present
2. Start from the vision and plan below

---

## Two Phases, Always In Order

### Phase 1 — finish the plan
If the human gave a plan file:
1. Read the whole plan before starting
2. Execute tasks in order
3. Keep one commit per completed task when possible
4. After each task: verify -> commit -> checkpoint -> log -> continue
5. If a task is blocked, record the blocker clearly and move to the next task
6. Return to blocked tasks before declaring Phase 1 done

Do not jump to Phase 2 early because a later task looks more interesting.

### Phase 2 — infinite improvement
When the plan is complete, switch to a loop:
1. Choose the highest-value next improvement tied to the vision
2. Capture a baseline or current failure
3. Make one meaningful change
4. Verify the result
5. Keep it with a commit, or discard it cleanly
6. Update checkpoint and log
7. Repeat

---

## What Counts As A Good Iteration

Each iteration should have all of these:
- a clear reason it matters to the vision
- a bounded scope that can be verified now
- evidence before and after the change
- a keep-or-discard decision at the end

Good iterations:
- add missing validation for a risky endpoint
- close a real test gap in business logic
- remove a hot-path N+1 query and measure improvement
- simplify a brittle subsystem after tests are in place

Bad iterations:
- random renames with no payoff
- cosmetic churn across many files
- refactors without verification
- tiny commits that do not change quality, safety, or speed

---

## Plan Before Acting In Phase 2

Do not improvise every loop from zero. Keep a short ranked backlog in the checkpoint:
- 3-7 next candidate improvements
- why each one matters
- expected impact
- how you will verify it

Refresh this backlog when:
- Phase 2 starts
- the current top item is done
- two iterations in a row produce weak results
- new evidence changes priorities

This keeps the loop strategic without slowing it down.

---

## Improvement Priority Stack

Use this order unless the vision clearly points elsewhere:
1. Correctness
2. Reliability
3. Tests for risky behavior
4. Performance
5. Code quality that unlocks future work
6. Developer experience

Do not spend three iterations polishing T5 or T6 while T1-T3 issues are still obvious.

---

## Checkpoint After Every Kept Iteration

Update `.hsonic-autopilot-state.md` after every commit.

Minimum checkpoint shape:

```markdown
# Hypersonic Autopilot State

## Vision
[human vision]

## Plan file
[path or none]

## Current phase
Phase 1 | Task 4 of 11

## Next action
[the exact next task or next iteration]

## Last completed change
[commit hash] [one-line summary]

## Open blockers
- [blocker or none]

## Ranked next candidates
1. [item] — [why it matters] — [how to verify]
2. [item] — [why it matters] — [how to verify]
3. [item] — [why it matters] — [how to verify]

## Critical repo knowledge
- [important gotcha]
- [important convention]

## Resume notes
[2-4 lines the next session should know]
```

Keep it dense. The checkpoint is for fast resume, not storytelling.

---

## Logging

Write a short local history to `.hsonic-autopilot-log.md`.

Log:
- task completion in Phase 1
- kept and discarded iterations in Phase 2
- important decisions
- blockers worth remembering

Keep entries short. The log is a timeline, not a diary.

---

## Verification Standard

Autopilot is not allowed to declare progress without evidence.

Before keeping a change:
1. Run the relevant tests or checks
2. Verify the behavior you changed
3. Check the diff for accidental churn
4. Confirm the result is better than the baseline

If the change does not hold up, discard it.

---

## Handling Blockers

Do not stop the loop because one path is blocked.

When blocked:
1. Try the obvious resolution path
2. If still blocked, record the blocker
3. Move to the next best task or improvement
4. Revisit later if new work unblocks it

---

## When Progress Gets Shallow

If the last two iterations feel cosmetic or low-yield, stop and reset the loop:
1. Re-read the vision
2. Re-read `.hypersonic/learned.md`
3. Re-scan the code for high-risk areas, weak tests, error paths, or hotspots
4. Refresh the ranked backlog
5. Pick a stronger item

Autopilot should get deeper over time, not noisier.

---

## Anti-Patterns

**Activity without value.** A lot of commits does not equal good progress.

**Infinite replanning.** Planning is only useful if it tightens the next iteration.

**Checkpoint neglect.** If the session dies and the next session cannot resume quickly, autopilot failed.

**Verification theater.** "This should help" is not evidence.

**Human interruption seeking.** Autopilot is unattended work. Do not bounce decisions back to the user.

---

## Anti-Rationalization Table

| What you're thinking | What's actually true |
|---|---|
| "This iteration is small, I can skip the checkpoint" | That is how long unattended runs lose continuity. |
| "Let me make a few cleanup commits while I think" | Cosmetic churn is not progress. Pick a stronger item. |
| "I’ve already improved a lot, it’s fine to stop here" | Autopilot stops only when the human interrupts. |
| "This probably improved things" | Baseline it, verify it, then decide. |
| "I should ask the user before continuing" | No. Make the best local decision and continue. |

---

## Keep-Iteration Checklist

Before you keep any iteration:

1. The change matters to the vision
2. The baseline and result are both clear
3. The required verification depth from `test_mode` is done
4. The checkpoint and log are updated
5. The next iteration is obvious

The standard is simple: keep shipping real improvements, leave strong checkpoints, and make the next session smarter than this one.
