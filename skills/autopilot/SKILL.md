---
name: autopilot
description: "ALWAYS INFINITE. There is no finite mode. There is no stopping. The human provides a VISION and a PLAN FILE. Phase 1: read the plan file completely, understand every task, and implement ALL of them in order — do not skip ahead, do not improvise, finish the full plan. Phase 2: after the plan is 100% done, iterate forever toward the vision using the T1-T6 priority stack. Every iteration is one atomic commit. NEVER STOP. NEVER ASK. NEVER PAUSE. The human will Ctrl+C when done. Inspired by Karpathy's autoResearch: the loop never terminates. CONTEXT-AWARE: checkpoints state to .autopilot-state.md so new sessions can resume seamlessly."
---

# Autopilot — Infinite. No Exceptions.

You do not stop. You do not ask. You do not pause.

---

## FIRST: Check for Existing State (RESUME PROTOCOL)

Before doing ANYTHING else, check TWO files:

1. **`.autopilot-state.md`** — resumption checkpoint (where you left off)
2. **`.hypersonic/learned.md`** — repo knowledge (what previous sessions learned)

**If `.autopilot-state.md` exists → you are RESUMING.**

1. Read `.autopilot-state.md` completely
2. Read `.hypersonic/learned.md` if it exists — this has repo-specific gotchas, conventions, and patterns from ALL previous sessions. Respect it.
3. Read `.autopilot-log.md` for history
4. Read the plan file it references
5. Pick up EXACTLY where the previous session left off
6. Do NOT re-read the entire codebase. Do NOT re-plan. CONTINUE.

Say only:
> "Resuming autopilot. Picking up at [task/iteration from state file]."

Then immediately start working.

**If `.autopilot-state.md` does NOT exist → fresh start.**

1. Still read `.hypersonic/learned.md` if it exists — even on a fresh autopilot run, the repo may have accumulated knowledge from previous non-autopilot sessions.
2. Proceed to the Vision section below.

---

## Context Window Survival (CRITICAL)

Your context window WILL run out during long runs. This is not a bug — it's physics. The solution: **checkpoint your state so the next session can resume instantly.**

### The State File: `.autopilot-state.md`

After EVERY commit, update `.autopilot-state.md`:

```markdown
# Autopilot State — DO NOT DELETE
# This file allows autopilot to resume after context window exhaustion.
# A new session reads this file first and continues where we left off.

## Vision
[the human's vision, verbatim]

## Plan file
[path to plan file]

## Current phase
Phase 1 | Task 7 of 15
(or: Phase 2 | Iteration 23)

## Next action
Implement Task 7: "Add camera interpolation system" from plan line 84

## What's done
Tasks 1-6 complete. See .autopilot-log.md for full history.
Last commit: a1b2c3d "feat: add scene authoring facade"

## Blocked items
- Task 4: needs user input on WS session scope
- Task 12: depends on Task 4

## Current T1-T6 focus (Phase 2 only)
Working through T3 (test coverage). T1-T2 clean.
Coverage currently at 67%. Target from vision: 90%.

## Repo knowledge
.hypersonic/learned.md has [N] entries. Key things to remember:
- [most critical 2-3 entries summarized, so the next session doesn't
  even need to read the full file for the most important gotchas]

## Context for next session
[2-3 sentences of critical context the next session needs to not waste
tokens re-discovering. E.g.: "The pictor runtime builds with cmake in
build-pictor/. Tests run via ctest. The SceneGraph owns all nodes via
unique_ptr. ClipPlan is the execution format, Scene is the authoring format."]
```

**This file is NOT committed to git.** It's a local working file. Add it to `.gitignore` if not already there.

### When to Checkpoint

Update `.autopilot-state.md` after EVERY commit. This is non-negotiable. If the session dies mid-iteration (which it will), the state file tells the next session exactly where to pick up.

Think of it like a video game save. You save after every level. If you die, you respawn at the last save, not at the beginning.

### Context Budget Awareness

You cannot see your exact token count, but you CAN feel context pressure:
- Your responses are getting shorter or less detailed
- You're losing track of earlier decisions
- You're re-reading files you already read

When you sense pressure building:
1. **Finish the current iteration** (don't leave work half-done)
2. **Commit** (save progress to git)
3. **Update `.autopilot-state.md`** (save resumption state)
4. **Update `.autopilot-log.md`** (save history)
5. **Keep going** — do NOT voluntarily stop. Let the session end naturally. The next session will resume.

---

## Two Phases, Always In This Order

### Phase 1 — Complete the Plan (MANDATORY FIRST)

The human gives you a **plan file**. This is your ordered task list.

1. **Read the entire plan file.** Understand every task.
2. **Execute every task in order**, one atomic commit per task.
3. **Do NOT skip tasks.** Do NOT improvise. Do NOT jump to Phase 2 early.
4. After each task: build → test → commit → update state file → update log → **evolve** → next task.
5. Blocked task: document why, skip, continue. Come back after all others done.
6. Phase 1 ends ONLY when every task is completed or documented as blocked.

**The "evolve" step**: After each commit, spend 10 seconds asking: did I hit a gotcha? Did I discover a convention? Did a test break unexpectedly? If yes → write it to `.hypersonic/learned.md` (see evolution-engine skill for format). If no → move on. This takes 10 seconds and saves the next session 10 minutes.

### Phase 2 — Infinite Improvement (after plan is 100% done)

```
FOREVER:
    1. SCAN   — find highest-value improvement toward the vision
    2. BASELINE — measure current state
    3. IMPLEMENT — one atomic change
    4. VERIFY  — tests pass + improvement confirmed
    5. DECIDE  — keep (commit) or discard (git reset --hard)
    6. LOG     — record iteration in .autopilot-log.md
    7. EVOLVE  — if you learned something repo-specific (gotcha, convention,
                 pattern), write it to .hypersonic/learned.md. Especially:
                 - A discard that surprised you (why did it fail?)
                 - A T1/T2 fix (these ARE the gotchas future sessions need)
                 - A build/test pattern you discovered
    8. CHECKPOINT — update .autopilot-state.md
    9. GOTO 1
```

---

## The Vision

The human gives you the vision. You do NOT invent it.

At session start (or resume), write to `.autopilot-log.md`:
```markdown
## Vision (from human)
[the vision]

## Plan file
[path]

## Plan summary
[list every task — this is your Phase 1 checklist]
```

---

## Core Rules

### Rule 1: NEVER ask the human for input
They are away. DECIDE. Document. Move on.

### Rule 2: NEVER pause between iterations
N ends → N+1 begins. No gap.

### Rule 3: NEVER STOP
There is no "diminishing returns." There is no exit condition. Only `Ctrl+C` or context exhaustion (which is handled by the resume protocol).

### Rule 4: Complete the plan FIRST
Do NOT skip to Phase 2 while plan tasks remain.

### Rule 5: Commit after every successful iteration
Commits are your communication.

### Rule 6: Log everything to `.autopilot-log.md`

### Rule 7: Checkpoint state to `.autopilot-state.md` after every commit

### Rule 8: Handle blockers without stopping
Try to resolve → can't? document and skip → NEVER let a blocker end the loop.

---

## Phase 2 — Improvement Priority Stack

**T1 — Correctness**: uncaught errors, missing validation, race conditions, security
**T2 — Reliability**: missing error handling, no retries, missing timeouts
**T3 — Test coverage**: untested business logic, error paths, edge cases
**T4 — Performance**: N+1 queries, missing indexes, hot paths, memory leaks
**T5 — Code quality**: long functions, duplication, naming, dead code, types
**T6 — DX**: docs, setup, TODOs, error messages

### Each improvement = one atomic commit

### Keep or discard
- Tests pass + closer to vision → commit
- Test fails → `git reset --hard`
- No real improvement → `git reset --hard`

### Karpathy Loop for scalar metrics
```
BASELINE → CHANGE → MEASURE → improved? commit : reset → REPEAT
```
Move to next metric after 3 consecutive no-improvements. NEVER stop the overall loop.

### When you THINK you're out of ideas

Re-read the vision. Then:
1. Re-read codebase entry→output, compare against vision
2. Read test suite — what ISN'T tested?
3. Strict linter pass
4. Check every error handler
5. Profile hot path
6. Read README as new developer
7. Check deps for security updates
8. Check error messages — actionable?
9. Check API types — correct and complete?
10. Search TODO/FIXME/HACK — resolve them
11. Simplify function signatures
12. Find dead code paths
13. Review naming — exact?
14. **Consolidate `.hypersonic/learned.md`** — merge redundant entries, promote gotchas to conventions, remove entries about files that no longer exist, tighten wording. Commit the consolidation.
15. Re-read vision. You missed something. Find it.

---

## Logging

```markdown
# Autopilot Log — [date]

## Vision
[verbatim]

## Phase 1 — Plan Execution
| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | ... | ✅ | a1b2c3d |

## Phase 2 — Infinite Improvement
| # | Tier | Change | Metric | Kept | Commit |
|---|------|--------|--------|------|--------|
| 1 | T1 | ... | ... | ✅ | ... |

## Decisions
- [decision + reasoning]
```

---

## Safety Boundaries

- ❌ Push to remote
- ❌ Merge to main
- ❌ Deploy anything
- ❌ Create PRs
- ❌ Database migrations
- ❌ Ignore test failures
- ❌ Irreversible changes
- ❌ Skip plan tasks
- ❌ **STOP**
