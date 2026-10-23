const { dbHots } = require("../../../../config/db");

let yellowTerminal = "\x1b[33m";

/**
 * UserManagementController
 * Handles Users, Roles, Job Titles, Teams, and Departments
 */
module.exports = {
    // === USER MANAGEMENT ===
    getAllUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        try {
            const [result] = await dbHots.promise().query(`
                SELECT *, CASE WHEN u.finished_date IS NOT NULL THEN 1 ELSE 0 END as is_deleted
                FROM hots.user u
                LEFT JOIN hots.m_company_team mt ON u.department_id = mt.department_id 
                LEFT JOIN hots.user_role mr ON u.role_id = mr.role_id
                LEFT JOIN hots.m_company_job_title mjt ON u.jobtitle_id = mjt.jobtitle_id
            `);
            console.log(`Trying to get all users success from ${user_id} at ${timestamp}`);
            res.status(200).json({ data: result, success: true, message: "Service getuser success" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id } = req.body;

        const connection = await dbHots.promise().getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(`
                INSERT INTO hots.user (firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id, registration_date, pswd, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), "Indofood01", 1)
            `, [firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id]);

            await connection.commit();
            console.log(`User created successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "User created successfully", data: { user_id: result.insertId } });
        } catch (err) {
            await connection.rollback();
            console.error(`❌ User creation failed by ${user_id} at ${timestamp}:`, err.message);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    },

    updateUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id } = req.body;

        const connection = await dbHots.promise().getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(`
                UPDATE hots.user 
                SET firstname = ?, lastname = ?, uid = ?, email = ?, role_id = ?, 
                    department_id = ?, jobtitle_id = ?, superior_id = ?
                WHERE user_id = ? AND finished_date IS NULL
            `, [firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id, id]);

            if (result.affectedRows === 0) {
                throw new Error("User not found or already deleted");
            }

            await connection.commit();
            console.log(`User updated successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "User updated successfully" });
        } catch (err) {
            await connection.rollback();
            console.error(`❌ User update failed for ID ${id} by ${user_id} at ${timestamp}:`, err.message);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    },

    deleteUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;

        const connection = await dbHots.promise().getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(`
                UPDATE hots.user SET finished_date = NOW() WHERE user_id = ? AND finished_date IS NULL
            `, [id]);

            if (result.affectedRows === 0) {
                throw new Error("User not found or already deleted");
            }

            await connection.commit();
            console.log(`User deleted successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "User deleted successfully" });
        } catch (err) {
            await connection.rollback();
            console.error(`❌ User deletion failed for ID ${id} by ${user_id} at ${timestamp}:`, err.message);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    },

    // === ROLE MANAGEMENT ===
    getAllRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        try {
            const [result] = await dbHots.promise().query(`
                SELECT role_id, role_name, role_description, creation_date, finished_date
                FROM hots.user_role ORDER BY role_name ASC
            `);
            console.log(`Trying to get all roles success from ${user_id} at ${timestamp}`);
            res.status(200).json({ data: result, success: true, message: "Service get roles success" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { role_name, role_description } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.user_role (role_name, role_description, creation_date) VALUES (?, ?, NOW())
            `, [role_name, role_description]);
            console.log(`Role created successfully by ${user_id} at ${timestamp}`);
            res.status(201).json({ data: { role_id: result.insertId, role_name, role_description }, success: true, message: "Role created successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updateRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const role_id = req.params.id;
        const { role_name, role_description } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                UPDATE hots.user_role SET role_name = ?, role_description = ?
                WHERE role_id = ? AND finished_date IS NULL
            `, [role_name, role_description, role_id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Role not found or already deleted" });
            console.log(`Role updated successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ data: { role_id, role_name, role_description }, success: true, message: "Role updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const role_id = req.params.id;
        try {
            const [usageCheck] = await dbHots.promise().query(`SELECT COUNT(*) as count FROM hots.user WHERE role_id = ?`, [role_id]);
            if (usageCheck[0].count > 0) return res.status(400).json({ success: false, message: "Cannot delete role that is assigned to users" });
            const [result] = await dbHots.promise().query(`UPDATE hots.user_role SET finished_date = NOW() WHERE role_id = ? AND finished_date IS NULL`, [role_id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Role not found or already deleted" });
            console.log(`Role deleted successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Role deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // === JOB TITLE MANAGEMENT ===
    getAllJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        try {
            let user_id = req.dataToken?.user_id || 'unknown';
            const [result] = await dbHots.promise().query(`
                SELECT jobtitle_id, job_title, department_id, description, creation_date, finished_date
                FROM hots.m_company_job_title WHERE finished_date IS NULL ORDER BY job_title ASC
            `);
            console.log(`Trying to get all job titles success from ${user_id} at ${timestamp}`);
            res.status(200).json({ data: result, success: true, message: "Service get job title success" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { job_title, department_id } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_company_job_title (job_title, department_id, creation_date) VALUES (?, ?, NOW())
            `, [job_title, department_id]);
            console.log(`Job title created successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ data: { jobtitle_id: result.insertId, job_title, department_id }, success: true, message: "Job title created successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updateJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        try {
            let user_id = req.dataToken?.user_id || 'unknown';
            const { id } = req.params;
            const { job_title, department_id, description } = req.body;
            let sql = `UPDATE hots.m_company_job_title SET job_title = ?, description = ?`;
            let params = [job_title, description];
            if (department_id !== undefined) { sql += `, department_id = ?`; params.push(department_id); }
            sql += ` WHERE jobtitle_id = ?`;
            params.push(id);
            await dbHots.promise().query(sql, params);
            console.log(`Job title updated successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Job title updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        try {
            await dbHots.promise().query(`UPDATE hots.m_company_job_title SET finished_date = NOW() WHERE jobtitle_id = ?`, [id]);
            console.log(`Job title deleted successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Job title deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // === TEAM MANAGEMENT ===
    getAllTeams: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        try {
            const [teams] = await dbHots.promise().query(`
                SELECT team_id, team_name, department_id, creation_date 
                FROM hots.m_company_team WHERE finished_date IS NULL ORDER BY team_name
            `);
            console.log(`Teams fetched successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, data: teams });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getTeams: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        try {
            const [teams] = await dbHots.promise().query(`
                SELECT t.team_id, t.team_name, t.department_id, d.department_name, t.finished_date,
                    t.department_collaborator,
                    COUNT(tm.user_id) as member_count, SUM(tm.team_leader) as leader_count,
                    CONCAT_WS(' ', u.firstname, u.lastname) AS head_fullname
                FROM hots.m_company_team t
                LEFT JOIN hots.m_company_department d ON t.department_id = d.department_id
                LEFT JOIN hots.m_company_team_member tm ON t.team_id = tm.team_id
                LEFT JOIN hots.user AS u ON u.user_id = tm.user_id
                GROUP BY t.team_id, t.department_id, t.department_collaborator ORDER BY t.team_id 
            `);
            console.log(`Teams fetched successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, data: teams });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getTeamMembers: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { team_id } = req.params;
        try {
            const [members] = await dbHots.promise().query(`
                SELECT u.user_id, u.firstname, u.lastname, u.email, tm.team_leader, mjt.job_title as job_title
                FROM hots.m_company_team_member tm
                JOIN hots.user u ON tm.user_id = u.user_id
                LEFT JOIN hots.m_company_job_title mjt ON u.jobtitle_id = mjt.jobtitle_id
                WHERE tm.team_id = ? AND tm.finished_date IS NULL AND u.finished_date IS NULL
                ORDER BY tm.team_leader DESC, u.firstname, u.lastname
            `, [team_id]);
            console.log(`Team members fetched successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, data: members });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getTeamLeaders: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { team_id } = req.params;
        try {
            const [leaders] = await dbHots.promise().query(`
                SELECT tm.team_id, tm.team_name, u.user_id, u.firstname, u.lastname, u.uid, u.email, u.role_name
                FROM hots.m_company_team_member tm
                JOIN hots.user u ON u.user_id = tm.user_id
                WHERE tm.team_id = ? AND tm.team_leader = 1 AND tm.finished_date IS NULL
                ORDER BY u.firstname
            `, [team_id]);
            console.log(`Team leaders fetched successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, data: leaders });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createTeam: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { team_name, department_id, description, department_collaborator } = req.body;
        try {
            const collabJson = department_collaborator ? JSON.stringify(department_collaborator) : null;
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_company_team (team_name, department_id, description, department_collaborator, created_date) 
                VALUES (?, ?, ?, ?, NOW())
            `, [team_name, department_id, description, collabJson]);
            console.log(`Team created successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Team created successfully", data: { id: result.insertId } });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updateTeam: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { team_name, department_id, description, department_collaborator } = req.body;
        try {
            const collabJson = department_collaborator ? JSON.stringify(department_collaborator) : null;
            await dbHots.promise().query(`
                UPDATE hots.m_company_team SET team_name = ?, department_id = ?, description = ?, 
                department_collaborator = ?, updated_date = NOW()
                WHERE team_id = ? AND finished_date IS NULL
            `, [team_name, department_id, description, collabJson, id]);
            console.log(`Team updated successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Team updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteTeam: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        try {
            await dbHots.promise().query(`UPDATE hots.m_company_team SET finished_date = NOW() WHERE team_id = ? AND finished_date IS NULL`, [id]);
            console.log(`Team deleted successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Team deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    addTeamMember: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const actor_user_id = req.dataToken.user_id;
        const { team_id, user_id, team_leader = 0 } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_company_team_member (team_id, user_id, team_leader, creation_date, updated_date)
                VALUES (?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE team_leader = VALUES(team_leader), updated_date = NOW()
            `, [team_id, user_id, team_leader]);
            console.log(`Team member upserted by ${actor_user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Team member added or updated successfully", data: { affectedRows: result.affectedRows } });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updateTeamLeader: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { team_leader } = req.body;
        try {
            await dbHots.promise().query(`
                UPDATE hots.m_company_team_member SET team_leader = ?, updated_date = NOW() 
                WHERE team_member_id = ? AND finished_date IS NULL
            `, [team_leader, id]);
            console.log(`Team member updated successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Team member updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    removeTeamMember: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const actor_user_id = req.dataToken.user_id;
        const { team_id, user_id } = req.params;
        try {
            const [result] = await dbHots.promise().query(`DELETE FROM hots.m_company_team_member WHERE team_id = ? AND user_id = ?`, [team_id, user_id]);
            console.log(`Team member ${user_id} removed from team ${team_id} by ${actor_user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Team member removed successfully", affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // === DEPARTMENT MANAGEMENT ===
    getAllDepartments: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        try {
            const [rows] = await dbHots.promise().query(`
                SELECT d.department_id, d.department_name, d.department_shortname, d.department_head,
                    CONCAT_WS(' ', u.firstname, u.lastname) AS head_fullname,
                    CASE WHEN d.finished_date IS NOT NULL THEN 1 ELSE 0 END as is_deleted,
                    d.description, d.created_date
                FROM hots.m_company_department AS d
                LEFT JOIN hots.user AS u ON u.user_id = d.department_head
                ORDER BY d.department_name ASC
            `);
            console.log(`Departments fetched successfully at ${timestamp}`);
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getDepartments: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        try {
            const [departments] = await dbHots.promise().query(`
                SELECT d.department_id, d.department_name, d.department_shortname, d.department_head, d.description,
                    COUNT(DISTINCT t.team_id) as team_count, COUNT(DISTINCT u.user_id) as user_count
                FROM hots.m_company_department d
                LEFT JOIN hots.m_company_team t ON d.department_id = t.department_id AND t.finished_date IS NULL
                LEFT JOIN hots.user u ON d.department_id = u.department_id AND u.finished_date IS NULL
                WHERE d.finished_date IS NULL
                GROUP BY d.department_id, d.department_name, d.department_shortname, d.department_head, d.description
                ORDER BY d.department_name
            `);
            console.log(`Departments fetched successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, data: departments });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { department_name, department_shortname, department_head, description } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_company_department (department_name, department_shortname, department_head, description, created_date) 
                VALUES (?, ?, ?, ?, NOW())
            `, [department_name, department_shortname, department_head, description]);
            console.log(`Department created successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Department created successfully", data: { id: result.insertId } });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updateDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { department_name, department_shortname, department_head, description, status } = req.body;
        const updatestatus = status === 'active' ? null : new Date();
        try {
            await dbHots.promise().query(`
                UPDATE hots.m_company_department SET department_name = ?, department_shortname = ?, 
                    department_head = ?, description = ?, finished_date = ?, updated_date = NOW()
                WHERE department_id = ? AND (finished_date IS NULL OR finished_date IS NOT NULL)
            `, [department_name, department_shortname, department_head, description, updatestatus, id]);
            console.log(`Department updated successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Department updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        try {
            await dbHots.promise().query(`UPDATE hots.m_company_department SET finished_date = NOW() WHERE department_id = ? AND finished_date IS NULL`, [id]);
            console.log(`Department deleted successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, message: "Department deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getTeamsByDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { department_id } = req.params;
        try {
            const [teams] = await dbHots.promise().query(`
                SELECT team_id, team_name, department_id, description FROM hots.m_company_team 
                WHERE department_id = ? AND finished_date IS NULL ORDER BY team_name
            `, [department_id]);
            console.log(`Teams for department ${department_id} fetched successfully by ${user_id} at ${timestamp}`);
            res.status(200).json({ success: true, data: teams });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getmember: (req, res) => {
        const date = new Date();
        const timestamp = date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';
        const team_id = req.params.team_id;
        if (!team_id) return res.status(400).send({ success: false, message: 'Invalid team ID!' });
        const queryGetMember = `
            SELECT tm.*, CONCAT(u.firstname, ' ', u.lastname) as fullname
            FROM m_company_team_member tm
            JOIN user u ON tm.user_id = u.user_id
            WHERE tm.team_id = ? AND tm.team_leader = 0
        `;
        dbHots.execute(queryGetMember, [team_id], (err, results) => {
            if (err) return res.status(502).send({ success: false, message: 'Database query error', error: err });
            if (!results.length) return res.status(405).send({ success: false, message: 'No members found for the given team ID!' });
            res.status(200).send({ success: true, message: "GET MEMBER SUCCESS", data: results });
        });
    },

    searchUsers: async (req, res) => {
        const { query } = req.query;
        if (!query) return res.status(200).json({ success: true, data: [] });

        try {
            const searchTerm = `%${query}%`;
            const [rows] = await dbHots.promise().query(
                `SELECT user_id, firstname, lastname, uid 
                 FROM hots.user 
                 WHERE (
                    firstname LIKE ? 
                    OR lastname LIKE ? 
                    OR uid LIKE ? 
                    OR CONCAT(firstname, ' ', lastname) LIKE ?
                    OR CONCAT(lastname, ' ', firstname) LIKE ?
                 ) 
                 AND finished_date IS NULL 
                 LIMIT 10`,
                [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
            );
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};
