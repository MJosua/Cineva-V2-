/**
 * core/form-loader.js
 * Loads dynamic form definitions (from m_service.form_json) and validates submitted form_data.
 *
 * Minimal, pluggable validation: ensures required fields exist and basic type checks.
 */

const engineLoader = require('./engine-loader');

class FormLoader {
  constructor() {}

  /**
   * getFormByModuleKey(moduleKey)
   * Returns parsed form descriptor or null
   */
  async getFormByModuleKey(moduleKey) {
    const svc = engineLoader.getServiceConfig(moduleKey);
    if (!svc) return null;
    return svc.form_json || null;
  }

  /**
   * validate(formDesc, formData)
   * Basic validator. Returns array of errors: [{field, message}]
   *
   * formDesc format: assumed to be your front-end schema (items array).
   */
  validate(formDesc, formData = {}) {
    if (!formDesc || !formDesc.items) return [];
    const errors = [];

    for (const item of (formDesc.items || [])) {
      if (item.type === 'field') {
        const key = item.data && item.data.name;
        if (!key) continue;
        const required = item.data && item.data.required;
        const label = item.data && item.data.label || key;

        const value = formData[key];
        if (required) {
          const empty = (value === null || typeof value === 'undefined' || (typeof value === 'string' && value.trim() === ''));
          if (empty) errors.push({ field: key, message: `${label} is required` });
        }

        // simple type checks (number/select/file)
        if (value != null && item.data && item.data.type) {
          const t = item.data.type;
          if (t === 'number') {
            if (value !== '' && isNaN(Number(value))) errors.push({ field: key, message: `${label} must be a number` });
          }
        }
      }

      // rowgroup -> ensure arrays etc.
      if (item.type === 'rowgroup' && item.data && item.data.structure) {
        const key = item.id || item.data.title || 'rowgroup';
        const rows = formData[key];
        if (item.data.required && (!Array.isArray(rows) || !rows.length)) {
          errors.push({ field: key, message: `${item.data.title || key} requires at least one row` });
        }
      }
    }

    return errors;
  }
}

module.exports = new FormLoader();
