const { dbHots } = require("../config/db");

async function testTransaction() {
    const connection = await dbHots.promise().getConnection();
    try {
        console.log("Starting test transaction...");
        await connection.beginTransaction();

        // Test update on non-existent user
        const [result] = await connection.query(`
            UPDATE hots.user SET firstname = 'Test' WHERE user_id = 999999
        `);

        console.log("Affected rows:", result.affectedRows);
        if (result.affectedRows === 0) {
            console.warn("Expected behavior: User not found (affectedRows = 0)");
        }

        await connection.commit();
        console.log("Transaction committed successfully.");
    } catch (err) {
        await connection.rollback();
        console.error("Transaction rolled back due to error:", err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

testTransaction();
