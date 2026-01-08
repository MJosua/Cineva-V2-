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
      console.log('🔑 [DataSeparation] Auto-save fields detected:', [...autoSaveFieldNames]);
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

  if (detailRows.length) {
    await p.query('INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?', [detailRows]);
  }
  if (workDataRows.length) {
    await p.query('INSERT INTO hots.t_ticket_work_data (ticket_id, service_id, field_name, field_value, data_type, entity_id) VALUES ?', [workDataRows]);
  }
}

const EngineController = {

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

            // ensure service_id value for header
            const sid = module.service_id || service_id || null;

            // insert header into t_ticket
            await p.query(
              `INSERT INTO t_ticket
               (ticket_id, parent_ticket_id, company_id, service_id, service_name,
                created_by, creator_email, status_id, workflow_step, creation_date, submitted_at,
                last_update, engine_version, json_snapshot, title)
               VALUES (?, NULL, ?, ?, ?, ?, ?, 2, 0, NOW(), NOW(), NOW(), ?, ?, ?)`,
              [
                ticket_id,
                company_id || null,
                sid,
                module.module_name || module.module_key,
                creator_id || null,
                creator_email || null,
                module.engine_version || 4,
                JSON.stringify(form_data || {}),
                title || module.module_name
              ]
            );

            // insert details (EAV) — pass serviceItems for data separation
            await saveEav(p, ticket_id, form_data, null, module.items, sid);

            // build workflow from DB (using module.workflow_id)
            const workflow = await workflowEngine.loadWorkflow(module);
            // console.log('🔍 Workflow loaded:', workflow);

            const approvers = await workflowEngine.resolveApprovers(workflow, { actor: { user_id: creator_id }, ticket: { ticket_id }, formData: form_data });
            // console.log('🔍 Approvers resolved:', approvers);

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
            await p.query('UPDATE t_ticket SET workflow_step = ?, last_update = NOW() WHERE ticket_id = ?', [approvers.length ? approvers[0].level : 0, ticket_id]);

            await p.commit();
            conn.release();

            // run triggers
            await triggerEngine.runTriggersForEvent(module.module_key, 'on_create', { ticketId: ticket_id, actor: { user_id: creator_id }, formData: form_data, moduleKey: module.module_key });
            await triggerEngine.runTriggersForEvent(module.module_key, 'on_submit', { ticketId: ticket_id, actor: { user_id: creator_id }, formData: form_data, moduleKey: module.module_key });

            resolve({ ok: true, ticket_id, next_approver: firstPending, workflow_steps: approvers.length });
          } catch (e) {
            try { await conn.promise().rollback(); } catch (_) { }
            conn.release();
            reject(e);
          }
        });
      });

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

      // 🔥 additional trigger for fully approved
      if (result.final === true) {
        // Determine status based on workflow result
        // If tasks were created, status is 5 (In Fulfillment), otherwise 3 (Completed)
        const newStatus = (result.tasksCreated && result.tasksCreated > 0) ? 5 : 3;
        console.log(`🔍 [APPROVE] Final approval! tasksCreated=${result.tasksCreated}, newStatus=${newStatus}`);

        await triggerEngine.runTriggersForEvent(
          module.module_key,
          'workflow_complete',
          {
            ticketId: ticket_id,
            actor: { user_id: approver_id },
            moduleKey: module.module_key,
            status: newStatus // Pass status explicitly for condition checks
          }
        );
      }

      // Determine currentStatus to pass to on_approve trigger
      // Priority: If final, use the determined status, otherwise query DB or pass null
      let currentStatus = null;
      if (result.final) {
        currentStatus = (result.tasksCreated && result.tasksCreated > 0) ? 5 : 3;
        console.log(`🔍 [APPROVE] Calculated currentStatus for on_approve: ${currentStatus} (tasksCreated: ${result.tasksCreated})`);
      }

      await triggerEngine.runTriggersForEvent(
        module.module_key,
        'on_approve',
        {
          ticketId: ticket_id,
          actor: { user_id: approver_id },
          moduleKey: module.module_key,
          status: currentStatus, // Might be null if not final
          isFinal: result.final,
          workflow_step: header.workflow_step, // 🔥 Add step for step-based triggers
          note: approvalNote // 🔥 Add note for has_notes condition
        }
      );

      if (global.io) {
        global.io.emit("message", "engine_approve_" + ticket_id);
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

      return res.json(result);

    } catch (e) {
      log('reject error', e);
      return res.status(500).json({ ok: false, error: e.message || e });
    }
  },


  /* LIST */
  async list(req, res) {
    try {

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
        conditions += ` AND t.status = ${dbHots.escape(status)} `;
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
        SELECT t.ticket_id, t.service_id, t.service_name, t.created_by,
               CONCAT(u.firstname, " ", u.lastname) creator_name,
               ts.status_name, t.status_id, t.workflow_step, t.creation_date, t.last_update
        FROM t_ticket t
        LEFT JOIN user u ON u.user_id = t.created_by
        LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
        ${conditions}
        ORDER BY t.creation_date DESC
        LIMIT ${startIndex}, ${limit}
      `;

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

      return res.json({ ok: true, page, limit, rows });
    } catch (e) {
      log('list error', e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  /* myRequests */
  async myRequests(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const [rows] = await dbHots.promise().query('SELECT t.ticket_id, t.service_name, t.status, t.workflow_level, t.creation_date, t.last_update FROM t_ticket t WHERE t.created_by = ? ORDER BY t.creation_date DESC', [user_id]);
      return res.json({ ok: true, requests: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  /* dashboard */
  async dashboard(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const [statusRows] = await dbHots.promise().query('SELECT status, COUNT(*) AS total FROM t_ticket GROUP BY status');
      const summary = {}; statusRows.forEach(r => summary[r.status] = r.total);
      const [approvals] = await dbHots.promise().query('SELECT COUNT(*) AS total FROM t_ticket_event e WHERE e.actor_id = ? AND e.status = ?', [user_id, 'waiting']);
      summary.my_approvals = approvals[0].total;
      const [reqs] = await dbHots.promise().query('SELECT COUNT(*) AS total FROM t_ticket WHERE created_by = ?', [user_id]);
      summary.my_requests = reqs[0].total;
      const [serviceRows] = await dbHots.promise().query('SELECT service_name, COUNT(*) total FROM t_ticket GROUP BY service_name');
      summary.service_stats = serviceRows;
      return res.json({ ok: true, summary });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  /* myApprovals */
  async myApprovals(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const [rows] = await dbHots.promise().query('SELECT t.ticket_id, t.service_name, t.status, e.approval_order, t.creation_date, t.last_update FROM t_ticket_event e INNER JOIN t_ticket t ON t.ticket_id=e.ticket_id WHERE e.actor_id = ? AND e.status = ? ORDER BY t.creation_date DESC', [user_id, 'waiting']);
      return res.json({ ok: true, approvals: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
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
