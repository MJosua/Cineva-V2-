/**
 * controller/engine/engineTicket.js
 * HOTS Engine — Enterprise v4 (DB-Only, Full lifecycle)
 *
 * Full replacement: create, status, approve, reject, list, myRequests, dashboard,
 * myApprovals, cancel, requestRevision, resubmitPrefill, resubmitDo, revisionList, revisionGet
 *
 * Preserves HOTS v3 behaviors (EAV v3, revisions, parallel approvals, workflow rebuild on resubmit).
 */

const { dbHots, dbQueryHots } = require("../../config/db");

const engineLoader     = require("../../core/engine-loader");
const FormLoader       = require("../../core/form-loader");
const workflowEngine   = require("../../core/workflow-engine");
const triggerEngine    = require("../../core/trigger-engine");
const documentEngine   = require("../../core/document-engine");

const TICKET_STATUSES = {
  SUBMITTED: "submitted",
  IN_APPROVAL: "in_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REVISION_REQUESTED: "revision_requested",
  DRAFT: "draft"
};

const EVENT_STATUSES = {
  PENDING: "pending",
  WAITING: "waiting",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REVISION_REQUESTED: "revision_requested"
};

function log(...args) { console.log(...args); }

/**
 * emitTrigger convenience wrapper to keep compatibility with previous code.
 * Uses triggerEngine.runTriggersForEvent(moduleKey, eventName, context)
 */
async function emitTrigger(eventName, context = {}) {
  try {
    const moduleKey = context.moduleKey || context.module_key || context.module;
    if (!moduleKey) return;
    await triggerEngine.runTriggersForEvent(moduleKey, eventName.replace(/^ticket\./, eventName), context);
  } catch (e) {
    // non-fatal
    console.warn("emitTrigger error:", e.message || e);
  }
}

/**
 * withConnection: run function with conn,p (conn.promise())
 * - fn(conn, p) should return value or throw
 */
async function withConnection(fn) {
  return new Promise((resolve, reject) => {
    dbHots.getConnection(async (err, conn) => {
      if (err) return reject(err);
      const p = conn.promise();
      try {
        await p.beginTransaction();
        const result = await fn(conn, p);
        await p.commit();
        conn.release();
        return resolve(result);
      } catch (e) {
        try { await conn.promise().rollback(); } catch (_) {}
        conn.release();
        return reject(e);
      }
    });
  });
}

/**
 * insertHistory(executor, data)
 * executor: either p (conn.promise()), conn (raw connection) or omitted -> dbQueryHots
 */
async function insertHistory(executor, data) {
  const sql = `
    INSERT INTO t_ticket_history
      (ticket_id, actor_id, action, meta_json, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  const bind = [
    data.ticket_id,
    data.actor_id || null,
    data.action || null,
    JSON.stringify(data.meta || {})
  ];

  // executor is p (conn.promise()) -> has .query
  if (executor && typeof executor.query === "function") {
    return executor.query(sql, bind);
  }

  // executor is raw conn -> has .promise()
  if (executor && typeof executor.promise === "function") {
    return executor.promise().query(sql, bind);
  }

  // fallback
  return dbQueryHots(sql, bind);
}

/**
 * Build EAV rows from form_data (keeps old semantics)
 */
function buildEavRowsFromForm(ticket_id, form_data, revision = null) {
  const rows = [];
  const keys = Object.keys(form_data || {});
  for (const key of keys) {
    const v = form_data[key];
    const label = (v && (v.label || v.lbl || v.name)) || key;

    let value;
    if (v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")) {
      value = String(v.value ?? "");
    } else if (Array.isArray(v)) {
      value = JSON.stringify(v);
    } else if (v && typeof v === "object") {
      value = JSON.stringify(v);
    } else {
      value = String(v ?? "");
    }

    const field_meta = v && (v.field_meta || v.meta || v.field_meta_json) ? (v.field_meta || v.meta || v.field_meta_json) : {
      label,
      type: v && v.type ? v.type : (v && v.rowgroup ? "rowgroup" : null)
    };

    const field_id = v && (v.field_id || v.id) ? (v.field_id || v.id) : null;
    const field_type = (field_meta && field_meta.type) || (v && v.type) || null;
    const row_index = (v && typeof v.row_index !== "undefined") ? v.row_index : null;
    const column_key = (v && v.column_key) ? v.column_key : null;

    rows.push([
      ticket_id,
      key,
      label,
      value,
      field_id,
      field_type,
      row_index,
      column_key,
      revision,
      JSON.stringify(field_meta)
    ]);
  }
  return rows;
}

// ------------------ Controller ------------------
const EngineController = {

  /* CREATE (NEW TICKET)
     POST /engine/ticket/create/:moduleKey
  */
  async create(req, res) {
    try {
      const moduleKey = req.params.moduleKey;
      const module = engineLoader.getServiceConfig(moduleKey);

      if (!module) {
        return res.status(404).json({ ok: false, error: "Module not found" });
      }

      log("🔥 ENGINE → create(ticket)", moduleKey);

      const {
        company_id,
        creator_id,
        creator_email,
        form_data,
        title
      } = req.body || {};

      if (!form_data) return res.status(400).json({ ok: false, error: "form_data required" });

      // Validate if form descriptor exists
      const formDesc = FormLoader.getFormByModuleKey(moduleKey);
      if (formDesc && typeof FormLoader.validate === "function") {
        const errors = FormLoader.validate(formDesc, form_data || {});
        if (errors && errors.length) return res.status(400).json({ ok:false, errors });
      }

      const ticket_id = `ENG-${Date.now()}`;

      const result = await withConnection(async (conn, p) => {
        // 1) header
        await p.query(
          `INSERT INTO t_ticket_engine
           (ticket_id, company_id, service_id, service_name,
            creator_id, creator_email, status, workflow_level,
            created_at, updated_at, title, json_snapshot)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
          [
            ticket_id,
            company_id || null,
            module.service_id || null,
            moduleKey,
            creator_id || null,
            creator_email || null,
            TICKET_STATUSES.SUBMITTED,
            0,
            title || null,
            JSON.stringify(form_data || {})
          ]
        );

        // 2) EAV insert
        const eavRows = buildEavRowsFromForm(ticket_id, form_data || {}, null);
        if (eavRows.length) {
          await p.query(
            `INSERT INTO t_ticket_detail_eav
             (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json)
             VALUES ?`,
            [eavRows]
          );
        }

        // 3) submit event
        await p.query(
          `INSERT INTO t_ticket_event
           (ticket_id, event_type, approval_order, actor_id, status, created_at)
           VALUES (?, 'submit', 0, ?, ?, NOW())`,
          [ticket_id, creator_id || null, EVENT_STATUSES.COMPLETED]
        );

        // 4) resolve workflow and create approvals
        // load workflow from module or fallback to m_workflow handled inside workflowEngine resolve
        const workflowDef = module.workflow_json || {};
        const approvers = await workflowEngine.resolveApprovers(workflowDef, { actor: { user_id: creator_id }, ticket: { ticket_id }, formData: form_data || {} });

        // if no approvers -> auto approve
        if (!approvers || approvers.length === 0) {
          await p.query(`UPDATE t_ticket_engine SET status=?, updated_at=NOW() WHERE ticket_id=?`, [TICKET_STATUSES.APPROVED, ticket_id]);
          await insertHistory(p, { ticket_id, actor_id: creator_id, action: "auto_approved", meta: {} });
          return { ok: true, ticket_id, final: true };
        }

        // insert approve events
        let firstPendingLevel = null;
        let firstPendingApprover = null;
        for (const step of approvers) {
          const isFirst = step.level === 1;
          const ids = Array.isArray(step.approver_ids) ? step.approver_ids : (step.approver_id ? [step.approver_id] : []);
          for (let i = 0; i < ids.length; i++) {
            const uid = ids[i];
            const status = (isFirst && firstPendingLevel === null && i === 0) ? EVENT_STATUSES.PENDING : EVENT_STATUSES.WAITING;
            if (status === EVENT_STATUSES.PENDING && firstPendingLevel === null) {
              firstPendingLevel = step.level;
              firstPendingApprover = uid;
            }
            await p.query(
              `INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`,
              [ticket_id, step.level, uid, status]
            );
          }
        }

        // 5) update header to in_approval
        const headerLevel = firstPendingLevel || 1;
        await p.query(`UPDATE t_ticket_engine SET status=?, workflow_level=?, updated_at=NOW() WHERE ticket_id=?`, [TICKET_STATUSES.IN_APPROVAL, headerLevel, ticket_id]);

        // history
        await insertHistory(p, { ticket_id, actor_id: creator_id, action: "created", meta: { workflow_steps: approvers.length } });

        return { ok: true, ticket_id, next_approver: firstPendingApprover, workflow_steps: approvers.length };
      });

      // After commit: run triggers (on_create)
      await triggerEngine.runTriggersForEvent(moduleKey, "on_create", { ticketId: result.ticket_id, actor: { user_id: creator_id }, formData: form_data, moduleKey });

      return res.json(result);
    } catch (err) {
      log("create error:", err);
      return res.status(500).json({ ok: false, error: err.message || err });
    }
  },

  /* STATUS */
  async status(req, res) {
    try {
      const { ticket_id } = req.params;
      const [headerRows] = await dbHots.promise().query(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
      if (!headerRows.length) return res.status(404).json({ ok: false, error: "not found" });

      const [events] = await dbHots.promise().query(`SELECT * FROM t_ticket_event WHERE ticket_id = ? ORDER BY approval_order ASC, event_id ASC`, [ticket_id]);

      const [revRow] = await dbHots.promise().query(`SELECT MAX(revision) rev FROM t_ticket_detail_eav WHERE ticket_id = ?`, [ticket_id]);
      const revision = revRow?.[0]?.rev ?? null;

      return res.json({ ok: true, ticket: headerRows[0], events, revision });
    } catch (err) {
      log("status error:", err);
      return res.status(500).json({ ok: false, error: err.message || err });
    }
  },

  /* APPROVE - delegates to workflowEngine.approve (which we implemented) */
  async approve(req, res) {
    try {
      const { ticket_id, approver_id, note } = req.body || {};
      if (!ticket_id) return res.status(400).json({ ok:false, error: "ticket_id required" });

      // load header to find module key
      const [headerRows] = await dbHots.promise().query(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
      if (!headerRows.length) return res.status(404).json({ ok:false, error: "ticket not found" });
      const header = headerRows[0];
      const moduleKey = header.service_name;
      const module = engineLoader.getServiceConfig(moduleKey);

      const result = await workflowEngine.approve({ ticket_id, approver_id, note, module, dbHots });

      // run triggers on approve
      await triggerEngine.runTriggersForEvent(moduleKey, "on_approve", { ticketId: ticket_id, actor: { user_id: approver_id } });

      return res.json(result);
    } catch (e) {
      log("approve error:", e);
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* REJECT - delegates to workflowEngine.reject */
  async reject(req, res) {
    try {
      const { ticket_id, approver_id, note } = req.body || {};
      if (!ticket_id) return res.status(400).json({ ok:false, error: "ticket_id required" });

      const [headerRows] = await dbHots.promise().query(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
      if (!headerRows.length) return res.status(404).json({ ok:false, error: "ticket not found" });
      const header = headerRows[0];
      const moduleKey = header.service_name;
      const module = engineLoader.getServiceConfig(moduleKey);

      const result = await workflowEngine.reject({ ticket_id, approver_id, note, module, dbHots });

      await triggerEngine.runTriggersForEvent(moduleKey, "on_reject", { ticketId: ticket_id, actor: { user_id: approver_id } });

      return res.json(result);
    } catch (e) {
      log("reject error:", e);
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* LIST / FILTER (paginated) */
  async list(req, res) {
    try {
      const { status, mine } = req.query;
      const user_id = req.dataToken?.user_id || null;

      let page = parseInt(req.query.page, 10) || 1;
      let limit = parseInt(req.query.limit, 10) || 20;
      const startIndex = (page - 1) * limit;

      let conditions = " WHERE 1=1 ";
      const binds = [];
      if (status) { conditions += ` AND t.status = ? `; binds.push(status); }
      if (mine === "true" && user_id) { conditions += ` AND t.creator_id = ? `; binds.push(user_id); }

      const sql = `
        SELECT t.ticket_id, t.service_id, t.service_name, t.creator_id,
               CONCAT(u.firstname, " ", u.lastname) creator_name,
               t.status, t.workflow_level, t.created_at, t.updated_at
        FROM t_ticket_engine t
        LEFT JOIN user u ON u.user_id = t.creator_id
        ${conditions}
        ORDER BY t.created_at DESC
        LIMIT ?, ?
      `;
      binds.push(startIndex, limit);

      const [rows] = await dbHots.promise().query(sql, binds);
      return res.json({ ok: true, page, limit, rows });
    } catch (err) {
      log("list error:", err);
      return res.status(500).json({ ok:false, error: err.message || err });
    }
  },

  /* myRequests */
  async myRequests(req, res) {
    try {
      const user_id = req.dataToken?.user_id;
      const [rows] = await dbHots.promise().query(
        `SELECT t.ticket_id, t.service_name, t.status, t.workflow_level, t.created_at, t.updated_at
         FROM t_ticket_engine t
         WHERE t.creator_id = ?
         ORDER BY t.created_at DESC`,
        [user_id]
      );
      return res.json({ ok: true, requests: rows });
    } catch (e) {
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* dashboard summary */
  async dashboard(req, res) {
    try {
      const user_id = req.dataToken?.user_id;
      const summary = {};

      // total by status
      const [statusRows] = await dbHots.promise().query(`SELECT status, COUNT(*) AS total FROM t_ticket_engine GROUP BY status`);
      statusRows.forEach(r => summary[r.status] = r.total);

      // my pending approvals
      const [[approvalsRow]] = await dbHots.promise().query(`SELECT COUNT(*) AS total FROM t_ticket_event e WHERE e.actor_id = ? AND e.status = ?`, [user_id, EVENT_STATUSES.WAITING]);
      summary.my_approvals = approvalsRow ? approvalsRow.total : 0;

      // my requests
      const [[reqsRow]] = await dbHots.promise().query(`SELECT COUNT(*) AS total FROM t_ticket_engine WHERE creator_id = ?`, [user_id]);
      summary.my_requests = reqsRow ? reqsRow.total : 0;

      // service stats
      const [serviceRows] = await dbHots.promise().query(`SELECT service_name, COUNT(*) total FROM t_ticket_engine GROUP BY service_name`);
      summary.service_stats = serviceRows;

      return res.json({ ok: true, summary });
    } catch (e) {
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* myApprovals (already existed) */
  async myApprovals(req, res) {
    try {
      const user_id = req.dataToken?.user_id;
      const [rows] = await dbHots.promise().query(
        `SELECT t.ticket_id, t.service_name, t.status, e.approval_order, t.created_at, t.updated_at
         FROM t_ticket_event e
         INNER JOIN t_ticket_engine t ON t.ticket_id = e.ticket_id
         WHERE e.actor_id = ? AND e.status = ?
         ORDER BY t.created_at DESC`,
        [user_id, EVENT_STATUSES.WAITING]
      );
      return res.json({ ok: true, approvals: rows });
    } catch (e) {
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* CANCEL (by creator if still submitted/draft) */
  async cancel(req, res) {
    const { ticket_id, user_id } = req.body || {};
    if (!ticket_id) return res.status(400).json({ ok:false, error: "ticket_id required" });

    try {
      const result = await withConnection(async (conn, p) => {
        const [[header]] = await p.query(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
        if (!header) throw new Error("ticket not found");
        if (header.creator_id != user_id) throw new Error("not authorized to cancel");
        if (![TICKET_STATUSES.SUBMITTED, TICKET_STATUSES.DRAFT].includes(header.status)) throw new Error("Cannot cancel ticket. It has already entered approval.");

        await p.query(`UPDATE t_ticket_engine SET status = ?, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.CANCELLED, ticket_id]);
        await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'cancel', 0, ?, ?, NOW())`, [ticket_id, user_id, EVENT_STATUSES.CANCELLED]);
        await insertHistory(p, { ticket_id, actor_id: user_id, action: "cancelled" });

        return { ok: true };
      });

      // after commit - triggers
      await triggerEngine.runTriggersForEvent(null, "on_cancel", { ticketId: ticket_id }); // moduleKey unknown here; triggers should be handled by module key if needed
      return res.json(result);
    } catch (e) {
      log("cancel error", e);
      return res.status(400).json({ ok:false, error: e.message || e });
    }
  },

  /* REQUEST REVISION (by approver) */
  async requestRevision(req, res) {
    const { ticket_id, approver_id, note } = req.body || {};
    if (!ticket_id) return res.status(400).json({ ok:false, error: "ticket_id required" });

    try {
      const result = await withConnection(async (conn, p) => {
        const [pendingRows] = await p.query(`SELECT * FROM t_ticket_event WHERE ticket_id = ? AND status IN (?,?) ORDER BY approval_order ASC LIMIT 1`, [ticket_id, EVENT_STATUSES.PENDING, EVENT_STATUSES.WAITING]);
        if (!pendingRows.length) throw new Error("no pending approval");
        const pending = pendingRows[0];

        await p.query(`UPDATE t_ticket_event SET status = ?, actor_id = ?, note = ?, created_at = NOW() WHERE event_id = ?`, [EVENT_STATUSES.REVISION_REQUESTED, approver_id || null, note || null, pending.event_id]);
        await p.query(`UPDATE t_ticket_engine SET status = ?, workflow_level = 0, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.REVISION_REQUESTED, ticket_id]);

        await insertHistory(p, { ticket_id, actor_id: approver_id, action: "revision_requested", meta: { note } });
        return { ok: true };
      });

      const [headerRows] = await dbHots.promise().query(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
      const moduleKey = headerRows[0] && headerRows[0].service_name;
      await triggerEngine.runTriggersForEvent(moduleKey, "on_revision_requested", { ticketId: ticket_id });

      return res.json(result);
    } catch (e) {
      log("requestRevision error", e);
      return res.status(400).json({ ok:false, error: e.message || e });
    }
  },

  /* RESUBMIT prefill (GET) */
  async resubmitPrefill(req, res) {
    try {
      const { ticket_id } = req.params;
      if (!ticket_id) return res.status(400).json({ ok:false, error: "ticket_id required" });

      const [headerRows] = await dbHots.promise().query(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
      const header = headerRows[0];
      if (!header) return res.status(404).json({ ok:false, error: "ticket not found" });

      const [eavRows] = await dbHots.promise().query(`SELECT * FROM t_ticket_detail_eav WHERE ticket_id = ? ORDER BY revision ASC, row_index ASC`, [ticket_id]);

      const form_values = {};
      for (const r of eavRows) {
        const fid = r.field_id || r.cstm_col || null;
        const key = fid || r.cstm_col;
        const meta = r.field_meta_json ? JSON.parse(r.field_meta_json) : { label: r.lbl_col };
        if (r.field_type === "rowgroup" || r.row_index !== null) {
          if (!form_values[key]) form_values[key] = [];
          const idx = Number.isInteger(r.row_index) ? r.row_index : 0;
          if (!form_values[key][idx]) form_values[key][idx] = {};
          const col = r.column_key || r.lbl_col || `col_${Object.keys(form_values[key][idx]).length + 1}`;
          form_values[key][idx][col] = r.value;
        } else {
          form_values[key] = { label: meta.label || r.lbl_col || key, value: r.value, field_id: r.field_id, type: r.field_type, field_meta: meta };
        }
      }

      return res.json({ ok: true, ticket: header, form_values });
    } catch (e) {
      log("resubmitPrefill error", e);
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* RESUBMIT DO (POST) — route supports both POST /resubmit and POST /resubmit/:ticket_id */
  async resubmitDo(req, res) {
    try {
      const tid = (req.params && req.params.ticket_id) || (req.body && req.body.ticket_id);
      const { form_data, user_id } = req.body || {};

      if (!tid) return res.status(400).json({ ok:false, error: "ticket_id required" });

      const headerRows = await dbQueryHots(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [tid]);
      const header = headerRows?.[0];
      if (!header) return res.status(404).json({ ok:false, error: "ticket not found" });

      // compute new revision
      const revRows = await dbQueryHots(`SELECT MAX(revision) rev FROM t_ticket_detail_eav WHERE ticket_id = ?`, [tid]);
      const newRevision = (revRows?.[0]?.rev || 0) + 1;

      const eavRows = buildEavRowsFromForm(tid, form_data || {}, newRevision);

      const result = await withConnection(async (conn, p) => {
        if (eavRows.length) {
          await p.query(`INSERT INTO t_ticket_detail_eav (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?`, [eavRows]);
        }

        // update header: back to submitted & reset workflow level
        await p.query(`UPDATE t_ticket_engine SET status = ?, revision = ?, workflow_level = 0, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.SUBMITTED, newRevision, tid]);

        // rebuild workflow and re-insert events
        // workflow definition: prefer module-level JSON
        const moduleKey = header.service_name;
        const module = engineLoader.getServiceConfig(moduleKey);
        const workflowDef = module && module.workflow_json ? module.workflow_json : {};
        const approvers = await workflowEngine.resolveApprovers(workflowDef, { actor: { user_id: header.creator_id }, ticket: { ticket_id: tid }, formData: form_data || {} });

        // clear old events
        await p.query(`DELETE FROM t_ticket_event WHERE ticket_id = ?`, [tid]);
        // insert submit event
        await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'submit', 0, ?, ?, NOW())`, [tid, header.creator_id || null, EVENT_STATUSES.COMPLETED]);

        // insert approvals
        let firstPending = null;
        for (const step of approvers) {
          const isFirst = step.level === 1;
          const ids = Array.isArray(step.approver_ids) ? step.approver_ids : (step.approver_id ? [step.approver_id] : []);
          for (let i = 0; i < ids.length; i++) {
            const uid = ids[i];
            const status = (isFirst && firstPending === null && i === 0) ? EVENT_STATUSES.PENDING : EVENT_STATUSES.WAITING;
            if (status === EVENT_STATUSES.PENDING && firstPending === null) firstPending = uid;
            await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`, [tid, step.level, uid, status]);
          }
        }

        await insertHistory(p, { ticket_id: tid, actor_id: user_id, action: "resubmitted", meta: { newRevision } });
        return { ok: true, ticket_id: tid, newRevision, next_approver: firstPending };
      });

      // after commit: triggers
      await triggerEngine.runTriggersForEvent(header.service_name, "on_resubmit", { ticketId: tid, actor: { user_id }, formData });

      return res.json({ ok: true, ticket_id: tid, newRevision: result.newRevision });
    } catch (e) {
      log("resubmitDo error", e);
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* revisions list */
  async revisionList(req, res) {
    try {
      const { ticket_id } = req.params;
      if (!ticket_id) return res.status(400).json({ ok:false, error: "ticket_id required" });

      const rows = await dbQueryHots(`SELECT DISTINCT revision FROM t_ticket_detail_eav WHERE ticket_id = ? ORDER BY revision ASC`, [ticket_id]);

      return res.json({
        ok: true,
        revisions: rows.map(r => r.revision).filter(r => r !== null),
        latest: rows.length ? rows[rows.length - 1].revision : null
      });
    } catch (e) {
      log("revisionList error", e);
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  },

  /* get single revision */
  async revisionGet(req, res) {
    try {
      const { ticket_id, rev } = req.params;
      if (!ticket_id || typeof rev === "undefined") return res.status(400).json({ ok:false, error: "ticket_id and rev required" });

      const rows = await dbQueryHots(`SELECT * FROM t_ticket_detail_eav WHERE ticket_id = ? AND revision = ? ORDER BY id ASC`, [ticket_id, rev]);

      const form_values = {};
      for (const row of rows) {
        const meta = row.field_meta_json ? JSON.parse(row.field_meta_json) : { label: row.lbl_col };
        if (row.field_type === "rowgroup" || row.row_index !== null) {
          if (!form_values[row.cstm_col]) form_values[row.cstm_col] = [];
          const idx = Number.isInteger(row.row_index) ? row.row_index : 0;
          if (!form_values[row.cstm_col][idx]) form_values[row.cstm_col][idx] = {};
          const col = row.column_key || row.lbl_col || `col_${Object.keys(form_values[row.cstm_col][idx]).length + 1}`;
          form_values[row.cstm_col][idx][col] = row.value;
        } else {
          form_values[row.cstm_col] = {
            label: meta.label || row.lbl_col,
            value: row.value,
            field_id: row.field_id,
            type: row.field_type,
            field_meta: meta,
            row_index: row.row_index,
            column_key: row.column_key
          };
        }
      }

      return res.json({ ok: true, form_values });
    } catch (e) {
      log("revisionGet error", e);
      return res.status(500).json({ ok:false, error: e.message || e });
    }
  }

};

module.exports = EngineController;
