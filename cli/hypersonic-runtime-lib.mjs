import { existsSync, readFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export const AUTOPILOT_STATE_FILE = '.hsonic-autopilot-state.md';
export const LEGACY_AUTOPILOT_STATE_FILE = '.autopilot-state.md';
export const AUTOPILOT_LOG_FILE = '.hsonic-autopilot-log.md';
export const LEGACY_AUTOPILOT_LOG_FILE = '.autopilot-log.md';

export const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  configPath: null,
  defaults: {
    velocity: 'high',
    rigor: 'medium',
    maxQuestions: 1,
    testMode: 'auto',
    autoCommit: false,
  },
  missionControl: {
    defaultPlatform: 'claude',
    restartDelayMs: 5000,
    dashboardRefreshMs: 2000,
    maxLogLines: 100,
    recentOutputLines: 8,
  },
});

const VALID_VELOCITY = new Set(['low', 'medium', 'high']);
const VALID_RIGOR = new Set(['low', 'medium', 'high']);
const VALID_TEST_MODE = new Set(['auto', 'relevant', 'full', 'none']);
const VALID_PLATFORMS = new Set(['claude', 'codex', 'gemini', 'opencode', 'aider']);

export function normalizeProjectPath(projectPath = '.') {
  return resolve(projectPath.replace(/^~(?=$|\/|\\)/, process.env.HOME || '~'));
}

export function loadRuntimeConfig({ projectDir = process.cwd(), explicitPath = null } = {}) {
  const resolvedProject = normalizeProjectPath(projectDir);
  const configPath = explicitPath
    ? normalizeProjectPath(explicitPath)
    : findConfigUpward(resolvedProject);

  if (!configPath || !existsSync(configPath)) {
    return structuredClone(DEFAULT_RUNTIME_CONFIG);
  }

  try {
    const raw = parseSimpleYaml(readFileSync(configPath, 'utf-8'));
    return normalizeRuntimeConfig(raw, configPath);
  } catch {
    return structuredClone(DEFAULT_RUNTIME_CONFIG);
  }
}

export function buildAutopilotPrompt({ projectDir, vision, plan = null, runtimeConfig = DEFAULT_RUNTIME_CONFIG }) {
  const stateFile = findAutopilotStateFile(projectDir);
  const parameters = formatRuntimeParameters(runtimeConfig.defaults);
  const parameterContract = buildParameterContract(runtimeConfig.defaults, { autopilot: true });

  if (existsSync(stateFile)) {
    const stateFileName = basename(stateFile);
    return [
      'Resume autopilot.',
      `Read ${stateFileName} and continue exactly where the last session left off.`,
      stateFileName === LEGACY_AUTOPILOT_STATE_FILE
        ? `On your next checkpoint, migrate to ${AUTOPILOT_STATE_FILE}.`
        : null,
      'Do not ask me anything.',
      'Do not re-plan.',
      `Keep local history in ${AUTOPILOT_LOG_FILE}.`,
      'Just continue.',
      `Operating parameters: ${parameters}.`,
      parameterContract,
    ].filter(Boolean).join(' ');
  }

  if (plan) {
    return [
      `Activate autopilot. Vision: ${vision}.`,
      `Plan file: ${plan}.`,
      'Read the plan file completely, then execute every task in order.',
      `Use ${AUTOPILOT_STATE_FILE} for checkpoints and ${AUTOPILOT_LOG_FILE} for local history.`,
      'Prefer fewer meaningful iterations over shallow churn.',
      'After the plan is done, iterate infinitely on T1-T6 improvements toward the vision.',
      'Never stop.',
      'Never ask.',
      'I am going away.',
      `Operating parameters: ${parameters}.`,
      parameterContract,
    ].join(' ');
  }

  return [
    `Activate autopilot in infinite improvement mode. Vision: ${vision}.`,
    'No plan file.',
    `Use ${AUTOPILOT_STATE_FILE} for checkpoints and ${AUTOPILOT_LOG_FILE} for local history.`,
    'Maintain a short ranked backlog tied to the vision.',
    'Scan the codebase, choose the highest-value improvement, baseline it, implement, verify, commit or discard, and repeat forever.',
    'Prefer fewer meaningful iterations over shallow churn.',
    'Never stop.',
    'Never ask.',
    'I am going away.',
    `Operating parameters: ${parameters}.`,
    parameterContract,
  ].join(' ');
}

export function findAutopilotStateFile(projectDir) {
  const preferred = resolve(projectDir, AUTOPILOT_STATE_FILE);
  if (existsSync(preferred)) return preferred;

  const legacy = resolve(projectDir, LEGACY_AUTOPILOT_STATE_FILE);
  if (existsSync(legacy)) return legacy;

  return preferred;
}

export function findAutopilotLogFile(projectDir) {
  const preferred = resolve(projectDir, AUTOPILOT_LOG_FILE);
  if (existsSync(preferred)) return preferred;

  const legacy = resolve(projectDir, LEGACY_AUTOPILOT_LOG_FILE);
  if (existsSync(legacy)) return legacy;

  return preferred;
}

export function formatRuntimeParameters(defaults) {
  return [
    `velocity=${defaults.velocity}`,
    `rigor=${defaults.rigor}`,
    `max_questions=${defaults.maxQuestions}`,
    `test_mode=${defaults.testMode}`,
    `auto_commit=${defaults.autoCommit}`,
  ].join(', ');
}

export function buildParameterContract(defaults, { autopilot = false } = {}) {
  const testModeMeaning = {
    none: 'skip automated tests unless the change is risky or the workflow requires proof',
    auto: 'run the most relevant checks for the changed area before declaring done',
    relevant: 'run targeted checks plus nearby regression coverage before declaring done',
    full: 'run the full test suite before declaring done',
  }[defaults.testMode];

  const autoCommitMeaning = autopilot
    ? 'for autopilot, kept iterations must still commit so the loop can resume cleanly'
    : defaults.autoCommit
      ? 'commit once the workflow says the work is complete and verified, without waiting for another ship prompt'
      : 'do not commit unless the user asks to ship or the workflow explicitly requires a commit';

  const questionMeaning = autopilot
    ? 'in autopilot, treat this as 0 and make the best local decision without asking the human'
    : `ask at most ${defaults.maxQuestions} user-facing clarification question${defaults.maxQuestions === 1 ? '' : 's'} before acting, then state assumptions and continue unless the risk is truly high`;

  return [
    'Parameter contract:',
    `velocity=${defaults.velocity} -> ${describeVelocity(defaults.velocity, autopilot)}`,
    `rigor=${defaults.rigor} -> ${describeRigor(defaults.rigor, autopilot)}`,
    `max_questions=${defaults.maxQuestions} -> ${questionMeaning}`,
    `test_mode=${defaults.testMode} -> ${testModeMeaning}`,
    `auto_commit=${defaults.autoCommit} -> ${autoCommitMeaning}`,
    'Treat these as operating constraints, not suggestions.',
  ].join(' ');
}

export function toShellEnv(runtimeConfig) {
  const env = {
    HYPERSONIC_CONFIG_PATH: runtimeConfig.configPath || '',
    HYPERSONIC_VELOCITY: runtimeConfig.defaults.velocity,
    HYPERSONIC_RIGOR: runtimeConfig.defaults.rigor,
    HYPERSONIC_MAX_QUESTIONS: String(runtimeConfig.defaults.maxQuestions),
    HYPERSONIC_TEST_MODE: runtimeConfig.defaults.testMode,
    HYPERSONIC_AUTO_COMMIT: String(runtimeConfig.defaults.autoCommit),
    HYPERSONIC_DEFAULT_PLATFORM: runtimeConfig.missionControl.defaultPlatform,
    HYPERSONIC_RESTART_DELAY_MS: String(runtimeConfig.missionControl.restartDelayMs),
    HYPERSONIC_DASHBOARD_REFRESH_MS: String(runtimeConfig.missionControl.dashboardRefreshMs),
    HYPERSONIC_MAX_LOG_LINES: String(runtimeConfig.missionControl.maxLogLines),
    HYPERSONIC_RECENT_OUTPUT_LINES: String(runtimeConfig.missionControl.recentOutputLines),
  };

  return Object.entries(env)
    .map(([key, value]) => `${key}=${shellQuote(value)}`)
    .join('\n');
}

export function resolveRepoRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

function normalizeRuntimeConfig(rawConfig, configPath) {
  const defaults = rawConfig.defaults || {};
  const missionControl = rawConfig.mission_control || rawConfig.missionControl || {};

  const normalized = structuredClone(DEFAULT_RUNTIME_CONFIG);
  normalized.configPath = configPath;

  normalized.defaults.velocity = normalizeEnum(readValue(defaults, ['velocity']), VALID_VELOCITY, normalized.defaults.velocity);
  normalized.defaults.rigor = normalizeEnum(readValue(defaults, ['rigor']), VALID_RIGOR, normalized.defaults.rigor);
  normalized.defaults.maxQuestions = normalizeInteger(readValue(defaults, ['max_questions', 'maxQuestions']), normalized.defaults.maxQuestions, { min: 0, max: 9 });
  normalized.defaults.testMode = normalizeEnum(readValue(defaults, ['test_mode', 'testMode']), VALID_TEST_MODE, normalized.defaults.testMode);
  normalized.defaults.autoCommit = normalizeBoolean(readValue(defaults, ['auto_commit', 'autoCommit']), normalized.defaults.autoCommit);

  normalized.missionControl.defaultPlatform = normalizeEnum(
    readValue(missionControl, ['default_platform', 'defaultPlatform']),
    VALID_PLATFORMS,
    normalized.missionControl.defaultPlatform,
  );
  normalized.missionControl.restartDelayMs = normalizeInteger(
    readValue(missionControl, ['restart_delay_ms', 'restartDelayMs']),
    normalized.missionControl.restartDelayMs,
    { min: 0, max: 300000 },
  );
  normalized.missionControl.dashboardRefreshMs = normalizeInteger(
    readValue(missionControl, ['dashboard_refresh_ms', 'dashboardRefreshMs']),
    normalized.missionControl.dashboardRefreshMs,
    { min: 250, max: 60000 },
  );
  normalized.missionControl.maxLogLines = normalizeInteger(
    readValue(missionControl, ['max_log_lines', 'maxLogLines']),
    normalized.missionControl.maxLogLines,
    { min: 10, max: 1000 },
  );
  normalized.missionControl.recentOutputLines = normalizeInteger(
    readValue(missionControl, ['recent_output_lines', 'recentOutputLines']),
    normalized.missionControl.recentOutputLines,
    { min: 1, max: normalized.missionControl.maxLogLines },
  );

  if (normalized.missionControl.recentOutputLines > normalized.missionControl.maxLogLines) {
    normalized.missionControl.recentOutputLines = normalized.missionControl.maxLogLines;
  }

  return normalized;
}

function findConfigUpward(startDir) {
  let current = resolve(startDir);

  while (true) {
    const candidate = resolve(current, '.hypersonic/config.yml');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = resolve(current, '..');
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function parseSimpleYaml(content) {
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const rawLine of content.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = rawLine.match(/^(\s*)([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, indentText, key, valueText] = match;
    const indent = indentText.length;

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;
    const value = valueText.trim();

    if (!value) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
      continue;
    }

    parent[key] = parseScalar(value);
  }

  return root;
}

function parseScalar(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);

  return value;
}

function normalizeEnum(value, validValues, fallback) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return validValues.has(normalized) ? normalized : fallback;
}

function normalizeInteger(value, fallback, { min, max }) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return fallback;
  if (numeric < min || numeric > max) return fallback;
  return numeric;
}

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function readValue(object, keys) {
  for (const key of keys) {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      return object[key];
    }
  }
  return undefined;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function describeVelocity(value, autopilot) {
  switch (value) {
    case 'low':
      return autopilot
        ? 'take larger planning pauses, prefer deeper iterations, and spend more effort on verification and cleanup'
        : 'allow more planning, more explicit tradeoff handling, and slower but safer execution';
    case 'medium':
      return autopilot
        ? 'keep steady progress with balanced iteration size and balanced verification'
        : 'balance speed with moderate planning, moderate cleanup, and normal verification';
    case 'high':
    default:
      return autopilot
        ? 'prefer smaller meaningful iterations, faster keep-or-discard decisions, and minimal ceremony'
        : 'prefer the smallest viable workflow, short plans, and the first useful result';
  }
}

function describeRigor(value, autopilot) {
  switch (value) {
    case 'low':
      return autopilot
        ? 'keep checkpoints short, verify the core behavior, and avoid extra polish work'
        : 'use the minimum safe process, lighter artifacts, and only the verification that proves the change';
    case 'high':
      return autopilot
        ? 'use stronger baselines, broader verification, and avoid shallow iterations'
        : 'slow down, state assumptions clearly, and use stronger verification before claiming done';
    case 'medium':
    default:
      return autopilot
        ? 'keep normal checkpoints, normal verification, and balanced iteration depth'
        : 'use normal planning, normal cleanup, and normal verification for the task size';
  }
}
