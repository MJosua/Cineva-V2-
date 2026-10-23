import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const root = path.resolve(import.meta.dirname, '../../..');
const require = createRequire(path.join(root, '2.Backend/Integrated-API/package.json'));
export async function connectHots() {
  // Parse only: never imports application startup, starts cron or logs credentials.
  const env = require('dotenv').parse(await fs.readFile('D:/Kantor/2.Backend/Integrated-API/.env'));
  const database = env.DEV_DB_NAME_HT || env.DB_NAME_HT;
  if (database !== 'hots' || !env.DEV_DB_HOST || !env.DEV_DB_USER || !env.DEV_DB_PASSWORD) throw new Error('EXPECTED_HOTS_DEVELOPMENT_CONFIG');
  const conn = await require('mysql2/promise').createConnection({host: env.DEV_DB_HOST, user: env.DEV_DB_USER, password: env.DEV_DB_PASSWORD, database, connectTimeout: 15000, multipleStatements: false});
  try {
    const [[row]] = await conn.query('SELECT DATABASE() AS db, SHA2(@@server_uuid,256) AS fingerprint');
    if (row.db !== 'hots' || row.fingerprint !== 'f8e59fa863cf1e38d4958dcf1e354f56e496fccdbe3e9f4177ef675d0dc623ba') throw new Error('MCP_SERVER_IDENTITY_MISMATCH');
    return conn;
  } catch (error) {await conn.end();throw error;}
}
