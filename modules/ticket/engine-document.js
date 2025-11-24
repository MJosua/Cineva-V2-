/**
 * ENGINE DOCUMENT GENERATOR
 * Loads document.html and performs {{var}} replacements
 */

const fs = require("fs");
const path = require("path");

module.exports = {
  loadTemplate: (servicePath) => {
    const file = path.join(servicePath, "document.html");

    if (!fs.existsSync(file)) return null;

    try {
      return fs.readFileSync(file, "utf8");
    } catch (err) {
      console.error("ENGINE DOCUMENT LOAD ERROR:", err);
      return null;
    }
  },

  // Simple mustache-like replacement: {{key}}
  render: (templateStr, data) => {
    let output = templateStr;

    Object.keys(data || {}).forEach((key) => {
      const pattern = new RegExp(`{{${key}}}`, "g");
      output = output.replace(pattern, data[key]);
    });

    return output;
  },
};
