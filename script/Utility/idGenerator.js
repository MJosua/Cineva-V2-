/**
 * ID Generator Utilities
 * 
 * Centralized ID generation functions extracted from hotsTicket.js.
 * These generate unique ticket IDs based on date, user, and service.
 * 
 * @module idGenerator
 */

/**
 * Generate a legacy ticket ID.
 * Format: YYYYMMDD + user_id + service_id (2 digits) + row_number
 * 
 * @param {number} user_id - The user creating the ticket
 * @param {number} service_id - The service type
 * @param {number} row_number - The count of existing tickets for this user/service
 * @returns {number} The generated ticket ID as an integer
 * 
 * @example
 * // For user 1001, service 7, with 5 existing tickets on 2025-12-30:
 * generateID(1001, 7, 5); // Returns 20251230100107006
 */
const generateID = (user_id, service_id, row_number) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    // Ensure service_id is a two-digit string
    const formattedServiceID = String(service_id).padStart(2, '0');

    return parseInt(`${year}${month}${day}${user_id}${formattedServiceID}${row_number + 1}`);
};

/**
 * Generate a custom ticket ID with running number.
 * Format: YY + service_id (2 digits) + user_id (4 digits) + running (4 digits)
 * 
 * This function queries the database to find the last used ticket ID
 * and increments the running number.
 * 
 * @param {object} db - The database connection (must support .promise().query())
 * @param {number} service_id - The service type
 * @param {number} user_id - The user creating the ticket
 * @returns {Promise<string>} The generated ticket ID as a string
 * 
 * @example
 * // For user 1001, service 7, first ticket of 2025:
 * await generateCustomTicketID(dbHots, 7, 1001); // Returns "2507100010001"
 */
async function generateCustomTicketID(db, service_id, user_id) {
    const year = new Date().getFullYear().toString().slice(-2);
    const service = String(service_id).padStart(2, "0");
    const user = String(user_id).padStart(4, "0");

    // Check last used ticket for this pattern
    const [rows] = await db.promise().query(
        `SELECT ticket_id 
         FROM t_ticket 
         WHERE ticket_id LIKE ? 
         ORDER BY ticket_id DESC 
         LIMIT 1`,
        [`${year}${service}${user}%`]
    );

    let running = "0001";
    if (rows.length > 0) {
        const last = rows[0].ticket_id.toString();
        const lastRun = parseInt(last.slice(-4)) || 0;
        running = String(lastRun + 1).padStart(4, "0");
    }

    return `${year}${service}${user}${running}`;
}

module.exports = {
    generateID,
    generateCustomTicketID,
};
