/**
 * core/workflow-engine.js
 * Load workflow definitions from m_service_workflow and/or t_workflow_step and resolve/approve/reject operations.
 *
 * Init signature: init({ engineLoader, dbQuery, resolverFns })
 * - engineLoader: core/engine-loader instance
 * - dbQuery(sql, params) -> Promise(rows)
 * - resolverFns: optional map of resolver name -> async fn(context) returning [{type:'user'|'role', id:...}, ...]
 */

const assert = require('assert');

class WorkflowEngine {
  constructor() {
    this.engineLoader = null;
    this.dbQuery = null;
    this.resolvers = {}; // name -> async function(context) -> [{type,id}]
  }

  init({ engineLoader, dbQuery, resolverFns = {} }) {
    assert(engineLoader, 'WorkflowEngine.init requires engineLoader');
    assert(dbQuery && typeof dbQuery === 'function', 'WorkflowEngine.init requires dbQuery');
    this.engineLoader = engineLoader;
    this.dbQuery = dbQuery;

    // built-in resolver examples (can be extended via resolverFns)
    this.registerResolver('direct_superior', async (context) => {
      // expects context.actor.user_id
      const uid = context.actor && context.actor.user_id;
      if (!uid) return [];
      try {
        const rows = await this.dbQuery('SELECT superior_id FROM user WHERE user_id = ? LIMIT 1', [uid]);
        const mid = rows && rows[0] && rows[0].superior_id;
        return mid ? [{ type: 'user', id: mid }] : [];
      } catch (e) {
        console.warn('⚠️ Failed to resolve direct_superior:', e.message);
        return [];
      }
    });

    // final supervisor/approver resolver (uses user.final_superior_id)
    this.registerResolver('final_superior', async (context) => {
      const uid = context.actor && context.actor.user_id;
      if (!uid) return [];
      try {
        const rows = await this.dbQuery('SELECT final_superior_id FROM user WHERE user_id = ? LIMIT 1', [uid]);
        const fid = rows && rows[0] && rows[0].final_superior_id;
        return fid ? [{ type: 'user', id: fid }] : [];
      } catch (e) {
        console.warn('⚠️ Failed to resolve final_superior:', e.message);
        return [];
      }
    });

    // copy supplied resolvers
    for (const [k, fn] of Object.entries(resolverFns || {})) {
      if (typeof fn === 'function') this.registerResolver(k, fn);
    }
  }

  registerResolver(name, fn) {
    if (!name || typeof fn !== 'function') return;
    this.resolvers[name] = fn;
  }

  /**
   * loadWorkflow(serviceIdOrModule)
   * Accepts either numeric service_id or module object (engineLoader.getServiceConfig)
   * Returns normalized workflow object { steps: [ { level, approver, step_type, assigned_value, meta } ] }
   */
  async loadWorkflow(serviceIdOrModule) {
    let svc = null;
    if (typeof serviceIdOrModule === 'object' && serviceIdOrModule !== null) svc = serviceIdOrModule;
    else svc = this.engineLoader.getServiceConfig(serviceIdOrModule);

    if (!svc) return null;

    // Preferred source: m_service_workflow.definition (DB JSON)
    let workflow = null;
    try {
      if (svc.workflow_id) {
        const rows = await this.dbQuery('SELECT * FROM m_service_workflow WHERE workflow_id = ? LIMIT 1', [svc.workflow_id]);
        if (rows && rows[0]) {
          workflow = rows[0].definition ? (typeof rows[0].definition === 'object' ? rows[0].definition : JSON.parse(rows[0].definition)) : null;
        }
      }
    } catch (e) {
      // ignore and fallback
    }

    // Fallback: svc.workflow_json (legacy)
    if (!workflow && svc.workflow_json) workflow = svc.workflow_json;

    // Final fallback: return empty
    if (!workflow) return { steps: [] };

    // Normalize: workflow.steps or workflow.levels
    const steps = Array.isArray(workflow.steps) ? workflow.steps : (workflow.levels || workflow);
    return { steps };
  }

  /**
   * resolveApprovers(workflow, context)
   * - workflow: object returned by loadWorkflow (or raw steps array)
   * - context: { actor: { user_id }, ticket: {...}, formData: {...} }
   *
   * Returns: [{ level, approver_ids: [uid,...] }]
   */
  async resolveApprovers(workflowOrSteps, context = {}) {
    const steps = Array.isArray(workflowOrSteps) ? workflowOrSteps : (workflowOrSteps && workflowOrSteps.steps) ? workflowOrSteps.steps : [];
    const output = [];

    for (const sRaw of steps) {
      const step = (typeof sRaw === 'object') ? sRaw : { approver: sRaw };
      const level = step.level || step.order || step.step_order || (step.step || 1);
      let ids = [];

      // Approver can be:
      // - "resolver:direct_superior"
      // - "role:ROLE_NAME" or numeric role id
      // - "user:123" or numeric id
      // - array of ids
      const approver = step.approver || step.assigned_value || step.assigned;

      if (typeof approver === 'string') {
        if (approver.startsWith('resolver:')) {
          const rname = approver.split(':')[1];
          const fn = this.resolvers[rname];
          if (fn) {
            try {
              const res = await fn(context);
              ids = (res || []).map(x => x.id).filter(Boolean);
            } catch (e) { ids = []; }
          }
        } else if (approver.startsWith('role:')) {
          const role = approver.split(':')[1];
          // assume role is name; find users by role
          try {
            const rows = await this.dbQuery(
              `SELECT u.user_id 
               FROM user u 
               JOIN m_role r ON u.role_id = r.role_id 
               WHERE r.role_name = ? AND u.active = 1`,
              [role]
            );
            ids = (rows || []).map(r => r.user_id);
          } catch (e) {
            console.warn(`⚠️ Failed to resolve role:${role}:`, e.message);
            ids = [];
          }
        } else if (approver.startsWith('user:')) {
          ids = [approver.split(':')[1]];
        } else {
          // maybe a JSON array in string
          try {
            const parsed = JSON.parse(approver);
            if (Array.isArray(parsed)) ids = parsed;
          } catch { }
        }
      } else if (Array.isArray(approver)) {
        ids = approver.map(x => String(x));
      } else if (typeof approver === 'number') {
        ids = [String(approver)];
      } else if (step.approver_ids) {
        ids = step.approver_ids.map(x => String(x));
      }

      output.push({ level, approver_ids: ids });
    }

    return output;
  }

  /**
   * approve({ ticket_id, approver_id, note, module, dbHots })
   * performs approval progression using t_ticket_event and t_ticket
   */
  async approve({ ticket_id, approver_id, note, module, dbHots }) {
    // dbHots is expected (pool) if transaction is needed.
    const p = dbHots ? dbHots.promise() : null;
    if (!p) throw new Error('approve requires dbHots (pool)');

    // load header
    const [hdrRows] = await p.query('SELECT * FROM t_ticket WHERE ticket_id = ? LIMIT 1', [ticket_id]);
    if (!hdrRows.length) return { ok: false, error: 'Ticket not found' };
    const header = hdrRows[0];
    const currentLevel = header.workflow_level || 1;

    // mark this approver's event row as approved
    await p.query(`UPDATE t_ticket_event SET status = 'approved', note = ?, updated_at = NOW()
                   WHERE ticket_id = ? AND actor_id = ? AND status = 'pending'`, [note || null, ticket_id, approver_id]);

    // are there remaining pending in current level?
    const [pendingInLevel] = await p.query(
      `SELECT * FROM t_ticket_event WHERE ticket_id = ? AND approval_order = ? AND status = 'pending'`,
      [ticket_id, currentLevel]
    );
    const allLevelApproved = (pendingInLevel.length === 0);

    if (!allLevelApproved) {
      return { ok: true, message: 'Approval recorded. Waiting for other approvers.' };
    }

    // move to next level using module.workflow_id -> steps
    const workflow = await this.loadWorkflow(module);
    const steps = workflow.steps || [];
    const maxLevel = steps.length ? Math.max(...steps.map(s => s.level || s.order || s.step_order || 1)) : currentLevel;

    const nextLevel = currentLevel + 1;
    if (nextLevel > maxLevel) {
      // finalize
      await p.query(`UPDATE t_ticket SET status = 'approved', workflow_level = ?, updated_at = NOW() WHERE ticket_id = ?`, [currentLevel, ticket_id]);
      await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'workflow_complete', ?, ?, 'completed', NOW())`, [ticket_id, currentLevel, approver_id]);
      return { ok: true, final: true, message: 'Ticket fully approved' };
    }

    // resolve next step approvers and insert events
    const ctx = { actor: { user_id: approver_id }, ticket: { ticket_id }, formData: {} };
    const resolved = await this.resolveApprovers(steps, ctx);
    const nextStep = resolved.find(s => s.level === nextLevel);
    if (!nextStep) {
      return { ok: false, error: `Workflow missing level ${nextLevel}` };
    }

    // insert next level rows
    for (let i = 0; i < (nextStep.approver_ids || []).length; i++) {
      const uid = nextStep.approver_ids[i];
      const status = (i === 0) ? 'pending' : 'waiting';
      await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`, [ticket_id, nextLevel, uid, status]);
    }

    await p.query(`UPDATE t_ticket SET workflow_level = ?, updated_at = NOW() WHERE ticket_id = ?`, [nextLevel, ticket_id]);
    return { ok: true, next_level: nextLevel };
  }

  async reject({ ticket_id, approver_id, note, module, dbHots }) {
    const p = dbHots.promise();
    await p.query(`UPDATE t_ticket_event SET status = 'rejected', note = ?, updated_at = NOW() WHERE ticket_id = ? AND actor_id = ? AND status = 'pending'`, [note || null, ticket_id, approver_id]);
    await p.query(`UPDATE t_ticket SET status = 'rejected', updated_at = NOW() WHERE ticket_id = ?`, [ticket_id]);
    await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, 'reject', 0, ?, 'completed', NOW())`, [ticket_id, approver_id]);
    return { ok: true, message: 'Ticket rejected' };
  }
}

module.exports = new WorkflowEngine();
