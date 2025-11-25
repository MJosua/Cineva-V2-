/**
 * core/engine-loader.js
 * DB-first module registry — uses m_engine_modules as canonical store
 */
function safeParseJSON(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); }
  catch (e) { return null; }
}
class EngineLoader {
  constructor() {
    this.modules = {};
    this.dbQuery = null;
  }
  async init(dbQuery) {
    if (!dbQuery || typeof dbQuery !== 'function') {
      throw new Error('EngineLoader.init requires dbQuery(sql, params) function');
    }
    this.dbQuery = dbQuery;
    await this.reloadAll();
    return this.modules;
  }
  async reloadAll() {
    const sql = `
      SELECT
        service_id, module_key, module_name,
        form_json, workflow_json, triggers_json,
        document_html, theme_json, version, active,
        created_by, updated_by, created_at, updated_at
      FROM m_engine_modules
      WHERE active = 1
    `;
    let rows = [];
    try {
      rows = await this.dbQuery(sql, []);
    } catch (err) {
      this.modules = {};
      return this.modules;
    }
    const modules = {};
    for (const r of rows) {
      const key = r.module_key || r.module_name || `module_${r.service_id}`;
      modules[key] = {
        service_id: r.service_id,
        module_key: key,
        module_name: r.module_name,
        version: r.version,
        active: r.active === 1 || r.active === '1' || r.active === true,
        created_by: r.created_by,
        updated_by: r.updated_by,
        created_at: r.created_at,
        updated_at: r.updated_at,
        form_json: safeParseJSON(r.form_json) || null,
        workflow_json: safeParseJSON(r.workflow_json) || null,
        triggers_json: safeParseJSON(r.triggers_json) || null,
        document_html: r.document_html || null,
        theme_json: safeParseJSON(r.theme_json) || null,
        _meta: r
      };
    }
    try {
      const wfRows = await this.dbQuery('SELECT * FROM m_workflow WHERE active = 1', []);
      for (const wf of wfRows || []) {
        const key = wf.service_key || wf.module_key || wf.service_name;
        if (key && modules[key]) {
          modules[key].workflow_json = modules[key].workflow_json || safeParseJSON(wf.workflow_json) || null;
          modules[key].workflow_meta = wf;
        }
      }
    } catch (e) {}
    try {
      const trRows = await this.dbQuery('SELECT * FROM m_trigger WHERE active = 1', []);
      for (const tr of trRows || []) {
        const key = tr.service_key || tr.module_key || tr.service_name;
        if (key && modules[key]) {
          modules[key].triggers_json = modules[key].triggers_json || safeParseJSON(tr.trigger_json) || null;
          modules[key].trigger_meta = modules[key].trigger_meta || [];
          modules[key].trigger_meta.push(tr);
        }
      }
    } catch (e) {}
    this.modules = modules;
    return this.modules;
  }
  getServiceConfig(moduleKey) {
    if (!moduleKey) return null;
    return this.modules[moduleKey] || null;
  }
  listServices() {
    return Object.keys(this.modules);
  }
  async reloadModule(moduleKey) {
    if (!moduleKey) return null;
    const row = (await this.dbQuery('SELECT * FROM m_engine_modules WHERE module_key = ? LIMIT 1', [moduleKey]))[0];
    if (!row) {
      delete this.modules[moduleKey];
      return null;
    }
    const modDesc = {
      service_id: row.service_id,
      module_key: row.module_key,
      module_name: row.module_name,
      version: row.version,
      active: row.active === 1 || row.active === '1' || row.active === true,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      form_json: safeParseJSON(row.form_json) || null,
      workflow_json: safeParseJSON(row.workflow_json) || null,
      triggers_json: safeParseJSON(row.triggers_json) || null,
      document_html: row.document_html || null,
      theme_json: safeParseJSON(row.theme_json) || null,
      _meta: row
    };
    try {
      const wfr = (await this.dbQuery('SELECT * FROM m_workflow WHERE service_key = ? LIMIT 1', [moduleKey]))[0];
      if (wfr) modDesc.workflow_json = modDesc.workflow_json || safeParseJSON(wfr.workflow_json) || null;
    } catch (err) {}
    try {
      const tr = await this.dbQuery('SELECT * FROM m_trigger WHERE service_key = ?' , [moduleKey]);
      if (tr && tr.length) {
        modDesc.triggers_json = modDesc.triggers_json || null;
        modDesc.trigger_meta = tr;
      }
    } catch (err) {}
    this.modules[moduleKey] = modDesc;
    return modDesc;
  }
}
module.exports = new EngineLoader();