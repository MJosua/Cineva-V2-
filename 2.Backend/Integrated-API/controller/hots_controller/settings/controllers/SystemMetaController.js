const { dbHots } = require("../../../../config/db");

const SystemMetaController = {
  /**
   * GET /auth/system-meta/:key
   * Publicly accessible endpoint to fetch metadata by key (latest active version)
   */
  getPublicMeta: async (req, res) => {
    try {
      const { key } = req.params;
      const query = `
        SELECT cstm_col, lbl_col, value, is_active
        FROM m_system_meta
        WHERE meta_key = ? AND is_latest = 1 AND is_active = 1
      `;
      const [rows] = await dbHots.promise().query(query, [key]);
      
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Metadata not found or inactive" });
      }

      // Transform EAV to flat object
      const meta = rows.reduce((acc, row) => {
        acc[row.cstm_col] = row.value;
        return acc;
      }, { meta_key: key });

      res.status(200).json({ success: true, data: meta });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /settings/system-meta/:key/history
   * Fetch all revisions for a meta key (Admin only)
   */
  getMetaHistory: async (req, res) => {
    try {
      const { key } = req.params;
      const query = `SELECT * FROM m_system_meta WHERE meta_key = ? ORDER BY revision DESC, created_at DESC`;
      const [rows] = await dbHots.promise().query(query, [key]);
      res.status(200).json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /settings/system-meta/update
   * Upsert metadata with versioning support (Admin only)
   */
  upsertMeta: async (req, res) => {
    const conn = await dbHots.promise().getConnection();
    try {
      const { meta_key, items } = req.body; // items: [{ cstm_col, lbl_col, value }]
      
      await conn.beginTransaction();

      // 1. Get current max revision
      const [revRows] = await conn.query("SELECT MAX(revision) as max_rev FROM m_system_meta WHERE meta_key = ?", [meta_key]);
      const nextRev = (revRows[0].max_rev || 0) + 1;

      // 2. Mark old versions as NOT latest
      await conn.query("UPDATE m_system_meta SET is_latest = 0 WHERE meta_key = ?", [meta_key]);

      // 3. Insert new versions
      const insertRows = items.map(item => [
        meta_key, item.cstm_col, item.lbl_col, item.value, nextRev, 1, 1
      ]);

      await conn.query(
        "INSERT INTO m_system_meta (meta_key, cstm_col, lbl_col, value, revision, is_latest, is_active) VALUES ?",
        [insertRows]
      );

      await conn.commit();
      res.status(200).json({ success: true, message: "Metadata updated successfully", revision: nextRev });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ success: false, message: err.message });
    } finally {
      conn.release();
    }
  }
};

module.exports = SystemMetaController;
