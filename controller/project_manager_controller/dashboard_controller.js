
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getDashboardStats: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const userId = req.dataToken.user_id;

      // Get user's task statistics
      const [taskStats] = await dbPMS.promise().execute(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'todo' OR status = 'in-progress' THEN 1 ELSE 0 END) as pending_tasks,
          SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 ELSE 0 END) as overdue_tasks
        FROM t_tasks 
        WHERE assigned_to = ?
      `, [userId]);

      // Get user's project statistics
      const [projectStats] = await dbPMS.promise().execute(`
        SELECT 
          COUNT(DISTINCT p.project_id) as total_projects,
          SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_projects,
          SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_projects
        FROM t_project p
        LEFT JOIN t_project_members pm ON p.project_id = pm.project_id
        WHERE p.manager_id = ? OR pm.user_id = ?
      `, [userId, userId]);

      // Get recent activity (tasks created/updated in last 7 days)
      const [recentActivity] = await dbPMS.promise().execute(`
        SELECT 
          t.task_id,
          t.name,
          t.status,
          t.priority,
          t.updated_date,
          p.name as project_name,
          CONCAT(u.firstname, ' ', u.lastname) as assigned_to_name
        FROM t_tasks t
        LEFT JOIN t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u ON t.assigned_to = u.user_id
        WHERE t.assigned_to = ? AND t.updated_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY t.updated_date DESC
        LIMIT 10
      `, [userId]);

      const dashboardData = {
        taskStats: taskStats[0],
        projectStats: projectStats[0],
        recentActivity: recentActivity
      };

      console.log(timestamp + 'Dashboard stats fetched successfully for user:', userId);
      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
  },

  getCrossProjectGantt: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const userId = req.dataToken.user_id;
      const { timeframe = 'month' } = req.query;

      let dateFilter = '';
      switch (timeframe) {
        case 'week':
          dateFilter = 'AND t.due_date >= NOW() AND t.due_date <= DATE_ADD(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'month':
          dateFilter = 'AND t.due_date >= NOW() AND t.due_date <= DATE_ADD(NOW(), INTERVAL 1 MONTH)';
          break;
        case 'quarter':
          dateFilter = 'AND t.due_date >= NOW() AND t.due_date <= DATE_ADD(NOW(), INTERVAL 3 MONTH)';
          break;
      }

      // Get user's tasks across all projects
      const [tasks] = await dbPMS.promise().execute(`
        SELECT 
          t.*,
          p.name as project_name,
          p.start_date as project_start_date,
          p.end_date as project_end_date,
          CONCAT(u_assigned.firstname, ' ', u_assigned.lastname) AS assigned_to_name,
          CONCAT(u_created.firstname, ' ', u_created.lastname) AS created_by_name
        FROM t_tasks t
        LEFT JOIN t_project p ON t.project_id = p.project_id
        LEFT JOIN hots.user u_assigned ON t.assigned_to = u_assigned.user_id
        LEFT JOIN hots.user u_created ON t.created_by = u_created.user_id
        WHERE t.assigned_to = ? ${dateFilter}
        ORDER BY t.due_date ASC, t.priority DESC
      `, [userId]);

      // Format data for Gantt chart
      const ganttData = tasks.map(task => ({
        ...task,
        start: task.created_date,
        end: task.due_date || task.created_date,
        duration: task.estimated_hours || 0,
        progress: calculateTaskProgress(task.status)
      }));

      console.log(timestamp + 'Cross-project Gantt data fetched successfully for user:', userId);
      res.status(200).json({
        success: true,
        data: ganttData
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching cross-project Gantt data:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch Gantt data' });
    }
  }
};

function calculateTaskProgress(status) {
  switch (status) {
    case 'todo': return 0;
    case 'in-progress': return 50;
    case 'review': return 80;
    case 'done': return 100;
    default: return 0;
  }
}
