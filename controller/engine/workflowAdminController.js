// controller/engine/workflowAdminController.js
const { dbQueryHots } = require("../../config/db");

/* ---------------------------------------------------------
   DEBUG MODE
--------------------------------------------------------- */
const DEBUG = true;

function logDebug(label, data) {
  if (!DEBUG) return;
  console.log(
    `%c[WORKFLOW-ADMIN] ${label}`,
    "color:#00bcd4;font-weight:bold",
    data
  );
}

function logError(label, err) {
  console.error(
    `%c[WORKFLOW-ADMIN ERROR] ${label}`,
    "color:#e91e63;font-weight:bold",
    err.message || err
  );
}

/* ---------------------------------------------------------
   CONTROLLER
--------------------------------------------------------- */
module.exports = {

  /* ========================================================
     LIST WORKFLOW LEVELS
  ======================================================== */
  async list(req, res) {
    const start = Date.now();
    const { service_id } = req.params;

    try {
      logDebug("LIST → Params", { service_id });

      const rows = await dbQueryHots(
        `SELECT * FROM m_service_workflow
         WHERE workflow_id = ?
         ORDER BY level ASC`,
        [service_id]
      );

      logDebug("LIST → Result", rows);
      logDebug("LIST → Time", `${Date.now() - start}ms`);

      return res.json({ levels: rows });

    } catch (err) {
      logError("LIST", err);
      return res.status(500).json({ error: "Failed to load workflow" });
    }
  },

  /* ========================================================
     CREATE WORKFLOW STEP
  ======================================================== */
  async create(req, res) {
    const start = Date.now();
    const { service_id, level, resolver, approver_user } = req.body;

    try {
      logDebug("CREATE → Body", req.body);

      const result = await dbQueryHots(
        `INSERT INTO m_service_workflow
         (workflow_id, level, resolver, approver_user, is_active, created_at)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [service_id, level, resolver, approver_user || null]
      );

      logDebug("CREATE → InsertId", result.insertId);
      logDebug("CREATE → Time", `${Date.now() - start}ms`);

      return res.json({ id: result.insertId });

    } catch (err) {
      logError("CREATE", err);
      return res.status(500).json({ error: "Failed to create workflow" });
    }
  },

  /* ========================================================
     UPDATE WORKFLOW STEP
  ======================================================== */
  async update(req, res) {
    const start = Date.now();
    const { workflow_id } = req.params;
    const { level, resolver, approver_user, is_active } = req.body;

    try {
      logDebug("UPDATE → Params", { workflow_id });
      logDebug("UPDATE → Body", req.body);

      await dbQueryHots(
        `UPDATE m_service_workflow
         SET level = ?, resolver = ?, approver_user = ?, is_active = ?
         WHERE workflow_id = ?`,
        [level, resolver, approver_user || null, is_active, workflow_id]
      );

      logDebug("UPDATE → Success", true);
      logDebug("UPDATE → Time", `${Date.now() - start}ms`);

      return res.json({ ok: true });

    } catch (err) {
      logError("UPDATE", err);
      return res.status(500).json({ error: "Failed to update workflow" });
    }
  },

  /* ========================================================
     DELETE WORKFLOW STEP
  ======================================================== */
  async remove(req, res) {
    const start = Date.now();
    const { workflow_id } = req.params;

    try {
      logDebug("DELETE → workflow_id", workflow_id);

      await dbQueryHots(
        `DELETE FROM m_service_workflow WHERE workflow_id = ?`,
        [workflow_id]
      );

      logDebug("DELETE → Success", true);
      logDebug("DELETE → Time", `${Date.now() - start}ms`);

      return res.json({ ok: true });

    } catch (err) {
      logError("DELETE", err);
      return res.status(500).json({ error: "Failed to delete workflow" });
    }
  },

  /* ========================================================
     GET PARAMETERS FOR WORKFLOW STEP
  ======================================================== */
  async getParams(req, res) {
    const start = Date.now();
    const { workflow_id } = req.params;

    try {
      logDebug("GET PARAMS → workflow_id", workflow_id);

      const params = await dbQueryHots(
        `SELECT * FROM m_service_workflow_resolver_params
         WHERE workflow_id = ?`,
        [workflow_id]
      );

      logDebug("GET PARAMS → Result", params);
      logDebug("GET PARAMS → Time", `${Date.now() - start}ms`);

      return res.json({ params });

    } catch (err) {
      logError("GET PARAMS", err);
      return res.status(500).json({ error: "Failed to get workflow params" });
    }
  },

  /* ========================================================
     ADD PARAMETER TO WORKFLOW STEP
  ======================================================== */
  async addParam(req, res) {
    const start = Date.now();
    const { workflow_id } = req.params;
    const { param_key, param_value } = req.body;

    try {
      logDebug("ADD PARAM → Params", { workflow_id });
      logDebug("ADD PARAM → Body", req.body);

      const result = await dbQueryHots(
        `INSERT INTO m_service_workflow_resolver_params
         (workflow_id, param_key, param_value)
         VALUES (?, ?, ?)`,
        [workflow_id, param_key, param_value]
      );

      logDebug("ADD PARAM → InsertId", result.insertId);
      logDebug("ADD PARAM → Time", `${Date.now() - start}ms`);

      return res.json({ id: result.insertId });

    } catch (err) {
      logError("ADD PARAM", err);
      return res.status(500).json({ error: "Failed to add workflow param" });
    }
  }

};
