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
        const rows = await this.dbQuery('SELECT manager_id FROM m_employee WHERE user_id = ? LIMIT 1', [uid]);
        const mid = rows && rows[0] && rows[0].manager_id;
        return mid ? [{ type: 'user', id: mid }] : [];
      } catch (e) {
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
    console.log("🟦 [WF][LOAD] Starting workflow load...");

    let svc = null;
    if (typeof serviceIdOrModule === 'object' && serviceIdOrModule !== null) {
      svc = serviceIdOrModule;
      console.log("🟦 [WF][LOAD] Input is MODULE object:", {
        module_key: svc.module_key,
        module_name: svc.module_name,
        service_id: svc.service_id
      });
    } else {
      svc = this.engineLoader.getServiceConfig(serviceIdOrModule);
      console.log("🟦 [WF][LOAD] Loaded module via engineLoader:", svc);
    }

    if (!svc) {
      console.log("❌ [WF][LOAD] No module found.");
      return { steps: [] };
    }

    let workflow = null;

    // ---------------------------------------------
    // 1️⃣ TRY LOAD WORKFLOW FROM DB (m_service_workflow)
    // ---------------------------------------------
    if (svc.service_id) {
      console.log("🟦 [WF][DB] Loading workflow from DB using workflow_id =", svc.service_id);

      try {
        const rows = await this.dbQuery(
          'SELECT * FROM m_service_workflow WHERE workflow_id = ? LIMIT 1',
          [svc.service_id]
        );

        console.log("🟩 [WF][DB] Query returned:", rows);

        if (rows && rows[0]) {
          const record = rows[0];
          console.log("🟦 [WF][DB] Raw DB record:", record);

          if (record.definition) {
            try {
              workflow = (typeof record.definition === 'object')
                ? record.definition
                : JSON.parse(record.definition);

              console.log("🟩 [WF][DB] Parsed workflow definition:", workflow);
            } catch (err) {
              console.error("❌ [WF][DB] JSON parse error:", err);
            }
          } else {
            console.warn("⚠️ [WF][DB] m_service_workflow.definition is empty or null");
          }
        }
      } catch (err) {
        console.error("❌ [WF][DB] Error while querying m_service_workflow:", err);
      }
    } else {
      console.log("⚠️ [WF][DB] No workflow_id provided in module. Skipping DB lookup.");
    }

    // ---------------------------------------------
    // 2️⃣ FALLBACK TO MODULE.workflow_json
    // ---------------------------------------------
    if (!workflow && svc.workflow_json) {
      console.log("🟧 [WF][FALLBACK] Using module.workflow_json fallback:", svc.workflow_json);
      workflow = svc.workflow_json;
    }

    // ---------------------------------------------
    // 3️⃣ NO WORKFLOW FOUND → RETURN EMPTY
    // ---------------------------------------------
    if (!workflow) {
      console.log("❌ [WF][EMPTY] No workflow found in DB or module. Returning empty workflow.");
      return { steps: [] };
    }

    // ---------------------------------------------
    // 4️⃣ NORMALIZE WORKFLOW FORMAT
    // ---------------------------------------------
    console.log("🟦 [WF][NORMALIZE] Raw workflow before normalization:", workflow);

    const steps = Array.isArray(workflow.steps)
      ? workflow.steps
      : (workflow.levels || workflow);

    console.log("🟩 [WF][NORMALIZE] Final normalized steps:", steps);

    return { steps };
  }

  /**
   * resolveApprovers(workflow, context)
   * - workflow: object returned by loadWorkflow (or raw steps array)
   * - context: { actor: { user_id }, ticket: {...}, formData: {...} }
   *
   * Returns: [{ level, approver_ids: [uid,...] }]
   */
  /**
     * resolveApprovers(workflow, context)
     * - workflow: object returned by loadWorkflow (or raw steps array)
     * - context: { actor: { user_id }, ticket: {...}, formData: {...} }
     *
     * Returns: [{ level, approver_ids: [uid,...] }]
     */
  async resolveApprovers(workflowOrSteps, context = {}) {

    const steps = Array.isArray(workflowOrSteps)
      ? workflowOrSteps
      : (workflowOrSteps && workflowOrSteps.steps)
        ? workflowOrSteps.steps
        : [];
    const output = [];

    for (const sRaw of steps) {
      const step = (typeof sRaw === 'object') ? sRaw : { approver: sRaw };
      const level = step.level || step.order || step.step_order || (step.step || 1);

      let ids = [];

      // Prefer explicit step_type (team/department/role/user/superior/etc)
      const stepType = (step.step_type || step.type || null);
      // candidate approver value (legacy)
      const approver = step.approver || step.assigned_value || step.assigned;
      const leader = step.leader || 1;

      console.log(`🟦 [WF][RESOLVE] Step level=${level} step_type=${stepType} approverRaw=`, approver);

      try {
        // ------------------------
        // 1) If step_type === 'team'
        // ------------------------
        if (stepType === 'team' || (stepType === null && step.assigned_value && step.assigned_value_type === 'team')) {
          // assigned_value is expected to be team_id
          const teamId = (step.assigned_value !== undefined) ? step.assigned_value : approver;
          if (teamId) {
            const rows = await this.dbQuery('SELECT user_id FROM m_team_member WHERE team_id = ?', [teamId]);
            ids = (rows || []).map(r => String(r.user_id)).filter(Boolean);
          }
        }

        // ------------------------
        // 2) department -> from user.department_id (you confirmed)
        // ------------------------
        else if (stepType === 'department' || (stepType === null && step.assigned_value_type === 'department')) {
          const deptId = (step.assigned_value !== undefined) ? step.assigned_value : approver;
          if (deptId) {
            const rows = await this.dbQuery('SELECT user_id FROM `user` WHERE department_id = ? AND active = 1', [deptId]);
            ids = (rows || []).map(r => String(r.user_id)).filter(Boolean);
          }
        }

        // ------------------------
        // 3) role step_type OR approver starts with "role:"
        // ------------------------
        else if (stepType === 'role' || (typeof approver === 'string' && approver.startsWith('role:'))) {
          // if stepType === 'role' we expect assigned_value to be role id or role name
          if (stepType === 'role') {
            const val = step.assigned_value !== undefined ? step.assigned_value : approver;
            // numeric role id
            if (typeof val === 'number' || (!isNaN(Number(val)) && String(val).trim() !== '')) {
              const rows = await this.dbQuery('SELECT user_id FROM `user` WHERE role_id = ? AND active = 1', [Number(val)]);
              ids = (rows || []).map(r => String(r.user_id)).filter(Boolean);
            } else if (typeof val === 'string') {
              // role name mapping table (legacy)
              const rows = await this.dbQuery('SELECT user_id FROM m_user_role WHERE role = ?', [val.split(':').pop()]);
              ids = (rows || []).map(r => String(r.user_id)).filter(Boolean);
            }
          } else {
            // approver string like 'role:FINANCE_MANAGER'
            const roleName = approver.split(':')[1];
            if (roleName) {
              const rows = await this.dbQuery('SELECT user_id FROM m_user_role WHERE role = ?', [roleName]);
              ids = (rows || []).map(r => String(r.user_id)).filter(Boolean);
            }
          }
        }

        // ------------------------
        // 4) superior (direct superior)
        // ------------------------
        else if (stepType === 'superior' || (typeof approver === 'string' && approver === 'superior') || (typeof approver === 'string' && approver.startsWith('resolver:superior'))) {
          // first try resolver if exists
          if (this.resolvers['direct_superior']) {
            try {
              const res = await this.resolvers['direct_superior'](context);
              ids = (res || []).map(x => String(x.id)).filter(Boolean);
            } catch (e) { ids = []; }
          } else {
            // fallback: check user.superior_id in user table
            const uid = context.actor && context.actor.user_id;
            if (uid) {
              const rows = await this.dbQuery('SELECT superior_id FROM `user` WHERE user_id = ? LIMIT 1', [uid]);
              const sup = rows && rows[0] && rows[0].superior_id;
              if (sup) ids = [String(sup)];
            }
          }
        }

        // ------------------------
        // 5) resolver:NAME (custom resolvers)
        // ------------------------
        else if (typeof approver === 'string' && approver.startsWith('resolver:')) {
          const rname = approver.split(':')[1];
          const fn = this.resolvers[rname];
          if (fn) {
            try {
              const res = await fn(context);
              ids = (res || []).map(x => String(x.id)).filter(Boolean);
            } catch (e) { ids = []; }
          }
        }

        // ------------------------
        // 6) explicit user or specific_user
        // ------------------------
        else if (stepType === 'user' || stepType === 'specific_user') {
          const uid = (step.assigned_value !== undefined) ? step.assigned_value : approver;
          if (Array.isArray(uid)) {
            ids = uid.map(x => String(x));
          } else if (uid !== undefined && uid !== null) {
            ids = [String(uid)];
          }
        }

        // ------------------------
        // 7) approver string 'user:123' OR 'user' numeric direct
        // ------------------------
        else if (typeof approver === 'string' && approver.startsWith('user:')) {
          ids = [approver.split(':')[1]];
        } else if (Array.isArray(approver)) {
          ids = approver.map(x => String(x));
        } else if (typeof approver === 'number') {
          // ambiguous numeric — if step_type exists it was handled earlier; otherwise treat as user id
          ids = [String(approver)];
        } else if (step.approver_ids) {
          ids = (step.approver_ids || []).map(x => String(x));
        }

        // ------------------------
        // 8) As a last attempt: if no ids found but step has assigned_value and it's a JSON string array
        // ------------------------
        if ((!ids || ids.length === 0) && typeof approver === 'string') {
          try {
            const parsed = JSON.parse(approver);
            if (Array.isArray(parsed)) ids = parsed.map(x => String(x));
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error(`❌ [WF][RESOLVE] Error resolving step level=${level}:`, err);
        ids = [];
      }

      // ensure uniqueness & filter
      ids = Array.from(new Set((ids || []).filter(Boolean)));

      console.log(`🟩 [WF][RESOLVE] Resolved level=${level} -> approver_ids=`, ids);

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
    const currentLevel = header.workflow_step || 1;

    // mark this approver's event row as approved
    await p.query(`UPDATE t_ticket_event SET approval_status = 1, remark = ?, updated_at = NOW()
                   WHERE ticket_id = ? AND approver_id = ? AND approval_status = 0`, [note || null, ticket_id, approver_id]);

    // are there remaining pending in current level?
    const [pendingInLevel] = await p.query(
      `SELECT * FROM t_ticket_event WHERE ticket_id = ? AND approval_order = ? AND approval_status = 0`,
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
      // finalize approval workflow
      await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, approver_id, approval_status, created_at) VALUES (?, 'workflow_complete', ?, ?, 1, NOW())`, [ticket_id, currentLevel, approver_id]);

      // Check for post-approval tasks
      const tasks = workflow.tasks || [];

      if (tasks.length > 0) {
        // Create task events
        for (const task of tasks) {
          const taskOrder = task.task_order || task.order || 1;
          const assignedValue = task.assigned_value || task.assigned_id || null;
          const taskType = task.task_type || task.type || 'manual';
          const taskName = task.task_name || task.name || `Task ${taskOrder}`;

          const taskMeta = {
            task_name: taskName,
            task_type: taskType,
            depends_on: task.depends_on || [],
            required: task.required !== false,
            ...task.meta
          };

          await p.query(
            `INSERT INTO t_ticket_event 
             (ticket_id, event_type, step_type, approval_order, assigned_value, 
              approval_status, event_meta, created_at) 
             VALUES (?, 'task', ?, ?, ?, 0, ?, NOW())`,
            [
              ticket_id,
              taskType,
              taskOrder,
              assignedValue,
              JSON.stringify(taskMeta)
            ]
          );
        }

        // Set status to "In Fulfillment" (5) with workflow_step reset to 0
        await p.query(
          `UPDATE t_ticket SET status_id = 5, workflow_step = 0, updated_at = NOW() 
           WHERE ticket_id = ?`,
          [ticket_id]
        );

        return {
          ok: true,
          final: true,
          tasks_created: tasks.length,
          message: `Ticket approved. ${tasks.length} task(s) created for fulfillment.`
        };
      }

      // No tasks, mark as completed
      await p.query(`UPDATE t_ticket SET status_id = 3, workflow_step = ?, updated_at = NOW() WHERE ticket_id = ?`, [currentLevel, ticket_id]);
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
      const approvalStatus = 0;  // All pending in HOTS
      await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, approver_id, approval_status, created_at) VALUES (?, 'approve', ?, ?, ?, NOW())`, [ticket_id, nextLevel, uid, approvalStatus]);
    }

    await p.query(`UPDATE t_ticket SET workflow_step = ?, updated_at = NOW() WHERE ticket_id = ?`, [nextLevel, ticket_id]);
    return { ok: true, next_level: nextLevel };
  }

  async reject({ ticket_id, approver_id, note, module, dbHots }) {
    const p = dbHots.promise();
    await p.query(`UPDATE t_ticket_event SET approval_status = 2, remark = ?, updated_at = NOW() WHERE ticket_id = ? AND approver_id = ? AND approval_status = 0`, [note || null, ticket_id, approver_id]);
    await p.query(`UPDATE t_ticket SET status_id = 4, updated_at = NOW() WHERE ticket_id = ?`, [ticket_id]);
    await p.query(`INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, approver_id, approval_status, created_at) VALUES (?, 'reject', 0, ?, 2, NOW())`, [ticket_id, approver_id]);
    return { ok: true, message: 'Ticket rejected' };
  }

  /**
   * completeTask({ ticket_id, task_order, completed_by, remark, dbHots })
   * Mark a task as complete and check if all tasks are done
   */
  async completeTask({ ticket_id, task_order, completed_by, remark, dbHots }) {
    const p = dbHots ? dbHots.promise() : null;
    if (!p) throw new Error('completeTask requires dbHots (pool)');

    // Update the task event to completed status
    await p.query(
      `UPDATE t_ticket_event 
       SET approval_status = 1, approver_id = ?, remark = ?, updated_at = NOW(), approve_date = NOW()
       WHERE ticket_id = ? AND event_type = 'task' AND approval_order = ? AND approval_status = 0`,
      [completed_by, remark || null, ticket_id, task_order]
    );

    // Check if all tasks are completed
    const [remainingTasks] = await p.query(
      `SELECT COUNT(*) as remaining 
       FROM t_ticket_event 
       WHERE ticket_id = ? AND event_type = 'task' AND approval_status = 0`,
      [ticket_id]
    );

    const allTasksComplete = (remainingTasks[0].remaining === 0);

    if (allTasksComplete) {
      // All tasks done, mark ticket as completed
      await p.query(
        `UPDATE t_ticket SET status_id = 6, updated_at = NOW() WHERE ticket_id = ?`,
        [ticket_id]
      );

      // Log completion event
      await p.query(
        `INSERT INTO t_ticket_event 
         (ticket_id, event_type, approval_order, approver_id, approval_status, created_at) 
         VALUES (?, 'tasks_complete', 0, ?, 1, NOW())`,
        [ticket_id, completed_by]
      );

      return {
        ok: true,
        all_complete: true,
        message: 'All tasks completed. Ticket finalized.'
      };
    }

    return {
      ok: true,
      all_complete: false,
      remaining: remainingTasks[0].remaining,
      message: `Task ${task_order} completed. ${remainingTasks[0].remaining} task(s) remaining.`
    };
  }
}

module.exports = new WorkflowEngine();
