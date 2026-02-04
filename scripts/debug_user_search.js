const { dbQueryHots } = require('../config/db');

async function debugSearch() {
    const query = 'rangga';
    console.log(`Searching for '${query}'...`);

    try {
        // 1. Check without filters to see if user exists at all
        const allUsers = await dbQueryHots(
            `SELECT * FROM user WHERE firstname LIKE ? OR lastname LIKE ? LIMIT 5`,
            [`%${query}%`, `%${query}%`]
        );
        console.log("Raw Match (Firstname/Lastname):", allUsers.length);
        if (allUsers.length > 0) {
            console.log("Sample:", {
                id: allUsers[0].user_id,
                first: allUsers[0].firstname,
                last: allUsers[0].lastname,
                active: allUsers[0].active,
                email: allUsers[0].email,
                uid: allUsers[0].uid
            });
        }

        // 2. Run the exact API query
        const sql = `
            SELECT user_id, firstname, lastname, email, uid, role_id
            FROM user
            WHERE (firstname LIKE ? OR lastname LIKE ? OR uid LIKE ? OR email LIKE ?)
              AND active = 1
            LIMIT 10
        `;
        const search = `%${query}%`;
        const results = await dbQueryHots(sql, [search, search, search, search]);
        console.log("API Query Results:", results.length);
        console.log(results);

    } catch (e) {
        console.error("Query Error:", e);
    }
    process.exit(0);
}

debugSearch();
