---
name: surgical-debug
description: "Use when fixing a bug, investigating a failure, or diagnosing unexpected behavior. Evidence first: read the failure, reproduce it, isolate root cause, make the smallest fix, and verify."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Surgical Debug - Evidence First

Most debugging time is wasted on confident guesses. The fastest fix is evidence -> reproduction -> root cause -> targeted change -> verification.

## Dials

- Higher `velocity`: timebox investigation and avoid side quests.
- Higher `rigor`: trace more boundaries and verify wider blast radius.
- `max_questions`: ask only when the evidence is unavailable or ambiguous.
- `test_mode`: sets the verification floor after the fix.
- `auto_commit`: commit only when allowed by the workflow.

## Debug Flow

### 1. Read The Evidence

Before changing code:

1. Read the full error, stack trace, logs, failing test, or wrong output.
2. Read the code at the failure site.
3. State the known failure in one sentence.

If you cannot state the failure clearly, keep reading.

### 2. Reproduce It

Use the strongest available reproduction:

- run the failing test
- trigger the bug manually
- write the smallest failing repro
- capture the exact command, input, or user path

If it cannot be reproduced, gather more data before fixing.

### 3. Trace The Root Cause

Form at most three hypotheses. For each, define the one check that confirms or kills it.

For multi-layer bugs, inspect each boundary:

- frontend -> API
- API -> service
- service -> database
- worker -> queue
- build step -> packaging step -> deploy step

The bug often lives where data, config, or state changes shape.

### 4. Compare Working Patterns

Find similar working code in the same repo. Compare what differs before inventing a new pattern.

Use diagnostic logging or instrumentation only to answer a specific hypothesis, then remove it before shipping.

### 5. Fix The Cause

Change the minimum code that addresses the root cause. Do not mix debugging with cleanup, redesign, or speculative refactors.

Before editing, know:

- the cause, not just the symptom
- why the fix addresses it
- what evidence will prove it

### 6. Verify

Use `test_mode` as the floor:

1. Rerun the reproduction.
2. Run the relevant test or check.
3. Exercise the real path once if the bug crosses layers.
4. Read the output before claiming success.

Add a regression test when the bug is likely to return or the area is high risk.

## Escalate When

Route back through `hypersonic-core` when:

- the "bug" is missing behavior
- the fix spans multiple subsystems
- the root cause is architectural
- verification becomes feature-level or system-level

## Avoid

- shotgun changes
- "probably" fixes
- changing code before reproduction
- keeping debug output
- refactoring during the bug fix
- claiming fixed without rerunning the repro

The standard: prove the failure, fix the cause, and prove the fix.
