/**
 * core/trigger-engine.js
 *
 * Init: triggerEngine.init({ dbQuery, engineLoader, documentEngine })
 *
 * Triggers are loaded from:
 *  - m_service_triggers (preferred)
 *  - fallback: m_service.trigger_meta / trigger_json
 *
 * Each trigger row: trigger_config (JSON) is expected to be an array of action objects:
 *   [{ action: "generate_document", params: {...} }, { action: "send_email", params:{...} }]
 *
 * Actions can be registered via registerAction(name, fn)
 * fn receives (context, params) and returns { ok: true } or throws.
 */

const assert = require('assert');

class TriggerEngine {
  constructor() {
    this.dbQuery = null;
    this.engineLoader = null;
    this.documentEngine = null;
    this.actions = {};
  }

  init({ dbQuery, engineLoader, documentEngine }) {
    assert(dbQuery && typeof dbQuery === 'function', 'TriggerEngine.init requires dbQuery');
    this.dbQuery = dbQuery;
    this.engineLoader = engineLoader;
    this.documentEngine = documentEngine;

    // register basic actions
    this.registerAction('generate_document', this._action_generateDocument.bind(this));
    this.registerAction('update_ticket_status', this._action_updateTicketStatus.bind(this));
    this.registerAction('send_email', this._action_sendEmail.bind(this));
    this.registerAction('execute_sql', this._action_executeSql.bind(this));
    this.registerAction('execute_function', this._action_executeFunction.bind(this));
    this.registerAction('create_assignment', this._action_createAssignment.bind(this));
    this.registerAction('complete_assignment', this._action_completeAssignment.bind(this));
  }

  registerAction(name, fn) { this.actions[name] = fn; }

  async _action_executeSql(context, params) {
    const query = params.query || params.sql;
    const queryParams = params.params || [];

    // Replace placeholders in params if they are strings starting with :
    // e.g. ":ticketId" -> context.ticketId
    const resolvedParams = queryParams.map(p => {
      if (typeof p === 'string' && p.startsWith(':')) {
        const key = p.substring(1);
        return context[key] !== undefined ? context[key] : p;
      }
      return p;
    });

    if (!query) return { ok: false, error: 'missing query' };

    try {
      await this.dbQuery(query, resolvedParams);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async _action_generateDocument(context, params) {
    if (!this.documentEngine) throw new Error('DocumentEngine not initialized');
    const moduleKey = params.moduleKey || context.moduleKey;
    const ticketId = params.ticketId || context.ticketId;
    const moduleConfig = this.engineLoader.getServiceConfig(moduleKey);
    const html = params.templateHtml || (moduleConfig && (moduleConfig.raw && moduleConfig.raw.document_html)) || null;
    if (!html) return null;
    const filePath = await this.documentEngine.generateFromHtmlForTicket(moduleKey, ticketId, html, context);
    return { filePath };
  }

  async _action_updateTicketStatus(context, params) {
    const ticketId = params.ticket_id || context.ticketId;
    const status = params.status;
    if (!ticketId || typeof status === 'undefined') return { ok: false, error: 'missing ticketId or status' };
    try {
      await this.dbQuery('UPDATE t_ticket SET status_id = ? WHERE ticket_id = ?', [status, ticketId]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async _action_sendEmail(context, params) {
    const { hotsMailer, hotsSubmitMailer, hotsApproveRequest } = require('../service/mailer/hots/hots_mailer');

    const template = params.template || 'generic';
    const ticketId = params.ticketId || context.ticketId;
    const to = params.to || context.to;

    console.log(`📧 [TRIGGER][EMAIL] Sending email with template: ${template}, ticketId: ${ticketId}`);

    try {
      if (template === 'submit') {
        // Use hotsSubmitMailer for submission confirmation
        const userName = context.userName || context.actor?.name || 'User';
        const serviceName = context.serviceName || context.moduleKey || 'Service';
        const mailAddress = to || context.requesterEmail;
        await hotsSubmitMailer(false, ticketId, userName, serviceName, mailAddress);
      } else if (template === 'approve') {
        // Use hotsApproveRequest for approval notifications
        await hotsApproveRequest(false, ticketId);
      } else if (template === 'assignment_complete') {
        // Use hotsAssignmentCompleteMailer for assignment completion
        const { hotsAssignmentCompleteMailer } = require('../service/mailer/hots/hots_mailer');
        await hotsAssignmentCompleteMailer(false, ticketId);
      } else {
        // Generic fallback using hotsMailer
        const subject = params.subject || `[HOTS] Notification - Ticket ${ticketId}`;
        const body = params.body || `Ticket ${ticketId} has been updated.`;
        await hotsMailer(to, subject, body);
      }

      console.log(`✅ [TRIGGER][EMAIL] Email sent successfully`);
      return { ok: true };
    } catch (e) {
      console.error(`❌ [TRIGGER][EMAIL] Error sending email:`, e);
      return { ok: false, error: e.message };
    }
  }

  async _action_executeFunction(context, params) {
    // Execute a JavaScript function from trigger-functions directory
    // params = { function: 'publishJobListing', args: { ticketId: ':ticketId' } }

    const functionName = params.function || params.name;
    if (!functionName) {
      return { ok: false, error: 'missing function name' };
    }

    try {
      // Resolve arguments from context
      const resolvedArgs = {};
      const args = params.args || params.params || {};

      for (const [key, value] of Object.entries(args)) {
        if (typeof value === 'string' && value.startsWith(':')) {
          // Replace :ticketId with context.ticketId
          const contextKey = value.substring(1);
          resolvedArgs[key] = context[contextKey];
        } else {
          resolvedArgs[key] = value;
        }
      }

      // Try to load the function from trigger-functions directory
      const path = require('path');
      const functionPath = path.join(__dirname, '..', 'script', 'trigger-functions', `${functionName}.js`);


      console.log(`🔍 [TRIGGER][FUNC] Loading function from: ${functionPath}`);

      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(functionPath)];

      const fn = require(functionPath);

      // Call the function with resolved args and db query
      const result = await fn({
        ...resolvedArgs,
        context,
        dbQuery: this.dbQuery
      });

      console.log(`✅ [TRIGGER][FUNC] Function "${functionName}" executed:`, result);
      return result || { ok: true };

    } catch (e) {
      console.error(`❌ [TRIGGER][FUNC] Error executing function "${functionName}":`, e);
      return { ok: false, error: e.message };
    }
  }

  async _action_createAssignment(context, params) {
    const ticketId = params.ticket_id || context.ticketId;
    const assignedType = params.assigned_type || 'team';
    const assignedId = params.assigned_id || params.assigned_value;
    const assignedBy = params.assigned_by || context.actor?.user_id;
    const notes = params.notes || '';

    if (!ticketId || !assignedId) {
      return { ok: false, error: 'missing ticketId or assigned_id' };
    }

    try {
      // Check if assignment already exists
      const existing = await this.dbQuery(
        'SELECT id FROM t_ticket_assignment WHERE ticket_id = ? AND assignment_status = ?',
        [ticketId, 'active']
      );

      if (existing.length > 0) {
        console.log(`⚠️ [TRIGGER][ASSIGN] Assignment already exists for ticket ${ticketId}`);
        return { ok: true, skipped: true };
      }

      await this.dbQuery(
        `INSERT INTO t_ticket_assignment 
         (ticket_id, assigned_type, assigned_id, assigned_by, assigned_at, assignment_status, notes) 
         VALUES (?, ?, ?, ?, NOW(), 'active', ?)`,
        [ticketId, assignedType, assignedId, assignedBy, notes]
      );

      console.log(`✅ [TRIGGER][ASSIGN] Created assignment: ticket=${ticketId}, ${assignedType}=${assignedId}`);
      return { ok: true };
    } catch (e) {
      console.error(`❌ [TRIGGER][ASSIGN] Error:`, e);
      return { ok: false, error: e.message };
    }
  }

  async _action_completeAssignment(context, params) {
    const ticketId = params.ticket_id || context.ticketId;

    if (!ticketId) {
      return { ok: false, error: 'missing ticketId' };
    }

    try {
      await this.dbQuery(
        `UPDATE t_ticket_assignment 
         SET assignment_status = 'completed', unassigned_at = NOW() 
         WHERE ticket_id = ? AND assignment_status = 'active'`,
        [ticketId]
      );

      console.log(`✅ [TRIGGER][ASSIGN] Completed assignment for ticket ${ticketId}`);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /**
   * runTriggersForEvent(moduleKey, eventName, context)
   * Loads triggers by service -> m_service_triggers (event_name)
   * Falls back to m_service.trigger_meta.
   */
  async runTriggersForEvent(moduleKeyOrServiceId, eventName, context = {}) {
    console.log(`🔍 [TRIGGER][RUN] Called with moduleKey="${moduleKeyOrServiceId}", eventName="${eventName}"`);

    const svc = this.engineLoader.getServiceConfig(moduleKeyOrServiceId);
    if (!svc) {
      console.log(`❌ [TRIGGER][RUN] Service not found for key: ${moduleKeyOrServiceId}`);
      return [];
    }

    const serviceId = svc.service_id;
    console.log(`🔍 [TRIGGER][RUN] Resolved to service_id=${serviceId}`);

    let triggers = [];

    // load from m_service_triggers
    try {
      console.log(`🔍 [TRIGGER][QUERY] SELECT * FROM m_service_triggers WHERE service_id=${serviceId} AND trigger_name='${eventName}' AND active=1`);

      const rows = await this.dbQuery('SELECT * FROM m_service_triggers WHERE service_id = ? AND trigger_name = ? AND active = 1 ORDER BY trigger_id ASC', [serviceId, eventName]);

      console.log(`🔍 [TRIGGER][QUERY] Found ${rows.length} trigger(s)`);

      if (rows.length > 0) {
        console.log(`🔍 [TRIGGER][QUERY] Triggers:`, rows.map(r => ({
          trigger_id: r.trigger_id,
          trigger_name: r.trigger_name,
          trigger_type: r.trigger_type
        })));
      }

      for (const r of rows) {
        const cfg = tryParseJSON(r.trigger_config) || null;
        console.log(`🔍 [TRIGGER][PARSE] Raw config:`, JSON.stringify(cfg, null, 2));

        if (cfg) {
          // If config has 'actions' array, extract those
          if (cfg.actions && Array.isArray(cfg.actions)) {
            console.log(`🔍 [TRIGGER][PARSE] Found ${cfg.actions.length} actions in config`);
            // Each action inherits the parent condition if present
            cfg.actions.forEach(action => {
              triggers.push({
                ...action,
                condition: action.condition || cfg.condition  // Inherit parent condition
              });
            });
          } else if (Array.isArray(cfg)) {
            triggers.push(...cfg);
          } else {
            triggers.push(cfg);
          }
        }
      }

      console.log(`🔍 [TRIGGER][PARSE] Final triggers array (${triggers.length}):`, triggers);
    } catch (e) {
      console.error(`❌ [TRIGGER][QUERY] Error:`, e);
    }

    // fallback: m_service.trigger_meta or trigger_json
    if (!triggers.length && svc.trigger_meta) {
      console.log(`🔍 [TRIGGER][FALLBACK] Trying service.trigger_meta`);
      try {
        const tcfg = (typeof svc.trigger_meta === 'string') ? JSON.parse(svc.trigger_meta) : svc.trigger_meta;
        if (tcfg) {
          if (Array.isArray(tcfg)) triggers.push(...tcfg);
          else if (tcfg[eventName]) triggers.push(...(tcfg[eventName] || []));
        }
      } catch (e) { }
    }

    // execute triggers sequentially
    console.log(`🔍 [TRIGGER][EXEC] Starting execution of ${triggers.length} trigger(s)`);
    const results = [];
    for (const t of triggers) {
      console.log(`🔍 [TRIGGER][EXEC] Processing trigger:`, t);

      // Check condition if present
      if (t.condition) {
        console.log(`🔍 [TRIGGER][COND] Checking condition:`, t.condition);
        console.log(`🔍 [TRIGGER][COND] Context:`, context);

        const conditionMet = await this._checkCondition(t.condition, context);

        console.log(`🔍 [TRIGGER][COND] Condition result: ${conditionMet ? '✅ MET' : '❌ NOT MET'}`);

        if (!conditionMet) {
          console.log(`⚠️ [TRIGGER][SKIP] Skipping action "${t.action}" - condition not met`);
          continue;
        }
      }

      const action = t.action || t.type;
      const params = t.params || t.config || {};

      console.log(`🔍 [TRIGGER][EXEC] Executing action: "${action}"`);

      const handler = this.actions[action];
      if (!handler) {
        console.error(`❌ [TRIGGER][EXEC] No handler registered for action: ${action}`);
        results.push({ trigger: t, error: `no action registered for ${action}` });
        continue;
      }
      try {
        const res = await handler(context, params);
        console.log(`✅ [TRIGGER][EXEC] Action "${action}" completed:`, res);
        results.push({ trigger: t, result: res });
      } catch (e) {
        console.error(`❌ [TRIGGER][EXEC] Action "${action}" failed:`, e);
        results.push({ trigger: t, error: e.message });
      }
    }

    return results;
  }

  async _checkCondition(condition, context) {
    if (!condition) return true;
    const type = condition.type;
    const value = condition.value;

    if (type === 'status_change') {
      // Simple check: if value.to is set, check if current ticket status matches.
      if (value && value.to) {
        const ticketId = context.ticketId;
        if (!ticketId) return false;

        // Check if status is already in context (preferred - reflects immediate state)
        if (context.status !== undefined && context.status !== null) {
          console.log(`🔍 [TRIGGER][COND] Using context status: ${context.status}`);
          if (context.status != value.to) {
            console.log(`❌ [TRIGGER][COND] Context status ${context.status} != target ${value.to}`);
            return false;
          }
          console.log(`✅ [TRIGGER][COND] Context status matches target!`);
          return true;
        }

        // Fallback: Query the database
        console.log(`🔍 [TRIGGER][COND] Context status not available, querying DB...`);
        const result = await this.dbQuery('SELECT status_id FROM t_ticket WHERE ticket_id = ?', [ticketId]);
        console.log(`🔍 [TRIGGER][COND] DB Query result:`, result);

        const rows = Array.isArray(result) ? result : [];
        if (!rows || !rows.length) {
          console.log(`⚠️ [TRIGGER][COND] Ticket ${ticketId} not found in DB`);
          return false;
        }

        const currentStatus = rows[0].status_id;
        console.log(`🔍 [TRIGGER][COND] DB Status: ${currentStatus}, Target: ${value.to}`);

        if (currentStatus != value.to) {
          console.log(`❌ [TRIGGER][COND] Status mismatch: ${currentStatus} != ${value.to}`);
          return false;
        }

        return true;
      }
    }

    // 🔥 NEW: workflow_step condition type
    if (type === 'workflow_step') {
      const targetStep = value?.step;
      const currentStep = context.workflow_step;

      console.log(`🔍 [TRIGGER][COND] workflow_step check: target=${targetStep}, current=${currentStep}`);

      // Check step number
      if (targetStep !== undefined && targetStep != currentStep) {
        console.log(`❌ [TRIGGER][COND] Step mismatch: target ${targetStep} != current ${currentStep}`);
        return false;
      }

      // Check has_notes condition
      if (value?.has_notes === true) {
        let note = context.note || '';

        // 🔥 Fallback: Query t_ticket_event.remark from database if context note is empty
        if (!note || note.trim() === '') {
          const ticketId = context.ticketId;
          const actorId = context.actor?.user_id;

          if (ticketId && actorId && currentStep) {
            try {
              console.log(`🔍 [TRIGGER][COND] Context note empty, querying t_ticket_event.remark...`);
              const rows = await this.dbQuery(
                `SELECT remark FROM t_ticket_event 
                 WHERE ticket_id = ? AND approval_order = ? AND approver_id = ? 
                 AND approval_status = 1
                 ORDER BY approve_date DESC LIMIT 1`,
                [ticketId, currentStep, actorId]
              );

              if (rows && rows.length > 0 && rows[0].remark) {
                note = rows[0].remark;
                console.log(`🔍 [TRIGGER][COND] Found remark in DB: "${note.substring(0, 50)}..."`);
              }
            } catch (e) {
              console.error(`❌ [TRIGGER][COND] Error querying remark:`, e);
            }
          }
        }

        if (!note || note.trim() === '') {
          console.log(`❌ [TRIGGER][COND] has_notes required but note/remark is empty`);
          return false;
        }
        console.log(`✅ [TRIGGER][COND] has_notes satisfied, note: "${note.substring(0, 50)}..."`);
      }

      console.log(`✅ [TRIGGER][COND] workflow_step condition passed!`);
      return true;
    }

    return true;
  }
}

function tryParseJSON(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v)); } catch (e) { return null; }
}

module.exports = new TriggerEngine();
