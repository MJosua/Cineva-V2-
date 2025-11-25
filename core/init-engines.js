// core/init-engines.js
const path = require('path');
const { dbHots } = require('../config/db'); // adjust path if needed

// core modules (make sure these require paths are correct for your project)
const engineLoader = require('./engine-loader');
const formLoader = require('./form-loader'); // optional but recommended
const workflowEngine = require('./workflow-engine');
const triggerEngine = require('./trigger-engine');
const documentEngine = require('./document-engine');

function dbQuery(sql, params = []) {
  // dbHots is mysql pool from your project. Return rows only like dbQueryHots.
  return dbHots.promise().query(sql, params).then(([rows]) => rows);
}

async function initAll() {
  try {
    console.log('🔁 HOTS Engine init starting...');

    // 1) Initialize engineLoader (loads m_engine_modules, m_workflow_module, m_trigger)
    console.log('1️⃣ Initializing engineLoader (loading m_engine_modules)...');
    await engineLoader.init(dbQuery);
    console.log('   -> engineLoader loaded', Object.keys(engineLoader.modules).length, 'modules');

    // 2) Initialize formLoader (if you have it)
    if (formLoader && typeof formLoader.init === 'function') {
      console.log('2️⃣ Initializing formLoader...');
      await formLoader.init && (await formLoader.init(dbQuery).catch(e => { console.warn('formLoader.init warning:', e.message); }));
    }

    // 3) Initialize workflowEngine (needs engineLoader & dbQuery)
    console.log('3️⃣ Initializing workflowEngine...');
    workflowEngine.init({ engineLoader, formLoader, dbQuery });

    // 4) Initialize documentEngine (optional, used by trigger engine)
    console.log('4️⃣ Initializing documentEngine...');
    documentEngine.init({ dbQuery, engineLoader });

    // 5) Initialize triggerEngine (must receive engineLoader + documentEngine)
    console.log('5️⃣ Initializing triggerEngine...');
    triggerEngine.init({ dbQuery, engineLoader, documentEngine });

    // Optional: warm-reload modules every N minutes (useful during dev)
    // setInterval(() => engineLoader.reloadAll().catch(e=>console.error('engineLoader.reloadAll',e)), 1000*60*5);

    console.log('✅ HOTS Engine v4 initialized successfully.');
    return true;
  } catch (e) {
    console.error('❌ HOTS Engine init failed:', e && e.message ? e.message : e);
    throw e;
  }
}

module.exports = { initAll, dbQuery };
