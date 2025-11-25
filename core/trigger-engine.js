/**
 * core/trigger-engine.js
 * Trigger engine that reads triggers_json from m_engine_modules (module config)
 */
class TriggerEngine {
  constructor() {
    this.dbQuery = null;
    this.engineLoader = null;
    this.documentEngine = null;
    this.actions = {};
  }
  init({ dbQuery, engineLoader, documentEngine }) {
    if (!dbQuery) throw new Error('TriggerEngine.init requires dbQuery');
    this.dbQuery = dbQuery;
    this.engineLoader = engineLoader;
    this.documentEngine = documentEngine;
    this.registerAction('generate_document', this._action_generateDocument.bind(this));
    this.registerAction('update_ticket_status', this._action_updateTicketStatus.bind(this));
    this.registerAction('send_email', this._action_sendEmail.bind(this));
    console.log('TriggerEngine initialized');
  }
  registerAction(name, fn) { this.actions[name] = fn; }

  async _action_generateDocument(context, params) {
    if (!this.documentEngine) throw new Error('DocumentEngine not initialized');
    const moduleKey = params.moduleKey || context.moduleKey;
    const ticketId = params.ticketId || context.ticketId;
    const moduleConfig = this.engineLoader.getServiceConfig(moduleKey);
    if (!moduleConfig) return { error: 'module not found' };
    const html = params.templateHtml || moduleConfig.document_html;
    if (!html) return { error: 'no template' };
    const filePath = await this.documentEngine.generateFromHtmlForTicket(moduleKey, ticketId, html, context);
    return { filePath };
  }

  async _action_updateTicketStatus(context, params) {
    const ticketId = params.ticket_id || context.ticketId;
    const status = params.status;
    if (!ticketId || typeof status === 'undefined') return { error: 'missing param' };
    try {
      await this.dbQuery('UPDATE t_ticket_engine SET status=?, updated_at=NOW() WHERE ticket_id=?', [status, ticketId]);
      return { ok:true };
    } catch (e) { return { error: e.message }; }
  }

  async _action_sendEmail(context, params) {
    const { to, cc, subject, body } = params || {};
    if (!to) return { error:'missing to' };
    try {
      await this.dbQuery('INSERT INTO t_email_queue (`to`,`cc`,`subject`,`body`,created_at) VALUES (?, ?, ?, ?, NOW())', [to, cc||null, subject||'', body||'']);
      return { ok:true };
    } catch (e) { return { error: e.message }; }
  }

  async runTriggersForEvent(moduleKey, eventName, context = {}) {
    if (!this.engineLoader) return [];
    const moduleConfig = this.engineLoader.getServiceConfig(moduleKey);
    if (!moduleConfig) return [];
    const triggersJson = moduleConfig.triggers_json;
    let triggers = [];
    if (!triggersJson) return [];
    if (Array.isArray(triggersJson)) triggers.push(...triggersJson);
    else if (typeof triggersJson === 'object' && triggersJson[eventName]) triggers.push(...(triggersJson[eventName] || []));
    const results = [];
    for (const t of triggers) {
      const action = t.action || t.type;
      const params = t.params || t.config || {};
      const handler = this.actions[action];
      if (!handler) { results.push({ trigger:t, error:`no handler ${action}`}); continue; }
      try { const r = await handler(context, params); results.push({ trigger:t, result: r }); } catch (e) { results.push({ trigger:t, error: e.message }); }
    }
    return results;
  }
}
module.exports = new TriggerEngine();
