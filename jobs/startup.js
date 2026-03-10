const { initAll } = require('../core/init-engines');

async function runDatabaseConnectivityChecks({ dbConf, dbCardGenerator, dbHots, dbClick }) {
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
  const {
    notification,
    cleanup,
  } = require('../service/automation');

  notification.shippingMailNotification();
  cleanup.cleanupOrphan();
}

module.exports = {
  runDatabaseConnectivityChecks,
  startEngine,
  startAutomations,
};
