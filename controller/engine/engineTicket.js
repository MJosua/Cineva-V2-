/**
 * controller/engine/engineTicket.js
 * Engine controller that uses canonical HOTS tables:
 *  - t_ticket
 *  - t_ticket_detail
 *  - t_ticket_event
 *
 * Routes expected:
 * POST /engine/create         (body contains service_id or service_name + form_data)
 * POST /engine/approve
 * POST /engine/reject
 * GET  /engine/status/:ticket_id
 * plus list, my-approvals, my-requests, cancel, requestRevision, resubmit, revisions endpoints
 */

const { dbHots } = require('../../config/db');
const { engineLoader, formLoader, workflowEngine, triggerEngine, documentEngine } = require('../../core/init-engines');
const engineLoaderCore = require('../../core/engine-loader');
const FormLoader = require('../../core/form-loader');
const workflowEngineCore = require('../../core/workflow-engine');
const triggerEngineCore = require('../../core/trigger-engine');
const documentEngineCore = require('../../core/document-engine');
const sseHelper = require('../../core/sse-helper');

const {
  STATUS_IDS,
  SERVICE_IDS,
  EVENT_TYPES,
  APPROVAL_STATUS,
  ASSIGNMENT_TYPES
} = require('../../script/Utility/hotsConstants');

async function generateCustomTicketID(db, service_id, user_id) {
  const year = new Date().getFullYear().toString().slice(-2);
  const service = String(service_id).padStart(2, "0");
  const user = String(user_id).padStart(4, "0");

  // 🧩 Check last used ticket for this pattern
  const [rows] = await db.promise().query(
    `SELECT ticket_id 
         FROM t_ticket 
         WHERE ticket_id LIKE ? 
         ORDER BY ticket_id DESC 
         LIMIT 1`,
    [`${year}${service}${user}%`]
  );

  let running = "0001";
  if (rows.length > 0) {
    const last = rows[0].ticket_id.toString();
    const lastRun = parseInt(last.slice(-4)) || 0;
    running = String(lastRun + 1).padStart(4, "0");
  }

  return `${year}${service}${user}${running}`;
}

function log(...a) { console.log(...a); }

const { hotsMailer } = require('../../service/mailer/hots/hots_mailer');

async function saveEav(p, ticketId, form_data, revision = null, serviceItems = null, service_id = null) {
  // console.log('🔍 [SAVE_EAV] Input form_data:', JSON.stringify(form_data, null, 2));

  // ---------- DATA SEPARATION: Build auto-save field name set from serviceItems ----------
  const autoSaveFieldNames = new Set();

  // If serviceItems is null, try to fetch from DB
  let items = [];
  try {
    if (serviceItems) {
      items = typeof serviceItems === 'string'
        ? JSON.parse(serviceItems || '[]')
        : (serviceItems || []);
    } else if (service_id) {
      // Fallback: fetch form_json from m_service and extract .items
      const [svcRows] = await p.query('SELECT form_json FROM m_service WHERE service_id = ?', [service_id]);
      if (svcRows[0]?.form_json) {
        const formJson = typeof svcRows[0].form_json === 'string'
          ? JSON.parse(svcRows[0].form_json)
          : svcRows[0].form_json;
        items = formJson?.items || [];
        console.log('🔍 [DataSeparation] Fetched form_json.items from DB, count:', items.length);
      }
    }

    function collectAutoSaveFields(itemsArr) {
      for (const item of itemsArr) {
        // Check direct field
        if (item.data?.autoSaveId?.enabled) {
          const fieldName = item.data.name || item.data.label?.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const suffix = item.data.autoSaveId.suffix || '_id';
          autoSaveFieldNames.add(`${fieldName}${suffix}`);
        }
        // Check section fields
        if (item.data?.fields && Array.isArray(item.data.fields)) {
          for (const f of item.data.fields) {
            if (f.autoSaveId?.enabled) {
              const suffix = f.autoSaveId.suffix || '_id';
              autoSaveFieldNames.add(`${f.name}${suffix}`);
            }
          }
        }
      }
    }
    collectAutoSaveFields(items);
    if (autoSaveFieldNames.size > 0) {
      console.log('🔑 [DataSeparation] Auto-save fields detected:');
      console.table([...autoSaveFieldNames]);
    }
  } catch (parseErr) {
    console.warn('⚠️ [DataSeparation] Failed to parse serviceItems:', parseErr.message);
  }

  const detailRows = [];
  const workDataRows = [];

  for (const key of Object.keys(form_data || {})) {
    const v = form_data[key];
    // console.log(`🔍 [SAVE_EAV] Processing field "${key}":`, v);

    const label = v?.label || key;
    const field_id = v?.field_id || null;
    const field_type = v?.type || null;
    let value;

    if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) {
      value = String(v.value ?? '');
      // console.log(`  → Extracted value from object:`, value);
    } else if (typeof v === 'object') {
      value = JSON.stringify(v);
      // console.log(`  → Stringified object:`, value);
    } else {
      value = String(v ?? '');
      // console.log(`  → Direct value:`, value);
    }

    // console.log(`  → Final: cstm_col="${key}", lbl_col="${label}", value="${value}", field_id=${field_id}, field_type=${field_type}`);

    // Check if this is an auto-save field
    if (autoSaveFieldNames.has(key) || autoSaveFieldNames.has(label)) {
      // Route to t_ticket_work_data
      workDataRows.push([ticketId, service_id, key, value, 'auto_save', 'form_submission']);
      console.log(`🔑 [DataSeparation] Routed "${key}" to t_ticket_work_data`);
    } else {
      // Route to t_ticket_detail (normal)
      detailRows.push([ticketId, key, label, value, field_id, field_type, null, null, revision, JSON.stringify(v?.field_meta || v?.meta || { label, type: field_type })]);
    }
  }

  console.log(`📊 [SAVE_EAV] Prepared ${detailRows.length} detail rows, ${workDataRows.length} work_data rows`);
  if (workDataRows.length > 0) {
    console.table(workDataRows.map(r => ({ key: r[2], value: r[3].substring(0, 50) + '...' })));
  }

  if (detailRows.length) {
    await p.query('INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?', [detailRows]);
  }
  if (workDataRows.length) {
    await p.query('INSERT INTO hots.t_ticket_work_data (ticket_id, service_id, field_name, field_value, data_type, entity_id) VALUES ?', [workDataRows]);
  }
}

const EngineController = {

  /**
 * Create User Approval Ticket (Ported from ticketController.js)
 * 1. Look up department_head from user's department
 * 2. Fallback to IT Leader (dept 10) + HR Leader (dept 1) if no department_head
 */
  async addTicketUserApproval(user_id, department_id, new_user_details) {
    let timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('id') + ' : ';
    let service_id = 21; // SERVICE_IDS.USER_APPROVAL hardcoded

    try {
      console.log(timestamp, `🎫 Creating User Approval Ticket (Engine) for user_id: ${user_id}, department_id: ${department_id}`);

      // Step 1: Get department_head and department_name from m_department
      let approvers = [];
      let department_name = 'Unknown';

      if (department_id) {
        const [deptResult] = await dbHots.promise().query(
          `SELECT department_head, department_name FROM m_department WHERE department_id = ?`,
          [department_id]
        );

        if (deptResult.length > 0) {
          department_name = deptResult[0].department_name || 'Unknown';
          if (deptResult[0].department_head) {
            approvers.push(deptResult[0].department_head);
            console.log(timestamp, `✅ Found Department Head: ${deptResult[0].department_head}`);
          }
        }
      }

      // Step 2: Fallback - If no department_head, get IT Leader (dept 10) and HR Leader (dept 1)
      if (approvers.length === 0) {
        console.log(timestamp, `⚠️ No department_head found - using IT & HR fallback`);

        const [fallbackResult] = await dbHots.promise().query(
          `SELECT department_id, department_head 
           FROM m_department 
           WHERE department_id IN (1, 10) 
           AND department_head IS NOT NULL`
        );

        for (const dept of fallbackResult) {
          if (dept.department_head) {
            approvers.push(dept.department_head);
            console.log(timestamp, `✅ Fallback approver from dept ${dept.department_id}: ${dept.department_head}`);
          }
        }
      }

      // Step 3: Generate ticket ID using existing helper
      const ticketId = await generateCustomTicketID(dbHots, service_id, user_id);
      console.log(timestamp, `🎫 Generated Ticket ID: ${ticketId}`);

      // Step 4: Create ticket with CORRECT ENGINE SCHEMA
      await dbHots.promise().execute(`
          INSERT INTO t_ticket (
              ticket_id, service_id, status_id, created_by, creation_date, last_update, workflow_step
          ) VALUES (?, ?, 1, ?, NOW(), NOW(), 1)
      `, [ticketId, service_id, user_id]);

      // Step 5: Insert ticket details (Name, Department, Email)
      const fullName = `${new_user_details.firstname} ${new_user_details.lastname}`;
      const detailRows = [
        [ticketId, 'name', 'Name', fullName, null, 'text', null, null, 0, JSON.stringify({ label: 'Name' })],
        [ticketId, 'department', 'Proposed Department', department_name, null, 'text', null, null, 0, JSON.stringify({ label: 'Proposed Department' })],
        [ticketId, 'email', 'Email', new_user_details.email, null, 'text', null, null, 0, JSON.stringify({ label: 'Email' })]
      ];

      await dbHots.promise().query(
        'INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?',
        [detailRows]
      );

      console.log(timestamp, `🎫 Ticket created: ${ticketId}`);

      // Step 6: Insert approval events with CORRECT ENGINE SCHEMA
      if (approvers.length > 0) {
        for (const approver_id of approvers) {
          await dbHots.promise().execute(`
              INSERT INTO t_ticket_event (
                  ticket_id, approver_id, approval_order, approval_status,
                  event_type, approver_leader, created_at
              ) VALUES (?, ?, 1, 0, 'approve', 1, NOW())
          `, [ticketId, approver_id]);
          console.log(timestamp, `✅ Added approver: ${approver_id}`);
        }

        // Send email to all approvers
        for (const approver_id of approvers) {
          const [approverData] = await dbHots.promise().query("SELECT email, firstname FROM user WHERE user_id = ?", [approver_id]);
          if (approverData.length > 0 && approverData[0].email) {
            hotsMailer(
              approverData[0].email,
              'Action Required: New User Approval',
              `
              <div>
                  <p>Dear ${approverData[0].firstname},</p>
                  <p>A new user <strong>${fullName}</strong> has registered and verified their email.</p>
                  <p><strong>Proposed Department:</strong> ${department_name}</p>
                  <p><strong>Email:</strong> ${new_user_details.email}</p>
                  <p>Please review and approve this request in the HOTS system.</p>
                  <p>Ticket ID: ${ticketId}</p>
              </div>
              `
            );
            console.log(timestamp, `📧 Email sent to: ${approverData[0].email}`);
          }
        }
      } else {
        console.log(timestamp, `⚠️ No approvers found - ticket created without approval events`);
      }

      console.log(timestamp, "✅ addTicketUserApproval success", ticketId);
      return { success: true, ticketId };

    } catch (err) {
      console.log(timestamp, "❌ error addTicketUserApproval", err);
      return { success: false, error: err.message };
    }
  },

  /* CREATE */
  async create(req, res) {
    try {
      console.log('🔥 [ENGINE][CREATE] Starting ticket creation...');
      // allow service_id or service_name/moduleKey
      let { service_id, service_name, moduleKey } = req.body || {};

      // Fallback: check params (e.g. POST /engine/create/:moduleKey)
      if (!moduleKey && req.params && req.params.moduleKey) {
        moduleKey = req.params.moduleKey;
      }

      const moduleKeyResolved = moduleKey || service_name;
      let module = null;

      if (service_id) module = engineLoader.getServiceConfig(Number(service_id));
      if (!module && moduleKeyResolved) module = engineLoader.getServiceConfig(moduleKeyResolved);

      if (!module) {
        console.error('🔍 moduleKey =', moduleKeyResolved);
        console.error('🔍 service_id =', service_id);
        return res.status(404).json({ ok: false, error: 'Module not found' });
      }

      const { company_id, creator_id, creator_email, form_data, title } = req.body || {};
      console.log('🔍 Loaded module =', module.module_key || module.module_name);


      // Validate form (if form exists)
      const formDesc = await FormLoader.getFormByModuleKey(module.module_key);
      if (formDesc) {
        const errors = FormLoader.validate(formDesc, form_data || {});
        if (errors.length) {
          console.log('❌ Validation errors:', errors);
          return res.status(400).json({ ok: false, errors });
        }
      }

      const ticket_id = await generateCustomTicketID(dbHots, service_id, creator_id);

      const result = await new Promise((resolve, reject) => {
        dbHots.getConnection(async (err, conn) => {
          if (err) return reject(err);
          const p = conn.promise();
          try {
            await p.beginTransaction();

            // build workflow from DB (using module.workflow_id)
            const workflow = await workflowEngine.loadWorkflow(module);
            // console.log('🔍 Workflow loaded:', workflow);

            const approvers = await workflowEngine.resolveApprovers(workflow, { actor: { user_id: creator_id }, ticket: { ticket_id }, formData: form_data });
            // console.log('🔍 Approvers resolved:', approvers);

            // ensure service_id value for header
            const sid = module.service_id || service_id || null;

            // insert header into t_ticket
            // 🧩 AUTO-STATUS: If no approvers resolved, set status to 1 (Fulfilled/Active) instead of 2 (Waiting)
            // Status 1 = Fulfilled (Green), Status 3 = In Progress (Orange)
            const initialStatus = (approvers && approvers.length > 0) ? 2 : 1;

            await p.query(
              `INSERT INTO t_ticket
               (ticket_id, parent_ticket_id, company_id, service_id, service_name,
                created_by, creator_email, status_id, workflow_step, creation_date, submitted_at,
                last_update, engine_version, json_snapshot, title)
               VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW(), NOW(), ?, ?, ?)`,
              [
                ticket_id,
                company_id || null,
                sid,
                module.module_name || module.module_key,
                creator_id || null,
                creator_email || null,
                initialStatus,
                module.engine_version || 4,
                JSON.stringify(form_data || {}),
                title || module.module_name
              ]
            );

            // insert details (EAV) — pass serviceItems for data separation
            await saveEav(p, ticket_id, form_data, null, module.items, sid);

            let firstPending = null;
            for (const step of approvers) {
              for (const uid of step.approver_ids || []) {
                // approval_status: 0=pending, 1=approved, 2=rejected
                // We set 0 for pending. 'waiting' is not a standard status in HOTS, usually just 0.
                // But if we want to distinguish waiting, we might need another way.
                // For now, let's use 0 for all pending/waiting.
                const status = 0;
                if (firstPending === null && step.level === 1) firstPending = uid;
                const leader = step.approver_leaders?.[uid] ?? 0;


                // console.log(`🔍 Creating approval event: ticket=${ticket_id}, level=${step.level}, approver=${uid}, status=${status}, leader=${leader}`);
                await p.query(
                  `INSERT INTO t_ticket_event
                (ticket_id, event_type, approval_order, approver_id, approval_status, approver_leader, created_at)
                VALUES (?, "approve", ?, ?, ?, ?, NOW())`,
                  [ticket_id, step.level, uid, status, leader]
                );

              }
            }

            // submit event (history/log) - HOTS usually doesn't have a 'submit' event in t_ticket_event, but we can add it if needed.
            // Or maybe just skip it to align with HOTS strict schema.
            // Let's keep it but use correct columns if we really want it.
            // Actually, t_ticket_event is for APPROVALS.
            // Let's skip inserting 'submit' event into t_ticket_event to avoid pollution.

            // update workflow level in header
            const workflow_step = approvers.length ? approvers[0].level : 0;
            await p.query('UPDATE t_ticket SET workflow_step = ?, last_update = NOW() WHERE ticket_id = ?', [workflow_step, ticket_id]);

            await p.commit();
            conn.release();

            // run triggers
            await triggerEngine.runTriggersForEvent(module.module_key, 'on_create', { ticketId: ticket_id, actor: { user_id: creator_id }, formData: form_data, moduleKey: module.module_key });
            await triggerEngine.runTriggersForEvent(module.module_key, 'on_submit', { ticketId: ticket_id, actor: { user_id: creator_id }, formData: form_data, moduleKey: module.module_key });

            // 🧩 Extra: if auto-fulfill, run workflow_complete trigger
            if (approvers.length === 0) {
              await triggerEngine.runTriggersForEvent(module.module_key, 'workflow_complete', { ticketId: ticket_id, actor: { user_id: creator_id }, moduleKey: module.module_key, status: 1 });
            }

            resolve({ ok: true, ticket_id, next_approver: firstPending, workflow_steps: approvers.length, auto_fulfilled: approvers.length === 0 });
          } catch (e) {
            try { await conn.promise().rollback(); } catch (_) { }
            conn.release();
            reject(e);
          }
        });
      });

      // 🆕 SSE: Notify first approver about new ticket in their inbox
      console.log(`🔍 [SSE_DEBUG] Checking SSE emit. Manager: ${!!global.sseManager}, NextApprover: ${result.next_approver}`);

      if (global.sseManager && result.next_approver) {
        console.log(`📡 [SSE_DEBUG] Emitting approval_needed to ${result.next_approver}`);
        global.sseManager.emitToUser(result.next_approver, 'approval_needed', {
          ticketId: result.ticket_id,
          serviceName: module.module_name,
          url: `/ticket/${result.ticket_id}`
        }, {
          title: 'Approval Required',
          message: `Ticket #${result.ticket_id} (${module.module_name}) requires your approval`
        });

        // 🆕 PUSH COUNTER for next approver
        try {
          const { pushCountersToUser } = require('../../core/sse-helper');
          pushCountersToUser(result.next_approver);
        } catch (e) { console.error('SSE Push Error:', e.message); }
      } else {
        console.warn(`⚠️ [SSE_DEBUG] Skipping emit. conditions not met.`);
      }

      return res.json(result);
    } catch (err) {
      log('create error', err);
      return res.status(500).json({ ok: false, error: err.message || err });
    }
  },

  /* STATUS */
  async status(req, res) {
    try {
      const { ticket_id } = req.params;
      const [hdrRows] = await dbHots.promise().query('SELECT * FROM t_ticket WHERE ticket_id=?', [ticket_id]);
      if (!hdrRows.length) return res.status(404).json({ ok: false, error: 'not found' });
      const events = (await dbHots.promise().query('SELECT * FROM t_ticket_event WHERE ticket_id=? ORDER BY approval_order ASC, event_id ASC', [ticket_id]))[0];
      const rev = (await dbHots.promise().query('SELECT MAX(revision) rev FROM t_ticket_detail WHERE ticket_id=?', [ticket_id]))[0];
      return res.json({ ok: true, ticket: hdrRows[0], events, revision: rev[0]?.rev || null });
    } catch (e) {
      log('status error', e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async dashboard(req, res) {
    const userId = req.dataToken.user_id;
    try {
      // 1. My Approvals (Pending) - ONLY event_type = 'approve'
      const [approvalRows] = await dbHots.promise().query(
        `SELECT COUNT(*) as count 
         FROM t_ticket_event 
         WHERE approver_id = ? 
         AND approval_status = ?
         AND event_type = ?`,
        [userId, APPROVAL_STATUS.PENDING, EVENT_TYPES.APPROVAL]
      );

      // 2. My Assignments (Tasks) - event_type = 'assignment' OR 'task'
      const [assignmentRows] = await dbHots.promise().query(
        `SELECT COUNT(*) as count 
         FROM t_ticket_assignment 
         WHERE assigned_to = ? 
         AND status = 'pending'`,
        [userId]
      );

      // Also check t_ticket_event for task/assignment event types
      const [eventAssignmentRows] = await dbHots.promise().query(
        `SELECT COUNT(*) as count 
         FROM t_ticket_event 
         WHERE approver_id = ? 
         AND approval_status = ?
         AND event_type IN (?, 'task')`,
        [userId, APPROVAL_STATUS.PENDING, EVENT_TYPES.ASSIGNMENT]
      );

      res.json({
        ok: true,
        myApprovals: approvalRows[0].count,
        myAssignments: assignmentRows[0].count + eventAssignmentRows[0].count,
        // legacy compat
        count: approvalRows[0].count + assignmentRows[0].count + eventAssignmentRows[0].count
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },

  /* APPROVE */
  async approve(req, res) {
    try {
      const { ticket_id, approver_id, note, remark } = req.body || {};
      const approvalNote = note || remark || ''; // Accept both field names
      if (!ticket_id)
        return res.status(400).json({ ok: false, error: 'ticket_id required' });

      const [hdrRows] = await dbHots.promise().query(
        'SELECT * FROM t_ticket WHERE ticket_id=? LIMIT 1',
        [ticket_id]
      );
      if (!hdrRows.length)
        return res.status(404).json({ ok: false, error: 'Ticket not found' });

      const header = hdrRows[0];

      const module =
        engineLoader.getServiceConfig(header.service_name) ||
        engineLoader.getServiceConfig(header.service_id);

      if (!module) {
        console.error('approve(): module not found', header.service_name, header.service_id);
        return res.status(500).json({ ok: false, error: 'module not found for ticket' });
      }

      // 🔥 Validation: Ensure user is pending approver
      const [valid] = await dbHots.promise().query(
        `
        SELECT 1 
        FROM t_ticket_event
        WHERE ticket_id = ?
          AND approval_order = ?
          AND approver_id = ?
          AND approval_status = 0
        LIMIT 1
      `,
        [ticket_id, header.workflow_step, approver_id]
      );

      if (!valid.length) {
        return res.status(400).json({
          ok: false,
          error: "You are not allowed to approve this step anymore, please reload the page"
        });
      }

      const result = await workflowEngine.approve({
        ticket_id,
        approver_id,
        note: approvalNote,
        module,
        dbHots
      });

      console.log(`🔍 [APPROVE] Workflow result:`, result);

      // 🔥 Silent Refresh / Real-time Updates
      if (result.ok) {
        // 1. Notify current approver to refresh their sidebar/count
        sseHelper.pushCountersToUser(approver_id);

        if (result.final) {
          // 2. Notify requester that ticket is fully approved
          if (header.created_by) {
            sseHelper.pushCountersToUser(header.created_by);
            global.sseManager?.emitToUser(header.created_by, 'ticket_approved', {
              ticket_id,
              message: `Ticket ${ticket_id} has been fully approved.`
            });
          }
        } else if (result.next_approver_ids) {
          // 3. Notify next approvers
          for (const nextId of result.next_approver_ids) {
            sseHelper.pushCountersToUser(nextId);
            global.sseManager?.emitToUser(nextId, 'approval_needed', {
              ticket_id,
              service_id: header.service_id,
              message: `New approval request for ticket ${ticket_id}`
            });
          }
        }
      }

      // 🔥 additional trigger for fully approved
      if (result.final === true) {
        // If tasks were created, status is PENDING (5), otherwise FULFILLED (1)
        const newStatus = (result.tasksCreated && result.tasksCreated > 0) ? STATUS_IDS.PENDING : STATUS_IDS.FULFILLED;
        console.log(`🔍 [APPROVE] Final approval! tasksCreated=${result.tasksCreated}, newStatus=${newStatus}`);

        await triggerEngine.runTriggersForEvent(
          module.module_key,
          'workflow_complete',
          {
            ticketId: ticket_id,
            actor: { user_id: approver_id },
            moduleKey: module.module_key,
            status: newStatus
          }
        );
      }

      // Determine currentStatus to pass to on_approve trigger
      let currentStatus = null;
      if (result.final) {
        currentStatus = (result.tasksCreated && result.tasksCreated > 0) ? STATUS_IDS.PENDING : STATUS_IDS.FULFILLED;
      }

      await triggerEngine.runTriggersForEvent(
        module.module_key,
        'on_approve',
        {
          ticketId: ticket_id,
          actor: { user_id: approver_id },
          moduleKey: module.module_key,
          status: currentStatus,
          isFinal: result.final,
          workflow_step: header.workflow_step,
          note: approvalNote // 🔥 Add note for has_notes condition
        }
      );

      if (global.io) {
        global.io.emit("message", "engine_approve_" + ticket_id);
      }

      // 🆕 SSE: Emit targeted events to relevant users
      if (global.sseManager) {
        // Notify ticket creator
        global.sseManager.emitToUser(header.created_by, 'ticket_status_update', {
          ticketId: ticket_id,
          action: 'approved',
          isFinal: result.final,
          url: `/ticket/${ticket_id}`
        }, {
          title: result.final ? 'Ticket Approved' : `Step ${header.workflow_step} Approved`,
          message: `Your ticket #${ticket_id} has been ${result.final ? 'fully approved' : `approved at step ${header.workflow_step}`}`
        });

        // Notify next approver (if exists)
        if (result.next_approver) {
          global.sseManager.emitToUser(result.next_approver, 'approval_needed', {
            ticketId: ticket_id,
            url: `/ticket/${ticket_id}`
          }, {
            title: 'Approval Required',
            message: `Ticket #${ticket_id} follows up for your approval`
          });
        }

        // 🆕 PUSH COUNTERS
        try {
          const { pushCountersToUser } = require('../../core/sse-helper');
          // 1. Update THIS approver (count - 1)
          pushCountersToUser(approver_id);

          // 2. Update NEXT approver (count + 1), if any
          if (result.next_approver) {
            pushCountersToUser(result.next_approver);
          }
        } catch (e) { console.error('SSE Push Error:', e.message); }
      }

      return res.json(result);

    } catch (e) {
      log('approve error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },

  /* REJECT */
  async reject(req, res) {
    try {
      const { ticket_id, approver_id, note } = req.body || {};
      if (!ticket_id)
        return res.status(400).json({ ok: false, error: 'ticket_id required' });

      const [hdrRows] = await dbHots.promise().query(
        'SELECT * FROM t_ticket WHERE ticket_id=? LIMIT 1',
        [ticket_id]
      );
      if (!hdrRows.length)
        return res.status(404).json({ ok: false, error: 'Ticket not found' });

      const header = hdrRows[0];

      const module =
        engineLoader.getServiceConfig(header.service_name) ||
        engineLoader.getServiceConfig(header.service_id);

      // 🔥 Validation: Ensure user is pending approver
      const [valid] = await dbHots.promise().query(
        `
        SELECT 1 
        FROM t_ticket_event
        WHERE ticket_id = ?
          AND approval_order = ?
          AND approver_id = ?
          AND approval_status = 0
        LIMIT 1
      `,
        [ticket_id, header.workflow_step, approver_id]
      );

      if (!valid.length) {
        return res.status(400).json({
          ok: false,
          error: "You are not allowed to reject this step anymore, please reload the page"  // ✔ Fixed here
        });
      }

      const result = await workflowEngine.reject({
        ticket_id,
        approver_id,
        note,
        module,
        dbHots
      });

      await triggerEngine.runTriggersForEvent(
        module.module_key,
        'on_reject',
        { ticketId: ticket_id, actor: { user_id: approver_id }, moduleKey: module.module_key }
      );

      if (global.io) {
        global.io.emit("message", "engine_reject_" + ticket_id);
      }

      // 🆕 SSE: Notify ticket creator that their ticket was rejected
      if (global.sseManager) {
        global.sseManager.emitToUser(header.created_by, 'ticket_status_update', {
          ticketId: ticket_id,
          action: 'rejected',
          note: note || '',
          url: `/ticket/${ticket_id}`
        }, {
          title: 'Ticket Rejected',
          message: `Your ticket #${ticket_id} was rejected. Note: ${note || 'No remark'}`
        });

        // 🆕 PUSH COUNTERS (Update THIS approver, count - 1)
        try {
          const { pushCountersToUser } = require('../../core/sse-helper');
          pushCountersToUser(approver_id);
        } catch (e) { console.error('SSE Push Error:', e.message); }
      }

      return res.json(result);

    } catch (e) {
      log('reject error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },


  /* LIST */
  async addComment(req, res) {
    try {
      const { ticket_id } = req.params;
      const { comment, user_id } = req.body;
      const commenterId = user_id || req.dataToken?.user_id;

      if (!ticket_id || (!comment && (!req.files || req.files.length === 0))) {
        return res.status(400).json({ ok: false, error: 'ticket_id and comment (or file) are required' });
      }

      console.log(`💬 [ENGINE] Adding comment to ticket ${ticket_id} by user ${commenterId}`);

      // 1. Insert Comment
      const [result] = await dbHots.promise().execute(`
        INSERT INTO t_ticket_comment
        (ticket_id, user_id, comment, date_created, status)
        VALUES
        (?, ?, ?, NOW(), 1)
      `, [ticket_id, commenterId, comment || '']);

      const commentId = result.insertId;

      // 2. Handle File Uploads (if any)
      if (req.files && req.files.length > 0) {
        const insertFileQuery = `
            INSERT INTO t_file_upload 
            (entity_type, entity_id, filename, original_name, file_path, file_size, mime_type, uploaded_by) 
            VALUES ?
          `;

        const fileValues = req.files.map(file => [
          'comment',
          commentId,
          file.filename,
          file.originalname,
          `/public/files/hots/it_support/${file.filename}`, // Assuming this path based on middleware
          file.size,
          file.mimetype,
          commenterId
        ]);

        await dbHots.promise().query(insertFileQuery, [fileValues]);
        console.log(`📎 [ENGINE] Attached ${req.files.length} files to comment ${commentId}`);
      }

      // 3. SSE: Identify Stakeholders and Broadcast
      if (global.sseManager) {
        // Fetch commenter name
        const [userRows] = await dbHots.promise().query('SELECT firstname, lastname FROM user WHERE user_id = ?', [commenterId]);
        const commenterName = userRows[0] ? `${userRows[0].firstname} ${userRows[0].lastname}` : 'Unknown User';

        // Fetch stakeholders: Creator, Assignees, Approvers, Previous Commenters
        const [stakeholders] = await dbHots.promise().query(`
            SELECT DISTINCT user_id FROM (
                -- Creator
                SELECT created_by as user_id FROM t_ticket WHERE ticket_id = ?
                UNION
                -- Current Assignee (User)
                SELECT assigned_id as user_id FROM t_ticket_assignment WHERE ticket_id = ? AND assigned_type = 'user'
                UNION
                -- Team Members (if assigned to team)
                SELECT tm.user_id 
                FROM t_ticket_assignment tta
                JOIN m_team_member tm ON tm.team_id = tta.assigned_id
                WHERE tta.ticket_id = ? AND tta.assigned_type = 'team'
                UNION
                -- Approvers
                SELECT approver_id as user_id FROM t_ticket_event WHERE ticket_id = ? AND event_type = 'approve'
                UNION
                -- Previous Commenters
                SELECT user_id FROM t_ticket_comment WHERE ticket_id = ?
            ) AS all_users
            WHERE user_id IS NOT NULL AND user_id != ?
        `, [ticket_id, ticket_id, ticket_id, ticket_id, ticket_id, commenterId]);

        const recipientIds = stakeholders.map(s => s.user_id);

        if (recipientIds.length > 0) {
          console.log(`📡 [ENGINE] Broadcasting comment to ${recipientIds.length} stakeholders:`, recipientIds);

          // Get service name for context
          const [ticketInfo] = await dbHots.promise().query('SELECT service_name FROM t_ticket WHERE ticket_id = ? LIMIT 1', [ticket_id]);
          const serviceName = ticketInfo[0]?.service_name || 'Ticket';

          global.sseManager.emitToUsers(recipientIds, 'new_comment', {
            ticketId: ticket_id,
            commenter_name: commenterName,
            message: comment || 'Sent an attachment',
            service_name: serviceName,
            url: `/ticket/${ticket_id}`
          });
        }
      }

      return res.json({ ok: true, message: 'Comment added', commentId });
    } catch (e) {
      console.error('addComment error', e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async list(req, res) {
    let timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('id') + ' : ';
    try {
      console.log(timestamp, `🔍 [ENGINE][LIST] Params:`, req.query);

      const { status, status_id, service_id, mine } = req.query;
      const user_id = req.dataToken?.user_id || null;
      let page = parseInt(req.query.page, 10) || 1;
      let limit = parseInt(req.query.limit, 10) || 20;
      const startIndex = (page - 1) * limit;
      let conditions = 'WHERE 1=1 ';

      // Handle service_id filter
      if (service_id) {
        conditions += ` AND t.service_id = ${dbHots.escape(service_id)} `;
      }

      // Handle legacy status filter
      if (status) {
        conditions += ` AND ts.status_name = ${dbHots.escape(status)} `;
      }

      // Handle status_id filter (supports comma-separated values)
      if (status_id) {
        const statusIds = status_id.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        if (statusIds.length > 0) {
          conditions += ` AND t.status_id IN (${statusIds.join(',')}) `;
        }
      }

      // Handle mine filter
      if (mine === 'true' && user_id) {
        conditions += ` AND t.created_by = ${dbHots.escape(user_id)} `;
      }

      const sql = `
        SELECT t.ticket_id, t.service_id, s.service_name, t.created_by,
               CONCAT(u.firstname, " ", u.lastname) creator_name,
               ts.status_name, t.status_id, t.workflow_step, t.creation_date, t.last_update,
               (
                 SELECT JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'approver_id', ae.approver_id,
                     'approver_leader', ae.approver_leader,
                     'approval_order', ae.approval_order,
                     'approver_name', COALESCE(NULLIF(TRIM(CONCAT(IFNULL(u2.firstname, ''), ' ', IFNULL(u2.lastname, ''))), ''), 'Superior'),
                     'approval_status', ae.approval_status,
                     'approval_date', ae.approve_date
                   )
                 )
                 FROM t_ticket_event ae
                 LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                 WHERE ae.ticket_id = t.ticket_id
               ) AS list_approval
        FROM t_ticket t
        LEFT JOIN m_service s ON s.service_id = t.service_id
        LEFT JOIN user u ON u.user_id = t.created_by
        LEFT JOIN m_service_status ts ON ts.status_id = t.status_id
        ${conditions}
        ORDER BY t.creation_date DESC
        LIMIT ${startIndex}, ${limit}
      `;

      console.log(timestamp, `🔍 [ENGINE][LIST] SQL:`, sql.replace(/\s+/g, ' ').trim().substring(0, 150) + "...");

      const [rows] = await dbHots.promise().query(sql);

      // Fetch form data for each ticket
      for (const ticket of rows) {
        const [eavRows] = await dbHots.promise().query(
          'SELECT cstm_col, lbl_col, value, field_type FROM t_ticket_detail WHERE ticket_id = ? AND (revision IS NULL OR revision = (SELECT MAX(revision) FROM t_ticket_detail WHERE ticket_id = ?))',
          [ticket.ticket_id, ticket.ticket_id]
        );

        // Convert EAV to flat object
        eavRows.forEach(row => {
          ticket[row.cstm_col] = row.value;
        });
      }

      // Debugging: Show first few rows
      // if (rows.length > 0) {
      //   console.table(rows.slice(0, 3).map(r => ({ id: r.ticket_id, svc: r.service_name, st: r.status_name, by: r.creator_name })));
      // } else {
      //   console.log(timestamp, "⚠️ [ENGINE][LIST] No rows found");
      // }

      const [countResult] = await dbHots.promise().query(`
        SELECT COUNT(*) as total 
        FROM t_ticket t
        LEFT JOIN m_service_status ts ON ts.status_id = t.status_id
        ${conditions}
      `);

      return res.json({
        success: true,
        page,
        limit,
        data: rows, // Frontend often uses .data or .rows
        rows,       // Keep for backward compat
        totalData: countResult[0].total,
        totalPage: Math.ceil(countResult[0].total / limit)
      });
    } catch (e) {
      log('list error', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /* myRequests */
  async myRequests(req, res) {
    let timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('id') + ' : ';
    try {
      const user_id = req.dataToken.user_id;
      const [rows] = await dbHots.promise().query(`
        SELECT t.ticket_id, t.service_id, s.service_name, t.status_id, ts.status_name as status, 
               t.workflow_step as workflow_level, t.creation_date, t.last_update,
               (
                 SELECT JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'approver_id', ae.approver_id,
                     'approver_leader', ae.approver_leader,
                     'approval_order', ae.approval_order,
                     'approver_name', COALESCE(NULLIF(TRIM(CONCAT(IFNULL(u2.firstname, ''), ' ', IFNULL(u2.lastname, ''))), ''), 'Superior'),
                     'approval_status', ae.approval_status,
                     'approval_date', ae.approve_date
                   )
                 )
                 FROM t_ticket_event ae
                 LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                 WHERE ae.ticket_id = t.ticket_id
               ) AS list_approval
        FROM t_ticket t 
        LEFT JOIN m_service s ON s.service_id = t.service_id
        LEFT JOIN m_service_status ts ON ts.status_id = t.status_id
        WHERE t.created_by = ? 
        ORDER BY t.creation_date DESC
      `, [user_id]);

      console.log(timestamp, `🔍 [ENGINE][MY_REQUESTS] Found ${rows.length} request(s)`);
      if (rows.length > 0) console.table(rows.slice(0, 3).map(r => ({ id: r.ticket_id, status: r.status, approvals: r.list_approval?.length || 0 })));

      return res.json({ success: true, requests: rows, data: rows });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /* dashboard */
  async dashboard(req, res) {
    let timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('id') + ' : ';
    try {
      const user_id = req.dataToken.user_id;

      const [statusRows] = await dbHots.promise().query(`
        SELECT ts.status_name as status, COUNT(*) AS total 
        FROM t_ticket t 
        LEFT JOIN m_service_status ts ON ts.status_id = t.status_id
        GROUP BY ts.status_name
      `);
      const summary = {}; statusRows.forEach(r => summary[r.status] = r.total);

      // Fix: use approver_id and approval_status AND workflow_step
      // Fixed Query to match sse-helper.js Logic
      const approvalSql = `
        SELECT COUNT(*) AS total 
        FROM t_ticket_event e 
        INNER JOIN t_ticket t ON t.ticket_id = e.ticket_id
        WHERE e.approver_id = ? 
          AND e.approval_status = 0
          AND e.approval_order = t.workflow_step
      `;
      const [approvals] = await dbHots.promise().query(approvalSql, [user_id]);
      summary.my_approvals = approvals[0].total;

      console.log(timestamp, `🔍 [ENGINE][DASHBOARD] Count Approvals for ${user_id}: ${summary.my_approvals}`);

      const [reqs] = await dbHots.promise().query('SELECT COUNT(*) AS total FROM t_ticket WHERE created_by = ?', [user_id]);
      summary.my_requests = reqs[0].total;

      const [serviceRows] = await dbHots.promise().query(`
        SELECT s.service_name, COUNT(*) total 
        FROM t_ticket t 
        LEFT JOIN m_service s ON s.service_id = t.service_id
        GROUP BY s.service_name
      `);
      summary.service_stats = serviceRows;

      console.log(timestamp, `🔍 [ENGINE][DASHBOARD] Summary loaded`);

      return res.json({ success: true, summary });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /* myApprovals */
  async myApprovals(req, res) {
    let timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('id') + ' : ';
    try {
      const user_id = req.dataToken.user_id;
      // Only show tickets where user is pending approver AND ticket is at their approval level
      const [rows] = await dbHots.promise().query(`
        SELECT t.ticket_id, t.service_id, s.service_name, t.status_id, ts.status_name, 
               e.approval_order, t.workflow_step, t.creation_date, t.last_update, 
               CONCAT(u.firstname, " ", u.lastname) as creator_name,
               (
                 SELECT JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'approver_id', ae.approver_id,
                     'approver_leader', ae.approver_leader,
                     'approval_order', ae.approval_order,
                     'approver_name', COALESCE(NULLIF(TRIM(CONCAT(IFNULL(u2.firstname, ''), ' ', IFNULL(u2.lastname, ''))), ''), 'Superior'),
                     'approval_status', ae.approval_status,
                     'approval_date', ae.approve_date
                   )
                 )
                 FROM t_ticket_event ae
                 LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                 WHERE ae.ticket_id = t.ticket_id
               ) AS list_approval
        FROM t_ticket_event e 
        INNER JOIN t_ticket t ON t.ticket_id = e.ticket_id 
        LEFT JOIN m_service s ON s.service_id = t.service_id
        LEFT JOIN m_service_status ts ON ts.status_id = t.status_id
        LEFT JOIN user u ON u.user_id = t.created_by
        WHERE e.approver_id = ? 
          AND e.approval_status = 0 
          AND e.approval_order = t.workflow_step
        ORDER BY t.creation_date DESC
      `, [user_id]);

      console.log(timestamp, `🔍 [ENGINE][MY_APPROVALS] Found ${rows.length} approval(s) for user ${user_id}`);

      // Standardize response for frontend task list
      return res.json({ success: true, approvals: rows, data: rows });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /* involvedApprovals */
  async involvedApprovals(req, res) {
    let timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('id') + ' : ';
    try {
      const user_id = req.dataToken.user_id;

      // Show tickets where user is an approver BUT it is NOT their turn (or they already approved)
      // Logic: In t_ticket_event as approver, but NOT (status=0 AND order=workflow_step)
      const [rows] = await dbHots.promise().query(`
      SELECT DISTINCT t.ticket_id, t.service_id, s.service_name, t.status_id, ts.status_name,
             t.workflow_step, t.creation_date, t.last_update,
             CONCAT(u.firstname, " ", u.lastname) as creator_name,
             (
               SELECT JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'approver_id', ae.approver_id,
                   'approver_leader', ae.approver_leader,
                   'approval_order', ae.approval_order,
                   'approver_name', COALESCE(NULLIF(TRIM(CONCAT(IFNULL(u2.firstname, ''), ' ', IFNULL(u2.lastname, ''))), ''), 'Superior'),
                   'approval_status', ae.approval_status,
                   'approval_date', ae.approve_date
                 )
               )
               FROM t_ticket_event ae
               LEFT JOIN user u2 ON u2.user_id = ae.approver_id
               WHERE ae.ticket_id = t.ticket_id
             ) AS list_approval
      FROM t_ticket_event e
      INNER JOIN t_ticket t ON t.ticket_id = e.ticket_id
      LEFT JOIN m_service s ON s.service_id = t.service_id
      LEFT JOIN m_service_status ts ON ts.status_id = t.status_id
      LEFT JOIN user u ON u.user_id = t.created_by
      WHERE e.approver_id = ?
        AND NOT (e.approval_status = 0 AND e.approval_order = t.workflow_step)
      ORDER BY t.creation_date DESC
    `, [user_id]);

      console.log(timestamp, `🔍 [ENGINE][INVOLVED] Found ${rows.length} involved ticket(s) for user ${user_id}`);

      return res.json({ success: true, data: rows });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /* cancel */
  async cancel(req, res) {
    try {
      const { ticket_id, user_id } = req.body || {};
      if (!ticket_id) return res.status(400).json({ ok: false, error: 'ticket_id required' });
      const conn = await dbHots.promise().getConnection();
      const p = conn.promise();
      try {
        await p.beginTransaction();
        const [rows] = await p.query('SELECT * FROM t_ticket WHERE ticket_id = ?', [ticket_id]);
        if (!rows.length) throw new Error('ticket not found');
        const header = rows[0];
        if (String(header.created_by) !== String(user_id)) throw new Error('not authorized to cancel');
        if (!['submitted', 'draft'].includes(header.status)) throw new Error('Cannot cancel ticket. It has already entered approval.');
        await p.query('UPDATE t_ticket SET status = ?, last_update = NOW() WHERE ticket_id = ?', ['cancelled', ticket_id]);
        await p.query('INSERT INTO t_ticket_event (ticket_id, event_type, approval_order, actor_id, status, created_at) VALUES (?, "cancel", 0, ?, ?, NOW())', [ticket_id, user_id, 'cancelled']);
        await p.query('INSERT INTO t_ticket_history (ticket_id, actor_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, NOW())', [ticket_id, user_id, 'cancelled', JSON.stringify({})]);
        await p.commit();
        conn.release();
        await triggerEngine.runTriggersForEvent(header.service_name, 'on_cancel', { ticketId: ticket_id, actor: { user_id }, moduleKey: header.service_name });
        return res.json({ ok: true });
      } catch (e) {
        await p.rollback().catch(() => { });
        conn.release();
        throw e;
      }
    } catch (e) {
      log('cancel error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },

  /* requestRevision */
  async requestRevision(req, res) {
    try {
      const { ticket_id, approver_id, note } = req.body || {};
      if (!ticket_id) return res.status(400).json({ ok: false, error: 'ticket_id required' });
      const conn = await dbHots.promise().getConnection();
      const p = conn.promise();
      try {
        await p.beginTransaction();
        const [rows] = await p.query('SELECT * FROM t_ticket_event WHERE ticket_id = ? AND status IN (?,?) ORDER BY approval_order ASC LIMIT 1', [ticket_id, 'pending', 'waiting']);
        if (!rows.length) throw new Error('no pending approval');
        const pending = rows[0];
        await p.query('UPDATE t_ticket_event SET status = ?, actor_id = ?, note = ?, last_update = NOW() WHERE event_id = ?', ['revision_requested', approver_id || null, note || null, pending.event_id]);
        await p.query('UPDATE t_ticket SET status = ?, workflow_level = 0, last_update = NOW() WHERE ticket_id = ?', ['revision_requested', ticket_id]);
        await p.query('INSERT INTO t_ticket_history (ticket_id, actor_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, NOW())', [ticket_id, approver_id, 'revision_requested', JSON.stringify({ note })]);
        await p.commit();
        conn.release();
        const [[hdr]] = await dbHots.promise().query('SELECT service_name FROM t_ticket WHERE ticket_id=?', [ticket_id]);
        await triggerEngine.runTriggersForEvent(hdr.service_name, 'on_revision', { ticketId: ticket_id, actor: { user_id: approver_id } });
        return res.json({ ok: true });
      } catch (e) {
        await p.rollback().catch(() => { });
        conn.release();
        throw e;
      }
    } catch (e) {
      log('requestRevision error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },

  /* resubmitDo */
  async resubmitDo(req, res) {
    try {
      const tid = (req.params && req.params.ticket_id) || (req.body && req.body.ticket_id);
      const { form_data, user_id } = req.body || {};
      if (!tid) return res.status(400).json({ ok: false, error: 'ticket_id required' });

      const [hdrRows] = await dbHots.promise().query('SELECT * FROM t_ticket WHERE ticket_id = ?', [tid]);
      const header = hdrRows[0];
      if (!header) return res.status(404).json({ ok: false, error: 'ticket not found' });

      const revRow = (await dbHots.promise().query('SELECT MAX(revision) rev FROM t_ticket_detail WHERE ticket_id = ?', [tid]))[0];
      const newRevision = (revRow[0] && revRow[0].rev ? revRow[0].rev : 0) + 1;

      const eavRows = [];
      for (const key of Object.keys(form_data || {})) {
        const v = form_data[key];
        const label = v?.label || key;
        const value = (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) ? String(v.value ?? '') : (typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
        const field_id = v?.field_id || null;
        const field_type = v?.type || null;
        const field_meta = v?.field_meta || v?.meta || { label, type: field_type };
        eavRows.push([tid, key, label, value, field_id, field_type, null, null, newRevision, JSON.stringify(field_meta)]);
      }

      const conn = await dbHots.promise().getConnection();
      const p = conn.promise();
      try {
        await p.beginTransaction();
        if (eavRows.length) await p.query('INSERT INTO t_ticket_detail (ticket_id,cstm_col,lbl_col,value,field_id,field_type,row_index,column_key,revision,field_meta_json) VALUES ?', [eavRows]);

        await p.query('UPDATE t_ticket SET status=?, revision=?, workflow_level=0, last_update=NOW() WHERE ticket_id=?', ['submitted', newRevision, tid]);

        const workflowDef = await workflowEngine.loadWorkflow(header.service_id || header.service_name);
        const approvers = await workflowEngine.resolveApprovers(workflowDef, { actor: { user_id: header.created_by }, ticket: { ticket_id: tid }, formData: form_data });

        await p.query('DELETE FROM t_ticket_event WHERE ticket_id = ?', [tid]);
        await p.query('INSERT INTO t_ticket_event (ticket_id,event_type,approval_order,actor_id,status,created_at) VALUES (?, "submit", 0, ?, ?, NOW())', [tid, header.created_by || null, 'completed']);

        let firstPending = null;
        for (const step of approvers) {
          const isFirst = step.level === 1;
          if (Array.isArray(step.approver_ids)) {
            for (let i = 0; i < step.approver_ids.length; i++) {
              const uid = step.approver_ids[i];
              const status = (isFirst && firstPending === null && i === 0) ? 'pending' : 'waiting';
              if (status === 'pending' && firstPending === null) firstPending = uid;
              await p.query('INSERT INTO t_ticket_event (ticket_id,event_type,approval_order,actor_id,status,created_at) VALUES (?, "approve", ?, ?, ?, NOW())', [tid, step.level, uid, status]);
            }
          } else {
            const uid = step.approver_id || null;
            const status = (isFirst && firstPending === null) ? 'pending' : 'waiting';
            if (status === 'pending' && firstPending === null) firstPending = uid;
            await p.query('INSERT INTO t_ticket_event (ticket_id,event_type,approval_order,actor_id,status,created_at) VALUES (?, "approve", ?, ?, ?, NOW())', [tid, step.level, uid, status]);
          }
        }

        await p.query('INSERT INTO t_ticket_history (ticket_id, actor_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, NOW())', [tid, user_id, 'resubmitted', JSON.stringify({ newRevision })]);
        await p.commit();
        conn.release();

        await triggerEngine.runTriggersForEvent(header.service_name, 'on_resubmit', { ticketId: tid, actor: { user_id }, formData: form_data, moduleKey: header.service_name });

        return res.json({ ok: true, ticket_id: tid, newRevision, next_approver: firstPending });
      } catch (e) {
        await p.rollback().catch(() => { });
        conn.release();
        throw e;
      }
    } catch (e) {
      log('resubmitDo error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },

  /* resubmitPrefill */
  async resubmitPrefill(req, res) {
    try {
      const { ticket_id } = req.params;
      if (!ticket_id) return res.status(400).json({ ok: false, error: 'ticket_id required' });
      const [hdrRows] = await dbHots.promise().query('SELECT * FROM t_ticket WHERE ticket_id = ?', [ticket_id]);
      const header = hdrRows[0];
      if (!header) return res.status(404).json({ ok: false, error: 'ticket not found' });

      const [eavRows] = await dbHots.promise().query('SELECT * FROM t_ticket_detail WHERE ticket_id = ? ORDER BY revision ASC, row_index ASC', [ticket_id]);

      const form_values = {};
      for (const r of eavRows) {
        const fid = r.field_id || r.cstm_col || null;
        const key = fid || r.cstm_col;
        const meta = r.field_meta_json ? JSON.parse(r.field_meta_json) : { label: r.lbl_col };
        if (r.field_type === 'rowgroup' || r.row_index !== null) {
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
      log('resubmitPrefill error', e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  /* DETAIL (Migrated from Legacy) */
  async detail(req, res) {
    try {
      const ticket_id = req.params.ticket_id;
      if (!ticket_id) {
        return res.status(400).send({ success: false, message: "ticket_id must be provided" });
      }

      const queryGetTicketDetail = `
        SELECT 
            t.ticket_id,
            t.creation_date,
            t.service_id,
            s.service_name,
            t.status_id,
            s.widget,
            ts.status_name AS status,
            ts.color_hex AS color,

            -- Assigned single name
            CASE
                WHEN tta.assigned_type = 'user' THEN CONCAT(u_as.firstname, ' ', u_as.lastname)
                WHEN tta.assigned_type = 'team' THEN tm.team_name
                WHEN tta.assigned_type = 'department' THEN md.department_name
                ELSE NULL
            END AS assigned_to,

            -- Assigned list (full JSON)
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'type', tta.assigned_type,
                    'id', tta.assigned_id,
                    'name',
                        CASE tta.assigned_type
                            WHEN 'user' THEN CONCAT(u_as.firstname, ' ', u_as.lastname)
                            WHEN 'team' THEN tm.team_name
                            WHEN 'department' THEN md.department_name
                            ELSE NULL
                        END
                )
            ) AS assigned_list,

            t.last_update,
            t.reject_reason AS reason,
            t.fulfilment_comment,
            t.workflow_step,

            CONCAT(u_cr.firstname, ' ', u_cr.lastname) AS created_by_name,
            u_cr.user_id,
            dpt.department_id AS dept_id,
            dpt.department_name AS department_name,
            dpt.department_shortname AS dept_shortname,

            -- Ticket detail rows (ORDERED FIX)
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'order_col', x.order_col,
                        'cstm_col', x.value,
                        'lbl_col', x.lbl_col,
                        'key', x.cstm_col
                    )
                )
                FROM (
                    SELECT td.order_col, td.value, td.lbl_col, td.cstm_col
                    FROM t_ticket_detail td
                    WHERE td.ticket_id = t.ticket_id
                    ORDER BY td.order_col
                ) AS x
            ) AS detail_rows,

            -- Current approver name
            (
                SELECT CONCAT(u3.firstname, ' ', u3.lastname)
                FROM t_ticket_event ae3
                LEFT JOIN user u3 ON u3.user_id = ae3.approver_id
                WHERE ae3.ticket_id = t.ticket_id 
                  AND ae3.approval_order = t.workflow_step
                LIMIT 1
            ) AS current_approver_name,

            -- Current approver ID
            (
                SELECT ae3.approver_id
                FROM t_ticket_event ae3
                WHERE ae3.ticket_id = t.ticket_id 
                  AND ae3.approval_order = t.workflow_step
                LIMIT 1
            ) AS current_approver_id,

            -- Approval Status
            CASE 
                WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.ticket_id = t.ticket_id AND ae.approval_status = 0)
                    THEN 0
                WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.ticket_id = t.ticket_id AND ae.approval_status = 2)
                    THEN 2
                ELSE 1
            END AS approval_status,

            -- File attachments
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'upload_id', f.upload_id,
                        'filename', f.filename,
                        'path', f.file_path,
                        'size', f.file_size
                    )
                )
                FROM t_file_upload f
                WHERE f.entity_type = 'ticket' AND f.entity_id = t.ticket_id
            ) AS files,

            -- Approval events list
           (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'approver_id', x.approver_id,
                    'approver_name', x.approver_name,
                    'approval_order', x.approval_order,
                    'approval_status', x.approval_status,
                    'approval_date', x.approval_date,
                    'remark', x.remark,
                    'event_type', x.event_type,
                    'approver_leader', x.approver_leader,
                    'event_meta', x.event_meta,
                    'task_name', x.event_meta_task_name,
                    'assigned_value', x.assigned_value,
                    'created_at', x.created_at
                )
            )
            FROM (
                SELECT
                    ae.approver_id,
                    CONCAT(u2.firstname, ' ', u2.lastname) AS approver_name,
                    ae.approval_order,
                    ae.approval_status,
                    DATE_FORMAT(ae.approve_date, '%Y-%m-%d %H:%i:%s') AS approval_date,
                    ae.remark,
                    ae.event_type,
                    ae.approver_leader,
                    ae.event_meta,
                    ae.created_at,
                    JSON_UNQUOTE(JSON_EXTRACT(ae.event_meta, '$.task_name')) AS event_meta_task_name, -- Extract task_name
                    CASE 
                         WHEN ae.event_type = 'task' THEN 
                             (SELECT GROUP_CONCAT(COALESCE(u_task.firstname, t_team.team_name) SEPARATOR ', ')
                              FROM t_ticket_assignment ta_task
                              LEFT JOIN user u_task ON ta_task.assigned_id = u_task.user_id AND ta_task.assigned_type = 'user'
                              LEFT JOIN m_team t_team ON ta_task.assigned_id = t_team.team_id AND ta_task.assigned_type = 'team'
                              WHERE ta_task.ticket_id = ae.ticket_id)
                         ELSE NULL
                    END AS assigned_value

                FROM t_ticket_event ae
                LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                WHERE ae.ticket_id = t.ticket_id
                ORDER BY ae.approval_order ASC, ae.event_id ASC -- Fixed ordering
            ) AS x
        ) AS list_approval


        FROM t_ticket t
        LEFT JOIN m_service s ON s.service_id = t.service_id
        LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

        LEFT JOIN user u_as ON 
            u_as.user_id = tta.assigned_id 
            AND tta.assigned_type = 'user'

        LEFT JOIN m_team tm ON 
            tm.team_id = tta.assigned_id 
            AND tta.assigned_type = 'team'

        LEFT JOIN m_department md ON
            md.department_id = tta.assigned_id
            AND tta.assigned_type = 'department'

        LEFT JOIN m_service_status ts ON ts.status_id = t.status_id

        LEFT JOIN user u_cr ON u_cr.user_id = t.created_by
        LEFT JOIN m_department dpt ON dpt.department_id = u_cr.department_id

        WHERE t.ticket_id = ? 
        GROUP BY t.ticket_id;
      `;

      const [rows] = await dbHots.promise().query(queryGetTicketDetail, [ticket_id]);

      if (rows.length === 0) {
        return res.status(404).send({ success: false, message: "Ticket not found" });
      }

      return res.status(200).send({
        success: true,
        data: rows[0]
      });

    } catch (e) {
      log('detail error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },

  /* UPDATE DETAIL (Migrated from Legacy) */
  async updateDetail(req, res) {
    try {
      const ticket_id = req.params.ticket_id;
      const { detailFields } = req.body;

      if (!ticket_id || !Array.isArray(detailFields)) {
        return res.status(400).send({
          success: false,
          message: "ticket_id and detailFields[] are required"
        });
      }

      const updatePromises = detailFields.map((field) => {
        const { cstm_col = '', lbl_col = '', order_col } = field;
        if (!order_col) return null;

        return dbHots.promise().execute(
          `
          INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, order_col)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
              cstm_col = VALUES(cstm_col),
              lbl_col = VALUES(lbl_col)
          `,
          [ticket_id, cstm_col, lbl_col, order_col]
        );
      }).filter(Boolean);

      await Promise.all(updatePromises);

      return res.status(200).send({
        success: true,
        message: "Ticket detail updated successfully"
      });

    } catch (e) {
      log('updateDetail error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },

  /* revisionList/revisionGet */
  async revisionList(req, res) {
    try {
      const { ticket_id } = req.params;
      const [rows] = await dbHots.promise().query('SELECT DISTINCT revision FROM t_ticket_detail WHERE ticket_id = ? ORDER BY revision ASC', [ticket_id]);
      const revisions = rows.map(r => r.revision).filter(r => r !== null);
      return res.json({ ok: true, revisions, latest: revisions.length ? revisions[revisions.length - 1] : null });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async revisionGet(req, res) {
    try {
      const { ticket_id, rev } = req.params;
      const [eav] = await dbHots.promise().query('SELECT * FROM t_ticket_detail WHERE ticket_id = ? AND revision = ? ORDER BY id ASC', [ticket_id, rev]);
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
  },

  /* COMPLETE TASK */
  async completeTask(req, res) {
    try {
      const { ticket_id, task_order, completed_by, remark } = req.body;

      if (!ticket_id || task_order == null || !completed_by) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: ticket_id, task_order, completed_by'
        });
      }

      // Call workflow engine's completeTask method
      const result = await workflowEngineCore.completeTask({
        ticket_id,
        task_order,
        completed_by,
        remark,
        dbHots
      });

      return res.json(result);
    } catch (err) {
      log('completeTask error', err);
      return res.status(500).json({ ok: false, error: err.message || err });
    }
  },

  /* RELOAD ENGINE */
  async reload(req, res) {
    try {
      await engineLoader.reloadAll();
      return res.json({ ok: true, message: 'Engine configuration reloaded' });
    } catch (err) {
      log('reload error', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
};

module.exports = EngineController;
