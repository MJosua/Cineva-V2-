// controller/cms/cmsController.js
const { dbQueryHots } = require('../../config/db');

module.exports = {
  // PUBLIC PAGE
  getPublicPage: async (req, res) => {
    try {
      const slug = req.params.slug;
      console.log('[cmsController] getPublicPage', slug);

      const rows = await dbQueryHots(
        'SELECT * FROM m_cms_page WHERE slug = ? AND status = ?',
        [slug, 'published']
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ ok: false, message: 'Page not found' });
      }

      return res.json({ ok: true, page: rows[0] });
    } catch (e) {
      console.error('CMS GET PUBLIC ERROR:', e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },

  // LIST ADMIN PAGES
  listPages: async (req, res) => {
    try {
      console.log('[cmsController] listPages by', req.dataToken?.user_id);

      const rows = await dbQueryHots(
        'SELECT * FROM m_cms_page ORDER BY created_at DESC LIMIT 200'
      );

      return res.json({ ok: true, pages: rows });
    } catch (e) {
      console.error('CMS LIST ERROR:', e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },

  // GET PAGE BY ID
  getPageById: async (req, res) => {
    try {
      const id = Number(req.params.id);
      console.log('[cmsController] getPageById', id);

      const rows = await dbQueryHots(
        'SELECT * FROM m_cms_page WHERE page_id = ? LIMIT 1',
        [id]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ ok: false, message: 'Page not found' });
      }

      return res.json({ ok: true, page: rows[0] });
    } catch (e) {
      console.error('CMS GET ERROR:', e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },

  // CREATE OR UPDATE PAGE
  savePage: async (req, res) => {
    console.log('[cmsController] savePage hit');

    try {
      // SIMPLE HOTS-STYLE ADMIN CHECK
      if (req.dataToken.role_id != 4) {
        console.warn('[cmsController] Forbidden — admin only');
        return res.status(403).json({ ok: false, message: 'Forbidden' });
      }

      const userId = req.dataToken.user_id;
      const payload = req.body || {};
      const {
        page_id,
        slug,
        title,
        summary = null,
        content_json = [],
        meta_json = null,
        status = 'draft',
        module_key = null,
      } = payload;

      if (!slug || !title) {
        return res
          .status(400)
          .json({ ok: false, message: 'slug and title are required' });
      }

      const contentStr =
        typeof content_json === 'string'
          ? content_json
          : JSON.stringify(content_json);

      const metaStr =
        meta_json
          ? typeof meta_json === 'string'
            ? meta_json
            : JSON.stringify(meta_json)
          : null;

      // UPDATE
      if (page_id) {
        await dbQueryHots(
          `UPDATE m_cms_page
           SET slug=?, title=?, summary=?, content_json=?, meta_json=?, status=?, updated_by=?, module_key=?
           WHERE page_id = ?`,
          [slug, title, summary, contentStr, metaStr, status, userId, module_key, page_id]
        );

        await dbQueryHots(
          `INSERT INTO t_cms_page_log (page_id, user_id, action, payload)
           VALUES (?, ?, ?, ?)`,
          [page_id, userId, 'updated', JSON.stringify(payload)]
        );

        console.log('[cmsController] updated page', page_id);
        return res.json({ ok: true, message: 'updated', page_id });
      }

      // CREATE
      const result = await dbQueryHots(
        `INSERT INTO m_cms_page
         (slug, title, summary, content_json, meta_json, status, created_by, updated_by, module_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [slug, title, summary, contentStr, metaStr, status, userId, userId, module_key]
      );

      const insertId = result.insertId;

      await dbQueryHots(
        `INSERT INTO t_cms_page_log (page_id, user_id, action, payload)
         VALUES (?, ?, ?, ?)`,
        [insertId, userId, 'created', JSON.stringify(payload)]
      );

      console.log('[cmsController] created page', insertId);
      return res.json({ ok: true, message: 'created', page_id: insertId });
    } catch (e) {
      console.error('CMS SAVE ERROR:', e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  },

  // DELETE PAGE
  deletePage: async (req, res) => {
    try {
      if (req.dataToken.role_id != 4) {
        return res.status(403).json({ ok: false, message: 'Forbidden' });
      }

      const id = Number(req.params.id);

      await dbQueryHots(
        'DELETE FROM m_cms_page WHERE page_id = ?',
        [id]
      );

      await dbQueryHots(
        'INSERT INTO t_cms_page_log (page_id, user_id, action) VALUES (?, ?, ?)',
        [id, req.dataToken.user_id, 'deleted']
      );

      return res.json({ ok: true });
    } catch (e) {
      console.error('CMS DELETE ERROR:', e);
      return res.status(500).json({ ok: false, message: e.message });
    }
  }
};
