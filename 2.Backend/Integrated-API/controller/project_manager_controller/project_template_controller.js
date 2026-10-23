
const { dbPMS } = require('../../config/db');

module.exports = {
  getAllProjectTemplates: async (req, res) => {
    try {
      const { category, active = 'true' } = req.query;

      let query = `
        SELECT 
          pt.*,
          CONCAT(u.firstname, ' ', u.lastname) AS created_by_name,
          COUNT(ptt.template_task_id) AS task_count
        FROM pm.t_project_templates pt
        LEFT JOIN hots.user u ON pt.created_by = u.user_id
        LEFT JOIN pm.t_project_template_tasks ptt ON pt.template_id = ptt.template_id
        WHERE 1=1
      `;
      const params = [];

      if (category) {
        query += ' AND pt.template_category = ?';
        params.push(category);
      }

      if (active === 'true') {
        query += ' AND pt.is_active = TRUE';
      }

      query += ' GROUP BY pt.template_id ORDER BY pt.template_category, pt.template_name';

      const [templates] = await dbPMS.promise().execute(query, params);

      res.status(200).json({
        success: true,
        data: templates,
        packet: templates
      });
    } catch (error) {
      console.error('Error fetching project templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch project templates',
        data: [],
        packet: []
      });
    }
  },

  getTemplatesByCategory: async (req, res) => {
    try {
      const { category } = req.params;

      const [templates] = await dbPMS.promise().execute(`
        SELECT 
          pt.*,
          CONCAT(u.firstname, ' ', u.lastname) AS created_by_name,
          COUNT(ptt.template_task_id) AS task_count
        FROM pm.t_project_templates pt
        LEFT JOIN hots.user u ON pt.created_by = u.user_id
        LEFT JOIN pm.t_project_template_tasks ptt ON pt.template_id = ptt.template_id
        WHERE pt.template_category = ? AND pt.is_active = TRUE
        GROUP BY pt.template_id
        ORDER BY pt.template_name
      `, [category]);

      res.status(200).json({
        success: true,
        data: templates,
        packet: templates
      });
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates by category',
        data: [],
        packet: []
      });
    }
  },

  getProjectTemplateById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get template details
      const [templateResult] = await dbPMS.promise().execute(`
        SELECT 
          pt.*,
          CONCAT(u.firstname, ' ', u.lastname) AS created_by_name
        FROM pm.t_project_templates pt
        LEFT JOIN hots.user u ON pt.created_by = u.user_id
        WHERE pt.template_id = ?
      `, [id]);

      if (templateResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project template not found',
          data: null,
          packet: null
        });
      }

      // Get template tasks
      const [tasksResult] = await dbPMS.promise().execute(`
        SELECT *
        FROM pm.t_project_template_tasks
        WHERE template_id = ?
        ORDER BY task_order ASC
      `, [id]);

      const template = {
        ...templateResult[0],
        tasks: tasksResult
      };

      res.status(200).json({
        success: true,
        data: template,
        packet: template
      });
    } catch (error) {
      console.error('Error fetching project template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch project template',
        data: null,
        packet: null
      });
    }
  },

  createProjectTemplate: async (req, res) => {
    try {
      const { template_name, template_description, template_category, template_data, tasks } = req.body;
      const userId = req.dataToken.user_id;

      // Create template
      const [templateResult] = await dbPMS.promise().execute(`
        INSERT INTO pm.t_project_templates 
        (template_name, template_description, template_category, template_data, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [template_name, template_description, template_category, JSON.stringify(template_data), userId]);

      const templateId = templateResult.insertId;

      // Create template tasks if provided
      if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
          await dbPMS.promise().execute(`
            INSERT INTO pm.t_project_template_tasks
            (template_id, task_name, task_description, task_priority, estimated_hours, task_order, custom_attributes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            templateId,
            task.task_name,
            task.task_description || '',
            task.task_priority || 'medium',
            task.estimated_hours || 0,
            task.task_order || 0,
            task.custom_attributes ? JSON.stringify(task.custom_attributes) : null
          ]);
        }
      }

      // Return created template with tasks
      const [newTemplate] = await dbPMS.promise().execute(`
        SELECT 
          pt.*,
          CONCAT(u.firstname, ' ', u.lastname) AS created_by_name
        FROM pm.t_project_templates pt
        LEFT JOIN hots.user u ON pt.created_by = u.user_id
        WHERE pt.template_id = ?
      `, [templateId]);

      res.status(200).json({
        success: true,
        data: newTemplate[0],
        packet: newTemplate[0]
      });
    } catch (error) {
      console.error('Error creating project template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project template'
      });
    }
  },

  createProjectFromTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { project_name, project_description, department_id, start_date, custom_project_data } = req.body;
      const userId = req.dataToken.user_id;

      // Get template
      const [template] = await dbPMS.promise().execute(`
        SELECT * FROM pm.t_project_templates WHERE template_id = ?
      `, [id]);

      if (template.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project template not found'
        });
      }

      const templateData = JSON.parse(template[0].template_data);

      // Create project
      const [projectResult] = await dbPMS.promise().execute(`
        INSERT INTO pm.t_project 
        (name, description, status, priority, start_date, end_date, manager_id, department_id, custom_attributes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        project_name,
        project_description || templateData.project?.description,
        'planning',
        templateData.project?.priority || 'medium',
        start_date,
        null, // Calculate end_date based on template duration
        userId,
        department_id,
        JSON.stringify(custom_project_data || templateData.project?.custom_attributes || {})
      ]);

      const projectId = projectResult.insertId;

      // Get template tasks and create them
      const [templateTasks] = await dbPMS.promise().execute(`
        SELECT * FROM pm.t_project_template_tasks WHERE template_id = ? ORDER BY task_order
      `, [id]);

      for (const templateTask of templateTasks) {
        await dbPMS.promise().execute(`
          INSERT INTO pm.t_tasks
          (name, description, status, priority, project_id, assigned_to, created_by, estimated_hours, custom_attributes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          templateTask.task_name,
          templateTask.task_description,
          'todo',
          templateTask.task_priority,
          projectId,
          userId, // Assign to project creator by default
          userId,
          templateTask.estimated_hours,
          templateTask.custom_attributes
        ]);
      }

      // Get created project
      const [newProject] = await dbPMS.promise().execute(`
        SELECT 
          p.*,
          CONCAT(u.firstname, ' ', u.lastname) AS manager_name,
          d.department_name
        FROM pm.t_project p
        LEFT JOIN hots.user u ON p.manager_id = u.user_id
        LEFT JOIN hots.m_company_department d ON p.department_id = d.department_id
        WHERE p.project_id = ?
      `, [projectId]);

      res.status(200).json({
        success: true,
        data: newProject[0],
        packet: newProject[0],
        message: 'Project created successfully from template'
      });
    } catch (error) {
      console.error('Error creating project from template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project from template'
      });
    }
  },

  updateProjectTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { template_name, template_description, template_category, template_data } = req.body;

      await dbPMS.promise().execute(`
        UPDATE pm.t_project_templates 
        SET template_name = ?, template_description = ?, template_category = ?, 
            template_data = ?, updated_date = NOW()
        WHERE template_id = ?
      `, [template_name, template_description, template_category, JSON.stringify(template_data), id]);

      const [updatedTemplate] = await dbPMS.promise().execute(`
        SELECT 
          pt.*,
          CONCAT(u.firstname, ' ', u.lastname) AS created_by_name
        FROM pm.t_project_templates pt
        LEFT JOIN hots.user u ON pt.created_by = u.user_id
        WHERE pt.template_id = ?
      `, [id]);

      res.status(200).json({
        success: true,
        data: updatedTemplate[0],
        packet: updatedTemplate[0]
      });
    } catch (error) {
      console.error('Error updating project template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project template'
      });
    }
  },

  deleteProjectTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      await dbPMS.promise().execute(`
        UPDATE pm.t_project_templates 
        SET is_active = FALSE, updated_date = NOW()
        WHERE template_id = ?
      `, [id]);

      res.status(200).json({
        success: true,
        message: 'Project template deleted successfully',
        data: { template_id: id },
        packet: { template_id: id }
      });
    } catch (error) {
      console.error('Error deleting project template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project template'
      });
    }
  }
};
