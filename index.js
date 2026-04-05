// BISMILAHIROHMANNIROHIM
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const localEnvPath = path.join(__dirname, '.env.local');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true });
  console.log('Loaded local environment override from .env.local');
}

global.log = require('./core/logger');

const { PORT } = require('./config/env');
const {
  dbConf,
  dbHots,
  dbQueryHots,
  dbCardGenerator,
  dbClick,
} = require('./config/db');

const { isProduction } = require('./bootstrap/production');
const { createServer, isHttpsServerEnabled } = require('./bootstrap/ssl');
const { createApp } = require('./app/createApp');
const { registerRoutes } = require('./app/registerRoutes');
const { runDatabaseConnectivityChecks, startEngine, startAutomations } = require('./jobs/startup');
const { startServer } = require('./server/listen');

async function main() {
  const production = isProduction();
  const useSecureCookies = isHttpsServerEnabled(production, __dirname);
  const App = createApp({ isProduction: production, dbHots, useSecureCookies });

  registerRoutes(App);

  const server = createServer(App, production, __dirname);
  console.log('Server status is Production?', production);
  console.log('Session cookie secure mode?', useSecureCookies);

  await runDatabaseConnectivityChecks({ dbConf, dbCardGenerator, dbHots, dbClick });
  await startEngine({ dbQueryHots, dbHots });
  startAutomations();

  startServer(server, PORT, App);
}

main().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
