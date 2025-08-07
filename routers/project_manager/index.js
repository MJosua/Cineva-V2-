
const dashboardRoutes = require('./dashboard_routes');
const projectTemplateRoutes = require('./project_template_routes');
const userRoutes = require('./user_routes');
const roleRoutes = require('./role_routes');
const taskStepsRoutes = require('./task_steps_routes');
const timeTrackingRoutes = require('./time_tracking_routes');
const notificationRoutes = require('./notification_routes');
const teamRoutes = require('./team_routes');
const approvalRoutes = require('./approval_routes');
const departmentRoutes = require('./department_routes');
const projectRoutes = require('./project_routes');
const taskRoutes = require('./task_routes');
const ganttRoutes = require('./gantt_routes');
const kanbanRoutes = require('./kanban_routes');
const projectCommentRoutes = require('./project_comment_routes');

module.exports = {
  dashboard: dashboardRoutes,
  'project-templates': projectTemplateRoutes,
  user: userRoutes,
  role: roleRoutes,
  'task-steps': taskStepsRoutes,
  'time-tracking': timeTrackingRoutes,
  notification: notificationRoutes,
  team: teamRoutes,
  approval: approvalRoutes,
  department: departmentRoutes,
  project: projectRoutes,
  task: taskRoutes,
  gantt: ganttRoutes,
  kanban: kanbanRoutes,
  'project-comments': projectCommentRoutes
};
