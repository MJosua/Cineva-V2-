/**
 * One-time trial of the proposed Cineva DDL in a throwaway database. Never touches `hots`.
 * Guards: database name must be `cineva_trial`; host must be loopback. DDL auto-commits in MySQL, so reversibility
 * comes from 99_drop_cineva_tables.sql; every data check runs in beginTransaction ... rollback.
 * Usage (from repo root):  node 3.Knowledge/scripts/cineva_db_trial_2026_11_02/run_trial.cjs [--keep]
 * Connection (defaults to the isolated trial server): CINEVA_TRIAL_HOST, CINEVA_TRIAL_PORT, CINEVA_TRIAL_USER, CINEVA_TRIAL_PASSWORD.
 */
const fs = require('node:fs');
const path = require('node:path');
const mysql = require(path.resolve(__dirname, '../../../2.Backend/Integrated-API/node_modules/mysql2/promise'));

const DB = 'cineva_trial';
const cfg = {
  host: process.env.CINEVA_TRIAL_HOST || '127.0.0.1',
  port: Number(process.env.CINEVA_TRIAL_PORT || 3307),
  user: process.env.CINEVA_TRIAL_USER || 'root',
  password: process.env.CINEVA_TRIAL_PASSWORD || '',
  multipleStatements: true,
};
if (!['127.0.0.1', 'localhost', '::1'].includes(cfg.host)) throw new Error(`Refusing non-loopback host ${cfg.host}`);
if (process.env.CINEVA_TRIAL_DB && process.env.CINEVA_TRIAL_DB !== DB) throw new Error('Refusing database other than cineva_trial');
const sql = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

async function expectError(conn, name, code, fn) {
  try { await fn(); check(name, false, 'no error raised'); } catch (error) { check(name, error.code === code, `${error.code}`); }
}
async function count(conn, table) { const [[row]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${table}\``); return Number(row.n); }

(async () => {
  const admin = await mysql.createConnection(cfg);
  const [[version]] = await admin.query('SELECT VERSION() AS v');
  console.log(`Server ${version.v} at ${cfg.host}:${cfg.port}`);
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.query(`CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();
  const conn = await mysql.createConnection({ ...cfg, database: DB });
  const [[current]] = await conn.query('SELECT DATABASE() AS db');
  if (current.db !== DB) throw new Error('Connected to unexpected database ' + current.db);
  try {
    await conn.query(sql('01_stub_parents.sql'));
    await conn.query(sql('02_cineva_tables.sql'));
    const [tables] = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 't\\_cineva\\_%'", [DB]);
    check('20 Cineva tables created', tables.length === 20, String(tables.length));
    const [fks] = await conn.query("SELECT COUNT(*) AS n FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_NAME LIKE 'fk\\_cineva\\_%'", [DB]);
    check('foreign keys present', Number(fks[0].n) === 27, String(fks[0].n));
    const [[collation]] = await conn.query("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 't\\_cineva\\_%' AND (ENGINE <> 'InnoDB' OR TABLE_COLLATION <> 'utf8mb4_unicode_ci')", [DB]);
    check('all tables InnoDB utf8mb4_unicode_ci', Number(collation.n) === 0);

    // Committed parent rows (stand-ins for hots master data).
    await conn.beginTransaction();
    try {
      await conn.query("INSERT INTO m_company (company_id, company_name) VALUES (1, 'Cineva'); INSERT INTO m_company_program_list (program_id, system_name) VALUES (1, 'Cineva'); INSERT INTO `user` (user_id, firstname) VALUES (10, 'hq'), (20, 'creator')");
      await conn.commit();
    } catch (error) { await conn.rollback(); throw error; }

    const seed = async () => {
      await conn.query("INSERT INTO t_cineva_campaign (campaign_id, program_id, company_id, owner_user_id, title, brand, brief, objective, audience, messaging, stage_template_id, stage_start_date) VALUES ('c1',1,1,10,'T','B','b','o','a','m','reguler-bulanan','2026-11-04')");
      await conn.query("INSERT INTO t_cineva_campaign_batch VALUES ('b1','c1','Batch 1'); INSERT INTO t_cineva_campaign_product VALUES ('p1','c1','Produk','Var',100000); INSERT INTO t_cineva_campaign_milestone VALUES ('m1','c1','Draft','2026-11-10'); INSERT INTO t_cineva_stage_holiday VALUES ('c1','2026-11-25')");
      await conn.query("INSERT INTO t_cineva_assignment (assignment_id, campaign_id, batch_id, creator_user_id, creator_name, product_id, fee_amount) VALUES ('a1','c1','b1',20,'Creator','p1',2000000)");
      await conn.query("INSERT INTO t_cineva_deliverable VALUES ('d1','a1','Reels','Instagram',1,'2026-11-10','creator')");
      await conn.query("INSERT INTO t_cineva_delivery_draft VALUES ('d1',1,'https://example.test/d','', '2026-11-03 09:00:00.000')");
      const [review] = await conn.query("INSERT INTO t_cineva_delivery_review (deliverable_id, draft_version, decision, note, reviewed_at, actor) VALUES ('d1',1,'approved','','2026-11-03 10:00:00.000','hq-1')");
      await conn.query('INSERT INTO t_cineva_review_approval VALUES (?,?),(?,?)', [review.insertId, 'client', review.insertId, 'owner']);
      await conn.query("INSERT INTO t_cineva_delivery_posting VALUES ('d1','https://example.test/p','2026-11-09'); INSERT INTO t_cineva_insight_snapshot (snapshot_id, deliverable_id, captured_at, likes, comments, views) VALUES ('i1','d1','2026-11-16',10,2,100)");
      await conn.query("INSERT INTO t_cineva_payout (payout_id, assignment_id, amount, paid_at, evidence) VALUES ('pay1','a1',2000000,'2026-11-20','ref-1')");
      await conn.query("INSERT INTO t_cineva_stage_extension (campaign_id, stage_key, days, reason, proof_kind, proof_text) VALUES ('c1','konten',2,'Sakit','text','Surat dokter')");
      await conn.query("INSERT INTO t_cineva_stage_extension (campaign_id, stage_key, days, reason, proof_kind, proof_file_name, proof_size_bytes) VALUES ('c1','konten',1,'Banjir','png','bukti.png',1200)");
      await conn.query("INSERT INTO t_cineva_cancellation (campaign_id, assignment_id, party, reason, policy_version, penalty_amount, penalty_percent, requires_replacement) VALUES ('c1','a1','crew',NULL,'CLIENT-2026-11-03',300000,15.00,1)");
      await conn.query("INSERT INTO t_cineva_late_submission (deliverable_id, requested_by, reason) VALUES ('d1','creator-1','Listrik padam')");
    };

    // 1. Full happy path, then rollback leaves nothing behind.
    await conn.beginTransaction();
    try {
      await seed();
      check('happy path inserts across all tables', (await count(conn, 't_cineva_assignment')) === 1 && (await count(conn, 't_cineva_review_approval')) === 2);
    } finally { await conn.rollback(); }
    check('rollback leaves tables empty', (await count(conn, 't_cineva_campaign')) === 0 && (await count(conn, 't_cineva_payout')) === 0);

    // 2. Constraint behaviour, each inside its own transaction.
    const inTx = async (name, code, fn) => {
      await conn.beginTransaction();
      try { await seed(); await expectError(conn, name, code, fn); } finally { await conn.rollback(); }
    };
    await inTx('orphan assignment is refused (FK)', 'ER_NO_REFERENCED_ROW_2', () => conn.query("INSERT INTO t_cineva_assignment (assignment_id, campaign_id, batch_id, creator_user_id, creator_name) VALUES ('x','nope','b1',20,'X')"));
    await inTx('campaign with children cannot be deleted (history kept)', 'ER_ROW_IS_REFERENCED_2', () => conn.query("DELETE FROM t_cineva_campaign WHERE campaign_id = 'c1'"));
    await inTx('second review for the same draft is refused', 'ER_DUP_ENTRY', () => conn.query("INSERT INTO t_cineva_delivery_review (deliverable_id, draft_version, decision, note, reviewed_at, actor) VALUES ('d1',1,'revision_requested','x','2026-11-03 11:00:00.000','hq-1')"));
    await inTx('review needs an existing draft', 'ER_NO_REFERENCED_ROW_2', () => conn.query("INSERT INTO t_cineva_delivery_review (deliverable_id, draft_version, decision, note, reviewed_at, actor) VALUES ('d1',9,'approved','','2026-11-03 11:00:00.000','hq-1')"));
    await inTx('zero payout is refused (CHECK)', 'ER_CHECK_CONSTRAINT_VIOLATED', () => conn.query("INSERT INTO t_cineva_payout (payout_id, assignment_id, amount, paid_at, evidence) VALUES ('pay0','a1',0,'2026-11-20','x')"));
    await inTx('negative money is refused (unsigned)', 'ER_WARN_DATA_OUT_OF_RANGE', () => conn.query("UPDATE t_cineva_assignment SET fee_amount = -1 WHERE assignment_id = 'a1'"));
    await inTx('text proof without text is refused (CHECK)', 'ER_CHECK_CONSTRAINT_VIOLATED', () => conn.query("INSERT INTO t_cineva_stage_extension (campaign_id, stage_key, days, reason, proof_kind) VALUES ('c1','konten',1,'x','text')"));
    await inTx('image proof with empty size is refused (CHECK)', 'ER_CHECK_CONSTRAINT_VIOLATED', () => conn.query("INSERT INTO t_cineva_stage_extension (campaign_id, stage_key, days, reason, proof_kind, proof_file_name, proof_size_bytes) VALUES ('c1','konten',1,'x','jpeg','a.jpg',0)"));
    await inTx('stage template without start date is refused (CHECK)', 'ER_CHECK_CONSTRAINT_VIOLATED', () => conn.query("UPDATE t_cineva_campaign SET stage_start_date = NULL WHERE campaign_id = 'c1'"));
    await inTx('penalty percent above 100 is refused (CHECK)', 'ER_CHECK_CONSTRAINT_VIOLATED', () => conn.query("UPDATE t_cineva_cancellation SET penalty_percent = 150"));
    await inTx('pending late request with a decision time is refused (CHECK)', 'ER_CHECK_CONSTRAINT_VIOLATED', () => conn.query("UPDATE t_cineva_late_submission SET decided_at = NOW(3) WHERE request_id > 0"));
    await inTx('unknown output owner is refused (enum)', 'WARN_DATA_TRUNCATED', () => conn.query("UPDATE t_cineva_deliverable SET output_owner = 'client'"));

    // 3. Rollback script removes every Cineva table and leaves the stand-ins.
    await conn.query(sql('99_drop_cineva_tables.sql'));
    const [left] = await conn.query("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 't\\_cineva\\_%'", [DB]);
    check('rollback script drops all Cineva tables', Number(left[0].n) === 0);
    await conn.query(sql('02_cineva_tables.sql'));
    check('DDL can be re-applied after rollback', (await count(conn, 't_cineva_campaign')) === 0);
  } finally {
    await conn.end();
    if (!process.argv.includes('--keep')) {
      const cleanup = await mysql.createConnection(cfg);
      await cleanup.query(`DROP DATABASE IF EXISTS \`${DB}\``);
      await cleanup.end();
      console.log(`Dropped ${DB}`);
    }
  }
  const failed = results.filter(item => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
})().catch(error => { console.error('TRIAL ERROR', error.code || '', error.message); process.exitCode = 2; });
