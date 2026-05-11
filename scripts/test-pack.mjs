#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(tmpdir(), 'hypersonic-npm-cache');
mkdirSync(cacheDir, { recursive: true });

const env = { ...process.env, npm_config_cache: cacheDir };

const result =
  process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm pack --dry-run'], {
        stdio: 'inherit',
        cwd: repoRoot,
        env,
      })
    : spawnSync('npm', ['pack', '--dry-run'], {
        stdio: 'inherit',
        cwd: repoRoot,
        env,
      });

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
