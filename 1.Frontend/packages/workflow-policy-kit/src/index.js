/** @purpose Public entry of @hots/workflow-policy-kit: approval timeout policy validation/resolution/time math (generated from the backend helper) plus UI-facing option lists and a plain-language description. */
export * from './approvalTimeoutPolicy.generated.js';
import { MODES } from './approvalTimeoutPolicy.generated.js';

/** Options for a mode selector. `adminOnly` modes must be hidden or disabled for non-admin editors (the API also enforces it). */
export const MODE_OPTIONS = Object.freeze([
  { value: 'wait', label: 'Wait indefinitely', adminOnly: false },
  { value: 'warn', label: 'Send reminder emails', adminOnly: false },
  { value: 'auto_reject', label: 'Auto-reject after time limit', adminOnly: true }
]);

export const WEEKDAY_OPTIONS = Object.freeze([
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' }, { value: 0, label: 'Sun' }
]);

/** Starting points for an editor; none of them is applied unless an admin saves it. */
export const POLICY_PRESETS = Object.freeze({
  wait: { mode: 'wait' },
  reminder_daily: { mode: 'warn', after_hours: 24, repeat_hours: 24, max_warnings: 3 },
  working_hours: { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5], timezone: 'Asia/Jakarta' }
});

const clean = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

/** One-sentence summary of an effective policy (for lists, tooltips, the diagnosis page). */
export function describePolicy(policy) {
  const p = policy || {};
  if (!MODES.includes(p.mode) || p.mode === 'wait') return 'Waits for the approver with no time limit.';
  if (!(p.after_hours > 0)) return 'Enter the time limit in hours to activate this policy.';
  const unit = p.working_hours ? 'working hour(s)' : 'hour(s)';
  const holiday = p.exclude_holidays ? ', public holidays not counted' : '';
  if (p.mode === 'warn') {
    const repeat = p.repeat_hours ? ` and every ${clean(p.repeat_hours)} ${unit} after` : '';
    const max = p.max_warnings ? ` (up to ${p.max_warnings} reminders)` : '';
    const who = p.notify === 'leaders' ? 'the step leader (PIC) only' : 'everyone in the step (naming the PIC)';
    return `Emails ${who} after ${clean(p.after_hours)} ${unit}${repeat}${max}${holiday}. The ticket is never changed.`;
  }
  return `Rejects the ticket automatically after ${clean(p.after_hours)} ${unit} without action${holiday}.`;
}
