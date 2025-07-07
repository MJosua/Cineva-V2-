
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getAllDepartments: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const [departments] = await dbPMS.promise().execute(`
        SELECT 
          d.*,
          CONCAT(u.firstname, ' ', u.lastname) AS head_name,
          COUNT(DISTINCT p.project_id) as project_count,
          COUNT(DISTINCT t.team_id) as team_count,
          COUNT(DISTINCT usr.user_id) as member_count
        FROM hots.m_department d
        LEFT JOIN hots.user u ON d.department_head = u.user_id
        LEFT JOIN prjct_mngr.t_project p ON d.department_id = p.department_id
        LEFT JOIN hots.t_team t ON d.department_id = t.department_id
        LEFT JOIN hots.user usr ON d.department_id = usr.department_id
        WHERE d.is_active = 1
        GROUP BY d.department_id
        ORDER BY d.department_name ASC
      `);

      console.log(timestamp + 'Departments fetched successfully');
      res.status(200).json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching departments:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch departments' });
    }
  },

  getDepartmentDetail: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { id } = req.params;

      const [departments] = await dbPMS.promise().execute(`
        SELECT 
          d.*,
          CONCAT(u.firstname, ' ', u.lastname) AS head_name
        FROM hots.m_department d
        LEFT JOIN hots.user u ON d.department_head = u.user_id
        WHERE d.department_id = ?
      `, [id]);

      if (departments.length === 0) {
        return res.status(404).json({ success: false, error: 'Department not found' });
      }

      // Get teams in this department
      const [teams] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          CONCAT(u.firstname, ' ', u.lastname) AS team_leader_name
        FROM hots.t_team t
        LEFT JOIN hots.user u ON t.team_leader_id = u.user_id
        WHERE t.department_id = ?
      `, [id]);

      // Get users in this department
      const [users] = await dbPMS.promise().execute(`
        SELECT 
          user_id, uid, firstname, lastname, email, role_name, job_title, is_active
        FROM hots.user
        WHERE department_id = ?
        ORDER BY lastname, firstname
      `, [id]);

      const department = departments[0];
      department.teams = teams;
      department.users = users;

      console.log(timestamp + 'Department detail fetched:', id);
      res.status(200).json({ success: true, data: department });
    } catch (error) {
      console.error(timestamp + 'Error fetching department detail:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch department detail' });
    }
  },

  createDepartment: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const data = req.body;

      const [result] = await dbPMS.promise().execute(`
        INSERT INTO m_department 
        (department_id, department_name, department_shortname, description, department_head, is_active, created_date, updated_date)
        VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
      `, [
        data.department_id,
        data.department_name,
        data.department_shortname,
        data.description,
        data.department_head
      ]);

      const [newDepartment] = await dbPMS.promise().execute(
        'SELECT * FROM m_department WHERE department_id = ?',
        [data.department_id]
      );

      console.log(timestamp + 'Department created:', data.department_name);
      res.status(200).json({ success: true, data: newDepartment[0] });
    } catch (error) {
      console.error(timestamp + 'Error creating department:', error);
      res.status(500).json({ success: false, error: 'Failed to create department' });
    }
  },

  updateDepartment: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { id } = req.params;
      const data = req.body;

      await dbPMS.promise().execute(`
        UPDATE m_department 
        SET department_name = ?, department_shortname = ?, description = ?, 
            department_head = ?, updated_date = NOW()
        WHERE department_id = ?
      `, [
        data.department_name,
        data.department_shortname,
        data.description,
        data.department_head,
        id
      ]);

      const [updatedDepartment] = await dbPMS.promise().execute(
        'SELECT * FROM m_department WHERE department_id = ?',
        [id]
      );

      console.log(timestamp + 'Department updated:', id);
      res.status(200).json({ success: true, data: updatedDepartment[0] });
    } catch (error) {
      console.error(timestamp + 'Error updating department:', error);
      res.status(500).json({ success: false, error: 'Failed to update department' });
    }
  }
};
