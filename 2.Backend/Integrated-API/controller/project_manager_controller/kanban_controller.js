
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getKanbanData: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { project_id } = req.params;

      // Get project details
      const [projectData] = await dbPMS.promise().execute(`
        SELECT * FROM pm.t_project WHERE project_id = ?
      `, [project_id]);

      if (projectData.length === 0) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      // Get task groups/columns
      const [groups] = await dbPMS.promise().execute(`
        SELECT * FROM PM.t_task_groups  
        WHERE project_id = ? 
        ORDER BY sort_order ASC
      `, [project_id]);

      // If no custom groups, use default statuses
      let columns = groups.length > 0 ? groups : [
        { group_id: 'todo', name: 'To Do', status: 'todo', color: '#94a3b8' },
        { group_id: 'in-progress', name: 'In Progress', status: 'in-progress', color: '#3b82f6' },
        { group_id: 'review', name: 'Review', status: 'review', color: '#f59e0b' },
        { group_id: 'done', name: 'Done', status: 'done', color: '#10b981' }
      ];

      // Get tasks grouped by status
      const [tasks] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name,
          p.name AS project_name
        FROM t_tasks t
        LEFT join hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT join hots.user u_created ON t.created_by = u_created.user_id
        LEFT JOIN t_project p ON t.project_id = p.project_id
        WHERE t.project_id = ?
        ORDER BY t.created_date DESC
      `, [project_id]);

      // Group tasks by status
      const kanbanData = {
        project: projectData[0],
        columns: columns.map(column => ({
          ...column,
          tasks: tasks.filter(task => task.status === column.status || task.group_id === column.group_id)
        }))
      };

      console.log(timestamp + 'Kanban data fetched successfully for project:', project_id);
      res.status(200).json({
        success: true,
        data: kanbanData
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching Kanban data:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch Kanban data' });
    }
  },

  moveTaskKanban: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { task_id } = req.params;
      const { new_status, new_group_id, new_position } = req.body;

      let updateQuery = `
        UPDATE t_tasks 
        SET status = ?, updated_date = NOW()
      `;
      let params = [new_status];

      if (new_group_id) {
        updateQuery += `, group_id = ?`;
        params.push(new_group_id);
      }

      updateQuery += ` WHERE task_id = ?`;
      params.push(task_id);

      await dbPMS.promise().execute(updateQuery, params);

      console.log(timestamp + 'Task moved in Kanban:', task_id, 'to status:', new_status);
      res.status(200).json({
        success: true,
        message: 'Task moved successfully'
      });
    } catch (error) {
      console.error(timestamp + 'Error moving task in Kanban:', error);
      res.status(500).json({ success: false, error: 'Failed to move task' });
    }
  }
};
