/**
 * ENGINE FORM HANDLER
 * Loads and validates JSON-based form structure
 */

const fs = require("fs");
const path = require("path");

module.exports = {
  // Load form.json for a service
  loadForm: (servicePath) => {
    const file = path.join(servicePath, "form.json");

    if (!fs.existsSync(file)) return null;

    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      console.error("ENGINE FORM PARSE ERROR:", err);
      return null;
    }
  },

  // Basic validation according to required fields in form structure
  validateSubmission: (formDef, values) => {
    const errors = [];

    if (!formDef || !formDef.items) return errors;

    const traverse = (items) => {
      items.forEach((item) => {
        if (item.type === "field") {
          const f = item.data;
          if (f.required) {
            if (
              values[f.name] === undefined ||
              values[f.name] === null ||
              values[f.name] === ""
            ) {
              errors.push({
                field: f.name,
                message: "Required",
              });
            }
          }
        }

        if (item.type === "section" && item.data?.fields) {
          item.data.fields.forEach((f) => {
            if (f.required) {
              if (
                values[f.name] === undefined ||
                values[f.name] === null ||
                values[f.name] === ""
              ) {
                errors.push({
                  field: f.name,
                  message: "Required",
                });
              }
            }
          });
        }
      });
    };

    traverse(formDef.items);

    return errors;
  },
};
