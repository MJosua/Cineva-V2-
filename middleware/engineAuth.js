const jwt = require('jsonwebtoken');
const { dbQueryHots } = require('../config/db');

/**
 * Event Engine Authentication Middleware
 * Enforces stricter security policies than standard app auth.
 */
const engineAuth = {

    /**
     * Middleware to Normalize User Identity
     * Accepts tokens from:
     * 1. HOTS (Super Admin / Event Admin)
     * 2. IOD (Distributor - Read Only)
     */
    normalizeUser: async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            // No token provided. req.user remains undefined.
            // DO NOT error here. Let requireUser handle the error.
            // This allows this middleware to be used on optional-auth routes if needed.
            return next();
        }

        const token = authHeader.split(' ')[1];
        if (!token) return next();

        let decoded = null;
        let source = null;

        // STRATEGY 1: Try IOD Token (Default Key)
        try {
            decoded = jwt.verify(token, process.env.SECURITY_TOKEN_KEY);
            source = 'IOD';
        } catch (e) {
            // STRATEGY 2: Try HOTS Token (HT Key)
            try {
                decoded = jwt.verify(token, process.env.SECURITY_TOKEN_KEY_HT);
                source = 'HOTS';
            } catch (e2) {
                // Invalid token for both sources
                // Ensure we don't set req.user
                return next();
            }
        }

        if (!decoded) return next();

        // NORMALIZE IDENTITY
        const user = {
            id: decoded.id || decoded.user_id, // COMPATIBILITY: For Controller/Service usage
            engine_user_id: `${source}_${decoded.id || decoded.user_id}`,
            source: source,
            source_user_id: decoded.id || decoded.user_id,
            role: 'distributor', // Default to lowest privilege (lowercase)
            permitted_events: [], // Default to none
            original_payload: decoded
        };

        // ROLE MAPPING
        if (source === 'HOTS') {
            // Check type_id/role_id for Super Admin
            if (decoded.type_id === 9 || decoded.role_id === 4) {
                user.role = 'superadmin';
            } else {
                user.role = 'event_admin';

                // Fetch permitted events from Team Table
                try {
                    const sql = `
                        SELECT c.slug 
                        FROM EVENT_r_campaign_admin r
                        JOIN EVENT_t_campaign c ON r.campaign_id = c.campaign_id
                        WHERE r.user_id = ?
                    `;
                    const rows = await dbQueryHots(sql, [user.id]);
                    user.permitted_events = rows.map(r => r.slug);
                } catch (err) {
                    console.error("[Auth] Failed to fetch permissions:", err);
                    user.permitted_events = [];
                }
            }
        } else if (source === 'IOD') {
            user.role = 'distributor';
        }

        req.user = user;
        next();
    },

    /**
     * Strict Gate: Require Authenticated User
     */
    requireUser: (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
        }
        next();
    },

    /**
     * Role Gate: Require Super Admin
     */
    requireSuperAdmin: (req, res, next) => {
        if (!req.user || req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Super Admin privileges required'
                }
            });
        }
        next();
    },

    /**
     * Role Gate: Require Write Access (Super Admin or Event Admin)
     * Distributors are Read-Only.
     */
    requireWriteAccess: (req, res, next) => {
        if (!req.user) return res.status(401).send();

        if (req.user.role === 'distributor') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'READ_ONLY',
                    message: 'Distributors have read-only access'
                }
            });
        }
        next();
    }
};

module.exports = engineAuth;
