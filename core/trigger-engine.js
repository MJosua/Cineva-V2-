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
    this.MAX_TRIGGER_DEPTH = process.env.TRIGGER_MAX_DEPTH || 10;
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
    this.registerAction('create_task', this._action_createTask.bind(this));
    this.registerAction('log_analytics', this._action_logAnalytics.bind(this));
    this.registerAction('create_record', this._action_createRecord.bind(this));
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
    // OR from m_service_trigger_function table (for SQL-based functions)
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

      // NEW: First try to lookup from m_service_trigger_function table
      try {
        const fnRows = await this.dbQuery(
          'SELECT * FROM m_service_trigger_function WHERE function_key = ? AND is_active = 1',
          [functionName]
        );

        if (fnRows && fnRows.length > 0) {
          const fnConfig = fnRows[0];
          console.log(`🔍 [TRIGGER][FUNC] Found function in database: ${functionName} (type: ${fnConfig.function_type})`);

          // Handle SQL type functions - execute stored query WITH SAFETY VALIDATION
          if (fnConfig.function_type === 'sql' && fnConfig.sql_query) {
            console.log(`🔍 [TRIGGER][SQL] Executing SQL function: ${functionName}`);

            // Load safety validator
            const SqlSafetyValidator = require('./sql-safety-validator');
            const validator = new SqlSafetyValidator();

            // Validate the SQL query
            const validation = validator.validate(fnConfig.sql_query);
            if (!validation.valid) {
              console.error(`❌ [TRIGGER][SQL] Query validation failed for "${functionName}":`);
              validation.errors.forEach(err => console.error(`   - ${err}`));

              // Log the failed attempt
              try {
                await this.dbQuery(
                  `INSERT INTO t_trigger_warnings (ticket_id, warning_type, trigger_chain, created_at)
                   VALUES (?, 'sql_validation_failed', ?, NOW())`,
                  [context.ticketId || null, JSON.stringify({ function: functionName, errors: validation.errors })]
                );
              } catch (logErr) { /* ignore logging errors */ }

              return {
                ok: false,
                error: `SQL validation failed: ${validation.errors.join('; ')}`
              };
            }

            console.log(`✅ [TRIGGER][SQL] Query validation passed for "${functionName}"`);

            // Parse and resolve SQL parameters
            let sqlParamDefs = [];
            try {
              sqlParamDefs = fnConfig.sql_params ? JSON.parse(fnConfig.sql_params) : [];
            } catch (e) {
              console.warn(`⚠️ [TRIGGER][SQL] Failed to parse sql_params, using empty array`);
            }

            // Resolve parameters from context, with sanitization
            const resolvedSqlParams = sqlParamDefs.map(p => {
              let value;
              if (typeof p === 'string' && p.startsWith(':')) {
                const key = p.substring(1);
                value = context[key] ?? context.values?.[key] ?? resolvedArgs[key] ?? null;
              } else if (typeof p === 'object' && p.name) {
                // Object format: { name: 'ticketId', type: 'string', default: null }
                const key = p.name;
                value = context[key] ?? context.values?.[key] ?? resolvedArgs[key] ?? p.default ?? null;
              } else {
                value = p;
              }
              return validator.sanitizeParam(value);
            });

            console.log(`🔍 [TRIGGER][SQL] Resolved ${resolvedSqlParams.length} parameters`);

            // Execute the query
            const result = await this.dbQuery(fnConfig.sql_query, resolvedSqlParams);

            console.log(`✅ [TRIGGER][SQL] Function "${functionName}" executed successfully`);
            return { ok: true, data: result, rowCount: Array.isArray(result) ? result.length : 1 };
          }

          // Handler type - use handler_path if specified, otherwise fall through to file lookup
          if (fnConfig.function_type === 'handler' && fnConfig.handler_path) {
            console.log(`🔍 [TRIGGER][FUNC] Using handler_path: ${fnConfig.handler_path}`);
            // Handler path is relative, will be loaded below with adjusted path
          }
        }
      } catch (dbErr) {
        // Table might not exist yet or other DB error - continue to file-based lookup
        console.log(`⚠️ [TRIGGER][FUNC] DB lookup failed, falling back to file: ${dbErr.message}`);
      }

      // Fallback: Load the function from trigger-functions directory
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

  async _action_logAnalytics(context, params) {
    const eventType = params.event_type || 'GENERIC';
    const ticketId = context.ticketId;
    const serviceId = context.serviceId;
    const userId = context.actor?.user_id;

    console.log(`📊 [TRIGGER][ANALYTICS] Logging ${eventType} for Ticket ${ticketId}`);

    try {
      const values = context.values || {};
      let diffData = [];

      if (params.widget_id && Array.isArray(values[params.widget_id])) {
        diffData = values[params.widget_id];
      } else {
        const potentialKey = Object.keys(values).find(k =>
          Array.isArray(values[k]) && values[k].length > 0 && values[k][0].hasOwnProperty('old_value')
        );
        if (potentialKey) diffData = values[potentialKey];
      }

      if (!diffData || !diffData.length) {
        console.log(`⚠️ [TRIGGER][ANALYTICS] No diff data found to log.`);
        return { ok: true, message: 'No data to log' };
      }

      const refKey = values['record_id'] || values['ref_id'] || 'UNKNOWN';

      for (const row of diffData) {
        if (row.is_changed === false) continue;

        await this.dbQuery(`
                INSERT INTO t_ticket_analytics 
                (ticket_id, service_id, event_type, ref_key, dim_1, dim_2, dim_3, val_str_old, val_str_new, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
          ticketId,
          serviceId,
          eventType,
          refKey,
          values['data_category'] || 'General',
          row.field_name,
          values['reason'] || '',
          String(row.old_value).substring(0, 65000),
          String(row.new_value).substring(0, 65000),
          userId
        ]);
      }

      console.log(`✅ [TRIGGER][ANALYTICS] Logged ${diffData.length} changes.`);
      return { ok: true };

    } catch (e) {
      console.error(`❌ [TRIGGER][ANALYTICS] Error logging:`, e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * Generic action to insert a record into any table
   * params: { table: 'table_name', mapping: { col1: ':contextKey', col2: 'literal' } }
   */
  async _action_createRecord(context, params) {
    const table = params.table;
    const mapping = params.mapping || {};

    if (!table) {
      console.error(`❌ [TRIGGER][CREATE_RECORD] Missing table name`);
      return { ok: false, error: 'missing table name' };
    }

    const columns = [];
    const values = [];

    for (const [col, source] of Object.entries(mapping)) {
      columns.push(col);
      // Resolve :placeholders from context
      if (typeof source === 'string' && source.startsWith(':')) {
        const key = source.substring(1);
        // Check context.values first, then context directly
        const resolved = context.values?.[key] ?? context[key] ?? null;
        values.push(resolved);
        console.log(`🔍 [TRIGGER][CREATE_RECORD] Mapping ${col} <- :${key} = ${resolved}`);
      } else {
        values.push(source);
        console.log(`🔍 [TRIGGER][CREATE_RECORD] Mapping ${col} <- literal = ${source}`);
      }
    }

    if (!columns.length) {
      console.error(`❌ [TRIGGER][CREATE_RECORD] Empty mapping`);
      return { ok: false, error: 'empty mapping' };
    }

    const sql = `INSERT INTO \`${table}\` (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    console.log(`🔍 [TRIGGER][CREATE_RECORD] SQL: ${sql}`);
    console.log(`🔍 [TRIGGER][CREATE_RECORD] Values:`, values);

    try {
      await this.dbQuery(sql, values);
      console.log(`✅ [TRIGGER][CREATE_RECORD] Inserted into ${table}`);
      return { ok: true, table, inserted: columns.length };
    } catch (e) {
      console.error(`❌ [TRIGGER][CREATE_RECORD] Error:`, e);
      return { ok: false, error: e.message };
    }
  }

  async _action_createTask(context, params) {
    const ticketId = context.ticketId;
    const userId = context.actor?.user_id || 0; // functional user or system

    if (!ticketId) {
      return { ok: false, error: 'missing ticketId' };
    }

    const title = params.title || 'New Task';
    const description = params.description || '';
    const priority = params.priority || 'medium';
    const dueDate = params.due_date || null;

    try {
      // 1. Find active assignment for this ticket (JOIN t_ticket to get service_id)
      const assignments = await this.dbQuery(
        `SELECT ta.id, t.service_id 
         FROM t_ticket_assignment ta 
         JOIN t_ticket t ON t.ticket_id = ta.ticket_id 
         WHERE ta.ticket_id = ? AND ta.assignment_status = ? 
         ORDER BY ta.id DESC LIMIT 1`,
        [ticketId, 'active']
      );

      if (!assignments.length) {
        console.log(`⚠️ [TRIGGER][TASK] No active assignment found for ticket ${ticketId}. Cannot create task.`);
        return { ok: false, error: 'No active assignment found' };
      }

      const assignmentId = assignments[0].id;
      const serviceId = assignments[0].service_id;

      // 2. Determine Task Entity ID
      const taskEntityId = `TASK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // 3. Determine Order
      const orderResult = await this.dbQuery(`
          SELECT MAX(CAST(field_value AS UNSIGNED)) as max_order 
          FROM t_ticket_work_data 
          WHERE assignment_id = ? AND data_type = 'task' AND field_name = 'order'
      `, [assignmentId]);

      // Handle dbQuery returning array or object depending on driver implementation, usually array of rows
      const maxOrder = (orderResult[0] && orderResult[0].max_order) ? Number(orderResult[0].max_order) : 0;
      const nextOrder = maxOrder + 1;

      // 4. Prepare Task Fields
      const taskFields = {
        title,
        description,
        priority,
        status: 'todo',
        order: nextOrder.toString()
      };

      if (dueDate) taskFields.due_date = dueDate;

      // 5. Insert into t_ticket_work_data
      // We can't use db.promise().query here, we must use this.dbQuery which abstracts it.
      // But this.dbQuery usually takes a single query string. modifying a loop to separate inserts.

      console.log(`🔍 [TRIGGER][TASK] Creating task "${title}" for assignment ${assignmentId}`);

      for (const [key, value] of Object.entries(taskFields)) {
        await this.dbQuery(`
            INSERT INTO t_ticket_work_data 
            (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by, created_at)
            VALUES (?, ?, ?, 'task', ?, ?, ?, ?, NOW())
         `, [ticketId, assignmentId, serviceId, taskEntityId, key, String(value), userId]);
      }

      console.log(`✅ [TRIGGER][TASK] Task created successfully: ${taskEntityId}`);

      // Emit socket update if global io exists
      if (global.io) {
        global.io.emit("message", "update_task_" + assignmentId);
      }

      return { ok: true, taskId: taskEntityId };

    } catch (e) {
      console.error(`❌ [TRIGGER][TASK] Error creating task:`, e);
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

    // Check execution depth for loop detection
    const depth = context._triggerDepth || 0;
    const chain = context._triggerChain || [];
    const eventInfo = `${eventName}`;

    if (depth >= this.MAX_TRIGGER_DEPTH) {
      console.error(`❌ [TRIGGER] INFINITE LOOP DETECTED! Max depth ${this.MAX_TRIGGER_DEPTH} reached.`);
      console.error(`   Chain: ${[...chain, eventInfo].join(' → ')}`);
      await this._logLoopWarning(context, [...chain, eventInfo]);
      return [{ error: 'max_depth_exceeded', chain: [...chain, eventInfo] }];
    }

    // Update context for nested triggers
    context._triggerDepth = depth + 1;
    context._triggerChain = [...chain, eventInfo];

    console.log(`📊 [TRIGGER] Depth: ${depth + 1}/${this.MAX_TRIGGER_DEPTH}, Chain: ${context._triggerChain.join(' → ')}`);

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

    // 🔥 NEW: field_value condition type for flexible branching
    if (type === 'field_value') {
      const field = value?.field;
      const operator = value?.operator || '==';
      const target = value?.value;

      if (!field) {
        console.log(`⚠️ [TRIGGER][COND] field_value missing field name`);
        return false;
      }

      // Get actual value from context.values or context directly
      const actualValue = context.values?.[field] ?? context[field];
      console.log(`🔍 [TRIGGER][COND] field_value check: ${field} ${operator} ${target} (actual: ${actualValue})`);

      let result = false;
      switch (operator) {
        case '==':
        case '=':
          result = actualValue == target;
          break;
        case '!=':
        case '<>':
          result = actualValue != target;
          break;
        case '>':
          result = Number(actualValue) > Number(target);
          break;
        case '<':
          result = Number(actualValue) < Number(target);
          break;
        case '>=':
          result = Number(actualValue) >= Number(target);
          break;
        case '<=':
          result = Number(actualValue) <= Number(target);
          break;
        case 'contains':
          result = String(actualValue || '').toLowerCase().includes(String(target).toLowerCase());
          break;
        case 'not_contains':
          result = !String(actualValue || '').toLowerCase().includes(String(target).toLowerCase());
          break;
        case 'starts_with':
          result = String(actualValue || '').toLowerCase().startsWith(String(target).toLowerCase());
          break;
        case 'ends_with':
          result = String(actualValue || '').toLowerCase().endsWith(String(target).toLowerCase());
          break;
        case 'is_empty':
          result = actualValue === null || actualValue === undefined || actualValue === '';
          break;
        case 'is_not_empty':
          result = actualValue !== null && actualValue !== undefined && actualValue !== '';
          break;
        default:
          console.log(`⚠️ [TRIGGER][COND] Unknown operator: ${operator}, defaulting to ==`);
          result = actualValue == target;
      }

      console.log(`${result ? '✅' : '❌'} [TRIGGER][COND] field_value result: ${result}`);
      return result;
    }

    return true;
  }
}

function tryParseJSON(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v)); } catch (e) { return null; }
}

/**
 * Log loop warning to database
 */
TriggerEngine.prototype._logLoopWarning = async function (context, chain) {
  try {
    await this.dbQuery(`
      INSERT INTO t_trigger_warnings 
      (ticket_id, warning_type, trigger_chain, created_at)
      VALUES (?, ?, ?, NOW())
    `, [context.ticketId || null, 'infinite_loop', JSON.stringify(chain)]);
    console.log(`✅ [TRIGGER] Loop warning logged to database`);
  } catch (err) {
    console.error(`❌ [TRIGGER] Failed to log loop warning:`, err.message);
  }
};

module.exports = new TriggerEngine();
