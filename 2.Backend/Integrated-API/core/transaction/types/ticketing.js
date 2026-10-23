/**
 * core/transaction/types/ticketing.js
 * 
 * Transaction type handler for HOTS Ticketing system.
 * Connects to actual engineTicket.js logic for ticket operations.
 * 
 * @module transaction-types/ticketing
 */

const { dbHots } = require('../../../config/db');

/**
 * Generate custom ticket ID following HOTS format: YYSSUURRRR
 * YY = Year, SS = Service ID, UU = User ID, RRRR = Running number
 */
async function generateCustomTicketID(db, service_id, user_id) {
  const year = new Date().getFullYear().toString().slice(-2);
  const service = String(service_id).padStart(2, "0");
  const user = String(user_id).padStart(4, "0");

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

/**
 * Save EAV (Entity-Attribute-Value) form data to t_ticket_detail
 */
async function saveEav(p, ticketId, form_data, revision = null) {
  const rows = [];
  for (const key of Object.keys(form_data || {})) {
    const v = form_data[key];
    const label = v?.label || key;
    const field_id = v?.field_id || null;
    const field_type = v?.type || null;
    let value;

    if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) {
      value = String(v.value ?? '');
    } else if (typeof v === 'object') {
      value = JSON.stringify(v);
    } else {
      value = String(v ?? '');
    }

    rows.push([ticketId, key, label, value, field_id, field_type, null, null, revision, JSON.stringify(v?.field_meta || v?.meta || { label, type: field_type })]);
  }

  if (rows.length) {
    await p.query('INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?', [rows]);
  }
}

const TicketingType = {
  name: 'ticketing',

  /**
   * Validate ticket transaction before execution
   * @param {object} context - { user_id, service_id, form_data, ... }
   * @param {TransactionManager} manager
   */
  async validate(context, manager) {
    const { user_id, service_id, form_data } = context;

    if (!user_id) {
      throw new Error('Ticketing requires user_id');
    }
    if (!service_id) {
      throw new Error('Ticketing requires service_id');
    }
    if (!form_data || typeof form_data !== 'object') {
      throw new Error('Ticketing requires form_data object');
    }

    // Load service config to validate it exists
    if (manager.engineLoader) {
      const config = await manager.engineLoader.getServiceConfig(service_id);
      if (!config) {
        throw new Error(`Service ${service_id} not found`);
      }
      context._serviceConfig = config;
    }

    return true;
  },

  /**
   * Execute ticket creation - uses actual database operations
   * @param {object} context - Validated context with _serviceConfig
   * @param {TransactionManager} manager
   * @returns {object} Result with ticket_id
   */
  async execute(context, manager) {
    const { user_id, service_id, form_data, company_id, creator_email, title } = context;
    const module = context._serviceConfig;
    
    console.log(`🎫 [TX:Ticketing] Creating ticket for service ${service_id} by user ${user_id}`);

    // Generate ticket ID
    const ticket_id = await generateCustomTicketID(dbHots, service_id, user_id);
    console.log(`🎫 [TX:Ticketing] Generated ticket_id: ${ticket_id}`);

    // Execute in transaction
    const result = await new Promise((resolve, reject) => {
      dbHots.getConnection(async (err, conn) => {
        if (err) return reject(err);
        const p = conn.promise();
        
        try {
          await p.beginTransaction();

          const sid = module?.service_id || service_id || null;

          // Insert header into t_ticket
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
              module?.module_name || module?.module_key || `service_${service_id}`,
              user_id,
              creator_email || null,
              module?.engine_version || 4,
              JSON.stringify(form_data || {}),
              title || module?.module_name || 'New Request'
            ]
          );

          // Insert form details (EAV)
          await saveEav(p, ticket_id, form_data, null);

          // Resolve workflow approvers
          let approvers = [];
          let firstPending = null;

          if (manager.workflowEngine && module) {
            const workflow = await manager.workflowEngine.loadWorkflow(module);
            approvers = await manager.workflowEngine.resolveApprovers(workflow, {
              actor: { user_id },
              ticket: { ticket_id },
              formData: form_data
            });

            // Insert approval events
            for (const step of approvers) {
              for (const uid of step.approver_ids || []) {
                if (firstPending === null && step.level === 1) firstPending = uid;
                const leader = step.approver_leaders?.[uid] ?? 0;

                await p.query(
                  `INSERT INTO t_ticket_event
                   (ticket_id, event_type, approval_order, approver_id, approval_status, approver_leader, created_at)
                   VALUES (?, "approve", ?, ?, 0, ?, NOW())`,
                  [ticket_id, step.level, uid, leader]
                );
              }
            }

            // Update workflow step in header
            await p.query(
              'UPDATE t_ticket SET workflow_step = ?, last_update = NOW() WHERE ticket_id = ?',
              [approvers.length ? approvers[0].level : 0, ticket_id]
            );
          }

          await p.commit();
          conn.release();

          resolve({
            ok: true,
            ticket_id,
            next_approver: firstPending,
            workflow_steps: approvers.length
          });

        } catch (e) {
          try { await p.rollback(); } catch (_) { }
          conn.release();
          reject(e);
        }
      });
    });

    // Store result in context for afterCommit
    context._result = result;
    return result;
  },

  /**
   * Post-commit hook - run triggers after successful commit
   */
  async afterCommit(context, result, manager) {
    const { user_id, form_data } = context;
    const module = context._serviceConfig;
    const ticket_id = result?.ticket_id;

    console.log(`📧 [TX:Ticketing] Running post-commit triggers for ticket ${ticket_id}`);

    // Fire create and submit triggers
    if (manager.triggerEngine && module?.module_key) {
      try {
        await manager.triggerEngine.runTriggersForEvent(
          module.module_key,
          'on_create',
          { ticketId: ticket_id, actor: { user_id }, formData: form_data, moduleKey: module.module_key }
        );
        await manager.triggerEngine.runTriggersForEvent(
          module.module_key,
          'on_submit',
          { ticketId: ticket_id, actor: { user_id }, formData: form_data, moduleKey: module.module_key }
        );
      } catch (triggerErr) {
        console.warn('⚠️ [TX:Ticketing] Trigger error:', triggerErr.message);
      }
    }
  },

  /**
   * Rollback hook - clean up on failure
   */
  async rollback(context, result, manager) {
    const ticket_id = result?.ticket_id;
    
    if (!ticket_id) {
      console.log(`🔄 [TX:Ticketing] No ticket_id to rollback`);
      return;
    }

    console.log(`🔄 [TX:Ticketing] Rolling back ticket ${ticket_id}`);

    try {
      // Delete in reverse order of creation
      await dbHots.promise().query('DELETE FROM t_ticket_event WHERE ticket_id = ?', [ticket_id]);
      await dbHots.promise().query('DELETE FROM t_ticket_detail WHERE ticket_id = ?', [ticket_id]);
      await dbHots.promise().query('DELETE FROM t_ticket WHERE ticket_id = ?', [ticket_id]);
      console.log(`✅ [TX:Ticketing] Rollback complete for ticket ${ticket_id}`);
    } catch (err) {
      console.error(`❌ [TX:Ticketing] Rollback failed:`, err.message);
    }
  }
};

module.exports = TicketingType;
