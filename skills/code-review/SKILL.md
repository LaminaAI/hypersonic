---
name: code-review
description: "Use after implementation, before shipping, or when the user asks for review. Focus on correctness, regressions, verification gaps, failure handling, security, and performance. Skip style-only noise."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Code Review - Find Real Problems

Good review catches issues that hurt users, operators, reviewers, or the next engineer. Taste is secondary.

## Dials

- Higher `velocity`: timebox and lead with the riskiest areas.
- Higher `rigor`: include rollout, security, performance, and regression exposure.
- `test_mode`: enforce that verification scope before approval.
- `auto_commit`: small review fixes may be committed only when the workflow permits it.

## Review Order

Check in this order:

1. Does it work?
2. Can it fail badly?
3. Is the verification strong enough?
4. Will the next engineer understand it?
5. Are there security or performance traps?

Do not start with naming or formatting unless the name hides real behavior.

## Core Pass

### Correctness

- Compare the change to the stated requirement.
- Read the diff, not just the summary.
- Check edge cases created by the new behavior.
- Look for stale assumptions around data shape and state.

### Failure Handling

Check external boundaries:

- user input
- API calls
- database queries
- filesystem
- async jobs and queues

Ask what happens when the dependency fails, returns bad data, or is slow.

### Verification

Require fresh evidence before approval:

- `none`: direct behavior check plus risk-driven checks.
- `auto`: relevant checks for the changed area.
- `relevant`: targeted tests plus nearby regression coverage.
- `full`: full suite before final approval.

If tests are missing for risky behavior, that is a finding.

If the user asks for QA, match depth to `test_mode`:

- `auto`: critical and high-risk paths only.
- `relevant`: critical, high, and medium-risk paths.
- `full`: include polish, accessibility, and edge flows.

End with ship-readiness: ready, ready with caveats, or not ready.

### Maintainability

Look for confusing control flow, magic values, hidden coupling, and comments missing where the code would otherwise be hard to follow.

### Security And Performance

Scan for:

- missing auth on new entry points
- unsafe input handling
- secrets in code or logs
- N+1 queries
- unbounded reads or loops
- heavy sync work on hot paths

## Fix Or Report

Prefer fixing concrete issues when the fix is small and obvious.

When reporting, use:

```markdown
- [severity] [problem]. [why it matters]. [smallest good next action].
```

Lead with findings. If there are no findings, say so and mention any verification gap.

## Review Feedback

When acting on human, reviewer, or agent feedback:

1. Read all items before editing.
2. Clarify unclear items before partial implementation.
3. Verify each suggestion against this codebase.
4. Push back briefly when a suggestion is wrong, unused, or breaks existing behavior.
5. Implement one item at a time and test the changed path.

## Avoid

- approval without verification
- style-first review
- rewrite requests when a focused fix works
- vague "looks risky" comments
- blocking on taste
- trusting delegated-agent success reports without checking the diff
- performative agreement before checking feedback

The standard: find real risk, tighten the work, and keep shipping moving.
