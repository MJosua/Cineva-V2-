/**
 * core/form-loader.js
 * DB-Only Form Loader + Validator for HOTS v4
 */
function tryParse(str, fallback) {
  try { return JSON.parse(str); }
  catch { return fallback; }
}

const FormLoader = {
  dbQuery: null,

  async init(dbQuery) {
    this.dbQuery = dbQuery;
    return true;
  },

  async getFormByModuleKey(moduleKey) {
    if (!this.dbQuery) throw new Error("FormLoader requires dbQuery via init()");
    const rows = await this.dbQuery("SELECT * FROM m_form WHERE module_key = ? AND active = 1 LIMIT 1", [moduleKey]);
    if (!rows || rows.length === 0) return null;
    const form = rows[0];
    const sections = await this.dbQuery("SELECT * FROM m_form_section WHERE form_id = ? ORDER BY sort ASC", [form.form_id]);
    const fields = await this.dbQuery("SELECT * FROM m_form_field WHERE form_id = ? ORDER BY sort ASC", [form.form_id]);
    return buildFormDescriptor(form, sections, fields);
  },

  validate(formDesc, formData = {}) {
    const errors = [];
    if (!formDesc || !formDesc.fields) return errors;
    for (const field of formDesc.fields) {
      const key = field.key || field.field_key;
      const raw = formData[key];
      const value = (raw && typeof raw === "object" && "value" in raw) ? raw.value : raw;
      if (field.required && (value === undefined || value === null || value === "")) {
        errors.push({ field: key, message: `"${field.label}" is required` });
        continue;
      }
      if (value === undefined || value === null || value === "") continue;
      if (field.type === "number") {
        if (isNaN(Number(value))) errors.push({ field: key, message: `"${field.label}" must be a number` });
      }
      if (field.type === "date") {
        if (isNaN(Date.parse(value))) errors.push({ field: key, message: `"${field.label}" must be a valid date` });
      }
      if (field.min !== null && field.min !== undefined) {
        if (Number(value) < Number(field.min)) errors.push({ field: key, message: `"${field.label}" must be >= ${field.min}` });
      }
      if (field.max !== null && field.max !== undefined) {
        if (Number(value) > Number(field.max)) errors.push({ field: key, message: `"${field.label}" must be <= ${field.max}` });
      }
      if (field.regex_pattern) {
        try {
          const pattern = new RegExp(field.regex_pattern);
          if (!pattern.test(String(value))) errors.push({ field: key, message: `"${field.label}" does not match expected format` });
        } catch {}
      }
      if ((field.type === "select" || field.type === "dropdown") && field.options_json) {
        const opts = tryParse(field.options_json, []);
        const allowed = opts.map(o => o.value);
        if (!allowed.includes(value)) {
          errors.push({ field: key, message: `"${field.label}" must be one of: ${allowed.join(", ")}` });
        }
      }
      if (field.type === "rowgroup") {
        if (!Array.isArray(value)) {
          errors.push({ field: key, message: `"${field.label}" must be a rowgroup array` });
          continue;
        }
        for (let i = 0; i < value.length; i++) {
          const row = value[i];
          for (const col of field.rowgroup_columns || []) {
            const colVal = row[col.key];
            if (col.required && (colVal === undefined || colVal === "")) {
              errors.push({ field: key, message: `Row ${i+1} in "${field.label}": "${col.label}" is required` });
            }
          }
        }
      }
    }
    return errors;
  }
};

function buildFormDescriptor(form, sections, fields) {
  const descriptor = {
    form_id: form.form_id,
    module_key: form.module_key,
    title: form.title,
    sections: [],
    fields: []
  };
  const sectionMap = {};
  for (const sec of sections) {
    sectionMap[sec.section_id] = {
      section_id: sec.section_id,
      label: sec.label,
      sort: sec.sort,
      fields: []
    };
  }
  for (const f of fields) {
    const fieldDef = {
      field_id: f.field_id,
      key: f.field_key,
      label: f.label,
      type: f.type,
      required: f.required === 1,
      min: f.min_value,
      max: f.max_value,
      placeholder: f.placeholder || "",
      regex_pattern: f.regex_pattern || null,
      options_json: f.options_json || null,
      rowgroup_columns: tryParse(f.rowgroup_columns_json, null),
      meta: tryParse(f.meta_json, {})
    };
    descriptor.fields.push(fieldDef);
    if (sectionMap[f.section_id]) sectionMap[f.section_id].fields.push(fieldDef);
  }
  descriptor.sections = Object.values(sectionMap).sort((a,b) => (a.sort||0)-(b.sort||0));
  return descriptor;
}

module.exports = FormLoader;
