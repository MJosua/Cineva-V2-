require('dotenv').config();
const { dbHots } = require('../config/db');

async function patchMigration() {
    console.log("Starting patch migration for company_id on t_ticket_work_data...");
    const connection = await dbHots.promise().getConnection();

    try {
        await connection.query("START TRANSACTION");

        console.log("1. Adding company_id to t_ticket_work_data...");
        try {
            await connection.query(
                "ALTER TABLE t_ticket_work_data " +
                "ADD COLUMN company_id INT NOT NULL DEFAULT 1;"
            );
            console.log("-> Added 'company_id'");
        } catch (e) {
            console.log("-> Column might already exist:", e.message);
        }

        console.log("2. Backfilling company_id from t_ticket...");
        const [updateRes] = await connection.query(
            "UPDATE t_ticket_work_data twd " +
            "JOIN t_ticket t ON twd.ticket_id = t.ticket_id " +
            "SET twd.company_id = IFNULL(t.company_id, 1);"
        );
        console.log(`-> Updated ${updateRes.affectedRows} rows`);

        console.log("3. Creating multi-tenant indices on t_ticket_work_data...");
        try {
            await connection.query("DROP INDEX idx_master_timeline ON t_ticket_work_data;");
        } catch (e) { }
        try {
            await connection.query(
                "CREATE INDEX idx_master_timeline " +
                "ON t_ticket_work_data (root_ticket_id, company_id, is_latest, is_hidden, created_at DESC);"
            );
            console.log("-> Created 'idx_master_timeline'");
        } catch (e) { console.log("-> Failed:", e.message); }

        try {
            await connection.query("DROP INDEX idx_ticket_timeline ON t_ticket_work_data;");
        } catch (e) { }
        try {
            await connection.query(
                "CREATE INDEX idx_ticket_timeline " +
                "ON t_ticket_work_data (ticket_id, company_id, is_latest, created_at DESC);"
            );
            console.log("-> Created 'idx_ticket_timeline'");
        } catch (e) { console.log("-> Failed:", e.message); }

        await connection.query("COMMIT");
        console.log("Patch migration completed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
        await connection.query("ROLLBACK");
    } finally {
        connection.release();
        process.exit();
    }
}

patchMigration();
