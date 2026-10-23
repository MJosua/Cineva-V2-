/** @purpose Isolated PAR approval/PIC regression checks; synthetic data only, no DB or provider connections. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = 'D:/Kantor/2.Backend/Integrated-API/app/modules/par-document/parDocument.service.parts';
const resolve = require(`${root}/support/resolve-latest-pic.js`);
const config = require(`${root}/assignments/get-payment-executor-assignment-config.js`)({ parseJson: value => typeof value === 'string' ? JSON.parse(value) : (value || {}) });
const normalizeUserId = require(`${root}/reference/normalize-user-id.js`)({});
const finished = { total_steps: 3, finished_steps: 3, pending_steps: 0 };
const executor = { user_id: 50, name: 'Payment Executor' };

test('approval -> executor -> paid, then rollback restores approver', () => {
  const approval = { ...finished, pending_steps: 1, approver_id: 20, approver_name: 'Approver Two' };
  assert.equal(resolve({ ticket: { status_id: 2 }, approval, executor }).latest_pic_name, 'Approver Two');
  assert.equal(resolve({ ticket: { status_id: 1 }, approval: finished, executor }).latest_pic_name, 'Payment Executor');
  assert.equal(resolve({ ticket: { status_id: 1 }, approval: finished, executor, paid: true }).latest_pic_name, '-');
  assert.equal(resolve({ ticket: { status_id: 2 }, approval, executor }).latest_pic_stage, 'approval');
});
test('missing executor, terminal tickets and incomplete/empty approval history', () => {
  assert.equal(resolve({ ticket: {}, approval: finished }).latest_pic_name, 'Executor belum ditentukan');
  for (const status_id of [4, 6, 7, 99]) assert.equal(resolve({ ticket: { status_id }, approval: finished, executor }).latest_pic_name, '-');
  for (const approval of [{}, { ...finished, finished_steps: 2 }]) assert.equal(resolve({ ticket: {}, approval, executor }).latest_pic_stage, 'none');
});

async function enrich({ detail = [], work = [], current = [], users = [], rows = [{ ticket_id: 'demo' }] }) {
  const calls = [];
  const query = async (sql, params) => {
    assert.equal((sql.match(/\?/g) || []).length, params.length, 'SQL bindings match placeholders');
    calls.push(sql);
    if (sql.includes('FROM hots.t_ticket_detail')) return [detail];
    if (sql.includes('FROM hots.t_ticket_doc_no')) return [[]];
    if (sql.includes('FROM hots.t_ticket t')) return [current];
    if (sql.includes('FROM hots.t_ticket_work_data')) return [work];
    if (sql.includes('FROM hots.user')) return [users];
    throw new Error('Unexpected query');
  };
  const attach = require(`${root}/support/attach-par-business-columns.js`)({
    dbHots: { promise: () => ({ query }) }, getPaymentExecutorAssignmentConfig: config, normalizeUserId,
    firstNonEmpty: require(`${root}/support/first-non-empty.js`)({}), isParConfidentialValues: () => false,
  });
  return { result: await attach(rows), calls };
}
const history = { ticket_id: 'demo', status_id: 1, ...finished, approved_steps: 2, approval_order: 5 };
const users = [{ user_id: 50, firstname: 'Executor', lastname: 'Selected', uid: 'executor.demo' }];
test('enrichment reuses configured executor fields; latest work overrides EAV; approval contract retained', async () => {
  const { result, calls } = await enrich({
    detail: [{ ticket_id: 'demo', cstm_col: 'custom_executor_id', value: '99' }],
    current: [{ ...history, assignment_config: { par: { payment_assignment: { user_fields: ['custom_executor'] } } } }],
    work: [{ ticket_id: 'demo', field_name: 'custom_executor_id', field_value: '50' }], users,
  });
  assert.equal(result[0].latest_pic_name, 'Executor Selected');
  assert.equal(result[0].latest_pic_id, 50);
  assert.equal(result[0].total_steps, 3);
  assert.equal(result[0].approved_steps, 2, 'executor does not increment approval progress');
  assert.equal(calls.length, 5, 'one batched user lookup, no per-ticket queries');
  assert.match(calls[2], /assignment_status IN \('active', 'revision_needed', 'waiting_review'\)/);
});
test('active payment assignment wins over stale EAV; execution date clears PIC', async () => {
  const fixture = { current: [{ ...history, payment_executor_id: 50 }], detail: [{ ticket_id: 'demo', cstm_col: 'executor_user_id_id', value: '99' }], users };
  const unpaid = await enrich(fixture);
  assert.equal(unpaid.result[0].latest_pic_id, 50);
  const paid = await enrich({ ...fixture, work: [{ ticket_id: 'demo', field_name: 'execution_date', field_value: '2026-10-22' }] });
  assert.equal(paid.result[0].latest_pic_name, '-');
  assert.equal(paid.result[0].paid_status, 'Paid');
});
test('legacy executor EAV fallback, newest work row, and blank latest payment date', async () => {
  const { result } = await enrich({
    current: [history], users,
    detail: [{ ticket_id: 'demo', cstm_col: 'approval_6_user_id_id', value: '50' }],
    work: [{ ticket_id: 'demo', field_name: 'execution_date', field_value: '' }, { ticket_id: 'demo', field_name: 'execution_date', field_value: '2026-10-20' }],
  });
  assert.equal(result[0].latest_pic_name, 'Executor Selected');
  assert.equal(result[0].paid_status, 'Unpaid');
});
test('100-ticket hydration stays batched and isolates executor by ticket', async () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({ ticket_id: `demo-${i}` }));
  const { result, calls } = await enrich({ rows,
    current: rows.map((row, i) => ({ ...history, ...row, payment_executor_id: i + 1 })),
    users: rows.map((_, i) => ({ user_id: i + 1, firstname: `Executor${i + 1}` })),
  });
  assert.equal(calls.length, 5);
  assert.equal(result.length, 100);
  assert.equal(result[99].latest_pic_name, 'Executor100');
});

// Render the actual TSX components with React SSR; substitute only API/drag shell dependencies.
const frontend = 'D:/Kantor/1.Frontend/overseas_module/par';
const appRequire = Module.createRequire(`${frontend}/package.json`);
const ts = appRequire('typescript');
const React = appRequire('react');
const { renderToStaticMarkup } = appRequire('react-dom/server');
const cache = new Map();
function loadSource(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename); cache.set(filename, mod);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod.require = name => {
    if (name === '@hots/dynamic-form') return { SortableLaneBoard: ({ lanes, renderItem }) => React.createElement('div', null, lanes.flatMap(lane => lane.items.map((step, i) => React.createElement('section', { key: `${lane.id}-${i}` }, renderItem(step, lane, {}))))) };
    if (name.includes('ParApproverSelect')) return { ParApproverSelect: () => null };
    if (name.includes('parApi')) return { requestHotsApi: () => { throw new Error('No network in renderer tests'); } };
    if (!name.startsWith('.')) return appRequire(name);
    const base = path.resolve(path.dirname(filename), name);
    const target = ['.tsx', '.ts', '.js', ''].map(ext => base + ext).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
    return loadSource(target);
  };
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
  mod._compile(output.outputText, filename);
  return mod.exports;
}
const { ParBusinessTable, ExecutedView } = loadSource(`${frontend}/src/views/ParListViews.tsx`);
const { ApprovalFlowSection } = loadSource(`${frontend}/src/views/ApprovalFlowSection.tsx`);
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
test('Paid List replaces existing Paid column with date and no active PIC; All PAR keeps paid label', () => {
  const row = { ticket_id: 'demo', current_step: 'Old Approver', latest_pic_name: 'Old Executor', execution_date: '2026-10-22', paid_status: 'Paid' };
  const html = render(ExecutedView, { rows: [row], pagination: { page: 1, limit: 20, total: 1, totalPage: 1 }, loading: false });
  assert.match(html, /Tanggal Paid/); assert.match(html, /22 Oct 2026/);
  assert.doesNotMatch(html, /Old Approver|Old Executor|Step 5\/5/);
  assert.equal((html.match(/<th\b/g) || []).length, 10, 'no extra column');
  const general = render(ParBusinessTable, { rows: [row], loading: false });
  assert.doesNotMatch(general, /Tanggal Paid/); assert.match(general, />Paid</);
});
test('table uses executor PIC; blank execution date is rendered as dash', () => {
  const row = { ticket_id: 'demo', latest_pic_name: 'Executor Selected', current_step: 'Old Approver' };
  assert.match(render(ParBusinessTable, { rows: [row], loading: false }), /Executor Selected/);
  const html = render(ParBusinessTable, { rows: [{ ticket_id: 'demo' }], loading: false, showPaidDate: true });
  assert.match(html, /par-paid-cell">-</);
});
test('approve/reject remarks stay under their own user and date, escaped; blank remark has no label', () => {
  const steps = [
    { order: 1, slotOrder: 1, name: 'Approver One', approverId: 11, date: '2026-10-21', status: 'approved', remark: 'Approved\nwith note <script>alert(1)</script>' },
    { order: 2, slotOrder: 2, name: 'Approver Two', approverId: 12, date: '2026-10-22', status: 'pending', remark: 'Reject: correct invoice' },
    { order: 3, slotOrder: 3, name: 'Approver Three', approverId: 13, status: 'pending', remark: '   ' },
  ];
  const html = render(ApprovalFlowSection, { section: { steps }, executorSteps: [], session: { user: { user_id: 99 } }, approvalAddDrafts: {}, approvalAddSearchRows: {}, approvalDraft: {}, editingApprovalOrder: null });
  assert.match(html, /Approver One<\/strong><small[^>]*>21 Oct 2026<\/small><small[^>]*>remark : Approved\nwith note &lt;script&gt;/);
  assert.match(html, /Approver Two<\/strong><small[^>]*>22 Oct 2026<\/small><small[^>]*>remark : Reject: correct invoice/);
  assert.doesNotMatch(html, /<script>/); assert.equal((html.match(/remark :/g) || []).length, 2);
});
