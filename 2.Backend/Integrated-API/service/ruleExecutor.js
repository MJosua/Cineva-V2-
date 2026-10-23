/**
 * Rule Executor Service
 * Enforces policies defined in EVENT_m_pool.config
 */
const { dbHots } = require('../config/db');

class RuleExecutor {
    /**
     * Validate if an operation is allowed on a pool
     * @param {number} poolId 
     * @param {Object} context - { count, userId, submissionId }
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    static async validateDraw(poolId, context = {}) {
        const connection = await dbHots.promise().getConnection();
        try {
            // 1. Fetch Pool Config & Status
            const [rows] = await connection.query(
                `SELECT config, type, 
                 (SELECT COUNT(*) FROM EVENT_m_pool_item WHERE pool_id = ? AND is_used = 0) as available_count
                 FROM EVENT_m_pool 
                 WHERE pool_id = ?`,
                [poolId, poolId]
            );

            if (rows.length === 0) {
                return { valid: false, error: "POOL_NOT_FOUND" };
            }

            const pool = rows[0];
            const config = pool.config || {};
            const requestedCount = context.count || 1;

            // 2. Validate Time Window
            const now = new Date();
            if (config.valid_from && new Date(config.valid_from) > now) {
                return { valid: false, error: "POOL_NOT_STARTED" };
            }
            if (config.valid_until && new Date(config.valid_until) < now) {
                return { valid: false, error: "POOL_EXPIRED" };
            }

            // 3. Validate Inventory (Exhausted)
            if (pool.available_count < requestedCount) {
                return { valid: false, error: "POOL_EXHAUSTED" };
            }

            // 4. Validate Usage Limits (if submission/user context provided)
            if (context.userId && config.uses_per_user) {
                const [rows] = await connection.query(
                    `SELECT COUNT(*) as count FROM EVENT_t_winner 
                     WHERE pool_id = ? AND submission_id IN (
                         SELECT submission_id FROM EVENT_t_submission WHERE created_by = ? 
                     )`,
                    [poolId, context.userId]
                );
                if (rows[0].count >= config.uses_per_user) {
                    return { valid: false, error: "USAGE_LIMIT_EXCEEDED" };
                }
            }

            // 5. Validate Rules (if submission context provided)
            // Rules: [{ type: 'min_spend', value: 500 }, { type: 'receipt_required', value: true }]
            if (context.submission && config.rules && Array.isArray(config.rules)) {
                const { extra_data } = context.submission;
                const submissionData = typeof extra_data === 'string' ? JSON.parse(extra_data) : (extra_data || {});

                for (const rule of config.rules) {
                    switch (rule.type) {
                        case 'min_spend':
                            // key in extra_data can be 'amount' or 'spend'
                            const amount = submissionData.amount || submissionData.spend || 0;
                            if (amount < rule.value) {
                                return { valid: false, error: "RULE_MIN_SPEND_NOT_MET" };
                            }
                            break;
                        case 'receipt_required':
                            if (rule.value === true) {
                                // Check if receipt_codes is present in submission object
                                if (!context.submission.receipt_codes) {
                                    return { valid: false, error: "RULE_RECEIPT_REQUIRED" };
                                }
                            }
                            break;
                        // Add more rules here
                    }
                }
            }


            return { valid: true };

        } catch (error) {
            console.error("[RuleExecutor] Validation Error:", error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = RuleExecutor;
