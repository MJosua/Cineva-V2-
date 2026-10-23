const { dbHots } = require('../../../config/db');

function toInt(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function actorId(req) {
  return req?.dataToken?.user_id || 1;
}

function errorResponse(res, error, label) {
  console.error(`[JobClaimController] ${label}:`, error);
  return res.status(500).json({ success: false, message: error.message });
}

/**
 * Checks if the hots engine database/table is accessible locally.
 */
async function isHotsEngineReady(conn) {
  try {
    await conn.query('SELECT 1 FROM hots.t_ticket LIMIT 1');
    return true;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_DB_ERROR') {
      console.warn(`[JobClaimController] Warning: Engine table 'hots.t_ticket' not found. Local-safe mode: Skipping engine sync.`);
    } else {
      console.warn(`[JobClaimController] Warning: Engine access issue (${e.code}). Skipping engine sync.`);
    }
    return false;
  }
}

async function generateNumericTicketID(conn, serviceId, userId) {
  const year = new Date().getFullYear().toString().slice(-2);
  const service = String(serviceId).padStart(2, "0");
  const user = String(userId || 1004).padStart(4, "0");

  const [rows] = await conn.query(
    `SELECT ticket_id FROM hots.t_ticket WHERE ticket_id LIKE ? ORDER BY ticket_id DESC LIMIT 1`,
    [`${year}${service}${user}%`]
  );

  let running = "0001";
  if (rows.length > 0) {
    const last = rows[0].ticket_id.toString();
    const lastRun = parseInt(last.slice(-4)) || 0;
    running = String(lastRun + 1).padStart(4, "0");
  }

  return `${year}${service}${user}${running}`;
}

module.exports = {
  /**
   * KOL clicks "Take Job"
   * Creates a pickup record and an Informative Request Ticket in HOTS
   */
  async takeJob(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const jobId = toInt(req.body.job_id);
      const userId = actorId(req);

      if (!jobId) return res.status(400).json({ success: false, message: 'job_id is required' });

      // 1. Fetch Job & PIC info + Talent info for descriptive ticket
      const [jobRows] = await conn.query(
        `SELECT j.job_id, j.title, j.pic_id, j.company_id, c.campaign_name, c.brand_name, c.incentive
         FROM t_job_list j 
         LEFT JOIN data_job_campaign c ON c.job_id = j.job_id 
         WHERE j.job_id = ? LIMIT 1`,
        [jobId]
      );
      if (!jobRows.length) return res.status(404).json({ success: false, message: 'Job not found' });
      const job = jobRows[0];

      const [userRows] = await conn.query(`SELECT firstname, lastname, email FROM user WHERE user_id = ?`, [userId]);
      const talent = userRows[0] || { firstname: 'Unknown', lastname: 'Talent', email: '' };

      await conn.beginTransaction();

      // 2. Insert into data_t_job_pickup
      const [pickupResult] = await conn.query(
        `INSERT INTO data_t_job_pickup (job_id, user_id, pickup_status) VALUES (?, ?, 'requested')`,
        [jobId, userId]
      );

      // --- 3. Create Informative Request Ticket (Local-Safe) ---
      let ticketId = null;
      if (await isHotsEngineReady(conn)) {
        try {
          const serviceId = 19; // Job Application
          ticketId = await generateNumericTicketID(conn, serviceId, userId);

          await conn.query(
            `INSERT INTO hots.t_ticket (ticket_id, service_id, title, status_id, created_by, company_id, creation_date, last_update)
             VALUES (?, ?, ?, 1, ?, ?, CURDATE(), CURDATE())`,
            [ticketId, serviceId, `Application: ${talent.firstname} for ${job.brand_name}`, userId, job.company_id || 1]
          );

          // 4. Populate t_ticket_detail with Job & Talent Context
          const details = [
            [ticketId, 'job_id', 'Job ID', String(jobId), 'text'],
            [ticketId, 'campaign_name', 'Campaign', job.campaign_name, 'text'],
            [ticketId, 'brand', 'Brand', job.brand_name, 'text'],
            [ticketId, 'incentive', 'Proposed Incentive', String(job.incentive || ''), 'text'],
            [ticketId, 'talent_name', 'Applicant Name', `${talent.firstname} ${talent.lastname}`, 'text']
          ];
          if (talent.email) details.push([ticketId, 'talent_email', 'Talent Email', talent.email, 'text']);

          await conn.query(
            `INSERT INTO hots.t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_type) VALUES ?`,
            [details]
          );

          // 5. Assign Ticket to PIC
          if (job.pic_id) {
            await conn.query(
              `INSERT INTO hots.t_ticket_assignment (ticket_id, assigned_type, assigned_id, title)
               VALUES (?, 'user', ?, ?)`,
              [ticketId, job.pic_id, `Review Application: ${job.brand_name}`]
            );
          }
        } catch (e) {
          console.error('[JobClaimController] Engine sync failed:', e.message);
        }
      }

      await conn.commit();

      return res.status(201).json({
        success: true,
        message: 'Job requested successfully.' + (ticketId ? ' Informative ticket created for PIC.' : ''),
        data: { pickup_id: pickupResult.insertId, ticket_id: ticketId }
      });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'takeJob');
    } finally {
      conn.release();
    }
  },

  async listMyRequests(req, res) {
    try {
      const userId = actorId(req);
      const [rows] = await dbHots.promise().query(
        `SELECT p.*, j.title, j.job_code, c.brand_name
         FROM data_t_job_pickup p
         LEFT JOIN t_job_list j ON j.job_id = p.job_id
         LEFT JOIN data_job_campaign c ON c.job_id = j.job_id
         WHERE p.user_id = ?
         ORDER BY p.created_at DESC`,
        [userId]
      );
      return res.status(200).json({ 
        success: true, 
        service_context: 'job_talent',
        data: rows 
      });
    } catch (error) {
      return errorResponse(res, error, 'listMyRequests');
    }
  }
};
