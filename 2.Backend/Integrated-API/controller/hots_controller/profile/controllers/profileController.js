const { dbHots } = require('../../../../config/db');
const path = require('path');
const fs = require('fs');

const yellowTerminal = '\x1b[33m';

/**
 * Profile Controller
 * Handles user profile management including EAV attributes and signature uploads
 */
module.exports = {
    /**
     * GET /hots_profile/me
     * Get current user's profile with EAV attributes
     */
    getProfile: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const user_id = req.dataToken.user_id;

        try {
            // Get base user data
            const [userData] = await dbHots.promise().query(`
                SELECT 
                    u.user_id,
                    u.uid,
                    u.firstname,
                    u.lastname,
                    u.email,
                    u.department_id,
                    d.department_name
                FROM user u
                LEFT JOIN m_company_department d ON u.department_id = d.department_id
                WHERE u.user_id = ?
            `, [user_id]);

            if (userData.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get EAV attributes
            const [attributes] = await dbHots.promise().query(`
                SELECT attribute_name, attribute_value
                FROM user_profile
                WHERE user_id = ? AND is_active = 1
            `, [user_id]);

            // Convert attributes array to object
            const attributesObj = {};
            attributes.forEach(attr => {
                attributesObj[attr.attribute_name] = attr.attribute_value;
            });

            console.log(`${timestamp}Get profile success for user ${user_id}`);

            res.status(200).json({
                success: true,
                data: {
                    ...userData[0],
                    attributes: attributesObj
                }
            });
        } catch (err) {
            console.error(`${timestamp}Error getting profile:`, err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * POST /hots_profile/update
     * Update user profile attributes
     */
    updateProfile: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const user_id = req.dataToken.user_id;
        const { attributes } = req.body;

        if (!attributes || typeof attributes !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid attributes format'
            });
        }

        try {
            // Upsert each attribute
            for (const [name, value] of Object.entries(attributes)) {
                await dbHots.promise().query(`
                    INSERT INTO user_profile (user_id, attribute_name, attribute_value, created_by)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        attribute_value = VALUES(attribute_value),
                        updated_by = VALUES(created_by),
                        updated_at = NOW()
                `, [user_id, name, value, user_id]);
            }

            console.log(`${timestamp}Update profile success for user ${user_id}`);

            res.status(200).json({
                success: true,
                message: 'Profile updated'
            });
        } catch (err) {
            console.error(`${timestamp}Error updating profile:`, err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * POST /hots_profile/upload_signature
     * Upload digital signature image
     */
    uploadSignature: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const user_id = req.dataToken.user_id;
        const firstname = req.dataToken.firstname || '';
        const lastname = req.dataToken.lastname || '';

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                // Delete uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only PNG and JPEG are allowed.'
                });
            }

            // Create user-specific folder: public/hots/profile/{user_id}-{firstname}{lastname}/
            const sanitizedName = `${firstname}${lastname}`.replace(/[^a-zA-Z0-9]/g, '');
            const userFolder = `${user_id}-${sanitizedName}`;
            const profileDir = path.join(__dirname, '../../../../public/hots/profile', userFolder);

            if (!fs.existsSync(profileDir)) {
                fs.mkdirSync(profileDir, { recursive: true });
            }

            const ext = path.extname(req.file.originalname);
            const newFileName = `signature${ext}`;
            const newPath = path.join(profileDir, newFileName);

            // If old signature exists, delete it
            const files = fs.readdirSync(profileDir);
            files.forEach(file => {
                if (file.startsWith('signature')) {
                    fs.unlinkSync(path.join(profileDir, file));
                }
            });

            // Move uploaded file from temp to user folder
            fs.renameSync(req.file.path, newPath);

            // Save path to user_profile (relative to public/)
            const signaturePath = `/hots/profile/${userFolder}/${newFileName}`;
            await dbHots.promise().query(`
                INSERT INTO user_profile (user_id, attribute_name, attribute_value, created_by)
                VALUES (?, 'default_signature', ?, ?)
                ON DUPLICATE KEY UPDATE 
                    attribute_value = VALUES(attribute_value),
                    updated_by = VALUES(created_by),
                    updated_at = NOW()
            `, [user_id, signaturePath, user_id]);

            console.log(`${timestamp}Signature uploaded for user ${user_id}: ${signaturePath}`);

            res.status(200).json({
                success: true,
                signature_path: signaturePath
            });
        } catch (err) {
            console.error(`${timestamp}Error uploading signature:`, err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * Helper: Get user signature path (for document generation)
     * Returns the signature path from user_profile, or null if not found
     */
    getUserSignaturePath: async (user_id) => {
        try {
            const [result] = await dbHots.promise().query(`
                SELECT attribute_value
                FROM user_profile
                WHERE user_id = ? AND attribute_name = 'default_signature' AND is_active = 1
                LIMIT 1
            `, [user_id]);

            return result.length > 0 ? result[0].attribute_value : null;
        } catch (err) {
            console.error('Error fetching signature path:', err);
            return null;
        }
    }
};
