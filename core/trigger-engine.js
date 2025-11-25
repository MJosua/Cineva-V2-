/**
 * core/trigger-engine.js
 * Central trigger runner for HOTS v4 (DB-only, no m_trigger table)
 */

class TriggerEngine {
  constructor() {
    this.dbQuery = null;
    this.engineLoader = null;
    this.documentEngine = null;

    this.actions = {}; // registry of built-in actions
  }

  init({ dbQuery, engineLoader, documentEngine }) {
    if (!dbQuery) throw new Error("TriggerEngine.init requires dbQuery");

    this.dbQuery = dbQuery;
    this.engineLoader = engineLoader;
    this.documentEngine = documentEngine;

    // Register built-in actions
    this.registerAction(
      "generate_document",
      this._action_generateDocument.bind(this)
    );

    this.registerAction(
      "update_ticket_status",
      this._action_updateTicketStatus.bind(this)
    );

    this.registerAction(
      "send_email",
      this._action_sendEmail.bind(this)
    );

    console.log("🔥 TriggerEngine initialized with actions:", Object.keys(this.actions));
  }

  registerAction(name, fn) {
    this.actions[name] = fn;
  }

  /* =============================================================
     ACTION: generate_document
  ============================================================= */
  async _action_generateDocument(context, params) {
    if (!this.documentEngine)
      throw new Error("DocumentEngine not initialized");

    const moduleKey = params.moduleKey || context.moduleKey;
    const ticketId = params.ticketId || context.ticketId;

    const moduleConfig = this.engineLoader.getServiceConfig(moduleKey);
    if (!moduleConfig)
      throw new Error(`Module not found for key: ${moduleKey}`);

    // Allow override from trigger params
    const htmlTemplate = params.templateHtml || moduleConfig.document_html;
    if (!htmlTemplate)
      return { error: "No document template defined" };

    const filePath = await this.documentEngine.generateFromHtmlForTicket(
      moduleKey,
      ticketId,
      htmlTemplate,
      context
    );

    return { filePath };
  }

  /* =============================================================
     ACTION: update_ticket_status
  ============================================================= */
  async _action_updateTicketStatus(context, params) {
    const ticketId = params.ticket_id || context.ticketId;
    const status = params.status;

    if (!ticketId) return { error: "Missing ticket_id" };
    if (!status) return { error: "Missing status" };

    try {
      await this.dbQuery(
        `UPDATE t_ticket_engine SET status=? WHERE ticket_id=?`,
        [status, ticketId]
      );
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
  }

  /* =============================================================
     ACTION: send_email
  ============================================================= */
  async _action_sendEmail(context, params) {
    const { to, cc, subject, body } = params;

    if (!to) return { error: "Missing destination email" };

    try {
      await this.dbQuery(
        `INSERT INTO t_email_queue (\`to\`, \`cc\`, \`subject\`, \`body\`, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [to, cc || null, subject || "", body || ""]
      );
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
  }

  /* =============================================================
     RUN TRIGGERS FOR EVENT
     Only uses m_engine_modules.triggers_json
  ============================================================= */
  async runTriggersForEvent(moduleKey, eventName, context = {}) {
    if (!this.engineLoader) {
      console.warn("⚠ TriggerEngine: engineLoader not initialized.");
      return [];
    }

    const moduleConfig = this.engineLoader.getServiceConfig(moduleKey);
    if (!moduleConfig) {
      console.warn("⚠ TriggerEngine: module not found:", moduleKey);
      return [];
    }

    let triggers = [];

    // triggers_json supports either:
    // - array of triggers
    // - object with eventName: [triggers]
    if (moduleConfig.triggers_json) {
      if (Array.isArray(moduleConfig.triggers_json)) {
        // global triggers for all events
        triggers.push(...moduleConfig.triggers_json);
      } else if (moduleConfig.triggers_json[eventName]) {
        // event-specific
        triggers.push(...moduleConfig.triggers_json[eventName]);
      }
    }

    const results = [];

    for (const trigger of triggers) {
      const actionName = trigger.action || trigger.type;
      const params = trigger.params || trigger.config || {};

      const handler = this.actions[actionName];

      if (!handler) {
        results.push({
          trigger,
          error: `No handler registered for action: ${actionName}`,
        });
        continue;
      }

      try {
        const result = await handler(context, params);
        results.push({ trigger, result });
      } catch (err) {
        results.push({ trigger, error: err.message });
      }
    }

    return results;
  }
}

module.exports = new TriggerEngine();
