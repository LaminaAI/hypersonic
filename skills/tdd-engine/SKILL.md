---
name: tdd-engine
description: "Use when writing or updating tests during implementation. Invoked by hypersonic-core during V2-V4 tasks, or directly when the user asks about testing strategy. Risk-calibrated TDD: test rigor matches the stakes of the code being written, not a blanket RED-GREEN-REFACTOR for everything."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# TDD Engine — Test What Matters, Skip What Doesn't

Testing is about confidence, not ceremony. The goal: after your tests pass, you and the user can ship without fear. Write the smallest test set that proves the change is safe. Prefer one strong test over a wide but shallow suite.

---

## How Parameters Change Behavior

- `velocity=high`: prefer the smallest useful test set and the shortest feedback loop
- `velocity=medium|low`: allow more coverage, more cleanup, and more explicit edge-case thinking
- `rigor=low`: test only the core behavior that must not break
- `rigor=medium`: use normal behavior coverage and nearby regression checks
- `rigor=high`: prefer test-first for risky logic and stronger verification before completion
- `max_questions=N`: ask at most `N` clarification questions; if the intent is mostly clear, test the most likely behavior and move
- `test_mode=none`: do not lead with automated tests unless the risk is high
- `test_mode=auto|relevant|full`: that setting defines the minimum verification scope before calling the work done
- `auto_commit=true`: if the work is verified and the workflow allows it, the tested change can be committed immediately
- `auto_commit=false`: do not treat passing tests as permission to commit without a ship signal

---

## The Rigor Spectrum

Not all code deserves the same testing rigor. Match your approach to the risk.

### High rigor — Test FIRST
Write the test -> watch it fail -> implement -> watch it pass.

Use for:
- Business logic (calculations, state machines, validation rules, discounts)
- Data integrity (money movement, billing, migrations)
- Security (auth checks, input sanitization, permissions)
- Bug fixes where the failure should never return

**Flow:**
1. Write exactly ONE failing test for the next behavior.
2. Run it. Watch it fail. Read the failure message - this confirms the test actually tests something.
3. Write the minimum code to make it pass. Not the "right" code - the minimum.
4. Run it. Watch it pass.
5. Refactor if the code is ugly. Tests must still pass.
6. Repeat for the next behavior.

The discipline: do NOT write the second test before the first passes. Do NOT write more implementation than the current test requires.

**Examples:**
- "Apply 20% discount for gold users without dropping below zero" -> write failing pricing test first
- "Reject payout when account is frozen" -> write failing policy test first

### Medium rigor — Test WITH
Implement and test in the same pass, interleaved.

Use for:
- API endpoints (request/response contracts)
- Database queries and integration points
- Complex UI interactions (multi-step forms, drag-and-drop)
- Multi-file changes where regressions are likely

**Flow:**
1. Understand the behavior.
2. Implement and add tests in the same pass.
3. Run the targeted test set before moving on.

**Examples:**
- "POST /sessions returns 401 for bad credentials" -> update handler and endpoint test together
- "Saving profile settings persists timezone and locale" -> update service + integration test together

### Low rigor — Test AFTER (or skip)
Use when the change is cheap to verify and low risk.

- Copy, styling, content, config
- Simple wiring between already-tested pieces
- Tiny refactors with no behavior change
- Prototypes and spikes (test when formalizing)

If you skip tests, still verify the real behavior manually.

### No test needed
- Renaming symbols
- Fixing typos
- Formatting-only changes
- Dependency bumps with no code-path change

---

## How to Write Good Tests

### The three questions
Every test should answer:
1. **Given** this starting state
2. **When** this action happens
3. **Then** this result occurs

If you can't fill in all three clearly, you don't understand the behavior well enough to test it.

### Test behavior, not internals

```typescript
// ❌ Tests implementation - breaks if you refactor internals
test('calls calculateDiscount with price and tier', () => {
  const spy = jest.spyOn(utils, 'calculateDiscount');
  applyPricing(order);
  expect(spy).toHaveBeenCalledWith(100, 'gold');
});

// ✅ Tests behavior - survives refactoring
test('gold tier gets 20% discount', () => {
  const order = createOrder({ price: 100, tier: 'gold' });
  const result = applyPricing(order);
  expect(result.finalPrice).toBe(80);
});
```

### One behavior per test (not one assertion)
Multiple `expect` calls are fine if they all verify one behavior. Don't split a coherent check across multiple tests just to look clean.

```typescript
// ✅ Multiple assertions, one behavior
test('creating a user returns complete user object', () => {
  const user = createUser({ name: 'Ada', email: 'ada@test.com' });
  expect(user.id).toBeDefined();
  expect(user.name).toBe('Ada');
  expect(user.createdAt).toBeInstanceOf(Date);
});
```

### Name tests as behavior descriptions
```text
✅ "returns 404 when session does not exist"
✅ "expires session after 30 minutes of inactivity"
✅ "rejects passwords shorter than 8 characters"
❌ "test session"
❌ "should work correctly"
❌ "handles edge case"
```

### Test at the right layer
Test at the lowest layer that proves the behavior well:
- Pure logic -> unit test
- Endpoint contract -> integration test
- Real user flow -> UI or end-to-end test

Don't repeat the same behavior across three layers unless each layer catches a different risk.

### Mock only real boundaries
Mock external systems (APIs, queues, databases, filesystem, time). Avoid mocking your own code unless there's no simpler path.

### Regression tests for bug fixes
Add the smallest test that fails before the fix and passes after it.

**Example:**
- Bug: duplicate webhook events create two invoices
- Test: process the same event twice and assert only one invoice is stored

---

## First 30 Seconds: Read the Codebase

Before writing anything, check:
- Where tests live: `__tests__/`, `*.test.*`, `*.spec.*`, `test/`
- Which runner is used: Jest, Vitest, pytest, etc.
- What helpers, fixtures, and factories already exist
- How the codebase names tests and structures setup

Match the existing conventions. Don't introduce a new testing pattern into an established codebase.

---

## Anti-Patterns

**Coverage worship.** 80% meaningful coverage beats 100% coverage where half the tests just check that functions exist.

**Mock everything.** Excessive mocking means you're testing your mocks, not your code.

**Testing the framework.** Don't test that React renders, Express routes, or Prisma queries. Test YOUR logic.

**Snapshot abuse.** Snapshots catch unintended serialization changes. They are NOT a substitute for behavioral tests.

**Test duplication across layers.** If a calculation is covered in a unit test, don't re-test it identically in integration and e2e.

---

## Anti-Rationalization Table

Agents are smart and will find excuses to skip testing discipline. If you catch yourself thinking any of these, stop - you're rationalizing.

| What you're thinking | What's actually true |
|---|---|
| "This is too simple to test" | Simple code breaks. The test takes 30 seconds. Write it. |
| "I'll write tests after" | Tests-after verify "what does this do?" Tests-first verify "what SHOULD this do?" Not the same. |
| "I already manually tested it" | Manual testing isn't repeatable. Next change breaks it silently. |
| "The tests would just duplicate the implementation" | Then the implementation is so simple it takes 30 seconds to test. Do it. |
| "Let me just get it working first, then add tests" | That's test-after. You're rationalizing. If the code is written, write the test NOW. |
| "The existing code doesn't have tests" | That's tech debt, not permission. New code gets tests. |
| "This is different because..." | It's not. |

If you wrote code before writing the test (for high-rigor code): **delete the code, write the test, watch it fail, then rewrite the code.** Don't "keep it as reference" - you'll copy-paste instead of implementing from the test's requirements.

---

## Async Tests: Condition-Based Waiting

Never use fixed delays.

```typescript
// ❌ Fragile - passes on fast machines, fails on slow CI
await sleep(1000);
expect(result).toBe(true);

// ✅ Condition-based - waits only as long as needed
await waitFor(() => expect(result).toBe(true), { timeout: 5000 });
```

For backend async operations:
```typescript
// ✅ Poll with condition
const result = await pollUntil(
  () => getResult(job.id),
  (r) => r.status === 'complete',
  { interval: 100, timeout: 5000 }
);
```

If a test is flaky: it's not "sometimes failing," it has a race condition. Fix the race condition, don't add retries.

---

## When to Run Tests

- `none`: no automated tests unless the change is high risk
- `auto`: run the relevant tests for the changed area
- `relevant`: run targeted tests plus nearby regression coverage
- `full`: run the full suite before completion

If the suite is too slow or broken, say so clearly. Do not pretend the verification happened.

---

## Completion Checklist

Before declaring any task done:

1. **Run the tests you decided were required.** Not "I think they pass." Actually run them. Read the output.
2. **Verify the actual behavior.** UI change? Does it render correctly? API? Does the endpoint return the right data?
3. **Check for regressions.** Run the broader suite, not just your new tests.
4. **Read your diff.** Look for: debug code, console.logs, hardcoded values, TODO comments, files you didn't mean to change.

The standard is simple: prove the change works with the fastest evidence that is strong enough.

---

## Senior Engineer Guardrails

- Do not add a large test harness for a tiny change.
- Do not skip a cheap regression test for risky logic.
- Do not leave flaky waits or random timeouts in the suite.
- Do not claim a test is valuable unless it would catch a real failure.
- If a change is not worth testing, state why in one line and verify manually.
