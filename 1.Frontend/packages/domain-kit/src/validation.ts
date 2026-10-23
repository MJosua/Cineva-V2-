export interface Issue { code: string; path: string; message: string }
export interface Rule<T> { code: string; path?: string; message: string; check: (data: Readonly<T>) => boolean }
export interface RuleOptions<T> { clone?: (data: T) => T }
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
export function safePath(path: unknown): path is string {
  return typeof path === 'string' && path.length > 0 && path.split('.').every(part => /^[A-Za-z0-9_$-]+$/.test(part) && !forbidden.has(part));
}
/** Own properties only. No evaluation, accessors, inherited keys or prototype traversal. */
export function safeRead(data: unknown, path: string): { found: boolean; value?: unknown } {
  if (!safePath(path)) return { found: false };
  let value = data;
  try {
    for (const part of path.split('.')) {
      if (value === null || typeof value !== 'object') return { found: false };
      const descriptor = Object.getOwnPropertyDescriptor(value, part);
      if (!descriptor || !('value' in descriptor)) return { found: false };
      value = descriptor.value;
    }
  } catch { return { found: false }; }
  return { found: true, value };
}
export function createRules<T>(rules: readonly Rule<T>[], options: RuleOptions<T> = {}): (data: T) => Issue[] {
  const config = Array.isArray(rules) ? rules.map(rule => ({ ...rule })) : null;
  // Resolve at invocation so engines without structuredClone fail closed, never share input.
  const clone = options.clone ?? ((value: T): T => {
    const runtime = globalThis as typeof globalThis & { structuredClone?: (data: T) => T };
    if (typeof runtime.structuredClone !== 'function') throw new Error('A data clone is required.');
    return runtime.structuredClone(value);
  });
  return data => {
    if (!config) return [{ code: 'invalid_rules', path: '', message: 'Rules must be an array.' }];
    const issues: Issue[] = [];
    for (const rule of config) {
      if (!rule || typeof rule.code !== 'string' || !rule.code || typeof rule.message !== 'string' || typeof rule.check !== 'function' || (rule.path !== undefined && !safePath(rule.path))) {
        issues.push({ code: 'invalid_rule', path: '', message: 'Invalid validation rule configuration.' }); continue;
      }
      let valid = false;
      let isolated: T;
      try { isolated = clone(data); }
      catch {
        issues.push({ code: 'rule_clone_failed', path: rule.path ?? '', message: 'Validation input could not be isolated.' }); continue;
      }
      try { valid = rule.check(isolated) === true; } catch { valid = false; }
      if (!valid) issues.push({ code: rule.code, path: rule.path ?? '', message: rule.message });
    }
    return issues;
  };
}
export class RuleValidationError extends Error {
  readonly issues: readonly Issue[];
  constructor(issues: readonly Issue[]) {
    super(issues.map(issue => `${issue.path ? issue.path + ': ' : ''}${issue.message}`).join('\n'));
    this.name = 'RuleValidationError'; this.issues = issues.map(issue => ({ ...issue }));
  }
}
export function assertRules(issues: readonly Issue[]): void {
  if (!Array.isArray(issues) || issues.some(issue => !issue || typeof issue.code !== 'string' || typeof issue.path !== 'string' || typeof issue.message !== 'string'))
    throw new RuleValidationError([{ code: 'invalid_issues', path: '', message: 'Issues must be an array of structured validation issues.' }]);
  if (issues.length) throw new RuleValidationError(issues);
}
