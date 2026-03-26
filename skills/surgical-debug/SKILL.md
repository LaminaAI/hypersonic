---
name: surgical-debug
description: "Use when fixing a bug, investigating a failure, or diagnosing unexpected behavior. Evidence first: read before guessing, reproduce before fixing, verify before declaring victory."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Surgical Debug — Evidence First, Always

Most debugging time is wasted on wrong guesses. The fastest path to a real fix is: evidence -> reproduction -> root cause -> targeted fix -> verification.

Fix the smallest thing that proves the root cause. Do not mix debugging with cleanup, redesign, or speculative refactors.

---

## How Parameters Change Behavior

- `velocity=high`: timebox diagnosis, get to a reproduction quickly, and avoid side quests
- `velocity=medium|low`: spend more time on boundary tracing, instrumentation, and deeper failure analysis
- `rigor=low`: find the root cause and verify the main fix path
- `rigor=medium`: also check nearby regressions and edge-case failure handling
- `rigor=high`: require stronger reproduction, broader verification, and more careful blast-radius thinking
- `max_questions=N`: ask at most `N` clarification questions; if the evidence is already in the repo or logs, do not ask
- `test_mode=none`: verify the reproduction and direct fix path, plus any risk-driven checks
- `test_mode=auto|relevant|full`: that verification depth becomes the minimum after the fix
- `auto_commit=true`: if the bug is fixed and verified, commit the fix without another ship prompt
- `auto_commit=false`: do not commit unless the user asks to ship or finalize

---

## The Debugging Flow

### 1. Read the evidence first
Before changing code:
1. Read the full error, stack trace, logs, or wrong output.
2. Read the code at the failure site.
3. State what you know in one sentence.

Example:
- "The API returns 500 in `createSession` when Redis is unavailable."

If you cannot state the failure clearly, you have not read enough yet.

### 2. Reproduce it
Before you fix anything:
- Run the failing test
- Trigger the bug manually
- Or write the smallest repro that fails

If you cannot reproduce it, you cannot prove the fix.

### 3. Isolate the root cause
Form at most three hypotheses. For each one, define one check that will confirm or kill it.

Good:
- "Hypothesis: token parsing fails on empty header -> inspect parsed value at request boundary"

Bad:
- changing several files and hoping one helps

### 4. Fix the root cause
Change the minimum code that solves the actual cause.

Checklist before editing:
- I know the root cause, not just the symptom
- My fix addresses the cause, not a workaround
- I am changing the minimum necessary code
- I am not mixing unrelated cleanup into the fix

### 5. Verify it
Use `test_mode` as the floor:
- rerun the reproduction
- run the required verification scope
- check the real user or system path once

If the bug crosses multiple layers, verify the full path once.

---

## Debugging Techniques That Actually Work

### Read before guessing
Most errors tell you more than you think if you actually read them.

### Check boundaries
For multi-layer bugs, inspect what enters and exits each boundary:
- frontend -> API
- API -> service
- service -> database
- worker -> queue

The bug usually lives where the data changes shape incorrectly.

### Instrument with purpose
Add logging or debug output only to answer a specific hypothesis.

### One change at a time
If you change three things and the bug goes away, you still do not know the cause.

### Keep the blast radius small
Debug fixes should be surgical unless the root cause is architectural.

---

## Examples

### Simple bug
- "Login fails when password has trailing spaces"
  -> reproduce with one failing request, isolate normalization bug, fix input handling, rerun login tests

### Multi-layer bug
- "Webhook succeeds but invoice is never created"
  -> trace request receipt, queue enqueue, worker execution, DB write, find the broken boundary, fix only that boundary

---

## Anti-Patterns

**Shotgun debugging.** Changing multiple things at once and hoping one works.

**Guess-first debugging.** "It’s probably a race condition" is not evidence.

**Fix-and-pray.** Making a change without first reproducing the bug.

**Scope creep during debugging.** Fix the bug first. Refactor later if needed.

**Explaining without checking.** "Probably" is not a debugging result.

---

## Anti-Rationalization Table

| What you're thinking | What's actually true |
|---|---|
| "I’m pretty sure it’s X, let me just fix it" | Pretty sure means guessing. Read the evidence first. |
| "I’ll add some logging and see" | Good instinct, but read the existing error output first. |
| "The fix is obvious, I don’t need to reproduce it" | If you cannot reproduce it, you cannot verify the fix. |
| "Let me refactor this while I’m fixing the bug" | No. Fix the bug, verify it, then refactor separately. |
| "I fixed it" | Did you rerun the repro? Did you run the required checks? |

---

## When To Escalate

Reclassify through `hypersonic-core` when:
- the "bug" is actually missing behavior
- the fix spans multiple subsystems
- the root cause is architectural
- the verification path becomes broad enough that this is really feature work

---

## Completion Checklist

Before you call the bug fixed:

1. The failure was reproduced or directly observed
2. The root cause is clear
3. The fix is narrow and targeted
4. The required verification depth from `test_mode` is done
5. `auto_commit` was respected

The standard is simple: prove the failure, fix the cause, and prove the fix.
