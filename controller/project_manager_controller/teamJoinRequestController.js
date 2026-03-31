
const { dbPMS, dbHots } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  createJoinRequest: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { team_id, message } = req.body;
      const user_id = req.dataToken.user_id; // From token middleware

      console.log(timestamp + 'Creating team join request:', { team_id, user_id, message });

      // Check if request already exists
      const [existingRequest] = await dbPMS.promise().execute(`
        SELECT * FROM pm.t_team_join_requests 
        WHERE team_id = ? AND user_id = ? AND status = 'waiting'
      `, [team_id, user_id]);

      if (existingRequest.length > 0) {
        console.log(timestamp + 'Join request already exists for user:', user_id, 'team:', team_id);
        return res.status(400).json({
          success: false,
          error: 'You already have a pending request for this team'
        });
      }

      // Create join request
      const [result] = await dbPMS.promise().execute(`
        INSERT INTO pm.t_team_join_requests 
        (team_id, user_id, message, status, requested_date, created_date, updated_date)
        VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
      `, [team_id, user_id, message || '']);

      const requestId = result.insertId;

      // Get the created request with team and user details
      const [newRequest] = await dbPMS.promise().execute(`
        SELECT 
          tjr.*,
          ht.team_name,
          hd.department_name,
          hu.firstname,
          hu.lastname,
          hu.email
        FROM pm.t_team_join_requests tjr
        JOIN hots.m_company_team ht ON tjr.team_id = ht.team_id
        JOIN hots.m_company_department hd ON ht.department_id = hd.department_id
        JOIN hots.user hu ON tjr.user_id = hu.user_id
        WHERE tjr.request_id = ?
      `, [requestId]);

      console.log(timestamp + 'Team join request created successfully:', requestId);
      res.status(200).json({ success: true, data: newRequest[0] });
    } catch (error) {
      console.error(timestamp + 'Error creating team join request:', error);
      res.status(500).json({ success: false, error: 'Failed to create join request' });
    }
  },

  getJoinRequests: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { team_id, status } = req.query;
      console.log(timestamp + 'Fetching team join requests with filters:', { team_id, status });

      let query = `
        SELECT 
          tjr.*,
          ht.team_name,
          hd.department_name,
          hu.firstname as user_firstname,
          hu.lastname as user_lastname,
          hu.email as user_email,
          CONCAT(hu.firstname, ' ', hu.lastname) as user_name,
          hr.firstname as reviewer_firstname,
          hr.lastname as reviewer_lastname,
          CONCAT(hr.firstname, ' ', hr.lastname) as reviewer_name
        FROM pm.t_team_join_requests tjr
        JOIN hots.m_company_team ht ON tjr.team_id = ht.team_id
        JOIN hots.m_company_department hd ON ht.department_id = hd.department_id
        JOIN hots.user hu ON tjr.user_id = hu.user_id
        LEFT JOIN hots.user hr ON tjr.reviewed_by = hr.user_id
        WHERE 1 = 1
      `;
      const params = [];

      if (team_id) {
        query += ' AND tjr.team_id = ?';
        params.push(team_id);
      }

      if (status) {
        query += ' AND tjr.status = ?';
        params.push(status);
      }

      query += ' ORDER BY tjr.requested_date DESC';

      console.log(timestamp + 'Executing query:', query);
      const [requests] = await dbPMS.promise().execute(query, params);

      console.log(timestamp + `Found ${requests.length} team join requests`);
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      console.error(timestamp + 'Error fetching team join requests:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch join requests' });
    }
  },

  updateJoinRequest: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { requestId } = req.params;
      const { status, response_message } = req.body;
      const reviewed_by = req.dataToken.user_id; // From token middleware

      console.log(timestamp + 'Updating join request:', { requestId, status, reviewed_by });

      // Get the request details before updating
      const [request] = await dbPMS.promise().execute(`
        SELECT * FROM pm.t_team_join_requests WHERE request_id = ?
      `, [requestId]);

      if (request.length === 0) {
        console.log(timestamp + 'Join request not found:', requestId);
        return res.status(404).json({ success: false, error: 'Join request not found' });
      }

      // Update the request
      await dbPMS.promise().execute(`
        UPDATE pm.t_team_join_requests 
        SET status = ?, response_message = ?, reviewed_by = ?, reviewed_date = NOW(), updated_date = NOW()
        WHERE request_id = ?
      `, [status, response_message || '', reviewed_by, requestId]);

      // If approved, add user to team
      if (status === 'approved') {
        const teamId = request[0].team_id;
        const userId = request[0].user_id;

        // Check if user is already a team member
        const [existingMember] = await dbHots.promise().execute(`
          SELECT * FROM hots.m_company_team_member WHERE team_id = ? AND user_id = ?
        `, [teamId, userId]);

        if (existingMember.length === 0) {
          await dbHots.promise().execute(`
            INSERT INTO hots.m_company_team_member 
            (team_id, user_id, team_leader, member_desc, creation_date, updated_date, finished_marker)
            VALUES (?, ?, 0, 'Joined via request', NOW(), NOW(), 0)
          `, [teamId, userId]);

          console.log(timestamp + `Added user ${userId} to team ${teamId} via approved request`);
        } else {
          console.log(timestamp + `User ${userId} is already a member of team ${teamId}`);
        }
      }

      // Get updated request with details
      const [updatedRequest] = await dbPMS.promise().execute(`
        SELECT 
          tjr.*,
          ht.team_name,
          hd.department_name,
          hu.firstname as user_firstname,
          hu.lastname as user_lastname,
          hu.email as user_email,
          CONCAT(hu.firstname, ' ', hu.lastname) as user_name,
          hr.firstname as reviewer_firstname,
          hr.lastname as reviewer_lastname,
          CONCAT(hr.firstname, ' ', hr.lastname) as reviewer_name
        FROM pm.t_team_join_requests tjr
        JOIN hots.m_company_team ht ON tjr.team_id = ht.team_id
        JOIN hots.m_company_department hd ON ht.department_id = hd.department_id
        JOIN hots.user hu ON tjr.user_id = hu.user_id
        LEFT JOIN hots.user hr ON tjr.reviewed_by = hr.user_id
        WHERE tjr.request_id = ?
      `, [requestId]);

      console.log(timestamp + 'Join request updated successfully:', requestId, 'status:', status);
      res.status(200).json({ success: true, data: updatedRequest[0] });
    } catch (error) {
      console.error(timestamp + 'Error updating team join request:', error);
      res.status(500).json({ success: false, error: 'Failed to update join request' });
    }
  },

  getUserJoinRequests: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const user_id = req.dataToken.user_id; // From token middleware
      console.log(timestamp + 'Fetching join requests for user:', user_id);

      const [requests] = await dbPMS.promise().execute(`
        SELECT 
          tjr.*,
          ht.team_name,
          hd.department_name,
          hr.firstname as reviewer_firstname,
          hr.lastname as reviewer_lastname,
          CONCAT(hr.firstname, ' ', hr.lastname) as reviewer_name
        FROM pm.t_team_join_requests tjr
        JOIN hots.m_company_team ht ON tjr.team_id = ht.team_id
        JOIN hots.m_company_department hd ON ht.department_id = hd.department_id
        LEFT JOIN hots.user hr ON tjr.reviewed_by = hr.user_id
        WHERE tjr.user_id = ?
        ORDER BY tjr.requested_date DESC
      `, [user_id]);

      console.log(timestamp + `Found ${requests.length} join requests for user ${user_id}`);
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      console.error(timestamp + 'Error fetching user join requests:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user join requests' });
    }
  }
};
