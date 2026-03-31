const { dbHots } = require("../../../../config/db");

let yellowTerminal = "\x1b[33m";

module.exports = {
  getDepartmentsPublic: async (req, res) => {
    let date = new Date();
    let timestamp =
      yellowTerminal +
      date.toLocaleDateString("id") +
      " " +
      date.toLocaleTimeString("id") +
      " : ";

    try {
      const [departments] = await dbHots.promise().execute(`
        SELECT 
          department_id AS id,
          department_name AS name
        FROM hots.m_company_department
        WHERE finished_date is null
        ORDER BY department_name ASC
      `);

      console.log(timestamp + "Public departments fetched successfully");
      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error) {
      console.error(timestamp + "Error fetching public departments:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch departments" });
    }
  },
};
