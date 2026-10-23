/**
 * controller/hots_controller/engine/uploadController.js
 * Unified controller for handling temporary uploads across all HOTS modules.
 */

const { dbHots } = require('../../../config/db');

module.exports = {
    /**
     * uploadTemp
     * Handles single/multiple file uploads.
     * Stores in t_ticket_file_temp (default) or file_t_upload_temp based on req.query.type.
     * Use with hotsTempUploader middleware.
     */
    uploadTemp: async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                // Handle single file upload if it was sent as req.file
                if (req.file) {
                    req.files = [req.file];
                } else {
                    return res.status(400).json({ success: false, message: 'No files uploaded' });
                }
            }

            const path = require('path');
            const { getAbsoluteUrl } = require('../../../core/urlHelper');
            const user_id = req.user?.user_id || req.dataToken?.user_id || 0;
            const results = [];

            for (const file of req.files) {
                const fileName = file.filename;
                const originalName = file.originalname;

                // Get relative path from 'public' directory
                const publicDirPath = path.join(process.cwd(), 'public');
                let relativePath = path.relative(publicDirPath, file.path).replace(/\\/g, '/');

                // Construct absolute URL using helper
                const fileUrl = getAbsoluteUrl(req, relativePath);

                // Determine target table
                const isMedia = req.query.type === 'media' || req.body.type === 'media';
                const targetTable = isMedia ? 'file_t_upload_temp' : 't_ticket_file_temp';

                const [result] = await dbHots.promise().query(
                    `INSERT INTO ${targetTable} (file_path, original_filename, filename, uploaded_by, upload_date, is_used)
                     VALUES (?, ?, ?, ?, NOW(), 0)`,
                    [relativePath, originalName, fileName, user_id]
                );

                results.push({
                    upload_id: result.insertId,
                    url: fileUrl,
                    filename: fileName,
                    original_name: originalName,
                    name: originalName,
                    size: file.size,
                    mimetype: file.mimetype
                });
            }

            return res.json({
                success: true,
                ok: true,
                message: 'Files uploaded to temp storage',
                data: results,
                files: results,
                ...(results[0] || {})
            });
        } catch (err) {
            console.error('❌ [UPLOAD] Temp upload error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
};
