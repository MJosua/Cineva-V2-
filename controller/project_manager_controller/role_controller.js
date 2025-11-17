const { dbHots } = require('../../config/db');

const role_controller = {
    // Get all roles
    getAllRoles: async (req, res) => {
        try {
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT r.*, 
                    (SELECT COUNT(*) FROM t_user WHERE role_id = r.id AND deleted_at IS NULL) as user_count
                FROM t_role r 
                WHERE r.deleted_at IS NULL
                ORDER BY r.name ASC
            `);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching roles:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch roles',
                error: error.message
            });
        }
    },

    // Create role
    createRole: async (req, res) => {
        try {
            const { name, description, permissions } = req.body;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                INSERT INTO t_role (name, description, permissions, created_by)
                VALUES (?, ?, ?, ?)
            `, [name, description, JSON.stringify(permissions || []), req.userId]);
            
            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error creating role:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create role',
                error: error.message
            });
        }
    },

    // Get role by ID
    getRoleById: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT * FROM t_role 
                WHERE id = ? AND deleted_at IS NULL
            `, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            // Parse permissions JSON
            const role = rows[0];
            if (role.permissions) {
                try {
                    role.permissions = JSON.parse(role.permissions);
                } catch (e) {
                    role.permissions = [];
                }
            }
            
            res.status(200).json({
                success: true,
                data: role
            });
        } catch (error) {
            console.error('Error fetching role:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch role',
                error: error.message
            });
        }
    },

    // Update role
    updateRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, permissions } = req.body;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_role 
                SET name = ?, description = ?, permissions = ?, updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [name, description, JSON.stringify(permissions || []), id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Role updated successfully'
            });
        } catch (error) {
            console.error('Error updating role:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update role',
                error: error.message
            });
        }
    },

    // Delete role (soft delete)
    deleteRole: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            
            // Check if role is being used by any users
            const [userCheck] = await connection.execute(`
                SELECT COUNT(*) as user_count FROM t_user 
                WHERE role_id = ? AND deleted_at IS NULL
            `, [id]);
            
            if (userCheck[0].user_count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete role that is assigned to users'
                });
            }
            
            const [result] = await connection.execute(`
                UPDATE t_role 
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting role:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete role',
                error: error.message
            });
        }
    },

    // Get role permissions (return the permissions array)
    getRolePermissions: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT permissions FROM t_role 
                WHERE id = ? AND deleted_at IS NULL
            `, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            let permissions = [];
            if (rows[0].permissions) {
                try {
                    permissions = JSON.parse(rows[0].permissions);
                } catch (e) {
                    permissions = [];
                }
            }
            
            res.status(200).json({
                success: true,
                data: permissions
            });
        } catch (error) {
            console.error('Error fetching role permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch role permissions',
                error: error.message
            });
        }
    },

    // Add role permission
    addRolePermission: async (req, res) => {
        try {
            const { id } = req.params;
            const { permission } = req.body;
            const connection = await dbHots();
            
            // Get current permissions
            const [rows] = await connection.execute(`
                SELECT permissions FROM t_role 
                WHERE id = ? AND deleted_at IS NULL
            `, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            let permissions = [];
            if (rows[0].permissions) {
                try {
                    permissions = JSON.parse(rows[0].permissions);
                } catch (e) {
                    permissions = [];
                }
            }
            
            // Add new permission if not exists
            if (!permissions.includes(permission)) {
                permissions.push(permission);
                
                await connection.execute(`
                    UPDATE t_role 
                    SET permissions = ?, updated_at = NOW()
                    WHERE id = ?
                `, [JSON.stringify(permissions), id]);
            }
            
            res.status(200).json({
                success: true,
                message: 'Permission added successfully',
                data: permissions
            });
        } catch (error) {
            console.error('Error adding role permission:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add role permission',
                error: error.message
            });
        }
    },

    // Remove role permission
    removeRolePermission: async (req, res) => {
        try {
            const { id, permissionId } = req.params;
            const connection = await dbHots();
            
            // Get current permissions
            const [rows] = await connection.execute(`
                SELECT permissions FROM t_role 
                WHERE id = ? AND deleted_at IS NULL
            `, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            let permissions = [];
            if (rows[0].permissions) {
                try {
                    permissions = JSON.parse(rows[0].permissions);
                } catch (e) {
                    permissions = [];
                }
            }
            
            // Remove permission
            permissions = permissions.filter(p => p !== permissionId);
            
            await connection.execute(`
                UPDATE t_role 
                SET permissions = ?, updated_at = NOW()
                WHERE id = ?
            `, [JSON.stringify(permissions), id]);
            
            res.status(200).json({
                success: true,
                message: 'Permission removed successfully',
                data: permissions
            });
        } catch (error) {
            console.error('Error removing role permission:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove role permission',
                error: error.message
            });
        }
    },

    // Get role users
    getRoleUsers: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT u.id, u.name, u.email, u.phone, u.position, d.name as department_name
                FROM t_user u
                LEFT JOIN t_department d ON u.department_id = d.id
                WHERE u.role_id = ? AND u.deleted_at IS NULL
                ORDER BY u.name ASC
            `, [id]);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching role users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch role users',
                error: error.message
            });
        }
    }
};

module.exports = role_controller;