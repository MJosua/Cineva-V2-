
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  // Get approval hierarchy for a user
  getApprovalHierarchy: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { user_id } = req.params;

      const [hierarchy] = await dbPMS.promise().execute(`
        WITH RECURSIVE approval_chain AS (
          SELECT 1 as level, u.superior_id as approver_id, 
                 CONCAT(s.firstname, ' ', s.lastname) as approver_name,
                 s.role_name, s.department_name
          FROM hots.user u
          LEFT JOIN hots.user s ON u.superior_id = s.user_id
          WHERE u.user_id = ? AND u.superior_id IS NOT NULL
          
          UNION ALL
          
          SELECT ac.level + 1, u.superior_id,
                 CONCAT(s.firstname, ' ', s.lastname),
                 s.role_name, s.department_name
          FROM approval_chain ac
          JOIN hots.user u ON ac.approver_id = u.user_id
          LEFT JOIN hots.user s ON u.superior_id = s.user_id
          WHERE u.superior_id IS NOT NULL AND ac.level < 4
        )
        SELECT * FROM approval_chain
      `, [user_id]);

      res.status(200).json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching approval hierarchy:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch approval hierarchy' });
    }
  },

  // Submit task for approval
  submitTaskApproval: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { task_id } = req.params;
      const userId = req.dataToken.user_id;
      const { approval_type, comments } = req.body;

      // Create workflow
      const [workflowResult] = await dbPMS.promise().execute(`
        INSERT INTO PM.t_approval_workflows 
        (entity_type, entity_id, submitted_by, approval_type_id, status)
        VALUES ('task', ?, ?, ?, 'pending')
      `, [task_id, userId, approval_type || 1]);

      const workflowId = workflowResult.insertId;

      // Get approval hierarchy
      const [hierarchy] = await dbPMS.promise().execute(`
        SELECT * FROM PM.get_approval_hierarchy(?)
      `, [userId]);

      // Create approval records for each level
      for (let i = 0; i < hierarchy.length; i++) {
        await dbPMS.promise().execute(`
          INSERT INTO PM.t_task_approvals 
          (workflow_id, task_id, level, approver_id, comments)
          VALUES (?, ?, ?, ?, ?)
        `, [workflowId, task_id, hierarchy[i].level, hierarchy[i].approver_id, comments]);
      }

      // Update task status
      await dbPMS.promise().execute(`
        UPDATE PM.t_tasks SET status = 'pending_approval' WHERE task_id = ?
      `, [task_id]);

      console.log(timestamp + 'Task approval submitted:', task_id);
      res.status(200).json({
        success: true,
        message: 'Task submitted for approval',
        workflow_id: workflowId
      });
    } catch (error) {
      console.error(timestamp + 'Error submitting task approval:', error);
      res.status(500).json({ success: false, error: 'Failed to submit for approval' });
    }
  },

  // Submit project for approval
  submitProjectApproval: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { project_id } = req.params;
      const userId = req.dataToken.user_id;
      const { approval_type, comments, budget_requested } = req.body;

      // Create workflow
      const [workflowResult] = await dbPMS.promise().execute(`
        INSERT INTO PM.t_approval_workflows 
        (entity_type, entity_id, submitted_by, approval_type_id, status)
        VALUES ('project', ?, ?, ?, 'pending')
      `, [project_id, userId, approval_type || 1]);

      const workflowId = workflowResult.insertId;

      // Get approval hierarchy
      const [hierarchy] = await dbPMS.promise().execute(`
        SELECT * FROM PM.get_approval_hierarchy(?)
      `, [userId]);

      // Create approval records for each level
      for (let i = 0; i < hierarchy.length; i++) {
        await dbPMS.promise().execute(`
          INSERT INTO PM.t_project_approvals 
          (workflow_id, project_id, level, approver_id, comments, budget_approved)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [workflowId, project_id, hierarchy[i].level, hierarchy[i].approver_id, comments, budget_requested]);
      }

      // Update project status
      await dbPMS.promise().execute(`
        UPDATE PM.t_project SET status = 'pending_approval' WHERE project_id = ?
      `, [project_id]);

      console.log(timestamp + 'Project approval submitted:', project_id);
      res.status(200).json({
        success: true,
        message: 'Project submitted for approval',
        workflow_id: workflowId
      });
    } catch (error) {
      console.error(timestamp + 'Error submitting project approval:', error);
      res.status(500).json({ success: false, error: 'Failed to submit for approval' });
    }
  },

  // Approve/reject task
  processTaskApproval: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { approval_id } = req.params;
      const userId = req.dataToken.user_id;
      const { action, comments } = req.body; // 'approve' or 'reject'

      // Update approval record
      await dbPMS.promise().execute(`
        UPDATE PM.t_task_approvals 
        SET status = ?, approved_date = NOW(), comments = ?
        WHERE approval_id = ? AND approver_id = ?
      `, [action === 'approve' ? 'approved' : 'rejected', comments, approval_id, userId]);

      // Check if this completes the workflow
      const [approvalInfo] = await dbPMS.promise().execute(`
        SELECT ta.*, tw.workflow_id, tw.entity_id as task_id
        FROM PM.t_task_approvals ta
        JOIN PM.t_approval_workflows tw ON ta.workflow_id = tw.workflow_id
        WHERE ta.approval_id = ?
      `, [approval_id]);

      if (approvalInfo.length > 0) {
        const taskId = approvalInfo[0].task_id;
        const workflowId = approvalInfo[0].workflow_id;

        if (action === 'reject') {
          // Rejection - update workflow and task
          await dbPMS.promise().execute(`
            UPDATE PM.t_approval_workflows 
            SET status = 'rejected', completed_date = NOW()
            WHERE workflow_id = ?
          `, [workflowId]);

          await dbPMS.promise().execute(`
            UPDATE PM.t_tasks SET status = 'rejected' WHERE task_id = ?
          `, [taskId]);
        } else {
          // Check if all approvals are complete
            const [pendingApprovals] = await dbPMS.promise().execute(`
            SELECT COUNT(*) as pending_count
            FROM PM.t_task_approvals 
            WHERE workflow_id = ? AND status = 'pending'
          `, [workflowId]);

          if (pendingApprovals[0].pending_count === 0) {
            // All approved - complete workflow
            await dbPMS.promise().execute(`
              UPDATE PM.t_approval_workflows 
              SET status = 'approved', completed_date = NOW()
              WHERE workflow_id = ?
            `, [workflowId]);

            await dbPMS.promise().execute(`
              UPDATE PM.t_tasks SET status = 'approved' WHERE task_id = ?
            `, [taskId]);
          }
        }
      }

      console.log(timestamp + 'Task approval processed:', approval_id, action);
      res.status(200).json({
        success: true,
        message: `Task ${action}d successfully`
      });
    } catch (error) {
      console.error(timestamp + 'Error processing task approval:', error);
      res.status(500).json({ success: false, error: 'Failed to process approval' });
    }
  },

  // Get pending approvals for a user
  getPendingApprovals: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const userId = req.dataToken.user_id;

      // Get pending task approvals
      const [taskApprovals] = await dbPMS.promise().execute(`
        SELECT 
          ta.*,
          t.name as task_name,
          p.name as project_name,
          CONCAT(u.firstname, ' ', u.lastname) as submitted_by_name,
          tw.submitted_date
        FROM PM.t_task_approvals ta
        JOIN PM.t_tasks t ON ta.task_id = t.task_id
        JOIN PM.t_project p ON t.project_id = p.project_id
        JOIN PM.t_approval_workflows tw ON ta.workflow_id = tw.workflow_id
        JOIN hots.user u ON tw.submitted_by = u.user_id
        WHERE ta.approver_id = ? AND ta.status = 'pending'
        ORDER BY tw.submitted_date DESC
      `, [userId]);

      // Get pending project approvals
      const [projectApprovals] = await dbPMS.promise().execute(`
        SELECT 
          pa.*,
          p.name as project_name,
          CONCAT(u.firstname, ' ', u.lastname) as submitted_by_name,
          tw.submitted_date
        FROM PM.t_project_approvals pa
        JOIN PM.t_project p ON pa.project_id = p.project_id
        JOIN PM.t_approval_workflows tw ON pa.workflow_id = tw.workflow_id
        JOIN hots.user u ON tw.submitted_by = u.user_id
        WHERE pa.approver_id = ? AND pa.status = 'pending'
        ORDER BY tw.submitted_date DESC
      `, [userId]);

      res.status(200).json({
        success: true,
        data: {
          task_approvals: taskApprovals,
          project_approvals: projectApprovals
        }
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching pending approvals:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch pending approvals' });
    }
  }
};
