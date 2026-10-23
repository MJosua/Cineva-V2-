const { dbHots } = require('../../../config/db');

const ALLOWED_JOB_STATUS = new Set(['draft', 'open', 'assigned', 'in_progress', 'closed', 'cancelled']);
const ALLOWED_VISIBILITY = new Set(['private', 'internal', 'public']);

// --- Utilities ---
function toInt(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseLimit(req, fallback = 50, max = 200) {
  const n = toInt(req.query.limit, fallback);
  return Math.max(1, Math.min(max, n || fallback));
}

function parseOffset(req, fallback = 0) {
  const n = toInt(req.query.offset, fallback);
  return Math.max(0, n || fallback);
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

function buildUpdateSet(data, allowedKeys) {
  const updates = [];
  const values = [];
  for (const key of allowedKeys) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  return { updates, values };
}

function isValidStatus(value, allowedSet) {
  if (!value) return true;
  return allowedSet.has(value);
}

function errorResponse(res, error, label) {
  console.error(`[JobManagementController] ${label}:`, error);
  return res.status(500).json({ success: false, message: error.message });
}

// --- Ticket Orchestration (Local-Safe) ---

/**
 * Checks if the hots engine database/table is accessible locally.
 */
async function isHotsEngineReady(conn) {
  try {
    await conn.query('SELECT 1 FROM hots.t_ticket LIMIT 1');
    return true;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_DB_ERROR') {
      console.warn(`[JobManagementController] Warning: Engine table 'hots.t_ticket' not found. Local-safe mode: Skipping engine sync.`);
    } else {
      console.warn(`[JobManagementController] Warning: Engine access issue (${e.code}). Skipping engine sync.`);
    }
    return false;
  }
}

/**
 * Creates a numeric ticket ID for BigInt compatibility
 */
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

/**
 * Creates a system-owned ticket for a new job.
 * Assigned to job_bot (user_id: 1).
 */
async function createJobBotTicket(conn, jobData, actorId) {
  if (!(await isHotsEngineReady(conn))) return null;

  try {
    const serviceId = 20; // Post New Job service
    const botId = 1;      // job_bot
    const ticketId = await generateNumericTicketID(conn, serviceId, botId);

    await conn.query(
      `INSERT INTO hots.t_ticket (ticket_id, service_id, title, status_id, created_by, company_id, creation_date, last_update)
       VALUES (?, ?, ?, 1, ?, ?, CURDATE(), CURDATE())`,
      [ticketId, serviceId, `Marketplace Job: ${jobData.title}`, botId, jobData.company_id || 1]
    );

    return ticketId;
  } catch (e) {
    console.error('[JobManagementController] Failed to create Job Bot Ticket:', e.message);
    return null;
  }
}

// --- Core Logic ---

async function insertDefaultCampaignRow(conn, payload, createdBy) {
  const jobPayload = pick(payload, [
    'job_code', 'title', 'description', 'objective', 'category_id', 'platform_id', 'template_id',
    'company_id', 'owner_type', 'owner_id', 'pic_id', 'job_status', 'visibility',
    'budget_min', 'budget_max', 'quota', 'deadline_at', 'published_at', 'categories_json'
  ]);

  if (!jobPayload.title) jobPayload.title = payload.campaign_name || payload.project_name || 'Untitled Campaign';
  if (!jobPayload.job_code) jobPayload.job_code = `JOB-${Date.now().toString().slice(-8)}`;
  if (!jobPayload.job_status || !isValidStatus(jobPayload.job_status, ALLOWED_JOB_STATUS)) jobPayload.job_status = 'draft';
  if (!jobPayload.visibility || !isValidStatus(jobPayload.visibility, ALLOWED_VISIBILITY)) jobPayload.visibility = 'internal';
  jobPayload.created_by = createdBy;

  const jobColumns = Object.keys(jobPayload);
  const jobValues = Object.values(jobPayload);
  const [jobResult] = await conn.query(
    `INSERT INTO t_job_list (${jobColumns.join(',')}) VALUES (${jobColumns.map(() => '?').join(',')})`,
    jobValues
  );
  const jobId = jobResult.insertId;

  // Create Campaign
  // Map assignment_todo to tasks_json if tasks_json isn't present
  if (payload.assignment_todo && !payload.tasks_json) payload.tasks_json = payload.assignment_todo;

  const campaignPayload = pick(payload, [
    'campaign_name', 'project_name', 'brand_name', 'client_code', 'cineva_pic_code',
    'client_phone', 'target_product', 'job_description', 'incentive', 'timeline_duration',
    'deadline_at', 'capacity_team', 'content_type', 'cms_page_id', 'assignment_todo',
    'platforms_json', 'tasks_json', 'start_date'
  ]);
  campaignPayload.job_id = jobId;
  campaignPayload.created_by = createdBy;
  if (!campaignPayload.campaign_name) campaignPayload.campaign_name = jobPayload.title;

  const campaignColumns = Object.keys(campaignPayload);
  const campaignValues = Object.values(campaignPayload);
  const [campaignResult] = await conn.query(
    `INSERT INTO data_job_campaign (${campaignColumns.join(',')}) VALUES (${campaignColumns.map(() => '?').join(',')})`,
    campaignValues
  );

  // --- Automate Ticket for Job Bot (Local-Safe) ---
  const ticketId = await createJobBotTicket(conn, jobPayload, createdBy);
  
  return { job_id: jobId, campaign_id: campaignResult.insertId, ticket_id: ticketId };
}

module.exports = {
  async listJobs(req, res) {
    try {
      const limit = parseLimit(req, 50);
      const offset = parseOffset(req, 0);
      const q = String(req.query.q || '').trim();
      const jobStatus = String(req.query.job_status || '').trim();
      const visibility = String(req.query.visibility || '').trim();

      const where = [];
      const params = [];
      if (q) {
        where.push('(j.title LIKE ? OR j.job_code LIKE ? OR c.campaign_name LIKE ? OR c.brand_name LIKE ?)');
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (jobStatus) {
        where.push('j.job_status = ?');
        params.push(jobStatus);
      }
      if (visibility) {
        where.push('j.visibility = ?');
        params.push(visibility);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows] = await dbHots.promise().query(
        `SELECT
          j.job_id, j.job_code, j.title, j.description, j.objective, j.job_status, j.visibility,
          j.budget_min, j.budget_max, j.quota, j.deadline_at, j.published_at, j.created_at,
          c.campaign_id, c.campaign_name, c.project_name, c.brand_name, c.content_type, c.incentive, c.cms_page_id,
          cat.category_name,
          p.platform_name,
          (SELECT COUNT(*) FROM data_job_talent_assignment a WHERE a.campaign_id = c.campaign_id) AS assignment_count
        FROM t_job_list j
        LEFT JOIN data_job_campaign c ON c.job_id = j.job_id
        LEFT JOIN data_m_job_category cat ON cat.category_id = j.category_id
        LEFT JOIN data_m_job_platform p ON p.platform_id = j.platform_id
        ${whereClause}
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return res.status(200).json({ 
        success: true, 
        service_context: 'job_page',
        data: { jobs: rows, limit, offset, count: rows.length } 
      });
    } catch (error) {
      return errorResponse(res, error, 'listJobs');
    }
  },

  async getJobDetail(req, res) {
    try {
      const jobId = toInt(req.params.job_id);
      const userId = actorId(req);
      if (!jobId) return res.status(400).json({ success: false, message: 'Invalid job_id' });

      // 1. Core Job & Campaign Info
      const [jobRows] = await dbHots.promise().query(
        `SELECT j.*, c.*, cat.category_name, p.platform_name
         FROM t_job_list j 
         LEFT JOIN data_job_campaign c ON c.job_id = j.job_id 
         LEFT JOIN data_m_job_category cat ON cat.category_id = j.category_id
         LEFT JOIN data_m_job_platform p ON p.platform_id = j.platform_id
         WHERE j.job_id = ? LIMIT 1`,
        [jobId]
      );
      if (!jobRows.length) return res.status(404).json({ success: false, message: 'Job not found' });
      const job = jobRows[0];

      // 2. User-Specific Context (Talent View)
      const [pickupRows] = await dbHots.promise().query(
        `SELECT pickup_id, pickup_status, picked_at FROM data_t_job_pickup WHERE job_id = ? AND user_id = ? LIMIT 1`,
        [jobId, userId]
      );
      const [assignmentRows] = await dbHots.promise().query(
        `SELECT assignment_id, status_visit, created_at FROM data_job_talent_assignment WHERE campaign_id = ? AND user_id = ? LIMIT 1`,
        [job.campaign_id, userId]
      );

      return res.status(200).json({ 
        success: true, 
        data: {
          ...job,
          my_pickup: pickupRows[0] || null,
          my_assignment: assignmentRows[0] || null
        }
      });
    } catch (error) {
      return errorResponse(res, error, 'getJobDetail');
    }
  },

  async listCampaigns(req, res) {
    try {
      const limit = parseLimit(req, 50);
      const offset = parseOffset(req, 0);
      const q = String(req.query.q || '').trim();
      const [rows] = await dbHots.promise().query(
        `SELECT c.*, j.job_code, j.title, j.job_status 
         FROM data_job_campaign c 
         LEFT JOIN t_job_list j ON j.job_id = c.job_id 
         WHERE (? = '' OR c.campaign_name LIKE ?)
         ORDER BY c.campaign_id DESC LIMIT ? OFFSET ?`,
        [q, `%${q}%`, limit, offset]
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listCampaigns');
    }
  },

  async createCampaign(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      await conn.beginTransaction();
      const created = await insertDefaultCampaignRow(conn, req.body || {}, actorId(req));
      await conn.commit();

      return res.status(201).json({ success: true, message: 'Campaign created and system ticket generated', data: created });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'createCampaign');
    } finally {
      conn.release();
    }
  },

  async updateCampaign(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const campaignId = toInt(req.params.id);
      if (!campaignId) return res.status(400).json({ success: false, message: 'Invalid campaign id' });

      const [exists] = await conn.query(`SELECT campaign_id, job_id FROM data_job_campaign WHERE campaign_id = ? LIMIT 1`, [campaignId]);
      if (!exists.length) return res.status(404).json({ success: false, message: 'Campaign not found' });
      const { job_id: jobId } = exists[0];

      await conn.beginTransaction();
      const campaignAllowed = [
        'campaign_name', 'project_name', 'brand_name', 'client_code', 'cineva_pic_code', 'client_phone',
        'target_product', 'job_description', 'incentive', 'timeline_duration', 'deadline_at',
        'capacity_team', 'content_type', 'cms_page_id', 'assignment_todo',
      ];
      const jobAllowed = ['title', 'description', 'objective', 'category_id', 'platform_id', 'job_status', 'visibility', 'budget_min', 'budget_max', 'quota'];

      const { updates: campaignSet, values: campaignValues } = buildUpdateSet(req.body || {}, campaignAllowed);
      const { updates: jobSet, values: jobValues } = buildUpdateSet(req.body || {}, jobAllowed);

      if (campaignSet.length) {
        await conn.query(`UPDATE data_job_campaign SET ${campaignSet.join(', ')}, updated_at = NOW() WHERE campaign_id = ?`, [...campaignValues, campaignId]);
      }
      if (jobSet.length) {
        await conn.query(`UPDATE t_job_list SET ${jobSet.join(', ')}, updated_at = NOW() WHERE job_id = ?`, [...jobValues, jobId]);
      }

      await conn.commit();
      return res.status(200).json({ success: true, message: 'Campaign updated' });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'updateCampaign');
    } finally {
      conn.release();
    }
  },

  async deleteCampaign(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const campaignId = toInt(req.params.id);
      if (!campaignId) return res.status(400).json({ success: false, message: 'Invalid campaign id' });
      await conn.beginTransaction();

      const [rows] = await conn.query(`SELECT job_id FROM data_job_campaign WHERE campaign_id = ?`, [campaignId]);
      if (!rows.length) return res.status(404).json({ success: false, message: 'Campaign not found' });

      await conn.query(`DELETE FROM data_job_campaign WHERE campaign_id = ?`, [campaignId]);
      await conn.commit();
      return res.status(200).json({ success: true, id: campaignId });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'deleteCampaign');
    } finally {
      conn.release();
    }
  },

  // --- Batches ---
  async listBatches(req, res) {
    try {
      const campaignId = toInt(req.query.campaign_id);
      const [rows] = await dbHots.promise().query(
        `SELECT b.*, c.campaign_name FROM data_job_batch b 
         LEFT JOIN data_job_campaign c ON c.campaign_id = b.campaign_id 
         WHERE (? IS NULL OR b.campaign_id = ?)`,
        [campaignId, campaignId]
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listBatches');
    }
  },

  async createBatch(req, res) {
    try {
      const payload = pick(req.body, ['campaign_id', 'batch_name', 'batch_order']);
      const [result] = await dbHots.promise().query(`INSERT INTO data_job_batch SET ?`, [payload]);
      return res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
      return errorResponse(res, error, 'createBatch');
    }
  },

  // --- Locations ---
  async listLocations(req, res) {
    try {
      const batchId = toInt(req.query.batch_id);
      const [rows] = await dbHots.promise().query(
        `SELECT l.*, b.batch_name FROM data_job_location l 
         LEFT JOIN data_job_batch b ON b.batch_id = l.batch_id 
         WHERE (? IS NULL OR l.batch_id = ?)`,
        [batchId, batchId]
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listLocations');
    }
  },

  async createLocation(req, res) {
    try {
      const payload = pick(req.body, ['batch_id', 'outlet_name', 'address', 'gmaps_url']);
      const [result] = await dbHots.promise().query(`INSERT INTO data_job_location SET ?`, [payload]);
      return res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
      return errorResponse(res, error, 'createLocation');
    }
  },

  // ─── Brand Master ─────────────────────────────────────────────────────────

  async listBrands(req, res) {
    try {
      const q = String(req.query.q || '').trim();
      const params = q ? [`%${q}%`] : [];
      const whereClause = q ? `WHERE brand_name LIKE ? AND is_active = 1` : `WHERE is_active = 1`;
      const [rows] = await dbHots.promise().query(
        `SELECT brand_id, brand_name, brand_code, industry, created_at FROM data_m_brand ${whereClause} ORDER BY brand_name ASC LIMIT 200`,
        params
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listBrands');
    }
  },

  async createBrand(req, res) {
    try {
      const { brand_name, brand_code, industry } = req.body;
      if (!brand_name?.trim()) return res.status(400).json({ success: false, message: 'brand_name is required' });

      const normalizedName = brand_name.trim();
      // Check for duplicate (case-insensitive)
      const [existing] = await dbHots.promise().query(
        `SELECT brand_id, brand_name FROM data_m_brand WHERE LOWER(brand_name) = LOWER(?) LIMIT 1`,
        [normalizedName]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Brand already exists', existing: existing[0] });
      }

      const [result] = await dbHots.promise().query(
        `INSERT INTO data_m_brand (brand_name, brand_code, industry, created_by) VALUES (?, ?, ?, ?)`,
        [normalizedName, brand_code || null, industry || null, actorId(req)]
      );
      const [newRow] = await dbHots.promise().query(`SELECT * FROM data_m_brand WHERE brand_id = ?`, [result.insertId]);
      return res.status(201).json({ success: true, data: newRow[0] });
    } catch (error) {
      return errorResponse(res, error, 'createBrand');
    }
  },

  // ─── Job Category Master ───────────────────────────────────────────────────

  async listCategories(req, res) {
    try {
      const q = String(req.query.q || '').trim();
      const params = q ? [`%${q}%`] : [];
      const whereClause = q ? `WHERE category_name LIKE ? AND is_active = 1` : `WHERE is_active = 1`;
      const [rows] = await dbHots.promise().query(
        `SELECT category_id, category_name, slug, description FROM data_m_job_category ${whereClause} ORDER BY category_name ASC`,
        params
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listCategories');
    }
  },

  async createCategory(req, res) {
    try {
      const { category_name, description } = req.body;
      if (!category_name?.trim()) return res.status(400).json({ success: false, message: 'category_name is required' });

      const normalizedName = category_name.trim();
      // Case-insensitive duplicate check
      const [existing] = await dbHots.promise().query(
        `SELECT category_id, category_name FROM data_m_job_category WHERE LOWER(category_name) = LOWER(?) LIMIT 1`,
        [normalizedName]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Category already exists', existing: existing[0] });
      }

      const slug = normalizedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const [result] = await dbHots.promise().query(
        `INSERT INTO data_m_job_category (category_name, slug, description) VALUES (?, ?, ?)`,
        [normalizedName, slug, description || null]
      );
      const [newRow] = await dbHots.promise().query(`SELECT * FROM data_m_job_category WHERE category_id = ?`, [result.insertId]);
      return res.status(201).json({ success: true, data: newRow[0] });
    } catch (error) {
      return errorResponse(res, error, 'createCategory');
    }
  },

  // ─── Platform Master ───────────────────────────────────────────────────────

  async listPlatforms(req, res) {
    try {
      const q = String(req.query.q || '').trim();
      const params = q ? [`%${q}%`] : [];
      const whereClause = q ? `WHERE platform_name LIKE ? AND is_active = 1` : `WHERE is_active = 1`;
      const [rows] = await dbHots.promise().query(
        `SELECT platform_id, platform_name FROM data_m_job_platform ${whereClause} ORDER BY platform_name ASC`,
        params
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listPlatforms');
    }
  },

  async createPlatform(req, res) {
    try {
      const { platform_name } = req.body;
      if (!platform_name?.trim()) return res.status(400).json({ success: false, message: 'platform_name is required' });

      const normalized = platform_name.trim();
      const [existing] = await dbHots.promise().query(
        `SELECT platform_id, platform_name FROM data_m_job_platform WHERE LOWER(platform_name) = LOWER(?) LIMIT 1`,
        [normalized]
      );
      if (existing.length > 0) return res.status(409).json({ success: false, message: 'Platform already exists', existing: existing[0] });

      const [result] = await dbHots.promise().query(`INSERT INTO data_m_job_platform (platform_name) VALUES (?)`, [normalized]);
      const [newRow] = await dbHots.promise().query(`SELECT * FROM data_m_job_platform WHERE platform_id = ?`, [result.insertId]);
      return res.status(201).json({ success: true, data: newRow[0] });
    } catch (error) {
      return errorResponse(res, error, 'createPlatform');
    }
  },

  // ─── Content Type Master ───────────────────────────────────────────────────

  async listContentTypes(req, res) {
    try {
      const q = String(req.query.q || '').trim();
      const params = q ? [`%${q}%`] : [];
      const whereClause = q ? `WHERE type_name LIKE ? AND is_active = 1` : `WHERE is_active = 1`;
      const [rows] = await dbHots.promise().query(
        `SELECT type_id, type_name FROM data_m_job_content_type ${whereClause} ORDER BY type_name ASC`,
        params
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'listContentTypes');
    }
  },

  async createContentType(req, res) {
    try {
      const { type_name } = req.body;
      if (!type_name?.trim()) return res.status(400).json({ success: false, message: 'type_name is required' });

      const normalized = type_name.trim();
      const [existing] = await dbHots.promise().query(
        `SELECT type_id, type_name FROM data_m_job_content_type WHERE LOWER(type_name) = LOWER(?) LIMIT 1`,
        [normalized]
      );
      if (existing.length > 0) return res.status(409).json({ success: false, message: 'Content type already exists', existing: existing[0] });

      const [result] = await dbHots.promise().query(`INSERT INTO data_m_job_content_type (type_name) VALUES (?)`, [normalized]);
      const [newRow] = await dbHots.promise().query(`SELECT * FROM data_m_job_content_type WHERE type_id = ?`, [result.insertId]);
      return res.status(201).json({ success: true, data: newRow[0] });
    } catch (error) {
      return errorResponse(res, error, 'createContentType');
    }
  },

};
