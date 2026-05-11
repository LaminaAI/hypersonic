---
name: autopilot
description: "Use when the user wants the agent to keep working without waiting for input. Autopilot runs continuously: finish the given plan first, then keep making one meaningful verified improvement per iteration until interrupted."
parameters:
  velocity: high
  rigor: medium
  max_questions: 0
  test_mode: auto
  auto_commit: true
---

# Autopilot - Continuous, Not Aimless

Autopilot is for unattended work. Do not ask the human for input. Decide, verify, checkpoint, commit useful changes, and continue.

## Dials

- Higher `velocity`: smaller iterations and faster keep/discard decisions.
- Higher `rigor`: stronger baselines, broader verification, fewer cosmetic changes.
- `max_questions=0`: never block on a question.
- `test_mode`: verification floor before keeping an iteration.
- `auto_commit=true`: kept code changes must commit so progress can resume cleanly.

## Local Files

- `.hsonic-autopilot-state.md`: current checkpoint for resume
- `.hsonic-autopilot-log.md`: local run history
- `.hypersonic/learned.md`: repo knowledge shared across sessions

State and log files are working files. Do not commit them unless the user explicitly asks.

Legacy: if `.hsonic-autopilot-state.md` is missing but `.autopilot-state.md` exists, read it once and write future checkpoints to `.hsonic-autopilot-state.md`.

## Resume First

Before new work:

1. Read `.hsonic-autopilot-state.md` if present.
2. Otherwise read legacy `.autopilot-state.md` if present.
3. Read `.hypersonic/learned.md` if present.
4. Read `.hsonic-autopilot-log.md` if present.

If a checkpoint exists, resume from `Next action`. Do not restart discovery or rebuild the plan from scratch.

Say only: "Resuming autopilot. Picking up at [task or iteration]."

## Phase 1 - Finish The Given Plan

If the human gave a plan file:

1. Read the whole plan.
2. Execute tasks in order.
3. Keep one commit per completed task when possible.
4. After each task: verify -> commit -> checkpoint -> log -> continue.
5. If blocked, record the blocker and move to the next task.
6. Revisit blockers before declaring Phase 1 complete.

Do not jump to Phase 2 because a later idea looks more interesting.

## Phase 2 - Infinite Improvement

When the plan is complete, loop:

1. Choose the highest-value next improvement tied to the vision.
2. Capture a baseline or current failure.
3. Make one bounded change.
4. Verify the result.
5. Keep with a commit, or discard cleanly.
6. Update checkpoint and log.
7. Repeat until interrupted.

## Good Iterations

A kept iteration needs:

- clear reason it matters to the vision
- bounded scope
- evidence before and after
- verification output read by the agent
- a next action recorded

Priority order unless the vision says otherwise:

1. correctness
2. reliability
3. tests for risky behavior
4. performance
5. code quality that unlocks future work
6. developer experience

Avoid cosmetic churn while correctness or test gaps are obvious.

## Checkpoint Shape

Update after every kept iteration:

```markdown
# Hypersonic Autopilot State

## Vision
[human vision]

## Current Phase
[Phase 1 task N | Phase 2 iteration N]

## Next Action
[exact next task or iteration]

## Last Completed Change
[commit hash] [one-line summary]

## Open Blockers
- [blocker or none]

## Ranked Next Candidates
1. [item] - [why it matters] - [how to verify]
2. [item] - [why it matters] - [how to verify]
3. [item] - [why it matters] - [how to verify]

## Resume Notes
[2-4 dense lines]
```

Keep the checkpoint dense. It is for fast resume, not storytelling.

## Verification Standard

Before keeping a change:

1. Run the required checks for `test_mode`.
2. Verify the changed behavior directly when possible.
3. Check the diff for accidental churn.
4. Confirm the result is better than the baseline.

If the change does not hold up, discard it and log why.

## Safety Brake

Autopilot is continuous, but it must not churn.

Pause the improvement loop, checkpoint, and switch to re-ranking candidates when:

- two iterations in a row fail verification
- the ranked candidates no longer have a clear vision payoff
- the next best change would be broad, destructive, or hard to verify unattended
- the working tree contains unrelated user changes that would be touched
- the current work requires human product judgment, credentials, or external approval

After re-ranking, continue only with a bounded, verifiable candidate. If none exists, checkpoint the blocker and keep monitoring for a safe next action instead of making cosmetic commits.

## Avoid

- activity without value
- infinite replanning
- skipping checkpoints
- keeping unverified changes
- tiny commits with no quality, safety, speed, or vision payoff
- asking the human what to do next

The standard: one meaningful verified improvement at a time, forever until interrupted.
