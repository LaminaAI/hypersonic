---
name: surgical-debug
description: "Use when fixing a bug, investigating unexpected behavior, or diagnosing a failure. Signals: 'it's broken', 'not working', 'error', 'bug', 'crash', 'wrong output', 'fails when', stack traces in the conversation, or any debugging task. This skill enforces evidence-first debugging — read before guessing, reproduce before fixing, verify before declaring victory."
---

# Surgical Debug — Evidence First, Always

You're here to fix a bug. The natural instinct is to guess what's wrong and start changing code. Resist that. Most debugging time is wasted on wrong hypotheses. The fastest path to a fix is: evidence → root cause → targeted fix → verification.

## The protocol

### Phase 1: Read the evidence (do this BEFORE forming hypotheses)

1. **Read the error.** The full error. Stack trace, error message, log output. Read it carefully. Most errors tell you exactly what's wrong if you actually read them.

2. **Read the code at the error site.** Go to the file and line number in the stack trace. Read the function. Read what calls it. Read what it calls.

3. **State what you know** in one sentence: "The error is [X] happening in [Y] when [Z]."

If you cannot state this clearly, you haven't read enough yet. Go back and read more.

### Phase 2: Reproduce (the fix doesn't count if you can't prove the bug exists)

Before changing any code:

1. **Find or write a reproduction.** This can be:
   - Running the existing failing test
   - Running the app and triggering the bug
   - Writing a minimal test case that fails

2. **Confirm the reproduction fails.** See the error with your own eyes. If you can't reproduce it, you cannot debug it — ask the user for more information.

The reproduction becomes your verification at the end. Don't skip this.

### Phase 3: Isolate the root cause

Now form hypotheses. But constrain yourself:

**The 3-hypothesis rule:** Form at most 3 hypotheses. For each one, identify the ONE thing you would check to confirm or eliminate it. Check the most likely one first.

```
Hypothesis 1 (most likely): [X] because [evidence]
  → Check: [specific thing to verify]
Hypothesis 2: [Y] because [evidence]  
  → Check: [specific thing to verify]
Hypothesis 3: [Z] because [evidence]
  → Check: [specific thing to verify]
```

**Check, don't guess.** Read the code. Add a log statement. Run with a debugger. Inspect the state at the failure point. Whatever it takes to get EVIDENCE, not speculation.

**When you find the root cause**, state it clearly:
> "The root cause is: [specific thing]. It happens because [mechanism]. The fix is [change]."

### Phase 4: Fix with minimal blast radius

Change the minimum amount of code to fix the bug. Not "fix the bug and also refactor the function and rename the variable and update the style." Just fix the bug.

Checklist before editing:
- [ ] I know the root cause (not just a symptom)
- [ ] My fix addresses the root cause (not a workaround)
- [ ] I'm changing the minimum necessary code
- [ ] I'm not introducing new behavior beyond the fix

### Phase 5: Verify

1. Run your reproduction from Phase 2. It should pass now.
2. Run the full test suite (or the relevant subset). Nothing else should break.
3. If the bug was user-reported, confirm the user's scenario works.

**Only declare victory after verification.** "I made a change that should fix it" is not the same as "I verified it's fixed."

## Anti-patterns this skill prevents

**Shotgun debugging:** Changing multiple things at once and hoping one of them helps. If you change 3 things and the bug goes away, you don't know which change fixed it — and the other 2 might introduce new bugs.

**Hypothesis-first debugging:** "I bet it's a race condition" → spend 2 hours investigating race conditions → discover it was a typo in a config file. Read the evidence first.

**Fix-and-pray:** Making a change without reproducing first. You can't know it's fixed if you never saw it broken.

**Scope creep during debugging:** "While I'm in here, let me also refactor this function." No. Fix the bug. Commit. Then refactor separately if needed.

**Explaining without checking:** "The error probably happens because X." Did you check? Did you read the code at line N? Did you look at the actual values? Probably is not evidence.

## Escalation

If after 15 minutes of Phase 3 you haven't identified the root cause:
1. Add instrumentation (logging, debug prints) at the boundaries of the suspect area
2. Reproduce with instrumentation active
3. Read the output

If after 30 minutes total you're still stuck:
1. Summarize what you've learned and eliminated
2. Ask the user for additional context
3. Consider: is this actually a different (harder) bug than what was reported?

## Defense in depth — for multi-layer bugs

When the bug crosses system boundaries (frontend → API → database, or service A → service B):

**Boundary logging**: At EACH component boundary, log what enters and what exits. The bug lives where the data transforms incorrectly.

```
[Frontend] Sending: { userId: "abc", amount: 100 }
[API] Received: { userId: "abc", amount: 100 }
[API] Sending to DB: { user_id: "abc", amount: "100" }  ← string, not number!
[DB] Stored: { user_id: "abc", amount: "100" }
```

The fix is at the API layer where `amount` became a string. Without boundary logging, you might waste time looking at the frontend or database.

**The one-change-at-a-time rule**: When fixing multi-layer bugs, fix ONE layer, verify, then move to the next. Don't fix frontend + API + database simultaneously and hope it all works.

## When to skip this skill

- The "bug" is a missing feature → this is a V2/V3 task, not a bug
- The error message is self-explanatory AND the fix is a V1 patch → just fix it via hypersonic-core V1, don't invoke the full debug protocol
- The user already knows the root cause and just wants you to write the fix → trust them, write the fix, verify

## Debugging anti-rationalizations

| What you're thinking | What's actually true |
|---|---|
| "I'm pretty sure it's X, let me just fix it" | Pretty sure = guessing. Read the evidence first. 5 minutes of reading beats 30 minutes of wrong fixes. |
| "I'll add some logging and see" | Good instinct, but read the existing error output first. The stack trace might already tell you everything. |
| "It worked before so the new code must be wrong" | Maybe. `git diff` and read what changed. But also: it might have been broken before and only manifested now. |
| "Let me refactor this while I'm fixing the bug" | No. Fix the bug. Commit. THEN refactor in a separate commit. |
| "The fix is obvious, I don't need to reproduce it" | If you can't reproduce it, you can't verify the fix. Obvious fixes for unreproduced bugs have a ~50% success rate. |
| "I fixed it" (without running verification) | Did you run the reproduction? Did you run the test suite? "I changed the code" ≠ "I fixed the bug." |
