---
name: evolution-engine
description: "The self-improving skill system. Invoke AFTER completing any task (V1-V4) to capture what you learned. Also invoke when: the user corrects you, a pattern keeps causing failures, you discover a repo-specific convention, or you find yourself repeating the same fix. This skill reads and updates the repo's learned knowledge base in .hypersonic/learned.md — a living document that makes you smarter on this codebase over time."
---

# Evolution Engine — Skills That Learn

After completing work in a repo, you have knowledge that didn't exist before. Patterns you discovered. Mistakes you made. Conventions you learned. User corrections you received. This skill captures that knowledge so it compounds over time instead of dying with the session.

## How it works

Every repo using Hypersonic has a `.hypersonic/` directory. Inside it:

```
.hypersonic/
  learned.md      — Accumulated knowledge about THIS repo (the brain)
  history.jsonl    — Structured log of learnings (the memory)
```

These files are committed to the repo. They travel with the code. Any agent working on this repo benefits from every previous agent's learnings.

## When to invoke this skill

Invoke evolution-engine at the END of a task, during a natural pause. Not mid-task — you need to finish the work first to know what you learned. Specifically:

1. **After any V2+ task completes** — spend 30 seconds reflecting
2. **When the user corrects you** — immediately capture the correction
3. **When you discover a gotcha the hard way** — capture it before you forget
4. **When a pattern fails repeatedly** — escalate it to a learned rule

Do NOT invoke this for V1 patches unless you hit something surprising.

## Step 1: Reflect (15 seconds)

Ask yourself three questions. You don't need to answer all of them — only the ones where you actually learned something:

1. **What bit me?** Did anything fail unexpectedly? Did you make a wrong assumption about the codebase? Did a test break in a way you didn't anticipate?

2. **What did the user correct?** Did they tell you to do something differently? Did they override your approach? Their corrections are the highest-signal input.

3. **What pattern did I discover?** Did you find a convention, architecture pattern, or implicit rule that isn't documented anywhere but governs how this codebase works?

If the answer to all three is "nothing" — skip the rest. Not every task produces learnings. Don't manufacture them.

## Step 2: Check existing knowledge

Read `.hypersonic/learned.md` if it exists. Before adding anything:

- Is this already captured? → Skip
- Does this contradict something already there? → Update the existing entry with the newer, more accurate understanding
- Does this refine something already there? → Sharpen the existing entry

## Step 3: Write the learning

### Format for learned.md

`learned.md` is organized into sections by type. Add your learning to the appropriate section. If the section doesn't exist yet, create it.

```markdown
# Learned — [repo name]

> This file is maintained by Hypersonic's evolution engine.
> It captures patterns, gotchas, and conventions discovered while
> working in this codebase. Read this before making changes.

## Repo Conventions
<!-- Patterns and rules that govern how code is written here -->

- **Error handling**: Use Result<T, E> pattern, never throw. Errors propagate via return values.  
  _Learned: 2026-03-22 | Source: user correction_

- **Async boundaries**: SVG generation path is synchronous. Do not introduce async/await in `src/svg/`.  
  _Learned: 2026-03-22 | Source: user corrected this 3 times_

## Gotchas
<!-- Things that will bite you if you don't know about them -->

- **Vulkan descriptor sets**: When modifying any render pass in `src/renderer/`, you MUST update the descriptor set layout in `src/renderer/descriptors.cpp`. Forgetting this causes VK_ERROR_DEVICE_LOST at runtime with no helpful error message.  
  _Learned: 2026-03-22 | Source: caused a 20-minute debug session_

## Test Patterns
<!-- How tests work in this specific repo -->

- **Render queue flush**: Tests in `tests/assembler/` must call `renderer.flush()` and wait for completion before asserting on output. The queue is async even in test mode.  
  _Learned: 2026-03-22 | Source: flaky test investigation_

## Architecture Notes
<!-- Structural understanding of the codebase -->

- **Pipeline flow**: Script → Director (Claude Sonnet) → Scene JSON → Parallel SVG generation (Quiver) → Assembler → Vulkan Renderer → NVENC encode. Modifying any stage requires understanding the JSON contract between stages.  
  _Learned: 2026-03-22 | Source: traced during feature implementation_

## User Preferences
<!-- How this specific user/team likes to work -->

- **Commit style**: User prefers small atomic commits, one per logical change. No squashing.  
  _Learned: 2026-03-22 | Source: user feedback_

```

### Rules for writing entries

**Be specific, not generic.** "Be careful with async" is useless. "Do not use async in `src/svg/` because the SVG generation pipeline assumes synchronous execution and async causes race conditions in fill-sweep animations" is useful.

**Include the file paths.** Future agents need to know WHERE this applies. A learning without a location is a learning that can't be acted on.

**Include HOW you learned it.** "Source: user correction" carries different weight than "Source: hypothesis during debugging." User corrections are near-certain. Your hypotheses might be wrong.

**Date it.** Codebases change. A learning from 6 months ago might no longer be accurate. The date lets future agents (or humans) decide if it's still relevant.

**One learning, one bullet.** Don't combine multiple insights into a single entry. Each should be independently readable.

### Format for history.jsonl

Append one line per learning event. This is the structured log for potential future tooling (dashboards, analysis, pattern detection).

```json
{"timestamp":"2026-03-22T14:30:00Z","type":"gotcha","area":"src/renderer/","summary":"Descriptor sets must be updated when modifying render passes","source":"debug_session","severity":"high","task_tier":"V3"}
```

Fields:
- `timestamp`: ISO 8601
- `type`: `convention`, `gotcha`, `test_pattern`, `architecture`, `user_preference`
- `area`: file path or directory this applies to
- `summary`: one sentence
- `source`: `user_correction`, `debug_session`, `test_failure`, `code_review`, `discovery`
- `severity`: `high` (caused a failure), `medium` (caused confusion), `low` (nice to know)
- `task_tier`: which velocity tier the task was when this was learned

## Step 4: Initialize for new repos

If `.hypersonic/` doesn't exist yet, create it:

```bash
mkdir -p .hypersonic
```

Create `learned.md` with the header template. Create `history.jsonl` as an empty file. Add to `.gitignore` ONLY if the user prefers not to commit these files — by default, they should be committed so knowledge persists across machines and team members.

## How learned.md is used

The hypersonic-core skill should read `.hypersonic/learned.md` at the start of any V2+ task. This is NOT optional — it's how knowledge compounds. The read costs ~200-500 tokens for a typical learned file, which is cheap compared to the time saved by not repeating mistakes.

The integration with hypersonic-core:
1. User requests a task
2. hypersonic-core classifies velocity tier
3. **If V2+: read `.hypersonic/learned.md`** for this repo
4. Route to appropriate workflow (with learned context active)
5. Execute task
6. **After completion: invoke evolution-engine** to capture new learnings

## The Karpathy Loop — for evolving learned.md itself

Inspired by autoResearch: your repo knowledge isn't just a log, it's an asset that can be optimized. When running in `autopilot` mode and you notice recurring patterns in what's working vs. failing:

### Signals to consolidate

After 10+ entries in learned.md, look for:
- **Redundant entries**: 3 entries that all say "don't use async in X" → consolidate into one entry with the broader principle
- **Graduated learnings**: a "gotcha" that you now always avoid → promote to "convention" (it's not a surprise anymore, it's just how the codebase works)
- **Contradictions**: an older entry conflicts with a newer one → keep the newer, delete the older, note why
- **Dead entries**: entries about files that no longer exist → remove

### The consolidation pass

When learned.md exceeds ~150 lines, or during an autopilot session's natural pause:

1. Read all entries
2. Group related ones
3. Merge, promote, or remove per the rules above
4. The result should be shorter AND more useful than the input
5. Commit the consolidated learned.md with message: `chore: consolidate repo knowledge (N entries → M entries)`

This is the keep/discard loop from autoResearch applied to documentation instead of code. The metric is: **does the agent avoid more mistakes per token of learned.md consumed?** Denser, more accurate entries beat verbose ones.

## Pruning and maintenance

Over time, `learned.md` will grow. Pruning rules:

- **After a major refactor** that changes file structure: review and update file paths in entries
- **If an entry hasn't been relevant in 3+ months**: consider removing (check history.jsonl for last reference)
- **If the codebase's conventions change**: update entries, don't just add contradicting ones
- **Maximum size target**: ~200 lines. If it grows beyond this, consolidate related entries and remove low-severity ones

The user can also edit `learned.md` directly — it's their repo, their knowledge. Agent-generated entries and human-written entries coexist.

## What this skill does NOT do

- ❌ Modify skills in the Hypersonic framework itself (only repo-local knowledge)
- ❌ Share learnings across different repos (each repo has its own .hypersonic/)
- ❌ Override user instructions (learned knowledge is advisory, user commands are authoritative)
- ❌ Add entries speculatively ("this MIGHT be important" — no, only add confirmed learnings)
- ❌ Slow down V1 patches (evolution-engine is skipped for trivial work)
