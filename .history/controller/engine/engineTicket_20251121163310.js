/**
 * controller/engine/engineTicket.js
 * HOTS Engine — Enterprise v3 (EAV v3)
 */

const { dbHots, dbQueryHots } = require("../../config/db");
const engineWorkflow = require("../../modules/ticket/engine-workflow");

// --------- Configuration / Constants ----------
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
 * buildEavRowsFromForm(ticket_id, form_data, revision = null)
 * Option A: store field_meta_json per row
 *
 * Expectation:
 * - form_data keys are field keys
 * - each value may be object: { label, value, field_id, type, meta }
 * - for rowgroup, caller can pass array or expanded rows; this simple builder
 *   will store what it receives. For complex rowgroup expansion you should
 *   expand upstream before calling this helper.
 */
function buildEavRowsFromForm(ticket_id, form_data, revision = null) {
  const rows = [];
  const keys = Object.keys(form_data || {});
  for (const key of keys) {
    const v = form_data[key];
    // minimal label
    const label = (v && (v.label || v.lbl || v.name)) || key;
    // choose value (keep primitive or stringify complex)
    let value;
    if (v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")) {
      value = String(v.value ?? "");
    } else if (Array.isArray(v)) {
      // rowgroup or array -> stringify the array (we also insert per-row if caller expanded)
      value = JSON.stringify(v);
    } else if (v && typeof v === "object") {
      value = JSON.stringify(v);
    } else {
      value = String(v ?? "");
    }

    // field-level meta: prefer v.field_meta or v.meta or construct minimal
    const field_meta = v && (v.field_meta || v.meta || v.field_meta_json) ? (v.field_meta || v.meta || v.field_meta_json) : {
      label,
      type: v && v.type ? v.type : (v && v.rowgroup ? "rowgroup" : null)
    };

    const field_id = v && (v.field_id || v.id) ? (v.field_id || v.id) : null;
    const field_type = (field_meta && field_meta.type) || (v && v.type) || null;

    // row_index and column_key left null unless caller provides them inside v
    const row_index = (v && typeof v.row_index !== "undefined") ? v.row_index : null;
    const column_key = (v && v.column_key) ? v.column_key : null;

    rows.push([
      ticket_id,       // ticket_id
      key,             // cstm_col
      label,           // lbl_col
      value,           // value
      field_id,        // field_id
      field_type,      // field_type
      row_index,       // row_index
      column_key,      // column_key
      revision,        // revision
      JSON.stringify(field_meta) // field_meta_json
    ]);
  }
  return rows;
}

// ------------------ Controller ------------------
const EngineController = {

  /* ============================================================
     CREATE (NEW TICKET)
     POST /engine/create
  ============================================================ */
  async create(req, res) {
    try {
      const {
        company_id,
        service_id,
        service_name,
        form_data,
        creator_id,
        creator_email,
        title
      } = req.body || {};

      log("\n🔥 ENGINE_DEBUG → Incoming create() request");
      log("  service_id:", service_id, "creator_id:", creator_id);

      if (!service_id || !form_data) {
        return res.status(400).json({ ok: false, error: "service_id and form_data required" });
      }

      const ticket_id = `ENG-${Date.now()}`;
      const serviceNameFinal = service_name || String(service_id);

      const result = await withConnection(async (conn, p) => {
        // 1) insert header
        await p.query(
          `INSERT INTO t_ticket_engine
           (ticket_id, company_id, service_id, service_name,
            creator_id, creator_email, status, workflow_level,
            created_at, updated_at, title, json_snapshot)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
          [
            ticket_id,
            company_id || null,
            service_id,
            serviceNameFinal,
            creator_id || null,
            creator_email || null,
            TICKET_STATUSES.SUBMITTED,
            0,
            title || null,
            JSON.stringify(form_data || {})
          ]
        );

        // 2) EAV insert (v3) - revision null for initial submit
        const eavRows = buildEavRowsFromForm(ticket_id, form_data, null);
        if (eavRows.length) {
          // columns: ticket_id,cstm_col,lbl_col,value,field_id,field_type,row_index,column_key,revision,field_meta_json
          await p.query(
            `INSERT INTO t_ticket_detail_eav
             (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json)
             VALUES ?`,
            [eavRows]
          );
        }

        // 3) insert submit event
        await p.query(
          `INSERT INTO t_ticket_event
           (ticket_id, event_type, approval_order, actor_id, status, created_at)
           VALUES (?, 'submit', 0, ?, ?, NOW())`,
          [ticket_id, creator_id || null, EVENT_STATUSES.COMPLETED]
        );

        // 4) load workflow and create approval events
        const workflowDef = await engineWorkflow.loadWorkflow(service_id);
        if (!workflowDef || !workflowDef.levels || workflowDef.levels.length === 0) {
          // auto approve
          await p.query(`UPDATE t_ticket_engine SET status=?, updated_at=NOW() WHERE ticket_id=?`, [TICKET_STATUSES.APPROVED, ticket_id]);
          await insertHistory(p, { ticket_id, action: "auto_approved", actor_id: creator_id, meta: { service_id } });
          return { ok: true, ticket_id, final: true };
        }

        const approvers = await engineWorkflow.resolveApprovers(workflowDef.levels, creator_id, form_data || {});

        // insert approve events (parallel-capable)
        let firstPendingLevel = null;
        let firstPendingApprover = null;
        const inserts = [];
        for (const step of approvers) {
          const isFirstLevel = step.level === 1;
          if (Array.isArray(step.approver_ids) && step.approver_ids.length) {
            for (let i = 0; i < step.approver_ids.length; i++) {
              const uid = step.approver_ids[i];
              const status = (isFirstLevel && firstPendingLevel === null && i === 0) ? EVENT_STATUSES.PENDING : EVENT_STATUSES.WAITING;
              if (status === EVENT_STATUSES.PENDING && firstPendingLevel === null) {
                firstPendingLevel = step.level;
                firstPendingApprover = uid;
              }
              inserts.push(p.query(
                `INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`,
                [ticket_id, step.level, uid, status]
              ));
            }
          } else {
            const uid = step.approver_id || null;
            const status = isFirstLevel && firstPendingLevel === null ? EVENT_STATUSES.PENDING : EVENT_STATUSES.WAITING;
            if (status === EVENT_STATUSES.PENDING && firstPendingLevel === null) {
              firstPendingLevel = step.level;
              firstPendingApprover = uid;
            }
            inserts.push(p.query(
              `INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`,
              [ticket_id, step.level, uid, status]
            ));
          }
        }
        if (inserts.length) await Promise.all(inserts);

        // 5) update header
        const headerLevel = firstPendingLevel || 1;
        await p.query(`UPDATE t_ticket_engine SET status=?, workflow_level=?, updated_at=NOW() WHERE ticket_id=?`,
          [TICKET_STATUSES.IN_APPROVAL, headerLevel, ticket_id]
        );

        // 6) history
        await insertHistory(p, { ticket_id, actor_id: creator_id, action: "created", meta: { service_id, workflow_steps: approvers.length } });

        return { ok: true, ticket_id, next_approver: firstPendingApprover, workflow_steps: approvers.length };
      });

      // trigger after commit
      emitTrigger("ticket.created", { ticket_id: result.ticket_id });

      return res.json(result);
    } catch (err) {
      log("❌ ENGINE_DEBUG create error:", err);
      return res.status(500).json({ ok: false, error: (err && err.message) || err });
    }
  },

  /* ============================================================
     STATUS
     GET /engine/status/:ticket_id
  ============================================================ */
  async status(req, res) {
    try {
      const { ticket_id } = req.params;
      const rows = await dbQueryHots(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
      if (!rows.length) return res.status(404).json({ ok: false, error: "not found" });

      const events = await dbQueryHots(`SELECT * FROM t_ticket_event WHERE ticket_id = ? ORDER BY approval_order ASC, event_id ASC`, [ticket_id]);

      // latest revision
      const revRow = await dbQueryHots(`SELECT MAX(revision) rev FROM t_ticket_detail_eav WHERE ticket_id = ?`, [ticket_id]);
      const revision = revRow?.[0]?.rev ?? null;

      return res.json({ ok: true, ticket: rows[0], events, revision });
    } catch (err) {
      log("status error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  /* ============================================================
     APPROVE — parallel-aware
  ============================================================ */
  approve(req, res) {
    const { ticket_id, approver_id, note } = req.body || {};
    if (!ticket_id) return res.status(400).json({ ok: false, error: "ticket_id required" });

    dbHots.getConnection(async (err, conn) => {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      const p = conn.promise();

      try {
        await p.beginTransaction();

        const [pendingRows] = await p.query(
          `SELECT * FROM t_ticket_event WHERE ticket_id = ? AND status IN (?,?) ORDER BY approval_order ASC, event_id ASC LIMIT 1`,
          [ticket_id, EVENT_STATUSES.PENDING, EVENT_STATUSES.WAITING]
        );
        if (!pendingRows.length) throw new Error("no pending approval");
        const current = pendingRows[0];
        const level = current.approval_order;

        // Approve all in same level
        await p.query(`UPDATE t_ticket_event SET status = ?, note = NULL, created_at = NULL WHERE ticket_id = ? AND approval_order = ?`, [EVENT_STATUSES.APPROVED, ticket_id, level]);

        // Update actual actor row
        await p.query(`UPDATE t_ticket_event SET status = ?, actor_id = ?, note = ?, created_at = NOW() WHERE event_id = ?`, [EVENT_STATUSES.APPROVED, approver_id || null, note || null, current.event_id]);

        // history
        await insertHistory(p, { ticket_id, actor_id: approver_id, action: "approved", meta: { level } });

        // check next
        const [nextRows] = await p.query(`SELECT * FROM t_ticket_event WHERE ticket_id = ? AND approval_order = ? ORDER BY event_id ASC LIMIT 1`, [ticket_id, level + 1]);

        if (nextRows.length) {
          // set first of next level to waiting
          await p.query(`UPDATE t_ticket_event SET status = ? WHERE event_id = ?`, [EVENT_STATUSES.WAITING, nextRows[0].event_id]);
          await p.query(`UPDATE t_ticket_engine SET workflow_level = ?, updated_at = NOW() WHERE ticket_id = ?`, [nextRows[0].approval_order, ticket_id]);

          await p.commit();
          conn.release();

          emitTrigger("ticket.approved.level", { ticket_id, level, next_approver: nextRows[0].actor_id });
          return res.json({ ok: true, next_approver: nextRows[0].actor_id });
        }

        // finalize
        await p.query(`UPDATE t_ticket_engine SET status = ?, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.APPROVED, ticket_id]);
        await p.commit();
        conn.release();

        emitTrigger("ticket.approved.final", { ticket_id });
        return res.json({ ok: true, final: true });

      } catch (e) {
        try { await conn.promise().rollback(); } catch (_) {}
        conn.release();
        log("approve error:", e);
        return res.status(400).json({ ok: false, error: (e && e.message) || e });
      }
    });
  },

  /* ============================================================
     REJECT — parallel-aware
  ============================================================ */
  reject(req, res) {
    const { ticket_id, approver_id, note } = req.body || {};
    if (!ticket_id) return res.status(400).json({ ok: false, error: "ticket_id required" });

    dbHots.getConnection(async (err, conn) => {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      const p = conn.promise();
      try {
        await p.beginTransaction();

        const [pendingRows] = await p.query(
          `SELECT * FROM t_ticket_event WHERE ticket_id = ? AND status IN (?,?) ORDER BY approval_order ASC, event_id ASC LIMIT 1`,
          [ticket_id, EVENT_STATUSES.PENDING, EVENT_STATUSES.WAITING]
        );
        if (!pendingRows.length) throw new Error("no pending approval");
        const current = pendingRows[0];
        const level = current.approval_order;

        // Reject all at same level
        await p.query(`UPDATE t_ticket_event SET status = ?, note = NULL, created_at = NULL WHERE ticket_id = ? AND approval_order = ?`, [EVENT_STATUSES.REJECTED, ticket_id, level]);

        // update actual row with actor/note
        await p.query(`UPDATE t_ticket_event SET status = ?, actor_id = ?, note = ?, created_at = NOW() WHERE event_id = ?`, [EVENT_STATUSES.REJECTED, approver_id || null, note || null, current.event_id]);

        // mark ticket rejected
        await p.query(`UPDATE t_ticket_engine SET status = ?, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.REJECTED, ticket_id]);

        await insertHistory(p, { ticket_id, actor_id: approver_id, action: "rejected", meta: { level } });

        await p.commit();
        conn.release();

        emitTrigger("ticket.rejected", { ticket_id, level });
        return res.json({ ok: true });
      } catch (e) {
        try { await conn.promise().rollback(); } catch (_) {}
        conn.release();
        log("reject error", e);
        return res.status(400).json({ ok: false, error: (e && e.message) || e });
      }
    });
  },

  /* ============================================================
     LIST / FILTER
  ============================================================ */
  list(req, res) {
    try {
      const { status, mine } = req.query;
      const user_id = req.dataToken?.user_id || null;

      let page = parseInt(req.query.page, 10) || 1;
      let limit = parseInt(req.query.limit, 10) || 20;
      const startIndex = (page - 1) * limit;

      let conditions = "WHERE 1=1 ";
      if (status) conditions += ` AND t.status = ${dbHots.escape(status)} `;
      if (mine === "true" && user_id) conditions += ` AND t.creator_id = ${dbHots.escape(user_id)} `;

      const sql = `
        SELECT t.ticket_id, t.service_id, t.service_name, t.creator_id,
               CONCAT(u.firstname, " ", u.lastname) creator_name,
               t.status, t.workflow_level, t.created_at, t.updated_at
        FROM t_ticket_engine t
        LEFT JOIN user u ON u.user_id = t.creator_id
        ${conditions}
        ORDER BY t.created_at DESC
        LIMIT ${startIndex}, ${limit}
      `;

      dbHots.query(sql, (err, rows) => {
        if (err) {
          log("list error:", err);
          return res.status(500).json({ ok: false, error: err.message });
        }
        return res.json({ ok: true, page, limit, rows });
      });
    } catch (err) {
      log("list error outer:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  myRequests(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const sql = `
        SELECT t.ticket_id, t.service_name, t.status, t.workflow_level, t.created_at, t.updated_at
        FROM t_ticket_engine t
        WHERE t.creator_id = ?
        ORDER BY t.created_at DESC
      `;
      dbHots.query(sql, [user_id], (err, rows) => {
        if (err) return res.status(500).json({ ok: false, error: err.message });
        return res.json({ ok: true, requests: rows });
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  dashboard(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const summary = {};

      dbHots.query(`SELECT status, COUNT(*) AS total FROM t_ticket_engine GROUP BY status`, (err, rows) => {
        if (err) return res.status(500).json({ ok: false, error: err.message });
        rows.forEach(r => summary[r.status] = r.total);

        dbHots.query(`SELECT COUNT(*) AS total FROM t_ticket_event e WHERE e.actor_id = ? AND e.status = ?`, [user_id, EVENT_STATUSES.WAITING], (err2, approvals) => {
          if (err2) return res.status(500).json({ ok: false, error: err2.message });
          summary.my_approvals = approvals[0].total;

          dbHots.query(`SELECT COUNT(*) AS total FROM t_ticket_engine WHERE creator_id = ?`, [user_id], (err3, reqs) => {
            if (err3) return res.status(500).json({ ok: false, error: err3.message });
            summary.my_requests = reqs[0].total;

            dbHots.query(`SELECT service_name, COUNT(*) total FROM t_ticket_engine GROUP BY service_name`, (err4, serviceRows) => {
              if (err4) return res.status(500).json({ ok: false, error: err4.message });
              summary.service_stats = serviceRows;
              return res.json({ ok: true, summary });
            });
          });
        });
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  myApprovals(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const sql = `
        SELECT t.ticket_id, t.service_name, t.status, e.approval_order, t.created_at, t.updated_at
        FROM t_ticket_event e
        INNER JOIN t_ticket_engine t ON t.ticket_id = e.ticket_id
        WHERE e.actor_id = ? AND e.status = ?
        ORDER BY t.created_at DESC
      `;
      dbHots.query(sql, [user_id, EVENT_STATUSES.WAITING], (err, rows) => {
        if (err) return res.status(500).json({ ok: false, error: err.message });
        return res.json({ ok: true, approvals: rows });
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  /* ============================================================
     CANCEL (by creator if still submitted/draft)
  ============================================================ */
  cancel(req, res) {
    const { ticket_id, user_id } = req.body || {};
    if (!ticket_id) return res.status(400).json({ ok: false, error: "ticket_id required" });

    dbHots.getConnection((err, conn) => {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      const p = conn.promise();

      p.beginTransaction()
        .then(async () => {
          const [rows] = await p.query(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
          if (!rows.length) throw new Error("ticket not found");
          const header = rows[0];
          if (header.creator_id != user_id) throw new Error("not authorized to cancel");
          if (![TICKET_STATUSES.SUBMITTED, TICKET_STATUSES.DRAFT].includes(header.status)) throw new Error("Cannot cancel ticket. It has already entered approval.");

          await p.query(`UPDATE t_ticket_engine SET status = ?, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.CANCELLED, ticket_id]);
          await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'cancel', 0, ?, ?, NOW())`, [ticket_id, user_id, EVENT_STATUSES.CANCELLED]);
          await insertHistory(p, { ticket_id, actor_id: user_id, action: "cancelled" });

          await p.commit();
          conn.release();
          emitTrigger("ticket.cancelled", { ticket_id });
          return res.json({ ok: true });
        })
        .catch(e => {
          p.rollback().catch(()=>{});
          conn.release();
          log("cancel error", e);
          return res.status(400).json({ ok: false, error: (e && e.message) || e });
        });
    });
  },

  /* ============================================================
     RETURN / REQUEST REVISION (by approver)
  ============================================================ */
  requestRevision(req, res) {
    const { ticket_id, approver_id, note } = req.body || {};
    if (!ticket_id) return res.status(400).json({ ok: false, error: "ticket_id required" });

    dbHots.getConnection((err, conn) => {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      const p = conn.promise();

      p.beginTransaction()
        .then(async () => {
          const [rows] = await p.query(`SELECT * FROM t_ticket_event WHERE ticket_id = ? AND status IN (?,?) ORDER BY approval_order ASC LIMIT 1`, [ticket_id, EVENT_STATUSES.PENDING, EVENT_STATUSES.WAITING]);
          if (!rows.length) throw new Error("no pending approval");
          const pending = rows[0];

          await p.query(`UPDATE t_ticket_event SET status = ?, actor_id = ?, note = ?, created_at = NOW() WHERE event_id = ?`, [EVENT_STATUSES.REVISION_REQUESTED, approver_id || null, note || null, pending.event_id]);
          await p.query(`UPDATE t_ticket_engine SET status = ?, workflow_level = 0, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.REVISION_REQUESTED, ticket_id]);

          await insertHistory(p, { ticket_id, actor_id: approver_id, action: "revision_requested", meta: { note } });

          await p.commit();
          conn.release();
          emitTrigger("ticket.revision_requested", { ticket_id });
          return res.json({ ok: true });
        })
        .catch(e => {
          p.rollback().catch(()=>{});
          conn.release();
          log("return error", e);
          return res.status(400).json({ ok: false, error: (e && e.message) || e });
        });
    });
  },

  /* ============================================================
     RESUBMIT (do) — append revision & rebuild workflow
     POST /engine/resubmit (body: ticket_id, form_data, user_id)
  ============================================================ */
  async resubmitDo(req, res) {
    try {
      const { ticket_id } = req.params || req.body || {};
      // allow both route param and body
      const tid = (req.params && req.params.ticket_id) || (req.body && req.body.ticket_id) || ticket_id;
      const { form_data, user_id } = req.body || {};

      if (!tid) return res.status(400).json({ ok: false, error: "ticket_id required" });

      const header = (await dbQueryHots(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [tid]))?.[0];
      if (!header) return res.status(404).json({ ok: false, error: "ticket not found" });

      // compute new revision
      const revRows = await dbQueryHots(`SELECT MAX(revision) rev FROM t_ticket_detail_eav WHERE ticket_id = ?`, [tid]);
      const newRevision = (revRows?.[0]?.rev || 0) + 1;

      // build eav rows for new revision
      const eavRows = [];
      for (const key of Object.keys(form_data || {})) {
        const v = form_data[key];
        const label = v?.label || key;
        const value = (v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")) ? String(v.value ?? "") : (typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));
        const field_id = v?.field_id || null;
        const field_type = v?.type || null;
        const field_meta = v?.field_meta || v?.meta || { label, type: field_type };
        eavRows.push([tid, key, label, value, field_id, field_type, null, null, newRevision, JSON.stringify(field_meta)]);
      }

      await withConnection(async (conn, p) => {
        if (eavRows.length) {
          await p.query(`INSERT INTO t_ticket_detail_eav (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?`, [eavRows]);
        }

        // update header
        await p.query(`UPDATE t_ticket_engine SET status = ?, revision = ?, workflow_level = 0, updated_at = NOW() WHERE ticket_id = ?`, [TICKET_STATUSES.SUBMITTED, newRevision, tid]);

        // rebuild workflow
        const workflowDef = await engineWorkflow.loadWorkflow(header.service_id);
        const approvers = await engineWorkflow.resolveApprovers(workflowDef.levels, header.creator_id, form_data || {});

        // clear old events, re-insert submit + approvals
        await p.query(`DELETE FROM t_ticket_event WHERE ticket_id = ?`, [tid]);
        await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'submit', 0, ?, ?, NOW())`, [tid, header.creator_id || null, EVENT_STATUSES.COMPLETED]);

        let firstPending = null;
        for (const step of approvers) {
          const isFirst = step.level === 1;
          if (Array.isArray(step.approver_ids)) {
            for (let i = 0; i < step.approver_ids.length; i++) {
              const uid = step.approver_ids[i];
              const status = (isFirst && firstPending === null && i === 0) ? EVENT_STATUSES.PENDING : EVENT_STATUSES.WAITING;
              if (status === EVENT_STATUSES.PENDING && firstPending === null) firstPending = uid;
              await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`, [tid, step.level, uid, status]);
            }
          } else {
            const uid = step.approver_id || null;
            const status = isFirst && firstPending === null ? EVENT_STATUSES.PENDING : EVENT_STATUSES.WAITING;
            if (status === EVENT_STATUSES.PENDING && firstPending === null) firstPending = uid;
            await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`, [tid, step.level, uid, status]);
          }
        }

        await insertHistory(p, { ticket_id: tid, actor_id: user_id, action: "resubmitted", meta: { newRevision } });

        return { ok: true, ticket_id: tid, newRevision, next_approver: firstPending };
      });

      emitTrigger("ticket.resubmitted", { ticket_id: tid });
      return res.json({ ok: true, ticket_id: tid, newRevision });

    } catch (err) {
      log("resubmitDo error", err);
      return res.status(500).json({ ok: false, error: err.message || err });
    }
  },

  /* ============================================================
     Prefill for resubmit (GET)
     GET /engine/resubmit/:ticket_id
  ============================================================ */
  async resubmitPrefill(req, res) {
    try {
      const { ticket_id } = req.params;
      if (!ticket_id) return res.status(400).json({ ok: false, error: "ticket_id required" });

      const headerRows = await dbQueryHots(`SELECT * FROM t_ticket_engine WHERE ticket_id = ?`, [ticket_id]);
      const header = headerRows?.[0];
      if (!header) return res.status(404).json({ ok: false, error: "ticket not found" });

      const eavRows = await dbQueryHots(`SELECT * FROM t_ticket_detail_eav WHERE ticket_id = ? ORDER BY revision ASC, row_index ASC`, [ticket_id]);

      const form_values = {};
      for (const r of eavRows) {
        // key prefers field_id, fallback to cstm_col
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
    } catch (err) {
      log("resubmitPrefill error", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  /* ============================================================
     Revisions list and single revision retrieval
  ============================================================ */
  async revisionList(req, res) {
    try {
      const { ticket_id } = req.params;
      const rows = await dbQueryHots(`
        SELECT DISTINCT revision FROM t_ticket_detail_eav
        WHERE ticket_id = ?
        ORDER BY revision ASC
      `, [ticket_id]);

      return res.json({
        ok: true,
        revisions: rows.map(r => r.revision).filter(r => r !== null),
        latest: rows.length ? rows[rows.length - 1].revision : null
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async revisionGet(req, res) {
    try {
      const { ticket_id, rev } = req.params;
      const eav = await dbQueryHots(`
        SELECT * FROM t_ticket_detail_eav
        WHERE ticket_id = ? AND revision = ?
        ORDER BY id ASC
      `, [ticket_id, rev]);

      const form_values = {};
      for (const row of eav) {
        const meta = row.field_meta_json ? JSON.parse(row.field_meta_json) : { label: row.lbl_col };
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

      return res.json({ ok: true, form_values });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

};

module.exports = EngineController;
