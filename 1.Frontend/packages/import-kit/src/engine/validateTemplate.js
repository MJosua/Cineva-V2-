/**
 * @hots/import-kit — template validation (run before saving / activating a template)
 * Head: src/index.js
 * Returns a list of human-readable problems; empty list = valid.
 */
import { TRANSFORM_NAMES } from '../core/transforms.js';
import { RULE_OPERATORS } from '../core/rules.js';
import { colRange } from '../core/columns.js';

const MODES = ['rows', 'unpivot'];

function checkTransforms(list, where, problems, extra = []) {
  for (const step of list || []) {
    const name = String(step).split(':')[0];
    if (!TRANSFORM_NAMES.includes(name) && !extra.includes(name)) problems.push(`${where}: unknown transform "${name}"`);
  }
}

function checkFieldSpecs(specs, where, problems, extra) {
  for (const [field, spec] of Object.entries(specs || {})) {
    const s = typeof spec === 'string' ? { from: spec } : spec;
    if (!('from' in s) && !('value' in s)) problems.push(`${where}.${field}: needs "from" or "value"`);
    checkTransforms(s.transform, `${where}.${field}`, problems, extra);
  }
}

function checkCondition(cond, where, problems) {
  if (!cond) return;
  if (cond.all || cond.any) return (cond.all || cond.any).forEach((c, i) => checkCondition(c, `${where}[${i}]`, problems));
  if (!RULE_OPERATORS.includes(cond.op)) problems.push(`${where}: unknown operator "${cond.op}"`);
  if (!cond.field) problems.push(`${where}: missing field`);
}

/** @param extraTransforms names of custom transforms the caller will supply */
export function validateTemplate(t, { extraTransforms = [] } = {}) {
  const problems = [];
  if (!t || typeof t !== 'object') return ['template must be an object'];
  if (!t.template_code || !/^[A-Z0-9_]+$/.test(t.template_code)) problems.push('template_code must be UPPER_SNAKE');
  if (!t.target || !/^[a-z0-9_.]+$/.test(t.target)) problems.push('target must look like "wh.stt_out"');
  if (!Array.isArray(t.sheets) || !t.sheets.length) problems.push('sheets must be a non-empty array');

  (t.sheets || []).forEach((s, i) => {
    const w = `sheets[${i}]`;
    if (!s.match && !s.match_regex) problems.push(`${w}: needs "match" or "match_regex"`);
    if (s.mode && !MODES.includes(s.mode)) problems.push(`${w}: mode must be rows|unpivot`);
    if (s.header && !Number.isInteger(s.header.row) && !s.header.detect) problems.push(`${w}.header: needs "row" or "detect"`);
    if (s.mode === 'unpivot') {
      const u = s.unpivot || {};
      if (!u.id_columns) problems.push(`${w}.unpivot: id_columns required`);
      if (!u.key_field || !u.value_field) problems.push(`${w}.unpivot: key_field and value_field required`);
      if (!u.value_columns && !u.value_columns_where) problems.push(`${w}.unpivot: value_columns or value_columns_where required`);
      if (u.value_columns) {
        try {
          colRange(u.value_columns);
        } catch (e) {
          problems.push(`${w}.unpivot: ${e.message}`);
        }
      }
      checkFieldSpecs(u.id_columns, `${w}.unpivot.id_columns`, problems, extraTransforms);
      checkTransforms(u.key_transform, `${w}.unpivot.key_transform`, problems, extraTransforms);
      checkTransforms(u.value_transform, `${w}.unpivot.value_transform`, problems, extraTransforms);
    } else {
      checkFieldSpecs(s.columns || t.columns, `${w}.columns`, problems, extraTransforms);
      if (!s.columns && !t.columns) problems.push(`${w}: rows mode needs "columns"`);
    }
    checkCondition(s.skip_when, `${w}.skip_when`, problems);
    checkCondition(s.carry_reset_when, `${w}.carry_reset_when`, problems);
    (s.carry || []).forEach((c, j) => {
      if (!c.field || !c.column) problems.push(`${w}.carry[${j}]: needs field and column`);
      if (c.match) {
        try {
          new RegExp(c.match);
        } catch (e) {
          problems.push(`${w}.carry[${j}].match: ${e.message}`);
        }
      }
    });
  });

  (t.rules || []).forEach((r, i) => {
    checkCondition(r.when, `rules[${i}].when`, problems);
    if (!r.then || !Object.keys(r.then).length) problems.push(`rules[${i}]: "then" is empty`);
  });
  for (const [f, l] of Object.entries(t.lookups || {})) {
    if (!l.from || !l.map) problems.push(`lookups.${f}: needs "from" and "map"`);
    if (l.on_missing && !/^(block|warning:[A-Z_]+)$/.test(l.on_missing)) problems.push(`lookups.${f}: on_missing must be "block" or "warning:CODE"`);
  }
  return problems;
}
