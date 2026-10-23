// Real-file test: IndoVietnam workbooks (4.refrence/IndoVietnam) → templates → reconciliation with Excel's own totals.
// run: npm run test:real   (needs xlsx, taken from HOTS node_modules; skipped when files or xlsx are missing)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { applyTemplate, validateTemplate, recognize, colIndex } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const refDir = path.join(root, '4.refrence', 'IndoVietnam');
const NEW_FORMAT = path.join(refDir, 'New Format 2026 Q3 20260930 By WH.xlsx');
const MASTER = path.join(refDir, '2025_-_2018_-_Master_Data_-_Order_Realization_Monitoring_20261006.xlsx');
const tpl = (name) => JSON.parse(fs.readFileSync(path.join(here, '..', 'templates', 'indovietnam', `${name}.json`), 'utf8'));

let XLSX = null;
try {
  XLSX = createRequire(path.join(root, '1.Frontend', 'HOTS', 'package.json'))('xlsx');
} catch {
  /* skip */
}
const ready = XLSX && fs.existsSync(NEW_FORMAT) && fs.existsSync(MASTER);
const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const wb = XLSX.readFile(file, { cellDates: true, dense: true });
  const sheets = Object.fromEntries(wb.SheetNames.map((n) => [n, XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: null, raw: true, blankrows: true })]));
  return (cache[file] = { name: path.basename(file), sheets });
}
const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
const CONTEXT = { currentYear: 2026, cutoffWeek: 38, reportYear: 2026 };

test('all IndoVietnam templates are valid', { skip: !ready }, () => {
  for (const n of ['IV_STT_WEEKLY', 'IV_OPENING_STOCK_WEEKLY', 'IV_RECEIPT_WEEKLY', 'IV_ORDER_REALIZATION']) assert.deepEqual(validateTemplate(tpl(n)), [], n);
});

test('recognition picks the right template per file', { skip: !ready }, () => {
  const templates = ['IV_STT_WEEKLY', 'IV_RECEIPT_WEEKLY'].map(tpl);
  assert.equal(recognize(load(NEW_FORMAT), templates).best, 'IV_STT_WEEKLY');
  assert.equal(recognize(load(MASTER), templates).best, 'IV_RECEIPT_WEEKLY');
});

function reconcileRowTotals(out, file, totalCol) {
  const totalColOf = (sheet) => (totalCol ? colIndex(totalCol) : file.sheets[sheet][2].findIndex((v) => typeof v === 'string' && v.trim() === 'Total'));
  const bySheetRow = new Map();
  for (const r of out.records) {
    const k = `${r.sheet}#${r.source_row}`;
    bySheetRow.set(k, (bySheetRow.get(k) || 0) + (r.data.qty_pcs || 0));
  }
  let checked = 0;
  const mismatches = [];
  for (const [k, sum] of bySheetRow) {
    const [sheet, row] = k.split('#');
    const tc = totalColOf(sheet);
    if (tc < 0) continue;
    const total = file.sheets[sheet][Number(row) - 1][tc];
    if (typeof total !== 'number') continue;
    checked += 1;
    if (!close(sum, total)) mismatches.push({ k, sum, total });
  }
  return { checked, mismatches };
}

test('STT weekly: every imported row sums to Excel "Total" (col BC)', { skip: !ready }, (t) => {
  const file = load(NEW_FORMAT);
  const out = applyTemplate(file, tpl('IV_STT_WEEKLY'), { context: CONTEXT });
  assert.deepEqual(out.errors, []);
  assert.equal(out.stats.blocked, 0);
  const sttSheets = Object.keys(out.stats.bySheet);
  const rec = reconcileRowTotals(out, file, null);
  t.diagnostic(`STT: ${out.stats.total} records ${JSON.stringify(out.stats)} sheets ${sttSheets.join(',')}; rows reconciled (all years with a Total column) ${rec.checked}, mismatches ${rec.mismatches.length}`);
  t.diagnostic(`segments: ${[...new Set(out.records.filter((r) => r.sheet === 'STT 2026').map((r) => r.data.segment_label))].join(' | ')}`);
  t.diagnostic(`forecast records (2026, week > 38): ${out.records.filter((r) => r.data.is_forecast).length}`);
  assert.ok(rec.checked > 0);
  assert.deepEqual(rec.mismatches.slice(0, 5), []);
});

test('Opening stock weekly: every imported row sums to Excel "Total" (col BB)', { skip: !ready }, (t) => {
  const file = load(NEW_FORMAT);
  const out = applyTemplate(file, tpl('IV_OPENING_STOCK_WEEKLY'), { context: CONTEXT });
  assert.deepEqual(out.errors, []);
  const rec = reconcileRowTotals({ records: out.records.filter((r) => r.sheet === 'OS 2026') }, file, 'BB');
  t.diagnostic(`OS: ${out.stats.total} records ${JSON.stringify(out.stats)}; 2026 rows reconciled ${rec.checked}, mismatches ${rec.mismatches.length}`);
  t.diagnostic(`segments: ${[...new Set(out.records.filter((r) => r.sheet === 'OS 2026').map((r) => r.data.segment_label))].join(' | ')}`);
  assert.ok(rec.checked > 0);
  assert.deepEqual(rec.mismatches.slice(0, 5), []);
});

test('Received containers: per block × week the imported SKUs equal the block "Total" row', { skip: !ready }, (t) => {
  const file = load(MASTER);
  const out = applyTemplate(file, tpl('IV_RECEIPT_WEEKLY'), { context: CONTEXT });
  assert.deepEqual(out.errors, []);
  const rows = file.sheets['Received Container'];
  // Block totals from the sheet: each "Total" row in column A closes the block above it.
  const sums = new Map();
  for (const r of out.records) {
    const k = `${r.data.block_label}@${r.data.port || ''}#${r.data.week}`;
    sums.set(k, (sums.get(k) || 0) + (r.data.qty_ctn || 0));
  }
  let block = null;
  let port = '';
  let checked = 0;
  const mismatches = [];
  for (let i = 0; i < rows.length; i += 1) {
    const a = rows[i]?.[0];
    if (typeof a === 'string' && ['CAT LAI', 'HAI PHONG'].includes(a.trim())) port = a.trim();
    if (typeof a === 'string' && !['CAT LAI', 'HAI PHONG', 'Total', 'Container', 'Description'].includes(a.trim()) && rows[i]?.[1]) {
      block = a.trim();
      port = '';
    }
    if (a === 'Total' && block) {
      for (let w = 1; w <= 52; w += 1) {
        const total = rows[i][colIndex('C') + w - 1];
        if (typeof total !== 'number') continue;
        checked += 1;
        const sum = sums.get(`${block}@${port}#${w}`) || 0;
        if (!close(sum, total)) mismatches.push({ block, w, sum, total });
      }
    }
  }
  t.diagnostic(`Receipt: ${out.stats.total} records ${JSON.stringify(out.stats)}; block-week totals reconciled ${checked}, mismatches ${mismatches.length}`);
  t.diagnostic(`blocks: ${[...new Set(out.records.map((r) => `${r.data.block_label}${r.data.port ? '@' + r.data.port : ''}${r.data.year ? '/' + r.data.year : ''}`))].join(' | ')}`);
  if (mismatches.length) t.diagnostic(`first mismatches: ${JSON.stringify(mismatches.slice(0, 5))}`);
  assert.ok(checked > 0);
  assert.deepEqual(mismatches.slice(0, 5), []);
});

test('Order realization (DB + Master Data): rows, blank dates, forecast flags, port → warehouse', { skip: !ready }, (t) => {
  const lookups = { port_to_warehouse: { 'CAT LAI': 'WH-HCM', 'HAI PHONG': 'WH-HN' } };
  for (const f of [NEW_FORMAT, MASTER]) {
    const file = load(f);
    const out = applyTemplate(file, tpl('IV_ORDER_REALIZATION'), { context: CONTEXT, lookups });
    assert.deepEqual(out.errors, []);
    const recs = out.records;
    const sheet = Object.keys(out.stats.bySheet)[0];
    const rawRows = file.sheets[sheet];
    const pack = recs.reduce((s, r) => s + (r.data.stuffing_qty_pack || 0), 0);
    const dates1899 = recs.filter((r) => ['act_etd', 'act_eta', 'ata', 'stuffing_date'].some((k) => String(r.data[k] || '') < '1901' && r.data[k])).length;
    t.diagnostic(`${path.basename(f)} [${sheet}]: ${recs.length} records ${JSON.stringify(out.stats)}; forecast ${recs.filter((r) => r.data.is_forecast).length}; stuffing packs ${pack}; dates<1901 left ${dates1899}; warehouses ${JSON.stringify(Object.fromEntries([...new Set(recs.map((r) => r.data.warehouse_code))].map((w) => [w, recs.filter((r) => r.data.warehouse_code === w).length])))}; sheet rows ${rawRows.length}`);
    const warnings = {};
    for (const r of recs) for (const m of r.messages) warnings[m.split(':')[0]] = (warnings[m.split(':')[0]] || 0) + 1;
    t.diagnostic(`messages: ${JSON.stringify(warnings)}`);
    assert.equal(dates1899, 0);
    assert.ok(recs.length > 1000);
  }
});

const SP3_VEHICLE = path.join(refDir, 'Trial Template Vehicle (SP3) 20250820.xlsx');
test('SP3 delivery lines (smallest unit): every row sums to Excel "Total Ctn", nothing blocked', { skip: !(XLSX && fs.existsSync(SP3_VEHICLE)) }, (t) => {
  const file = load(SP3_VEHICLE);
  const template = tpl('IV_SP3_DELIVERY_LINE');
  assert.deepEqual(validateTemplate(template), []);
  assert.equal(recognize(file, [template]).best, 'IV_SP3_DELIVERY_LINE');
  const out = applyTemplate(file, template, { context: CONTEXT });
  assert.deepEqual(out.errors, []);
  assert.equal(out.stats.blocked, 0);
  const rows = file.sheets.SP3;
  const totalCol = rows[2].findIndex((v) => typeof v === 'string' && v.trim() === 'Total Ctn');
  const byRow = new Map();
  for (const r of out.records) byRow.set(r.source_row, (byRow.get(r.source_row) || 0) + r.data.qty_ctn);
  const mismatches = [...byRow].filter(([row, sum]) => !close(sum, Number(rows[row - 1][totalCol]) || 0));
  const agents = new Set(out.records.map((r) => r.data.sales_agent_key).filter(Boolean));
  t.diagnostic(`SP3: ${out.stats.total} records ${JSON.stringify(out.stats)}; rows reconciled ${byRow.size}, mismatches ${mismatches.length}; distinct agent keys ${agents.size}`);
  assert.ok(byRow.size > 2500);
  assert.deepEqual(mismatches.slice(0, 5), []);
});

const SP3_DAILY = path.join(refDir, 'Daily Inventory-10_2026-SP3.xlsx');
test('SP3 daily stock per expiry batch: opening + in − out = closing; closing(d) = opening(d+1); OUT = delivery log', { skip: !(XLSX && fs.existsSync(SP3_DAILY) && fs.existsSync(SP3_VEHICLE)) }, (t) => {
  const template = tpl('IV_SP3_DAILY_STOCK_BATCH');
  assert.deepEqual(validateTemplate(template), []);
  const out = applyTemplate(load(SP3_DAILY), template, { context: CONTEXT });
  assert.deepEqual(out.errors, []);
  assert.equal(out.stats.blocked, 0);
  const bal = new Map();
  for (const { data: d } of out.records) {
    const k = `${d.report_date}|${d.product_group}|${d.expiry_date}`;
    const v = bal.get(k) || {};
    v[d.movement] = (v[d.movement] || 0) + d.qty_ctn;
    bal.set(k, v);
  }
  const identity = [...bal].filter(([, v]) => !close((v.OPENING || 0) + (v.IN || 0) - (v.OUT || 0), v.CLOSING || 0));
  const days = [...new Set(out.records.map((r) => r.data.report_date))].sort();
  const chain = [];
  for (let i = 0; i + 1 < days.length; i += 1) {
    const sum = (day, mv) => out.records.filter((r) => r.data.report_date === day && r.data.movement === mv).reduce((s, r) => s + r.data.qty_ctn, 0);
    if (!close(sum(days[i], 'CLOSING'), sum(days[i + 1], 'OPENING'))) chain.push(days[i]);
  }
  const delivery = applyTemplate(load(SP3_VEHICLE), tpl('IV_SP3_DELIVERY_LINE'), { context: CONTEXT }).records;
  const outVsLog = days.map((day) => ({
    day,
    out: out.records.filter((r) => r.data.report_date === day && r.data.movement === 'OUT').reduce((s, r) => s + r.data.qty_ctn, 0),
    log: delivery.filter((r) => r.data.delivery_date === day).reduce((s, r) => s + r.data.qty_ctn, 0),
  }));
  t.diagnostic(`daily stock: ${out.stats.total} records, ${bal.size} day×group×expiry keys, identity mismatches ${identity.length}, chain breaks ${chain.length}; OUT vs delivery log ${JSON.stringify(outVsLog)}`);
  assert.deepEqual(identity.slice(0, 5), []);
  assert.deepEqual(chain, []);
  assert.deepEqual(outVsLog.filter((x) => !close(x.out, x.log)), []);
});

test('Vehicle master: capacity × shift = daily capacity; SP3 "Cap Utl" = delivered ctn ÷ daily capacity', { skip: !(XLSX && fs.existsSync(SP3_VEHICLE)) }, (t) => {
  const file = load(SP3_VEHICLE);
  const template = tpl('IV_VEHICLE_MASTER');
  assert.deepEqual(validateTemplate(template), []);
  const out = applyTemplate(file, template, { context: CONTEXT });
  assert.deepEqual(out.errors, []);
  assert.equal(out.stats.blocked, 0);
  const cap = new Map(out.records.map((r) => [r.data.vehicle_code, r.data.daily_capacity_ctn]));
  for (const r of out.records) assert.ok(close(r.data.capacity_ctn * r.data.shift_count, r.data.daily_capacity_ctn), r.data.vehicle_code);
  const rows = file.sheets.SP3;
  const h = rows[2].map((v) => (typeof v === 'string' ? v.trim() : v));
  const [iV, iT, iU] = ['Vehicle', 'Total Ctn', 'Cap Utl'].map((n) => h.indexOf(n));
  let checked = 0;
  const bad = [];
  for (const row of rows.slice(3)) {
    const c = cap.get(row?.[iV]);
    if (!c || typeof row[iU] !== 'number') continue;
    checked += 1;
    if (!close(row[iT] / c, row[iU])) bad.push([row[iV], row[iT], row[iU]]);
  }
  const unknown = [...new Set(rows.slice(3).map((r) => r?.[iV]).filter((v) => v && !cap.has(v)))];
  t.diagnostic(`vehicles ${out.records.length}; Cap Utl rows checked ${checked}, mismatches ${bad.length}; vehicle codes in log but not in master: ${unknown.join(', ')}`);
  assert.ok(checked > 2000);
  assert.deepEqual(bad.slice(0, 5), []);
});

const SP3_INPUT_SAMPLE = path.join(refDir, 'template_baru', 'IV_SP3_Daily_Input_v1_SAMPLE.xlsx');
test('New SP3 daily input workbook v1: sample day imports; missing container / destination are blocked', { skip: !(XLSX && fs.existsSync(SP3_INPUT_SAMPLE)) }, (t) => {
  const file = load(SP3_INPUT_SAMPLE);
  const template = tpl('IV_SP3_DAILY_INPUT');
  assert.deepEqual(validateTemplate(template), []);
  assert.equal(recognize(file, [template, tpl('IV_SP3_DELIVERY_LINE'), tpl('IV_SP3_DAILY_STOCK_BATCH')]).best, 'IV_SP3_DAILY_INPUT');
  const out = applyTemplate(file, template, { context: CONTEXT });
  assert.deepEqual(out.errors, []);
  assert.equal(out.stats.blocked, 0);
  const by = (type) => out.records.filter((r) => r.data.record_type === type);
  const delivered = by('DELIVERY').reduce((s, r) => s + r.data.qty_ctn, 0);
  t.diagnostic(`input v1 sample: ${JSON.stringify(out.stats)}; delivery ctn ${delivered}; groups ${[...new Set(by('DELIVERY').map((r) => `${r.data.product_group}/${r.data.line_type}`))].join(',')}`);
  assert.equal(delivered, 200 + 950);
  assert.ok(by('DELIVERY').every((r) => r.data.product_group && r.data.line_type));
  assert.equal(by('TRANSFER_OUT')[0].data.to_stock_point, 'SP2');
  assert.equal(by('STOCK_IN')[0].data.container_no, 'TEST1234567');
  assert.equal(by('CLOSING')[0].data.product_group, 'IIP');

  // Same file with the container number and transfer destination removed → blocked, not silently accepted.
  const broken = { name: file.name, sheets: { ...file.sheets } };
  broken.sheets.STOCK_IN = file.sheets.STOCK_IN.map((row, i) => (i === 1 ? row.map((v, c) => (c === 2 ? null : v)) : row));
  broken.sheets.TRANSFER = file.sheets.TRANSFER.map((row, i) => (i === 1 ? row.map((v, c) => (c === 2 ? null : v)) : row));
  const bad = applyTemplate(broken, template, { context: CONTEXT });
  const msgs = bad.records.filter((r) => r.status === 'blocked').flatMap((r) => r.messages);
  assert.ok(msgs.includes('CONTAINER_NO_REQUIRED_FROM_PORT'));
  assert.ok(msgs.includes('TRANSFER_DESTINATION_REQUIRED'));
});

test('FEFO proposal = batches SP3 really picked (2026-10-03): opening = Daily Inventory 10-02 closing, out = delivery log', { skip: !(XLSX && fs.existsSync(SP3_DAILY) && fs.existsSync(SP3_VEHICLE)) }, async (t) => {
  const { enrichDailyInput } = await import('../src/index.js');
  const daily = applyTemplate(load(SP3_DAILY), tpl('IV_SP3_DAILY_STOCK_BATCH'), { context: CONTEXT }).records.map((r) => r.data);
  const opening = daily.filter((d) => d.report_date === '2026-10-02' && d.movement === 'CLOSING').map((d) => ({ product_group: d.product_group, expiry_date: d.expiry_date, qty_ctn: d.qty_ctn }));
  const deliveries = applyTemplate(load(SP3_VEHICLE), tpl('IV_SP3_DELIVERY_LINE'), { context: CONTEXT }).records
    .filter((r) => r.data.delivery_date === '2026-10-03')
    .map((r) => ({ ...r, data: { ...r.data, record_type: 'DELIVERY', event_date: r.data.delivery_date } }));
  const res = enrichDailyInput(deliveries, { stockPoint: 'SP3', openingBatches: opening, products: [] });
  const proposed = {};
  for (const m of res.movements) proposed[`${m.product_group}@${m.expiry_date}`] = (proposed[`${m.product_group}@${m.expiry_date}`] || 0) + m.qty_ctn;
  const actual = {};
  for (const d of daily.filter((x) => x.report_date === '2026-10-03' && x.movement === 'OUT')) actual[`${d.product_group}@${d.expiry_date}`] = (actual[`${d.product_group}@${d.expiry_date}`] || 0) + d.qty_ctn;
  t.diagnostic(`FEFO proposed ${JSON.stringify(proposed)} · actually picked ${JSON.stringify(actual)} · issues ${res.issues.length}`);
  assert.deepEqual(res.issues.filter((i) => i.level === 'error'), []);
  assert.deepEqual(proposed, actual);
});
