---
name: ship-it
description: "Use when work is ready to be committed, pushed, merged, or turned into a PR. Handle the final git work cleanly: commit shape, branch choice, PR text, and the last verification gate before shipping."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Ship It — Clean Finalization

Shipping is part of the work. A sloppy final step creates confusion for reviewers, breaks the branch history, or ships code that was never properly verified.

Keep shipping simple, but do not skip the last checks that prevent embarrassing breakage.

---

## How Parameters Change Behavior

- `velocity=high`: prefer the shortest safe path, usually commit directly unless the workflow clearly needs a branch or PR
- `velocity=medium|low`: spend more time checking history shape, branch hygiene, and reviewer clarity
- `rigor=low`: keep commit and branch handling minimal
- `rigor=medium`: also verify history cleanliness and shipping prerequisites
- `rigor=high`: also check branch state, rollout risk, and reviewer instructions more carefully
- `max_questions=N`: ask at most `N` shipping questions; if the workflow is obvious, act without asking
- `test_mode=none`: ship only after direct behavior verification and any critical risk checks
- `test_mode=auto|relevant|full`: that verification depth is the floor before commit, PR, or merge
- `auto_commit=true`: create the commit once the work is verified and the destination is clear
- `auto_commit=false`: do not commit unless the user explicitly says to ship, commit, or finalize

---

## Choose The Shipping Path

Pick one:
- local commit only
- branch plus commit
- PR ready
- merge ready

Do not ask broad process questions if the repo workflow is already obvious.

---

## Commit Quality

### Write useful commit messages

Format:
```text
<type>: <plain-language summary>
```

Add a body only when the reason is not obvious from the diff.

Good:
- `fix: reject expired sessions during refresh`
- `feat: add notification settings page`

Bad:
- `update code`
- `misc changes`

### Keep commit shape coherent

Each commit should be:
- coherent
- reviewable
- independently reversible

Do not ship a large system change as one giant commit if it can be split cleanly.

---

## Branching And PRs

### Branching
- small V1 or V2 work: usually commit on the current branch
- feature or system work: use a branch if the repo or team expects PR flow
- large risky work: prefer a dedicated branch

### PR text
Keep it short:
1. what changed
2. why it changed
3. how to verify it

Example:

```markdown
## What
Adds session expiry to refresh flow.

## Why
Sessions could remain valid after server-side expiry.

## How to test
Run `pnpm test auth` and verify refresh rejects expired sessions.
```

---

## Verification Before Shipping

Use `test_mode` as the minimum bar:
- `none`: direct verification plus any critical risk checks
- `auto`: relevant checks for the changed area
- `relevant`: targeted tests plus nearby regression coverage
- `full`: full suite before finalizing

Also check:
- `git status`
- staged diff or final diff
- debug code removed
- secrets not introduced

If the required verification did not happen, the work is not ready to ship.

---

## Questions To Ask, If Any

Use your question budget for the highest-leverage uncertainty only:
- target branch unclear
- PR vs direct commit unclear
- merge policy unclear

If the repo workflow is already obvious, do not ask.

---

## Anti-Patterns

**Shipping without verification.** Finalization is not a substitute for proof.

**Branch theater.** Do not create a branch for a trivial one-line fix just because it feels safer.

**Vague commit messages.** If future-you cannot tell what changed, the commit failed.

**PR bloat.** The PR body should help a reviewer, not repeat the whole diff.

**Workflow amnesia.** If the repo already has a clear pattern, follow it.

---

## Anti-Rationalization Table

| What you're thinking | What's actually true |
|---|---|
| "The tests passed earlier, I don’t need to rerun anything" | Shipping checks should reflect the final state, not an earlier one. |
| "I’ll just make one giant commit" | Large commits hide risk and make rollback harder. |
| "The branch name doesn’t matter" | Review and history quality start with naming clarity. |
| "I’ll leave the debug output, it’s harmless" | It is not harmless when it ships. |
| "I’ll commit now and explain later" | Clean shipping is part of the job, not optional polish. |

---

## Completion Checklist

Before you call it shipped:

1. The required verification depth is complete
2. The commit or PR text is clear
3. Branch and history shape match the repo workflow
4. No debug code or secrets are slipping through
5. `auto_commit` was respected

The standard is simple: make the handoff clean, the verification real, and the history useful.
