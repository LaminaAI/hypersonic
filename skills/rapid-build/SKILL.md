---
name: rapid-build
description: "Use when the user wants to explore, prototype, or vibecode something quickly. Signals: 'let me try', 'quick prototype', 'spike', 'just build it', 'I want to see if', 'experiment with', 'hack together', 'vibecode', 'can you just make', or any request where speed and iteration matter more than correctness. Also use when the user seems frustrated with too much process and just wants results. This skill is the antidote to over-planning."
---

# Rapid Build — Vibecoding Mode

The user wants to build fast and iterate. Respect that. Your job is to get something working on screen as quickly as possible, then iterate based on what they see.

## The rapid-build loop

```
BUILD something visible → SHOW the user → LISTEN to feedback → REPEAT or FORMALIZE
```

That's it. No spec. No plan document. No design review. Build, show, listen, repeat.

## How to execute

### 1. Understand the target (30 seconds, not 30 minutes)

Ask at most ONE clarifying question. If you can infer the answer, don't ask — just build your best guess. Wrong guesses that the user can see and correct are faster than long Q&A sessions about hypotheticals.

Good: "I'll build this as a React component with Tailwind. Starting now."
Bad: "Before I begin, I'd like to understand the user personas, acceptance criteria, and edge cases."

### 2. Build the smallest visible thing first

The first iteration should be working code the user can see, touch, or run. Not scaffolding. Not infrastructure. Not types and interfaces. The THING.

Priority order:
1. Does it render / run / produce output? → Ship iteration 1
2. Does it handle the happy path? → Ship iteration 2
3. Does it handle edge cases? → Ship iteration 3
4. Is the code clean? → Refactor pass

Never invert this order. Working ugly code beats beautiful code that doesn't work.

### 3. After each iteration

Ask: "How's this? What should I change?"

Don't ask: "Should we now write tests, set up CI, create a design document, and refactor for maintainability?" That kills momentum. If the user wants to formalize, they'll tell you (or you can suggest it once the prototype is solid).

### 4. When to suggest formalizing

After 3+ successful iterations where the prototype is clearly becoming the real thing, you can suggest:

> "This is looking solid. Want me to clean it up — add tests for the core logic, handle error cases, and make it production-ready? That'd be a V3 feature at this point."

But ONLY suggest, never insist. Some prototypes are meant to stay prototypes.

## The vibecoding principles

**Speed over completeness.** A working prototype with hardcoded values teaches more than a perfectly architected skeleton with TODO comments.

**Show, don't describe.** Instead of explaining what you're going to build, build it. Instead of proposing three approaches, build the most promising one. The user will tell you if it's wrong.

**Accumulate, don't restart.** Each iteration adds to the previous one. Don't throw away working code to "do it right." Refactor incrementally.

**Match the user's energy.** If they're typing fast, informal, excited — match that. Don't slow them down with process. If they start asking about testing and architecture, that's your signal to shift gears.

## What this skill does NOT do

- ❌ Ask multiple rounds of clarifying questions before building
- ❌ Create design documents or spec files
- ❌ Require tests before the prototype works
- ❌ Suggest "let's brainstorm first" or "let's plan this out"
- ❌ Lecture about technical debt during active prototyping
- ❌ Create separate branches for exploratory work (unless the user wants to)

## File organization during rapid-build

Keep it simple:
- If adding to an existing project, put new code where it logically belongs
- If building something new from scratch, start with a single file. Split when it gets painful, not before
- Don't create elaborate directory structures for a prototype

## Transitioning out of rapid-build

When the user signals they want more rigor (or when you both agree the prototype is worth keeping):

1. Note what exists and works
2. Identify the gaps (tests, error handling, edge cases, types)
3. Reclassify as V2/V3 via `hypersonic-core`
4. Execute the remaining work with the appropriate process

The prototype code is not "wrong" — it's the first draft. Clean it up, don't rewrite it.
