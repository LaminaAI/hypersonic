---
name: ship-it
description: "Use when work is ready to be committed, pushed, merged, or turned into a PR. Handle final verification, git state, commit shape, branch choice, PR text, and safety checks."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: auto
  auto_commit: false
---

# Ship It - Clean Finalization

Shipping is part of the work. The final state must be verified, reviewable, and safe to hand off.

## Dials

- Higher `velocity`: shortest safe path through commit or PR.
- Higher `rigor`: stronger branch, rollout, and reviewer checks.
- `test_mode`: minimum verification before commit, PR, or merge.
- `auto_commit`: if false, do not commit unless the user explicitly asks to ship, commit, or finalize.

## Pick The Path

Choose one:

- local commit
- branch plus commit
- PR ready
- merge ready

Ask at most one question, and only for a real blocker such as target branch, direct commit vs PR, or merge policy.

If finishing a branch or worktree, detect the state before acting:

- normal branch: commit, PR, merge, or keep as requested
- worktree branch: preserve the worktree for PR feedback unless merge/discard is explicitly chosen
- detached HEAD: push as a new branch or keep as-is; do not pretend it can merge like a normal branch

Discarding work requires explicit confirmation after listing what would be deleted.

## Final Verification Gate

Before any commit, push, PR, merge, or success claim:

1. Identify the command or check that proves the work.
2. Run the required scope for `test_mode`.
3. Read the output and exit code.
4. Check `git status` and the final diff.
5. State the actual evidence and any gaps.

Required scope:

- `none`: direct behavior verification plus critical risk checks.
- `auto`: relevant checks for changed areas.
- `relevant`: targeted tests plus nearby regression coverage.
- `full`: full suite before finalization.

## Safety Checks

Before shipping, confirm:

- no secrets, tokens, credentials, or private data were added
- no debug logging, throwaway scripts, or accidental files remain
- destructive git operations are not used unless the user explicitly requested them
- force push, hard reset, checkout/restore of user changes, and deleting data are treated as dangerous
- generated files and lockfiles are intentional

If the working tree contains unrelated user changes, leave them alone and do not include them.

## Commit Quality

Each commit should be coherent, reviewable, and reversible.

Format:

```text
<type>: <plain-language summary>
```

Good:

- `fix: reject expired sessions during refresh`
- `feat: add notification settings page`

Bad:

- `update code`
- `misc changes`

Add a body only when the reason is not obvious from the diff.

## PR Text

Keep PRs short:

```markdown
## Summary
- [what changed]
- [why it changed]

## Test Plan
- [command or manual check]
```

Do not repeat the full diff.

## Avoid

- shipping without fresh verification
- giant commits for separable work
- vague commit messages
- PR bodies that hide the real test plan
- branch theater for trivial fixes
- pushing or merging when the user asked only for a local commit

The standard: verified final state, useful history, and no accidental damage.
