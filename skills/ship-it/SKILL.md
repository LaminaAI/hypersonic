---
name: ship-it
description: "Use when work is complete and ready to be committed, pushed, or merged. Invoked at the end of V3/V4 workflows by hypersonic-core, or directly when the user says 'commit', 'push', 'PR', 'merge', 'ship it', 'let's deploy', or wants to finalize their work. Handles git hygiene, commit messages, branch management, and PR creation."
---

# Ship It — Clean Commits, Fast Merges

Work is done. Tests pass. Time to ship. This skill handles the git mechanics so the project history stays clean without slowing you down.

## Commit hygiene

### Write commit messages that help future-you

Format:
```
<type>: <what changed in plain language>

<optional body — WHY this change was made, not WHAT (the diff shows WHAT)>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

Good:
```
feat: add session expiry after 30min of inactivity

Users were staying logged in indefinitely, which is a security risk
for shared machines. Sessions now expire server-side with Redis TTL.
```

Bad:
```
update code
```

Bad:
```
feat: implemented the session management feature with Redis-based 
storage and automatic expiry functionality using TTL mechanisms 
as discussed in the architecture brief document
```

Keep the first line under 72 characters. The body is optional — use it when the "why" isn't obvious from the diff.

### Commit granularity

- **V1:** One commit per patch.
- **V2:** One commit for the whole task (unless it naturally breaks into 2-3).
- **V3:** One commit per sub-task from the file map. Squash before merging if the history is noisy.
- **V4:** One commit per work unit. These should tell a story when read in sequence.

Don't commit after every line change. Don't commit an entire V4 system as one giant commit either. Each commit should be: a coherent change that could be understood and (if needed) reverted independently.

## Branch strategy

### When to branch

- **V1-V2:** Commit directly to the current branch (usually `main` or the working branch). Creating a branch for a 5-line fix is overhead that helps nobody.
- **V3:** Create a branch if the project uses PR-based workflow. Otherwise, commit to the current branch with clean granular commits.
- **V4:** Always branch. Name: `<type>/<short-description>` (e.g., `feat/session-management`).

### Branch naming

```
feat/session-management     ✅
fix/null-pointer-on-login   ✅
refactor/extract-auth-layer ✅
sudip/new-feature           ❌ (who? what?)
update                      ❌ (tells nothing)
test-branch-3               ❌ (what is this?)
```

## Creating a PR

When the user wants a PR (or the project workflow requires one):

### PR title
Same format as commit message first line: `<type>: <what>`

### PR body
Keep it concise. This template, filled in with 2-5 sentences total:

```markdown
## What
[One sentence: what this PR does]

## Why
[One sentence: why this change is needed]

## How to test
[How a reviewer can verify this works — specific commands or steps]
```

Don't include:
- Screenshots of terminal output (just describe what happens)
- Full architectural explanations (link to docs if needed)
- Lists of every file changed (the diff shows that)
- "This PR addresses issue #X" unless there's an actual issue tracker

### Before pushing

Final checklist:
- [ ] All tests pass locally
- [ ] No unintended files staged (check `git status`)
- [ ] No debug/console.log statements left in
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] The branch is up to date with the target branch (rebase or merge)
- [ ] Commit history is clean (squash fixup commits)

## Post-merge

After merging:
1. Delete the feature branch (local and remote)
2. Pull the latest main
3. If the change affects other developers: note what changed and any actions needed

Don't create post-merge ceremony. The work is shipped. Move on.

## Offering the user options

At the end of V3/V4 work, present options concisely:

> "Everything is ready. I can: (1) create a PR to main, (2) merge directly to main, (3) just leave it on this branch for now. What do you prefer?"

Don't explain what each option means. The user knows what a PR is.
