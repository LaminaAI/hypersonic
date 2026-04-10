#!/usr/bin/env node

// ⚡ Hypersonic Mission Control
// Spin up multiple infinite autopilot agents, monitor them all from one terminal.
// Zero dependencies — pure Node.js.

import { spawn } from 'child_process';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { createInterface } from 'readline';
import { resolve, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  AUTOPILOT_LOG_FILE,
  buildAutopilotPrompt,
  DEFAULT_RUNTIME_CONFIG,
  findAutopilotLogFile,
  findAutopilotStateFile,
  formatRuntimeParameters,
  loadRuntimeConfig,
  normalizeProjectPath,
  readAutopilotTelemetry,
} from './hypersonic-runtime-lib.mjs';

// ── ANSI helpers ──
const ESC = '\x1b[';
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const RESET = `${ESC}0m`;
const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const BLUE = `${ESC}34m`;
const MAGENTA = `${ESC}35m`;
const CYAN = `${ESC}36m`;
const WHITE = `${ESC}37m`;
const BG_BLACK = `${ESC}40m`;
const CLEAR = `${ESC}2J${ESC}H`;
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;

// ── State ──
const agents = new Map(); // id → agent object
let nextId = 1;
let mode = 'dashboard'; // 'dashboard' | 'menu' | 'add'
let selectedAgent = null;
let refreshTimer = null;
const VERSION = (() => {
  try {
    const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      return pkg.version || 'unknown';
    }
  } catch {
    // ignore
  }
  return 'unknown';
})();

// ── Agent class ──
function createAgent(config) {
  const id = nextId++;
  const agent = {
    id,
    name: config.name || `agent-${id}`,
    platform: config.platform,
    project: resolve(config.project),
    vision: config.vision,
    plan: config.plan || null,
    configPath: config.configPath || null,
    runtime: config.runtime || structuredClone(DEFAULT_RUNTIME_CONFIG.defaults),
    dashboardRefreshMs: config.refreshMs || DEFAULT_RUNTIME_CONFIG.missionControl.dashboardRefreshMs,
    restartDelayMs: config.restartDelayMs || DEFAULT_RUNTIME_CONFIG.missionControl.restartDelayMs,
    maxLogLines: config.maxLogLines || DEFAULT_RUNTIME_CONFIG.missionControl.maxLogLines,
    recentOutputLines: config.recentOutputLines || DEFAULT_RUNTIME_CONFIG.missionControl.recentOutputLines,
    process: null,
    status: 'starting',
    sessions: 0,
    iterations: 0,
    commits: 0,
    discarded: 0,
    successRate: null,
    throughputPerHour: 0,
    lastCommit: '—',
    lastOutcome: 'unknown',
    lastSummary: '',
    lastArea: null,
    recentEvents: [],
    lastActivity: new Date(),
    currentPhase: '',
    nextAction: '',
    log: [],
    startTime: new Date(),
  };

  agents.set(id, agent);
  spawnAgent(agent);
  watchAgentLog(agent);
  return agent;
}

function spawnAgent(agent) {
  agent.sessions++;
  agent.status = 'running';
  agent.lastActivity = new Date();

  const prompt = buildAutopilotPrompt({
    projectDir: agent.project,
    vision: agent.vision,
    plan: agent.plan,
    runtimeConfig: {
      defaults: agent.runtime,
      missionControl: DEFAULT_RUNTIME_CONFIG.missionControl,
    },
  });

  // Platform-specific command and args
  const platformConfigs = {
    claude: {
      cmd: 'claude',
      args: ['--dangerously-skip-permissions', '-p', prompt],
    },
    codex: {
      cmd: 'codex',
      args: ['--full-auto', '--quiet', prompt],
    },
    gemini: {
      cmd: 'gemini',
      args: ['-p', prompt],
    },
    opencode: {
      cmd: 'opencode',
      args: ['-p', prompt],
    },
    aider: {
      cmd: 'aider',
      args: ['--yes-always', '--no-suggest-shell-commands', '--message', prompt],
    },
  };

  const config = platformConfigs[agent.platform];
  if (!config) {
    agent.status = 'error';
    agent.log.push({ time: new Date(), text: `${RED}Unknown platform: ${agent.platform}${RESET}` });
    return null;
  }

  const { cmd, args } = config;

  try {
    agent.process = spawn(cmd, args, {
      cwd: agent.project,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    agent.process.stdout.on('data', (data) => {
      const line = data.toString().trim();
      if (line) {
        agent.log.push({ time: new Date(), text: line });
        if (agent.log.length > agent.maxLogLines) agent.log.shift();
        agent.lastActivity = new Date();
      }
    });

    agent.process.stderr.on('data', (data) => {
      const line = data.toString().trim();
      if (line) {
        agent.log.push({ time: new Date(), text: `${RED}${line}${RESET}` });
        if (agent.log.length > agent.maxLogLines) agent.log.shift();
        agent.lastActivity = new Date();
      }
    });

    agent.process.on('exit', (code) => {
      agent.status = 'restarting';
      agent.process = null;

      setTimeout(() => {
        if (agents.has(agent.id)) {
          agent.log.push({
            time: new Date(),
            text: `${YELLOW}Session ${agent.sessions} ended (exit ${code}). Restarting in ${agent.restartDelayMs}ms...${RESET}`
          });
          spawnAgent(agent);
        }
      }, agent.restartDelayMs);
    });

    agent.process.on('error', (err) => {
      agent.status = 'error';
      agent.log.push({
        time: new Date(),
        text: `${RED}Failed to spawn ${cmd}: ${err.message}${RESET}`
      });
    });

  } catch (err) {
    agent.status = 'error';
    agent.log.push({
      time: new Date(),
      text: `${RED}Error: ${err.message}${RESET}`
    });
  }
}

function watchAgentLog(agent) {
  const logPath = findAutopilotLogFile(agent.project);
  const statePath = findAutopilotStateFile(agent.project);
  const watchPaths = [...new Set([logPath, statePath])];

  const refreshTelemetry = () => {
    if (!existsSync(agent.project)) return;
    try {
      const telemetry = readAutopilotTelemetry(agent.project);
      agent.iterations = telemetry.iterations;
      agent.commits = telemetry.commits;
      agent.discarded = telemetry.discarded;
      agent.successRate = telemetry.successRate;
      agent.throughputPerHour = telemetry.throughputPerHour;
      agent.lastCommit = telemetry.lastCommit;
      agent.lastOutcome = telemetry.lastOutcome;
      agent.lastSummary = telemetry.lastSummary || '';
      agent.lastArea = telemetry.lastArea;
      agent.recentEvents = telemetry.events.slice(-6);
      agent.currentPhase = firstLine(telemetry.state.currentPhase) || '';
      agent.nextAction = firstLine(telemetry.state.nextAction) || '';
    } catch {
      /* ignore read errors */
    }
  };

  refreshTelemetry();
  agent._telemetryWatchPaths = [];
  for (const p of watchPaths) {
    try {
      watchFile(p, { interval: 3000 }, refreshTelemetry);
      agent._telemetryWatchPaths.push(p);
    } catch {
      /* ignore watch setup errors */
    }
  }
}

function killAgent(id) {
  const agent = agents.get(id);
  if (!agent) return;

  if (agent.process) {
    agent.process.kill('SIGTERM');
    setTimeout(() => {
      if (agent.process) agent.process.kill('SIGKILL');
    }, 2000);
  }
  if (agent._telemetryWatchPaths?.length) {
    for (const p of agent._telemetryWatchPaths) {
      try {
        unwatchFile(p);
      } catch {
        /* ignore */
      }
    }
  }
  agents.delete(id);
}

// ── Dashboard rendering ──
function renderDashboard() {
  const rows = process.stdout.rows || 40;
  const cols = process.stdout.columns || 120;
  let out = CLEAR;
  const summary = summarizeAgents();

  // Header
  out += `${BG_BLACK}${BOLD}${CYAN} ⚡ HYPERSONIC MISSION CONTROL ${RESET}`;
  out += `${DIM} ${agents.size} agent(s) | ${new Date().toLocaleTimeString()}${RESET}\n`;
  if (agents.size > 0) {
    out += `${DIM} ${summary.running} running | ${summary.restarting} restarting | ${summary.sessions} sessions | ${summary.iterations} iterations | ${summary.kept} kept | ${summary.discarded} discarded | ${summary.throughputLabel}${RESET}\n`;
  }
  out += `${DIM}${'─'.repeat(Math.min(cols, 100))}${RESET}\n`;

  if (agents.size === 0) {
    out += `\n${DIM}  No agents running. Press ${RESET}${BOLD}a${RESET}${DIM} to add one.${RESET}\n`;
    out += `\n${DIM}  Platforms: claude, codex, gemini (free), opencode (free), aider (free)${RESET}\n`;
    out += `\n${DIM}  Example:${RESET}\n`;
    out += `${DIM}    Platform: gemini${RESET}\n`;
    out += `${DIM}    Project:  ~/my-project${RESET}\n`;
    out += `${DIM}    Vision:   Production-quality with 90% test coverage${RESET}\n`;
    out += `${DIM}    Plan:     docs/plan.md${RESET}\n`;
  } else {
    // Agent table
    out += `\n`;
    out += `  ${BOLD}${DIM}ID  STATUS       PLATFORM  ITER  KEEP%  SPD/H  PROJECT${RESET}\n`;

    for (const [id, a] of agents) {
      const statusColor = a.status === 'running' ? GREEN
        : a.status === 'restarting' ? YELLOW
        : a.status === 'error' ? RED
        : WHITE;

      const highlight = selectedAgent === id ? `${BOLD}${CYAN}` : '';
      const pointer = selectedAgent === id ? '▸ ' : '  ';

      out += `${highlight}${pointer}`;
      out += `${WHITE}${String(a.id).padEnd(4)}`;
      out += `${statusColor}${a.status.padEnd(13)}${RESET}${highlight}`;
      out += `${a.platform.padEnd(10)}`;
      out += `${String(a.iterations).padEnd(6)}`;
      out += `${formatPercent(a.successRate).padEnd(7)}`;
      out += `${formatSpeed(a.throughputPerHour).padEnd(7)}`;
      out += `${DIM}${basename(a.project)}${RESET}`;
      out += `\n`;
    }

    // Selected agent details
    if (selectedAgent && agents.has(selectedAgent)) {
      const a = agents.get(selectedAgent);
      const uptime = Math.floor((Date.now() - a.startTime.getTime()) / 60000);
      const sinceActivity = Math.floor((Date.now() - a.lastActivity.getTime()) / 1000);

      out += `\n${DIM}${'─'.repeat(Math.min(cols, 100))}${RESET}\n`;
      out += `  ${BOLD}${CYAN}Agent ${a.id}: ${a.name}${RESET}\n`;
      out += `  ${DIM}Vision:${RESET} ${a.vision.substring(0, 80)}${a.vision.length > 80 ? '...' : ''}\n`;
      out += `  ${DIM}Plan:${RESET}   ${a.plan || 'none (Phase 2 only)'}\n`;
      out += `  ${DIM}Params:${RESET} ${formatRuntimeParameters(a.runtime)}\n`;
      if (a.configPath) {
        out += `  ${DIM}Config:${RESET} ${a.configPath}\n`;
      }
      if (a.currentPhase) {
        out += `  ${DIM}Phase:${RESET}  ${normalizeDashboardText(a.currentPhase).substring(0, Math.max(cols - 18, 24))}\n`;
      }
      if (a.nextAction) {
        out += `  ${DIM}Next:${RESET}   ${a.nextAction.substring(0, Math.max(cols - 20, 20))}\n`;
      }
      out += `  ${DIM}Uptime:${RESET} ${uptime}min | ${DIM}Last activity:${RESET} ${sinceActivity}s ago\n`;
      out += `  ${DIM}Score:${RESET}  ${a.commits} kept / ${a.discarded} discarded | ${DIM}Keep rate:${RESET} ${formatPercent(a.successRate)} | ${DIM}Speed:${RESET} ${formatSpeed(a.throughputPerHour)}/h | ${DIM}Last commit:${RESET} ${a.lastCommit}\n`;
      if (a.lastSummary) {
        out += `  ${DIM}Latest:${RESET} ${formatOutcomeBadge(a.lastOutcome)} ${a.lastArea ? `${a.lastArea} ` : ''}${a.lastSummary.substring(0, Math.max(cols - 30, 20))}\n`;
      }

      // Last N log lines
      out += `\n  ${BOLD}Recent output:${RESET}\n`;
      const recentLines = a.log.slice(-a.recentOutputLines);
      for (const line of recentLines) {
        const time = line.time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const text = line.text.substring(0, cols - 14);
        out += `  ${DIM}${time}${RESET} ${text}\n`;
      }
    }

    const timeline = buildMissionTimeline(8);
    if (timeline.length > 0) {
      out += `\n${DIM}${'-'.repeat(Math.min(cols, 100))}${RESET}\n`;
      out += `  ${BOLD}Mission Timeline:${RESET}\n`;
      for (const event of timeline) {
        const when = event.timestamp
          ? event.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '--:--:--';
        const projectName = basename(event.project);
        const badge = event.outcome === 'kept' ? `${GREEN}KEEP${RESET}` : `${RED}DROP${RESET}`;
        const summaryText = `${projectName} ${badge} ${event.area ? `${event.area} ` : ''}${event.summary || ''}`.trim();
        out += `  ${DIM}${when}${RESET} ${summaryText.substring(0, cols - 14)}\n`;
      }
    }
  }

  // Footer
  out += `\n${DIM}${'─'.repeat(Math.min(cols, 100))}${RESET}\n`;
  out += `  ${BOLD}a${RESET}${DIM} add agent  `;
  out += `${RESET}${BOLD}x${RESET}${DIM} kill agent  `;
  out += `${RESET}${BOLD}↑↓${RESET}${DIM} select  `;
  out += `${RESET}${BOLD}j/k${RESET}${DIM} select  `;
  out += `${RESET}${BOLD}l${RESET}${DIM} view log  `;
  out += `${RESET}${BOLD}q${RESET}${DIM} quit${RESET}\n`;

  process.stdout.write(normalizeDashboardText(out));
}

function normalizeDashboardText(value) {
  return String(value)
    .replaceAll('Ã¢â‚¬â€', '-')
    .replaceAll('Ã¢â€â‚¬', '-')
    .replaceAll('â€”', '-')
    .replaceAll('â"€', '-')
    .replaceAll('\u2014', '-')
    .replaceAll('\u2500', '-');
}

function summarizeAgents() {
  let running = 0;
  let restarting = 0;
  let sessions = 0;
  let iterations = 0;
  let kept = 0;
  let discarded = 0;
  let throughputPerHour = 0;

  for (const agent of agents.values()) {
    if (agent.status === 'running') running++;
    if (agent.status === 'restarting') restarting++;
    sessions += agent.sessions;
    iterations += agent.iterations;
    kept += agent.commits;
    discarded += agent.discarded;
    throughputPerHour += agent.throughputPerHour || 0;
  }

  return {
    running,
    restarting,
    sessions,
    iterations,
    kept,
    discarded,
    throughputLabel: `${formatSpeed(throughputPerHour)}/h`,
  };
}

function buildMissionTimeline(limit = 8) {
  const events = [];

  for (const agent of agents.values()) {
    for (const event of agent.recentEvents || []) {
      events.push({
        ...event,
        project: agent.project,
        agentId: agent.id,
      });
    }
  }

  return events
    .sort((left, right) => {
      const leftTime = left.timestamp ? left.timestamp.getTime() : 0;
      const rightTime = right.timestamp ? right.timestamp.getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, limit);
}

function formatPercent(value) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(value * 100)}%`;
}

function formatSpeed(value) {
  const numeric = Number(value || 0);
  return (Math.round(numeric * 10) / 10).toFixed(1);
}

function formatOutcomeBadge(outcome) {
  if (outcome === 'kept') return `${GREEN}KEEP${RESET}`;
  if (outcome === 'discarded') return `${RED}DROP${RESET}`;
  return `${DIM}-${RESET}`;
}

function firstLine(value) {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '';
}

// ── Interactive menu for adding agents ──
async function promptAddAgent(rl) {
  mode = 'add';
  process.stdout.write(SHOW_CURSOR);

  const ask = (q) => new Promise(r => rl.question(`  ${CYAN}${q}${RESET} `, r));

  process.stdout.write(`\n${BOLD}${CYAN}  ⚡ Add New Agent${RESET}\n\n`);

  const project = normalizeProjectPath((await ask('Project path:')).trim() || '.');
  if (!project || !existsSync(project)) {
    process.stdout.write(`  ${RED}Path does not exist: ${project}${RESET}\n`);
    mode = 'dashboard';
    process.stdout.write(HIDE_CURSOR);
    return null;
  }

  const repoConfig = loadRuntimeConfig({ projectDir: project });
  const defaultPlatform = repoConfig.missionControl.defaultPlatform;
  const platform = (await ask(`Platform (claude/codex/gemini/opencode/aider) [${defaultPlatform}]:`)).trim().toLowerCase() || defaultPlatform;
  if (!['claude', 'codex', 'gemini', 'opencode', 'aider'].includes(platform)) {
    process.stdout.write(`  ${RED}Invalid platform. Use: claude, codex, gemini, opencode, aider${RESET}\n`);
    mode = 'dashboard';
    process.stdout.write(HIDE_CURSOR);
    return null;
  }

  const vision = (await ask('Vision:')).trim();
  if (!vision) {
    process.stdout.write(`  ${RED}Vision is required.${RESET}\n`);
    mode = 'dashboard';
    process.stdout.write(HIDE_CURSOR);
    return null;
  }

  let plan = (await ask('Plan file (enter to skip):')).trim() || null;
  if (plan) {
    const planPath = resolve(project, plan);
    if (!existsSync(planPath)) {
      process.stdout.write(`  ${YELLOW}Plan not found at: ${planPath}. Continuing without plan.${RESET}\n`);
      plan = null;
    }
  }
  const name = (await ask('Agent name (enter for auto):')).trim() || `${platform}-${basename(project)}`;

  const agent = createAgent(createAgentLaunchConfig({
    name,
    platform,
    project,
    vision,
    plan,
    repoConfig,
  }));
  process.stdout.write(`\n  ${GREEN}✓ Agent ${agent.id} (${agent.name}) launched on ${platform}${RESET}\n`);

  await new Promise(r => setTimeout(r, 1500));
  mode = 'dashboard';
  selectedAgent = agent.id;
  process.stdout.write(HIDE_CURSOR);
  return agent;
}

// ── View full log ──
function viewLog() {
  if (!selectedAgent || !agents.has(selectedAgent)) return;
  const agent = agents.get(selectedAgent);
  const logPath = findAutopilotLogFile(agent.project);

  process.stdout.write(CLEAR + SHOW_CURSOR);
  process.stdout.write(`${BOLD}${CYAN}  Log: ${agent.name} (${logPath})${RESET}\n`);
  process.stdout.write(`${DIM}  Press any key to return to dashboard${RESET}\n\n`);

  if (existsSync(logPath)) {
    const content = readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').slice(-40); // last 40 lines
    for (const line of lines) {
      process.stdout.write(`  ${line}\n`);
    }
  } else {
    process.stdout.write(`  ${DIM}No log file yet. Expected ${AUTOPILOT_LOG_FILE}.${RESET}\n`);
  }

  mode = 'log';
}

// ── Quick launch from CLI args ──
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) return null;

  if (args.includes('--help') || args.includes('-h')) {
    return { help: true };
  }

  if (args.includes('--version') || args.includes('-v')) {
    return { version: true };
  }

  const config = {
    platform: null,
    project: null,
    vision: '',
    plan: null,
    name: null,
    configPath: null,
    velocity: null,
    rigor: null,
    testMode: null,
    maxQuestions: null,
    autoCommit: null,
    restartDelayMs: null,
    refreshMs: null,
    maxLogLines: null,
    recentOutputLines: null,
  };
  const positional = [];

  let i = 0;
  while (i < args.length) {
    if (args[i] === '--claude') { config.platform = 'claude'; i++; }
    else if (args[i] === '--codex') { config.platform = 'codex'; i++; }
    else if (args[i] === '--gemini') { config.platform = 'gemini'; i++; }
    else if (args[i] === '--opencode') { config.platform = 'opencode'; i++; }
    else if (args[i] === '--aider') { config.platform = 'aider'; i++; }
    else if (args[i] === '--platform') { config.platform = args[++i]; i++; }
    else if (args[i] === '--project') { config.project = args[++i]; i++; }
    else if (args[i] === '--vision') { config.vision = args[++i]; i++; }
    else if (args[i] === '--plan') { config.plan = args[++i]; i++; }
    else if (args[i] === '--name') { config.name = args[++i]; i++; }
    else if (args[i] === '--config') { config.configPath = args[++i]; i++; }
    else if (args[i] === '--velocity') { config.velocity = args[++i]; i++; }
    else if (args[i] === '--rigor') { config.rigor = args[++i]; i++; }
    else if (args[i] === '--test-mode') { config.testMode = args[++i]; i++; }
    else if (args[i] === '--max-questions') { config.maxQuestions = args[++i]; i++; }
    else if (args[i] === '--auto-commit') { config.autoCommit = true; i++; }
    else if (args[i] === '--no-auto-commit') { config.autoCommit = false; i++; }
    else if (args[i] === '--restart-delay') { config.restartDelayMs = args[++i]; i++; }
    else if (args[i] === '--refresh-ms') { config.refreshMs = args[++i]; i++; }
    else if (args[i] === '--max-log-lines') { config.maxLogLines = args[++i]; i++; }
    else if (args[i] === '--recent-output-lines') { config.recentOutputLines = args[++i]; i++; }
    else if (args[i].startsWith('--')) { i++; }
    else { positional.push(args[i]); i++; }
  }

  if (!config.project && positional.length > 0) config.project = positional.shift();
  if (!config.vision && positional.length > 0) config.vision = positional.shift();
  if (!config.plan && positional.length > 0) config.plan = positional.shift();

  if (!config.vision) return null;
  return config;
}

function printUsage() {
  process.stdout.write(`\n${BOLD}Hypersonic Mission Control${RESET} v${VERSION}\n\n`);
  process.stdout.write(`Usage:\n`);
  process.stdout.write(`  hypersonic                         # interactive dashboard\n`);
  process.stdout.write(`  hypersonic --claude <project> <vision> [plan.md]\n`);
  process.stdout.write(`  hypersonic --project <project> --vision <vision> [--platform codex]\n`);
  process.stdout.write(`  hypersonic --codex <project> <vision> [plan.md]\n`);
  process.stdout.write(`  hypersonic --gemini <project> <vision> [plan.md]\n`);
  process.stdout.write(`  hypersonic --opencode <project> <vision> [plan.md]\n`);
  process.stdout.write(`  hypersonic --aider <project> <vision> [plan.md]\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  -h, --help        Show help\n`);
  process.stdout.write(`  -v, --version     Show version\n`);
  process.stdout.write(`  --name <name>     Set agent name\n`);
  process.stdout.write(`  --config <path>   Load a specific .hypersonic/config.yml\n`);
  process.stdout.write(`  --velocity <v>    low | medium | high\n`);
  process.stdout.write(`  --rigor <v>       low | medium | high\n`);
  process.stdout.write(`  --test-mode <m>   auto | relevant | full | none\n`);
  process.stdout.write(`  --max-questions N 0-9\n`);
  process.stdout.write(`  --auto-commit     Inject auto_commit=true into prompt\n`);
  process.stdout.write(`  --no-auto-commit  Force auto_commit=false\n`);
  process.stdout.write(`  --restart-delay N Restart delay in milliseconds\n`);
  process.stdout.write(`  --refresh-ms N    Dashboard refresh interval in milliseconds\n`);
  process.stdout.write(`  --max-log-lines N Retained in-memory log lines per agent\n`);
  process.stdout.write(`  --recent-output-lines N Lines shown in dashboard details\n\n`);
}

function createAgentLaunchConfig(input) {
  const project = normalizeProjectPath(input.project || '.');
  const repoConfig = input.repoConfig || loadRuntimeConfig({ projectDir: project, explicitPath: input.configPath || null });

  const runtime = { ...repoConfig.defaults };
  const missionControl = { ...repoConfig.missionControl };

  if (input.velocity) runtime.velocity = normalizeChoice(input.velocity, ['low', 'medium', 'high'], runtime.velocity);
  if (input.rigor) runtime.rigor = normalizeChoice(input.rigor, ['low', 'medium', 'high'], runtime.rigor);
  if (input.testMode) runtime.testMode = normalizeChoice(input.testMode, ['auto', 'relevant', 'full', 'none'], runtime.testMode);
  if (input.maxQuestions !== null && input.maxQuestions !== undefined) {
    runtime.maxQuestions = normalizeNumber(input.maxQuestions, runtime.maxQuestions, 0, 9);
  }
  if (typeof input.autoCommit === 'boolean') {
    runtime.autoCommit = input.autoCommit;
  }

  if (input.restartDelayMs !== null && input.restartDelayMs !== undefined) {
    missionControl.restartDelayMs = normalizeNumber(input.restartDelayMs, missionControl.restartDelayMs, 0, 300000);
  }
  if (input.refreshMs !== null && input.refreshMs !== undefined) {
    missionControl.dashboardRefreshMs = normalizeNumber(input.refreshMs, missionControl.dashboardRefreshMs, 250, 60000);
  }
  if (input.maxLogLines !== null && input.maxLogLines !== undefined) {
    missionControl.maxLogLines = normalizeNumber(input.maxLogLines, missionControl.maxLogLines, 10, 1000);
  }
  if (input.recentOutputLines !== null && input.recentOutputLines !== undefined) {
    missionControl.recentOutputLines = normalizeNumber(input.recentOutputLines, missionControl.recentOutputLines, 1, missionControl.maxLogLines);
  }
  missionControl.recentOutputLines = Math.min(missionControl.recentOutputLines, missionControl.maxLogLines);

  const platform = normalizeChoice(
    input.platform || missionControl.defaultPlatform,
    ['claude', 'codex', 'gemini', 'opencode', 'aider'],
    missionControl.defaultPlatform,
  );

  let plan = input.plan || null;
  if (plan) {
    const planPath = resolve(project, plan);
    if (!existsSync(planPath)) plan = null;
  }

  return {
    name: input.name,
    platform,
    project,
    vision: input.vision,
    plan,
    configPath: repoConfig.configPath,
    runtime,
    refreshMs: missionControl.dashboardRefreshMs,
    restartDelayMs: missionControl.restartDelayMs,
    maxLogLines: missionControl.maxLogLines,
    recentOutputLines: missionControl.recentOutputLines,
  };
}

function normalizeChoice(value, valid, fallback) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return valid.includes(normalized) ? normalized : fallback;
}

function normalizeNumber(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return fallback;
  if (numeric < min || numeric > max) return fallback;
  return numeric;
}

// ── Main ──
async function main() {
  const quickConfig = parseArgs();
  if (quickConfig?.help) {
    printUsage();
    process.exit(0);
  }
  if (quickConfig?.version) {
    process.stdout.write(`${VERSION}\n`);
    process.exit(0);
  }

  process.stdout.write(HIDE_CURSOR);
  process.on('exit', () => {
    process.stdout.write(SHOW_CURSOR);
    for (const [id] of agents) killAgent(id);
  });
  process.on('SIGINT', () => {
    process.stdout.write(`\n${YELLOW}  Shutting down all agents...${RESET}\n`);
    for (const [id] of agents) killAgent(id);
    process.stdout.write(SHOW_CURSOR);
    process.exit(0);
  });

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdin.setRawMode && process.stdin.setRawMode(true);
  process.stdin.resume();

  let refreshIntervalMs = DEFAULT_RUNTIME_CONFIG.missionControl.dashboardRefreshMs;
  if (quickConfig) {
    const prepared = createAgentLaunchConfig(quickConfig);
    if (!existsSync(prepared.project)) {
      process.stdout.write(`${RED}Project path does not exist: ${prepared.project}${RESET}\n`);
      process.exit(1);
    }
    prepared.name = prepared.name || `${prepared.platform}-${basename(prepared.project)}`;
    const agent = createAgent(prepared);
    selectedAgent = agent.id;
    refreshIntervalMs = prepared.refreshMs;
    process.stdout.write(`${GREEN}  ✓ Quick launched: ${agent.name}${RESET}\n`);
  }

  // Dashboard refresh loop
  refreshTimer = setInterval(() => {
    if (mode === 'dashboard') renderDashboard();
  }, refreshIntervalMs);

  // Initial render
  if (mode === 'dashboard') renderDashboard();

  // Key handling
  process.stdin.on('data', async (key) => {
    const k = key.toString();

    if (mode === 'log') {
      mode = 'dashboard';
      process.stdout.write(HIDE_CURSOR);
      renderDashboard();
      return;
    }

    if (mode === 'add') return; // readline handles input

    switch (k) {
      case 'q':
      case '\x03': // Ctrl+C
        process.stdout.write(`\n${YELLOW}  Shutting down all agents...${RESET}\n`);
        for (const [id] of agents) killAgent(id);
        process.stdout.write(SHOW_CURSOR);
        clearInterval(refreshTimer);
        process.exit(0);
        break;

      case 'a':
        clearInterval(refreshTimer);
        process.stdin.setRawMode && process.stdin.setRawMode(false);
        const addedAgent = await promptAddAgent(rl);
        if (addedAgent?.dashboardRefreshMs) {
          refreshIntervalMs = addedAgent.dashboardRefreshMs;
        }
        process.stdin.setRawMode && process.stdin.setRawMode(true);
        refreshTimer = setInterval(() => {
          if (mode === 'dashboard') renderDashboard();
        }, refreshIntervalMs);
        renderDashboard();
        break;

      case 'x':
        if (selectedAgent) {
          killAgent(selectedAgent);
          const ids = [...agents.keys()];
          selectedAgent = ids.length > 0 ? ids[0] : null;
          renderDashboard();
        }
        break;

      case 'l':
        viewLog();
        break;

      case '\x1b[A': // Up arrow
      case 'k': {
        const ids = [...agents.keys()];
        if (ids.length === 0) break;
        const idx = ids.indexOf(selectedAgent);
        selectedAgent = ids[Math.max(0, idx - 1)];
        renderDashboard();
        break;
      }

      case '\x1b[B': // Down arrow
      case 'j': {
        const ids = [...agents.keys()];
        if (ids.length === 0) break;
        const idx = ids.indexOf(selectedAgent);
        selectedAgent = ids[Math.min(ids.length - 1, idx + 1)];
        renderDashboard();
        break;
      }
    }
  });
}

main().catch(err => {
  process.stdout.write(SHOW_CURSOR);
  console.error(err);
  process.exit(1);
});
