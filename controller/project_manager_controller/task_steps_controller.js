
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  // Get all task steps for a specific task
  getTaskSteps: async (req, res) => {
    try {
      const { taskId } = req.params;
      
      const [taskSteps] = await dbPMS.promise().execute(`
        SELECT 
          ts.*,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          CONCAT(u_approved.firstname, ' ', u_approved.lastname) AS approved_by_name
        FROM PM.t_task_steps ts
        LEFT JOIN hots.user u_created ON ts.created_by = u_created.user_id
        LEFT JOIN hots.user u_approved ON ts.approved_by = u_approved.user_id
        WHERE ts.task_id = ?
        ORDER BY ts.step_order ASC, ts.created_date ASC
      `, [taskId]);

      // Get assignments for each task step
      for (let step of taskSteps) {
        const [assignments] = await dbPMS.promise().execute(`
          SELECT 
            tsa.*,
            CONCAT(u.firstname, ' ', u.lastname) AS user_name,
            t.team_name
          FROM PM.t_task_step_assignments tsa
          LEFT JOIN hots.user u ON tsa.user_id = u.user_id
          LEFT JOIN hots.m_team t ON tsa.team_id = t.team_id
          WHERE tsa.task_step_id = ?
        `, [step.step_id]);
        
        step.assignments = assignments;
      }

      res.status(200).json({
        success: true,
        data: taskSteps
      });
    } catch (error) {
      console.error('Error fetching task steps:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch task steps' });
    }
  },

  // Create a new task step
  createTaskStep: async (req, res) => {
    try {
      const { taskId } = req.params;
      const data = req.body;
      const userId = req.dataToken.user_id;

      // Get the next step order
      const [maxOrder] = await dbPMS.promise().execute(
        'SELECT COALESCE(MAX(step_order), 0) + 1 as next_order FROM PM.t_task_steps WHERE task_id = ?',
        [taskId]
      );

      const stepOrder = data.step_order || maxOrder[0].next_order;

      const [result] = await dbPMS.promise().execute(`
        INSERT INTO PM.t_task_steps 
        (task_id, name, description, step_order, status, priority, estimated_hours, start_datetime, end_datetime, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        taskId,
        data.name,
        data.description || '',
        stepOrder,
        data.status || 'todo',
        data.priority || 'medium',
        data.estimated_hours || 0,
        data.start_datetime || null,
        data.end_datetime || null,
        userId
      ]);

      const stepId = result.insertId;

      // Handle assignments
      if (data.assignments && Array.isArray(data.assignments)) {
        for (const assignment of data.assignments) {
          await dbPMS.promise().execute(`
            INSERT INTO PM.t_task_step_assignments (task_step_id, assignment_type, user_id, team_id, assigned_by)
            VALUES (?, ?, ?, ?, ?)
          `, [
            stepId,
            assignment.type,
            assignment.type === 'user' ? assignment.id : null,
            assignment.type === 'team' ? assignment.id : null,
            userId
          ]);

          // If assigning to team, also assign to all team members
          if (assignment.type === 'team') {
            const [teamMembers] = await dbPMS.promise().execute(`
              SELECT user_id FROM hots.m_team_member WHERE team_id = ? AND is_active = 1
            `, [assignment.id]);

            for (const member of teamMembers) {
              await dbPMS.promise().execute(`
                INSERT INTO PM.t_task_step_assignments (task_step_id, assignment_type, user_id, team_id, assigned_by)
                VALUES (?, 'user', ?, ?, ?)
              `, [stepId, member.user_id, assignment.id, userId]);
            }
          }
        }
      }

      // Handle custom attributes
      if (data.custom_attributes && typeof data.custom_attributes === 'object') {
        for (const [attrName, attrValue] of Object.entries(data.custom_attributes)) {
          await dbPMS.promise().execute(`
            INSERT INTO PM.t_custom_attribute_values (entity_type, entity_id, attribute_name, attribute_value)
            VALUES ('task_step', ?, ?, ?)
          `, [stepId, attrName, JSON.stringify(attrValue)]);
        }
      }

      // Fetch the created task step with all details
      const [newTaskStep] = await dbPMS.promise().execute(`
        SELECT 
          ts.*,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name
        FROM PM.t_task_steps ts
        LEFT JOIN hots.user u_created ON ts.created_by = u_created.user_id
        WHERE ts.step_id = ?
      `, [stepId]);

      res.status(200).json({
        success: true,
        data: newTaskStep[0]
      });
    } catch (error) {
      console.error('Error creating task step:', error);
      res.status(500).json({ success: false, error: 'Failed to create task step' });
    }
  },

  // Update task step
  updateTaskStep: async (req, res) => {
    try {
      const { stepId } = req.params;
      const data = req.body;
      const userId = req.dataToken.user_id;

      await dbPMS.promise().execute(`
        UPDATE PM.t_task_steps 
        SET name = ?, description = ?, status = ?, priority = ?, estimated_hours = ?, 
            start_datetime = ?, end_datetime = ?, updated_date = NOW()
        WHERE step_id = ?
      `, [
        data.name,
        data.description,
        data.status,
        data.priority,
        data.estimated_hours,
        data.start_datetime,
        data.end_datetime,
        stepId
      ]);

      // Update custom attributes if provided
      if (data.custom_attributes && typeof data.custom_attributes === 'object') {
        // Delete existing custom attributes
        await dbPMS.promise().execute(
          'DELETE FROM PM.t_custom_attribute_values WHERE entity_type = "task_step" AND entity_id = ?',
          [stepId]
        );

        // Insert new custom attributes
        for (const [attrName, attrValue] of Object.entries(data.custom_attributes)) {
          await dbPMS.promise().execute(`
            INSERT INTO PM.t_custom_attribute_values (entity_type, entity_id, attribute_name, attribute_value)
            VALUES ('task_step', ?, ?, ?)
          `, [stepId, attrName, JSON.stringify(attrValue)]);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Task step updated successfully'
      });
    } catch (error) {
      console.error('Error updating task step:', error);
      res.status(500).json({ success: false, error: 'Failed to update task step' });
    }
  },

  // Update task step order (for drag and drop)
  updateTaskStepOrder: async (req, res) => {
    try {
      const { stepId } = req.params;
      const { newOrder, taskId } = req.body;

      // Get current step order
      const [currentStep] = await dbPMS.promise().execute(
        'SELECT step_order FROM PM.t_task_steps WHERE step_id = ?',
        [stepId]
      );

      if (currentStep.length === 0) {
        return res.status(404).json({ success: false, error: 'Task step not found' });
      }

      const currentOrder = currentStep[0].step_order;

      // Update orders for other steps
      if (newOrder > currentOrder) {
        // Moving down: decrease order of steps between current and new position
        await dbPMS.promise().execute(`
          UPDATE PM.t_task_steps 
          SET step_order = step_order - 1 
          WHERE task_id = ? AND step_order > ? AND step_order <= ?
        `, [taskId, currentOrder, newOrder]);
      } else if (newOrder < currentOrder) {
        // Moving up: increase order of steps between new and current position
        await dbPMS.promise().execute(`
          UPDATE PM.t_task_steps 
          SET step_order = step_order + 1 
          WHERE task_id = ? AND step_order >= ? AND step_order < ?
        `, [taskId, newOrder, currentOrder]);
      }

      // Update the moved step
      await dbPMS.promise().execute(
        'UPDATE PM.t_task_steps SET step_order = ? WHERE step_id = ?',
        [newOrder, stepId]
      );

      res.status(200).json({
        success: true,
        message: 'Task step order updated successfully'
      });
    } catch (error) {
      console.error('Error updating task step order:', error);
      res.status(500).json({ success: false, error: 'Failed to update task step order' });
    }
  },

  // Complete task step
  completeTaskStep: async (req, res) => {
    try {
      const { stepId } = req.params;
      const { progress_comment } = req.body;
      const userId = req.dataToken.user_id;

      await dbPMS.promise().execute(`
        UPDATE PM.t_task_steps 
        SET is_completed = TRUE, completion_date = NOW(), status = 'done'
        WHERE step_id = ?
      `, [stepId]);

      // Create a report if progress comment is provided
      if (progress_comment) {
        await dbPMS.promise().execute(`
          INSERT INTO PM.t_task_step_reports (task_step_id, report_data, submitted_by)
          VALUES (?, ?, ?)
        `, [stepId, JSON.stringify({ progress_comment }), userId]);
      }

      res.status(200).json({
        success: true,
        message: 'Task step marked as complete'
      });
    } catch (error) {
      console.error('Error completing task step:', error);
      res.status(500).json({ success: false, error: 'Failed to complete task step' });
    }
  },

  // Approve/Reject task step completion
  processTaskStepApproval: async (req, res) => {
    try {
      const { stepId } = req.params;
      const { action, rejection_reason } = req.body; // action: 'approve' or 'reject'
      const userId = req.dataToken.user_id;

      const approvalStatus = action === 'approve' ? 'approved' : 'rejected';

      await dbPMS.promise().execute(`
        UPDATE PM.t_task_steps 
        SET approval_status = ?, approved_by = ?, approved_date = NOW(), rejection_reason = ?
        WHERE step_id = ?
      `, [approvalStatus, userId, rejection_reason || null, stepId]);

      // If rejected, unmark as completed
      if (action === 'reject') {
        await dbPMS.promise().execute(`
          UPDATE PM.t_task_steps 
          SET is_completed = FALSE, completion_date = NULL, status = 'in-progress'
          WHERE step_id = ?
        `, [stepId]);
      }

      res.status(200).json({
        success: true,
        message: `Task step ${action}d successfully`
      });
    } catch (error) {
      console.error('Error processing task step approval:', error);
      res.status(500).json({ success: false, error: 'Failed to process approval' });
    }
  },

  // Delete task step
  deleteTaskStep: async (req, res) => {
    try {
      const { stepId } = req.params;

      // Get task_id and step_order before deletion
      const [step] = await dbPMS.promise().execute(
        'SELECT task_id, step_order FROM PM.t_task_steps WHERE step_id = ?',
        [stepId]
      );

      if (step.length === 0) {
        return res.status(404).json({ success: false, error: 'Task step not found' });
      }

      const { task_id, step_order } = step[0];

      // Delete the task step (cascade will handle assignments and reports)
      await dbPMS.promise().execute('DELETE FROM PM.t_task_steps WHERE step_id = ?', [stepId]);

      // Reorder remaining steps
      await dbPMS.promise().execute(`
        UPDATE PM.t_task_steps 
        SET step_order = step_order - 1 
        WHERE task_id = ? AND step_order > ?
      `, [task_id, step_order]);

      res.status(200).json({
        success: true,
        message: 'Task step deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting task step:', error);
      res.status(500).json({ success: false, error: 'Failed to delete task step' });
    }
  },

  // Get task step templates
  getTaskStepTemplates: async (req, res) => {
    try {
      const { category } = req.query;
      
      let query = `
        SELECT 
          tst.*,
          CONCAT(u.firstname, ' ', u.lastname) AS created_by_name
        FROM PM.t_task_step_templates tst
        LEFT JOIN hots.user u ON tst.created_by = u.user_id
        WHERE tst.is_active = 1
      `;
      const params = [];

      if (category) {
        query += ' AND tst.category = ?';
        params.push(category);
      }

      query += ' ORDER BY tst.name ASC';

      const [templates] = await dbPMS.promise().execute(query, params);

      res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching task step templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
  },

  // Create task step template
  createTaskStepTemplate: async (req, res) => {
    try {
      const { name, description, template_data, category } = req.body;
      const userId = req.dataToken.user_id;

      const [result] = await dbPMS.promise().execute(`
        INSERT INTO PM.t_task_step_templates (name, description, template_data, category, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [name, description, JSON.stringify(template_data), category, userId]);

      res.status(200).json({
        success: true,
        data: { template_id: result.insertId }
      });
    } catch (error) {
      console.error('Error creating task step template:', error);
      res.status(500).json({ success: false, error: 'Failed to create template' });
    }
  }
};
