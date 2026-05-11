#!/usr/bin/env node

import {
  buildParameterContract,
  buildAutopilotPrompt,
  loadRuntimeConfig,
  normalizeProjectPath,
  readAutopilotTelemetry,
  toShellEnv,
} from './hypersonic-runtime-lib.mjs';

function parseArgs(argv) {
  const parsed = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project') parsed.project = argv[++i];
    else if (arg === '--config') parsed.config = argv[++i];
    else if (arg === '--vision') parsed.vision = argv[++i];
    else if (arg === '--plan') parsed.plan = argv[++i];
    else if (arg === '--autopilot') parsed.autopilot = true;
  }

  return parsed;
}

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const projectDir = normalizeProjectPath(args.project || '.');
const runtimeConfig = loadRuntimeConfig({ projectDir, explicitPath: args.config || null });

switch (command) {
  case 'env':
    process.stdout.write(`${toShellEnv(runtimeConfig)}\n`);
    break;

  case 'prompt':
    if (!args.vision) {
      process.stderr.write('Missing --vision for prompt command.\n');
      process.exit(1);
    }
    process.stdout.write(
      `${buildAutopilotPrompt({
        projectDir,
        vision: args.vision,
        plan: args.plan || null,
        runtimeConfig,
      })}\n`,
    );
    break;

  case 'contract':
    process.stdout.write(`${buildParameterContract(runtimeConfig.defaults, { autopilot: Boolean(args.autopilot) })}\n`);
    break;

  case 'telemetry':
    process.stdout.write(`${JSON.stringify(readAutopilotTelemetry(projectDir), null, 2)}\n`);
    break;

  default:
    process.stderr.write('Usage: hypersonic-runtime.mjs <env|prompt|contract|telemetry> [--project dir] [--config path] [--vision text] [--plan path] [--autopilot]\n');
    process.exit(1);
}
