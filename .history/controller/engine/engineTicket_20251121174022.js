/**
 * controller/engine/engineTicket.js
 * HOTS Engine — Enterprise v3 (Full DB Engine Version)
 */

const { dbHots, dbQueryHots } = require("../../config/db");

const { loadModule }    = require("../../core/engine-loader");
const formEngine        = require("../../core/form-engine");
const workflowEngine    = require("../../core/workflow-engine");
const triggerEngine     = require("../../core/trigger-engine");
const documentEngine    = require("../../core/document-engine");

function log(...a){ console.log(...a); }

// ------------------------ EAV V3 Helper ------------------------
async function saveEav(p, ticketId, form_data, revision=null) {
  const rows = [];

  for (const key of Object.keys(form_data || {})) {
    const v = form_data[key];

    const label = v?.label || key;
    const field_id = v?.field_id || null;
    const field_type = v?.type || null;
    const field_meta = v?.field_meta || v?.meta || { label, type: field_type };

    let value;
    if (v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value"))
      value = String(v.value ?? "");
    else if (typeof v === "object")
      value = JSON.stringify(v);
    else
      value = String(v ?? "");

    rows.push([
      ticketId,
      key,
      label,
      value,
      field_id,
      field_type,
      null,
      null,
      revision,
      JSON.stringify(field_meta),
    ]);
  }

  if (rows.length) {
    await p.query(
      `INSERT INTO t_ticket_detail_eav
      (ticket_id, cstm_col, lbl_col, value, field_id, field_type,
       row_index, column_key, revision, field_meta_json)
      VALUES ?`,
      [rows]
    );
  }
}

// ------------------------ Controller ---------------------------
const EngineController = {

  /* ============================================================
     CREATE (New Ticket)
     POST /engine/create/:moduleKey
  ============================================================ */
  async create(req, res) {
    try {
      const moduleKey = req.params.moduleKey;
      const module = await loadModule(moduleKey);
      if (!module) return res.status(404).json({ ok: false, error: "Module not found" });

      const {
        company_id,
        creator_id,
        creator_email,
        form_data,
        title
      } = req.body || {};

      log("🔥 ENGINE → create(ticket)", moduleKey);

      // Validate via formEngine
      const errors = formEngine.validate(module.form_json, form_data || {});
      if (errors.length) {
        return res.status(400).json({ ok: false, errors });
      }

      const ticket_id = `ENG-${Date.now()}`;

      const result = await new Promise((resolve, reject) => {
        dbHots.getConnection(async (err, conn) => {
          if (err) return reject(err);
          const p = conn.promise();

          try {
            await p.beginTransaction();

            // Insert Header
            await p.query(
              `INSERT INTO t_ticket_engine
               (ticket_id,company_id,service_id,service_name,
                creator_id,creator_email,status,workflow_level,title,
                json_snapshot,created_at,updated_at)
               VALUES (?,?,?,?,?,'submitted',0,?, ?, NOW(),NOW())`,
              [
                ticket_id,
                company_id || null,
                module.module_id,
                moduleKey,
                creator_id || null,
                creator_email || null,
                title || module.name,
                JSON.stringify(form_data || {})
              ]
            );

            // Insert EAV fields
            await saveEav(p, ticket_id, form_data, null);

            // Resolve approvers dynamically (DB workflow)
            const approvers = await workflowEngine.resolveApprovers(
              module.workflow_json,
              creator_id,
              form_data
            );

            let firstPending = null;

            // Insert approval events
            for (const step of approvers) {
              for (const uid of step.approver_ids || []) {
                const status =
                  (!firstPending && step.level === 1)
                    ? "pending"
                    : "waiting";

                if (status === "pending") firstPending = uid;

                await p.query(
                  `INSERT INTO t_ticket_event
                   (ticket_id,event_type,approval_order,actor_id,status,created_at)
                   VALUES (?, 'approve', ?, ?, ?, NOW())`,
                  [ticket_id, step.level, uid, status]
                );
              }
            }

            // Insert submit event
            await p.query(
              `INSERT INTO t_ticket_event
                 (ticket_id,event_type,approval_order,actor_id,status,created_at)
               VALUES (?, 'submit', 0, ?, 'completed', NOW())`,
              [ticket_id, creator_id || null]
            );

            // update workflow level
            await p.query(
              `UPDATE t_ticket_engine
               SET workflow_level = ?, updated_at = NOW()
               WHERE ticket_id = ?`,
              [approvers.length ? approvers[0].level : 0, ticket_id]
            );

            await p.commit();
            conn.release();

            // After commit → Run triggers
            await triggerEngine.run(module.triggers_json, {
              ticket_id,
              form_data,
              creator_id,
              moduleKey
            }, { documentEngine });

            resolve({
              ok: true,
              ticket_id,
              next_approver: firstPending,
              workflow_steps: approvers.length
            });

          } catch (e) {
            try { await conn.promise().rollback(); } catch {}
            conn.release();
            reject(e);
          }
        });
      });

      return res.json(result);

    } catch (err) {
      log("❌ create error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  /* ============================================================
     GET STATUS
  ============================================================ */
  async status(req, res) {
    const { ticket_id } = req.params;
    const rows = await dbQueryHots(`SELECT * FROM t_ticket_engine WHERE ticket_id=?`, [ticket_id]);
    if (!rows.length) return res.status(404).json({ ok: false, error: "not found" });

    const events = await dbQueryHots(
      `SELECT * FROM t_ticket_event
       WHERE ticket_id=?
       ORDER BY approval_order ASC, event_id ASC`,
      [ticket_id]
    );

    const revRow = await dbQueryHots(
      `SELECT MAX(revision) rev FROM t_ticket_detail_eav WHERE ticket_id=?`,
      [ticket_id]
    );

    return res.json({
      ok: true,
      ticket: rows[0],
      events,
      revision: revRow?.[0]?.rev ?? null
    });
  },

  /* ============================================================
     APPROVE
  ============================================================ */
  async approve(req, res) {
    const { ticket_id, approver_id, note } = req.body;

    const header = await dbQueryHots(
      `SELECT * FROM t_ticket_engine WHERE ticket_id=?`,
      [ticket_id]
    );

    if (!header.length)
      return res.status(404).json({ ok: false, error: "ticket not found" });

    const module = await loadModule(header[0].service_name);

    // engine workflow approve()
    const result = await workflowEngine.approve({
      ticket_id,
      approver_id,
      note,
      module,
      dbHots
    });

    // triggers
    await triggerEngine.run(module.triggers_json, {
      ticket_id,
      stage: "approve",
      approver_id
    });

    return res.json(result);
  },

  /* ============================================================
     REJECT
  ============================================================ */
  async reject(req, res) {
    const { ticket_id, approver_id, note } = req.body;

    const header = await dbQueryHots(
      `SELECT * FROM t_ticket_engine WHERE ticket_id=?`,
      [ticket_id]
    );

    if (!header.length)
      return res.status(404).json({ ok: false, error: "ticket not found" });

    const module = await loadModule(header[0].service_name);

    const result = await workflowEngine.reject({
      ticket_id,
      approver_id,
      note,
      module,
      dbHots
    });

    await triggerEngine.run(module.triggers_json, {
      ticket_id,
      stage: "reject",
      approver_id
    });

    return res.json(result);
  },

  /* ============================================================
     LIST
  ============================================================ */
  async list(req, res) {
    const { status } = req.query;

    let sql = `
      SELECT t.*, 
      CONCAT(u.firstname, " ", u.lastname) creator_name
      FROM t_ticket_engine t
      LEFT JOIN user u ON u.user_id=t.creator_id
      WHERE 1=1
    `;

    if (status) sql += ` AND t.status=${dbHots.escape(status)} `;
    sql += ` ORDER BY t.created_at DESC`;

    const rows = await dbQueryHots(sql);
    return res.json({ ok: true, rows });
  },

  /* ============================================================
     GET MY APPROVALS
  ============================================================ */
  async myApprovals(req, res) {
    const user_id = req.dataToken.user_id;

    const rows = await dbQueryHots(
      `SELECT t.ticket_id, t.service_name, t.status, e.approval_order,
              t.created_at, t.updated_at
       FROM t_ticket_event e
       INNER JOIN t_ticket_engine t ON t.ticket_id=e.ticket_id
       WHERE e.actor_id=? AND e.status='waiting'
       ORDER BY t.created_at DESC`,
      [user_id]
    );

    return res.json({ ok: true, approvals: rows });
  }

};

module.exports = EngineController;
