
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getAllProjects: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const {
        status,
        priority,
        manager_id,
        department_id,
        allow_join,
        page = 1,
        limit = 10
      } = req.query;

      let query = `
        SELECT 
          p.*,
          CONCAT(u.firstname, ' ', u.lastname) AS manager_name,
          d.department_name
        FROM PM.t_project p
        LEFT JOIN hots.user u ON p.manager_id = u.user_id
        LEFT JOIN hots.m_department d ON p.department_id = d.department_id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND p.status = ?';
        params.push(status);
      }
      if (priority) {
        query += ' AND p.priority = ?';
        params.push(priority);
      }
      if (manager_id) {
        query += ' AND p.manager_id = ?';
        params.push(manager_id);
      }
      if (department_id) {
        query += ' AND p.department_id = ?';
        params.push(department_id);
      }
      if (allow_join) {
        query += ' AND p.allow_join = ?';
        params.push(allow_join === 'true');
      }

      query += ' ORDER BY p.created_date DESC';
      
      if (limit !== 'all') {
        const offset = (page - 1) * limit;
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const [projects] = await dbPMS.promise().execute(query, params);

      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
  },

  getProjectDetail: async (req, res) => {
    try {
      const { id } = req.params;

      // Get project with manager and department info
      const [projects] = await dbPMS.promise().execute(`
        SELECT 
          p.*, 
          CONCAT(u.firstname, ' ', u.lastname) AS manager_name,
          d.department_name
        FROM PM.t_project p
        LEFT JOIN hots.user u ON p.manager_id = u.user_id
        LEFT JOIN hots.m_department d ON p.department_id = d.department_id
        WHERE p.project_id = ?
      `, [id]);

      if (projects.length === 0) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      // Get project tasks
      const [tasks] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          tg.name AS group_name
        FROM PM.t_tasks t
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON t.created_by = u_created.user_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        WHERE t.project_id = ?
        ORDER BY t.created_date DESC
      `, [id]);

      // Get project members
      const [members] = await dbPMS.promise().execute(`
        SELECT 
          pm.*,
          CONCAT(u.firstname, ' ', u.lastname) AS user_name,
          u.email
        FROM PM.t_project_members pm
        LEFT JOIN hots.user u ON pm.user_id = u.user_id
        WHERE pm.project_id = ? AND pm.is_active = 1
        ORDER BY pm.role DESC, u.firstname
      `, [id]);

      const project = projects[0];
      project.tasks = tasks;
      project.members = members;

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      console.error('Error fetching project detail:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch project detail' });
    }
  },

  createProject: async (req, res) => {
    try {
      const data = req.body;
      const userId = req.dataToken.user_id;

      const [result] = await dbPMS.promise().execute(`
        INSERT INTO PM.t_project 
        (name, description, status, priority, manager_id, department_id, budget, start_date, end_date, estimated_hours, allow_join, created_date, updated_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        data.name,
        data.description,
        data.status || 'planning',
        data.priority || 'medium',
        data.manager_id || userId,
        data.department_id,
        data.budget,
        data.start_date,
        data.end_date,
        data.estimated_hours,
        data.allow_join || false
      ]);

      // Add project manager as member
      await dbPMS.promise().execute(`
        INSERT INTO PM.t_project_members (project_id, user_id, role, added_by)
        VALUES (?, ?, 'manager', ?)
      `, [result.insertId, data.manager_id || userId, userId]);

      // Create default task groups for Kanban
      const defaultGroups = [
        { name: 'To Do', status_mapping: 'todo', sort_order: 1 },
        { name: 'In Progress', status_mapping: 'in-progress', sort_order: 2 },
        { name: 'Review', status_mapping: 'review', sort_order: 3 },
        { name: 'Done', status_mapping: 'completed', sort_order: 4 }
      ];

      for (const group of defaultGroups) {
        await dbPMS.promise().execute(`
          INSERT INTO PM.t_task_groups (project_id, name, status_mapping, sort_order)
          VALUES (?, ?, ?, ?)
        `, [result.insertId, group.name, group.status_mapping, group.sort_order]);
      }

      const [newProject] = await dbPMS.promise().execute(
        'SELECT * FROM PM.t_project WHERE project_id = ?',
        [result.insertId]
      );

      res.status(200).json({ success: true, data: newProject[0] });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ success: false, error: 'Failed to create project' });
    }
  },

  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      await dbPMS.promise().execute(`
        UPDATE PM.t_project 
        SET name = ?, description = ?, status = ?, priority = ?, budget = ?, 
            start_date = ?, end_date = ?, estimated_hours = ?, allow_join = ?, updated_date = NOW()
        WHERE project_id = ?
      `, [
        data.name,
        data.description,
        data.status,
        data.priority,
        data.budget,
        data.start_date,
        data.end_date,
        data.estimated_hours,
        data.allow_join || false,
        id
      ]);

      const [updatedProject] = await dbPMS.promise().execute(
        'SELECT * FROM PM.t_project WHERE project_id = ?',
        [id]
      );

      res.status(200).json({ success: true, data: updatedProject[0] });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ success: false, error: 'Failed to update project' });
    }
  },

  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;

      await dbPMS.promise().execute('DELETE FROM PM.t_project WHERE project_id = ?', [id]);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
  },

  // Join project request
  requestProjectJoin: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.dataToken.user_id;
      const { message, requested_role } = req.body;

      // Check if project allows joining
      const [project] = await dbPMS.promise().execute(
        'SELECT allow_join FROM PM.t_project WHERE project_id = ?',
        [id]
      );

      if (project.length === 0) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (!project[0].allow_join) {
        return res.status(403).json({ success: false, error: 'Project does not allow join requests' });
      }

      // Check if already a member
      const [existingMember] = await dbPMS.promise().execute(
        'SELECT * FROM PM.t_project_members WHERE project_id = ? AND user_id = ? AND is_active = 1',
        [id, userId]
      );

      if (existingMember.length > 0) {
        return res.status(400).json({ success: false, error: 'Already a member of this project' });
      }

      // Create join request
      await dbPMS.promise().execute(`
        INSERT INTO PM.t_project_join_requests (project_id, user_id, message, requested_role)
        VALUES (?, ?, ?, ?)
      `, [id, userId, message, requested_role || 'member']);

      res.status(200).json({
        success: true,
        message: 'Join request submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting join request:', error);
      res.status(500).json({ success: false, error: 'Failed to submit join request' });
    }
  },

  // Process join request
  processJoinRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { action, comments } = req.body;
      const userId = req.dataToken.user_id;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, error: 'Invalid action' });
      }

      // Get join request details
      const [request] = await dbPMS.promise().execute(`
        SELECT jr.*, p.manager_id 
        FROM PM.t_project_join_requests jr
        JOIN PM.t_project p ON jr.project_id = p.project_id
        WHERE jr.request_id = ?
      `, [requestId]);

      if (request.length === 0) {
        return res.status(404).json({ success: false, error: 'Join request not found' });
      }

      const joinRequest = request[0];

      // Check if user has permission to process (project manager or admin)
      if (joinRequest.manager_id !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized to process this request' });
      }

      // Update request status
      await dbPMS.promise().execute(`
        UPDATE PM.t_project_join_requests 
        SET status = ?, processed_by = ?, processed_date = NOW(), comments = ?
        WHERE request_id = ?
      `, [action === 'approve' ? 'approved' : 'rejected', userId, comments, requestId]);

      // If approved, add to project members
      if (action === 'approve') {
        await dbPMS.promise().execute(`
          INSERT INTO PM.t_project_members (project_id, user_id, role, added_by)
          VALUES (?, ?, ?, ?)
        `, [joinRequest.project_id, joinRequest.user_id, joinRequest.requested_role, userId]);
      }

      res.status(200).json({
        success: true,
        message: `Join request ${action}d successfully`
      });
    } catch (error) {
      console.error('Error processing join request:', error);
      res.status(500).json({ success: false, error: 'Failed to process join request' });
    }
  }
};
