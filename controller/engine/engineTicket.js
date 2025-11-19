// controller/engine/engineTicket.js
const { dbHots, dbQueryHots } = require("../../config/db");
const engineWorkflow = require("../../modules/engine-service/core/engine-workflow");

function finishWorkflowInsert() {
  conn.query(
    `UPDATE t_ticket_engine
        SET status='in_approval', workflow_level=1, updated_at=NOW()
     WHERE ticket_id=?`,
    [ticket_id],  // <-- FIXED
    err => {
      if (err) return rollback(err);
      commit({
        ticket_id,
        next_approver: approvers[0].approver_ids
          ? approvers[0].approver_ids[0]
          : approvers[0].approver_id,
        workflow_steps: approvers.length
      });
    }
  );
}

const EngineController = {

  /* ============================================================
      CREATE TICKET
  ============================================================ */
  // controller/engine/engineTicket.js — REPLACE create(req,res) with this:
  create(req, res) {
    let {
      company_id,
      service_id,
      service_name,
      form_data,
      creator_id,
      creator_email,
      title
    } = req.body;

    console.log("\n🔥 ENGINE_DEBUG → Incoming create() request");
    console.log("  company_id:", company_id);
    console.log("  service_id:", service_id);
    console.log("  service_name:", service_name);
    console.log("  creator_id:", creator_id);
    console.log("  creator_email:", creator_email);
    console.log("  form_data:", JSON.stringify(form_data, null, 2));

    if (!service_id || !form_data) {
      console.log("❌ ENGINE_DEBUG → Missing service_id or form_data");
      return res.status(400).json({ error: "service_id and form_data required" });
    }

    service_name = service_name || String(service_id);
    console.log("🔥 ENGINE_DEBUG → Final service_name:", service_name);

    dbHots.getConnection(async (err, conn) => {
      if (err) {
        console.log("❌ ENGINE_DEBUG → DB Connection Error:", err);
        return res.status(500).json({ error: err.message });
      }

      // use promise wrapper for consistent async/await calls
      const p = conn.promise();

      try {
        await p.beginTransaction();

        // 1) generate string ticket id
        const ticket_id = "ENG-" + Date.now();
        console.log("🔥 ENGINE_DEBUG → Generated ticket_id:", ticket_id);

        // 2) insert header
        await p.query(
          `INSERT INTO t_ticket_engine
           (ticket_id, company_id, service_id, service_name,
            creator_id, creator_email, status, workflow_level,
            created_at, updated_at, title, json_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, 'submitted', 0, NOW(), NOW(), ?, ?)`,
          [
            ticket_id,
            company_id || 100,
            service_id,
            service_name,
            creator_id || null,
            creator_email || null,
            title || null,
            JSON.stringify(form_data)
          ]
        );

        // 3) prepare EAV rows (prefer .value when object)
        const eavRows = Object.keys(form_data).map((key) => {
          const v = form_data[key];
          let value;
          if (v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")) {
            // use the nested .value if present
            value = v.value === null || typeof v.value === "undefined" ? "" : String(v.value);
          } else if (v && typeof v === "object") {
            // fallback: stringify object
            value = JSON.stringify(v);
          } else {
            value = v === null || typeof v === "undefined" ? "" : String(v);
          }
          return [ticket_id, key, key, value];
        });

        console.log("🔥 ENGINE_DEBUG → EAV Rows:", JSON.stringify(eavRows, null, 2));

        if (eavRows.length) {
          await p.query(
            `INSERT INTO t_ticket_detail_eav (ticket_id, cstm_col, lbl_col, value) VALUES ?`,
            [eavRows]
          );
        }

        // 4) load workflow
        console.log("🔥 ENGINE_DEBUG → Loading workflow for service:", service_id);
        const workflowDef = await engineWorkflow.loadWorkflow(service_id);
        console.log("🔥 ENGINE_DEBUG → workflowDef:", JSON.stringify(workflowDef, null, 2));

        // always insert submit event
        await p.query(
          `INSERT INTO t_ticket_event
           (ticket_id, event_type, approval_order, actor_id, status, created_at)
         VALUES (?, 'submit', 0, ?, 'completed', NOW())`,
          [ticket_id, creator_id || null]
        );

        // 5) if no workflow levels → auto approve
        if (!workflowDef.levels || workflowDef.levels.length === 0) {
          console.log("⚠️ ENGINE_DEBUG → No workflow levels → Auto Approve");
          await p.query(
            `UPDATE t_ticket_engine
           SET status='approved', updated_at=NOW()
           WHERE ticket_id=?`,
            [ticket_id]
          );
          await p.commit();
          conn.release();
          return res.json({ ticket_id, final: true });
        }

        // 6) resolve approvers (use engineWorkflow.resolveApprovers)
        console.log("🔥 ENGINE_DEBUG → Resolving approvers…");
        const approvers = await engineWorkflow.resolveApprovers(workflowDef.levels, creator_id);
        console.log("🔥 ENGINE_DEBUG → Resolved approvers:", JSON.stringify(approvers, null, 2));

        // Insert all approve events using promises — ensure we wait for all to finish
        const insertPromises = [];
        let firstPendingLevel = null;
        let firstPendingApprover = null;

        for (const step of approvers) {
          const isFirstLevel = step.level === 1;
          // parallel approvers
          if (Array.isArray(step.approver_ids) && step.approver_ids.length) {
            step.approver_ids.forEach((uid, idx) => {
              const status = (isFirstLevel && idx === 0) ? "pending" : "waiting";
              if (!firstPendingLevel && status === "pending") {
                firstPendingLevel = step.level;
                firstPendingApprover = uid;
              }
              insertPromises.push(
                p.query(
                  `INSERT INTO t_ticket_event
                   (ticket_id, event_type, approval_order, actor_id, status, created_at)
                 VALUES (?, 'approve', ?, ?, ?, NOW())`,
                  [ticket_id, step.level, uid, status]
                )
              );
              console.log(`🔥 ENGINE_DEBUG → QUEUED PARALLEL INSERT uid=${uid} level=${step.level} status=${status}`);
            });
            continue;
          }

          // single approver (may be null)
          const status = isFirstLevel ? "pending" : "waiting";
          if (!firstPendingLevel && status === "pending") {
            firstPendingLevel = step.level;
            firstPendingApprover = step.approver_id || null;
          }
          insertPromises.push(
            p.query(
              `INSERT INTO t_ticket_event
               (ticket_id, event_type, approval_order, actor_id, status, created_at)
             VALUES (?, 'approve', ?, ?, ?, NOW())`,
              [ticket_id, step.level, step.approver_id || null, status]
            )
          );
          console.log(`🔥 ENGINE_DEBUG → QUEUED INSERT approver=${step.approver_id} level=${step.level} status=${status}`);
        }

        // wait all inserts to finish
        await Promise.all(insertPromises);
        console.log("🔥 ENGINE_DEBUG → All approval event inserts finished");

        // update engine header → set in_approval, workflow_level = firstPendingLevel or 1
        const headerWorkflowLevel = firstPendingLevel || 1;
        await p.query(
          `UPDATE t_ticket_engine
         SET status='in_approval', workflow_level=?, updated_at=NOW()
         WHERE ticket_id=?`,
          [headerWorkflowLevel, ticket_id]
        );

        await p.commit();
        conn.release();

        console.log("✅ ENGINE_DEBUG → COMMIT SUCCESS");
        return res.json({
          ok: true,
          ticketId: ticket_id,
          ticket_id,
          next_approver: firstPendingApprover || null,
          workflow_steps: approvers.length
        });

      } catch (err) {
        console.log("❌ ENGINE_DEBUG → ROLLBACK:", err);
        try {
          await conn.promise().rollback();
        } catch (e) {
          console.log("❌ ENGINE_DEBUG → rollback error:", e);
        }
        conn.release();
        return res.status(500).json({ error: err && err.message ? err.message : err });
      }
    });
  },





  /* ============================================================
      STATUS
  ============================================================ */
  async status(req, res) {
    try {
      const { ticket_id } = req.params;
      console.log("ticket_id", ticket_id)
      const rows = await dbQueryHots(
        `SELECT * FROM t_ticket_engine WHERE ticket_id = ?`,
        [ticket_id]
      );

      if (!rows.length) return res.status(404).json({ error: "not found" });

      const events = await dbQueryHots(
        `SELECT * FROM t_ticket_event
                 WHERE ticket_id = ?
                 ORDER BY approval_order ASC, created_at ASC`,
        [ticket_id]
      );

      res.json({ ticket: rows[0], events });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /* ============================================================
        APPROVE  (PARALLEL SUPPORT)
  ============================================================ */
  approve(req, res) {
    const { ticket_id, approver_id, note } = req.body;
    if (!ticket_id) return res.status(400).json({ error: "ticket_id required" });

    dbHots.getConnection((err, conn) => {
      if (err) return res.status(500).json({ error: err.message });

      conn.beginTransaction(async (err) => {
        if (err) return res.status(500).json({ error: err.message });

        try {
          const [pending] = await conn.promise().query(
            `SELECT *
           FROM t_ticket_event
           WHERE ticket_id = ?
             AND status = 'waiting'
           ORDER BY approval_order ASC
           LIMIT 1`,
            [ticket_id]
          );

          if (!pending.length) return rollback("no pending approval");
          const current = pending[0];

          const level = current.approval_order;

          // 1) Approve ALL in same level
          await conn.promise().query(
            `UPDATE t_ticket_event
           SET status = 'approved',
               note = NULL,
               created_at = NULL
           WHERE ticket_id = ?
             AND approval_order = ?`,
            [ticket_id, level]
          );

          // 2) Update the acting user with real data
          await conn.promise().query(
            `UPDATE t_ticket_event
           SET status = 'approved',
               actor_id = ?, 
               note = ?, 
               created_at = NOW()
           WHERE event_id = ?`,
            [approver_id || null, note || null, current.event_id]
          );

          // 3) Check if next level exists
          const [next] = await conn.promise().query(
            `SELECT *
           FROM t_ticket_event
           WHERE ticket_id = ?
             AND approval_order = ?`,
            [ticket_id, level + 1]
          );

          if (next.length) {
            // Set next approver to PENDING
            await conn.promise().query(
              `UPDATE t_ticket_event
             SET status = 'waiting'
             WHERE event_id = ?`,
              [next[0].event_id]
            );

            await conn.promise().query(
              `UPDATE t_ticket_engine
             SET workflow_level = ?, updated_at = NOW()
             WHERE ticket_id = ?`,
              [next[0].approval_order, ticket_id]
            );

            await commit({ ok: true, next_approver: next[0].actor_id });
            return;
          }

          // 4) No next level → finalize
          await conn.promise().query(
            `UPDATE t_ticket_engine
           SET status = 'approved', updated_at = NOW()
           WHERE ticket_id = ?`,
            [ticket_id]
          );

          await commit({ ok: true, final: true });

        } catch (e) {
          return rollback(e.message || e);
        }
      });

      function rollback(msg) {
        conn.rollback(() => {
          conn.release();
          res.status(400).json({ error: msg });
        });
      }

      function commit(result) {
        conn.commit(() => {
          conn.release();
          res.json(result);
        });
      }
    });
  },


  /* ============================================================
        REJECT (PARALLEL SUPPORT)
  ============================================================ */
  reject(req, res) {
    const { ticket_id, approver_id, note } = req.body;
    if (!ticket_id) return res.status(400).json({ error: "ticket_id required" });

    dbHots.getConnection((err, conn) => {
      if (err) return res.status(500).json({ error: err.message });

      conn.beginTransaction(async (err) => {
        if (err) return res.status(500).json({ error: err.message });

        try {
          const [pending] = await conn.promise().query(
            `SELECT *
           FROM t_ticket_event
           WHERE ticket_id = ?
             AND status = 'waiting'
           ORDER BY approval_order ASC
           LIMIT 1`,
            [ticket_id]
          );

          if (!pending.length) return rollback("no pending approval");

          const current = pending[0];
          const level = current.approval_order;

          // 1) Reject ALL at same level
          await conn.promise().query(
            `UPDATE t_ticket_event
           SET status = 'rejected',
               note = NULL,
               created_at = NULL
           WHERE ticket_id = ?
             AND approval_order = ?`,
            [ticket_id, level]
          );

          // 2) Real rejecting user
          await conn.promise().query(
            `UPDATE t_ticket_event
           SET status = 'rejected',
               actor_id = ?, 
               note = ?, 
               created_at = NOW()
           WHERE event_id = ?`,
            [approver_id || null, note || null, current.event_id]
          );

          // 3) Ticket stops
          await conn.promise().query(
            `UPDATE t_ticket_engine
           SET status = 'rejected', updated_at = NOW()
           WHERE ticket_id = ?`,
            [ticket_id]
          );

          await commit({ ok: true });

        } catch (e) {
          return rollback(e.message || e);
        }
      });

      function rollback(msg) {
        conn.rollback(() => {
          conn.release();
          res.status(400).json({ error: msg });
        });
      }

      function commit(result) {
        conn.commit(() => {
          conn.release();
          res.json(result);
        });
      }
    });
  },

  /* ============================================================
  LIST TICKETS (FILTER + MINE)
  GET /engine/ticket/list?status=&mine=
============================================================ */
  list(req, res) {
    let date = new Date();
    let timestamp = `${date.toLocaleDateString('id')} ${date.toLocaleTimeString('id')} : `;

    const { status, mine } = req.query;
    const user_id = req.dataToken.user_id;

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    let startIndex = (page - 1) * limit;

    let conditions = "WHERE 1=1 ";

    if (status) {
      conditions += ` AND t.status = ${dbHots.escape(status)} `;
    }
    if (mine === "true") {
      conditions += ` AND t.creator_id = ${dbHots.escape(user_id)} `;
    }

    const sql = `
      SELECT 
          t.ticket_id,
          t.service_id,
          t.service_name,
          t.creator_id,
          CONCAT(u.firstname, " ", u.lastname) creator_name,
          t.status,
          t.workflow_level,
          t.created_at,
          t.updated_at
      FROM t_ticket_engine t
      LEFT JOIN user u ON u.user_id = t.creator_id
      ${conditions}
      ORDER BY t.created_at DESC
      LIMIT ${startIndex}, ${limit}
  `;

    dbHots.query(sql, (err, rows) => {
      if (err) {
        console.log(timestamp, "LIST ERROR", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        page,
        limit,
        rows
      });
    });
  },


  /* ============================================================
     MY REQUESTS (TICKET CREATED BY ME)
     GET /engine/ticket/my-requests
  ============================================================ */
  myRequests(req, res) {
    let date = new Date();
    let timestamp = `${date.toLocaleDateString('id')} ${date.toLocaleTimeString('id')} : `;

    const user_id = req.dataToken.user_id;

    const sql = `
      SELECT 
          t.ticket_id,
          t.service_name,
          t.status,
          t.workflow_level,
          t.created_at,
          t.updated_at
      FROM t_ticket_engine t
      WHERE t.creator_id = ?
      ORDER BY t.created_at DESC
  `;

    dbHots.query(sql, [user_id], (err, rows) => {
      if (err) {
        console.log(timestamp, "myRequests ERROR", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        requests: rows
      });
    });
  },


  /* ============================================================
   DASHBOARD SUMMARY
   GET /engine/ticket/dashboard-summary
============================================================ */
  dashboard(req, res) {
    let date = new Date();
    let timestamp = `${date.toLocaleDateString('id')} ${date.toLocaleTimeString('id')} : `;

    const user_id = req.dataToken.user_id;
    const summary = {};

    // 1. Count by status
    const sqlStatus = `
      SELECT status, COUNT(*) AS total
      FROM t_ticket_engine
      GROUP BY status
  `;

    dbHots.query(sqlStatus, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      rows.forEach(r => summary[r.status] = r.total);

      // 2. My approvals
      dbHots.query(`
          SELECT COUNT(*) AS total
          FROM t_ticket_event e
          WHERE e.actor_id = ? AND e.status = 'waiting'
      `, [user_id], (err, approvals) => {
        if (err) return res.status(500).json({ error: err.message });

        summary.my_approvals = approvals[0].total;

        // 3. My requests
        dbHots.query(`
              SELECT COUNT(*) AS total
              FROM t_ticket_engine
              WHERE creator_id = ?
          `, [user_id], (err, reqs) => {
          if (err) return res.status(500).json({ error: err.message });

          summary.my_requests = reqs[0].total;

          // 4. Breakdown per service
          dbHots.query(`
                  SELECT service_name, COUNT(*) total
                  FROM t_ticket_engine
                  GROUP BY service_name
              `, (err, serviceRows) => {
            if (err) return res.status(500).json({ error: err.message });

            summary.service_stats = serviceRows;

            return res.json({
              success: true,
              summary
            });
          });
        });
      });
    });
  },

  /* ============================================================
   MY APPROVALS (USER MUST APPROVE NEXT)
   GET /engine/ticket/my-approvals
============================================================ */
  myApprovals(req, res) {
    let date = new Date();
    let timestamp = `${date.toLocaleDateString('id')} ${date.toLocaleTimeString('id')} : `;

    const user_id = req.dataToken.user_id;

    // Tickets where this person is the pending approver
    const sql = `
      SELECT 
          t.ticket_id,
          t.service_name,
          t.status,
          e.approval_order,
          t.created_at,
          t.updated_at
      FROM t_ticket_event e
      INNER JOIN t_ticket_engine t ON t.ticket_id = e.ticket_id
      WHERE e.actor_id = ? AND e.status = 'waiting'
      ORDER BY t.created_at DESC
  `;

    dbHots.query(sql, [user_id], (err, rows) => {
      if (err) {
        console.log(timestamp, "myApprovals ERROR", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        approvals: rows
      });
    });
  },


};

module.exports = EngineController;
