require('dotenv').config();
const { dbQuery } = require('../config/db');

async function migrate() {
    try {
        console.log("🚀 Starting migration for iod.trs_realization_searates...");

        // 1. Rename Columns
        console.log("📦 Renaming columns...");
        await dbQuery(`ALTER TABLE iod.trs_realization_searates CHANGE COLUMN cont_id number varchar(100) NOT NULL`);
        await dbQuery(`ALTER TABLE iod.trs_realization_searates CHANGE COLUMN number_type type varchar(10)`);
        console.log("✅ Columns renamed.");

        // 2. Drop existing trigger
        console.log("🗑️ Dropping existing trigger...");
        await dbQuery(`DROP TRIGGER IF EXISTS iod.after_realization_insert`);
        console.log("✅ Trigger dropped.");

        // 3. Create updated trigger
        console.log("🛠️ Creating updated trigger with invoice_id support...");
        const triggerSQL = `
            CREATE TRIGGER iod.after_realization_insert AFTER INSERT ON iod.trs_realization FOR EACH ROW 
            BEGIN
                DECLARE v_scac varchar(50);
                
                -- select scac from shipping line by value ship line realization
                SELECT msl.scac INTO v_scac 
                FROM sea_rates.m_shipping_line msl 
                WHERE msl.i2i_shipline LIKE CONCAT('%', NEW.ship_line, '%') COLLATE utf8mb4_0900_ai_ci LIMIT 1;
                
                -- Insert a new record into the trs_realization_searates table.
                -- Now including invoice_id and using updated column names (number)
                INSERT INTO iod.trs_realization_searates(number, so_id, invoice_id, scac)
                VALUES (NEW.cont_id, NEW.so_id, NEW.invoice_id, v_scac)
                ON DUPLICATE KEY UPDATE
                    invoice_id = VALUES(invoice_id),
                    scac = VALUES(scac);
                
                UPDATE iod.m_order mo 
                INNER JOIN iod.trs_sales_order tso ON tso.e_order = mo.order_id  
                SET mo.status = 3 
                WHERE tso.so_id = NEW.so_id;
            END
        `;
        await dbQuery(triggerSQL);
        console.log("✅ Trigger recreated.");

        console.log("🏁 Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
