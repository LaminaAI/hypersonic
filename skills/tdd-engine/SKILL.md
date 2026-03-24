---
name: tdd-engine
description: "Use when writing or updating tests during implementation. Invoked by hypersonic-core during V2-V4 tasks, or directly when the user asks about testing strategy. This skill provides practical TDD — not dogmatic RED-GREEN-REFACTOR for everything, but a risk-calibrated approach where test rigor matches the stakes of the code being written."
---

# TDD Engine — Test What Matters, Skip What Doesn't

Testing is about confidence, not ceremony. The goal: after your tests pass, you and the user can ship without fear. This means testing behavior that matters, not chasing coverage numbers.

## The testing spectrum

Not all code deserves the same testing rigor. Match your approach to the risk:

### High rigor — Test FIRST (write test → watch it fail → implement → watch it pass)
Use for:
- Business logic (calculations, transformations, state machines, validation rules)
- Data processing (parsing, serialization, aggregation)
- Security-adjacent code (auth checks, input sanitization, permissions)
- Anything where a bug means data loss, security hole, or wrong money

### Medium rigor — Test WITH (implement and test in the same pass, interleaved)
Use for:
- API endpoints (test the request/response contract)
- Integration points (database queries, external API calls)
- Complex UI interactions (multi-step forms, drag-and-drop)

### Low rigor — Test AFTER (or don't test at all)
Use for:
- Configuration files
- Static content, copy changes
- Simple UI components with no logic (pure display)
- Glue code that just connects tested pieces
- Prototypes and spikes (test when formalizing)

### No test needed
- Renaming a variable
- Updating a dependency version
- Fixing a typo in a string
- Changing CSS styling

## How to write good tests

### The three questions

Every test should answer:
1. **Given** this starting state
2. **When** this action happens
3. **Then** this result occurs

If you can't fill in all three clearly, you don't understand the behavior well enough to test it.

### Test behavior, not implementation

```typescript
// ❌ Tests implementation (breaks if you refactor internals)
test('calls calculateDiscount with price and tier', () => {
  const spy = jest.spyOn(utils, 'calculateDiscount');
  applyPricing(order);
  expect(spy).toHaveBeenCalledWith(100, 'gold');
});

// ✅ Tests behavior (survives refactoring)
test('gold tier gets 20% discount', () => {
  const order = createOrder({ price: 100, tier: 'gold' });
  const result = applyPricing(order);
  expect(result.finalPrice).toBe(80);
});
```

### One assertion per behavior (not per test)

Multiple `expect` calls are fine if they're all verifying the same behavior. Don't split a coherent check across multiple tests just to get "one assertion per test."

```typescript
// ✅ Multiple assertions, one behavior
test('creating a user returns complete user object', () => {
  const user = createUser({ name: 'Ada', email: 'ada@test.com' });
  expect(user.id).toBeDefined();
  expect(user.name).toBe('Ada');
  expect(user.email).toBe('ada@test.com');
  expect(user.createdAt).toBeInstanceOf(Date);
});
```

### Name tests as behavior descriptions

The test name should read like a sentence describing what the system does:

```
✅ "returns 404 when session does not exist"
✅ "expires session after 30 minutes of inactivity"
✅ "rejects passwords shorter than 8 characters"
❌ "test session"
❌ "should work correctly"
❌ "handles edge case"
```

## Anti-patterns

**Coverage worship.** 80% meaningful coverage beats 100% coverage where half the tests just check that functions exist.

**Mock everything.** Excessive mocking means you're testing your mocks, not your code. Mock external boundaries (APIs, databases, file system). Don't mock your own modules unless there's a compelling reason.

**Testing the framework.** Don't test that React renders components, that Express routes requests, or that Prisma queries work. Test YOUR logic that uses these tools.

**Snapshot abuse.** Snapshot tests are for catching unintended changes in serialized output. They are NOT a substitute for behavioral tests. If your test suite is mostly snapshots, you have an alarm system, not a test suite.

**Test duplication across layers.** If you test a calculation in a unit test, you don't also need to test the same calculation in an integration test AND an e2e test. Test each behavior at the most appropriate layer.

## Test-first workflow (when high rigor is warranted)

When writing test-first, follow this tight loop:

1. **Write exactly ONE test** that captures the next behavior you need
2. **Run it. Watch it fail.** Read the failure message. This confirms your test actually tests something.
3. **Write the minimum code** to make that test pass. Not the "right" code — the minimum code.
4. **Run it. Watch it pass.**
5. **Refactor** if the code is ugly. Tests should still pass.
6. **Repeat** for the next behavior.

The discipline: do NOT write the second test before the first one passes. Do NOT write more implementation than the current test requires.

## Existing project test conventions

Before writing new tests, spend 30 seconds checking:
- Where do existing tests live? (`__tests__/`, `*.test.ts`, `*.spec.ts`, `test/`)
- What test runner? (Jest, Vitest, Mocha, pytest, etc.)
- What patterns do existing tests follow? (describe/it blocks, test functions, class-based)
- Any test utilities or fixtures already set up?

Match the existing conventions. Don't introduce a new testing pattern into an established codebase.

## When to run tests

- **After each implementation unit** in V2+ work
- **Before committing** — always
- **After a merge/rebase** — always
- **Full suite before shipping** — always
- **During rapid-build prototyping** — only when the user asks or when formalizing

## Anti-rationalization table

Agents are smart and will find excuses to skip testing discipline. If you catch yourself thinking any of these, STOP — you're rationalizing:

| What you're thinking | What's actually true |
|---|---|
| "This is too simple to test" | Simple code breaks. The test takes 30 seconds. Write it. |
| "I'll write tests after" | Tests-after verify "what does this do?" Tests-first verify "what SHOULD this do?" Not the same thing. |
| "I already manually tested it" | Manual testing isn't repeatable. Next change breaks it silently. |
| "The tests would just duplicate the implementation" | Then your implementation is so simple it takes 30 seconds to test. Do it. |
| "I'm following the spirit of TDD" | The spirit of TDD IS the practice. There's no spiritual TDD. |
| "This is different because..." | It's not. |
| "Let me just get it working first, then add tests" | That's test-after. You're rationalizing. If the code is written, write the test NOW before touching anything else. |
| "The existing code doesn't have tests" | That's tech debt, not permission. New code gets tests. |

If you wrote code before writing the test (for high-rigor code): **delete the code, write the test, watch it fail, then rewrite the code.** Don't "keep it as reference" — you'll copy-paste instead of implementing from the test's requirements.

## Verification before completion

Before declaring ANY task done (not just test-related):

1. **Run the relevant tests.** Not "I think they pass." Actually run them. Read the output.
2. **Verify the actual behavior.** If it's a UI change, does the UI actually render correctly? If it's an API, does the endpoint actually return the right data?
3. **Check for regressions.** Run the full test suite, not just your new tests.
4. **Read your diff.** `git diff --staged` before every commit. Look for: debug code, console.logs, hardcoded values, TODO comments, files you didn't mean to change.

The single most common agent failure mode is declaring victory without verification. "I made the change, so it should work" is not evidence. **Run it. See it. Then say it's done.**

## Condition-based waiting (for async/flaky test issues)

When testing async code, never use fixed delays:

```typescript
// ❌ Fragile — passes on fast machines, fails on slow CI
await sleep(1000);
expect(result).toBe(true);

// ✅ Condition-based — waits only as long as needed
await waitFor(() => expect(result).toBe(true), { timeout: 5000 });
```

For backend async operations (queues, workers, event-driven):
```typescript
// ❌ Race condition waiting to happen
await processJob(job);
const result = await getResult(job.id); // might not be ready

// ✅ Poll with condition
const result = await pollUntil(
  () => getResult(job.id),
  (r) => r.status === 'complete',
  { interval: 100, timeout: 5000 }
);
```

If a test is flaky: it's not "sometimes failing," it has a race condition. Fix the race condition, don't add retries.
