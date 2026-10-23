/** @purpose Controlled React form for one approval timeout policy (service level or step level); builds only plain objects accepted by validatePolicy, no API calls. */
import React from 'react';
import {
  MODE_OPTIONS, WEEKDAY_OPTIONS, POLICY_PRESETS, describePolicy, validatePolicy
} from '../index.js';

export type TimeoutPolicy = {
  mode?: 'wait' | 'warn' | 'auto_reject';
  after_hours?: number;
  repeat_hours?: number;
  max_warnings?: number;
  notify?: 'leaders' | 'all';
  exclude_holidays?: boolean;
  working_hours?: { start: string; end: string; days: number[]; timezone?: string } | null;
};

export interface TimeoutPolicyEditorProps {
  /** Current policy; undefined/null = nothing set at this level. */
  value: TimeoutPolicy | null | undefined;
  /** Receives the new policy, or undefined when the level is reset to "inherit / not set". */
  onChange: (next: TimeoutPolicy | undefined) => void;
  /** Step level: shows "inherit from service" instead of "not set". */
  level?: 'service' | 'step';
  /** Hide auto_reject unless the editor is an administrator. The API enforces this too. */
  allowAutoReject?: boolean;
  disabled?: boolean;
  className?: string;
}

const field = 'w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50';
const label = 'block text-xs font-medium text-slate-600 mb-1';

const num = (raw: string): number | undefined => {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** Plain controlled form (Tailwind classes only). Works for a whole service policy and for a single step override. */
export function TimeoutPolicyEditor({ value, onChange, level = 'service', allowAutoReject = true, disabled, className }: TimeoutPolicyEditorProps) {
  const policy: TimeoutPolicy = value || {};
  const mode = policy.mode || '';
  const isStep = level === 'step';
  const verdict = value ? validatePolicy(value, { partial: isStep, allowAutoReject }) : { ok: true, errors: [] as string[] };
  const set = (patch: Partial<TimeoutPolicy>) => onChange({ ...policy, ...patch });
  const clean = (patch: Partial<TimeoutPolicy>) => {
    const next: Record<string, unknown> = { ...policy, ...patch };
    Object.keys(next).forEach((k) => { if (next[k] === undefined) delete next[k]; });
    onChange(Object.keys(next).length ? (next as TimeoutPolicy) : undefined);
  };
  const working = policy.working_hours || null;
  const options = MODE_OPTIONS.filter((o) => allowAutoReject || !o.adminOnly || policy.mode === o.value);

  return (
    <div className={className}>
      <label className={label}>Time limit behaviour</label>
      <select
        className={field}
        disabled={disabled}
        value={mode}
        onChange={(e) => {
          const m = e.target.value as TimeoutPolicy['mode'] | '';
          if (!m) return onChange(undefined);
          if (m === 'wait') return onChange({ mode: 'wait' });
          const base = m === 'warn' ? POLICY_PRESETS.reminder_daily : { mode: m, after_hours: policy.after_hours ?? 72 };
          onChange({ ...policy, ...base, mode: m });
        }}
      >
        <option value="">{isStep ? 'Inherit from service' : 'Not set (wait indefinitely)'}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {(mode === 'warn' || mode === 'auto_reject') && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>{mode === 'warn' ? 'First reminder after (hours)' : 'Reject after (hours)'}</label>
              <input className={field} type="number" min={0.01} step="any" disabled={disabled} value={policy.after_hours ?? ''}
                onChange={(e) => clean({ after_hours: num(e.target.value) })} />
            </div>
            {mode === 'warn' && (
              <div>
                <label className={label}>Repeat every (hours)</label>
                <input className={field} type="number" min={0.01} step="any" disabled={disabled} value={policy.repeat_hours ?? ''}
                  onChange={(e) => clean({ repeat_hours: num(e.target.value) })} />
              </div>
            )}
          </div>
          {mode === 'warn' && (
            <div>
              <label className={label}>Send reminders to</label>
              <select className={field} disabled={disabled} value={policy.notify || 'all'}
                onChange={(e) => clean({ notify: e.target.value === 'leaders' ? 'leaders' : undefined })}>
                <option value="all">Everyone in the step (PIC named in the email)</option>
                <option value="leaders">Step leader (PIC) only</option>
              </select>
            </div>
          )}
          {mode === 'warn' && (
            <div>
              <label className={label}>Maximum reminders</label>
              <input className={field} type="number" min={1} max={20} step={1} disabled={disabled} value={policy.max_warnings ?? ''}
                onChange={(e) => clean({ max_warnings: num(e.target.value) })} />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" disabled={disabled} checked={!!working}
              onChange={(e) => clean({ working_hours: e.target.checked ? POLICY_PRESETS.working_hours : undefined })} />
            Count working hours only
          </label>
          {working && (
            <div className="rounded border border-slate-200 p-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>From</label>
                  <input className={field} type="time" disabled={disabled} value={working.start}
                    onChange={(e) => set({ working_hours: { ...working, start: e.target.value } })} />
                </div>
                <div>
                  <label className={label}>Until</label>
                  <input className={field} type="time" disabled={disabled} value={working.end === '24:00' ? '23:59' : working.end}
                    onChange={(e) => set({ working_hours: { ...working, end: e.target.value } })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((d) => (
                  <label key={d.value} className="flex items-center gap-1 text-xs text-slate-700">
                    <input type="checkbox" disabled={disabled} checked={working.days.includes(d.value)}
                      onChange={(e) => set({ working_hours: { ...working, days: e.target.checked ? [...working.days, d.value] : working.days.filter((x) => x !== d.value) } })} />
                    {d.label}
                  </label>
                ))}
              </div>
              <div>
                <label className={label}>Time zone</label>
                <input className={field} disabled={disabled} value={working.timezone || ''} placeholder="Asia/Jakarta"
                  onChange={(e) => set({ working_hours: { ...working, timezone: e.target.value || undefined } })} />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" disabled={disabled} checked={!!policy.exclude_holidays}
              onChange={(e) => clean({ exclude_holidays: e.target.checked ? true : undefined })} />
            Do not count public holidays
          </label>
        </div>
      )}

      {value && (
        <p className="mt-3 text-xs text-slate-500">{describePolicy({ ...POLICY_PRESETS.wait, ...value })}</p>
      )}
      {!verdict.ok && (
        <ul className="mt-2 text-xs text-red-600 list-disc pl-4">
          {verdict.errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

export default TimeoutPolicyEditor;
