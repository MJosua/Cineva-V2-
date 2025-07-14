
const { dbHots, dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getAllTeams: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { department_id } = req.params;
      console.log(timestamp + 'Fetching teams with department_id:', department_id);

      let query = `
        SELECT 
          t.*,
          d.department_name,
          (
            SELECT CONCAT(u.firstname, ' ', u.lastname)
            FROM hots.m_team_member tm
            JOIN hots.user u ON tm.user_id = u.user_id
            WHERE tm.team_id = t.team_id AND tm.team_leader = 1
            LIMIT 1
          ) AS team_leader_name,
          COUNT(DISTINCT tm2.user_id) AS member_count
        FROM hots.m_team t
        LEFT JOIN hots.m_department d ON t.department_id = d.department_id
        LEFT JOIN hots.m_team_member tm2 ON t.team_id = tm2.team_id
        WHERE 1 = 1
      `;
      const params = [];

      if (department_id) {
        query += ' AND t.department_id = ?';
        params.push(department_id);
      }

      query += ` 
        GROUP BY t.team_id, t.team_name, t.department_id, t.description, t.created_date, t.updated_date, d.department_name
        ORDER BY d.department_name, t.team_name ASC
      `;

      console.log(timestamp + 'Executing query:', query);
      console.log(timestamp + 'Query params:', params);

      const [teams] = await dbHots.promise().execute(query, params);

      // Get members for each team
      for (let team of teams) {
        const [members] = await dbHots.promise().execute(`
          SELECT 
            tm.member_id,
            tm.user_id,
            tm.team_leader,
            tm.member_desc,
            tm.creation_date,
            tm.finished_date,
            tm.updated_date,
            tm.finished_marker,
            u.firstname,
            u.lastname,
            u.email,
            u.role_id
          FROM hots.m_team_member tm
          JOIN hots.user u ON tm.user_id = u.user_id
          WHERE tm.team_id = ?
          ORDER BY tm.team_leader DESC, u.lastname, u.firstname
        `, [team.team_id]);
        
        team.members = members;
        console.log(timestamp + `Found ${members.length} members for team ${team.team_name}`);
      }

      console.log(timestamp + `Teams fetched successfully: ${teams.length} teams found`);
      res.status(200).json({
        success: true,
        data: teams
      });
    } catch (error) {
      console.error(timestamp + 'Error fetching teams:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch teams' });
    }
  },

  getTeamDetail: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { id } = req.params;
      console.log(timestamp + 'Fetching team detail for ID:', id);

      const [teams] = await dbHots.promise().execute(`
        SELECT 
          t.*,
          d.department_name,
          (
            SELECT CONCAT(u.firstname, ' ', u.lastname)
            FROM hots.m_team_member tm
            JOIN hots.user u ON tm.user_id = u.user_id
            WHERE tm.team_id = t.team_id AND tm.team_leader = 1
            LIMIT 1
          ) AS team_leader_name
        FROM hots.m_team t
        LEFT JOIN hots.m_department d ON t.department_id = d.department_id
        WHERE t.team_id = ?
      `, [id]);

      if (teams.length === 0) {
        console.log(timestamp + 'Team not found for ID:', id);
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      // Get team members
      const [members] = await dbHots.promise().execute(`
        SELECT 
          tm.member_id,
          tm.user_id,
          tm.team_leader,
          tm.member_desc,
          tm.creation_date,
          tm.finished_date,
          tm.updated_date,
          tm.finished_marker,
          u.firstname,
          u.lastname,
          u.email,
          u.role_id,
          r.role_name
        FROM hots.m_team_member tm
        JOIN hots.user u ON tm.user_id = u.user_id
        LEFT JOIN hots.m_role r ON u.role_id = r.role_id
        WHERE tm.team_id = ?
        ORDER BY tm.team_leader DESC, u.lastname, u.firstname
      `, [id]);

      const team = teams[0];
      team.members = members;

      console.log(timestamp + `Team detail fetched: ${team.team_name} with ${members.length} members`);
      res.status(200).json({ success: true, data: team });
    } catch (error) {
      console.error(timestamp + 'Error fetching team detail:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch team detail' });
    }
  },

  createTeam: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const data = req.body;
      console.log(timestamp + 'Creating team with data:', data);

      const [result] = await dbHots.promise().execute(`
        INSERT INTO hots.m_team 
        (team_name, description, department_id, created_date, updated_date)
        VALUES (?, ?, ?, NOW(), NOW())
      `, [
        data.team_name,
        data.description || '',
        data.department_id
      ]);

      const teamId = result.insertId;
      console.log(timestamp + 'Team created with ID:', teamId);

      // Add team members if provided
      if (data.selectedUsers && Array.isArray(data.selectedUsers)) {
        for (let userId of data.selectedUsers) {
          const isLeader = data.team_leader_id === userId ? 1 : 0;
          await dbHots.promise().execute(`
            INSERT INTO hots.m_team_member 
            (team_id, user_id, team_leader, member_desc, creation_date, updated_date, finished_marker)
            VALUES (?, ?, ?, ?, NOW(), NOW(), 0)
          `, [teamId, userId, isLeader, 'Team member']);
          
          console.log(timestamp + `Added user ${userId} to team ${teamId} as ${isLeader ? 'leader' : 'member'}`);
        }
      }

      const [newTeam] = await dbHots.promise().execute(
        'SELECT * FROM hots.m_team WHERE team_id = ?',
        [teamId]
      );

      console.log(timestamp + 'Team created successfully:', data.team_name);
      res.status(200).json({ success: true, data: newTeam[0] });
    } catch (error) {
      console.error(timestamp + 'Error creating team:', error);
      res.status(500).json({ success: false, error: 'Failed to create team' });
    }
  },

  updateTeam: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { id } = req.params;
      const data = req.body;
      console.log(timestamp + 'Updating team ID:', id, 'with data:', data);

      await dbHots.promise().execute(`
        UPDATE hots.m_team 
        SET team_name = ?, description = ?, department_id = ?, 
           updated_date = NOW()
        WHERE team_id = ?
      `, [
        data.team_name,
        data.description || '',
        data.department_id,
        id
      ]);

      // Update team members if provided
      if (data.selectedUsers && Array.isArray(data.selectedUsers)) {
        // Remove existing members
        await dbHots.promise().execute(
          'DELETE FROM hots.m_team_member WHERE team_id = ?',
          [id]
        );

        // Add new members
        for (let userId of data.selectedUsers) {
          const isLeader = data.team_leader_id === userId ? 1 : 0;
          await dbHots.promise().execute(`
            INSERT INTO hots.m_team_member 
            (team_id, user_id, team_leader, member_desc, creation_date, updated_date, finished_marker)
            VALUES (?, ?, ?, ?, NOW(), NOW(), 0)
          `, [id, userId, isLeader, 'Team member']);
          
          console.log(timestamp + `Updated user ${userId} in team ${id} as ${isLeader ? 'leader' : 'member'}`);
        }
      }

      const [updatedTeam] = await dbHots.promise().execute(
        'SELECT * FROM hots.m_team WHERE team_id = ?',
        [id]
      );

      console.log(timestamp + 'Team updated successfully:', id);
      res.status(200).json({ success: true, data: updatedTeam[0] });
    } catch (error) {
      console.error(timestamp + 'Error updating team:', error);
      res.status(500).json({ success: false, error: 'Failed to update team' });
    }
  },

  deleteTeam: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { id } = req.params;
      console.log(timestamp + 'Deleting team ID:', id);

      // First remove team members
      await dbHots.promise().execute(
        'DELETE FROM hots.m_team_member WHERE team_id = ?',
        [id]
      );

      // Then delete the team
      await dbHots.promise().execute(
        'DELETE FROM hots.m_team WHERE team_id = ?',
        [id]
      );

      console.log(timestamp + 'Team deleted successfully:', id);
      res.status(200).json({ success: true, message: 'Team deleted successfully' });
    } catch (error) {
      console.error(timestamp + 'Error deleting team:', error);
      res.status(500).json({ success: false, error: 'Failed to delete team' });
    }
  }
};
