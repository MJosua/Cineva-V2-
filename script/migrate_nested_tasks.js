require('dotenv').config();
const { dbHots } = require('../config/db');

async function migrateNestedTasks() {
    console.log("Starting DB Schema Update and Migration for Nested Tasks...");

    // Connect to the database
    const connection = await dbHots.promise().getConnection();

    try {
        console.log("1. Starting transaction...");
        await connection.query("START TRANSACTION");

        console.log("2. Updating t_ticket schema...");

        // Add columns to t_ticket if they don't exist
        try {
            await connection.query(
                "ALTER TABLE t_ticket " +
                "ADD COLUMN root_ticket_id VARCHAR(32) NOT NULL DEFAULT '', " +
                "ADD COLUMN ticket_depth TINYINT NOT NULL DEFAULT 0;"
            );
            console.log("-> Added 'root_ticket_id' and 'ticket_depth' to t_ticket");
        } catch (e) {
            console.log("-> Column might already exist in t_ticket:", e.message);
        }

        // Drop and recreate index if necessary
        try {
            await connection.query("DROP INDEX idx_ticket_hierarchy ON t_ticket;");
        } catch (e) { }

        try {
            await connection.query(
                "CREATE INDEX idx_ticket_hierarchy " +
                "ON t_ticket (root_ticket_id, company_id, parent_ticket_id);"
            );
            console.log("-> Created 'idx_ticket_hierarchy' index on t_ticket");
        } catch (e) {
            console.log("-> Failed to create idx_ticket_hierarchy:", e.message);
        }

        console.log("3. Backfilling data for t_ticket...");
        // Set root_ticket_id to ticket_id for all top-level tickets
        const [updateT1] = await connection.query(
            "UPDATE t_ticket " +
            "SET root_ticket_id = ticket_id, ticket_depth = 0 " +
            "WHERE parent_ticket_id IS NULL OR parent_ticket_id = '';"
        );
        console.log(`-> Updated ${updateT1.affectedRows} top-level tickets`);

        // Iterate for nested tickets (Level 1)
        const [updateT2] = await connection.query(
            "UPDATE t_ticket child " +
            "JOIN t_ticket parent ON child.parent_ticket_id = parent.ticket_id " +
            "SET child.root_ticket_id = IF(parent.root_ticket_id != '', parent.root_ticket_id, parent.ticket_id), " +
            "    child.ticket_depth = 1 " +
            "WHERE child.parent_ticket_id IS NOT NULL AND child.parent_ticket_id != '';"
        );
        console.log(`-> Updated ${updateT2.affectedRows} level-1 nested tickets`);

        // Iterate for nested tickets (Level 2)
        const [updateT3] = await connection.query(
            "UPDATE t_ticket child " +
            "JOIN t_ticket parent ON child.parent_ticket_id = parent.ticket_id " +
            "SET child.root_ticket_id = IF(parent.root_ticket_id != '', parent.root_ticket_id, parent.ticket_id), " +
            "    child.ticket_depth = 2 " +
            "WHERE child.parent_ticket_id IS NOT NULL AND child.parent_ticket_id != '' AND parent.ticket_depth = 1;"
        );
        console.log(`-> Updated ${updateT3.affectedRows} level-2 nested tickets`);


        console.log("4. Updating t_ticket_work_data schema...");
        try {
            await connection.query(
                "ALTER TABLE t_ticket_work_data " +
                "ADD COLUMN root_ticket_id VARCHAR(32) NOT NULL DEFAULT '', " +
                "ADD COLUMN ticket_depth TINYINT NOT NULL DEFAULT 0, " +
                "ADD COLUMN entry_type VARCHAR(32) NOT NULL DEFAULT 'manual_update', " +
                "ADD COLUMN timeline_group_id VARCHAR(64) NOT NULL DEFAULT '', " +
                "ADD COLUMN revision INT NOT NULL DEFAULT 0, " +
                "ADD COLUMN is_latest TINYINT(1) NOT NULL DEFAULT 1, " +
                "ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0, " +
                "ADD COLUMN snapshot_meta_json JSON NULL;"
            );
            console.log("-> Added new columns to t_ticket_work_data");
        } catch (e) {
            console.log("-> Columns might already exist in t_ticket_work_data:", e.message);
        }

        try {
            await connection.query(
                "ALTER TABLE t_ticket_work_data " +
                "MODIFY COLUMN updated_at DATETIME(6) NULL, " +
                "MODIFY COLUMN created_at DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6);"
            );
            console.log("-> Modified timestamps in t_ticket_work_data to DATETIME(6)");
        } catch (e) {
            console.log("-> Failed to modify timestamps:", e.message);
        }

        try {
            await connection.query("DROP INDEX idx_master_timeline ON t_ticket_work_data;");
        } catch (e) { }

        try {
            await connection.query(
                "CREATE INDEX idx_master_timeline " +
                "ON t_ticket_work_data (root_ticket_id, company_id, is_latest, is_hidden, created_at DESC);"
            );
            console.log("-> Created 'idx_master_timeline' on t_ticket_work_data");
        } catch (e) { console.log("-> Failed to create idx_master_timeline:", e.message); }

        try {
            await connection.query("DROP INDEX idx_ticket_timeline ON t_ticket_work_data;");
        } catch (e) { }

        try {
            await connection.query(
                "CREATE INDEX idx_ticket_timeline " +
                "ON t_ticket_work_data (ticket_id, company_id, is_latest, created_at DESC);"
            );
            console.log("-> Created 'idx_ticket_timeline' on t_ticket_work_data");
        } catch (e) { console.log("-> Failed to create idx_ticket_timeline:", e.message); }

        console.log("5. Backfilling data for t_ticket_work_data...");
        const [updateTWD] = await connection.query(
            "UPDATE t_ticket_work_data twd " +
            "JOIN t_ticket t ON twd.ticket_id = t.ticket_id " +
            "SET " +
            "    twd.root_ticket_id = IF(t.root_ticket_id != '', t.root_ticket_id, t.ticket_id), " +
            "    twd.ticket_depth = t.ticket_depth, " +
            "    twd.entry_type = 'manual_update', " +
            "    twd.timeline_group_id = UUID(), " +
            "    twd.revision = 0, " +
            "    twd.is_latest = 1, " +
            "    twd.is_hidden = 0 " +
            "WHERE twd.data_type = 'timeline_update' AND twd.timeline_group_id = '';"
        );
        console.log(`-> Updated ${updateTWD.affectedRows} existing timeline entries`);

        console.log("6. Committing transaction...");
        await connection.query("COMMIT");

        console.log("Migration completed successfully!");

    } catch (error) {
        console.error("Migration failed, rolling back. Error:", error);
        await connection.query("ROLLBACK");
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrateNestedTasks();
