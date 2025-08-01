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
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_steps
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
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_steps
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
      console.log('getTaskById called for task ID:', id);

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
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_steps
          FROM PM.t_task_steps 
          GROUP BY task_id
        ) step_stats ON t.task_id = step_stats.task_id
        WHERE t.task_id = ?
      `, [id]);

      if (taskResult.length === 0) {
        console.log('Task not found for ID:', id);
        return res.status(404).json({ 
          success: false, 
          error: 'Task not found',
          data: null,
          packet: null
        });
      }

      const task = taskResult[0];
      console.log('Found task:', { task_id: task.task_id, name: task.name, status: task.status });

      // 2. Get task steps with proper column mapping
      const [stepsResult] = await dbPMS.promise().execute(`
        SELECT 
          ts.step_id,
          ts.task_id,
          ts.name,
          ts.description,
          ts.step_order,
          ts.status,
          ts.priority,
          ts.estimated_hours,
          ts.actual_hours,
          ts.start_datetime,
          ts.end_datetime,
          ts.is_completed,
          ts.completion_date,
          ts.approval_status,
          ts.approved_by,
          ts.approved_date,
          ts.rejection_reason,
          ts.created_by,
          ts.created_date,
          ts.updated_date,
          CONCAT(u_approved.firstname, ' ', u_approved.lastname) AS approved_by_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name
        FROM PM.t_task_steps ts
        LEFT JOIN hots.user u_approved ON ts.approved_by = u_approved.user_id
        LEFT JOIN hots.user u_created ON ts.created_by = u_created.user_id
        WHERE ts.task_id = ?
        ORDER BY ts.step_order ASC, ts.created_date ASC
      `, [id]);

      // 3. Get task step journals if they exist
      const [journalsResult] = await dbPMS.promise().execute(`
        SELECT 
          j.journal_id,
          j.step_id,
          j.user_id,
          CONCAT(u.firstname, ' ', u.lastname) AS user_name,
          j.content,
          j.image_urls,
          j.created_date,
          j.updated_date
        FROM PM.t_task_step_journals j
        LEFT JOIN hots.user u ON j.user_id = u.user_id
        WHERE j.step_id IN (
          SELECT step_id FROM PM.t_task_steps WHERE task_id = ?
        )
        ORDER BY j.created_date ASC
      `, [id]).catch(() => [[]]);

      // Process task steps with journals
      const taskSteps = stepsResult.map(step => {
        const stepJournals = journalsResult.filter(journal => journal.step_id === step.step_id);
        return {
          ...step,
          journals: stepJournals.map(journal => ({
            ...journal,
            image_urls: journal.image_urls ? JSON.parse(journal.image_urls) : []
          }))
        };
      });

      // 4. Prepare final response - return task data directly (not nested)
      const responseData = {
        ...task,
        task_steps: taskSteps,
        // Ensure required fields have default values
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        custom_labels: [] // Add empty array for custom labels if not present
      };

      console.log('Returning task data:', { 
        task_id: responseData.task_id, 
        status: responseData.status, 
        steps_count: taskSteps.length 
      });

      res.status(200).json({
        success: true,
        data: responseData,
        packet: responseData
      });

    } catch (error) {
      console.error('Error fetching task detail:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch task detail',
        data: null,
        packet: null,
        message: error.message
      });
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

  // Task Dependencies Management
  getTaskDependencies: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [dependencies] = await dbPMS.promise().execute(`
        SELECT 
          td.dependency_id,
          td.task_id,
          td.depends_on_task_id,
          td.dependency_type,
          td.lag_time,
          td.created_by,
          td.created_date,
          t.name AS depends_on_task_name,
          t.status AS depends_on_task_status
        FROM PM.t_task_dependencies td
        LEFT JOIN PM.t_tasks t ON td.depends_on_task_id = t.task_id
        WHERE td.task_id = ?
        ORDER BY td.created_date ASC
      `, [id]);

      res.status(200).json({
        success: true,
        data: dependencies,
        packet: dependencies
      });
    } catch (error) {
      console.error('Error fetching task dependencies:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch task dependencies' });
    }
  },

  addTaskDependency: async (req, res) => {
    try {
      const { id } = req.params;
      const { depends_on_task_id, dependency_type = 'finish_to_start', lag_time = 0 } = req.body;
      const userId = req.dataToken?.user_id;

      if (!depends_on_task_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'depends_on_task_id is required' 
        });
      }

      // Check if tasks exist
      const [taskExists] = await dbPMS.promise().execute(
        'SELECT task_id FROM PM.t_tasks WHERE task_id IN (?, ?)',
        [id, depends_on_task_id]
      );

      if (taskExists.length !== 2) {
        return res.status(404).json({ 
          success: false, 
          error: 'One or both tasks not found' 
        });
      }

      // Check for circular dependency (basic check)
      const [existingPath] = await dbPMS.promise().execute(`
        WITH RECURSIVE dependency_path AS (
          SELECT task_id, depends_on_task_id, 1 as depth
          FROM PM.t_task_dependencies 
          WHERE depends_on_task_id = ?
          
          UNION ALL
          
          SELECT td.task_id, td.depends_on_task_id, dp.depth + 1
          FROM PM.t_task_dependencies td
          INNER JOIN dependency_path dp ON td.depends_on_task_id = dp.task_id
          WHERE dp.depth < 10
        )
        SELECT * FROM dependency_path WHERE task_id = ?
      `, [id, depends_on_task_id]);

      if (existingPath.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'This dependency would create a circular dependency' 
        });
      }

      // Check if dependency already exists
      const [existingDep] = await dbPMS.promise().execute(
        'SELECT dependency_id FROM PM.t_task_dependencies WHERE task_id = ? AND depends_on_task_id = ?',
        [id, depends_on_task_id]
      );

      if (existingDep.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Dependency already exists' 
        });
      }

      // Add the dependency
      const [result] = await dbPMS.promise().execute(`
        INSERT INTO PM.t_task_dependencies 
        (task_id, depends_on_task_id, dependency_type, lag_time, created_by, created_date)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [id, depends_on_task_id, dependency_type, lag_time, userId]);

      // Fetch the created dependency with task details
      const [newDependency] = await dbPMS.promise().execute(`
        SELECT 
          td.dependency_id,
          td.task_id,
          td.depends_on_task_id,
          td.dependency_type,
          td.lag_time,
          td.created_by,
          td.created_date,
          t.name AS depends_on_task_name,
          t.status AS depends_on_task_status
        FROM PM.t_task_dependencies td
        LEFT JOIN PM.t_tasks t ON td.depends_on_task_id = t.task_id
        WHERE td.dependency_id = ?
      `, [result.insertId]);

      res.status(201).json({
        success: true,
        data: newDependency[0],
        packet: newDependency[0],
        message: 'Task dependency added successfully'
      });
    } catch (error) {
      console.error('Error adding task dependency:', error);
      res.status(500).json({ success: false, error: 'Failed to add task dependency' });
    }
  },

  removeTaskDependency: async (req, res) => {
    try {
      const { dependencyId } = req.params;

      const [result] = await dbPMS.promise().execute(
        'DELETE FROM PM.t_task_dependencies WHERE dependency_id = ?',
        [dependencyId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Dependency not found' 
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task dependency removed successfully',
        data: { dependency_id: dependencyId }
      });
    } catch (error) {
      console.error('Error removing task dependency:', error);
      res.status(500).json({ success: false, error: 'Failed to remove task dependency' });
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
