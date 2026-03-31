// controller/hots_controller/systemMenuController.js
const { dbHots } = require("../../config/db");

const safeParseJSON = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (!value || value === "null" || value === "") return fallback;
    try {
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (err) {
        console.warn("⚠️ Invalid JSON found in system menu:", value);
        return fallback;
    }
};

module.exports = {
    /**
     * Get system menu items filtered by user role & department
     */
    getSystemMenu: async (req, res) => {
        try {
            const role_id = req.dataToken.role_id;
            const dept_id = req.dataToken.department_id;
            const user_id = req.dataToken.user_id;

            const [rows] = await dbHots.promise().query(`
                SELECT * FROM m_system_menu 
                WHERE is_active = 1 
                ORDER BY group_order ASC, menu_group ASC, menu_order_priority ASC
            `);

            const filtered = rows.filter((item) => {
                const allowedRoles = safeParseJSON(item.roles_allowed);
                const allowedDepts = safeParseJSON(item.department_scope);
                const allowedUsers = safeParseJSON(item.users_allowed);

                // Check specific user allowed first (override)
                const isUserExplicitlyAllowed = 
                    allowedUsers.includes(user_id) || 
                    allowedUsers.includes(user_id.toString());

                if (isUserExplicitlyAllowed) return true;

                // Role condition
                const roleAllowed = 
                    allowedRoles.includes("all") || 
                    allowedRoles.includes(0) || 
                    allowedRoles.includes(role_id) ||
                    allowedRoles.includes(role_id.toString());

                // Dept condition (only if role is allowed)
                const deptAllowed = 
                    roleAllowed && (
                        allowedDepts.includes("all") || 
                        allowedDepts.length === 0 || 
                        allowedDepts.includes(dept_id) ||
                        allowedDepts.includes(dept_id.toString())
                    );

                return roleAllowed && deptAllowed;
            });

            // Group by menu_group
            const grouped = filtered.reduce((acc, item) => {
                const group = item.menu_group || 'Other';
                if (!acc[group]) acc[group] = [];
                acc[group].push(item);
                return acc;
            }, {});

            res.json({ success: true, data: grouped });
        } catch (err) {
            console.error("Error fetching system menu:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getSystemMenuAdmin: async (req, res) => {
        try {
            const [rows] = await dbHots.promise().query(`
                SELECT * FROM m_system_menu 
                ORDER BY group_order ASC, menu_group ASC, menu_order_priority ASC
            `);

            // Still group it for convenience
            const grouped = rows.reduce((acc, item) => {
                const group = item.menu_group || 'Other';
                if (!acc[group]) acc[group] = [];
                acc[group].push(item);
                return acc;
            }, {});

            res.json({ success: true, data: grouped });
        } catch (err) {
            console.error("Get Admin Menu Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * CRUD: Update system menu item
     */
    updateSystemMenu: async (req, res) => {
        try {
            const { menu_id, menu_name, menu_group, group_order, menu_icon, menu_path, roles_allowed, department_scope, users_allowed, is_active, menu_order_priority } = req.body;
            
            // Note: In real production, use transaction + rollback if complex
            await dbHots.promise().query(`
                UPDATE m_system_menu SET 
                    menu_name = ?, 
                    menu_group = ?, 
                    group_order = ?,
                    menu_icon = ?, 
                    menu_path = ?, 
                    roles_allowed = ?, 
                    department_scope = ?, 
                    users_allowed = ?,
                    is_active = ?,
                    menu_order_priority = ?
                WHERE menu_id = ?
            `, [
                menu_name, 
                menu_group, 
                group_order || 0,
                menu_icon, 
                menu_path, 
                JSON.stringify(roles_allowed || []), 
                JSON.stringify(department_scope || []), 
                JSON.stringify(users_allowed || []),
                is_active !== undefined ? is_active : 1,
                menu_order_priority || 0,
                menu_id
            ]);

            res.json({ success: true, message: "Menu updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * CRUD: Add new menu item
     */
    addSystemMenu: async (req, res) => {
        try {
            const { menu_name, menu_group, group_order, menu_icon, menu_path, roles_allowed, department_scope, users_allowed, menu_order_priority } = req.body;
            
            await dbHots.promise().query(`
                INSERT INTO m_system_menu 
                (menu_name, menu_group, group_order, menu_icon, menu_path, roles_allowed, department_scope, users_allowed, menu_order_priority, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [
                menu_name, 
                menu_group, 
                group_order || 0,
                menu_icon, 
                menu_path, 
                JSON.stringify(roles_allowed || []), 
                JSON.stringify(department_scope || []), 
                JSON.stringify(users_allowed || []),
                menu_order_priority || 0
            ]);

            res.json({ success: true, message: "Menu added successfully" });
        } catch (err) {
            console.error("Add Menu Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    bulkUpdateOrder: async (req, res) => {
        const connection = await dbHots.promise().getConnection();
        try {
            const { items } = req.body; // Array of { menu_id, group_order, menu_order_priority, menu_group }
            
            await connection.beginTransaction();

            for (const item of items) {
                await connection.query(`
                    UPDATE m_system_menu 
                    SET group_order = ?, menu_order_priority = ?, menu_group = ?
                    WHERE menu_id = ?
                `, [item.group_order, item.menu_order_priority, item.menu_group, item.menu_id]);
            }

            await connection.commit();
            res.json({ success: true, message: "Order updated successfully" });
        } catch (err) {
            await connection.rollback();
            console.error("Bulk Update Error:", err);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    },
};
