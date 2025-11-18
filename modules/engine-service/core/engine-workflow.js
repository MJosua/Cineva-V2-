/**
 * ENGINE WORKFLOW HANDLER
 * Loads workflow.json and determines approver levels
 */

const fs = require("fs");
const path = require("path");

module.exports = {
  loadWorkflow: (servicePath) => {
    const file = path.join(servicePath, "workflow.json");

    if (!fs.existsSync(file)) return null;

    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      console.error("ENGINE WORKFLOW PARSE ERROR:", err);
      return null;
    }
  },

  // Determine next workflow step
  getNextLevel: (workflowDef, currentLevel) => {
    if (!workflowDef || !workflowDef.levels) return null;

    const next = workflowDef.levels.find(
      (l) => l.level === currentLevel + 1
    );

    return next || null;
  },
};
