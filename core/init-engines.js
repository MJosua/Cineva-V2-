/**
 * core/init-engines.js
 *
 * Bootstraps engine subsystems: engine-loader, form-loader (light), workflow-engine, trigger-engine, document-engine.
 * Usage:
 *   const { initAll } = require('./core/init-engines');
 *   await initAll({ dbQuery: dbQueryHots, dbPool: dbHots });
 *
 * If your project stores dbQuery as dbQueryHots exported in /config/db.js, call without args (it will require it).
 */

const engineLoader = require('./engine-loader');
const formLoader = require('./form-loader');
const workflowEngine = require('./workflow-engine');
const triggerEngine = require('./trigger-engine');
const documentEngine = require('./document-engine');

const { dbQueryHots, dbHots } = require('../config/db');

let _inited = false;

async function initAll(opts = {}) {
  if (_inited) return;
  const dbQuery = opts.dbQuery || dbQueryHots;
  const dbPool = opts.dbPool || dbHots;

  if (!dbQuery || typeof dbQuery !== 'function') {
    throw new Error('initAll requires dbQueryFunc');
  }

  // init engine loader
  await engineLoader.init({ dbQuery });

  // form loader uses engineLoader (no db needed)
  // (form-loader module uses engineLoader internally)

  // init workflow engine
  workflowEngine.init({ engineLoader, dbQuery, resolverFns: {} });

  // init trigger engine
  triggerEngine.init({ dbQuery, engineLoader, documentEngine });

  // document engine (no DB)
  documentEngine.init({});

  _inited = true;
  console.log('✅ HOTS Engine Initialized!');
}

module.exports = { initAll, engineLoader, formLoader, workflowEngine, triggerEngine, documentEngine };
