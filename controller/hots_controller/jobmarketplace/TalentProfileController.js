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
  console.error(`[TalentProfileController] ${label}:`, error);
  return res.status(500).json({ success: false, message: error.message });
}

module.exports = {
  async getProfileSummary(req, res) {
    try {
      const userId = toInt(req.query.user_id || req.dataToken?.user_id);
      if (!userId) return res.status(400).json({ success: false, message: 'user_id is required' });

      const [userRows] = await dbHots.promise().query(
        `SELECT user_id, uid, firstname, lastname, email, role_id, company_id, status, phone
         FROM user
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
      );
      const [attrRows] = await dbHots.promise().query(
        `SELECT attribute_name, attribute_value FROM user_profile WHERE user_id = ? AND is_active = 1`,
        [userId]
      );
      const attributes = {};
      for (const row of attrRows) attributes[row.attribute_name] = row.attribute_value;

      return res.status(200).json({ success: true, data: { user: userRows[0] || null, attributes } });
    } catch (error) {
      return errorResponse(res, error, 'getProfileSummary');
    }
  },

  async createFormResponse(req, res) {
    try {
      const payload = pick(req.body || {}, [
        'email_address', 'name', 'domicile', 'availability_visit', 'instagram_username',
        'instagram_link', 'followers_ig', 'tier_ig', 'tiktok_username', 'tiktok_link',
        'followers_tt', 'tier_tt', 'niche', 'whatsapp', 'hb_name', 'wa_mg', 'nda_status',
        'mapped_user_id',
      ]);
      if (!payload.name) return res.status(400).json({ success: false, message: 'name is required' });
      payload.raw_payload = JSON.stringify(req.body || {});
      const cols = Object.keys(payload);
      const vals = Object.values(payload);
      const [result] = await dbHots.promise().query(
        `INSERT INTO data_t_job_form_response (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        vals
      );
      const [rows] = await dbHots.promise().query(`SELECT * FROM data_t_job_form_response WHERE response_id = ? LIMIT 1`, [result.insertId]);
      return res.status(201).json({ success: true, message: 'Form response created', data: rows[0] || null });
    } catch (error) {
      return errorResponse(res, error, 'createFormResponse');
    }
  },

  async mapFormResponseToProfile(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const id = toInt(req.params.id);
      const userId = toInt(req.body?.user_id || req.query?.user_id);
      if (!id || !userId) return res.status(400).json({ success: false, message: 'response id and user_id are required' });

      await conn.beginTransaction();
      const [responseRows] = await conn.query(`SELECT * FROM data_t_job_form_response WHERE response_id = ? LIMIT 1`, [id]);
      if (!responseRows.length) return res.status(404).json({ success: false, message: 'Form response not found' });
      const source = responseRows[0];

      await conn.query(`UPDATE data_t_job_form_response SET mapped_user_id = ?, updated_at = NOW() WHERE response_id = ?`, [userId, id]);

      const mappings = {
        instagram_username: source.instagram_username,
        instagram_link: source.instagram_link,
        followers_ig: source.followers_ig,
        tier_ig: source.tier_ig,
        tiktok_username: source.tiktok_username,
        tiktok_link: source.tiktok_link,
        followers_tt: source.followers_tt,
        tier_tt: source.tier_tt,
        niche: source.niche,
        whatsapp: source.whatsapp,
        hb_name: source.hb_name,
        wa_mg: source.wa_mg,
        nda_status: source.nda_status,
      };

      for (const [name, value] of Object.entries(mappings)) {
        if (!value) continue;
        const [exists] = await conn.query(`SELECT profile_id FROM user_profile WHERE user_id = ? AND attribute_name = ? LIMIT 1`, [userId, name]);
        if (exists.length) {
          await conn.query(`UPDATE user_profile SET attribute_value = ?, updated_at = NOW() WHERE profile_id = ?`, [String(value), exists[0].profile_id]);
        } else {
          await conn.query(`INSERT INTO user_profile (user_id, attribute_name, attribute_value, created_by) VALUES (?, ?, ?, ?)`, [userId, name, String(value), actorId(req)]);
        }
      }

      await conn.commit();
      return res.status(200).json({ success: true, message: 'Form response mapped to user_profile' });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'mapFormResponseToProfile');
    } finally {
      conn.release();
    }
  },

  async listFormResponses(req, res) {
    try {
      const limit = toInt(req.query.limit, 20);
      const page = toInt(req.query.page, 1);
      const offset = (page - 1) * limit;

      const [rows] = await dbHots.promise().query(
        `SELECT r.*, u.uid as mapped_username
         FROM data_t_job_form_response r
         LEFT JOIN user u ON u.user_id = r.mapped_user_id
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      const [[{ total }]] = await dbHots.promise().query(`SELECT COUNT(*) as total FROM data_t_job_form_response`);

      return res.status(200).json({ success: true, data: rows, meta: { total, limit, page } });
    } catch (error) {
      return errorResponse(res, error, 'listFormResponses');
    }
  }
};
