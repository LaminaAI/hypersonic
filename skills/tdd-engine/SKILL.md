---
name: tdd-engine
description: "Use when writing or updating tests during implementation. Apply risk-calibrated TDD: test-first for risky behavior, test-with for normal tasks, and manual verification for low-risk changes."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# TDD Engine - Prove What Matters

Testing is about confidence, not ceremony. Write the smallest test set that proves the change is safe.

## Dials

- Higher `velocity`: shortest useful feedback loop.
- Higher `rigor`: test earlier, cover more failure modes, verify broader.
- `test_mode`: `none` allows manual proof for low-risk changes; `full` means the full suite is part of done.
- `auto_commit`: tests passing never overrides the shipping rules.

## Rigor Levels

### Test First

Use for:

- business rules and calculations
- auth, permissions, billing, money, migrations
- state machines and data integrity
- bug fixes that must never regress

Loop:

1. Write one failing test for the next behavior.
2. Run it and confirm the failure is the expected failure.
3. Write the minimum code to pass.
4. Run it and confirm it passes.
5. Refactor only while the test stays green.

If the test did not fail first, it did not prove the missing behavior.

### Test With

Use for:

- API contracts
- database queries
- complex UI interactions
- multi-file behavior where regressions are plausible

Implement and test in the same pass, then run the targeted test set before moving on.

### Test After Or Manual

Use for:

- copy, styling, content, config
- simple wiring between already-tested pieces
- tiny refactors with no behavior change
- prototypes that are not being formalized

Still verify the real behavior once.

## Good Test Shape

Every test should answer:

1. Given this starting state
2. When this action happens
3. Then this result occurs

Prefer behavior over internals. Mock external systems, time, network, filesystem, queues, and databases when needed. Avoid mocking your own code unless there is no simpler boundary.

## Layer Choice

Test at the lowest layer that proves the behavior well:

- pure logic -> unit test
- endpoint contract -> integration test
- user flow -> UI or end-to-end test

Do not repeat the same assertion across layers unless each layer catches a different failure.

## Async Tests

Use condition-based waiting, not fixed sleeps.

```typescript
await waitFor(() => expect(result).toBe(true), { timeout: 5000 });
```

If a test needs retries or arbitrary delays, find the race and fix it.

## Before Writing Tests

Check the codebase:

- test file naming and location
- runner and command
- existing fixtures, factories, and helpers
- local style for assertions and setup

Match the existing pattern.

## Run Scope

- `none`: manual proof unless risk forces automation.
- `auto`: relevant checks for the changed area.
- `relevant`: targeted tests plus nearby regression coverage.
- `full`: full suite before completion.

If checks are too slow or already broken, say that clearly and report what you did run.

## Avoid

- coverage numbers without meaningful assertions
- snapshots as a substitute for behavior checks
- testing framework behavior instead of app behavior
- broad harnesses for tiny changes
- flaky waits, sleeps, and random retries
- claiming tests pass without fresh output

The standard: prove the behavior with the fastest evidence strong enough for the risk.
