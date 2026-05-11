---
name: evolution-engine
description: "Use after meaningful work to capture confirmed repo-specific knowledge in `.hypersonic/learned.md` and `.hypersonic/history.jsonl`: conventions, gotchas, test patterns, architecture notes, and user preferences."
parameters:
  velocity: high
  rigor: medium
  max_questions: 1
  test_mode: none
  auto_commit: false
---

# Evolution Engine - Keep What Compounds

Repo memory should make the next session faster and more accurate. It is not a diary.

## Dials

- Higher `velocity`: skip if nothing important was learned; keep entries short.
- Higher `rigor`: merge duplicates, resolve contradictions, and sharpen stale entries.
- `auto_commit`: include memory updates in the related verified commit only when appropriate.

## Record Only Real Learnings

Good categories:

- repo conventions
- gotchas
- test patterns
- architecture notes
- user or team preferences

Good entry:

- "`src/auth/session.ts` relies on Redis TTL for expiry; do not add manual timestamp checks unless that path changes. Learned 2026-03-24 from refresh bugfix."

Bad entries:

- "Need to be careful"
- "Async is tricky"
- "Project uses React"
- "We changed the button today"

## Reflection Pass

Ask:

1. What bit me?
2. What did the user correct?
3. What pattern did I discover?

If none of those answers will help a future session, skip the update.

## Update Flow

1. Read `.hypersonic/learned.md` if it exists.
2. Check whether the learning already exists.
3. Update, merge, or sharpen existing entries when cleaner than appending.
4. Add the new learning only if it is confirmed and location-aware.
5. Append a compact event to `.hypersonic/history.jsonl`.

Consolidate instead of growing a junk pile.

Minimum history event:

```json
{"ts":"2026-05-11T20:00:00Z","kind":"learning","path_or_area":"src/auth","summary":"Session expiry relies on Redis TTL","source":"bugfix","commit":null}
```

## Entry Shape

Each learning should answer:

- what the rule or gotcha is
- where it applies
- how it was learned
- when it was learned

Use specific paths or areas when possible.

## Files

- `.hypersonic/learned.md`: human-readable repo memory
- `.hypersonic/history.jsonl`: structured learning log

These are repo knowledge files by default. Do not commit local autopilot logs unless the user asks.

## Avoid

- recording guesses as facts
- generic advice with no location
- task history instead of durable knowledge
- append-only clutter
- spending longer writing memory than the learning is worth

The standard: preserve lessons that compound and skip the rest.
