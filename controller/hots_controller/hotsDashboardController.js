// controller/hots_controller/hotsDashboardController.js
const {
    dbHots,
    dbQueryHots,
    addSqlLogger
} = require("../../config/db");
/**
 * Get dashboard functions filtered by user role & department
 */

module.exports = {


    getDashboardFunctions: async (req, res) => {
        try {
            const user = req.user || {}; // assumed populated by auth middleware
            const role = user.role_name || "guest";
            const dept = user.department_name || null;
            req.dataToken.user_id
            const sql = `
      SELECT 
        f.id,
        f.title,
        f.description,
        f.icon,
        f.path,
        f.type,
        f.roles_allowed,
        f.department_scope,
        f.category_id,
        c.name AS category_name,
        f.is_active,
        f.order_index
      FROM m_dashboard_function f
      LEFT JOIN m_dashboard_category c ON f.category_id = c.id
      WHERE f.is_active = 1
      ORDER BY c.order_index, f.order_index
    `;

            const [rows] = await dbHots.promise().query(sql);

            // Filter by role and department dynamically
            const filtered = rows.filter((r) => {
                const roles = Array.isArray(r.roles_allowed)
                    ? r.roles_allowed
                    : r.roles_allowed
                        ? JSON.parse(r.roles_allowed)
                        : [];
                const depts = Array.isArray(r.department_scope)
                    ? r.department_scope
                    : r.department_scope
                        ? JSON.parse(r.department_scope)
                        : [];

                // 🧠 Core improvements here
                const roleAllowed =
                    roles.length === 0 ||                // no restriction
                    roles.includes(role) ||              // explicitly allowed
                    roles.includes("all") ||             // global access
                    role === "admin" ||                  // admins see everything
                    (role === "guest" && roles.includes("guest")); // guests see guest-marked

                const deptAllowed =
                    depts.length === 0 ||                // no restriction
                    !dept ||                             // user has no dept
                    depts.includes(dept) ||              // matches user's dept
                    depts.includes("all");               // global dept

                // 🪄 Optional: default fallback for guest visibility
                const defaultGuestVisible =
                    role === "guest" && roles.length === 0 && depts.length === 0;

                const isVisible = (roleAllowed && deptAllowed) || defaultGuestVisible;


                return isVisible;
            });
            res.json(filtered);
        } catch (err) {
            console.error("Error fetching dashboard functions:", err);
            res.status(500).json({ message: "Error loading dashboard functions", error: err.message });
        }
    }

}