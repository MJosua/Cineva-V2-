/**
 * core/form-loader.js
 * HOTS Engine v4 — DB-Only Form Loader + Validator
 *
 * Features:
 * - Load form structure from m_form, m_form_section, m_form_field
 * - Build full form descriptor
 * - Validate form_data input (create/resubmit)
 * - Support: required, min, max, regex, options, rowgroup validation
 * - Backward compatible with HOTS v3 form-building logic
 */

const { dbHots } = require("../config/db");

function log(...a) { console.log("[FormLoader]", ...a); }

const FormLoader = {

  // ========== LOAD FORM BY MODULE KEY (SERVICE NAME) ==========
  async getFormByModuleKey(moduleKey) {
    try {
      const [formRows] = await dbHots.promise().query(
        `SELECT * FROM m_form WHERE module_key = ? AND active = 1 LIMIT 1`,
        [moduleKey]
      );
      if (!formRows.length) return null;

      const form = formRows[0];

      const [sections] = await dbHots.promise().query(
        `SELECT * FROM m_form_section WHERE form_id = ? ORDER BY sort ASC`,
        [form.form_id]
      );

      const [fields] = await dbHots.promise().query(
        `SELECT * FROM m_form_field WHERE form_id = ? ORDER BY sort ASC`,
        [form.form_id]
      );

      return buildFormDescriptor(form, sections, fields);
    } catch (e) {
      log("❌ getFormByModuleKey error", e);
      return null;
    }
  },

  // ========= VALIDATE FORM INPUT (form_data) =========
  validate(formDesc, formData = {}) {
    const errors = [];

    if (!formDesc || !formDesc.fields) return errors;

    for (const field of formDesc.fields) {
      const key = field.key || field.field_key;
      const value = formData[key];

      // required
      if (field.required && (value === undefined || value === null || value.value === "")) {
        errors.push({
          field: key,
          message: `Field "${field.label}" is required`
        });
        continue;
      }

      if (value === undefined || value === null) continue; // skip optional

      const v = typeof value === "object" && "value" in value ? value.value : value;

      // type checks
      if (field.type === "number") {
        if (isNaN(Number(v))) {
          errors.push({ field: key, message: `Field "${field.label}" must be a number` });
        }
      }

      if (field.type === "date") {
        if (isNaN(Date.parse(v))) {
          errors.push({ field: key, message: `Field "${field.label}" must be a valid date` });
        }
      }

      // min / max
      if (field.min !== null && field.min !== undefined) {
        if (Number(v) < Number(field.min))
          errors.push({ field: key, message: `"${field.label}" must be >= ${field.min}` });
      }

      if (field.max !== null && field.max !== undefined) {
        if (Number(v) > Number(field.max))
          errors.push({ field: key, message: `"${field.label}" must be <= ${field.max}` });
      }

      // regex validation
      if (field.regex_pattern) {
        const pattern = new RegExp(field.regex_pattern);
        if (!pattern.test(String(v))) {
          errors.push({
            field: key,
            message: `"${field.label}" does not match expected format`
          });
        }
      }

      // options validation for dropdown/select
      if (field.type === "select" || field.type === "dropdown") {
        if (field.options_json) {
          const opts = tryParse(field.options_json, []);
          const allowed = opts.map(o => o.value);
          if (!allowed.includes(v)) {
            errors.push({
              field: key,
              message: `"${field.label}" must be one of: ${allowed.join(", ")}`
            });
          }
        }
      }

      // rowgroup validation
      if (field.type === "rowgroup") {
        if (!Array.isArray(v)) {
          errors.push({ field: key, message: `"${field.label}" must be a rowgroup array` });
          continue;
        }

        for (let i = 0; i < v.length; i++) {
          const row = v[i];
          for (const col of field.rowgroup_columns || []) {
            const colVal = row[col.key];
            if (col.required && (colVal === undefined || colVal === "")) {
              errors.push({
                field: key,
                message: `Rowgroup "${field.label}" row ${i + 1}: "${col.label}" is required`
              });
            }
          }
        }
      }
    }

    return errors;
  }
};

/* ============================================================
   INTERNAL HELPER: BUILD FORM DESCRIPTOR
============================================================ */
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

  descriptor.sections = Object.values(sectionMap).sort((a, b) => a.sort - b.sort);

  return descriptor;
}

/* ============================================================
   SAFE JSON PARSER
============================================================ */
function tryParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

module.exports = FormLoader;
