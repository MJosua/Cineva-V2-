const { dbQueryLinkShortener } = require("../../config/db");

const generateShortCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const createShortUrl = async (req, res) => {
    let { target_url, title, qr_config, require_login, custom_code } = req.body;
    const user_id = req.dataToken.user_id;

    // Support nested structure from modular form widget
    if (qr_config && qr_config.targetUrl) {
        target_url = qr_config.targetUrl;
        title = qr_config.title || title;
        require_login = qr_config.requireLogin !== undefined ? qr_config.requireLogin : require_login;
        custom_code = qr_config.customCode || custom_code;
    }

    if (!target_url) {
        return res.status(400).json({ success: false, message: "Target URL is required" });
    }

    try {
        let short_code = custom_code || generateShortCode();
        
        // Check uniqueness
        const existing = await dbQueryLinkShortener("SELECT id FROM m_url_shortener WHERE short_code = ?", [short_code]);
        if (existing.length > 0 && !custom_code) {
            short_code = generateShortCode(7); // Try again with longer code if random collides
        } else if (existing.length > 0 && custom_code) {
            return res.status(400).json({ success: false, message: "Custom code already in use" });
        }

        const qrConfigStr = qr_config ? JSON.stringify(qr_config) : null;

        await dbQueryLinkShortener(
            `INSERT INTO m_url_shortener (user_id, short_code, target_url, title, qr_config, require_login) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, short_code, target_url, title, qrConfigStr, require_login ? 1 : 0]
        );

        res.json({
            success: true,
            message: "Short URL created successfully",
            data: {
                short_code,
                short_url: `${req.protocol}://${req.get('host')}/hots/redirect/${short_code}`
            }
        });
    } catch (error) {
        console.error("Error creating short URL:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
};

const resolveShortUrl = async (req, res) => {
    const { code } = req.params;

    try {
        const results = await dbQueryLinkShortener(
            "SELECT target_url, require_login, active FROM m_url_shortener WHERE short_code = ?",
            [code]
        );

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }

        const link = results[0];
        if (!link.active) {
            return res.status(410).json({ success: false, message: "Link is disabled" });
        }

        // Increment click count
        await dbQueryLinkShortener("UPDATE m_url_shortener SET click_count = click_count + 1 WHERE short_code = ?", [code]);

        res.json({
            success: true,
            data: {
                target_url: link.target_url,
                require_login: !!link.require_login
            }
        });
    } catch (error) {
        console.error("Error resolving short URL:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
};

const getUserUrls = async (req, res) => {
    const user_id = req.dataToken.user_id;

    try {
        const urls = await dbQueryLinkShortener(
            "SELECT * FROM m_url_shortener WHERE user_id = ? ORDER BY created_at DESC",
            [user_id]
        );

        res.json({ success: true, data: urls });
    } catch (error) {
        console.error("Error getting user URLs:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
};

const deleteShortUrl = async (req, res) => {
    const { id } = req.params;
    const user_id = req.dataToken.user_id;

    try {
        await dbQueryLinkShortener("DELETE FROM m_url_shortener WHERE id = ? AND user_id = ?", [id, user_id]);
        res.json({ success: true, message: "URL deleted successfully" });
    } catch (error) {
        console.error("Error deleting URL:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
};

module.exports = {
    createShortUrl,
    resolveShortUrl,
    getUserUrls,
    deleteShortUrl
};
