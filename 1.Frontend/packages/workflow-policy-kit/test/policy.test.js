/** @purpose Smoke tests for @hots/workflow-policy-kit: generated helper behaves like the backend, plus describePolicy and option lists. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  validatePolicy, resolvePolicy, evaluateTimeout, addWorkingHours, describePolicy, MODE_OPTIONS, POLICY_PRESETS
} from '../src/index.js';

const require = createRequire(import.meta.url);
const backend = require('../../../../2.Backend/Integrated-API/programs/hots/core/workflowTimeout/approvalTimeoutPolicy.js');

test('generated kit and backend helper agree on shared fixtures', () => {
  const cases = [
    { mode: 'warn', after_hours: 24 },
    { mode: 'auto_reject', after_hours: 8 },
    { mode: 'warn' },
    { mode: 'warn', after_hours: 5, working_hours: { start: '17:00', end: '08:00', days: [1] } },
    { mode: 'nope' }
  ];
  for (const c of cases) {
    assert.deepEqual(validatePolicy(c), backend.validatePolicy(c));
    assert.deepEqual(validatePolicy(c, { allowAutoReject: true }), backend.validatePolicy(c, { allowAutoReject: true }));
  }
  const wh = { mode: 'warn', after_hours: 4, working_hours: POLICY_PRESETS.working_hours };
  const start = new Date('2026-10-16T08:00:00Z'); // Fri 15:00 Jakarta
  assert.equal(addWorkingHours(start, 4, wh).toISOString(), backend.addWorkingHours(start, 4, wh).toISOString());
  const def = { timeout_policy: { mode: 'warn', after_hours: 24 }, steps: [{ level: 1, timeout_policy: { after_hours: 48 } }] };
  assert.deepEqual(resolvePolicy(def, def.steps[0]), backend.resolvePolicy(def, def.steps[0]));
  const ev = { policy: { mode: 'auto_reject', after_hours: 2 }, startedAt: new Date(0), now: new Date(3 * 3600000) };
  assert.equal(evaluateTimeout(ev).action, backend.evaluateTimeout(ev).action);
});

test('describePolicy gives a plain sentence per mode', () => {
  assert.match(describePolicy(undefined), /no time limit/);
  assert.match(describePolicy({ mode: 'warn', after_hours: 24, repeat_hours: 12, max_warnings: 3, exclude_holidays: true }), /after 24 hour\(s\) and every 12 hour\(s\) after \(up to 3 reminders\), public holidays not counted/);
  assert.match(describePolicy({ mode: 'auto_reject', after_hours: 8, working_hours: POLICY_PRESETS.working_hours }), /Rejects the ticket automatically after 8 working hour\(s\)/);
});

test('describePolicy never prints NaN when the time limit is still empty', () => {
  assert.match(describePolicy({ mode: 'warn' }), /Enter the time limit/);
  assert.doesNotMatch(describePolicy({ mode: 'auto_reject', after_hours: undefined }), /NaN/);
});

test('only auto_reject is flagged admin-only', () => {
  assert.deepEqual(MODE_OPTIONS.filter((o) => o.adminOnly).map((o) => o.value), ['auto_reject']);
});
