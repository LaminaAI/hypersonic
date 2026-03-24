#!/usr/bin/env node

// ⚡ Hypersonic Mission Control
// Spin up multiple infinite autopilot agents, monitor them all from one terminal.
// Zero dependencies — pure Node.js.

import { spawn } from 'child_process';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { createInterface } from 'readline';
import { resolve, basename } from 'path';

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

// ── Agent class ──
function createAgent(config) {
  const id = nextId++;
  const agent = {
    id,
    name: config.name || `agent-${id}`,
    platform: config.platform, // 'claude' | 'codex'
    project: resolve(config.project),
    vision: config.vision,
    plan: config.plan || null,
    process: null,
    status: 'starting',
    sessions: 0,
    iterations: 0,
    commits: 0,
    lastCommit: '—',
    lastActivity: new Date(),
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

  // Build the prompt
  let prompt;
  const stateFile = resolve(agent.project, '.autopilot-state.md');

  if (existsSync(stateFile)) {
    prompt = 'Resume autopilot. Read .autopilot-state.md and continue exactly where the last session left off. Do not ask me anything. Just continue.';
  } else if (agent.plan) {
    prompt = `Activate autopilot. Vision: ${agent.vision}. Plan file: ${agent.plan}. Read the plan completely, execute every task in order. After the plan is done, iterate infinitely on T1-T6 improvements. Never stop. Never ask. I am going away.`;
  } else {
    prompt = `Activate autopilot in infinite improvement mode. Vision: ${agent.vision}. No plan file. Scan the codebase, find highest-value improvement, implement, test, commit or discard, repeat forever. Never stop. Never ask. I am going away.`;
  }

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
    return;
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
        if (agent.log.length > 100) agent.log.shift();
        agent.lastActivity = new Date();
      }
    });

    agent.process.stderr.on('data', (data) => {
      const line = data.toString().trim();
      if (line) {
        agent.log.push({ time: new Date(), text: `${RED}${line}${RESET}` });
        if (agent.log.length > 100) agent.log.shift();
      }
    });

    agent.process.on('exit', (code) => {
      agent.status = 'restarting';
      agent.process = null;

      // Auto-restart after 5 seconds (the infinite loop)
      setTimeout(() => {
        if (agents.has(agent.id)) {
          agent.log.push({
            time: new Date(),
            text: `${YELLOW}Session ${agent.sessions} ended (exit ${code}). Restarting...${RESET}`
          });
          spawnAgent(agent);
        }
      }, 5000);
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
  const logPath = resolve(agent.project, '.autopilot-log.md');

  const parseLog = () => {
    if (!existsSync(logPath)) return;
    try {
      const content = readFileSync(logPath, 'utf-8');
      // Count iterations from the table
      const iterationMatches = content.match(/\| \d+ \|/g);
      if (iterationMatches) agent.iterations = iterationMatches.length;
      // Count commits (✅ in kept column)
      const commitMatches = content.match(/✅/g);
      if (commitMatches) agent.commits = commitMatches.length;
      // Get last commit hash
      const hashMatch = content.match(/([a-f0-9]{7})\s*\|?\s*$/gm);
      if (hashMatch) {
        const last = hashMatch[hashMatch.length - 1].trim().replace(/\|/g, '').trim();
        if (last.length === 7) agent.lastCommit = last;
      }
    } catch (e) { /* ignore read errors */ }
  };

  parseLog();
  watchFile(logPath, { interval: 3000 }, parseLog);
  agent._logWatcher = logPath;
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
  if (agent._logWatcher) unwatchFile(agent._logWatcher);
  agents.delete(id);
}

// ── Dashboard rendering ──
function renderDashboard() {
  const rows = process.stdout.rows || 40;
  const cols = process.stdout.columns || 120;
  let out = CLEAR;

  // Header
  out += `${BG_BLACK}${BOLD}${CYAN} ⚡ HYPERSONIC MISSION CONTROL ${RESET}`;
  out += `${DIM} ${agents.size} agent(s) | ${new Date().toLocaleTimeString()}${RESET}\n`;
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
    out += `  ${BOLD}${DIM}ID  STATUS       PLATFORM  SESSIONS  ITERATIONS  COMMITS  PROJECT${RESET}\n`;

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
      out += `${String(a.sessions).padEnd(10)}`;
      out += `${String(a.iterations).padEnd(12)}`;
      out += `${String(a.commits).padEnd(9)}`;
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
      out += `  ${DIM}Uptime:${RESET} ${uptime}min | ${DIM}Last activity:${RESET} ${sinceActivity}s ago\n`;

      // Last N log lines
      out += `\n  ${BOLD}Recent output:${RESET}\n`;
      const recentLines = a.log.slice(-8);
      for (const line of recentLines) {
        const time = line.time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const text = line.text.substring(0, cols - 14);
        out += `  ${DIM}${time}${RESET} ${text}\n`;
      }
    }
  }

  // Footer
  out += `\n${DIM}${'─'.repeat(Math.min(cols, 100))}${RESET}\n`;
  out += `  ${BOLD}a${RESET}${DIM} add agent  `;
  out += `${RESET}${BOLD}k${RESET}${DIM} kill agent  `;
  out += `${RESET}${BOLD}↑↓${RESET}${DIM} select  `;
  out += `${RESET}${BOLD}l${RESET}${DIM} view log  `;
  out += `${RESET}${BOLD}q${RESET}${DIM} quit${RESET}\n`;

  process.stdout.write(out);
}

// ── Interactive menu for adding agents ──
async function promptAddAgent(rl) {
  mode = 'add';
  process.stdout.write(SHOW_CURSOR);

  const ask = (q) => new Promise(r => rl.question(`  ${CYAN}${q}${RESET} `, r));

  process.stdout.write(`\n${BOLD}${CYAN}  ⚡ Add New Agent${RESET}\n\n`);

  const platform = (await ask('Platform (claude/codex/gemini/opencode/aider):')).trim().toLowerCase() || 'claude';
  if (!['claude', 'codex', 'gemini', 'opencode', 'aider'].includes(platform)) {
    process.stdout.write(`  ${RED}Invalid platform. Use: claude, codex, gemini, opencode, aider${RESET}\n`);
    mode = 'dashboard';
    process.stdout.write(HIDE_CURSOR);
    return;
  }

  const project = (await ask('Project path:')).trim().replace(/^~/, process.env.HOME);
  if (!project || !existsSync(project)) {
    process.stdout.write(`  ${RED}Path does not exist: ${project}${RESET}\n`);
    mode = 'dashboard';
    process.stdout.write(HIDE_CURSOR);
    return;
  }

  const vision = (await ask('Vision:')).trim();
  if (!vision) {
    process.stdout.write(`  ${RED}Vision is required.${RESET}\n`);
    mode = 'dashboard';
    process.stdout.write(HIDE_CURSOR);
    return;
  }

  const plan = (await ask('Plan file (enter to skip):')).trim() || null;
  const name = (await ask('Agent name (enter for auto):')).trim() || `${platform}-${basename(project)}`;

  const agent = createAgent({ name, platform, project, vision, plan });
  process.stdout.write(`\n  ${GREEN}✓ Agent ${agent.id} (${agent.name}) launched on ${platform}${RESET}\n`);

  await new Promise(r => setTimeout(r, 1500));
  mode = 'dashboard';
  selectedAgent = agent.id;
  process.stdout.write(HIDE_CURSOR);
}

// ── View full log ──
function viewLog() {
  if (!selectedAgent || !agents.has(selectedAgent)) return;
  const agent = agents.get(selectedAgent);
  const logPath = resolve(agent.project, '.autopilot-log.md');

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
    process.stdout.write(`  ${DIM}No log file yet.${RESET}\n`);
  }

  mode = 'log';
}

// ── Quick launch from CLI args ──
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) return null;

  // hypersonic --claude ~/project "vision" plan.md
  // hypersonic --gemini ~/project "vision"
  // hypersonic --aider ~/project "vision"
  const config = { platform: 'claude', project: '.', vision: '', plan: null, name: null };

  let i = 0;
  while (i < args.length) {
    if (args[i] === '--claude') { config.platform = 'claude'; i++; }
    else if (args[i] === '--codex') { config.platform = 'codex'; i++; }
    else if (args[i] === '--gemini') { config.platform = 'gemini'; i++; }
    else if (args[i] === '--opencode') { config.platform = 'opencode'; i++; }
    else if (args[i] === '--aider') { config.platform = 'aider'; i++; }
    else if (args[i] === '--name') { config.name = args[++i]; i++; }
    else if (!config.project || config.project === '.') {
      config.project = args[i].replace(/^~/, process.env.HOME); i++;
    }
    else if (!config.vision) { config.vision = args[i]; i++; }
    else if (!config.plan) { config.plan = args[i]; i++; }
    else i++;
  }

  if (!config.vision) return null;
  return config;
}

// ── Main ──
async function main() {
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

  // Quick launch from CLI args
  const quickConfig = parseArgs();
  if (quickConfig) {
    quickConfig.name = quickConfig.name || `${quickConfig.platform}-${basename(quickConfig.project)}`;
    const agent = createAgent(quickConfig);
    selectedAgent = agent.id;
    process.stdout.write(`${GREEN}  ✓ Quick launched: ${agent.name}${RESET}\n`);
  }

  // Dashboard refresh loop
  refreshTimer = setInterval(() => {
    if (mode === 'dashboard') renderDashboard();
  }, 2000);

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
        await promptAddAgent(rl);
        process.stdin.setRawMode && process.stdin.setRawMode(true);
        refreshTimer = setInterval(() => {
          if (mode === 'dashboard') renderDashboard();
        }, 2000);
        renderDashboard();
        break;

      case 'k':
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
      case 'j': {
        const ids = [...agents.keys()];
        if (ids.length === 0) break;
        const idx = ids.indexOf(selectedAgent);
        selectedAgent = ids[Math.max(0, idx - 1)];
        renderDashboard();
        break;
      }

      case '\x1b[B': // Down arrow
      case 'k': {
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
