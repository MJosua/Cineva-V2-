/**
 * Local trial server for the Cineva campaign API. Never touches hots: it uses the throwaway database `cineva_trial`
 * on a loopback MySQL and a fake principal chosen by the `x-test-principal` header (hq | creator | creator2 | foreignHq).
 * Usage (from repo root):  node 3.Knowledge/scripts/cineva_db_trial_2026_11_02/serve_trial.mjs [--port 4300] [--reset]
 * Env: CINEVA_TRIAL_HOST (loopback only), CINEVA_TRIAL_PORT (3307), CINEVA_TRIAL_USER (root), CINEVA_TRIAL_PASSWORD ('').
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, '../../../2.Backend/Integrated-API');
const require = createRequire(path.join(backend, 'package.json'));
const mysql = require('mysql2/promise');
const express = require('express');
const { createCampaignRouter } = require(path.join(backend, 'app/modules/cineva-campaigns/routes.js'));
const { createService } = await import(pathToFileURL(path.join(backend, 'app/modules/cineva-campaigns/service.mjs')).href);

const DB = 'cineva_trial';
const base = { host: process.env.CINEVA_TRIAL_HOST || '127.0.0.1', port: Number(process.env.CINEVA_TRIAL_PORT || 3307), user: process.env.CINEVA_TRIAL_USER || 'root', password: process.env.CINEVA_TRIAL_PASSWORD || '' };
if (!['127.0.0.1', 'localhost'].includes(base.host)) throw new Error('Refusing non-loopback MySQL host');
const args = process.argv.slice(2), port = Number(args[args.indexOf('--port') + 1]) || 4300;
const sql = name => fs.readFileSync(path.join(here, name), 'utf8');

const admin = await mysql.createConnection({ ...base, multipleStatements: true });
const [exists] = await admin.query('SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [DB]);
if (args.includes('--reset') || !exists.length) {
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\`; CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${DB}\`;`);
  await admin.query(sql('01_stub_parents.sql'));
  await admin.query(sql('02_cineva_tables.sql'));
  await admin.query("INSERT INTO m_company (company_id, company_name) VALUES (1,'Cineva'),(2,'Perusahaan lain'); INSERT INTO m_company_program_list (program_id, system_name) VALUES (1,'Cineva'); INSERT INTO `user` (user_id, firstname) VALUES (10,'hq'),(11,'hq-lain'),(20,'creator'),(21,'creator2')");
  console.log('Database prepared with schema and sample parent rows');
}
await admin.end();

const pool = mysql.createPool({ ...base, database: DB, connectionLimit: 10 });
const principals = {
  hq: { userId: 10, programId: 1, companyId: 1, product: 'hq' },
  creator: { userId: 20, programId: 1, companyId: 1, product: 'creator' },
  creator2: { userId: 21, programId: 1, companyId: 1, product: 'creator' },
  foreignHq: { userId: 11, programId: 1, companyId: 2, product: 'hq' },
};
const runtime = {
  service: createService({ pool }),
  authorize: async req => {
    const principal = principals[req.get('x-test-principal')];
    if (!principal) throw Object.assign(new Error('Set header x-test-principal to hq, creator, creator2 or foreignHq'), { code: 'UNAUTHENTICATED', status: 401 });
    return principal;
  },
};
const app = express();
// Trial-only CORS so the Vite preview (another loopback port) can call this API from the browser.
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-test-principal');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use('/api/cineva/v1', createCampaignRouter({ Router: express.Router, runtime, logger: { error: message => console.error(message) } }));
app.listen(port, '127.0.0.1', () => console.log(`Cineva trial API on http://127.0.0.1:${port}/api/cineva/v1 (database ${DB} at ${base.host}:${base.port})`));
