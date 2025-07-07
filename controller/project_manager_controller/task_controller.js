
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getAllTasks: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const {
        status,
        priority,
        assigned_to,
        project_id,
        page = 1,
        limit = 10
      } = req.query;

      let query = `
        SELECT 
          t.*,
          p.name AS project_name,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          tg.name AS group_name
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON t.created_by = u_created.user_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }
      if (priority) {
        query += ' AND t.priority = ?';
        params.push(priority);
      }
      if (assigned_to) {
        query += ' AND t.assigned_to = ?';
        params.push(assigned_to);
      }
      if (project_id) {
        query += ' AND t.project_id = ?';
        params.push(project_id);
      }

      query += ' ORDER BY t.created_date DESC';

      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [tasks] = await dbPMS.promise().execute(query, params);

      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
  },

  getMyTasks: async (req, res) => {
    try {
      const userId = req.dataToken.user_id;
      const { status, project_id } = req.query;

      let query = `
        SELECT 
          t.*, 
          p.name AS project_name,
          tg.name AS group_name
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        WHERE t.assigned_to = ?
      `;
      const params = [userId];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }

      if (project_id) {
        query += ' AND t.project_id = ?';
        params.push(project_id);
      }

      query += ' ORDER BY t.due_date ASC, t.created_date DESC';

      const [tasks] = await dbPMS.promise().execute(query, params);

      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
  },

  createTask: async (req, res) => {
    try {
      const data = req.body;
      const userId = req.dataToken.user_id;

      // Get default group if not specified
      let groupId = data.group_id;
      if (!groupId && data.project_id) {
        const [defaultGroup] = await dbPMS.promise().execute(`
          SELECT group_id FROM PM.t_task_groups 
          WHERE project_id = ? AND status_mapping = 'todo' 
          ORDER BY sort_order LIMIT 1
        `, [data.project_id]);
        
        if (defaultGroup.length > 0) {
          groupId = defaultGroup[0].group_id;
        }
      }

      const [result] = await dbPMS.promise().execute(`
        INSERT INTO PM.t_tasks 
        (name, description, status, priority, project_id, assigned_to, created_by, due_date, estimated_hours, group_id, created_date, updated_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        data.name,
        data.description,
        data.status || 'todo',
        data.priority || 'medium',
        data.project_id,
        data.assigned_to,
        userId,
        data.due_date,
        data.estimated_hours || 0,
        groupId
      ]);

      const [newTask] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          p.name AS project_name,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          tg.name AS group_name
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON t.created_by = u_created.user_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        WHERE t.task_id = ?
      `, [result.insertId]);

      // Update project progress
      await this.updateProjectProgress(data.project_id);

      res.status(200).json({
        success: true,
        data: newTask[0]
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ success: false, error: 'Failed to create task' });
    }
  },

  updateTaskStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, progress } = req.body;

      // Get current task to check project
      const [currentTask] = await dbPMS.promise().execute(
        'SELECT project_id FROM PM.t_tasks WHERE task_id = ?',
        [id]
      );

      if (currentTask.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      await dbPMS.promise().execute(`
        UPDATE PM.t_tasks 
        SET status = ?, progress = ?, updated_date = NOW()
        WHERE task_id = ?
      `, [status, progress || 0, id]);

      const [updatedTask] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          p.name AS project_name,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          tg.name AS group_name
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        WHERE t.task_id = ?
      `, [id]);

      // Update project progress
      await this.updateProjectProgress(currentTask[0].project_id);

      res.status(200).json({
        success: true,
        data: updatedTask[0]
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ success: false, error: 'Failed to update task status' });
    }
  },

  moveTaskToGroup: async (req, res) => {
    try {
      const { id } = req.params;
      const { group_id } = req.body;

      if (!group_id) {
        return res.status(400).json({ success: false, error: 'group_id is required' });
      }

      // Get group info to update task status
      const [group] = await dbPMS.promise().execute(
        'SELECT status_mapping FROM PM.t_task_groups WHERE group_id = ?',
        [group_id]
      );

      if (group.length === 0) {
        return res.status(404).json({ success: false, error: 'Task group not found' });
      }

      const newStatus = group[0].status_mapping;

      await dbPMS.promise().execute(`
        UPDATE PM.t_tasks
        SET group_id = ?, status = ?, updated_date = NOW()
        WHERE task_id = ?
      `, [group_id, newStatus, id]);

      const [updatedTask] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          p.name AS project_name,
          tg.name AS group_name
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        WHERE t.task_id = ?
      `, [id]);

      res.status(200).json({
        success: true,
        data: updatedTask[0]
      });
    } catch (error) {
      console.error('Error moving task to group:', error);
      res.status(500).json({ success: false, error: 'Failed to move task to group' });
    }
  },

  // Helper method to update project progress
  updateProjectProgress: async (projectId) => {
    try {
      const [totalTasks] = await dbPMS.promise().execute(
        'SELECT COUNT(*) as total FROM PM.t_tasks WHERE project_id = ?',
        [projectId]
      );

      const [completedTasks] = await dbPMS.promise().execute(
        'SELECT COUNT(*) as completed FROM PM.t_tasks WHERE project_id = ? AND status = "completed"',
        [projectId]
      );

      const total = totalTasks[0].total;
      const completed = completedTasks[0].completed;
      const progress = total > 0 ? Math.round((completed * 100) / total) : 0;

      await dbPMS.promise().execute(
        'UPDATE PM.t_project SET progress = ?, updated_date = NOW() WHERE project_id = ?',
        [progress, projectId]
      );
    } catch (error) {
      console.error('Error updating project progress:', error);
    }
  }
};
