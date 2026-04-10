import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AUTOPILOT_LOG_FILE,
  AUTOPILOT_STATE_FILE,
  parseAutopilotLog,
  parseAutopilotState,
  readAutopilotTelemetry,
} from '../cli/hypersonic-runtime-lib.mjs';

run('parseAutopilotLog extracts kept and discarded iterations from mixed markdown logs', () => {
  const log = [
    '# Hypersonic Autopilot Log',
    '',
    '| Iter | Time | Tier | Outcome | Commit | Summary |',
    '| --- | --- | --- | --- | --- | --- |',
    '| 1 | 09:00:00 | T2 | kept | abc1234 | Add regression test for retry policy |',
    '| 2 | 09:20:00 | T4 | discarded | | Memoize lookup with no improvement |',
    '09:45:00 ✅ T3: Harden config merge path fedcba9',
    '10:15:00 ❌ T5: rename helpers only, discarded',
  ].join('\n');

  const telemetry = parseAutopilotLog(log, { now: new Date('2026-04-09T12:00:00-04:00') });

  assert.equal(telemetry.iterations, 4);
  assert.equal(telemetry.kept, 2);
  assert.equal(telemetry.discarded, 2);
  assert.equal(telemetry.commits, 2);
  assert.equal(telemetry.lastCommit, 'fedcba9');
  assert.equal(telemetry.lastOutcome, 'discarded');
  assert.equal(telemetry.lastArea, 'T5');
  assert.match(telemetry.lastSummary, /rename helpers/i);
  assert.equal(telemetry.successRate, 0.5);
});

run('parseAutopilotState extracts operator-facing sections', () => {
  const state = [
    '# Hypersonic Autopilot State',
    '',
    '## Current phase',
    'Phase 2 | Iteration loop',
    '',
    '## Next action',
    'Tighten telemetry parser against table-style logs.',
    '',
    '## Open blockers',
    '- none',
    '',
    '## Ranked next candidates',
    '1. Improve live stats - show keep/discard ratio - verify via unit tests',
    '2. Add JSON runtime telemetry - verify with CLI smoke checks',
  ].join('\n');

  const parsed = parseAutopilotState(state);

  assert.equal(parsed.currentPhase, 'Phase 2 | Iteration loop');
  assert.equal(parsed.nextAction, 'Tighten telemetry parser against table-style logs.');
  assert.deepEqual(parsed.openBlockers, []);
  assert.equal(parsed.rankedCandidates.length, 2);
});

run('readAutopilotTelemetry joins log telemetry with state metadata', () => {
  const root = mkdtempSync(join(tmpdir(), 'hypersonic-'));

  try {
    mkdirSync(join(root, '.hypersonic'), { recursive: true });
    writeFileSync(
      join(root, AUTOPILOT_LOG_FILE),
      ['06:00:00 ✅ T1: Fix failing auth test 1234abc', '06:30:00 ❌ T4: speculative refactor discarded'].join('\n'),
    );
    writeFileSync(
      join(root, AUTOPILOT_STATE_FILE),
      [
        '## Current phase',
        'Phase 1 | Task 4 of 9',
        '',
        '## Next action',
        'Finish the pagination contract tests.',
      ].join('\n'),
    );

    const telemetry = readAutopilotTelemetry(root, { now: new Date('2026-04-09T08:00:00-04:00') });

    assert.equal(telemetry.iterations, 2);
    assert.equal(telemetry.commits, 1);
    assert.equal(telemetry.lastCommit, '1234abc');
    assert.equal(telemetry.state.currentPhase, 'Phase 1 | Task 4 of 9');
    assert.equal(telemetry.state.nextAction, 'Finish the pagination contract tests.');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

run('readAutopilotTelemetry is safe when autopilot files are missing', () => {
  const root = mkdtempSync(join(tmpdir(), 'hypersonic-empty-'));
  try {
    const telemetry = readAutopilotTelemetry(root, { now: new Date('2026-04-09T10:00:00Z') });
    assert.equal(telemetry.iterations, 0);
    assert.equal(telemetry.kept, 0);
    assert.equal(telemetry.discarded, 0);
    assert.equal(telemetry.commits, 0);
    assert.equal(telemetry.successRate, null);
    assert.equal(telemetry.events.length, 0);
    assert.equal(telemetry.state.currentPhase, '');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n`);
    throw error;
  }
}
