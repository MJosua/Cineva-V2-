/**
 * core/engine-loader.js
 * Loads service/module definitions from DB (m_service).
 *
 * Usage:
 *   const engineLoader = require('./core/engine-loader');
 *   await engineLoader.init({ dbQuery: dbQueryHots });
 *   const svc = engineLoader.getServiceConfig('it-support');
 */

const assert = require('assert');

class EngineLoader {
  constructor() {
    this.dbQuery = null;
    this.servicesByKey = new Map();   // key -> module object
    this.servicesById = new Map();    // id  ->module object
  }

  /**
   * init({ dbQuery })
   * dbQuery(sql, params) -> Promise(rows)
   */
  async init({ dbQuery }) {
    assert(dbQuery && typeof dbQuery === 'function', 'EngineLoader.init requires dbQuery(sql, params) function');
    this.dbQuery = dbQuery;

    // load all services
    await this.reloadAll();
    console.log('✔ EngineLoader loaded modules');
  }

  async reloadAll() {
    this.servicesByKey.clear();
    this.servicesById.clear();

    // canonical source: m_service
    const rows = await this.dbQuery('SELECT * FROM m_service WHERE active = 1');

    for (const r of rows) {
      // Normalize parsed JSON fields
      const moduleObj = {
        service_id: r.service_id,
        module_key: r.nav_link || r.service_name || String(r.service_id),
        module_name: r.service_name,
        form_json: tryParseJSON(r.form_json),
        workflow_id: r.workflow_id || r.m_workflow_group || null,
        workflow_json: tryParseJSON(r.workflow_json) || tryParseJSON(r.m_service_workflow) || null,
        trigger_meta: tryParseJSON(r.trigger_meta) || tryParseJSON(r.trigger_json) || null,
        items: tryParseJSON(r.items) || null,  // Form builder items JSON for data separation
        api_endpoint: r.api_endpoint || null,
        engine_version: r.engine_version || null,
        raw: r
      };

      // prefer nav_link or url-like to be module_key, fallback to service_name
      const key = moduleObj.module_key || moduleObj.module_name || `svc_${moduleObj.service_id}`;
      moduleObj.module_key = key;

      // 🎨 CMS PAGE FETCHING
      // Scan form_json for any cms_page_id references and fetch the content
      moduleObj.cms_pages = {};

      if (moduleObj.form_json && Array.isArray(moduleObj.form_json.fields)) {
        const pageIds = moduleObj.form_json.fields
          .filter(f => f.cms_page_id)
          .map(f => f.cms_page_id);

        if (pageIds.length > 0) {
          try {
            const placeholders = pageIds.map(() => '?').join(',');
            const cmsRows = await this.dbQuery(
              `SELECT page_id, content_json FROM m_cms_page WHERE page_id IN (${placeholders})`,
              pageIds
            );

            // Parse content_json and store in cms_pages map
            cmsRows.forEach(cmsRow => {
              const blocks = tryParseJSON(cmsRow.content_json);
              moduleObj.cms_pages[cmsRow.page_id] = blocks || [];
            });
          } catch (err) {
            console.error(`Failed to fetch CMS pages for service ${moduleObj.service_id}:`, err);
          }
        }
      }

      this.servicesByKey.set(key, moduleObj);
      this.servicesById.set(moduleObj.service_id, moduleObj);
    }
  }

  getServiceConfig(moduleKeyOrId) {
    if (moduleKeyOrId == null) return null;
    if (typeof moduleKeyOrId === 'number') return this.servicesById.get(moduleKeyOrId) || null;
    return this.servicesByKey.get(moduleKeyOrId) || this.servicesById.get(Number(moduleKeyOrId)) || null;
  }

  listServices() {
    return Array.from(this.servicesByKey.values());
  }
}

function tryParseJSON(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v)); } catch (e) { return null; }
}

module.exports = new EngineLoader();