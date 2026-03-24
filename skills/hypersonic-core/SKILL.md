---
name: hypersonic-core
description: "MUST invoke before any development task. Routes work to the right process based on complexity. Use when the user asks to build, fix, change, debug, refactor, or ship anything. This is the entry point for all Hypersonic workflows — it classifies what kind of work this is and ensures the right amount of process is applied. Never skip this. If you're about to write code, invoke this first."
---

# Hypersonic Core — Velocity Router

You are using Hypersonic. The core principle: **match rigor to complexity.** A one-line fix does not need a design document. A new subsystem does not need "just vibes." Your first job on any task is to figure out which one you're looking at.

## Step 1: Classify the velocity tier

Read the user's request. Classify it into exactly one tier:

| Tier | Name | Signal | Scope | Time |
|------|------|--------|-------|------|
| **V1** | Patch | Typo, config, style, rename, one-liner | 1 file, < 20 lines changed | < 5 min |
| **V2** | Task | Small feature, focused bugfix, add endpoint | 2–5 files, clear scope | 5–30 min |
| **V3** | Feature | Multi-component capability, new user-facing flow | 5–15 files, needs a plan | 30 min – 3 hr |
| **V4** | System | New subsystem, major refactor, architecture change | 15+ files, cross-cutting | 3+ hr |

**Ambiguous? Bias toward the lower tier.** You can always escalate. You cannot un-waste the user's time.

Tell the user your classification in one line:
> "This looks like a **V2 task** — small feature, I'll plan briefly and build. Sound right?"

If the user disagrees, re-classify. The user's judgment wins.

## Step 1.5: Load repo knowledge

Before starting any V2+ task, check if `.hypersonic/learned.md` exists in the repo. If it does, read it. This contains hard-won knowledge from previous sessions — gotchas, conventions, user preferences, architecture notes. It costs ~200-500 tokens and can save you from repeating mistakes that already cost someone 30 minutes.

For V1 patches, skip this. The overhead isn't worth it for a one-liner.

## Step 2: Route to the right workflow

### V1 — Patch
No ceremony. Just do it.
1. Make the change
2. Verify it works (run the relevant test, or manually confirm)
3. Commit with a clear message
4. Done

Do NOT invoke any other skills. Do NOT write a plan. Do NOT ask clarifying questions unless the request is genuinely ambiguous.

### V2 — Task
Light process.
1. State your approach in 2-3 sentences (not a document, just say it in chat)
2. If the task is a bugfix → invoke `hypersonic:surgical-debug`
3. Implement the change
4. Write or update a test for the core behavior (invoke `hypersonic:tdd-engine` if unsure)
5. Verify all existing tests pass
6. Commit
7. Invoke `hypersonic:evolution-engine` if you learned something worth capturing

### V3 — Feature
Structured process.
1. Invoke `hypersonic:architect` to produce a design brief (NOT a full spec — a brief)
2. Get user sign-off on the brief (one message, not a multi-round review)
3. Break into V2-sized tasks. List them as a checklist in chat
4. Execute each task sequentially. For each:
   - Implement with tests (`hypersonic:tdd-engine`)
   - Commit after each task completes
5. When all tasks done → invoke `hypersonic:code-review` for a self-review pass
6. Invoke `hypersonic:ship-it` to finalize
7. Invoke `hypersonic:evolution-engine` to capture learnings from this feature

### V4 — System
Full process.
1. Invoke `hypersonic:architect` in deep mode — produce an architecture brief with component boundaries and interface contracts
2. Get user sign-off section by section (break into digestible chunks)
3. Decompose into V2/V3-sized work units with dependency ordering
4. For subagent-capable environments: dispatch each unit to a subagent with clear context (the architecture brief + that unit's spec). **Include `.hypersonic/learned.md` path in subagent context** so they benefit from repo knowledge.
5. For single-agent environments: execute sequentially with commits per unit
6. Integration testing after all units complete
7. `hypersonic:code-review` → `hypersonic:ship-it`
8. Invoke `hypersonic:evolution-engine` — V4 tasks almost always produce learnings

## Step 3: Manage context pressure

As you work, be aware of your context window:
- **After completing each V2+ task**, mentally assess: am I still sharp, or is context getting bloated?
- **If context is heavy** (long conversation, many file reads): summarize what's done, what's next, and compact before continuing
- **Never re-read the full plan if you can re-read just the next task**
- **For V4 work**: the architecture brief should be saved to a file, not held in chat context

## The anti-patterns (things Hypersonic does NOT do)

- ❌ Force a spec document for a CSS color change
- ❌ Require TDD for a config file edit
- ❌ Demand brainstorming before a bugfix
- ❌ Write implementation plans detailed enough for "an enthusiastic junior engineer" — you ARE a capable engineer, act like it
- ❌ Block on code review for V1/V2 tasks
- ❌ Create files in `docs/superpowers/specs/` or any ceremony directory

## Process anti-rationalizations

Agents rationalize skipping process in both directions. Catch yourself:

| What you're thinking | What's actually true |
|---|---|
| "This is too simple to classify" | Classification takes 5 seconds. Misclassifying a V3 as V1 costs hours. |
| "I'll just start coding and see where it goes" | That's valid — invoke `rapid-build`. But don't pretend it's a V2 task. |
| "This needs a full design" (for a V2 task) | Are you avoiding implementation by planning? The design brief for V2 is 2-3 sentences in chat. |
| "Let me just do it all at once" (for a V4 system) | Decompose. Every V4 that shipped as one giant commit had bugs nobody found until production. |
| "The user said it's simple, so V1" | Users underestimate scope. Read the request, classify based on actual scope, tell them if you disagree. |
| "I'll skip the evolution-engine, nothing interesting happened" | If you completed a V2+ task and touched more than 3 files, something is worth capturing. Spend 15 seconds reflecting. |

## Escalation and de-escalation

Mid-task, if you realize the scope is bigger or smaller than classified:
- **Escalating** (V2 → V3): Stop. Tell the user: "This is bigger than I thought — it touches X, Y, Z. Let me step back and do a quick design brief." Then switch to the V3 workflow.
- **De-escalating** (V3 → V2): Tell the user: "This is simpler than expected — I'll just build it directly." Then switch to V2.

Always announce tier changes. Never silently change process level.
