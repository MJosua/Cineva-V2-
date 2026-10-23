const { dbQueryHots } = require('../../../config/db');

const CMSController = {
    // ─────────────────────────────────────────────
    // Categories
    // ─────────────────────────────────────────────
    getCategories: async (req, res) => {
        try {
            const rows = await dbQueryHots(
                'SELECT * FROM cms_m_category WHERE is_active = 1 ORDER BY category_name ASC'
            );
            res.json({ success: true, data: rows, ok: true });
        } catch (error) {
            console.error('getCategories error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // Inline category creation from editor
    createCategory: async (req, res) => {
        const { category_name, color_class, icon, module_key } = req.body;
        if (!category_name) {
            return res.status(400).json({ success: false, message: 'category_name is required', ok: false });
        }
        const slug = category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        try {
            const result = await dbQueryHots(
                `INSERT INTO cms_m_category (category_name, category_slug, color_class, icon, module_key, is_active)
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [category_name, slug, color_class || 'bg-blue-100 text-blue-700', icon || '📁', module_key || 'BLOG']
            );
            const [newCat] = await dbQueryHots(
                'SELECT * FROM cms_m_category WHERE category_id = ?', [result.insertId]
            );
            res.json({ success: true, data: newCat, ok: true });
        } catch (error) {
            console.error('createCategory error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // ─────────────────────────────────────────────
    // Public Pages / Posts
    // ─────────────────────────────────────────────
    getPosts: async (req, res) => {
        const { module_key, category_id, limit = 10, offset = 0 } = req.query;
        try {
            let query = `
                SELECT p.*, c.category_name, c.color_class, c.icon as category_icon 
                FROM cms_m_page p
                LEFT JOIN cms_m_category c ON CAST(JSON_UNQUOTE(JSON_EXTRACT(p.meta_json, '$.category_id')) AS UNSIGNED) = c.category_id
                WHERE p.status = 'published'
            `;
            const params = [];

            if (module_key) {
                query += ' AND p.module_key = ?';
                params.push(module_key);
            }
            if (category_id) {
                query += " AND CAST(JSON_UNQUOTE(JSON_EXTRACT(p.meta_json, '$.category_id')) AS UNSIGNED) = ?";
                params.push(parseInt(category_id));
            }

            query += ' ORDER BY p.is_pinned DESC, p.priority DESC, p.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const rows = await dbQueryHots(query, params);
            res.json({ success: true, data: rows, ok: true });
        } catch (error) {
            console.error('getPosts error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // Public slug fetch
    getPublicPostBySlug: async (req, res) => {
        const { slug } = req.params;
        try {
            const rows = await dbQueryHots(
                "SELECT * FROM cms_m_page WHERE slug = ? AND status = 'published' LIMIT 1",
                [slug]
            );
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Page not found', ok: false });
            }
            res.json({ success: true, page: rows[0], ok: true });
        } catch (error) {
            console.error('getPublicPostBySlug error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // ─────────────────────────────────────────────
    // Admin: Enhanced List with filters/search/sort
    // ─────────────────────────────────────────────
    getAdminPosts: async (req, res) => {
        const { search, category_id, status, sort_by, sort_dir } = req.query;
        try {
            let query = `
                SELECT p.*, c.category_name, c.color_class, c.icon as category_icon,
                       u.uid as author_name
                FROM cms_m_page p
                LEFT JOIN cms_m_category c ON CAST(JSON_UNQUOTE(JSON_EXTRACT(p.meta_json, '$.category_id')) AS UNSIGNED) = c.category_id
                LEFT JOIN user u ON p.created_by = u.user_id
                WHERE 1=1
            `;
            const params = [];

            // Search filter
            if (search) {
                query += ' AND (p.title LIKE ? OR p.summary LIKE ? OR p.slug LIKE ?)';
                const s = `%${search}%`;
                params.push(s, s, s);
            }

            // Category filter
            if (category_id) {
                query += " AND CAST(JSON_UNQUOTE(JSON_EXTRACT(p.meta_json, '$.category_id')) AS UNSIGNED) = ?";
                params.push(parseInt(category_id));
            }

            // Status filter
            if (status && status !== 'all') {
                query += ' AND p.status = ?';
                params.push(status);
            }

            // Sorting
            const allowedSorts = {
                date: 'p.created_at',
                title: 'p.title',
                category: 'c.category_name',
                status: 'p.status',
                updated: 'p.updated_at',
                module_key: 'p.module_key'
            };
            const sortColumn = allowedSorts[sort_by] || 'p.is_pinned DESC, p.priority DESC, p.updated_at';
            const dir = sort_dir === 'asc' ? 'ASC' : 'DESC';
            query += ` ORDER BY ${sortColumn} ${dir}`;

            const rows = await dbQueryHots(query, params);
            res.json({ success: true, pages: rows, ok: true });
        } catch (error) {
            console.error('getAdminPosts error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // Admin: Get by ID
    getPostById: async (req, res) => {
        const { id } = req.params;
        try {
            const rows = await dbQueryHots(
                'SELECT * FROM cms_m_page WHERE page_id = ?', [id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Page not found', ok: false });
            }
            res.json({ success: true, data: rows[0], ok: true });
        } catch (error) {
            console.error('getPostById error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // ─────────────────────────────────────────────
    // Admin: Upsert (Create/Update) with thumbnail
    // ─────────────────────────────────────────────
    upsertPost: async (req, res) => {
        let { page_id, module_key, slug, title, summary, thumbnail, content_json, meta_json, status, is_pinned, priority } = req.body;
        const userId = req.user?.id || 0;

        // Prevent double-stringify
        if (content_json && typeof content_json !== 'string') content_json = JSON.stringify(content_json);
        if (meta_json && typeof meta_json !== 'string') meta_json = JSON.stringify(meta_json);

        try {
            if (page_id) {
                await dbQueryHots(
                    `UPDATE cms_m_page SET 
                        module_key = ?, slug = ?, title = ?, summary = ?, thumbnail = ?,
                        content_json = ?, meta_json = ?, status = ?, is_pinned = ?, priority = ?, updated_by = ?
                    WHERE page_id = ?`,
                    [module_key, slug, title, summary, thumbnail || null, content_json, meta_json, status, is_pinned || 0, priority || 0, userId, page_id]
                );
                res.json({ success: true, message: 'Post updated successfully', page_id, ok: true });
            } else {
                const result = await dbQueryHots(
                    `INSERT INTO cms_m_page 
                        (module_key, slug, title, summary, thumbnail, content_json, meta_json, status, is_pinned, priority, created_by, updated_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [module_key, slug, title, summary, thumbnail || null, content_json, meta_json, status, is_pinned || 0, priority || 0, userId, userId]
                );
                res.json({ success: true, message: 'Post created successfully', page_id: result.insertId, ok: true });
            }
        } catch (error) {
            console.error('upsertPost error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // ─────────────────────────────────────────────
    // Admin: Quick Update (inline field change)
    // ─────────────────────────────────────────────
    quickUpdate: async (req, res) => {
        const { id } = req.params;
        const { field, value } = req.body;

        const allowedFields = ['module_key', 'status'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ success: false, message: 'Field not allowed', ok: false });
        }

        try {
            await dbQueryHots(
                `UPDATE cms_m_page SET ${field} = ?, updated_by = ? WHERE page_id = ?`,
                [value, req.user?.id || 0, id]
            );
            res.json({ success: true, ok: true });
        } catch (error) {
            console.error('quickUpdate error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // Admin: Quick update category (stored in meta_json)
    quickUpdateCategory: async (req, res) => {
        const { id } = req.params;
        const { category_id } = req.body;

        try {
            // Read current meta_json
            const [row] = await dbQueryHots('SELECT meta_json FROM cms_m_page WHERE page_id = ?', [id]);
            if (!row) return res.status(404).json({ success: false, message: 'Not found', ok: false });

            let meta = row.meta_json;
            if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch { meta = {}; } }
            if (!meta || typeof meta !== 'object') meta = {};

            meta.category_id = category_id ? parseInt(category_id) : null;

            await dbQueryHots(
                'UPDATE cms_m_page SET meta_json = ?, updated_by = ? WHERE page_id = ?',
                [JSON.stringify(meta), req.user?.id || 0, id]
            );
            res.json({ success: true, ok: true });
        } catch (error) {
            console.error('quickUpdateCategory error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    // ─────────────────────────────────────────────
    // Admin: Delete Post
    // ─────────────────────────────────────────────
    deletePost: async (req, res) => {
        const { id } = req.params;
        try {
            const result = await dbQueryHots(
                'DELETE FROM cms_m_page WHERE page_id = ?', [id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Post not found', ok: false });
            }
            res.json({ success: true, message: 'Post deleted successfully', ok: true });
        } catch (error) {
            console.error('deletePost error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    }
};

module.exports = CMSController;
