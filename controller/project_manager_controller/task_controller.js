const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getAllTasks: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      console.log('getAllTasks called with query:', req.query);
      console.log('User ID from token:', req.dataToken?.user_id);

      const {
        status,
        priority,
        assigned_to,
        project_id,
        page = 1,
        limit = 50 // Increased default limit
      } = req.query;

      let query = `
        SELECT 
          t.*,
          p.name AS project_name,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          tg.name AS group_name,
          -- Calculate step completion percentage
          CASE 
            WHEN step_stats.total_steps > 0 
            THEN ROUND((step_stats.completed_steps * 100.0) / step_stats.total_steps)
            ELSE 0 
          END AS step_completion_percentage
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON t.created_by = u_created.user_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        LEFT JOIN (
          SELECT 
            task_id,
            COUNT(*) as total_steps,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_steps
          FROM PM.t_task_steps 
          GROUP BY task_id
        ) step_stats ON t.task_id = step_stats.task_id
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
        console.log('Filtering by project_id:', project_id);
      }

      query += ' ORDER BY t.created_date DESC';

      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      console.log('Executing query:', query);
      console.log('With params:', params);

      const [tasks] = await dbPMS.promise().execute(query, params);

      console.log(`Found ${tasks.length} tasks`);
      if (project_id) {
        console.log(`Tasks for project ${project_id}:`, tasks.map(t => ({ id: t.task_id, name: t.name, project_id: t.project_id })));
      }

      res.status(200).json({
        success: true,
        data: tasks,
        packet: tasks, // Add packet for frontend compatibility
        count: tasks.length,
        query_params: req.query
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch tasks',
        data: [],
        packet: [],
        message: error.message
      });
    }
  },

  getMyTasks: async (req, res) => {
    try {
      console.log('getMyTasks called - User ID:', req.dataToken?.user_id);
      
      if (!req.dataToken || !req.dataToken.user_id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
          data: [],
          packet: []
        });
      }

      const userId = req.dataToken.user_id;
      const { status, project_id } = req.query;

      let query = `
        SELECT 
          t.*, 
          p.name AS project_name,
          tg.name AS group_name,
          -- Calculate step completion percentage
          CASE 
            WHEN step_stats.total_steps > 0 
            THEN ROUND((step_stats.completed_steps * 100.0) / step_stats.total_steps)
            ELSE 0 
          END AS step_completion_percentage
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        LEFT JOIN (
          SELECT 
            task_id,
            COUNT(*) as total_steps,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_steps
          FROM PM.t_task_steps 
          GROUP BY task_id
        ) step_stats ON t.task_id = step_stats.task_id
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

      console.log('Executing query:', query);
      console.log('With params:', params);

      const [tasks] = await dbPMS.promise().execute(query, params);

      console.log('Found tasks:', tasks.length);

      res.status(200).json({
        success: true,
        data: tasks,
        packet: tasks // Add packet for frontend compatibility
      });
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch tasks',
        data: [],
        packet: []
      });
    }
  },

  getTaskById: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Get main task data with relations
      const [taskResult] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          p.name AS project_name,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          tg.name AS group_name,
          -- Calculate step completion percentage
          CASE 
            WHEN step_stats.total_steps > 0 
            THEN ROUND((step_stats.completed_steps * 100.0) / step_stats.total_steps)
            ELSE 0 
          END AS step_completion_percentage
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON t.created_by = u_created.user_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        LEFT JOIN (
          SELECT 
            task_id,
            COUNT(*) as total_steps,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_steps
          FROM PM.t_task_steps 
          GROUP BY task_id
        ) step_stats ON t.task_id = step_stats.task_id
        WHERE t.task_id = ?
      `, [id]);

      if (taskResult.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      const task = taskResult[0];

      // 2. Get task steps with reports
      const [stepsResult] = await dbPMS.promise().execute(`
        SELECT 
          ts.*,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          CONCAT(u_completed.firstname, ' ', u_completed.lastname) AS completed_by_name,
          tsr.report_id,
          tsr.report_sections,
          tsr.custom_attributes as report_custom_attributes,
          tsr.submitted_date as report_submitted_date,
          tsr.is_approved as report_is_approved,
          tsr.approved_by as report_approved_by,
          tsr.approved_date as report_approved_date
        FROM PM.t_task_steps ts
        LEFT JOIN hots.user u_assigned ON ts.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON ts.created_by = u_created.user_id
        LEFT JOIN hots.user u_completed ON ts.completed_by = u_completed.user_id
        LEFT JOIN PM.t_task_step_reports tsr ON ts.step_id = tsr.task_step_id
        WHERE ts.task_id = ?
        ORDER BY ts.step_order ASC, ts.created_date ASC
      `, [id]);

      // 3. Get team assignments
      const [teamsResult] = await dbPMS.promise().execute(`
        SELECT 
          tt.task_id,
          tt.team_id,
          mt.team_name,
          tt.assigned_date,
          tt.assigned_by,
          CONCAT(u_assigned_by.firstname, ' ', u_assigned_by.lastname) AS assigned_by_name
        FROM PM.t_task_teams tt
        LEFT JOIN hots.m_team mt ON tt.team_id = mt.team_id
        LEFT JOIN hots.user u_assigned_by ON tt.assigned_by = u_assigned_by.user_id
        WHERE tt.task_id = ?
      `, [id]);

      // 4. Get custom attributes for the task
      const [customAttributesResult] = await dbPMS.promise().execute(`
        SELECT 
          ca.attribute_id,
          ca.name,
          ca.type,
          ca.options,
          ca.is_required,
          tca.value
        FROM PM.m_custom_attributes ca
        LEFT JOIN PM.m_task_custom_attributes tca ON ca.attribute_id = tca.attribute_id AND tca.task_id = ?
        WHERE ca.applies_to IN ('task', 'both')
        ORDER BY ca.name ASC
      `, [id]);

      // 5. Get attachments/images
      const [attachmentsResult] = await dbPMS.promise().execute(`
        SELECT 
          a.attachment_id,
          a.entity_type,
          a.entity_id,
          a.file_path,
          a.file_name,
          a.file_type,
          a.file_size,
          a.uploaded_by,
          CONCAT(u_uploaded.firstname, ' ', u_uploaded.lastname) AS uploaded_by_name,
          a.upload_date
        FROM PM.t_attachments a
        LEFT JOIN hots.user u_uploaded ON a.uploaded_by = u_uploaded.user_id
        WHERE (a.entity_type = 'task' AND a.entity_id = ?)
           OR (a.entity_type = 'task_step' AND a.entity_id IN (
             SELECT step_id FROM PM.t_task_steps WHERE task_id = ?
           ))
        ORDER BY a.upload_date DESC
      `, [id, id]);

      // Process and structure the response
      const responseData = {
        task: task,
        steps: stepsResult.map(step => ({
          ...step,
          report: step.report_id ? {
            report_id: step.report_id,
            report_sections: step.report_sections ? JSON.parse(step.report_sections) : null,
            custom_attributes: step.report_custom_attributes ? JSON.parse(step.report_custom_attributes) : null,
            submitted_date: step.report_submitted_date,
            is_approved: step.report_is_approved,
            approved_by: step.report_approved_by,
            approved_date: step.report_approved_date
          } : null
        })),
        teams: teamsResult,
        customAttributes: customAttributesResult.map(attr => ({
          ...attr,
          options: attr.options ? JSON.parse(attr.options) : null,
          value: attr.value ? JSON.parse(attr.value) : null
        })),
        attachments: attachmentsResult
      };

      res.status(200).json({
        success: true,
        data: responseData,
        packet: responseData
      });

    } catch (error) {
      console.error('Error fetching task detail:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch task detail' });
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
      await module.exports.updateProjectProgress(data.project_id);

      res.status(200).json({
        success: true,
        data: newTask[0],
        packet: newTask[0]
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ success: false, error: 'Failed to create task' });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.dataToken.user_id;

      // Update task
      await dbPMS.promise().execute(`
        UPDATE PM.t_tasks 
        SET name = ?, description = ?, status = ?, priority = ?, 
            assigned_to = ?, due_date = ?, estimated_hours = ?, 
            custom_attributes = ?, updated_date = NOW()
        WHERE task_id = ?
      `, [
        data.name,
        data.description,
        data.status,
        data.priority,
        data.assigned_to,
        data.due_date,
        data.estimated_hours || 0,
        data.custom_attributes ? JSON.stringify(data.custom_attributes) : null,
        id
      ]);

      // Update team assignments if provided
      if (data.team_ids && Array.isArray(data.team_ids)) {
        // Remove existing team assignments
        await dbPMS.promise().execute('DELETE FROM PM.t_task_teams WHERE task_id = ?', [id]);
        
        // Add new team assignments
        for (const teamId of data.team_ids) {
          await dbPMS.promise().execute(`
            INSERT INTO PM.t_task_teams (task_id, team_id, assigned_by) 
            VALUES (?, ?, ?)
          `, [id, teamId, userId]);
        }
      }

      // Get updated task with all related data
      const [updatedTask] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          p.name AS project_name,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          tg.name AS group_name,
          GROUP_CONCAT(DISTINCT tt.team_id) AS team_ids,
          GROUP_CONCAT(DISTINCT mt.team_name) AS assigned_teams
        FROM PM.t_tasks t
        LEFT JOIN PM.t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON t.created_by = u_created.user_id
        LEFT JOIN PM.t_task_groups tg ON t.group_id = tg.group_id
        LEFT JOIN PM.t_task_teams tt ON t.task_id = tt.task_id
        LEFT JOIN hots.m_team mt ON tt.team_id = mt.team_id
        WHERE t.task_id = ?
        GROUP BY t.task_id
      `, [id]);

      // Update project progress
      if (updatedTask[0]) {
        await module.exports.updateProjectProgress(updatedTask[0].project_id);
      }

      res.status(200).json({
        success: true,
        data: updatedTask[0],
        packet: updatedTask[0]
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, error: 'Failed to update task' });
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
      await module.exports.updateProjectProgress(currentTask[0].project_id);

      res.status(200).json({
        success: true,
        data: updatedTask[0],
        packet: updatedTask[0]
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
        data: updatedTask[0],
        packet: updatedTask[0]
      });
    } catch (error) {
      console.error('Error moving task to group:', error);
      res.status(500).json({ success: false, error: 'Failed to move task to group' });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;

      // Get task info before deleting
      const [task] = await dbPMS.promise().execute(
        'SELECT project_id FROM PM.t_tasks WHERE task_id = ?',
        [id]
      );

      if (task.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      // Delete the task
      await dbPMS.promise().execute('DELETE FROM PM.t_tasks WHERE task_id = ?', [id]);

      // Update project progress
      await module.exports.updateProjectProgress(task[0].project_id);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        data: { task_id: id },
        packet: { task_id: id }
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ success: false, error: 'Failed to delete task' });
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
  },

  // Placeholder methods for missing endpoints
  getTaskDependencies: async (req, res) => {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        data: [],
        packet: []
      });
    } catch (error) {
      console.error('Error fetching task dependencies:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch task dependencies' });
    }
  },

  addTaskDependency: async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Task dependency added successfully'
      });
    } catch (error) {
      console.error('Error adding task dependency:', error);
      res.status(500).json({ success: false, error: 'Failed to add task dependency' });
    }
  },

  getTimeEntries: async (req, res) => {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        data: [],
        packet: []
      });
    } catch (error) {
      console.error('Error fetching time entries:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch time entries' });
    }
  },

  logTime: async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Time logged successfully'
      });
    } catch (error) {
      console.error('Error logging time:', error);
      res.status(500).json({ success: false, error: 'Failed to log time' });
    }
  }
};
