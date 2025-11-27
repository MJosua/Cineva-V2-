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
  }

  registerAction(name, fn) { this.actions[name] = fn; }

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
      await this.dbQuery('UPDATE t_ticket SET status = ? WHERE ticket_id = ?', [status, ticketId]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async _action_sendEmail(context, params) {
    const to = params.to || context.to;
    const cc = params.cc || null;
    const subject = params.subject || '';
    const body = params.body || '';
    if (!to) return { ok: false, error: 'missing to' };

    try {
      // Use existing hotsMailer for direct email sending
      const { hotsMailer } = require('../mailer/hots/hots_mailer');
      await hotsMailer(to, subject, body);

      console.log(`✅ Email sent via trigger to: ${to}`);
      return { ok: true, method: 'direct' };
    } catch (e) {
      console.error(`❌ Failed to send email via trigger to ${to}:`, e.message);
      return { ok: false, error: e.message };
    }
  }

  /**
   * runTriggersForEvent(moduleKey, eventName, context)
   * Loads triggers by service -> m_service_triggers (event_name)
   * Falls back to m_service.trigger_meta.
   */
  async runTriggersForEvent(moduleKeyOrServiceId, eventName, context = {}) {
    const svc = this.engineLoader.getServiceConfig(moduleKeyOrServiceId);
    if (!svc) return [];

    const serviceId = svc.service_id;
    let triggers = [];

    // load from m_service_triggers
    try {
      const rows = await this.dbQuery('SELECT * FROM m_service_triggers WHERE service_id = ? AND trigger_name = ? AND active = 1 ORDER BY id ASC', [serviceId, eventName]);
      for (const r of rows) {
        const cfg = tryParseJSON(r.trigger_config) || null;
        if (cfg) {
          if (Array.isArray(cfg)) triggers.push(...cfg);
          else triggers.push(cfg);
        }
      }
    } catch (e) {
      // ignore
    }

    // fallback: m_service.trigger_meta or trigger_json
    if (!triggers.length && svc.trigger_meta) {
      try {
        const tcfg = (typeof svc.trigger_meta === 'string') ? JSON.parse(svc.trigger_meta) : svc.trigger_meta;
        if (tcfg) {
          if (Array.isArray(tcfg)) triggers.push(...tcfg);
          else if (tcfg[eventName]) triggers.push(...(tcfg[eventName] || []));
        }
      } catch (e) { }
    }

    // execute triggers sequentially
    const results = [];
    for (const t of triggers) {
      const action = t.action || t.type;
      const params = t.params || t.config || {};
      const handler = this.actions[action];
      if (!handler) {
        results.push({ trigger: t, error: `no action registered for ${action}` });
        continue;
      }
      try {
        const res = await handler(context, params);
        results.push({ trigger: t, result: res });
      } catch (e) {
        results.push({ trigger: t, error: e.message });
      }
    }

    return results;
  }
}

function tryParseJSON(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v)); } catch (e) { return null; }
}

module.exports = new TriggerEngine();
