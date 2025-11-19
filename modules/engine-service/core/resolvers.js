/**
 * HOTS ENGINE WORKFLOW RESOLVERS (EXTENDED VERSION)
 * ------------------------------------------------------------
 * Every resolver returns:
 *
 *   - single user_id  (string/number)
 *   - OR array of user_ids (parallel approval)
 *   - OR null (skip)
 *
 * dbQueryHots is expected to run:
 *   db(sql, [bind])
 */

const db = require("../../../config/db").dbQueryHots;

module.exports = {

  /* ============================================================
     1. DIRECT SUPERIOR (user.superior_id)
     ============================================================ */
  async ["direct superior"](user_id) {
    const rows = await db(`
      SELECT superior_id AS approver
      FROM user
      WHERE user_id = ? AND finished_date IS NULL
    `, [user_id]);
    return rows?.[0]?.approver || null;
  },


  /* ============================================================
     2. FINAL SUPERIOR (user.final_superior_id)
     ============================================================ */
  async ["final superior"](user_id) {
    const rows = await db(`
      SELECT final_superior_id AS approver
      FROM user
      WHERE user_id = ? AND finished_date IS NULL
    `, [user_id]);
    return rows?.[0]?.approver || null;
  },


  /* ============================================================
     3. TEAM LEADER (override or derive creator’s team)
     ============================================================ */
  async ["team leader"](user_id, params = {}) {

    console.log("🔍 TEAM LEADER → params:", params);

    // explicit override: team_id
    if (params.team_id) {
      const rows = await db(`
        SELECT user_id AS approver
        FROM m_team_member
        WHERE team_id = ? AND team_leader = 1 AND finished_date IS NULL
      `, [params.team_id]);
      return rows?.[0]?.approver || null;
    }

    // find user's team
    const team = await db(`
      SELECT team_id
      FROM m_team_member
      WHERE user_id = ? AND finished_date IS NULL
    `, [user_id]);

    const teamId = team?.[0]?.team_id;
    if (!teamId) return null;

    const leader = await db(`
      SELECT user_id AS approver
      FROM m_team_member
      WHERE team_id = ? AND team_leader = 1 AND finished_date IS NULL
    `, [teamId]);

    return leader?.[0]?.approver || null;
  },


  /* ============================================================
     4. TEAM MEMBERS (parallel)
     ============================================================ */
  async ["team"](user_id, params = {}) {
    console.log("🔍 TEAM RESOLVER:", { user_id, params });

    let teamId = params.team_id;

    if (!teamId) {
      const rows = await db(`
        SELECT team_id
        FROM m_team_member
        WHERE user_id = ? AND finished_date IS NULL
      `, [user_id]);
      teamId = rows?.[0]?.team_id;
    }

    if (!teamId) return null;

    const members = await db(`
      SELECT user_id AS approver
      FROM m_team_member
      WHERE team_id = ? AND finished_date IS NULL
    `, [teamId]);

    if (!members.length) return null;

    return members.map(m => m.approver);
  },


  /* ============================================================
     5. DEPARTMENT HEAD (override or user department)
     ============================================================ */
  async ["department head"](user_id, params = {}) {
    let deptId = params.department_id;

    if (!deptId) {
      const rows = await db(`
        SELECT department_id
        FROM user
        WHERE user_id = ? AND finished_date IS NULL
      `, [user_id]);
      deptId = rows?.[0]?.department_id;
    }

    if (!deptId) return null;

    const head = await db(`
      SELECT department_head AS approver
      FROM m_department
      WHERE department_id = ? AND finished_date IS NULL
    `, [deptId]);

    return head?.[0]?.approver || null;
  },


  /* ============================================================
     6. DEPARTMENT MEMBERS (parallel)
     ============================================================ */
  async ["department members"](user_id, params = {}) {
    let deptId = params.department_id;

    if (!deptId) {
      const rows = await db(`
        SELECT department_id 
        FROM user 
        WHERE user_id = ? AND finished_date IS NULL
      `, [user_id]);
      deptId = rows?.[0]?.department_id;
    }

    if (!deptId) return null;

    const rows = await db(`
      SELECT user_id AS approver
      FROM user
      WHERE department_id = ? AND finished_date IS NULL
    `, [deptId]);

    return rows.map(r => r.approver);
  },


  /* ============================================================
     7. DIRECT USER OVERRIDE (highest priority)
     ============================================================ */
  async ["direct user"](user_id, params = {}) {
    if (params.user_id) return params.user_id;
    if (params.approver_user) return params.approver_user;
    return user_id; // fallback
  },


  /* ============================================================
     8. ROLE-BASED APPROVER
     ============================================================ */
  async ["role"](user_id, params = {}) {
    if (!params.role_id) return null;

    const rows = await db(`
      SELECT user_id AS approver
      FROM user
      WHERE role_id = ? AND finished_date IS NULL
    `, [params.role_id]);

    if (!rows.length) return null;

    return params.pick === "all"
      ? rows.map(r => r.approver)
      : rows[0].approver;
  },


  /* ============================================================
     9. JOB TITLE
     ============================================================ */
  async ["job title"](user_id, params = {}) {
    if (!params.jobtitle_id) return null;

    const rows = await db(`
      SELECT user_id AS approver
      FROM user
      WHERE jobtitle_id = ? AND finished_date IS NULL
    `, [params.jobtitle_id]);

    return rows.map(r => r.approver);
  },


  /* ============================================================
     10. PLANT HEAD
     ============================================================ */
  async ["plant head"](user_id) {
    const rows = await db(`
      SELECT plant_id
      FROM user
      WHERE user_id = ? AND finished_date IS NULL
    `, [user_id]);

    const plant = rows?.[0]?.plant_id;
    if (!plant) return null;

    const head = await db(`
      SELECT user_id AS approver
      FROM user
      WHERE plant_id = ? AND role_id = 'PLANT_MANAGER' 
        AND finished_date IS NULL
    `, [plant]);

    return head?.[0]?.approver || null;
  },


  /* ============================================================
     11. GRADE-BASED
     ============================================================ */
  async ["grade"](user_id, params = {}) {
    if (!params.grade_id) return null;

    const rows = await db(`
      SELECT user_id AS approver
      FROM user
      WHERE grade_id = ? AND finished_date IS NULL
    `, [params.grade_id]);

    return rows.map(r => r.approver);
  },


  /* ============================================================
     12. LEADER OF SPECIFIC TEAM (NEW)
     ============================================================ */
  async ["leader of team"](user_id, params = {}) {
    let teamId = params.team_id;

    // shortname override
    if (!teamId && params.team_shortname) {
      const r = await db(`
        SELECT team_id
        FROM m_team
        WHERE team_shortname = ? AND finished_date IS NULL
      `, [params.team_shortname]);
      teamId = r?.[0]?.team_id;
    }

    // fallback: user's own team
    if (!teamId) {
      const r = await db(`
        SELECT team_id
        FROM m_team_member
        WHERE user_id = ? AND finished_date IS NULL
      `, [user_id]);
      teamId = r?.[0]?.team_id;
    }

    if (!teamId) return null;

    const rows = await db(`
      SELECT user_id AS approver
      FROM m_team_member
      WHERE team_id = ? AND team_leader = 1 AND finished_date IS NULL
    `, [teamId]);

    return rows?.[0]?.approver || null;
  },


  /* ============================================================
     13. LEADER OF SPECIFIC DEPARTMENT (NEW)
     ============================================================ */
  async ["leader of department"](user_id, params = {}) {
    let deptId = params.department_id;

    if (!deptId && params.department_shortname) {
      const r = await db(`
        SELECT department_id
        FROM m_department
        WHERE department_shortname = ? AND finished_date IS NULL
      `, [params.department_shortname]);
      deptId = r?.[0]?.department_id;
    }

    // fallback: user's own department
    if (!deptId) {
      const r = await db(`
        SELECT department_id
        FROM user
        WHERE user_id = ? AND finished_date IS NULL
      `, [user_id]);
      deptId = r?.[0]?.department_id;
    }

    if (!deptId) return null;

    const head = await db(`
      SELECT department_head AS approver
      FROM m_department
      WHERE department_id = ? AND finished_date IS NULL
    `, [deptId]);

    return head?.[0]?.approver || null;
  },


  /* ============================================================
     14. ASSIGNED (explicit)
     ============================================================ */
  async ["assigned"](user_id, params = {}) {
    if (params.user_id) return params.user_id;

    if (params.user_ids) {
      if (Array.isArray(params.user_ids))
        return params.user_ids.map(String);
      return String(params.user_ids).split(",").map(s => s.trim());
    }

    return null;
  },


  /* ============================================================
     15. CUSTOM SQL
     ============================================================ */
  async ["custom sql"](user_id, params = {}) {
    if (!params.sql) return null;

    const rows = await db(params.sql, params.bind || []);
    if (!rows.length) return null;

    const first = Object.values(rows[0])[0];

    return rows.length === 1
      ? first
      : rows.map(r => Object.values(r)[0]);
  }
};
