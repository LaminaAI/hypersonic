---
name: evolution-engine
description: "Use after meaningful work to capture repo-specific knowledge in `.hypersonic/learned.md` and `.hypersonic/history.jsonl`. This skill is for durable learnings: conventions, gotchas, test patterns, architecture notes, and user preferences that will save time on future work."
parameters:
  velocity: high
  rigor: medium
  auto_commit: false
---

# Evolution Engine — Keep What The Repo Teaches You

Most sessions learn something. Most sessions also forget it. This skill exists to keep the important lessons and drop the rest.

Capture only the repo knowledge that will actually help the next session.

---

## How Parameters Change Behavior

- `velocity=high`: skip this skill if nothing important was learned; keep entries short and high-signal
- `velocity=medium|low`: spend a bit more time consolidating, deduplicating, and sharpening entries
- `rigor=low`: record only the most important confirmed learnings
- `rigor=medium`: also refine or merge nearby entries if that improves clarity
- `rigor=high`: actively resolve contradictions, promote repeated gotchas into conventions, and tighten the knowledge base
- `auto_commit=true`: if repo knowledge changed as part of a shipping workflow, include it in the same verified commit when appropriate
- `auto_commit=false`: update knowledge files, but do not create a commit just for them unless the workflow or user asks

---

## What Counts As A Real Learning

Good categories:
- repo conventions
- gotchas
- test patterns
- architecture notes
- user or team preferences

Good entries:
- "Tests under `src/renderer/` require `renderer.flush()` before assertions or they flake."
- "User prefers one logical commit per change, no squash."

Bad entries:
- "Need to be careful"
- "Async is tricky"
- "Project uses React"

---

## The Reflection Pass

Ask:
1. What bit me?
2. What did the user correct?
3. What pattern did I discover?

If the answer to all three is "nothing useful," skip this skill.

---

## The Update Flow

1. Read `.hypersonic/learned.md` if it exists
2. Check whether the learning already exists
3. Update, merge, or sharpen an existing entry if that is better than adding a new one
4. Add the new learning if it is confirmed and useful
5. Append a structured event to `.hypersonic/history.jsonl`

Do not just append forever. Consolidate when it makes the knowledge base cleaner.

---

## Write The Smallest Useful Entry

Each entry should answer:
1. what the rule or learning is
2. where it applies
3. how you learned it
4. when you learned it

Good:
- "**Session cache**: `src/auth/session.ts` assumes Redis TTL for expiry. Do not add manual timestamp checks unless the Redis path changes. _Learned: 2026-03-24 | Source: bugfix_"

---

## Files Used By This Skill

- `.hypersonic/learned.md` -> human-readable repo memory
- `.hypersonic/history.jsonl` -> structured learning log

By default these should be committed repo knowledge, not local throwaway files.

---

## Consolidate, Do Not Just Append

If you notice:
- duplicates
- contradictions
- stale file paths
- repeated gotchas that are really conventions

fix the knowledge base instead of adding more clutter.

This skill is not a diary. It is a tool for future speed and accuracy.

---

## Anti-Patterns

**Speculative memory.** Do not record guesses as if they were facts.

**Generic advice.** If the learning has no file, area, or condition, it is probably too vague.

**Task history instead of repo knowledge.** Keep what should be remembered, not what happened once.

**Append-only clutter.** If a new entry should replace or merge with an old one, do that.

**Documentation overkill.** Do not spend longer writing memory than the learning is worth.

---

## Anti-Rationalization Table

| What you're thinking | What's actually true |
|---|---|
| "I learned something, I should probably write it down" | Only if it will help the next session. |
| "I’ll just append this and clean it up later" | That is how knowledge files become junk piles. |
| "This is obvious, so I don’t need the file path" | Without location, future agents cannot use it. |
| "Maybe this matters" | If it is still a maybe, it is not ready to store as a rule. |
| "I should log every little discovery" | High-signal memory beats high-volume memory. |

---

## Completion Checklist

Before you finish:

1. The learning is confirmed, not guessed
2. The entry is specific and location-aware
3. The knowledge base is cleaner, not noisier
4. The change fits the current `auto_commit` behavior

The standard is simple: preserve the lessons that compound and skip the ones that do not.
