
const { dbPMS } = require('../../config/db');
let yellowTerminal = "\x1b[33m";

module.exports = {
  getAllTeams: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

    try {
      const { department_id } = req.query;

      let query = `
        SELECT 
        t.*,
        d.department_name,
        (
          SELECT CONCAT(u2.firstname, ' ', u2.lastname)
          FROM hots.m_team_member tm2
          JOIN hots.user u2 ON tm2.user_id = u2.user_id
          WHERE tm2.team_id = t.team_id AND tm2.team_leader = 1
          LIMIT 1
        ) AS team_leader_name,
        COUNT(DISTINCT tm.user_id) AS member_count
      FROM hots.m_team t
      LEFT JOIN hots.m_department d ON t.department_id = d.department_id
      LEFT JOIN hots.m_team_member tm ON t.team_id = tm.team_id
      WHERE 1 = 1
      `;
      const params = [];

      if (department_id) {
        query += ' AND t.department_id = ?';
        params.push(department_id);
      }

      query += ` 
        GROUP BY t.team_id
        ORDER BY d.department_name, t.team_name ASC
      `;

      const [teams] = await dbPMS.promise().execute(query, params);

      console.log(timestamp + 'Teams fetched successfully');
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

      const [teams] = await dbPMS.promise().execute(`
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
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      // Get team members
      const [members] = await dbPMS.promise().execute(`
        SELECT 
          user_id, uid, firstname, lastname, email, role_id, jobtitle_id, active
        FROM hots.user
        WHERE team_id = ?
        ORDER BY lastname, firstname
      `, [id]);

      const team = teams[0];
      team.members = members;

      console.log(timestamp + 'Team detail fetched:', id);
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

      const [result] = await dbPMS.promise().execute(`
        INSERT INTO hots.m_team 
        (team_id, team_name, description, department_id, created_date, updated_date)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        data.team_id,
        data.team_name,
        data.description,
        data.department_id
      ]);

      const [newTeam] = await dbPMS.promise().execute(
        'SELECT * FROM t_team WHERE team_id = ?',
        [data.team_id]
      );

      console.log(timestamp + 'Team created:', data.team_name);
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

      await dbPMS.promise().execute(`
        UPDATE hots.m_team 
        SET team_name = ?, description = ?, department_id = ?, 
           updated_date = NOW()
        WHERE team_id = ?
      `, [
        data.team_name,
        data.description,
        data.department_id,
        id
      ]);

      const [updatedTeam] = await dbPMS.promise().execute(
        'SELECT * FROM t_team WHERE team_id = ?',
        [id]
      );

      console.log(timestamp + 'Team updated:', id);
      res.status(200).json({ success: true, data: updatedTeam[0] });
    } catch (error) {
      console.error(timestamp + 'Error updating team:', error);
      res.status(500).json({ success: false, error: 'Failed to update team' });
    }
  }
};
