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
         WHERE workflow_id = ?`,
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
  },

  /* ========================================================
     GET WORKFLOW DEFINITION (JSON)
  ======================================================== */
  async getDefinition(req, res) {
    const start = Date.now();
    const { service_id } = req.params;

    try {
      logDebug("GET DEFINITION → service_id", service_id);

      // Fetch ALL rows for this service/workflow
      const rows = await dbQueryHots(
        `SELECT workflow_id, name, definition, level, resolver, approver_user, is_active, created_at, updated_at
         FROM m_service_workflow
         WHERE workflow_id = ?`,
        [service_id]
      );

      if (rows.length === 0) {
        logDebug("GET DEFINITION → No workflow found for service_id", service_id);
        return res.json({ ok: true, workflow_id: null, definition: { steps: [], tasks: [] } });
      }

      // 1. Try to find if any row has a JSON definition
      const mainRow = rows.find(r => r.definition && r.definition.length > 5);
      let definition = null;
      let workflowName = rows[0].name || `Workflow ${service_id}`;

      if (mainRow) {
        definition = mainRow.definition;
        workflowName = mainRow.name || workflowName;
        if (typeof definition === 'string') {
          try { definition = JSON.parse(definition); } catch (e) { /* keep as string */ }
        }
      }

      // 2. If no definition or it's empty, build from legacy rows
      if (!definition || !definition.steps || definition.steps.length === 0) {
        const legacyRows = rows.filter(r => r.level);
        if (legacyRows.length > 0) {
          logDebug("GET DEFINITION → Bridging legacy data for service_id", service_id);

          const bridgedSteps = legacyRows.map(row => {
            let step_type = 'team';
            let assigned_value = row.resolver;

            if (row.approver_user) {
              step_type = 'specific_user';
              assigned_value = row.approver_user;
            } else if (['superior', 'finalsuperior', 'direct_superior', 'superior_final'].includes(row.resolver)) {
              step_type = 'superior';
            } else if (!isNaN(Number(row.resolver)) && row.resolver !== '') {
              step_type = 'team';
              assigned_value = Number(row.resolver);
            }

            return {
              level: row.level,
              step_type,
              assigned_value,
              resolver: row.resolver,
              description: row.approver_user
                ? `Specific User Approval (${row.approver_user})`
                : `Level ${row.level} Approval (${row.resolver})`,
              approver: assigned_value
            };
          }).sort((a, b) => a.level - b.level);

          definition = {
            steps: bridgedSteps,
            tasks: []
          };
        }
      }

      // 3. Fallback to empty if still nothing
      if (!definition) {
        definition = { steps: [], tasks: [] };
      }

      logDebug("GET DEFINITION → Final Result", { workflow_id: service_id, definition });
      logDebug("GET DEFINITION → Time", `${Date.now() - start}ms`);

      return res.json({
        ok: true,
        workflow_id: service_id,
        name: workflowName,
        definition,
        is_active: rows[0].is_active
      });

    } catch (err) {
      logError("GET DEFINITION", err);
      return res.status(500).json({ error: "Failed to get workflow definition" });
    }
  },

  /* ========================================================
     SAVE WORKFLOW DEFINITION (JSON)
  ======================================================== */
  async saveDefinition(req, res) {
    const start = Date.now();
    const { service_id } = req.params;
    const { definition, name } = req.body;

    try {
      logDebug("SAVE DEFINITION → service_id", service_id);
      logDebug("SAVE DEFINITION → Body", req.body);

      const definitionJson = typeof definition === 'string'
        ? definition
        : JSON.stringify(definition);

      // Check if workflow exists
      const existing = await dbQueryHots(
        `SELECT workflow_id FROM m_service_workflow WHERE workflow_id = ?`,
        [service_id]
      );

      if (existing.length > 0) {
        // Update existing
        await dbQueryHots(
          `UPDATE m_service_workflow
           SET definition = ?, name = COALESCE(?, name), updated_at = NOW()
           WHERE workflow_id = ?`,
          [definitionJson, name || null, service_id]
        );
        logDebug("SAVE DEFINITION → Updated", { workflow_id: service_id });
      } else {
        // Insert new
        await dbQueryHots(
          `INSERT INTO m_service_workflow (workflow_id, name, definition, is_active, created_at)
           VALUES (?, ?, ?, 1, NOW())`,
          [service_id, name || `Workflow ${service_id}`, definitionJson]
        );
        logDebug("SAVE DEFINITION → Inserted", { workflow_id: service_id });
      }

      logDebug("SAVE DEFINITION → Time", `${Date.now() - start}ms`);

      return res.json({ ok: true, workflow_id: service_id });

    } catch (err) {
      logError("SAVE DEFINITION", err);
      return res.status(500).json({ error: "Failed to save workflow definition" });
    }
  }

};
