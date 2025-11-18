/**
 * NEW HOTS ENGINE CONTROLLER
 * Uses ONLY engine tables:
 *  - t_ticket_engine
 *  - t_ticket_detail_eav
 */

const path = require("path");
const { dbQueryHots } = require("../../config/db");

const engineForm = require("../../modules/engine-service/core/engine-form");
const engineWorkflow = require("../../modules/engine-service/core/engine-workflow");
const engineTrigger = require("../../modules/engine-service/core/engine-trigger");
const engineDocument = require("../../modules/engine-service/core/engine-document");


// Dynamically map service folder
function getServicePath(serviceName) {
  return path.join(__dirname, "../../modules", serviceName);
}


// -------------------------------------------------------------------
// SAVE EAV: HOTS-FORMAT
// values = { "1":{label:"Name",value:"Jos"}, "2":{...} }
// -------------------------------------------------------------------
async function saveEavDetails(ticketId, mappedEav) {
  if (!mappedEav || typeof mappedEav !== "object") return;

  const inserts = [];
  const params = [];

  console.log("📝 Saving Engine EAV:", mappedEav);

  Object.keys(mappedEav)
    .sort((a, b) => Number(a) - Number(b)) // ensure correct order
    .forEach((index) => {
      const entry = mappedEav[index];

      inserts.push("(?, ?, ?, ?)");
      params.push(
        ticketId,
        Number(index), // cstm_col = numeric order
        entry.label || "",
        entry.value ?? ""
      );
    });

  if (inserts.length === 0) return;

  const sql = `
      INSERT INTO t_ticket_detail_eav
      (ticket_id, cstm_col, lbl_col, value)
      VALUES ${inserts.join(",")}
    `;

  await dbQueryHots(sql, params);
}


// -------------------------------------------------------------------
// CREATE TICKET
// -------------------------------------------------------------------
module.exports = {
  create: async (req, res) => {
    try {
      const {
        service_name,
        company_id,
        creator_id,
        creator_email,
        values,
        upload_ids
      } = req.body;

      if (!service_name)
        return res
          .status(400)
          .json({ ok: false, message: "service_name is required" });

      // Load form JSON for validation
      const servicePath = getServicePath(service_name);
      const form = engineForm.loadForm(servicePath);

      const errors = engineForm.validateSubmission(form, values || {});
      if (errors.length)
        return res.status(400).json({ ok: false, errors });

      // Generate Engine Ticket ID
      const ticketId = `ENG-${Date.now()}`;

      // Insert ticket header
      await dbQueryHots(
        `
        INSERT INTO t_ticket_engine
        (ticket_id, company_id, service_name,
         creator_id, creator_email, status, workflow_level)
        VALUES (?, ?, ?, ?, ?, 'open', 0)
      `,
        [
          ticketId,
          company_id || 0,
          service_name,
          creator_id || null,
          creator_email || null,
        ]
      );

      // Insert flattened EAV data
      await saveEavDetails(ticketId, values);

      // Run triggers (async)
      const triggers = engineTrigger.loadTriggers(servicePath);
      engineTrigger.runTriggers(
        triggers,
        { ticketId, data: values },
        { engineDocument }
      );

      return res.json({ ok: true, ticketId });
    } catch (e) {
      console.error("ENGINE CREATE ERROR:", e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },


  // -------------------------------------------------------------------
  // APPROVE TICKET
  // -------------------------------------------------------------------
  approve: async (req, res) => {
    try {
      const { ticket_id } = req.body;

      const rows = await dbQueryHots(
        `SELECT * FROM t_ticket_engine WHERE ticket_id = ? LIMIT 1`,
        [ticket_id]
      );

      if (!rows.length)
        return res.status(404).json({ ok: false, message: "Ticket not found" });

      const ticket = rows[0];
      const servicePath = getServicePath(ticket.service_name);
      const wf = engineWorkflow.loadWorkflow(servicePath);

      const nextLevel = engineWorkflow.getNextLevel(wf, ticket.workflow_level);

      if (!nextLevel) {
        await dbQueryHots(
          `UPDATE t_ticket_engine SET status = 'approved' WHERE ticket_id = ?`,
          [ticket_id]
        );
        return res.json({ ok: true, message: "Ticket completed" });
      }

      const newLevel = ticket.workflow_level + 1;

      await dbQueryHots(
        `UPDATE t_ticket_engine SET workflow_level = ?, status = 'pending' WHERE ticket_id = ?`,
        [newLevel, ticket_id]
      );

      return res.json({ ok: true, nextLevel });
    } catch (e) {
      console.error("ENGINE APPROVE ERROR:", e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },


  // -------------------------------------------------------------------
  // REJECT TICKET
  // -------------------------------------------------------------------
  reject: async (req, res) => {
    try {
      const { ticket_id } = req.body;

      await dbQueryHots(
        `UPDATE t_ticket_engine SET status = 'rejected' WHERE ticket_id = ?`,
        [ticket_id]
      );

      return res.json({ ok: true });
    } catch (e) {
      console.error("ENGINE REJECT ERROR:", e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },


  // -------------------------------------------------------------------
  // GET STATUS
  // -------------------------------------------------------------------
  status: async (req, res) => {
    try {
      const { ticket_id } = req.params;

      const rows = await dbQueryHots(
        `SELECT * FROM t_ticket_engine WHERE ticket_id = ? LIMIT 1`,
        [ticket_id]
      );

      if (!rows.length)
        return res.status(404).json({ ok: false, message: "Ticket not found" });

      const details = await dbQueryHots(
        `SELECT cstm_col, lbl_col, value FROM t_ticket_detail_eav WHERE ticket_id = ? ORDER BY cstm_col`,
        [ticket_id]
      );

      return res.json({ ok: true, ticket: rows[0], details });
    } catch (e) {
      console.error("ENGINE STATUS ERROR:", e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },
};
