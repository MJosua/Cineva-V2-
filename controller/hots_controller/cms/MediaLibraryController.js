const { dbQueryHots, dbHots } = require('../../../config/db');

const MediaLibraryController = {
    /**
     * getMediaList
     * Fetch media entries with filtering and pagination.
     */
    getMediaList: async (req, res) => {
        const { page = 1, limit = 20, folder, tag, search } = req.query;
        const offset = (page - 1) * limit;

        try {
            let query = `
                SELECT m.*, u.uid as creator_name
                FROM cms_media m
                LEFT JOIN user u ON m.created_by = u.user_id
                WHERE m.is_active = 1
            `;
            const params = [];

            if (folder) {
                query += ' AND m.folder = ?';
                params.push(folder);
            }

            if (tag) {
                query += ' AND JSON_CONTAINS(m.tags, ?)';
                params.push(JSON.stringify(tag));
            }

            if (search) {
                query += ' AND (m.file_name LIKE ? OR m.folder LIKE ?)';
                const s = `%${search}%`;
                params.push(s, s);
            }

            // Get total count for pagination
            const countQuery = `SELECT COUNT(*) as total FROM (${query}) as combined`;
            const [countRes] = await dbQueryHots(countQuery, params);
            const total = countRes.total;

            // Get data
            query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const rows = await dbQueryHots(query, params);

            res.json({
                success: true,
                data: rows,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(total / limit)
                },
                ok: true
            });
        } catch (error) {
            console.error('getMediaList error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    },

    /**
     * finalizeMedia
     * Moves a file from file_t_upload_temp to file_t_upload and registers in cms_media.
     */
    finalizeMedia: async (req, res) => {
        const { upload_id, folder = 'general', tags = [], file_name } = req.body;
        const userId = req.user?.id || req.user?.user_id || 0;

        if (!upload_id) {
            return res.status(400).json({ success: false, message: 'upload_id is required', ok: false });
        }

        const connection = await dbHots.promise().getConnection();
        await connection.beginTransaction();

        try {
            // 1. Get temp file data
            const [tempRows] = await connection.query(
                'SELECT * FROM file_t_upload_temp WHERE upload_id = ? LIMIT 1',
                [upload_id]
            );

            if (tempRows.length === 0) {
                throw new Error('Temporary file not found or already processed');
            }

            const tempFile = tempRows[0];

            // 2. Insert into file_t_upload (Final storage)
            const [finalFileRes] = await connection.query(
                `INSERT INTO file_t_upload 
                (entity_type, filename, original_name, file_path, uploaded_by, upload_date, is_active)
                VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
                ['cms', tempFile.filename, tempFile.original_filename, tempFile.file_path, userId]
            );

            const newFileId = finalFileRes.insertId;

            // 3. Construct URL
            const { getAbsoluteUrl } = require('../../../core/urlHelper');
            const fileUrl = getAbsoluteUrl(req, tempFile.file_path);

            // 4. Register in cms_media
            const [mediaRes] = await connection.query(
                `INSERT INTO cms_media 
                (file_id, file_name, file_url, folder, tags, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [newFileId, file_name || tempFile.original_filename, fileUrl, folder, JSON.stringify(tags), userId]
            );

            // 5. Mark temp as used
            await connection.query(
                'UPDATE file_t_upload_temp SET is_used = 1 WHERE upload_id = ?',
                [upload_id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Media finalized successfully',
                data: {
                    media_id: mediaRes.insertId,
                    file_url: fileUrl,
                    file_name: file_name || tempFile.original_filename
                },
                ok: true
            });
        } catch (error) {
            await connection.rollback();
            console.error('finalizeMedia error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        } finally {
            connection.release();
        }
    },

    /**
     * deleteMedia
     * Soft delete from cms_media. Physical file remains in file_t_upload.
     */
    deleteMedia: async (req, res) => {
        const { id } = req.params;
        try {
            const result = await dbQueryHots(
                'UPDATE cms_media SET is_active = 0 WHERE media_id = ?',
                [id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Media not found', ok: false });
            }
            res.json({ success: true, message: 'Media deleted successfully', ok: true });
        } catch (error) {
            console.error('deleteMedia error:', error);
            res.status(500).json({ success: false, message: error.message, ok: false });
        }
    }
};

module.exports = MediaLibraryController;
