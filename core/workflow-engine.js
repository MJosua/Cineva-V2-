/**
 * core/workflow-engine.js
 * HOTS Engine V4 — DB-only workflow resolver + approval logic
 *
 * Exports: new WorkflowEngine()
 *
 * Requirements:
 *  - init({ engineLoader, formLoader, dbQuery, dbHots })
 *    - dbQuery: async function(sql, params) => rows
 *    - dbHots: mysql2 pool (for transactions / promise())
 *
 * Notes:
 *  - m_service_workflow rows expected columns:
 *    workflow_id, service_id, level, resolver, approver_role, approver_user, is_active, created_at
 *
 *  - m_service_workflow_resolver_params:
 *    workflow_id, param_key, param_value
 */

class WorkflowEngine {
    constructor() {
      this.engineLoader = null;
      this.formLoader = null;
      this.dbQuery = null; // function(sql, params) => rows
      this.dbHots = null;  // mysql2 pool
      this.resolvers = {}; // name -> async fn(context, params)
    }
  
    init({ engineLoader, formLoader, dbQuery, dbHots }) {
      if (!engineLoader) throw new Error("WorkflowEngine.init missing engineLoader");
      if (!dbQuery) throw new Error("WorkflowEngine.init missing dbQuery");
      if (!dbHots) throw new Error("WorkflowEngine.init missing dbHots");
  
      this.engineLoader = engineLoader;
      this.formLoader = formLoader;
      this.dbQuery = dbQuery;
      this.dbHots = dbHots;
  
      // default resolvers (can be extended by registerResolver)
      this.registerResolver("direct_user", async (context) => {
        const uid = context.actor?.user_id;
        return uid ? [{ type: "user", id: uid }] : [];
      });
  
      this.registerResolver("direct_superior", async (context) => {
        const uid = context.actor?.user_id;
        if (!uid) return [];
        try {
          const rows = await this.dbQuery("SELECT manager_id FROM m_employee WHERE user_id=? LIMIT 1", [uid]);
          const mid = rows?.[0]?.manager_id;
          return mid ? [{ type: "user", id: mid }] : [];
        } catch (e) {
          console.error("resolver.direct_superior error", e);
          return [];
        }
      });
  
      this.registerResolver("team_leader", async (context) => {
        const uid = context.actor?.user_id;
        if (!uid) return [];
        try {
          const rows = await this.dbQuery("SELECT team_leader_id FROM m_team_member WHERE user_id=? LIMIT 1", [uid]);
          const tl = rows?.[0]?.team_leader_id;
          return tl ? [{ type: "user", id: tl }] : [];
        } catch (e) {
          console.error("resolver.team_leader error", e);
          return [];
        }
      });
  
      console.log("WorkflowEngine (DB-only) initialized");
    }
  
    registerResolver(name, fn) {
      this.resolvers[name] = fn;
    }
  
    // -------------------------
    // Load workflow rows for a service_id
    // returns array of rows ordered by level asc
    // -------------------------
    async loadWorkflow(service_id) {
      if (!service_id) return [];
      const sql = `
        SELECT workflow_id, service_id, level, resolver, approver_role, approver_user, is_active
        FROM m_service_workflow
        WHERE service_id = ? AND is_active = 1
        ORDER BY level ASC
      `;
      try {
        const rows = await this.dbQuery(sql, [service_id]);
        return rows || [];
      } catch (e) {
        console.error("loadWorkflow error:", e.message || e);
        return [];
      }
    }
  
    // -------------------------
    // Load resolver params for workflow_id
    // returns array of { param_key, param_value }
    // -------------------------
    async loadResolverParams(workflow_id) {
      if (!workflow_id) return [];
      try {
        const rows = await this.dbQuery(
          `SELECT param_key, param_value FROM m_service_workflow_resolver_params WHERE workflow_id = ?`,
          [workflow_id]
        );
        return rows || [];
      } catch (e) {
        console.error("loadResolverParams error:", e.message || e);
        return [];
      }
    }
  
    // -------------------------
    // Resolve approvers
    // Accepts either:
    //  - workflowRows (array of DB rows)
    //  - service_id (number/string) — in which case it will load rows
    // Returns: [{ level, approver_ids: [id,...] }, ...]
    // -------------------------
    async resolveApprovers(workflowSource, context = {}) {
      // prepare workflowRows
      let workflowRows = [];
      if (!workflowSource) return [];
  
      if (Array.isArray(workflowSource)) {
        workflowRows = workflowSource;
      } else {
        // assume service_id
        workflowRows = await this.loadWorkflow(workflowSource);
      }
  
      const output = [];
  
      for (const wf of workflowRows) {
        const level = Number(wf.level) || 1;
        let ids = [];
  
        // 1) explicit approver_user (single user id)
        if (wf.approver_user) {
          // numeric strings possible
          ids.push(String(wf.approver_user));
        }
  
        // 2) role-based approver
        if (wf.approver_role) {
          try {
            const roleRows = await this.dbQuery("SELECT user_id FROM m_user_role WHERE role = ?", [wf.approver_role]);
            if (Array.isArray(roleRows)) ids.push(...roleRows.map(r => r.user_id));
          } catch (e) {
            console.error("resolveApprovers role lookup error:", e.message || e);
          }
        }
  
        // 3) resolver keyword (e.g., "direct_superior", or "custom_resolver")
        if (wf.resolver) {
          // resolver may include params later; we load params and pass them to resolver as second arg
          const resolverName = String(wf.resolver);
          const resolverFn = this.resolvers[resolverName];
          if (typeof resolverFn === "function") {
            try {
              const paramsArr = await this.loadResolverParams(wf.workflow_id);
              // convert to key/value map
              const params = {};
              for (const p of paramsArr || []) {
                params[p.param_key] = p.param_value;
              }
              const resolved = await resolverFn(context, params);
              if (Array.isArray(resolved)) ids.push(...resolved.map(r => r.id));
            } catch (e) {
              console.error(`resolver ${resolverName} error:`, e.message || e);
            }
          } else {
            // Allow resolver strings like "resolver:direct_superior" if wf.resolver stored that way
            if (resolverName.startsWith("resolver:")) {
              const name = resolverName.split(":")[1];
              const fn = this.resolvers[name];
              if (fn) {
                try {
                  const resolved = await fn(context);
                  if (Array.isArray(resolved)) ids.push(...resolved.map(r => r.id));
                } catch (e) {
                  console.error("resolveApprovers resolver:... error", e);
                }
              }
            }
          }
        }
  
        // dedupe & normalize
        ids = ids.map(String).filter(Boolean);
        ids = [...new Set(ids)];
  
        output.push({
          level,
          approver_ids: ids
        });
      }
  
      return output;
    }
  
    // -------------------------
    // Approve handler
    // expects: { ticket_id, approver_id, note }
    // uses this.dbHots.promise() for transactional queries
    // -------------------------
    async approve({ ticket_id, approver_id, note }) {
      if (!ticket_id) return { ok: false, error: "ticket_id required" };
  
      const p = this.dbHots.promise();
  
      // load header
      const [hdrRows] = await p.query("SELECT * FROM t_ticket_engine WHERE ticket_id=? LIMIT 1", [ticket_id]);
      const header = (hdrRows && hdrRows[0]) ? hdrRows[0] : null;
      if (!header) return { ok: false, error: "Ticket not found" };
  
      const currentLevel = Number(header.workflow_level) || 0;
  
      // 1) mark approver's event row approved (only pending)
      await p.query(
        `UPDATE t_ticket_event
         SET status = 'approved', note = ?, updated_at = NOW()
         WHERE ticket_id = ? AND actor_id = ? AND status = 'pending'`,
        [note || null, ticket_id, approver_id]
      );
  
      // 2) check if any pending left in same level
      const [pendingRows] = await p.query(
        `SELECT * FROM t_ticket_event
         WHERE ticket_id = ? AND approval_order = ? AND status = 'pending'`,
        [ticket_id, currentLevel]
      );
  
      if ((pendingRows && pendingRows.length) > 0) {
        return { ok: true, message: "Approval recorded. Waiting for other approvers." };
      }
  
      // 3) move to next level
      const nextLevel = currentLevel + 1;
  
      // Load workflow rows from DB for this service
      const workflowRows = await this.loadWorkflow(header.service_id);
      const levels = workflowRows.map(r => Number(r.level || 0)).filter(n => n > 0);
      const maxLevel = levels.length ? Math.max(...levels) : currentLevel;
  
      // If next level exceeds maxLevel => finalize
      if (nextLevel > maxLevel) {
        await p.query(
          `UPDATE t_ticket_engine
           SET status = 'approved', updated_at = NOW()
           WHERE ticket_id = ?`,
          [ticket_id]
        );
  
        await p.query(
          `INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at)
           VALUES (?, 'workflow_complete', ?, ?, 'completed', NOW())`,
          [ticket_id, currentLevel, approver_id]
        );
  
        return { ok: true, final: true, message: "Ticket fully approved" };
      }
  
      // 4) resolve approvers for next level using workflowRows
      const resolvedSteps = await this.resolveApprovers(workflowRows, {
        actor: { user_id: approver_id },
        ticket: { ticket_id },
        formData: null
      });
  
      const nextStep = resolvedSteps.find(s => Number(s.level) === nextLevel);
  
      if (!nextStep || !nextStep.approver_ids || nextStep.approver_ids.length === 0) {
        return { ok: false, error: `Workflow missing or empty approvers for level ${nextLevel}` };
      }
  
      // 5) insert t_ticket_event for next level
      for (let i = 0; i < nextStep.approver_ids.length; i++) {
        const uid = nextStep.approver_ids[i];
        const status = (i === 0) ? "pending" : "waiting";
        await p.query(
          `INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at)
           VALUES (?, 'approve', ?, ?, ?, NOW())`,
          [ticket_id, nextLevel, uid, status]
        );
      }
  
      // 6) update workflow_level on ticket header
      await p.query(
        `UPDATE t_ticket_engine SET workflow_level = ?, updated_at = NOW() WHERE ticket_id = ?`,
        [nextLevel, ticket_id]
      );
  
      return { ok: true, next_level: nextLevel, message: `Moved to workflow level ${nextLevel}` };
    }
  
    // -------------------------
    // Reject handler
    // expects { ticket_id, approver_id, note }
    // -------------------------
    async reject({ ticket_id, approver_id, note }) {
      if (!ticket_id) return { ok: false, error: "ticket_id required" };
  
      const p = this.dbHots.promise();
  
      // mark current pending as rejected
      await p.query(
        `UPDATE t_ticket_event
         SET status = 'rejected', note = ?, updated_at = NOW()
         WHERE ticket_id = ? AND actor_id = ? AND status = 'pending'`,
        [note || null, ticket_id, approver_id]
      );
  
      // set ticket status to rejected
      await p.query(
        `UPDATE t_ticket_engine
         SET status = 'rejected', updated_at = NOW()
         WHERE ticket_id = ?`,
        [ticket_id]
      );
  
      // insert a completed reject event
      await p.query(
        `INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at)
         VALUES (?, 'reject', 0, ?, 'completed', NOW())`,
        [ticket_id, approver_id]
      );
  
      return { ok: true, message: "Ticket rejected" };
    }
  }
  
  module.exports = new WorkflowEngine();
  