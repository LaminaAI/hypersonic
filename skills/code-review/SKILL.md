---
name: code-review
description: "Use after completing V3 or V4 implementation, before shipping. Invoked by hypersonic-core at the end of feature/system work. Performs a self-review focused on real problems — not style nitpicks. Also use when the user asks you to review code, review a PR, or check quality of existing code."
---

# Code Review — Find Real Problems, Skip the Bike-Shedding

This is a review pass focused on things that will actually cause problems. Not naming conventions. Not import ordering. Not whether you prefer `const` or `let`. Real problems.

## The review checklist

Go through each item. If it passes, move on. If it fails, fix it before shipping.

### 1. Does it work?

- Run the full test suite. All tests pass? Good.
- If there are no tests for the new behavior, that's a finding. Write the critical ones.
- Manually test the happy path if it's a user-facing change.

This is the only gate that is absolutely non-negotiable. Everything else can be weighed.

### 2. Are the failure modes handled?

For each external boundary your code touches (API call, database query, file read, user input):
- What happens if it fails?
- What happens if it returns unexpected data?
- What happens if it's slow?

You don't need to handle every conceivable error. You need to handle the errors that are LIKELY and the errors that are CATASTROPHIC. The intersection of unlikely and harmless can wait.

### 3. Will the next person understand this?

Read your code as if you've never seen it before. Focus on:
- **Mystery functions:** Any function where the name doesn't make the purpose obvious? Rename it or add a one-line comment.
- **Magic numbers/strings:** Any literals that would confuse someone? Extract to a named constant.
- **Surprising control flow:** Any early returns, fallthrough cases, or exception-based control flow that isn't obvious? Add a comment explaining why.

Don't add comments that just restate the code. `// increment counter` above `counter++` helps nobody.

### 4. Are there obvious performance landmines?

Not premature optimization. Just check for:
- N+1 queries (looping database calls)
- Unbounded data structures (loading an entire table into memory)
- Missing indexes on queried fields
- Synchronous blocking in async contexts
- Regex on user input without limits (ReDoS)

If you find one, fix it. If you're not sure it's a real problem, note it and move on.

### 5. Security basics (30-second scan)

- User input goes into a SQL query? → Is it parameterized?
- User input goes into HTML? → Is it escaped?
- Authentication on new endpoints? → Are they protected?
- Secrets in code? → Move to environment variables.

Not a full security audit. Just the obvious stuff that would be embarrassing.

## How to report findings

Don't write a review document. Just fix the problems you find. For anything you're not sure about, tell the user:

> "During review I noticed [thing]. I [fixed it / want your input] because [reason]."

### Severity guide

- **Fix now:** Will cause bugs, data loss, security issues, or crashes.
- **Fix before shipping:** Won't crash but will confuse users or create maintenance burden.
- **Note for later:** Code smell or tech debt that doesn't affect current functionality.

Fix the first category. Fix the second if time allows. Mention the third only if it's significant.

## What this review does NOT do

- ❌ Nitpick variable naming conventions
- ❌ Enforce a specific code style (that's what linters are for)
- ❌ Require architectural changes to working code
- ❌ Block shipping over stylistic preferences
- ❌ Produce a formal review document
- ❌ Require a second review of the review fixes

## Reviewing other people's code

If the user asks you to review a PR or existing code:

1. Read the code first. All of it. Don't comment as you go — read the whole thing to understand the intent.
2. Identify the 3 most important issues. Not all issues. The important ones.
3. For each issue: what's wrong, why it matters, and a concrete suggestion.
4. If the code is good, say so briefly and specifically: "The error handling in the retry logic is solid — it correctly distinguishes transient from permanent failures."

Don't pad positive feedback. Don't enumerate everything that's fine. Highlight what matters.
