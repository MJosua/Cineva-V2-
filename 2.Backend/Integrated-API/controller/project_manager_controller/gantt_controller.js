
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getGanttData: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { project_id } = req.params;
      
      // Get project details
      const [projectData] = await dbPMS.promise().execute(`
        SELECT 
          p.*,
          CONCAT(u.firstname, ' ', u.lastname) AS manager_name
        FROM t_project p
        LEFT join hots.user u ON p.manager_id = u.user_id
        WHERE p.project_id = ?
      `, [project_id]);

      if (projectData.length === 0) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      // Get tasks with dependencies
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
        ORDER BY t.created_date ASC
      `, [project_id]);

      // Get task dependencies
      const [dependencies] = await dbPMS.promise().execute(`
        SELECT 
          td.*,
          t1.name AS task_name,
          t2.name AS depends_on_task_name
        FROM t_task_dependencies td
        LEFT JOIN t_tasks t1 ON td.task_id = t1.task_id
        LEFT JOIN t_tasks t2 ON td.depends_on_task_id = t2.task_id
        WHERE t1.project_id = ?
      `, [project_id]);

      // Format data for Gantt chart
      const ganttData = {
        project: projectData[0],
        tasks: tasks.map(task => ({
          ...task,
          start: task.created_date,
          end: task.due_date || task.created_date,
          duration: task.estimated_hours || 0,
          progress: task.progress || 0,
          dependencies: dependencies
            .filter(dep => dep.task_id === task.task_id)
            .map(dep => dep.depends_on_task_id)
        })),
        dependencies: dependencies
      };

      console.log(timestamp + 'Gantt data fetched successfully for project:', project_id);
      res.status(200).json({
        success: true,
        data: ganttData
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching Gantt data:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch Gantt data' });
    }
  },

  updateTaskGantt: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { task_id } = req.params;
      const { start_date, end_date, duration, progress } = req.body;

      await dbPMS.promise().execute(`
        UPDATE t_tasks 
        SET due_date = ?, estimated_hours = ?, progress = ?, updated_date = NOW()
        WHERE task_id = ?
      `, [end_date, duration, progress, task_id]);

      console.log(timestamp + 'Task updated from Gantt view:', task_id);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully'
      });
    } catch (error) {
      console.error(timestamp + 'Error updating task from Gantt:', error);
      res.status(500).json({ success: false, error: 'Failed to update task' });
    }
  }
};
