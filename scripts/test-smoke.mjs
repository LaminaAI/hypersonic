#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const nodeChecks = ['cli/hypersonic-runtime.mjs', 'cli/hypersonic-runtime-lib.mjs', 'cli/hypersonic.mjs'];

const shellChecks = [
  'hooks/session-start.sh',
  'scripts/hypersonic-common.sh',
  'scripts/hypersonic-loop.sh',
  'scripts/hypersonic-loop-aider.sh',
  'scripts/hypersonic-loop-codex.sh',
  'scripts/hypersonic-loop-gemini.sh',
  'scripts/hypersonic-loop-opencode.sh',
];

for (const file of nodeChecks) {
  run(process.execPath, ['--check', join(repoRoot, file)], `node --check ${file}`);
}

const bashProbe = spawnSync('bash', ['--version'], { stdio: 'ignore' });
if (!bashProbe.error && bashProbe.status === 0) {
  // Strip CR so heredocs and line endings parse under Git Bash on Windows (CRLF checkouts).
  const stripCr = shellChecks.map((f) => `bash -n <(tr -d '\\r' < "${f}")`).join(' && ');
  run('bash', ['-c', stripCr], 'bash -n shell scripts (CRLF-safe)', repoRoot);
} else {
  process.stdout.write('Skipping shell syntax checks because bash is unavailable in this environment.\n');
}

function run(command, args, label, cwd = repoRoot) {
  const result = spawnSync(command, args, { stdio: 'inherit', cwd });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(`Command failed: ${label}\n`);
    process.exit(result.status ?? 1);
  }
}
