/**
 * Trigger Function Controller
 * 
 * ADMIN ONLY - CRUD operations for m_service_trigger_function
 * Provides API endpoints for the Visual API Builder frontend
 */

const express = require('express');
const SqlSafetyValidator = require('../../../../core/sql-safety-validator');

// Database connection
let dbHots;
try {
    dbHots = require('../../../../config/database').dbHots;
} catch (e) {
    dbHots = require('../../../../config/db').dbHots;
}

// Initialize safety validator
const sqlValidator = new SqlSafetyValidator();

/**
 * Middleware: Admin Only
 * Checks if user has admin role
 * Role 1 = Super Admin, Role 2 = Admin, Role 4 = HOTS Admin
 */
const adminOnly = (req, res, next) => {
    const roleId = req.dataToken?.role_id;
    const allowedRoles = [1, 2, 4]; // 1 = Super Admin, 2 = Admin, 4 = HOTS Admin

    if (!allowedRoles.includes(roleId) && !allowedRoles.includes(parseInt(roleId))) {
        console.warn(`⚠️ [TRIGGER-FUNC] Unauthorized access attempt by user ${req.dataToken?.user_id} (role: ${roleId})`);
        return res.status(403).json({
            success: false,
            message: 'Admin access required. You do not have permission to access this resource.'
        });
    }
    next();
};

const triggerFunctionController = {

    /**
     * GET /api/hots/trigger-functions
     * List all trigger functions
     */
    listFunctions: async (req, res) => {
        try {
            const { category, function_type, search, is_active } = req.query;

            let query = `
                SELECT 
                    function_id,
                    function_key,
                    function_name,
                    function_type,
                    category,
                    description,
                    is_active,
                    created_at,
                    updated_at
                FROM m_service_trigger_function
                WHERE 1=1
            `;
            const params = [];

            if (category) {
                query += ` AND category = ?`;
                params.push(category);
            }
            if (function_type) {
                query += ` AND function_type = ?`;
                params.push(function_type);
            }
            if (search) {
                query += ` AND (function_key LIKE ? OR function_name LIKE ? OR description LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (is_active !== undefined) {
                query += ` AND is_active = ?`;
                params.push(is_active === 'true' ? 1 : 0);
            }

            query += ` ORDER BY category, function_name`;

            const [functions] = await dbHots.promise().query(query, params);

            res.json({
                success: true,
                data: functions,
                count: functions.length
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error listing functions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to list trigger functions',
                error: error.message
            });
        }
    },

    /**
     * GET /api/hots/trigger-functions/:key
     * Get single function details
     */
    getFunction: async (req, res) => {
        try {
            const { key } = req.params;

            const [functions] = await dbHots.promise().query(
                `SELECT * FROM m_service_trigger_function WHERE function_key = ?`,
                [key]
            );

            if (functions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Function '${key}' not found`
                });
            }

            const func = functions[0];

            // Parse JSON fields
            try {
                func.sql_params = func.sql_params ? JSON.parse(func.sql_params) : [];
                func.handler_params = func.handler_params ? JSON.parse(func.handler_params) : {};
            } catch (e) {
                // Keep as-is if parse fails
            }

            res.json({
                success: true,
                data: func
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error getting function:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get trigger function',
                error: error.message
            });
        }
    },

    /**
     * POST /api/hots/trigger-functions/:key/validate
     * Validate SQL query without saving
     */
    validateQuery: async (req, res) => {
        try {
            const { sql_query } = req.body;

            if (!sql_query) {
                return res.status(400).json({
                    success: false,
                    message: 'sql_query is required'
                });
            }

            const validation = sqlValidator.validate(sql_query);

            res.json({
                success: true,
                valid: validation.valid,
                errors: validation.errors,
                warnings: []
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error validating query:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to validate query',
                error: error.message
            });
        }
    },

    /**
     * POST /api/hots/trigger-functions
     * Create new function (Admin only)
     */
    createFunction: [adminOnly, async (req, res) => {
        try {
            const userId = req.dataToken?.user_id;
            const {
                function_key,
                function_name,
                function_type,
                description,
                sql_query,
                sql_params,
                handler_path,
                handler_params,
                template_content,
                category = 'general'
            } = req.body;

            // Validate required fields
            if (!function_key || !function_name || !function_type) {
                return res.status(400).json({
                    success: false,
                    message: 'function_key, function_name, and function_type are required'
                });
            }

            // Validate function_key format (alphanumeric + underscore only)
            if (!/^[a-z][a-z0-9_]*$/.test(function_key)) {
                return res.status(400).json({
                    success: false,
                    message: 'function_key must start with a letter and contain only lowercase letters, numbers, and underscores'
                });
            }

            // For SQL type, validate the query
            if (function_type === 'sql' && sql_query) {
                const validation = sqlValidator.validate(sql_query);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: 'SQL validation failed',
                        errors: validation.errors
                    });
                }
            }

            // Check for duplicate key
            const [existing] = await dbHots.promise().query(
                'SELECT function_id FROM m_service_trigger_function WHERE function_key = ?',
                [function_key]
            );
            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Function key '${function_key}' already exists`
                });
            }

            // Insert new function
            const [result] = await dbHots.promise().query(`
                INSERT INTO m_service_trigger_function (
                    function_key, function_name, function_type, description,
                    sql_query, sql_params, handler_path, handler_params,
                    template_content, category, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            `, [
                function_key,
                function_name,
                function_type,
                description || null,
                sql_query || null,
                sql_params ? JSON.stringify(sql_params) : null,
                handler_path || null,
                handler_params ? JSON.stringify(handler_params) : null,
                template_content || null,
                category,
                userId
            ]);

            console.log(`✅ [TRIGGER-FUNC] Created function: ${function_key} by user ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Function created successfully',
                data: {
                    function_id: result.insertId,
                    function_key
                }
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error creating function:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create trigger function',
                error: error.message
            });
        }
    }],

    /**
     * PUT /api/hots/trigger-functions/:key
     * Update existing function (Admin only)
     */
    updateFunction: [adminOnly, async (req, res) => {
        try {
            const { key } = req.params;
            const userId = req.dataToken?.user_id;
            const {
                function_name,
                description,
                sql_query,
                sql_params,
                handler_path,
                handler_params,
                template_content,
                category,
                is_active
            } = req.body;

            // Check function exists
            const [existing] = await dbHots.promise().query(
                'SELECT function_id, function_type FROM m_service_trigger_function WHERE function_key = ?',
                [key]
            );
            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Function '${key}' not found`
                });
            }

            // For SQL type, validate the query
            if (existing[0].function_type === 'sql' && sql_query) {
                const validation = sqlValidator.validate(sql_query);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: 'SQL validation failed',
                        errors: validation.errors
                    });
                }
            }

            // Build update query dynamically
            const updates = [];
            const params = [];

            if (function_name !== undefined) { updates.push('function_name = ?'); params.push(function_name); }
            if (description !== undefined) { updates.push('description = ?'); params.push(description); }
            if (sql_query !== undefined) { updates.push('sql_query = ?'); params.push(sql_query); }
            if (sql_params !== undefined) { updates.push('sql_params = ?'); params.push(JSON.stringify(sql_params)); }
            if (handler_path !== undefined) { updates.push('handler_path = ?'); params.push(handler_path); }
            if (handler_params !== undefined) { updates.push('handler_params = ?'); params.push(JSON.stringify(handler_params)); }
            if (template_content !== undefined) { updates.push('template_content = ?'); params.push(template_content); }
            if (category !== undefined) { updates.push('category = ?'); params.push(category); }
            if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            params.push(key);
            await dbHots.promise().query(
                `UPDATE m_service_trigger_function SET ${updates.join(', ')} WHERE function_key = ?`,
                params
            );

            console.log(`✅ [TRIGGER-FUNC] Updated function: ${key} by user ${userId}`);

            res.json({
                success: true,
                message: 'Function updated successfully'
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error updating function:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update trigger function',
                error: error.message
            });
        }
    }],

    /**
     * POST /api/hots/trigger-functions/:key/execute
     * Execute a function with parameters
     */
    executeFunction: async (req, res) => {
        try {
            const { key } = req.params;
            const { params: execParams = {} } = req.body;
            const userId = req.dataToken?.user_id;

            // Get function
            const [functions] = await dbHots.promise().query(
                'SELECT * FROM m_service_trigger_function WHERE function_key = ? AND is_active = 1',
                [key]
            );

            if (functions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Function '${key}' not found or inactive`
                });
            }

            const func = functions[0];

            // Only allow SQL type execution via this endpoint
            if (func.function_type !== 'sql') {
                return res.status(400).json({
                    success: false,
                    message: 'Only SQL type functions can be executed via this endpoint'
                });
            }

            // Re-validate SQL at execution time (defense in depth)
            const validation = sqlValidator.validate(func.sql_query);
            if (!validation.valid) {
                console.error(`❌ [TRIGGER-FUNC] Blocked unsafe query execution: ${key}`);
                return res.status(400).json({
                    success: false,
                    message: 'SQL validation failed at execution',
                    errors: validation.errors
                });
            }

            // Parse and resolve parameters
            let paramDefs = [];
            try {
                if (typeof func.sql_params === 'string') {
                    paramDefs = JSON.parse(func.sql_params);
                } else if (Array.isArray(func.sql_params)) {
                    paramDefs = func.sql_params;
                } else if (typeof func.sql_params === 'object' && func.sql_params !== null) {
                    // In case it's a single object not in array, though we expect array
                    paramDefs = [func.sql_params];
                }
            } catch (e) {
                console.warn('⚠️ [TRIGGER-FUNC] Failed to parse sql_params:', e);
                paramDefs = [];
            }

            console.log('🔍 [TRIGGER-FUNC] Param defs:', paramDefs);

            const resolvedParams = paramDefs.map(p => {
                let paramName;
                if (typeof p === 'string' && p.startsWith(':')) {
                    paramName = p.substring(1);
                } else if (typeof p === 'object' && p.name) {
                    paramName = p.name;
                } else {
                    return p;
                }
                const val = execParams[paramName] ?? null;
                // Don't sanitize here if using parameterized query, just pass value
                // mysql2 handles escaping. sanitizeParam was for manual concatenation (which we shouldn't do)
                // BUT, if sanitizeParam does type checking/casting, keep it?
                // verifying sqlValidator.sanitizeParam... it adds quotes! 
                // We MUST NOT add quotes for parameterized query values!
                return val;
            });

            // Execute
            const [result] = await dbHots.promise().query(func.sql_query, resolvedParams);

            console.log(`✅ [TRIGGER-FUNC] Executed: ${key} by user ${userId}, rows: ${Array.isArray(result) ? result.length : 1}`);

            // Log execution to m_service_trigger_log
            try {
                await dbHots.promise().query(`
                    INSERT INTO m_service_trigger_log 
                    (service_id, function_key, trigger_name, action_type, status, result_summary, created_by, created_at)
                    VALUES (?, ?, ?, 'execute_api_builder', 'success', ?, ?, NOW())
                `, [
                    req.body.service_id || execParams.service_id || null,
                    key,
                    func.function_name,
                    JSON.stringify(result).substring(0, 1000),
                    userId
                ]);
            } catch (logError) {
                console.error('⚠️ [TRIGGER-FUNC] Failed to log execution:', logError.message);
            }

            res.json({
                success: true,
                data: result,
                rowCount: Array.isArray(result) ? result.length : result.affectedRows || 0
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error executing function:', error);

            // Log error to m_service_trigger_log
            try {
                const { key } = req.params;
                const userId = req.dataToken?.user_id;
                await dbHots.promise().query(`
                    INSERT INTO m_service_trigger_log 
                    (service_id, function_key, action_type, status, error_message, created_by, created_at)
                    VALUES (?, ?, 'execute_api_builder', 'error', ?, ?, NOW())
                `, [
                    req.body.service_id || (req.body.params && req.body.params.service_id) || null,
                    key,
                    error.message.substring(0, 500),
                    userId
                ]);
            } catch (logErr) {
                // Ignore log errors
            }

            res.status(500).json({
                success: false,
                message: 'Failed to execute trigger function',
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/hots/trigger-functions/:key
     * Soft delete (set is_active = 0) - Admin only
     */
    deleteFunction: [adminOnly, async (req, res) => {
        try {
            const { key } = req.params;
            const userId = req.dataToken?.user_id;

            const [result] = await dbHots.promise().query(
                'UPDATE m_service_trigger_function SET is_active = 0 WHERE function_key = ?',
                [key]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Function '${key}' not found`
                });
            }

            console.log(`✅ [TRIGGER-FUNC] Deactivated function: ${key} by user ${userId}`);

            res.json({
                success: true,
                message: 'Function deactivated successfully'
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error deleting function:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete trigger function',
                error: error.message
            });
        }
    }],

    /**
     * GET /api/hots/trigger-functions/categories
     * Get unique categories
     */
    getCategories: async (req, res) => {
        try {
            const [categories] = await dbHots.promise().query(`
                SELECT DISTINCT category, COUNT(*) as count 
                FROM m_service_trigger_function 
                WHERE is_active = 1
                GROUP BY category
                ORDER BY category
            `);

            res.json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error('❌ [TRIGGER-FUNC] Error getting categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get categories',
                error: error.message
            });
        }
    }
};

module.exports = triggerFunctionController;
module.exports.adminOnly = adminOnly;
