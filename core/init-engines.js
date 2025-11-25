/**
 * core/init-engines.js
 * HOTS v4 (DB-Only) Engine Initializer — CORRECTED CALL SIGNATURES
 *
 * Uses:
 *   - dbQueryFunc (e.g. dbQueryHots) as async function(sql, params)
 *   - dbPool (e.g. dbHots) as mysql2 pool for transactions
 */

const engineLoader   = require("./engine-loader");
const formLoader     = require("./form-loader");
const workflowEngine = require("./workflow-engine");
const triggerEngine  = require("./trigger-engine");
const documentEngine = require("./document-engine");

let initialized = false;

async function initAll(dbQueryFunc, dbPool) {
  if (initialized) {
    console.log("⚠️ HOTS Engine already initialized — skipped.");
    return true;
  }

  if (!dbQueryFunc) throw new Error("initAll requires dbQueryFunc");
  if (!dbPool)      throw new Error("initAll requires dbPool");

  console.log("🔥 Initializing HOTS Engine...");

  try {
    // -------------------------
    // EngineLoader (expects function)
    // -------------------------
    // engineLoader.init(dbQuery)   <-- accept a function
    await engineLoader.init(dbQueryFunc);
    console.log("✔ EngineLoader loaded modules");

    // -------------------------
    // FormLoader (expects function)
    // -------------------------
    await formLoader.init(dbQueryFunc);
    console.log("✔ FormLoader loaded form definitions");

    // -------------------------
    // WorkflowEngine (expects object with dbQuery and dbHots)
    // -------------------------
    workflowEngine.init({
      engineLoader,
      formLoader,
      dbQuery: dbQueryFunc,
      dbHots: dbPool
    });
    console.log("✔ WorkflowEngine initialized");

    // -------------------------
    // TriggerEngine (expects object)
    // -------------------------
    triggerEngine.init({
      dbQuery: dbQueryFunc,
      engineLoader,
      documentEngine
    });
    console.log("✔ TriggerEngine initialized");

    // -------------------------
    // DocumentEngine (init accepts object: at minimum dbQuery and engineLoader)
    // -------------------------
    // some doc engine implementations accept engineLoader too
    documentEngine.init({
      dbQuery: dbQueryFunc,
      engineLoader
    });
    console.log("✔ DocumentEngine initialized");

    initialized = true;
    console.log("✅ HOTS Engine Initialized!");
    return true;
  } catch (e) {
    console.error("❌ Failed to initialize HOTS Engine:", e);
    throw e;
  }
}

module.exports = { initAll };
