---
name: architect
description: "Use when a V3 or V4 task needs design thinking before implementation. Invoked by hypersonic-core, not directly by the user. Produces a design brief (V3) or architecture brief (V4) — NOT a full specification document. The goal is just enough design to build confidently, not a document that could survive a committee review."
---

# Architect — Design That Earns Its Keep

You're here because hypersonic-core classified this as V3 or V4. The task is complex enough to benefit from thinking before building, but the design artifact should be the minimum needed to build confidently.

## V3 mode: Design Brief

A design brief is 1 chat message. Not a file. Not a document. One message with:

**1. What we're building** (1-2 sentences)
State the goal in plain language. If you can't say it in two sentences, you don't understand it yet.

**2. Key decisions** (3-7 bullet points)
The non-obvious choices. Things where there are multiple valid approaches and you're picking one. Each decision: what you chose, and the one-sentence reason why.

Example:
- Store sessions in Redis, not Postgres — we need sub-ms lookups and TTL expiry
- Use WebSocket for live updates, not polling — user expects real-time
- Auth via middleware, not per-route — 12 routes would mean 12 copies

Don't list obvious decisions. "Use React because the project uses React" is noise.

**3. File map** (the actual plan)
List every file you'll create or modify, with a one-line description of what changes:

```
CREATE src/hooks/useSession.ts — session lifecycle hook
CREATE src/components/SessionPanel.tsx — UI for active session
MODIFY src/api/routes.ts — add /session CRUD endpoints  
MODIFY src/types/index.ts — Session type definition
CREATE src/api/__tests__/session.test.ts — endpoint tests
```

This IS the implementation plan. Each line is a task. Work through them top to bottom.

**4. Risk callout** (only if there's a genuine risk)
One sentence about the thing most likely to go wrong or take longer than expected. Skip this section if there's nothing surprising.

After presenting the brief, ask: **"Good to build?"** — one message, one approval, then go.

## V4 mode: Architecture Brief

For system-level work, the brief goes into a file (because it'll be referenced across multiple work sessions and possibly by subagents). Save to a sensible location in the project — NOT a `docs/hypersonic/` directory. Put it where a human developer would put it (e.g., `docs/architecture/`, or `docs/` root, or alongside the code it describes).

An architecture brief contains:

**1. System context** (what exists today)
A 3-5 sentence description of the current state relevant to this change. Not the whole system — just the parts this work touches.

**2. Target state** (what we're building toward)
Another 3-5 sentences describing what the system looks like when this work is done. Focus on boundaries and interfaces, not implementation details.

**3. Component breakdown**
For each new or significantly modified component:

```
## [Component Name]
Responsibility: [one sentence]
Interface: [key functions/endpoints/events it exposes]
Dependencies: [what it needs from other components]
```

Keep each component description under 10 lines. If it needs more, it's too big — decompose further.

**4. Implementation sequence**
Ordered list of work units. Each unit should be independently implementable and testable (a V2 or small V3). Mark dependencies:

```
1. Session store (Redis adapter) — no dependencies
2. Session API endpoints — depends on #1
3. Session UI components — depends on #2
4. Auth integration — depends on #2
5. Migration script — depends on #1
```

**5. Interface contracts**
For each boundary between components, define the contract:

```typescript
// Session Store → Session API
interface SessionStore {
  create(userId: string, data: SessionData): Promise<Session>
  get(sessionId: string): Promise<Session | null>
  expire(sessionId: string): Promise<void>
}
```

These contracts are what make parallel/subagent execution safe. A subagent building the API can depend on this interface without needing to see the store implementation.

## What architecture does NOT look like in Hypersonic

- ❌ "Explore alternatives" documents comparing 5 approaches in a table
- ❌ Multi-round Socratic questioning about user requirements
- ❌ UML diagrams or formal modeling
- ❌ Risk matrices, RACI charts, or stakeholder analysis
- ❌ Separate "spec" and "plan" documents (the architecture brief IS both)
- ❌ Review loops with automated spec-reviewer subagents

## The design taste test

Before presenting your brief, check:
- Could someone build this without asking you questions? If no, add detail.
- Could you delete any section without losing build confidence? If yes, delete it.
- Are you specifying HOW to implement, or WHAT to implement? Prefer WHAT. The builder (you or a subagent) knows HOW.
- Is this longer than 1 page (for V3) or 3 pages (for V4)? Cut it down.

## After approval

For V3: Start building. The file map is your task list. Work top to bottom.
For V4: Decompose into work units. Execute via subagents if available, sequentially if not. Each unit gets: the architecture brief file path + that unit's specific scope.
