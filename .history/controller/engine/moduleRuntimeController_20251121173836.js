const { dbQueryHots } = require('../../config/db');
const { loadModule } = require('../../core/engine-loader');
const formEngine      = require('../../core/form-engine');
const triggerEngine   = require('../../core/trigger-engine');
const documentEngine  = require('../../core/document-engine');

async function saveEav(ticketId, values) {
  const rows = [];
  const params = [];
  let counter = 1;

  for (const key of Object.keys(values)) {
    rows.push("(?,?,?,?)");
    params.push(ticketId, counter, key, values[key]);
    counter++;
  }

  if (rows.length === 0) return;

  await dbQueryHots(
    `INSERT INTO t_ticket_detail_eav 
      (ticket_id, cstm_col, lbl_col, value)
     VALUES ${rows.join(",")}`,
    params
  );
}

module.exports = {
  
  // GET MODULE METADATA
  getModulePublic: async (req, res) => {
    const moduleKey = req.params.moduleKey;
    const m = await loadModule(moduleKey);
    if (!m) return res.status(404).json({ ok: false, message: 'Module not found' });
    res.json({ ok: true, module: m });
  },

  // SUBMIT ENGINE MODULE
  submitModule: async (req, res) => {
    try {
      const moduleKey = req.params.moduleKey;
      const m = await loadModule(moduleKey);
      if (!m) return res.status(404).json({ ok: false, message: 'Module not found' });

      const { company_id, creator_id, creator_email, values } = req.body;

      // DB ENGINE VALIDATION
      const errors = formEngine.validate(m.form_json, values || {});
      if (errors.length) {
        return res.status(400).json({ ok: false, errors });
      }

      // GENERATE TICKET ID
      const ticketId = `ENG-${Date.now()}`;

      // INSERT ENGINE TICKET HEADER
      await dbQueryHots(
        `INSERT INTO t_ticket_engine 
          (ticket_id, company_id, service_name, creator_id, creator_email, status, workflow_level)
         VALUES (?, ?, ?, ?, ?, 'open', 0)`,
        [ticketId, company_id || 0, moduleKey, creator_id || null, creator_email || null]
      );

      // SAVE FORM (EAV)
      await saveEav(ticketId, values);

      // RUN TRIGGERS
      try {
        await triggerEngine.run(
          m.triggers_json,
          { ticketId, values },
          { documentEngine }
        );
      } catch (e) {
        console.error("Trigger error:", e);
      }

      res.json({ ok: true, ticketId });

    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  // GET STATUS + DETAILS
  status: async (req, res) => {
    const rows = await dbQueryHots(
      "SELECT * FROM t_ticket_engine WHERE ticket_id = ?",
      [req.params.ticketId]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Ticket not found' });
    }

    const details = await dbQueryHots(
      "SELECT * FROM t_ticket_detail_eav WHERE ticket_id = ?",
      [req.params.ticketId]
    );

    res.json({ ok: true, ticket: rows[0], details });
  }

};
