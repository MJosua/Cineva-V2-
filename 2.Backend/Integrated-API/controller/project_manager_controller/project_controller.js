const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getAllProjects: async (req, res) => {
    try {
      const query = `
        SELECT 
          p.project_id,
          p.name,
          p.description,
          p.start_date,
          p.end_date,
          p.status,
          p.priority,
          p.budget,
          p.department_id,
          p.allow_join,
          p.created_date,
          d.department_name,
          u.firstname as manager_firstname,
          u.lastname as manager_lastname,
          CONCAT(u.firstname, ' ', u.lastname) as manager_name,
          (SELECT COUNT(*) from t_project_members pm WHERE pm.project_id = p.project_id) as member_count
        from t_project p
        LEFT join hots.m_company_department d ON p.department_id = d.department_id
        LEFT join hots.user u ON p.manager_id = u.user_id
        ORDER BY p.created_date DESC
      `;
      const [projects] = await dbPMS.promise().execute(query);
      res.status(200).json({
        success: true,
        data: projects,
        message: 'Projects retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting all projects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve projects',
        error: error.message
      });
    }
  },

  getMyProjects: async (req, res) => {
    try {

      const userId = req.dataToken.user_id;

      const query = `
        SELECT 
          p.project_id,
          p.name,
          p.description,
          p.start_date,
          p.end_date,
          p.status,
          p.priority,
          p.budget,
          p.department_id,
          p.allow_join,
          p.created_date,
          d.department_name,
          u.firstname as manager_firstname,
          u.lastname as manager_lastname,
          CONCAT(u.firstname, ' ', u.lastname) as manager_name,
          (SELECT COUNT(*) from t_project_members pm WHERE pm.project_id = p.project_id) as member_count
        from t_project p
        LEFT join hots.m_company_department d ON p.department_id = d.department_id
        LEFT join hots.user u ON p.manager_id = u.user_id
        WHERE p.project_id IN (SELECT project_id from t_project_members WHERE user_id = ?)
        ORDER BY p.created_date DESC
      `;
      const [projects] = await dbPMS.promise().execute(query, [userId]);
      res.status(200).json({
        success: true,
        data: projects,
        message: 'User projects retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting user projects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user projects',
        error: error.message
      });
    }
  },

  getAvailableProjectsToJoin: async (req, res) => {
    try {
      const userId = req.dataToken.user_id;
      const userDepartmentId = req.dataToken.department_id;

      const query = `
      SELECT DISTINCT 
        p.project_id,
        p.name,
        p.description,
        p.start_date,
        p.end_date,
        p.status,
        p.priority,
        p.budget,
        p.department_id,
        p.allow_join,
        p.created_date,
        d.department_name,
        u.firstname as manager_firstname,
        u.lastname as manager_lastname,
        CONCAT(u.firstname, ' ', u.lastname) as manager_name,
        (SELECT COUNT(*) FROM t_project_members pm WHERE pm.project_id = p.project_id) AS member_count
      FROM t_project p
      LEFT JOIN hots.m_company_department d ON p.department_id = d.department_id
      LEFT JOIN hots.user u ON p.manager_id = u.user_id
      WHERE p.allow_join = true
        AND p.status IN ('planning', 'active')
        AND (p.department_id = ? OR p.is_cross_departmental = true)
        AND p.project_id NOT IN (
          SELECT pm.project_id 
          FROM t_project_members pm 
          WHERE pm.user_id = ?
        )
      ORDER BY p.created_date DESC
    `;

      const [projects] = await dbPMS.promise().execute(query, [userDepartmentId, userId]);

      res.status(200).json({
        success: true,
        data: projects,
        message: 'Available projects retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting available projects to join:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve available projects',
        error: error.message
      });
    }
  },

  createProject: async (req, res) => {
    try {
      const {
        name,
        description,
        start_date,
        end_date,
        status,
        priority,
        department_id,
        allow_join,
        created_by,
        is_cross_departmental,
        selected_teams = []
      } = req.body;

      console.log(`${yellowTerminal}[PROJECT CREATE] Request body:`, req.body);
      console.log(`${yellowTerminal}[PROJECT CREATE] User from token:`, req.dataToken);

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        });
      }

      // Get user from token and set default values
      const userId = req.dataToken.user_id;
      const userDepartmentId = req.dataToken.department_id;

      // Set default values for undefined parameters
      const projectData = {
        name: name,
        description: description || '',
        start_date: start_date || null,
        end_date: end_date || null,
        status: status || 'planning',
        priority: priority || 'medium',
        department_id: department_id || userDepartmentId,
        allow_join: allow_join !== undefined ? (allow_join ? 1 : 0) : 0,
        manager_id: created_by || userId,
        is_cross_departmental: is_cross_departmental !== undefined ? (is_cross_departmental ? 1 : 0) : 0
      };

      console.log(`${yellowTerminal}[PROJECT CREATE] Processed data:`, projectData);

      const query = `
        INSERT INTO t_project (
          name,
          description,
          start_date,
          end_date,
          status,
          priority,
          department_id,
          allow_join,
          manager_id,
          is_cross_departmental,
          created_date,
          updated_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await dbPMS.promise().execute(query, [
        projectData.name,
        projectData.description,
        projectData.start_date,
        projectData.end_date,
        projectData.status,
        projectData.priority,
        projectData.department_id,
        projectData.allow_join,
        projectData.manager_id,
        projectData.is_cross_departmental
      ]);

      console.log(`${yellowTerminal}[PROJECT CREATE] Insert result:`, result);

      const project_id = result.insertId;
      console.log(`${yellowTerminal}[PROJECT CREATE] Created project ID:`, project_id);

      // Add the project creator as a member
      const addMemberQuery = 'INSERT INTO t_project_members (project_id, user_id, role, joined_date) VALUES (?, ?, ?, NOW())';
      await dbPMS.promise().execute(addMemberQuery, [project_id, userId, 'owner']);

      console.log(`${yellowTerminal}[PROJECT CREATE] Added creator as member:`, userId);

      // Assign teams to project if selected
      if (selected_teams && selected_teams.length > 0) {
        console.log(`${yellowTerminal}[PROJECT CREATE] Assigning teams:`, selected_teams);

        const teamAssignQuery = 'INSERT INTO t_project_team_assignments (project_id, team_id, assigned_date) VALUES (?, ?, NOW())';
        for (const teamId of selected_teams) {
          try {
            await dbPMS.promise().execute(teamAssignQuery, [project_id, teamId]);
            console.log(`${yellowTerminal}[PROJECT CREATE] Assigned team ${teamId} to project`);

            // Add team members to project
            const teamMembersQuery = `
              SELECT tm.user_id 
              FROM t_team_members tm 
              WHERE tm.team_id = ? AND tm.user_id != ?
            `;
            const [teamMembers] = await dbPMS.promise().execute(teamMembersQuery, [teamId, userId]);

            for (const member of teamMembers) {
              const memberInsertQuery = 'INSERT IGNORE INTO t_project_members (project_id, user_id, role, joined_date) VALUES (?, ?, ?, NOW())';
              await dbPMS.promise().execute(memberInsertQuery, [project_id, member.user_id, 'member']);
              console.log(`${yellowTerminal}[PROJECT CREATE] Added team member ${member.user_id} to project`);
            }
          } catch (teamError) {
            console.error(`${yellowTerminal}[PROJECT CREATE] Error assigning team ${teamId}:`, teamError);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: {
          project_id,
          ...projectData,
          selected_teams
        },
        packet: {
          project_id,
          ...projectData,
          selected_teams
        },
        message: 'Project created successfully'
      });

      console.log(`${yellowTerminal}[PROJECT CREATE] Success response sent`);
    } catch (error) {
      console.error(`${yellowTerminal}[PROJECT CREATE] Error:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error.message
      });
    }
  },

  getUserProjects: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId parameter is required'
        });
      }

      const query = `
        SELECT 
          p.*,
          CONCAT(manager.firstname, ' ', manager.lastname) AS manager_name,
          d.department_name,
          pm.role as user_role,
          pm.joined_date,
          -- Calculate project progress based on task completion
          CASE 
            WHEN task_stats.total_tasks > 0 
            THEN ROUND((task_stats.completed_tasks * 100.0) / task_stats.total_tasks)
            ELSE 0 
          END AS calculated_progress
        FROM PM.t_project p
        INNER JOIN PM.t_project_members pm ON p.project_id = pm.project_id
        LEFT JOIN hots.user manager ON p.manager_id = manager.user_id
        LEFT JOIN hots.m_company_department d ON p.department_id = d.department_id
        LEFT JOIN (
          SELECT 
            project_id,
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status IN ('done', 'completed') THEN 1 ELSE 0 END) as completed_tasks
          FROM PM.t_tasks 
          GROUP BY project_id
        ) task_stats ON p.project_id = task_stats.project_id
        WHERE pm.user_id = ? AND pm.left_date IS NULL
        ORDER BY p.updated_date DESC
      `;

      const [projects] = await dbPMS.promise().execute(query, [userId]);

      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Error fetching user projects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user projects'
      });
    }
  },

  getProjectById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          p.project_id,
          p.name,
          p.description,
          p.start_date,
          p.end_date,
          p.status,
          p.priority,
          p.budget,
          p.department_id,
          p.allow_join,
          p.created_date,
          d.department_name,
          u.firstname as manager_firstname,
          u.lastname as manager_lastname,
          CONCAT(u.firstname, ' ', u.lastname) as manager_name,
          (SELECT COUNT(*) from t_project_members pm WHERE pm.project_id = p.project_id) as member_count
        from t_project p
        LEFT join hots.m_company_department d ON p.department_id = d.department_id
        LEFT join hots.user u ON p.manager_id = u.user_id
        WHERE p.project_id = ?
      `;
      const [project] = await dbPMS.promise().execute(query, [id]);

      if (project.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.status(200).json({
        success: true,
        data: project[0],
        message: 'Project retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting project by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve project',
        error: error.message
      });
    }
  },

  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        start_date,
        end_date,
        status,
        priority,
        budget,
        department_id,
        allow_join,
        manager_id,
        is_cross_departmental
      } = req.body;

      const query = `
        UPDATE projects 
        SET 
          name = ?,
          description = ?,
          start_date = ?,
          end_date = ?,
          status = ?,
          priority = ?,
          budget = ?,
          department_id = ?,
          allow_join = ?,
          manager_id = ?,
          is_cross_departmental = ?
        WHERE project_id = ?
      `;

      await dbPMS.promise().execute(query, [
        name,
        description,
        start_date,
        end_date,
        status,
        priority,
        budget,
        department_id,
        allow_join,
        manager_id,
        is_cross_departmental,
        id
      ]);

      res.status(200).json({
        success: true,
        data: { project_id: id, ...req.body },
        message: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        error: error.message
      });
    }
  },

  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;
      const query = 'DELETE from t_project WHERE project_id = ?';
      await dbPMS.promise().execute(query, [id]);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message
      });
    }
  },

  getProjectMembers: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          pm.user_id,
          pm.role,
          u.firstname,
          u.lastname,
          u.email,
          u.username,
          u.department_id,
          d.department_name
        from t_project_members pm
        LEFT join hots.user u ON pm.user_id = u.user_id
        LEFT join hots.m_company_department d ON u.department_id = d.department_id
        WHERE pm.project_id = ?
      `;
      const [members] = await dbPMS.promise().execute(query, [id]);

      res.status(200).json({
        success: true,
        data: members,
        message: 'Project members retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting project members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve project members',
        error: error.message
      });
    }
  },

  addProjectMember: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, role } = req.body;

      const query = 'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)';
      await dbPMS.promise().execute(query, [id, user_id, role]);

      res.status(201).json({
        success: true,
        data: { project_id: id, user_id, role },
        message: 'Project member added successfully'
      });
    } catch (error) {
      console.error('Error adding project member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add project member',
        error: error.message
      });
    }
  },

  removeProjectMember: async (req, res) => {
    try {
      const { id, userId } = req.params;
      const query = 'DELETE from t_project_members WHERE project_id = ? AND user_id = ?';
      await dbPMS.promise().execute(query, [id, userId]);

      res.status(200).json({
        success: true,
        message: 'Project member removed successfully'
      });
    } catch (error) {
      console.error('Error removing project member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove project member',
        error: error.message
      });
    }
  },

  requestToJoinProject: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.dataToken.user_id;

      // Check if the user is already a member or has a pending request
      const existingMemberQuery = 'SELECT * from t_project_members WHERE project_id = ? AND user_id = ?';
      const existingRequestQuery = 'SELECT * FROM project_join_requests WHERE project_id = ? AND user_id = ? AND status = ?';

      const [existingMember] = await dbPMS.promise().execute(existingMemberQuery, [id, userId]);
      const [existingRequest] = await dbPMS.promise().execute(existingRequestQuery, [id, userId, 'pending']);

      if (existingMember.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this project'
        });
      }

      if (existingRequest.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already requested to join this project'
        });
      }

      const query = 'INSERT INTO project_join_requests (project_id, user_id, request_date, status) VALUES (?, ?, NOW(), ?)';
      await dbPMS.promise().execute(query, [id, userId, 'pending']);

      res.status(201).json({
        success: true,
        message: 'Request to join project submitted successfully'
      });
    } catch (error) {
      console.error('Error requesting to join project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request to join project',
        error: error.message
      });
    }
  },

  getJoinRequests: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          pjr.request_id,
          pjr.user_id,
          pjr.request_date,
          pjr.status,
          u.firstname,
          u.lastname,
          u.email,
          u.username
        FROM project_join_requests pjr
        LEFT join hots.user u ON pjr.user_id = u.user_id
        WHERE pjr.project_id = ?
      `;
      const [requests] = await dbPMS.promise().execute(query, [id]);

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Join requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting join requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve join requests',
        error: error.message
      });
    }
  },

  approveJoinRequest: async (req, res) => {
    try {
      const { requestId } = req.params;

      // Get the join request details
      const requestQuery = 'SELECT project_id, user_id FROM project_join_requests WHERE request_id = ?';
      const [request] = await dbPMS.promise().execute(requestQuery, [requestId]);

      if (!request.length) {
        return res.status(404).json({
          success: false,
          message: 'Join request not found'
        });
      }

      const { project_id, user_id } = request[0];

      // Add the user to the project members
      const addMemberQuery = 'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)';
      await dbPMS.promise().execute(addMemberQuery, [project_id, user_id, 'member']);

      // Update the join request status to 'approved'
      const updateRequestQuery = 'UPDATE project_join_requests SET status = ? WHERE request_id = ?';
      await dbPMS.promise().execute(updateRequestQuery, ['approved', requestId]);

      res.status(200).json({
        success: true,
        message: 'Join request approved successfully'
      });
    } catch (error) {
      console.error('Error approving join request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve join request',
        error: error.message
      });
    }
  },

  rejectJoinRequest: async (req, res) => {
    try {
      const { requestId } = req.params;

      // Update the join request status to 'rejected'
      const query = 'UPDATE project_join_requests SET status = ? WHERE request_id = ?';
      await dbPMS.promise().execute(query, ['rejected', requestId]);

      res.status(200).json({
        success: true,
        message: 'Join request rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting join request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject join request',
        error: error.message
      });
    }
  }
};
