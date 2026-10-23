// Unit tests with synthetic sheets — run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colIndex, colLetters, colRange, applyTransforms, toIsoDate, findHeaderRow, applyRules, recognize, applyTemplate, validateTemplate } from '../src/index.js';

test('columns', () => {
  assert.equal(colIndex('A'), 0);
  assert.equal(colIndex('BB'), 53);
  assert.equal(colLetters(53), 'BB');
  assert.equal(colRange('C:E').join(','), '2,3,4');
});

test('transforms incl. Excel blank-date artefacts and units', () => {
  assert.equal(applyTransforms(' 1,234.5 ', ['number']), 1234.5);
  assert.equal(applyTransforms(new Date(1899, 11, 29), ['excel_date', 'null_if_before:1901-01-01']), null);
  assert.equal(toIsoDate(45658), '2025-01-01');
  assert.equal(applyTransforms(10, ['pcs_from_ctn:40']), 400);
  assert.equal(applyTransforms('44-OG-2026', ['regex_extract:^\\d+-([A-Z]+)-\\d{4}$']), 'OG');
  assert.throws(() => applyTransforms(1, ['nope']), /Unknown transform/);
});

test('header detection and rules DSL (no eval)', () => {
  const rows = [['Report'], [], ['Customer Code', '#PO', 'SKU Name'], ['IV', '1-IV-2026', 'GSS']];
  assert.equal(findHeaderRow(rows, { detect: { contains: ['#PO', 'SKU Name'] } }).index, 2);
  const r = applyRules([{ when: { field: 'week', op: '>', value: '$cutoff' }, then: { set: { is_forecast: true }, warning: 'FORECAST' } }], { week: 40 }, { cutoff: 38 });
  assert.equal(r.data.is_forecast, true);
  assert.deepEqual(r.warnings, ['FORECAST']);
});

test('unpivot with stacked blocks (carry) and forecast rule', () => {
  const sheet = [
    ['', 'STT 2026', 'Jan', 'Jan', ''],
    ['', 'Stock Movement (Vietnam)', 1, 2, 'Total'],
    ['', 'GSS', 10, 20, 30],
    ['', 'Total', 10, 20, 30],
    ['', 'Key Group (HCM)', 1, 2, 'Total'],
    ['', 'GSS', 4, 5.5, 9.5],
  ];
  const t = {
    template_code: 'T', target: 'staging.t',
    sheets: [{ match_regex: '^STT \\d{4}$', mode: 'unpivot', header: { row: 2 }, constants_from_sheet_name: { year: '(\\d{4})' }, constants: { segment_label: 'Stock Movement (Vietnam)' },
      carry: [{ field: 'segment_label', column: 'B', row_when: { column: 'C', op: '=', value: 1 }, skip_row: true }],
      unpivot: { id_columns: { sku_name: { from: 'B', transform: ['string'] } }, key_row: 2, value_columns_where: { int_between: [1, 53] }, key_field: 'week', value_field: 'qty' },
      skip_when: { field: 'sku_name', op: 'in', value: ['Total'] } }],
    rules: [{ when: { all: [{ field: 'year', op: '=', value: '$currentYear' }, { field: 'week', op: '>', value: '$cutoffWeek' }] }, then: { set: { is_forecast: true } } }],
  };
  assert.deepEqual(validateTemplate(t), []);
  const out = applyTemplate({ name: 'x.xlsx', sheets: { 'STT 2026': sheet } }, t, { context: { currentYear: 2026, cutoffWeek: 1 } });
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.records.map((r) => [r.data.segment_label, r.data.sku_name, r.data.week, r.data.qty, r.data.is_forecast ?? false, r.source_col]), [
    ['Stock Movement (Vietnam)', 'GSS', 1, 10, false, 'C'],
    ['Stock Movement (Vietnam)', 'GSS', 2, 20, true, 'D'],
    ['Key Group (HCM)', 'GSS', 1, 4, false, 'C'],
    ['Key Group (HCM)', 'GSS', 2, 5.5, true, 'D'],
  ]);
});

test('lookups, required fields and statuses', () => {
  const t = { template_code: 'R', target: 'staging.r', sheets: [{ match: 'DB', header: { row: 1 }, columns: { port: { from: 'Port', transform: ['string', 'upper'] }, po: 'PO' } }],
    lookups: { warehouse_code: { from: 'port', map: 'ports', on_missing: 'warning:PORT_UNMAPPED' } }, required: ['po'] };
  const out = applyTemplate({ name: 'a', sheets: { DB: [['Port', 'PO'], ['cat lai', 'P1'], ['DA NANG', 'P2'], ['HAI PHONG', '']] } }, t, { lookups: { ports: { 'CAT LAI': 'WH-HCM', 'HAI PHONG': 'WH-HN' } } });
  assert.deepEqual(out.records.map((r) => [r.data.warehouse_code, r.status]), [['WH-HCM', 'valid'], [null, 'warning'], ['WH-HN', 'blocked']]);
  assert.deepEqual(out.stats, { total: 3, valid: 1, warning: 1, blocked: 1, bySheet: { DB: 3 } });
});

test('recognition MATCHED / UNKNOWN and template validation errors', () => {
  const templates = [{ template_code: 'A', fingerprint: { file_name: ['*By WH*.xlsx'], sheets_all: ['STT 2026'] } }, { template_code: 'B', fingerprint: { sheets_all: ['Received Container'] } }];
  assert.equal(recognize({ name: 'New Format By WH.xlsx', sheets: { 'STT 2026': [] } }, templates).best, 'A');
  assert.equal(recognize({ name: 'other.xlsx', sheets: { X: [] } }, templates).status, 'UNKNOWN');
  const problems = validateTemplate({ template_code: 'bad code', target: 'x', sheets: [{ mode: 'unpivot', unpivot: {} }], rules: [{ when: { field: 'a', op: '~' }, then: {} }] });
  assert.ok(problems.length >= 5);
});

test('excel_date: SheetJS cellDates values a few seconds before local midnight are the next day (Asia/Jakarta)', async () => {
  const { toIsoDate } = await import('../src/core/transforms.js');
  const nearMidnight = new Date(2026, 9, 1, 23, 59, 48); // what SheetJS returns for serial 46297 (2026-10-02) in UTC+7
  assert.equal(toIsoDate(nearMidnight), '2026-10-02');
  assert.equal(toIsoDate(new Date(2026, 9, 2, 0, 0, 0)), '2026-10-02');
  assert.equal(toIsoDate(new Date(2026, 9, 2, 15, 30, 0)), '2026-10-02');
  assert.equal(toIsoDate(46297), '2026-10-02');
});

test('enrichDailyInput: container from IOD, FEFO, manual override, shortage, transfer to self, closing check', async () => {
  const { enrichDailyInput } = await import('../src/index.js');
  const rec = (sheet, row, data) => ({ sheet, source_row: row, status: 'valid', messages: [], data: { event_date: '2026-10-03', ...data } });
  const products = [{ matcode: 413243, product_group: 'GSS', per_carton: 40 }, { matcode: 438009, product_group: 'PGSS', per_carton: 12 }];
  const containerBatches = [
    { container_no: 'ABCU1234567', matcode: 413243, batch_no: 'B2', expired_date: '2027-06-01', stuff_qty: 3000 },
    { container_no: 'ABCU1234567', matcode: 413243, batch_no: 'B1', expired_date: '2027-05-01', stuff_qty: 1000 },
  ];
  const opening = [{ product_group: 'GSS', expiry_date: '2027-04-01', qty_ctn: 100 }, { product_group: 'PGSS', expiry_date: '2027-03-01', qty_ctn: 10 }];
  const records = [
    rec('STOCK_IN', 2, { record_type: 'STOCK_IN', source: 'CAT LAI (port)', container_no: 'abcu 1234567' }),
    rec('STOCK_IN', 3, { record_type: 'STOCK_IN', source: 'CAT LAI (port)', container_no: 'NOPE0000000' }),
    rec('DELIVERY', 2, { record_type: 'DELIVERY', line_type: 'SALES', product_group: 'GSS', qty_ctn: 600, shop_name: 'A' }),
    rec('DELIVERY', 3, { record_type: 'DELIVERY', line_type: 'SALES', product_group: 'GSS', qty_ctn: 50, expiry_date: '2027-06-01', shop_name: 'B' }),
    rec('DELIVERY', 4, { record_type: 'DELIVERY', line_type: 'PROMO', product_group: 'PGSS', qty_ctn: 12, shop_name: 'C' }),
    rec('TRANSFER', 2, { record_type: 'TRANSFER_OUT', product_group: 'GSS', qty_ctn: 5, to_stock_point: 'SP3' }),
    rec('STOCK_CLOSING', 2, { record_type: 'CLOSING', product_group: 'GSS', expiry_date: '2027-05-01', qty_ctn: 500 }),
  ];
  const res = enrichDailyInput(records, { stockPoint: 'SP3', containerBatches, products, openingBatches: opening });
  const codes = res.issues.map((i) => i.code);
  assert.ok(codes.includes('CONTAINER_NOT_IN_IOD'));
  assert.ok(codes.includes('INSUFFICIENT_STOCK')); // PGSS 12 out of 10
  assert.ok(codes.includes('TRANSFER_TO_SELF'));
  assert.ok(codes.includes('CLOSING_DIFFERENCE'));
  const ins = res.movements.filter((m) => m.movement === 'IN');
  assert.deepEqual(ins.map((m) => [m.batch_no, m.expiry_date, m.qty_ctn, m.qty_pcs, m.allocation]), [['B1', '2027-05-01', 1000, 40000, 'IOD'], ['B2', '2027-06-01', 3000, 120000, 'IOD']]);
  const outA = res.movements.filter((m) => m.counterparty === 'A').map((m) => [m.expiry_date, m.qty_ctn, m.allocation]);
  assert.deepEqual(outA, [['2027-04-01', 100, 'FEFO'], ['2027-05-01', 500, 'FEFO']]);
  const outB = res.movements.filter((m) => m.counterparty === 'B').map((m) => [m.expiry_date, m.qty_ctn, m.allocation]);
  assert.deepEqual(outB, [['2027-06-01', 50, 'MANUAL']]);
  const gss = res.closing.filter((c) => c.product_group === 'GSS');
  assert.deepEqual(gss, [{ product_group: 'GSS', expiry_date: '2027-05-01', qty_ctn: 500 }, { product_group: 'GSS', expiry_date: '2027-06-01', qty_ctn: 2950 }]);
  assert.equal(res.summary.errors, 3);
});
