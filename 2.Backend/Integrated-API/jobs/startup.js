const { initAll } = require('../core/init-engines');

async function runDatabaseConnectivityChecks({ dbConf, dbCardGenerator, dbHots, dbClick }) {
  const localStartupMode = process.env.LOCAL_STARTUP_MODE === '1';
  if (localStartupMode) {
    const checks = [['DB Local', dbConf]];
    await Promise.all(checks.map(([label, db]) => new Promise((resolve) => {
      db.getConnection((e, conn) => {
        if (e) console.log(`Error ${label} Connection!`, e.sqlMessage);
        else console.log(`${label} connected ${conn.threadId}`);
        resolve();
      });
    })));
    console.log('Local startup mode active: skipping non-local database checks.');
    return;
  }

  const checks = [
    ['DB e-Order', dbConf],
    ['DB CardGen', dbCardGenerator],
    ['DB HOTS', dbHots],
    ['DB Click', dbClick],
  ];

  await Promise.all(checks.map(([label, db]) => new Promise((resolve) => {
    db.getConnection((e, conn) => {
      if (e) console.log(`Error ${label} Connection!`, e.sqlMessage);
      else console.log(`${label} connected ${conn.threadId}`);
      resolve();
    });
  })));

  console.log('✅ All database connections are checked!');
}

async function startEngine({ dbQueryHots, dbHots }) {
  if (process.env.SKIP_ENGINE_INIT === '1') {
    console.log('SKIP_ENGINE_INIT=1 detected: HOTS engine initialization skipped.');
    return;
  }

  try {
    console.log('🔥 Initializing HOTS Engine...');
    await initAll(dbQueryHots, dbHots);
    console.log('✅ HOTS Engine Initialized!');
  } catch (e) {
    console.error('❌ Failed to initialize HOTS Engine:', e);
    process.exit(1);
  }
}

function startAutomations() {
  if (process.env.SKIP_AUTOMATION === '1') {
    console.log('SKIP_AUTOMATION=1 detected: automations skipped.');
    return;
  }

  const {
    notification,
    cleanup,
  } = require('../service/automation');

  // notification.shippingMailNotification(); // Obsolete: decommissioned in this context
  cleanup.cleanupOrphan();
}

module.exports = {
  runDatabaseConnectivityChecks,
  startEngine,
  startAutomations,
};
