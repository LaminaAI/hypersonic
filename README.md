# Hypersonic

**Mission control for infinite AI coding agents.**

Spin up multiple AI agents. Point them at your codebase. Go to sleep. Wake up to 50+ atomic commits, 90% test coverage, and zero lint warnings. Monitor everything from one terminal.

```bash
npx hypersonic
```

```
⚡ HYPERSONIC MISSION CONTROL                    4 agents | 06:45:12
──────────────────────────────────────────────────────────────────────
  ID  STATUS       PLATFORM  SESSIONS  ITERATIONS  COMMITS  PROJECT
▸ 1   running      claude    4         31          27       lamina-core
  2   running      gemini    7         44          38       pictor
  3   running      aider     3         22          19       simi-api
  4   restarting   opencode  2         12          10       docs-site

──────────────────────────────────────────────────────────────────────
  Agent 1: claude-lamina-core
  Vision: Production-quality rendering pipeline with 90% coverage
  Plan:   docs/plans/pictor-plan.md
  Uptime: 347min | Last activity: 3s ago

  Recent output:
  06:44:58 ✅ T3: Added test for scene graph traversal (coverage 78%→81%)
  06:45:01 ✅ T4: Index on clips.scene_id (query 34ms→6ms)
  06:45:09 ❌ T4: Memoize node lookup — no improvement, discarded
  06:45:12 🔍 Scanning for next improvement...

──────────────────────────────────────────────────────────────────────
  a add agent  k kill agent  ↑↓ select  l view log  q quit
```

Or quick-launch a single agent:

```bash
# Paid platforms
npx hypersonic --claude ~/my-project "make it production-quality" docs/plan.md
npx hypersonic --codex ~/my-project "make it production-quality"

# Free platforms
npx hypersonic --gemini ~/my-project "90% test coverage, zero warnings"
npx hypersonic --opencode ~/my-project "clean APIs, full docs"
npx hypersonic --aider ~/my-project "optimize performance"
```

**Works with 5 platforms, 3 of them free:**

| Platform | Cost | Install |
|----------|------|---------|
| **Gemini CLI** | Free (1,000 req/day) | `npm i -g @anthropic-ai/gemini-cli` |
| **OpenCode** | Free (ships with free models) | `npm i -g opencode` |
| **Aider** | Free (local models via Ollama = $0) | `pip install aider-chat` |
| Claude Code | $20/mo | `npm i -g @anthropic-ai/claude-code` |
| Codex | Via ChatGPT sub | `npm i -g @openai/codex` |

## What it does

**Velocity-routed development** — matches process rigor to task complexity:

Every task gets classified into a velocity tier:

| Tier | Name | What it is | Process applied |
|------|------|-----------|-----------------|
| **V1** | Patch | One-liner, config change, typo | Just do it. No ceremony. |
| **V2** | Task | Small feature, focused bugfix | Quick plan in chat → build → test → commit |
| **V3** | Feature | Multi-component capability | Design brief → task list → build with TDD → review → ship |
| **V4** | System | New subsystem, major refactor | Architecture brief → decompose → subagent execution → review → ship |

The agent classifies automatically and routes to the right workflow. If it's wrong, the user overrides. If scope changes mid-task, the agent re-routes.

**V1 tasks take seconds, not minutes.** V4 tasks get the rigor they deserve. Everything in between scales proportionally.

## Why not Superpowers?

Superpowers is a rigid pipeline: brainstorm → spec → plan → implement → review → merge. Every task walks this path. Hypersonic's position:

- **Not everything needs a spec.** A V1 patch doesn't. A V2 bugfix doesn't. Only V3+ gets design artifacts, and even those are briefs, not documents.
- **Vibecoding is valid.** The `rapid-build` skill exists specifically for exploration and prototyping. No other agent framework supports "just try stuff" as a first-class workflow.
- **TDD should be practical, not dogmatic.** Testing a config file change is waste. Testing business logic is essential. Hypersonic calibrates testing rigor to what you're actually building.
- **Context windows are finite.** Every skill in Hypersonic is designed to be lean. No 500-line skill files. No spec documents burning 48K tokens. Progressive loading, minimal overhead.
- **Plans should match the model, not the "junior engineer."** Modern frontier models can handle ambiguity and make judgment calls. Hypersonic doesn't over-specify.

## Installation

### Mission Control CLI (recommended)

```bash
git clone https://github.com/lamina-ai/hypersonic.git ~/.hypersonic
cd ~/.hypersonic

# Launch mission control — interactive dashboard
node cli/hypersonic.mjs

# Or quick-launch a single agent
node cli/hypersonic.mjs --claude ~/my-project "your vision" docs/plan.md
node cli/hypersonic.mjs --codex ~/my-project "your vision"
```

From the dashboard, press `a` to add agents interactively. Each agent auto-restarts when context runs out.

### Skills only (Claude Code plugin)

If you just want the skills without mission control:

```
/plugin marketplace add lamina-ai/hypersonic-marketplace
/plugin install hypersonic@hypersonic-marketplace
```

### Skills only (manual / Codex)

```bash
git clone https://github.com/lamina-ai/hypersonic.git ~/.hypersonic
# Claude Code:
ln -s ~/.hypersonic/skills ~/.claude/skills/hypersonic
# Codex:
ln -s ~/.hypersonic/skills ~/.agents/skills/hypersonic
```

### Loop scripts (headless, no dashboard)

For servers or tmux sessions where you don't need the interactive dashboard:

```bash
# Paid
~/.hypersonic/scripts/hypersonic-loop.sh ~/project "vision" "plan.md"        # Claude Code
~/.hypersonic/scripts/hypersonic-loop-codex.sh ~/project "vision" "plan.md"  # Codex

# Free
~/.hypersonic/scripts/hypersonic-loop-gemini.sh ~/project "vision" "plan.md"    # Gemini (1K free/day)
~/.hypersonic/scripts/hypersonic-loop-opencode.sh ~/project "vision" "plan.md"  # OpenCode
~/.hypersonic/scripts/hypersonic-loop-aider.sh ~/project "vision" "plan.md"     # Aider

# Aider with local model (completely $0)
AIDER_MODEL=ollama/deepseek-coder-v2 ~/.hypersonic/scripts/hypersonic-loop-aider.sh ~/project "vision"
```

### Verify

Start a new session and ask for something. The agent will classify the velocity tier and route automatically. You should see something like:

> "This looks like a **V2 task** — small feature, I'll plan briefly and build. Sound right?"

## Skills

| Skill | Purpose | When it fires |
|-------|---------|--------------|
| **hypersonic-core** | Classify work, route to the right process | Every task (entry point) |
| **rapid-build** | Vibecoding and prototyping | "Just build it", exploration, prototypes |
| **architect** | Design briefs for complex work | V3/V4 tasks that need design |
| **surgical-debug** | Evidence-first debugging | Bug reports, errors, unexpected behavior |
| **tdd-engine** | Practical test-driven development | During V2+ implementation |
| **code-review** | Quality gate before shipping | End of V3/V4 work |
| **ship-it** | Commits, branches, PRs, merging | When work is ready to ship |
| **evolution-engine** | Self-improving repo knowledge | After V2+ tasks, on user corrections |
| **autopilot** | Infinite autonomous execution + Karpathy loop | "Autopilot", "don't stop", "I'm going to sleep" |

## The evolution engine — skills that learn

This is the thing that makes Hypersonic fundamentally different from every other agent framework.

Every agent skill system today is static. Somebody writes a markdown file, the agent reads it, end of story. Hypersonic's evolution engine turns your repo into a **living knowledge base** that gets smarter every time the agent works on it.

Here's what happens:

```
Session 1: Agent works on your repo, hits a Vulkan gotcha, spends 20 min debugging.
            Evolution engine captures: "When modifying render passes, update descriptor sets."
            Saved to .hypersonic/learned.md, committed to repo.

Session 2: Agent starts a new task. Reads .hypersonic/learned.md first.
            Encounters the same render pass area. Already knows the gotcha.
            Avoids the 20-minute debugging detour entirely.

Session 5: learned.md now has 15 entries covering conventions, gotchas,
            test patterns, and user preferences. The agent working on this
            repo is measurably better than a fresh agent on any other repo.
```

The knowledge captures:
- **Repo conventions** — error handling patterns, naming rules, architectural decisions
- **Gotchas** — things that break in non-obvious ways
- **Test patterns** — how tests work in this specific codebase
- **Architecture notes** — structural understanding of the system
- **User preferences** — how the specific developer likes to work

This file is committed to the repo. It travels with the code. It works across different machines, different sessions, and different team members. It's like institutional knowledge that actually persists.

No other agent framework does this. Superpowers skills are generic — they know about "debugging" but they don't know about YOUR codebase's specific failure modes. Hypersonic's evolution engine makes the agent a specialist in YOUR code.

## Autopilot — Infinite. No Exceptions.

Karpathy's autoResearch runs 100 experiments overnight with zero human input. The agent never stops — it keeps iterating until you `Ctrl+C`. Hypersonic's autopilot applies the same principle to software development.

**There is no finite mode.** Autopilot always runs forever. Two phases:

**Phase 1**: Read the plan file. Execute every task in order. One atomic commit per task.
**Phase 2**: Plan done? Keep going. Iterate infinitely on T1-T6 improvements toward the vision. Correctness → reliability → tests → performance → code quality → DX. Forever.

### Context window survival

Every agent platform runs out of context eventually. Hypersonic handles this at three levels:

1. **Skill level**: The agent writes `.autopilot-state.md` after every commit — a checkpoint file that lets the next session resume instantly.
2. **Loop script level**: `scripts/hypersonic-loop.sh` auto-restarts the agent when a session dies. The new session reads the state file and continues.
3. **Mission control level**: `cli/hypersonic.mjs` manages multiple agents, each auto-restarting independently. Monitor all of them from one terminal.

```
Session 1:  Tasks 1-8 done → context full → dies
            [auto-restart]
Session 2:  Resumes at task 9 → tasks 9-15 done → Phase 2 starts → 
            12 improvement iterations → context full → dies
            [auto-restart]
Session 3:  Resumes Phase 2 iteration 13 → 20 more iterations → dies
            [auto-restart]
Session 4:  ...continues forever...

[You wake up, Ctrl+C]

Result: 47 atomic commits. Coverage 34%→82%. Response time 142ms→11ms.
        Zero test failures. Full log in .autopilot-log.md.
```

## The design principles

**1. Rigor scales with risk.** A one-line fix and a new subsystem should not go through the same process.

**2. Build, don't plan.** Working code you can see and test teaches more than documents you can debate. Default to building, escalate to planning only when complexity demands it.

**3. Evidence over speculation.** In debugging, read before guessing. In testing, verify before declaring. In review, check before opining.

**4. Respect the user's time.** Never ask a question you can infer the answer to. Never create a document the user didn't ask for. Never add ceremony that doesn't prevent a real problem.

**5. Context is precious.** Every token in the context window should be earning its keep. Short skills. No spec files. Compact communication.

## Writing your own skills

Create a directory in `skills/` with a `SKILL.md`:

```yaml
---
name: my-skill
description: "When to trigger this skill. Be specific about signals."
---

# My Skill

Instructions for the agent. Keep it under 150 lines.
Focus on WHAT to do, not HOW (the agent knows HOW).
```

The description field is how the agent decides when to activate the skill. Write it as a trigger condition, not a summary.

## Contributing

1. Fork the repo
2. Create a skill or improve an existing one
3. Test it on real tasks (not hypothetical ones)
4. Submit a PR with a description of what you tested and what improved

## License

MIT
