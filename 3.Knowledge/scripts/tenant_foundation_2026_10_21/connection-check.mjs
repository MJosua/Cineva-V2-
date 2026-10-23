import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const root = path.resolve(import.meta.dirname, '../../..'), require = createRequire(path.join(root, '2.Backend/Integrated-API/package.json'));
const reference = process.argv.includes('--reference-hots');
const source = reference ? 'D:/Kantor/2.Backend/Integrated-API/.env' : path.join(root, '2.Backend/Integrated-API/.env');
const env = require('dotenv').parse(await fs.readFile(source));
// Never print host/user/password/token/key values. Database names are used only for MCP metadata comparison.
const databases = Object.entries(env).filter(([key]) => /^(LOCAL_DB_NAME|DB_NAME_HT|DEV_DB_NAME_HT)$/.test(key)).map(([key, value]) => ({key, database: value}));
const configuration = Object.entries(env).filter(([key]) => /^(?:LOCAL_|DEV_)?DB_|^(?:OIDC|SSO|TENANT)_/.test(key)).map(([key, value]) => ({key, configured: Boolean(value)}));
process.stdout.write(JSON.stringify({source: reference ? 'Kantor read-only reference' : 'Cineva local', databases, configuration, scope: 'Redacted configuration inventory only. No direct DB connection or application import.'})+'\n');
