/**
 * ENGINE WORKFLOW MODULE
 * Fixed to use dbQueryHots + dbHots.getConnection properly
 */

const {
  dbQueryHots,      // Promise-based: dbQueryHots(sql, params)
  dbHots            // Pool: dbHots.getConnection((err, conn) => {})
} = require("../../config/db");

const resolvers = require("./resolvers");

/* ============================================================
   DB Helpers (Promise wrappers)
   ============================================================ */

async function getHotsConnection() {
  return new Promise((resolve, reject) => {
    dbHots.getConnection((err, conn) => {
      if (err) return reject(err);
      resolve(conn);
    });
  });
}

async function queryHots(sql, params = []) {
  return dbQueryHots(sql, params);
}

/* ============================================================
   LOAD WORKFLOW
   ============================================================ */

async function loadWorkflow(serviceId) {
  try {
    const levels = await queryHots(
      `
      SELECT workflow_id, level, resolver, approver_role, approver_user
      FROM m_service_workflow
      WHERE service_id = ? AND is_active = 1
      ORDER BY level ASC
    `,
      [serviceId]
    );

    // Load resolver params for each workflow_id
    for (const lvl of levels) {
      const params = await queryHots(
        `
        SELECT param_key, param_value
        FROM m_service_workflow_resolver_params
        WHERE workflow_id = ?
      `,
        [lvl.workflow_id]
      );

      const pObj = {};
      params.forEach(p => pObj[p.param_key] = p.param_value);
      lvl.params = pObj;
    }

    return {
      levels: levels.map((lvl) => ({
        workflow_id: lvl.workflow_id,
        level: Number(lvl.level),
        resolver: lvl.resolver,
        approver_user: lvl.approver_user,
        params: lvl.params || {}
      }))
    };

  } catch (err) {
    console.error("🔥 ENGINE_WORKFLOW → loadWorkflow ERROR:", err);
    return { levels: [] };
  }
}

/* ============================================================
   SHOULD SKIP STEP
   ============================================================ */

function shouldSkipStep(stepParams = {}, workflowParams = {}, ticketData = {}) {
  try {
    if (stepParams.skip_if_amount_lt) {
      const threshold = Number(stepParams.skip_if_amount_lt);
      const amount = Number(ticketData.amount ?? ticketData.total ?? 0);
      if (amount < threshold) return true;
    }

    if (stepParams.only_if_category_in) {
      const allowed = String(stepParams.only_if_category_in)
        .split(",")
        .map(s => s.trim());
      const category = String(ticketData.category ?? ticketData.type ?? "").trim();
      if (!allowed.includes(category)) return true;
    }

    if (stepParams.bypass === "1") return true;

    return false;
  } catch (err) {
    console.warn("skip evaluator error:", err);
    return false;
  }
}

/* ============================================================
   RESOLVE APPROVERS
   ============================================================ */

async function resolveApprovers(levels = [], actorUserId = null, ticketData = {}) {
  const out = [];

  for (const step of levels) {
    const { level, resolver, approver_user, params = {}, workflow_id } = step;

    if (approver_user) {
      out.push({ level, approver_id: String(approver_user), workflow_id });
      continue;
    }

    const fn = resolvers[resolver];

    if (!fn) {
      console.warn("❗ Resolver missing:", resolver);
      out.push({ level, approver_id: null, workflow_id });
      continue;
    }

    try {
      const res = await fn(actorUserId, params, { ticketData });

      if (Array.isArray(res)) {
        out.push({ level, approver_ids: res.map(String), workflow_id });
      } else if (res == null) {
        out.push({ level, approver_id: null, workflow_id });
      } else {
        out.push({ level, approver_id: String(res), workflow_id });
      }

    } catch (err) {
      console.error("Resolver error:", resolver, err);
      out.push({ level, approver_id: null, workflow_id });
    }
  }

  return out;
}

/* ============================================================
   APPLY WORKFLOW ON CREATE
   ============================================================ */

async function applyWorkflowOnCreate(conn, ticketId, serviceId, creatorId, ticketData = {}) {
  const workflow = await loadWorkflow(serviceId);
  const levels = workflow.levels || [];

  // log submit
  await conn.query(
    `
    INSERT INTO t_ticket_event 
    (ticket_id, event_type, approval_order, actor_id, status, created_at)
    VALUES (?, 'submit', 0, ?, 'completed', NOW())
    `,
    [ticketId, creatorId || null]
  );

  if (!levels.length) {
    await conn.query(
      `
      UPDATE t_ticket_engine 
      SET status='approved', workflow_level=0, updated_at=NOW()
      WHERE ticket_id=?
      `,
      [ticketId]
    );
    return { nextApprover: null, steps: 0 };
  }

  // resolve approvers
  const resolved = await resolveApprovers(levels, creatorId, ticketData);

  let firstPending = null;
  let inserted = 0;

  // map level -> params
  const levelParams = {};
  levels.forEach(l => levelParams[l.level] = l.params || {});

  for (const step of resolved) {
    const skip = shouldSkipStep(levelParams[step.level], {}, ticketData);
    if (skip) {
      await conn.query(
        `
        INSERT INTO t_ticket_event
        (ticket_id, event_type, approval_order, actor_id, status, created_at)
        VALUES (?, 'approve', ?, ?, 'skipped', NOW())
        `,
        [ticketId, step.level, step.approver_id || null]
      );
      continue;
    }

    if (step.approver_ids && step.approver_ids.length) {
      for (const aid of step.approver_ids) {
        const status = firstPending ? "waiting" : "pending";
        await conn.query(
          `
          INSERT INTO t_ticket_event
          (ticket_id, event_type, approval_order, actor_id, status, created_at)
          VALUES (?, 'approve', ?, ?, ?, NOW())
          `,
          [ticketId, step.level, aid, status]
        );
        if (!firstPending) firstPending = aid;
        inserted++;
      }
    } else {
      const status = firstPending ? "waiting" : "pending";
      await conn.query(
        `
        INSERT INTO t_ticket_event
        (ticket_id, event_type, approval_order, actor_id, status, created_at)
        VALUES (?, 'approve', ?, ?, ?, NOW())
        `,
        [ticketId, step.level, step.approver_id || null, status]
      );
      if (!firstPending) firstPending = step.approver_id;
      inserted++;
    }
  }

  if (inserted === 0) {
    await conn.query(
      `
      UPDATE t_ticket_engine 
      SET status='approved', workflow_level=0, updated_at=NOW()
      WHERE ticket_id=?
      `,
      [ticketId]
    );
    return { nextApprover: null, final: true };
  }

  await conn.query(
    `
    UPDATE t_ticket_engine
    SET status='in_approval', workflow_level=1, updated_at=NOW()
    WHERE ticket_id=?
    `,
    [ticketId]
  );

  return { nextApprover: firstPending, steps: inserted };
}

/* ============================================================
   PROCESS APPROVAL
   ============================================================ */

async function processApproval(ticketId, approverId, action = "approve", note = null) {
  const conn = await getHotsConnection();

  try {
    await conn.beginTransaction();

    const [pending] = await conn.query(
      `
      SELECT * 
      FROM t_ticket_event
      WHERE ticket_id=? AND status='waiting'
      ORDER BY approval_order ASC, event_id ASC
      LIMIT 1 FOR UPDATE
      `,
      [ticketId]
    );

    if (!pending.length) {
      await conn.rollback();
      conn.release();
      return { ok: false, error: "no pending approval" };
    }

    const row = pending[0];

    if (action === "reject") {
      await conn.query(
        `
        UPDATE t_ticket_event
        SET status='rejected', actor_id=?, note=?, created_at=NOW()
        WHERE event_id=?
        `,
        [approverId, note, row.event_id]
      );

      await conn.query(
        `UPDATE t_ticket_event SET status='cancelled' 
         WHERE ticket_id=? AND status IN ('waiting','waiting')`,
        [ticketId]
      );

      await conn.query(
        `UPDATE t_ticket_engine SET status='rejected', updated_at=NOW() 
         WHERE ticket_id=?`,
        [ticketId]
      );

      await conn.commit();
      conn.release();
      return { ok: true, rejected: true };
    }

    // approve event
    await conn.query(
      `
      UPDATE t_ticket_event 
      SET status='approved', actor_id=?, note=?, created_at=NOW()
      WHERE event_id=?
      `,
      [approverId, note, row.event_id]
    );

    // parallel approver or next level logic...

    const [nextParallel] = await conn.query(
      `
      SELECT * FROM t_ticket_event
      WHERE ticket_id=? AND approval_order=? AND status='waiting'
      ORDER BY event_id ASC LIMIT 1
      `,
      [ticketId, row.approval_order]
    );

    if (nextParallel.length) {
      await conn.query(
        `UPDATE t_ticket_event SET status='waiting' WHERE event_id=?`,
        [nextParallel[0].event_id]
      );

      await conn.query(
        `UPDATE t_ticket_engine SET workflow_level=?, updated_at=NOW() WHERE ticket_id=?`,
        [nextParallel[0].approval_order, ticketId]
      );

      await conn.commit();
      conn.release();
      return { ok: true, nextApprover: nextParallel[0].actor_id };
    }

    // next approval order
    const [nextStep] = await conn.query(
      `
      SELECT * FROM t_ticket_event
      WHERE ticket_id=? AND approval_order > ?
      ORDER BY approval_order ASC LIMIT 1
      `,
      [ticketId, row.approval_order]
    );

    if (nextStep.length) {
      await conn.query(
        `
        UPDATE t_ticket_event 
        SET status='waiting' 
        WHERE ticket_id=? AND approval_order=?
        `,
        [ticketId, nextStep[0].approval_order]
      );

      await conn.query(
        `UPDATE t_ticket_engine SET workflow_level=?, updated_at=NOW() WHERE ticket_id=?`,
        [nextStep[0].approval_order, ticketId]
      );

      await conn.commit();
      conn.release();
      return { ok: true, nextApprover: nextStep[0].actor_id };
    }

    // finalize
    await conn.query(
      `UPDATE t_ticket_engine SET status='approved', updated_at=NOW() WHERE ticket_id=?`,
      [ticketId]
    );

    await conn.commit();
    conn.release();
    return { ok: true, final: true };

  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("engine-workflow.processApproval error:", err);
    return { ok: false, error: err.message };
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  loadWorkflow,
  resolveApprovers,
  applyWorkflowOnCreate,
  processApproval,
  shouldSkipStep
};
