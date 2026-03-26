---
name: code-review
description: "Use after implementation, before shipping, or when the user explicitly asks for a review. Focus on bugs, regressions, missing verification, weak failure handling, and risky changes. Skip style nitpicks and low-value commentary."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Code Review — Find Real Problems

Good review is not about taste. It is about catching things that will actually hurt users, operators, or the next engineer.

Review quickly, but not lazily. Spend time where failure is expensive.

---

## How Parameters Change Behavior

- `velocity=high`: timebox the review and focus on high-signal issues first
- `velocity=medium|low`: spend more time on failure modes, maintainability, and edge cases
- `rigor=low`: check core correctness and obvious risks
- `rigor=medium`: also check failure handling, clarity, and test gaps
- `rigor=high`: also check rollout risk, security basics, performance traps, and regression exposure
- `max_questions=N`: ask at most `N` review questions; if unsure, state the risk and best recommendation
- `test_mode=none`: manual and targeted verification may be enough unless the change is risky
- `test_mode=auto|relevant|full`: the review should enforce that verification scope before approval
- `auto_commit=true`: if review fixes are small, verified, and clearly correct, commit them without another ship prompt
- `auto_commit=false`: fix issues if needed, but do not commit unless the user asks to ship

---

## The Review Order

Check in this order:
1. Does it work?
2. Can it fail badly?
3. Will the next engineer understand it?
4. Are there obvious performance or security traps?

Do not start with naming or formatting.

---

## The Core Review Pass

### 1. Does it work?
- Run the required verification for `test_mode`
- Check the changed behavior directly
- If the new behavior has no meaningful verification, that is a finding

### 2. Can it fail badly?
Check external boundaries:
- API calls
- database queries
- filesystem
- user input
- async flows

Ask:
- What happens when it fails?
- What happens when it returns bad data?
- What happens when it is slow?

### 3. Will the next engineer understand it?
Look for:
- confusing names
- surprising control flow
- magic values with no meaning
- comments missing only where the code would otherwise be hard to follow

### 4. Are there obvious performance or security traps?
Look for:
- N+1 queries
- unbounded reads
- heavy sync work in hot paths
- unsafe input handling
- missing auth on new entry points
- secrets in code

---

## Fix vs Report

Prefer fixing concrete problems over writing long review notes.

If you need to report instead of fix:
1. say what is wrong
2. say why it matters
3. say the smallest good next action

Example:
- "The new endpoint accepts unauthenticated writes. Guard it with the existing session middleware before shipping."

---

## Examples

### High-signal finding
- feature says "401 on bad credentials" but tests only cover success
  -> review finding: missing negative-path verification

### Low-value noise
- "I would personally rename `items` to `records`"
  -> not a real review issue unless the name is actually misleading

---

## Anti-Patterns

**Style-first review.** Style is not the primary risk.

**Approval without verification.** "Looks good" is not a review result.

**Architecture overreaction.** Do not ask for a rewrite when a focused fix is enough.

**Review-document theater.** Fix the problem or report it clearly. Do not produce ceremony.

**Blocking over preference.** Risk blocks shipping. Taste does not.

---

## Anti-Rationalization Table

| What you're thinking | What's actually true |
|---|---|
| "The tests passed, so review is unnecessary" | Passing tests do not prove failure handling, clarity, or rollout safety. |
| "This is just style" | If it causes confusion, it may be a real maintainability problem. If not, skip it. |
| "I don’t need to run anything, the code looks right" | Review without verification is just opinion. |
| "I found one issue, that’s enough" | Keep scanning the highest-risk areas in order. |
| "This should be rewritten from scratch" | Usually false. Prefer the smallest fix that removes the risk. |

---

## Completion Checklist

Before you call the review done:

1. The required verification depth is complete
2. The biggest risks were checked first
3. Real issues were fixed or clearly reported
4. No style-only noise is leading the review
5. `auto_commit` was respected

The standard is simple: find real problems, tighten the work, and keep shipping moving.
