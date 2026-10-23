/**
 * @hots/import-kit — applyTemplate: workbook rows + template JSON → validated records
 * Head: src/index.js
 * Design: 3.Knowledge/domains/shared-platform/12_import_engine.md §3–5
 *
 * Input file: { name, sheets: { [sheetName]: any[][] } }   (rows as arrays; parser-agnostic)
 * Sheet modes:
 *   rows     header row + "columns" mapping, one record per data row
 *   unpivot  wide grid (e.g. weeks as columns) → one record per (row × value column)
 * Output record: { sheet, source_row (1-based), source_col (letters|null), data, status, messages, raw }
 *   status: valid | warning | blocked     (blocked = never publish)
 */
import { colLetters, colRange, resolveColumn } from '../core/columns.js';
import { applyTransforms } from '../core/transforms.js';
import { findHeaderRow } from '../core/header.js';
import { applyRules, evaluateCondition } from '../core/rules.js';

/** "2026" → 2026 for carried / sheet-name values so rules can compare numbers. */
const numeric = (v) => (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v);

const isBlankRow = (row) => !row || row.every((v) => v === null || v === undefined || String(v).trim() === '');

/** Maps one field spec { from, transform, default } against a sheet row. */
function readField(spec, row, headerRow, extraTransforms) {
  const s = typeof spec === 'string' ? { from: spec } : spec;
  if ('value' in s) return s.value;
  const idx = resolveColumn(s.from, headerRow);
  if (idx < 0) throw new Error(`Column "${s.from}" not found in header`);
  const raw = row[idx];
  const v = applyTransforms(raw, s.transform || [], extraTransforms);
  return v === null || v === undefined || v === '' ? (s.default ?? v) : v;
}

/** Decides which columns are value columns in unpivot mode. */
function valueColumns(unpivot, keyRow) {
  if (unpivot.value_columns) return colRange(unpivot.value_columns);
  const w = unpivot.value_columns_where || {};
  const cols = [];
  keyRow.forEach((cell, i) => {
    const n = typeof cell === 'number' ? cell : Number(String(cell ?? '').trim());
    if (w.int_between && Number.isInteger(n) && n >= w.int_between[0] && n <= w.int_between[1]) cols.push(i);
    if (w.in && w.in.includes(String(cell ?? '').trim())) cols.push(i);
  });
  return cols;
}

function lookupValue(lookups, spec, data) {
  const table = lookups?.[spec.map];
  const key = data[spec.from];
  if (key === null || key === undefined || key === '') return undefined;
  if (table instanceof Map) return table.get(String(key).trim().toUpperCase());
  if (table && typeof table === 'object') return table[String(key).trim().toUpperCase()];
  return undefined;
}

function finalize(record, template, context, lookups) {
  const messages = [];
  let blocked = false;

  // Lookups (alias resolution)
  for (const [field, spec] of Object.entries(template.lookups || {})) {
    const hit = lookupValue(lookups, spec, record.data);
    if (hit !== undefined) {
      record.data[field] = hit;
    } else {
      record.data[field] = null;
      const action = spec.on_missing || 'warning:UNMAPPED';
      if (action === 'block') {
        blocked = true;
        messages.push(`${field}: no ${spec.map} for "${record.data[spec.from]}"`);
      } else {
        messages.push(`${action.replace(/^warning:/, '')}: ${field} for "${record.data[spec.from]}"`);
      }
    }
  }

  // Required fields
  for (const f of template.required || []) {
    const v = record.data[f];
    if (v === null || v === undefined || v === '') {
      blocked = true;
      messages.push(`REQUIRED: ${f}`);
    }
  }

  // Rules
  const r = applyRules(template.rules || [], record.data, context);
  record.data = r.data;
  messages.push(...r.warnings);
  if (r.errors.length) {
    blocked = true;
    messages.push(...r.errors);
  }
  record.messages = messages;
  record.status = blocked ? 'blocked' : messages.length ? 'warning' : 'valid';
  return r.skip ? null : record;
}

/**
 * Block labels carried down to following rows (stacked sections in one sheet).
 * spec: { field, column, row_when?: { column, op, value }, match?: regex (group 1 if present),
 *         when?: { op, value } on the label cell, skip_row?: bool }
 * Returns true when the current row is a pure label row that must be skipped.
 */
function applyCarry(carrySpecs, row, state, transforms) {
  let skip = false;
  for (const spec of carrySpecs || []) {
    const cell = row[resolveColumn(spec.column)];
    const text = applyTransforms(cell, ['trim'], transforms);
    if (text === null || text === undefined || text === '') continue;
    if (spec.row_when && !evaluateCondition({ field: 'v', op: spec.row_when.op, value: spec.row_when.value }, { v: row[resolveColumn(spec.row_when.column)] })) continue;
    if (spec.when && !evaluateCondition({ field: 'v', op: spec.when.op, value: spec.when.value }, { v: text })) continue;
    let value = text;
    if (spec.match) {
      const m = String(text).match(new RegExp(spec.match));
      if (!m) continue;
      value = m[1] ?? m[0];
    }
    state[spec.field] = numeric(value);
    if (spec.skip_row) skip = true;
  }
  return skip;
}

/** constants_from_sheet_name: { year: "(\\d{4})" } → { year: "2026" } */
function sheetNameConstants(spec, sheetName) {
  const out = {};
  for (const [field, pattern] of Object.entries(spec.constants_from_sheet_name || {})) {
    const m = sheetName.match(new RegExp(pattern));
    if (m) out[field] = numeric(m[1] ?? m[0]);
  }
  return out;
}

/**
 * constants_from_cells: { report_date: { cell: "B1", transform: ["excel_date"] } }
 *   optional "sheet": read the cell from another sheet of the same file (e.g. stock point chosen once on INFO).
 * Letters/row are positions in the parsed rows array (same convention as column letters elsewhere).
 */
function cellConstants(spec, rows, transforms, file) {
  const out = {};
  for (const [field, c] of Object.entries(spec.constants_from_cells || {})) {
    const m = String(c.cell || '').toUpperCase().match(/^([A-Z]{1,3})(\d+)$/);
    if (!m) throw new Error(`constants_from_cells.${field}: bad cell "${c.cell}"`);
    const src = c.sheet ? file?.sheets?.[c.sheet] : rows;
    if (c.sheet && !src) throw new Error(`constants_from_cells.${field}: sheet "${c.sheet}" not found`);
    const v = applyTransforms(src[Number(m[2]) - 1]?.[resolveColumn('col:' + m[1])], c.transform || [], transforms);
    if (v !== null && v !== undefined && v !== '') out[field] = numeric(v);
  }
  return out;
}

/** constants may reference the run context: { "year": "$reportYear" } */
function resolveConstants(constants, context) {
  return Object.fromEntries(Object.entries(constants || {}).map(([k, v]) => [k, typeof v === 'string' && v.startsWith('$') ? context[v.slice(1)] : v]));
}

function processSheet(sheetName, rows, sheetSpec, template, ctx) {
  const { context, lookups, transforms, sheetErrors } = ctx;
  const out = [];
  const { index: headerIdx, row: headerRow } = findHeaderRow(rows, sheetSpec.header || {});
  const carried = {};
  const constants = { ...resolveConstants(sheetSpec.constants, context), ...sheetNameConstants(sheetSpec, sheetName), ...cellConstants(sheetSpec, rows, transforms, ctx.file) };
  const start = headerIdx + 1 + (sheetSpec.skip_after_header || 0);

  // Records of the current block wait here until the block closes (carry_reset_when) or the sheet ends,
  // so labels that appear on later rows of a block (e.g. port / year under the buyer name) can be
  // back-filled onto the block's first rows when `carry_backfill` is true.
  let pending = [];
  const flush = () => {
    for (const rec of pending) {
      if (sheetSpec.carry_backfill) for (const [k, v] of Object.entries(carried)) if (rec.data[k] === null || rec.data[k] === undefined) rec.data[k] = v;
      for (const [k, v] of Object.entries(constants)) if (rec.data[k] === null || rec.data[k] === undefined) rec.data[k] = v;
      const done = finalize(rec, template, context, lookups);
      if (done) out.push(done);
    }
    pending = [];
  };
  const emit = (rec) => pending.push(rec);
  const afterRow = (data) => {
    if (sheetSpec.carry_reset_when && evaluateCondition(sheetSpec.carry_reset_when, data, context)) {
      flush();
      for (const k of Object.keys(carried)) delete carried[k];
    }
  };

  if (sheetSpec.mode === 'unpivot') {
    const u = sheetSpec.unpivot;
    const keyRowIdx = u.key_row ? u.key_row - 1 : headerIdx;
    const keyRow = rows[keyRowIdx] || [];
    const cols = valueColumns(u, keyRow);
    if (!cols.length) sheetErrors.push(`${sheetName}: no value columns found for unpivot`);
    for (let r = start; r < rows.length; r += 1) {
      const row = rows[r];
      if (isBlankRow(row)) continue;
      if (applyCarry(sheetSpec.carry, row, carried, transforms)) continue;
      let ids;
      try {
        ids = Object.fromEntries(Object.entries(u.id_columns).map(([f, spec]) => [f, readField(spec, row, headerRow, transforms)]));
      } catch (e) {
        sheetErrors.push(`${sheetName}: ${e.message}`);
        flush();
        return out;
      }
      ids = { ...carried, ...ids };
      if (sheetSpec.skip_when && evaluateCondition(sheetSpec.skip_when, ids, context)) {
        afterRow(ids);
        continue;
      }
      for (const c of cols) {
        const key = applyTransforms(keyRow[c], u.key_transform || ['int'], transforms);
        const value = applyTransforms(row[c], u.value_transform || ['number'], transforms);
        if ((value === null || value === undefined) && !u.keep_empty) continue;
        const data = { ...ids, [u.key_field]: key, [u.value_field]: value };
        emit({ sheet: sheetName, source_row: r + 1, source_col: colLetters(c), data, raw: { key: keyRow[c], value: row[c] } });
      }
      afterRow(ids);
    }
    flush();
    return out;
  }

  // rows mode
  for (let r = start; r < rows.length; r += 1) {
    const row = rows[r];
    if (isBlankRow(row)) continue;
    if (applyCarry(sheetSpec.carry, row, carried, transforms)) continue;
    let data;
    try {
      data = { ...carried, ...Object.fromEntries(Object.entries(sheetSpec.columns || template.columns || {}).map(([f, spec]) => [f, readField(spec, row, headerRow, transforms)])) };
    } catch (e) {
      sheetErrors.push(`${sheetName}: ${e.message}`);
      flush();
      return out;
    }
    if (sheetSpec.skip_when && evaluateCondition(sheetSpec.skip_when, data, context)) {
      afterRow(data);
      continue;
    }
    const raw = Object.fromEntries(headerRow.map((h, i) => [h ?? colLetters(i), row[i] ?? null]).filter(([h]) => h !== null && h !== ''));
    emit({ sheet: sheetName, source_row: r + 1, source_col: null, data, raw });
    afterRow(data);
  }
  flush();
  return out;
}

/**
 * @param file      { name, sheets: { name: rows[][] } }
 * @param template  validated template JSON
 * @param options   { context: { cutoffWeek, … }, lookups: { product: Map|object }, transforms: { custom } }
 * @returns { template_code, target, records, stats: { total, valid, warning, blocked, bySheet }, errors }
 */
export function applyTemplate(file, template, options = {}) {
  const ctx = { file, context: options.context || {}, lookups: options.lookups || {}, transforms: options.transforms || {}, sheetErrors: [] };
  const records = [];
  for (const spec of template.sheets) {
    const names = Object.keys(file.sheets).filter((n) => (spec.match_regex ? new RegExp(spec.match_regex, 'i').test(n) : n === spec.match));
    if (!names.length) {
      if (!spec.optional) ctx.sheetErrors.push(`Sheet "${spec.match || spec.match_regex}" not found`);
      continue;
    }
    for (const name of names) {
      try {
        records.push(...processSheet(name, file.sheets[name], spec, template, ctx));
      } catch (e) {
        ctx.sheetErrors.push(`${name}: ${e.message}`);
      }
    }
  }
  const stats = { total: records.length, valid: 0, warning: 0, blocked: 0, bySheet: {} };
  for (const r of records) {
    stats[r.status] += 1;
    stats.bySheet[r.sheet] = (stats.bySheet[r.sheet] || 0) + 1;
  }
  return { template_code: template.template_code, target: template.target, records, stats, errors: ctx.sheetErrors };
}
