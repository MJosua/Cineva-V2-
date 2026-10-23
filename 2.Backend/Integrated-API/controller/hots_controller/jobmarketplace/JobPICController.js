/**
 * controller/hots_controller/jobmarketplace/JobPICController.js
 */

const { dbHots } = require('../../../config/db');

function toInt(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function actorId(req) {
  return req?.dataToken?.user_id || 1;
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

function errorResponse(res, error, label) {
  console.error(`[JobPICController] ${label}:`, error);
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
      console.warn(`[JobPICController] Warning: Engine table 'hots.t_ticket' not found. Local-safe mode: Skipping engine sync.`);
    } else {
      console.warn(`[JobPICController] Warning: Engine access issue (${e.code}). Skipping engine sync.`);
    }
    return false;
  }
}

module.exports = {
  /**
   * List all applicants (people who requested pickup) for PIC view.
   * Supports filtering by job_id via query (for widgets) or params.
   */
  async listApplicants(req, res) {
    try {
      const jobId = toInt(req.params.job_id || req.query.job_id);
      const [rows] = await dbHots.promise().query(
        `SELECT 
          p.*, u.firstname, u.lastname, u.email, j.title as job_title, c.brand_name,
          up_agg.followers_ig,
          up_agg.followers_tt,
          up_agg.niche,
          up_agg.tier_ig
         FROM data_t_job_pickup p 
         LEFT JOIN user u ON u.user_id = p.user_id 
         LEFT JOIN t_job_list j ON j.job_id = p.job_id
         LEFT JOIN data_job_campaign c ON c.job_id = j.job_id
         LEFT JOIN (
           SELECT user_id,
             MAX(CASE WHEN attribute_name = 'followers_ig' THEN attribute_value END) as followers_ig,
             MAX(CASE WHEN attribute_name = 'followers_tt' THEN attribute_value END) as followers_tt,
             MAX(CASE WHEN attribute_name = 'niche' THEN attribute_value END) as niche,
             MAX(CASE WHEN attribute_name = 'tier_ig' THEN attribute_value END) as tier_ig
           FROM user_profile
           WHERE is_active = 1
           GROUP BY user_id
         ) up_agg ON up_agg.user_id = p.user_id
         WHERE (? IS NULL OR p.job_id = ?) AND p.pickup_status = 'requested' 
         ORDER BY p.created_at DESC`,
        [jobId, jobId]
      );
      return res.status(200).json({ 
        success: true, 
        service_context: 'job_pic', 
        applicants: rows 
      });
    } catch (error) {
      return errorResponse(res, error, 'listApplicants');
    }
  },

  /**
   * Approve a job claim (change requested to picked).
   * Promotes the request to an official talent assignment.
   */
  async approveApplicant(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const pickupId = toInt(req.body.pickup_id || req.params.id);
      if (!pickupId) return res.status(400).json({ success: false, message: 'pickup_id is required' });

      await conn.beginTransaction();

      // 1. Get pickup info & campaign details
      const [pickupRows] = await conn.query(
        `SELECT p.*, c.campaign_id, c.assignment_todo, u.firstname, u.lastname, u.email
         FROM data_t_job_pickup p 
         JOIN user u ON u.user_id = p.user_id
         LEFT JOIN data_job_campaign c ON c.job_id = p.job_id
         WHERE p.pickup_id = ?`,
        [pickupId]
      );
      if (!pickupRows.length) return res.status(404).json({ success: false, message: 'Pickup record not found' });
      const pickup = pickupRows[0];

      // 2. Update status to 'picked'
      await conn.query(`UPDATE data_t_job_pickup SET pickup_status = 'picked', picked_at = NOW() WHERE pickup_id = ?`, [pickupId]);

      // 3. Create Talent Assignment
      if (pickup.campaign_id) {
        await conn.query(
          `INSERT INTO data_job_talent_assignment (campaign_id, user_id, status_visit, created_by)
           VALUES (?, ?, 'pending', ?)`,
          [pickup.campaign_id, pickup.user_id, actorId(req)]
        );
      }

      // --- 4. ENGINE SYNC (Local-Safe) ---
      if (await isHotsEngineReady(conn)) {
        try {
          // FIND THE HOTS TICKET associated with this application
          const [ticketRows] = await conn.query(
            `SELECT ticket_id FROM hots.t_ticket_detail WHERE cstm_col = 'job_id' AND value = ? LIMIT 1`,
            [pickup.job_id]
          );
          const ticketId = ticketRows[0]?.ticket_id;

          if (ticketId) {
            // --- 5. AUTOMATE KANBAN TASKS ---
            let todoList = [];
            try {
              todoList = pickup.assignment_todo ? JSON.parse(pickup.assignment_todo) : [];
            } catch (e) {
              todoList = pickup.assignment_todo ? pickup.assignment_todo.split('\n').filter(l => l.trim()) : [];
            }

            if (Array.isArray(todoList)) {
              for (let i = 0; i < todoList.length; i++) {
                const taskTitle = typeof todoList[i] === 'string' ? todoList[i] : (todoList[i].title || `Task ${i + 1}`);
                const taskEntityId = `TASK_AUTO_${Date.now()}_${i}`;

                await conn.query(
                  `INSERT INTO hots.t_ticket_work_data_env (entity_id, ticket_id, sort_order, status) 
                   VALUES (?, ?, ?, 'todo')`,
                  [taskEntityId, ticketId, i + 1]
                );

                await conn.query(
                  `INSERT INTO hots.t_ticket_work_data (ticket_id, data_type, entity_id, field_name, field_value, created_by)
                   VALUES (?, 'task', ?, 'title', ?, ?)`,
                  [ticketId, taskEntityId, taskTitle, actorId(req)]
                );
              }
            }

            // --- 6. INJECT TALENT PROFILE SUMMARY & TIMELINE ---
            const [profileRows] = await conn.query(
              `SELECT attribute_name, attribute_value FROM user_profile WHERE user_id = ? AND is_active = 1`,
              [pickup.user_id]
            );
            const profileSummary = profileRows.map(p => `<li><strong>${p.attribute_name}</strong>: ${p.attribute_value}</li>`).join('');
            
            const timelineText = `
              <div class="marketplace-approval-log">
                <h4>🚀 Talent Approved: ${pickup.firstname} ${pickup.lastname}</h4>
                <p>Talent officially assigned to campaign. Initial To-Do list has been generated in the Kanban board.</p>
                <ul>
                  <li><strong>Talent Email</strong>: ${pickup.email}</li>
                  ${profileSummary}
                </ul>
              </div>
            `;

            await conn.query(
              `INSERT INTO hots.t_ticket_work_data_report (ticket_id, entity_id, content, created_by)
               VALUES (?, ?, ?, ?)`,
              [ticketId, `APPROVAL_${Date.now()}`, timelineText, actorId(req)]
            );

            const timelineEntityId = `UPDATE_${Date.now()}`;
            await conn.query(
              `INSERT INTO hots.t_ticket_work_data 
               (ticket_id, data_type, entity_id, field_name, field_value, created_by, entry_type)
               VALUES (?, 'timeline_update', ?, 'content', ?, ?, 'manual_update')`,
              [ticketId, timelineEntityId, `Talent ${pickup.firstname} approved. Tasks generated.`, actorId(req)]
            );
          }
        } catch (engineErr) {
          console.error('[JobPICController] Kanban engine sync failed:', engineErr.message);
        }
      }

      await conn.commit();
      return res.status(200).json({ success: true, message: 'Applicant approved, assigned, and Kanban tasks generated.' });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'approveApplicant');
    } finally {
      conn.release();
    }
  },

  /**
   * List official assignments for tracking.
   * Supports filtering by campaign_id via query (for widgets).
   */
  async listAssignments(req, res) {
    try {
      const campaignId = toInt(req.query.campaign_id);
      const [rows] = await dbHots.promise().query(
        `SELECT a.*, u.firstname, u.lastname, u.email, c.campaign_name, j.title as job_title
         FROM data_job_talent_assignment a
         LEFT JOIN user u ON u.user_id = a.user_id
         LEFT JOIN data_job_campaign c ON c.campaign_id = a.campaign_id
         LEFT JOIN t_job_list j ON j.job_id = c.job_id
         WHERE (? IS NULL OR a.campaign_id = ?)
         ORDER BY a.assignment_id DESC`,
        [campaignId, campaignId]
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listAssignments');
    }
  },

  async createAssignment(req, res) {
    try {
      const payload = pick(req.body, ['campaign_id', 'user_id', 'status_visit']);
      const [result] = await dbHots.promise().query(`INSERT INTO data_job_talent_assignment SET ?`, [payload]);
      return res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
      return errorResponse(res, error, 'createAssignment');
    }
  },

  /**
   * Content Logs for reporting progress.
   */
  async listContentLogs(req, res) {
    try {
      const assignmentId = toInt(req.query.assignment_id);
      const campaignId = toInt(req.query.campaign_id);
      
      const where = [];
      const params = [];
      
      if (assignmentId) {
        where.push('cl.assignment_id = ?');
        params.push(assignmentId);
      }
      if (campaignId) {
        where.push('asn.campaign_id = ?');
        params.push(campaignId);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      
      const [rows] = await dbHots.promise().query(
        `SELECT cl.*, u.firstname, u.lastname
         FROM data_job_content_log cl
         LEFT JOIN data_job_talent_assignment asn ON asn.assignment_id = cl.assignment_id
         LEFT JOIN user u ON u.user_id = asn.user_id
         ${whereClause} 
         ORDER BY cl.created_at DESC`,
        params
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listContentLogs');
    }
  },

  /**
   * Submit new content/draft (Called by Talent).
   */
  async createContentLog(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const assignmentId = toInt(req.body.assignment_id);
      const draftLink = req.body.draft_link;
      const notes = req.body.notes || '';
      
      if (!assignmentId) return res.status(400).json({ success: false, message: 'assignment_id is required' });
      if (!draftLink) return res.status(400).json({ success: false, message: 'draft_link is required' });

      await conn.beginTransaction();

      // Ensure assignment exists
      const [asnRows] = await conn.query(
        `SELECT a.campaign_id, a.user_id, c.job_id, u.firstname
         FROM data_job_talent_assignment a
         JOIN data_job_campaign c ON c.campaign_id = a.campaign_id
         JOIN user u ON u.user_id = a.user_id
         WHERE a.assignment_id = ? LIMIT 1`,
        [assignmentId]
      );
      if (!asnRows.length) return res.status(404).json({ success: false, message: 'Assignment not found' });
      
      const asn = asnRows[0];
      const me = actorId(req);

      // 1. Insert Log
      const payload = {
        assignment_id: assignmentId,
        content_status: 'pending',
        draft_link: draftLink,
        notes: notes,
        created_by: me
      };
      const [insertRes] = await conn.query(`INSERT INTO data_job_content_log SET ?`, [payload]);

      // --- 2. ENGINE SYNC (Local-Safe) ---
      if (await isHotsEngineReady(conn)) {
        try {
          const [ticketRows] = await conn.query(
            `SELECT ticket_id FROM hots.t_ticket_detail WHERE cstm_col = 'job_id' AND value = ? LIMIT 1`,
            [asn.job_id]
          );
          const ticketId = ticketRows[0]?.ticket_id;

          if (ticketId) {
            const timelineEntityId = `UPDATE_${Date.now()}`;
            const timelineHTML = `
              <div class="marketplace-approval-log">
                <h4>🚀 New Content Submitted by ${asn.firstname}</h4>
                <p><strong>Assignment ID:</strong> #${assignmentId}</p>
                <p><strong>Link:</strong> <a href="${draftLink}" target="_blank">${draftLink}</a></p>
                ${notes ? `<p><strong>Notes:</strong> <em>"${notes}"</em></p>` : ''}
              </div>
            `;

            // Adding HTML report
            await conn.query(
              `INSERT INTO hots.t_ticket_work_data_report (ticket_id, entity_id, content, created_by)
               VALUES (?, ?, ?, ?)`,
              [ticketId, timelineEntityId + "_RPT", timelineHTML, me]
            );

            // Adding standard timeline text
            await conn.query(
              `INSERT INTO hots.t_ticket_work_data 
               (ticket_id, data_type, entity_id, field_name, field_value, created_by, entry_type)
               VALUES (?, 'timeline_update', ?, 'content', ?, ?, 'manual_update')`,
              [ticketId, timelineEntityId, `Talent ${asn.firstname} submitted new content/draft (Pending Review).`, me]
            );
          }
        } catch (engineErr) {
          console.error('[JobPICController] Timeline sync failed:', engineErr.message);
        }
      }

      await conn.commit();
      return res.status(201).json({ success: true, message: 'Content log submitted successfully', id: insertRes.insertId });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'createContentLog');
    } finally {
      conn.release();
    }
  }
};
