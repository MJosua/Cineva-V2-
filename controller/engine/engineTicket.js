/**
 * controller/engine/engineTicket.js
 * HOTS Engine — Controller (DB-only workflow + triggers from m_engine_modules)
 */
const { dbHots } = require('../../config/db');
const engineLoader = require('../../core/engine-loader');
const FormLoader = require('../../core/form-loader');
const workflowEngine = require('../../core/workflow-engine');
const triggerEngine = require('../../core/trigger-engine');
const documentEngine = require('../../core/document-engine');

function log(...a) { console.log(...a); }

async function saveEav(p, ticketId, form_data, revision = null) {
  const rows = [];
  for (const key of Object.keys(form_data || {})) {
    const v = form_data[key];
    const label = v?.label || key;
    const field_id = v?.field_id || null;
    const field_type = v?.type || null;
    let value;
    if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) value = String(v.value ?? '');
    else if (typeof v === 'object') value = JSON.stringify(v);
    else value = String(v ?? '');
    rows.push([ticketId, key, label, value, field_id, field_type, null, null, revision, JSON.stringify(v?.field_meta || v?.meta || { label, type: field_type })]);
  }
  if (rows.length) {
    await p.query('INSERT INTO t_ticket_detail_eav (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?', [rows]);
  }
}

const EngineController = {
  async create(req, res) {
    console.log("🔥 [ENGINE][CREATE] Starting ticket creation...");
  
    try {
      const moduleKey = req.params.moduleKey;
      console.log("🔍 moduleKey =", moduleKey);
  
      const module = engineLoader.getServiceConfig(moduleKey);
      console.log("🔍 Loaded module =", module);
  
      if (!module) {
        console.error("❌ Module not found for key:", moduleKey);
        return res.status(404).json({ ok: false, error: 'Module not found' });
      }
  
      const { company_id, creator_id, creator_email, form_data, title } = req.body || {};
      console.log("📨 Incoming Payload:", req.body);
  
      // Validate Form
      const formDesc = await FormLoader.getFormByModuleKey(moduleKey);
      console.log("🧩 Form Description:", formDesc);
  
      if (formDesc) {
        const errors = FormLoader.validate(formDesc, form_data || {});
        console.log("🧪 Validation errors:", errors);
  
        if (errors.length) {
          console.error("❌ Validation failed");
          return res.status(400).json({ ok: false, errors });
        }
      }
  
      const ticket_id = `ENG-${Date.now()}`;
      console.log("🆔 Generated Ticket ID:", ticket_id);
  
      const result = await new Promise((resolve, reject) => {
        dbHots.getConnection(async (err, conn) => {
          if (err) {
            console.error("❌ getConnection failed:", err);
            return reject(err);
          }
  
          const p = conn.promise();
          console.log("🔌 DB connection acquired");
  
          try {
            await p.beginTransaction();
            console.log("🟡 Transaction started");
  
            // Insert header
            console.log("📥 Inserting ticket header...");
            await p.query(
              `INSERT INTO t_ticket_engine 
               (ticket_id,company_id,service_id,service_name,creator_id,creator_email,
                status,workflow_level,title,json_snapshot,created_at,updated_at)
               VALUES (?,?,?,?,?,?, "submitted",0,?, ?, NOW(),NOW())`,
              [
                ticket_id,
                company_id || null,
                module.service_id || null,
                moduleKey,
                creator_id || null,
                creator_email || null,
                title || module.module_name,
                JSON.stringify(form_data || {})
              ]
            );
            console.log("✅ Header inserted");
  
            // Insert EAV
            console.log("📥 Inserting EAV values...");
            await saveEav(p, ticket_id, form_data, null);
            console.log("✅ EAV inserted");
  
            // Load workflow
            console.log("🔍 Loading workflow for service_id:", module.service_id);
            const workflow = await workflowEngine.loadWorkflow(module.service_id);
            console.log("🧱 Workflow rows from DB:", workflow);
  
            // Resolve approvers
            console.log("👥 Resolving approvers...");
            const approvers = await workflowEngine.resolveApprovers(workflow, {
              actor: { user_id: creator_id },
              ticket: { ticket_id },
              formData: form_data
            });
            console.log("📌 Approver steps:", JSON.stringify(approvers, null, 2));
  
            let firstPending = null;
  
            // Insert approval events
            for (const step of approvers) {
              console.log(`➡️ Workflow Level ${step.level}, Approvers =`, step.approver_ids);
  
              for (const uid of step.approver_ids || []) {
                const status = (!firstPending && step.level === 1) ? 'pending' : 'waiting';
                if (status === 'pending') firstPending = uid;
  
                console.log(`📥 Inserting event: level=${step.level}, uid=${uid}, status=${status}`);
                await p.query(
                  `INSERT INTO t_ticket_event 
                   (ticket_id,event_type,approval_order,actor_id,status,created_at)
                   VALUES (?, "approve", ?, ?, ?, NOW())`,
                  [ticket_id, step.level, uid, status]
                );
              }
            }
  
            // Submit event
            console.log("📥 Inserting submit event...");
            await p.query(
              `INSERT INTO t_ticket_event 
               (ticket_id,event_type,approval_order,actor_id,status,created_at)
               VALUES (?, "submit", 0, ?, "completed", NOW())`,
              [ticket_id, creator_id || null]
            );
            console.log("✅ Submit event inserted");
  
            // Update workflow level
            const initialLevel = approvers.length ? approvers[0].level : 0;
            console.log("🔄 Setting workflow_level:", initialLevel);
            await p.query(
              `UPDATE t_ticket_engine SET workflow_level = ?, updated_at = NOW() WHERE ticket_id = ?`,
              [initialLevel, ticket_id]
            );
  
            await p.commit();
            console.log("🟢 Transaction committed");
  
            conn.release();
            console.log("🔌 DB connection released");
  
            // Run triggers
            console.log("⚡ Running on_create triggers...");
            await triggerEngine.runTriggersForEvent(
              moduleKey,
              'on_create',
              { ticketId: ticket_id, actor: { user_id: creator_id }, formData: form_data, moduleKey }
            );
            console.log("⚡ Triggers completed");
  
            resolve({
              ok: true,
              ticket_id,
              next_approver: firstPending,
              workflow_steps: approvers.length
            });
  
          } catch (e) {
            console.error("💥 Error inside transaction:", e);
  
            try {
              console.log("🔄 Rolling back...");
              await p.rollback();
              console.log("🔴 Rollback complete");
            } catch (_) {
              console.error("⚠️ Rollback failed:", _);
            }
  
            conn.release();
            console.log("🔌 DB connection released");
  
            reject(e);
          }
        });
      });
  
      return res.json(result);
  
    } catch (err) {
      console.error("💥 Final create() error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  },
  

  async status(req, res) {
    try {
      const { ticket_id } = req.params;
      const [hdrRows] = await dbHots.promise().query('SELECT * FROM t_ticket_engine WHERE ticket_id=?', [ticket_id]);
      if (!hdrRows.length) return res.status(404).json({ ok: false, error: 'not found' });
      const events = (await dbHots.promise().query('SELECT * FROM t_ticket_event WHERE ticket_id=? ORDER BY approval_order ASC, event_id ASC', [ticket_id]))[0];
      const rev = (await dbHots.promise().query('SELECT MAX(revision) rev FROM t_ticket_detail_eav WHERE ticket_id=?', [ticket_id]))[0];
      return res.json({ ok: true, ticket: hdrRows[0], events, revision: rev[0]?.rev || null });
    } catch (e) {
      log('status error', e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async approve(req, res) {
    const { ticket_id, approver_id, note } = req.body;

    // 1. Load header
    const [rows] = await dbHots.promise().query(
      "SELECT * FROM t_ticket_engine WHERE ticket_id=? LIMIT 1",
      [ticket_id]
    );
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Ticket not found" });
    }

    // 2. Correct moduleKey
    const moduleKey = rows[0].service_name;

    // 3. Load module from EngineLoader (DB-based modules)
    const module = engineLoader.getServiceConfig(moduleKey);
    if (!module) {
      console.error("❌ approve(): Module missing for key:", moduleKey);
      return res.status(500).json({
        ok: false,
        error: `Module '${moduleKey}' not found in m_engine_modules`
      });
    }

    // 4. Run workflow engine approve
    const result = await workflowEngine.approve({
      ticket_id,
      approver_id,
      note,
      module,     // <-- now definitely exists
      dbHots
    });

    // 5. Run triggers
    await triggerEngine.runTriggersForEvent(
      moduleKey,
      "on_approve",
      { ticketId: ticket_id, actor: { user_id: approver_id } }
    );

    return res.json(result);
  },
  
  async reject(req, res) {
    try {
      const { ticket_id, approver_id, note } = req.body || {};
      const [hdrRows] = await dbHots.promise().query('SELECT * FROM t_ticket_engine WHERE ticket_id=?', [ticket_id]);
      if (!hdrRows.length) return res.status(404).json({ ok: false, error: 'Ticket not found' });
      const header = hdrRows[0];
      const moduleKey = header.service_name;
      const module = engineLoader.getServiceConfig(moduleKey);
      const result = await workflowEngine.reject({ ticket_id, approver_id, note, dbHots });
      await triggerEngine.runTriggersForEvent(moduleKey, 'on_reject', { ticketId: ticket_id, actor: { user_id: approver_id }, moduleKey });
      return res.json(result);
    } catch (e) {
      log('reject error', e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async list(req, res) {
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
      const [rows] = await dbHots.promise().query(sql);
      return res.json({ ok: true, page, limit, rows });
    } catch (e) {
      log('list error', e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async myRequests(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const [rows] = await dbHots.promise().query('SELECT t.ticket_id, t.service_name, t.status, t.workflow_level, t.created_at, t.updated_at FROM t_ticket_engine t WHERE t.creator_id = ? ORDER BY t.created_at DESC', [user_id]);
      return res.json({ ok: true, requests: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async dashboard(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const [statusRows] = await dbHots.promise().query('SELECT status, COUNT(*) AS total FROM t_ticket_engine GROUP BY status');
      const summary = {}; statusRows.forEach(r => summary[r.status] = r.total);
      const [approvals] = await dbHots.promise().query('SELECT COUNT(*) AS total FROM t_ticket_event e WHERE e.actor_id = ? AND e.status = ?', [user_id, 'waiting']);
      summary.my_approvals = approvals[0].total;
      const [reqs] = await dbHots.promise().query('SELECT COUNT(*) AS total FROM t_ticket_engine WHERE creator_id = ?', [user_id]);
      summary.my_requests = reqs[0].total;
      const [serviceRows] = await dbHots.promise().query('SELECT service_name, COUNT(*) total FROM t_ticket_engine GROUP BY service_name');
      summary.service_stats = serviceRows;
      return res.json({ ok: true, summary });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async myApprovals(req, res) {
    try {
      const user_id = req.dataToken.user_id;
      const [rows] = await dbHots.promise().query('SELECT t.ticket_id, t.service_name, t.status, e.approval_order, t.created_at, t.updated_at FROM t_ticket_event e INNER JOIN t_ticket_engine t ON t.ticket_id=e.ticket_id WHERE e.actor_id = ? AND e.status = ? ORDER BY t.created_at DESC', [user_id, 'waiting']);
      return res.json({ ok: true, approvals: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async cancel(req, res) {
    try {
      const { ticket_id, user_id } = req.body || {};
      if (!ticket_id) return res.status(400).json({ ok: false, error: 'ticket_id required' });
      const conn = await dbHots.promise().getConnection();
      const p = conn.promise();
      try {
        await p.beginTransaction();
        const [rows] = await p.query('SELECT * FROM t_ticket_engine WHERE ticket_id = ?', [ticket_id]);
        if (!rows.length) throw new Error('ticket not found');
        const header = rows[0];
        if (String(header.creator_id) !== String(user_id)) throw new Error('not authorized to cancel');
        if (!['submitted', 'draft'].includes(header.status)) throw new Error('Cannot cancel ticket. It has already entered approval.');
        await p.query('UPDATE t_ticket_engine SET status = ?, updated_at = NOW() WHERE ticket_id = ?', ['cancelled', ticket_id]);
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
        await p.query('UPDATE t_ticket_event SET status = ?, actor_id = ?, note = ?, updated_at = NOW() WHERE event_id = ?', ['revision_requested', approver_id || null, note || null, pending.event_id]);
        await p.query('UPDATE t_ticket_engine SET status = ?, workflow_level = 0, updated_at = NOW() WHERE ticket_id = ?', ['revision_requested', ticket_id]);
        await p.query('INSERT INTO t_ticket_history (ticket_id, actor_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, NOW())', [ticket_id, approver_id, 'revision_requested', JSON.stringify({ note })]);
        await p.commit();
        conn.release();
        const [[hdr]] = await dbHots.promise().query('SELECT service_name FROM t_ticket_engine WHERE ticket_id=?', [ticket_id]);
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

  async resubmitDo(req, res) {
    try {
      const tid = (req.params && req.params.ticket_id) || (req.body && req.body.ticket_id);
      const { form_data, user_id } = req.body || {};
      if (!tid) return res.status(400).json({ ok: false, error: 'ticket_id required' });
      const [hdrRows] = await dbHots.promise().query('SELECT * FROM t_ticket_engine WHERE ticket_id = ?', [tid]);
      const header = hdrRows[0];
      if (!header) return res.status(404).json({ ok: false, error: 'ticket not found' });
      const revRow = (await dbHots.promise().query('SELECT MAX(revision) rev FROM t_ticket_detail_eav WHERE ticket_id = ?', [tid]))[0];
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
        if (eavRows.length) await p.query('INSERT INTO t_ticket_detail_eav (ticket_id,cstm_col,lbl_col,value,field_id,field_type,row_index,column_key,revision,field_meta_json) VALUES ?', [eavRows]);
        await p.query('UPDATE t_ticket_engine SET status=?, revision=?, workflow_level=0, updated_at=NOW() WHERE ticket_id=?', ['submitted', newRevision, tid]);
        const workflowDef = await workflowEngine.loadWorkflow(header.service_id);
        const approvers = await workflowEngine.resolveApprovers(workflowDef, { actor: { user_id: header.creator_id }, ticket: { ticket_id: tid }, formData: form_data });
        await p.query('DELETE FROM t_ticket_event WHERE ticket_id=?', [tid]);
        await p.query('INSERT INTO t_ticket_event (ticket_id,event_type,approval_order,actor_id,status,created_at) VALUES (?, "submit", 0, ?, ?, NOW())', [tid, header.creator_id || null, 'completed']);
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

  async resubmitPrefill(req, res) {
    try {
      const { ticket_id } = req.params;
      if (!ticket_id) return res.status(400).json({ ok: false, error: 'ticket_id required' });
      const [hdrRows] = await dbHots.promise().query('SELECT * FROM t_ticket_engine WHERE ticket_id = ?', [ticket_id]);
      const header = hdrRows[0];
      if (!header) return res.status(404).json({ ok: false, error: 'ticket not found' });
      const [eavRows] = await dbHots.promise().query('SELECT * FROM t_ticket_detail_eav WHERE ticket_id = ? ORDER BY revision ASC, row_index ASC', [ticket_id]);
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

  async revisionList(req, res) {
    try {
      const { ticket_id } = req.params;
      const [rows] = await dbHots.promise().query('SELECT DISTINCT revision FROM t_ticket_detail_eav WHERE ticket_id = ? ORDER BY revision ASC', [ticket_id]);
      const revisions = rows.map(r => r.revision).filter(r => r !== null);
      return res.json({ ok: true, revisions, latest: revisions.length ? revisions[revisions.length - 1] : null });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  },

  async revisionGet(req, res) {
    try {
      const { ticket_id, rev } = req.params;
      const [eav] = await dbHots.promise().query('SELECT * FROM t_ticket_detail_eav WHERE ticket_id = ? AND revision = ? ORDER BY id ASC', [ticket_id, rev]);
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
