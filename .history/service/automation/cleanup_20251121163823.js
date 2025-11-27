const cron = require('node-cron');
const fs = require('fs/promises');
const { dbHots } = require('../../config/db'); // Ensure this is correct
const chalk = require('chalk');

// Setup daily cleanup at 2 AM
module.exports = {
    cleanupOrphan: async () => {

        cron.schedule('0 2 * * 5', async () => {
            const now = new Date();
            const timestamp = chalk.yellow(`${now.toLocaleDateString('id')} ${now.toLocaleTimeString('id')} :`);

            console.log(timestamp, "Starting temp upload cleanup...");

            try {
                // Get unused files older than 24 hours
                const [files] = await dbHots.promise().query(`
                    SELECT upload_id, file_path 
                    FROM t_temp_upload 
                    WHERE is_used = FALSE 
                    AND upload_date < DATE_SUB(NOW(), INTERVAL 24 HOUR)
                    `);

                if (files.length === 0) {
                    console.log(timestamp, "No orphan files found for cleanup.");
                    return;
                }

                let deletedCount = 0;

                for (const file of files) {
                    try {
                        await fs.unlink(file.file_path); // Delete file
                        deletedCount++;

                        await dbHots.promise().query(`DELETE FROM t_temp_upload WHERE upload_id = ?`, [file.upload_id]); // Delete DB record
                    } catch (err) {
                        console.error(timestamp, `Error deleting file or DB record for upload_id ${file.upload_id}:`, err.message);
                    }
                }

                console.log(timestamp, `Cleanup completed. Deleted ${deletedCount} of ${files.length} orphan files.`);
            } catch (err) {
                console.error(timestamp, "CLEANUP FAILED:", err.message);
            }
        });
    },
    

}