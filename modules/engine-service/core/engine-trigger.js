/**
 * ENGINE TRIGGER HANDLER
 * Executes triggers.json definitions like email, logs, PDF generation
 */

const fs = require("fs");
const path = require("path");

module.exports = {
  loadTriggers: (servicePath) => {
    const file = path.join(servicePath, "triggers.json");

    if (!fs.existsSync(file)) return null;

    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      console.error("ENGINE TRIGGER PARSE ERROR:", err);
      return null;
    }
  },

  runTriggers: async (triggers, context) => {
    if (!triggers || !Array.isArray(triggers)) return;

    for (const t of triggers) {
      switch (t.type) {
        case "log":
          console.log("[ENGINE TRIGGER][LOG]:", t.message || "", context.ticketId);
          break;

        case "email":
          console.log(
            "[ENGINE TRIGGER][EMAIL]:",
            "to=" + t.to,
            "subject=" + t.subject
          );
          break;

        case "pdf":
          console.log("[ENGINE TRIGGER][PDF GENERATE]");
          break;

        default:
          console.warn("[ENGINE TRIGGER] Unknown type:", t.type);
      }
    }
  },
};
