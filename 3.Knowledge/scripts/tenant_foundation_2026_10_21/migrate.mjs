import fs from 'node:fs/promises';
import path from 'node:path';
import {connectHots} from './hotsConnection.mjs';
const root = path.resolve(import.meta.dirname, '../../..');
const hierarchy = process.argv.includes('--hierarchy');
// One-time CLI uses SSE-compatible parser envelope without importing the SSE manager:
// legacy logger -> notification controller -> DB pools/monitor is not safe in migration CLI.
const logger = Object.fromEntries(['info', 'error'].map(level => [level, message => process.stdout.write(`[TENANT-MIGRATION][${level.toUpperCase()}] : ${message}\n`)]));
const report = {database: 'hots', authorized: 'User 2026-10-21: additive HOTS changes; script connection allowed', mode: process.argv.includes('--apply') ? 'apply' : 'check', tables: [], existingDataWrites: 0};
let conn, locked = false;
try {
  conn = await connectHots();
  const [[lock]] = await conn.query("SELECT GET_LOCK('cineva.saas.pilot.001', 0) AS acquired");
  if (Number(lock.acquired) !== 1) throw new Error('MIGRATION_LOCK_UNAVAILABLE');
  locked = true;
  const references = [
    ['t_ticket', 'ticket_id', 'varchar(36)', 'utf8mb4_unicode_ci'],
    ['m_company', 'company_id', 'int', null], ['m_company_program_list', 'program_id', 'int', null], ['user', 'user_id', 'int', null],
  ];
  for (const [table, column, type, collation] of references) {
    const [rows] = await conn.execute('SELECT COLUMN_TYPE,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', [table, column]);
    if (rows.length !== 1 || rows[0].COLUMN_TYPE !== type || rows[0].COLLATION_NAME !== collation) throw new Error('PHYSICAL_SCHEMA_DRIFT');
  }
  const source = await fs.readFile(path.join(import.meta.dirname, hierarchy ? '002_company_scope_additive.sql' : '001_saas_pilot_additive.sql'), 'utf8');
  const statements = source.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
  if (statements.length !== 2 || statements.some(s => !/^CREATE TABLE t_tenant_/.test(s))) throw new Error('UNEXPECTED_MIGRATION_CONTENT');
  // Refuse an existing name rather than silently assuming its columns/constraints are compatible.
  for (const statement of statements) {
    const table = statement.match(/^CREATE TABLE (\w+)/)[1];
    const [rows] = await conn.execute('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [table]);
    report.tables.push({table, existed: rows.length > 0, created: false});
  }
  if (report.tables.some(t => t.existed)) throw new Error('EXISTING_TARGET_REQUIRES_SCHEMA_COMPARISON');
  if (report.mode === 'apply') {
    for (let i = 0; i < statements.length; i++) {
      await conn.query(statements[i]); // DDL implicit commit; no pretend rollback. No data DML.
      report.tables[i].created = true;
      const [ddl] = await conn.query(`SHOW CREATE TABLE ${report.tables[i].table}`);
      report.tables[i].ddl = ddl[0]['Create Table'];
    }
  }
  report.success = true;logger.info(`${report.mode}: ${report.tables.length} additive tables; existing data writes=0`);
} catch (error) {
  report.success = false;report.error = /^[A-Z0-9_]+$/.test(error.code || error.message) ? (error.code || error.message) : 'MIGRATION_FAILED';
  logger.error(report.error);process.exitCode = 1;
} finally {
  if (conn) {if (locked) await conn.query("SELECT RELEASE_LOCK('cineva.saas.pilot.001')");await conn.end();}
  await fs.writeFile(path.join(root, `3.Knowledge/reports/tenant_foundation_2026_10_21/migration${hierarchy ? '-hierarchy' : ''}.json`), JSON.stringify(report, null, 2));
}
