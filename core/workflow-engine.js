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
const { STATUS_IDS } = require('../script/Utility/hotsConstants');

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

    // Direct superior resolver - returns superior from user table
    this.registerResolver('direct_superior', async (context) => {
      // expects context.actor.user_id (ticket creator) or context.created_by
      const uid = context.actor?.user_id || context.created_by;
      if (!uid) return [{ type: 'user', id: 1147 }];
      try {
        // Priority: user.superior_id > user.final_superior_id > 1147
        const rows = await this.dbQuery(
          'SELECT superior_id, final_superior_id FROM user WHERE user_id = ? LIMIT 1',
          [uid]
        );
        if (!rows || !rows[0]) return [{ type: 'user', id: 1147 }]; // Fallback

        const superiorId = rows[0].superior_id || rows[0].final_superior_id || 1147;
        return [{ type: 'user', id: superiorId }];
      } catch (e) {
        console.error('Error resolving direct_superior:', e);
        return [{ type: 'user', id: 1147 }]; // Fallback on error
      }
    });

    // Short-name alias: superior = user.superior_id || user.final_superior_id || 1147
    this.registerResolver('superior', async (context) => {
      const uid = context.actor?.user_id || context.created_by;
      if (!uid) return [{ type: 'user', id: 1147 }];
      try {
        const rows = await this.dbQuery(
          'SELECT superior_id, final_superior_id FROM user WHERE user_id = ? LIMIT 1',
          [uid]
        );
        if (!rows || !rows[0]) return [{ type: 'user', id: 1147 }];
        const superiorId = rows[0].superior_id || rows[0].final_superior_id || 1147;
        return [{ type: 'user', id: superiorId }];
      } catch (e) {
        console.error('Error resolving superior:', e);
        return [{ type: 'user', id: 1147 }];
      }
    });

    // Final superior: user.final_superior_id || 1147
    this.registerResolver('finalsuperior', async (context) => {
      const uid = context.actor?.user_id || context.created_by;
      if (!uid) return [{ type: 'user', id: 1147 }];
      try {
        const rows = await this.dbQuery(
          'SELECT final_superior_id FROM user WHERE user_id = ? LIMIT 1',
          [uid]
        );
        if (!rows || !rows[0]) return [{ type: 'user', id: 1147 }];
        const superiorId = rows[0].final_superior_id || 1147;
        return [{ type: 'user', id: superiorId }];
      } catch (e) {
        console.error('Error resolving finalsuperior:', e);
        return [{ type: 'user', id: 1147 }];
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

        // console.log("🟩 [WF][DB] Query returned:", rows);

        if (rows && rows[0]) {
          const record = rows[0];
          // console.log("🟦 [WF][DB] Raw DB record:", record);

          if (record.definition) {
            try {
              workflow = (typeof record.definition === 'object')
                ? record.definition
                : JSON.parse(record.definition);

              // console.log("🟩 [WF][DB] Parsed workflow definition:", workflow);
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
    // console.log("🟦 [WF][NORMALIZE] Raw workflow before normalization:", workflow);

    const steps = Array.isArray(workflow.steps)
      ? workflow.steps
      : (workflow.levels || workflow);

    // console.log("🟩 [WF][NORMALIZE] Final normalized steps:", steps);

    // 🔥 PRESERVE TASKS ARRAY
    const tasks = workflow.tasks || [];
    // console.log("🟩 [WF][NORMALIZE] Tasks preserved:", tasks);

    return { steps, tasks };
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
      let approver_leaders = {};   // 🔥 ALWAYS INITIALIZE

      const stepType = (step.step_type || step.type || null);
      const approver = step.approver || step.assigned_value || step.assigned;

      // console.log("step inside workflow-engine", step)
      // console.log(`🟦 [WF][RESOLVE] Step level=${level} step_type=${stepType} approverRaw=`, approver);

      try {
        // ---------------------------------------------
        // 1) TEAM
        // ---------------------------------------------
        if (stepType === 'team') {
          const teamId = (step.assigned_value !== undefined) ? step.assigned_value : approver;

          if (teamId) {
            const rows = await this.dbQuery(
              'SELECT user_id, team_leader FROM m_company_team_member WHERE team_id = ?',
              [teamId]
            );

            ids = rows.map(r => String(r.user_id));

            // 🔥 Build leader map
            rows.forEach(r => {
              approver_leaders[String(r.user_id)] = Number(r.team_leader) || 0;
            });
          }
        }

        // ---------------------------------------------
        // 2) DEPARTMENT
        // ---------------------------------------------
        else if (stepType === 'department' ||
          (stepType === null && step.assigned_value_type === 'department')) {

          const deptId = (step.assigned_value !== undefined) ? step.assigned_value : approver;

          if (deptId) {
            const rows = await this.dbQuery(
              'SELECT user_id FROM `user` WHERE department_id = ? AND active = 1',
              [deptId]
            );

            ids = rows.map(r => String(r.user_id));

            // 🔥 department has no leader flag → default leader = 1
            ids.forEach(uid => {
              approver_leaders[uid] = 1;
            });
          }
        }

        // ---------------------------------------------
        // 3) ROLE
        // ---------------------------------------------
        else if (stepType === 'role' || (typeof approver === 'string' && approver.startsWith('role:'))) {

          let val = step.assigned_value !== undefined ? step.assigned_value : approver;

          if (stepType === 'role') {
            if (!isNaN(Number(val))) {
              const rows = await this.dbQuery(
                'SELECT user_id FROM `user` WHERE role_id = ? AND active = 1',
                [Number(val)]
              );
              ids = rows.map(r => String(r.user_id));
            } else {
              const rows = await this.dbQuery(
                'SELECT user_id FROM user_role WHERE role = ?',
                [String(val).split(':').pop()]
              );
              ids = rows.map(r => String(r.user_id));
            }
          } else {
            const roleName = approver.split(':')[1];
            if (roleName) {
              const rows = await this.dbQuery(
                'SELECT user_id FROM user_role WHERE role = ?',
                [roleName]
              );
              ids = rows.map(r => String(r.user_id));
            }
          }

          // 🔥 default leader = 1
          ids.forEach(uid => { approver_leaders[uid] = 1; });
        }

        // ---------------------------------------------
        // 4) USER_DYNAMIC (with resolver)
        // ---------------------------------------------
        else if (stepType === 'user_dynamic' || step.resolver) {
          const resolverName = step.resolver || 'superior';
          console.log(`🟦 [WF][RESOLVE] user_dynamic step, resolver=${resolverName}`);

          if (this.resolvers[resolverName]) {
            try {
              const res = await this.resolvers[resolverName](context);
              ids = res.map(x => String(x.id));
              console.log(`🟩 [WF][RESOLVE] Resolver ${resolverName} returned:`, ids);
            } catch (e) {
              console.error(`❌ [WF][RESOLVE] Resolver ${resolverName} failed:`, e);
              ids = [];
            }
          }

          // Fallback to superior_id from user table
          if (!ids.length) {
            const uid = context.actor?.user_id || context.created_by;
            if (uid) {
              const rows = await this.dbQuery(
                'SELECT superior_id, final_superior_id FROM `user` WHERE user_id = ? LIMIT 1',
                [uid]
              );
              const sup = rows?.[0]?.superior_id || rows?.[0]?.final_superior_id || 1147;
              ids = [String(sup)];
              console.log(`🟨 [WF][RESOLVE] Fallback superior_id:`, ids);
            }
          }

          ids.forEach(uid => { approver_leaders[uid] = 1; });
        }

        // ---------------------------------------------
        // 5) SUPERIOR (legacy)
        // ---------------------------------------------
        else if (stepType === 'superior' ||
          approver === 'superior' ||
          (typeof approver === 'string' && approver.startsWith('resolver:superior'))) {

          if (this.resolvers['superior']) {
            try {
              const res = await this.resolvers['superior'](context);
              ids = res.map(x => String(x.id));
            } catch { ids = []; }
          }

          // fallback
          if (!ids.length) {
            const uid = context.actor?.user_id || context.created_by;
            if (uid) {
              const rows = await this.dbQuery(
                'SELECT superior_id, final_superior_id FROM `user` WHERE user_id = ? LIMIT 1',
                [uid]
              );
              const sup = rows?.[0]?.superior_id || rows?.[0]?.final_superior_id || 1147;
              if (sup) ids = [String(sup)];
            }
          }

          ids.forEach(uid => { approver_leaders[uid] = 1; });
        }

        // ---------------------------------------------
        // 5) resolver:NAME custom resolvers
        // ---------------------------------------------
        else if (typeof approver === 'string' && approver.startsWith('resolver:')) {
          const fn = this.resolvers[approver.split(':')[1]];
          if (fn) {
            try {
              const res = await fn(context);
              ids = res.map(x => String(x.id));
            } catch { ids = []; }
          }

          ids.forEach(uid => { approver_leaders[uid] = 1; });
        }

        // ---------------------------------------------
        // 6) USER / SPECIFIC USER
        // ---------------------------------------------
        else if (stepType === 'user' || stepType === 'specific_user') {
          const uid = (step.assigned_value !== undefined) ? step.assigned_value : approver;

          if (Array.isArray(uid)) {
            ids = uid.map(String);
          } else if (uid !== null && uid !== undefined) {
            ids = [String(uid)];
          }

          ids.forEach(uid => { approver_leaders[uid] = 1; });
        }

        // ---------------------------------------------
        // 7) user:123 or direct numeric
        // ---------------------------------------------
        else if (typeof approver === 'string' && approver.startsWith('user:')) {
          ids = [approver.split(':')[1]];
          ids.forEach(uid => { approver_leaders[uid] = 1; });

        } else if (typeof approver === 'number') {
          ids = [String(approver)];
          approver_leaders[String(approver)] = 1;

        } else if (step.approver_ids) {
          ids = step.approver_ids.map(String);
          ids.forEach(uid => { approver_leaders[uid] = 1; });
        }

        // ---------------------------------------------
        // 8) Last: Parse JSON array
        // ---------------------------------------------
        if (!ids.length && typeof approver === 'string') {
          try {
            const arr = JSON.parse(approver);
            if (Array.isArray(arr)) ids = arr.map(String);
            ids.forEach(uid => { approver_leaders[uid] = 1; });
          } catch { }
        }

      } catch (err) {
        console.error(`❌ [WF][RESOLVE] Error resolving step level=${level}:`, err);
        ids = [];
      }

      ids = Array.from(new Set(ids));

      // console.log(`🟩 [WF][RESOLVE] Resolved level=${level} ->`, {
      //   ids,
      //   approver_leaders
      // });

      output.push({
        level,
        approver_ids: ids,
        approver_leaders
      });
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

    const [valid] = await dbHots.promise().query(`
      SELECT 1 
      FROM t_ticket_event
      WHERE ticket_id = ?
        AND approval_order = ?
        AND approver_id = ?
        AND approval_status = 0
      LIMIT 1
    `, [ticket_id, currentLevel, approver_id]);

    if (!valid.length) {
      return { ok: false, error: "You are not allowed to approve this step anymore." };
    }

    // mark this approver's event row as approved
    // 1️⃣ Approver who clicked -> approved with remark
    // 🔥 FIX: Include approval_order to only approve CURRENT step, not all steps where user appears
    await p.query(`
    UPDATE t_ticket_event 
    SET approval_status = 1, remark = ?, approve_date = NOW()
    WHERE ticket_id = ? 
      AND approval_order = ?
      AND approver_id = ?
      AND approval_status = 0
`, [note || null, ticket_id, currentLevel, approver_id]);

    // 2️⃣ Auto-approve EVERYONE ELSE in same level
    await p.query(`
    UPDATE t_ticket_event
    SET approval_status = 1
    WHERE ticket_id = ?
      AND approval_order = ?
      AND approver_id != ?
      AND approval_status = 0
`, [ticket_id, currentLevel, approver_id]);


    // are there remaining pending in current level?
    // 3️⃣ FORCE all-level-approved (single approval logic)
    const allLevelApproved = true;

    if (!allLevelApproved) {
      return { ok: true, message: 'Approval recorded. Waiting for other approvers.' };
    }

    // move to next level using module.workflow_id -> steps
    const workflow = await this.loadWorkflow(module);
    const steps = workflow.steps || [];
    const maxLevel = steps.length ? Math.max(...steps.map(s => s.level || s.order || s.step_order || 1)) : currentLevel;

    const nextLevel = currentLevel + 1;
    console.log(`🔵 [WF][APPROVE] Current level: ${currentLevel}, Next level: ${nextLevel}, Max level: ${maxLevel}`);

    if (nextLevel > maxLevel) {
      console.log(`🟢 [WF][FINAL] Final approval reached! nextLevel (${nextLevel}) > maxLevel (${maxLevel})`);

      // Check for post-approval tasks
      const tasks = workflow.tasks || [];
      console.log(`🟡 [WF][TASKS] Found ${tasks.length} tasks in workflow definition`);
      console.log(`🟡 [WF][TASKS] Tasks array:`, JSON.stringify(tasks, null, 2));

      if (tasks.length > 0) {
        console.log(`🟢 [WF][TASKS] Creating ${tasks.length} task(s) in t_ticket_event...`);

        // Create task events
        for (const task of tasks) {
          const taskOrder = task.task_order || task.order || 1;
          const assignedValue = task.assigned_value || task.assigned_id || null;
          const taskType = task.task_type || task.type || 'manual';
          const taskName = task.task_name || task.name || `Task ${taskOrder}`;

          console.log(`  🔹 [TASK] Creating task ${taskOrder}: "${taskName}" (type: ${taskType}, assigned: ${assignedValue})`);

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

          console.log(`  ✅ [TASK] Task ${taskOrder} created successfully`);
        }

        // Set status to PENDING (5) with workflow_step reset to 0
        console.log(`🟢 [WF][STATUS] Setting ticket status to 5 (PENDING) and workflow_step to 0`);
        await p.query(
          `UPDATE t_ticket SET status_id = ?, workflow_step = 0
           WHERE ticket_id = ?`,
          [STATUS_IDS.PENDING, ticket_id]
        );

        return {
          ok: true,
          final: true,
          message: 'Workflow complete. Tasks created.',
          tasksCreated: tasks.length
        };
      }

      // No tasks, mark as FULFILLED (1)
      console.log(`🟡 [WF][NO_TASKS] No tasks defined, marking ticket as FULFILLED (${STATUS_IDS.FULFILLED})`);
      await p.query(`UPDATE t_ticket SET status_id = ?, workflow_step = ? WHERE ticket_id = ?`, [STATUS_IDS.FULFILLED, currentLevel, ticket_id]);
      return { ok: true, final: true, message: 'Ticket fully approved' };
    }

    // resolve next step approvers 
    const ctx = { actor: { user_id: approver_id }, ticket: { ticket_id }, formData: {} };
    const resolved = await this.resolveApprovers(steps, ctx);
    const nextStep = resolved.find(s => s.level === nextLevel);
    if (!nextStep) {
      return { ok: false, error: `Workflow missing level ${nextLevel}` };
    }

    const next_approver_ids = nextStep.approver_ids || [];

    // ℹ️ No need to insert approval events here - they're already created at ticket creation time
    // Just update the workflow step
    await p.query(`UPDATE t_ticket SET workflow_step = ? WHERE ticket_id = ?`, [nextLevel, ticket_id]);
    return { ok: true, next_level: nextLevel, next_approver_ids };
  }

  async reject({ ticket_id, approver_id, note, module, dbHots }) {
    const p = dbHots.promise();

    const [hdrRows] = await p.query(
      `SELECT workflow_step FROM t_ticket WHERE ticket_id = ? LIMIT 1`,
      [ticket_id]
    );
    const currentLevel = hdrRows?.[0]?.workflow_step || 1;

    const [valid] = await dbHots.promise().query(`
      SELECT 1 
      FROM t_ticket_event
      WHERE ticket_id = ?
        AND approval_order = ?
        AND approver_id = ?
        AND approval_status = 0
      LIMIT 1
    `, [ticket_id, currentLevel, approver_id]);

    if (!valid.length) {
      return { ok: false, error: "You are not allowed to reject this step anymore." };
    }

    // 1️⃣ Rejecting user → remark + reject
    await p.query(`
  UPDATE t_ticket_event 
  SET approval_status = 2, remark = ?, updated_at = NOW()
  WHERE ticket_id = ? 
    AND approver_id = ?
`, [note || null, ticket_id, approver_id]);

    // 2️⃣ Auto-reject ALL other approvers in the same level
    await p.query(`
  UPDATE t_ticket_event
  SET approval_status = 2, updated_at = NOW()
  WHERE ticket_id = ?
    AND approval_order = ?
    AND approver_id != ?
    AND approval_status = 0
`, [ticket_id, currentLevel, approver_id]);

    await p.query(`UPDATE t_ticket SET status_id = ? WHERE ticket_id = ?`, [STATUS_IDS.REJECTED, ticket_id]);
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
       SET approval_status = 1, approver_id = ?, remark = ?, approve_date = NOW()
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
      // All tasks done, mark ticket as FULFILLED (1)
      await p.query(
        `UPDATE t_ticket SET status_id = ? WHERE ticket_id = ?`,
        [STATUS_IDS.FULFILLED, ticket_id]
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
