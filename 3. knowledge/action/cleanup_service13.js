
const { dbHots } = require('../config/db');

async function cleanupService13() {
    try {
        console.log("🔍 Fetching Service 13...");
        const [rows] = await dbHots.promise().query('SELECT id, service_name, form_json FROM m_service WHERE id = 13');

        if (rows.length === 0) {
            console.log("❌ Service 13 not found!");
            return;
        }

        const service = rows[0];
        let formConfig = service.form_json;

        // Parse if it's a string
        if (typeof formConfig === 'string') {
            try {
                formConfig = JSON.parse(formConfig);
            } catch (e) {
                console.error("❌ Failed to parse form_json:", e);
                return;
            }
        }

        console.log("📄 Current Rules Count:", formConfig.rules ? formConfig.rules.length : 0);

        if (!formConfig.rules) {
            console.log("✅ No rules found to clean.");
            return;
        }

        // Filter out rules related to date hiding or calculation
        const cleanRules = formConfig.rules.filter(rule => {
            // Logic to identify bad rules:
            // 1. conditions that check 'date' or 'start_time' and action 'hide'
            // 2. legacy calculations
            const ruleStr = JSON.stringify(rule).toLowerCase();

            // Check if it targets the date field for hiding
            if (rule.actions && rule.actions.some(a => a.target === 'date' && (a.type === 'hide' || a.type === 'disable'))) {
                console.log("🗑️ Removing Rule (Hide/Disable Date):", JSON.stringify(rule));
                return false;
            }

            // Check for specific legacy date calculation description if known?
            // Or just broad "date" + "calculation" check

            return true;
        });

        if (cleanRules.length === formConfig.rules.length) {
            console.log("✅ No matching rules found to remove.");
        } else {
            console.log(`♻️  Removing ${formConfig.rules.length - cleanRules.length} rules.`);
            formConfig.rules = cleanRules;

            // Update DB
            const updatedJson = JSON.stringify(formConfig);
            await dbHots.promise().query('UPDATE m_service SET form_json = ? WHERE id = 13', [updatedJson]);
            console.log("💾 Database updated successfully.");
        }

        // Also check "fields" if defined in JSON (legacy) or m_hots_form_fields
        // But task said form_json rules.

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

cleanupService13();
