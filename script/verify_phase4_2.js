/**
 * Verification Script for Phase 4.2 (Rule Engine)
 * 
 * Objectives:
 * 1. Create a Campaign and Pool with Rules (min_spend, receipt_required)
 * 2. Test RuleExecutor with various contexts
 * 3. Verify validation failures and successes
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbHots, dbQueryHots } = require('../config/db');
const RuleExecutor = require('../service/ruleExecutor');
const { createPool } = require('../service/eventEngineService'); // We might need to expose this or insert manually

async function verifyPhase4_2() {
    console.log("Starting Phase 4.2 Verification...");
    const connection = await dbHots.promise().getConnection();

    try {
        // 1. Setup Data
        // Create a test campaign
        const slug = `test-rules-${Date.now()}`;
        await dbQueryHots("INSERT INTO EVENT_t_campaign (slug, name, status, ticket_id) VALUES (?, ?, 'active', ?)", [slug, "Rule Test Campaign", "TEST-TICKET"]);

        // Create a pool with rules
        const rulesCheck = [
            { type: "min_spend", value: 500 },
            { type: "receipt_required", value: true }
        ];

        const poolConfig = {
            rules: rulesCheck,
            valid_from: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            valid_until: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        };

        const result = await dbQueryHots(
            `INSERT INTO EVENT_m_pool (campaign_id, name, type, config) 
             VALUES ((SELECT campaign_id FROM EVENT_t_campaign WHERE slug = ?), ?, ?, ?)`,
            [slug, "Rule Test Pool", "VOUCHER", JSON.stringify(poolConfig)]
        );
        const poolId = result.insertId;

        // Insert items
        await dbQueryHots("INSERT INTO EVENT_m_pool_item (pool_id, value) VALUES (?, ?), (?, ?)", [poolId, "ITEM-1", poolId, "ITEM-2"]);

        console.log(`[Setup] Created Pool ${poolId} with rules:`, JSON.stringify(rulesCheck));

        // 2. Test Cases

        // Case A: No Submission Context (Admin Draw) -> Should Pass (as Rules check requires submission context)
        // Wait, if rules exist, should admin draw pass? Current logic says "if (context.submission && ...)"
        // So validation should pass for Admin (who doesn't afford submission context).
        console.log("\n[Test A] Admin Draw (No Submission Context)");
        const resA = await RuleExecutor.validateDraw(poolId, { count: 1, userId: 1 });
        console.log("Result:", resA.valid ? "PASS" : "FAIL", resA.error || "");
        if (!resA.valid) throw new Error("Admin draw should pass default rules checks");

        // Case B: Submission with Insufficient Spend
        console.log("\n[Test B] Submission (Spend 100 < 500)");
        const subB = { extra_data: JSON.stringify({ amount: 100 }), receipt_codes: "REC123" };
        const resB = await RuleExecutor.validateDraw(poolId, { submission: subB });
        console.log("Result:", resB.valid ? "PASS" : "FAIL", resB.error || "");
        if (resB.valid || resB.error !== "RULE_MIN_SPEND_NOT_MET") throw new Error("Should fail for min_spend");

        // Case C: Submission with No Receipt
        console.log("\n[Test C] Submission (Spend 600, No Receipt)");
        const subC = { extra_data: JSON.stringify({ amount: 600 }), receipt_codes: "" }; // Empty string is falsy
        const resC = await RuleExecutor.validateDraw(poolId, { submission: subC });
        console.log("Result:", resC.valid ? "PASS" : "FAIL", resC.error || "");
        if (resC.valid || resC.error !== "RULE_RECEIPT_REQUIRED") throw new Error("Should fail for receipt_required");

        // Case D: Valid Submission
        console.log("\n[Test D] Valid Submission (Spend 600, Has Receipt)");
        const subD = { extra_data: JSON.stringify({ amount: 600 }), receipt_codes: "REC123" };
        const resD = await RuleExecutor.validateDraw(poolId, { submission: subD });
        console.log("Result:", resD.valid ? "PASS" : "FAIL", resD.error || "");
        if (!resD.valid) throw new Error("Should pass for valid submission");

        console.log("\n[SUCCESS] All RuleExecutor tests passed.");

    } catch (e) {
        console.error("[FAILED] Verification failed:", e);
        process.exit(1);
    } finally {
        await connection.end(); // Use end() or release() depending on pool/connection
        // dbHots is likely a pool, so we usually don't close it in app, but for script we might need to exit.
        process.exit(0);
    }
}

verifyPhase4_2();
