const { dbEOrder } = require("../2. OtherBackend/Searates/config/db");

async function verifyExclusion() {
    console.log("Starting SeaRates Exclusion Verification...");
    
    // Test 1: Check if SO ID 260011801140 is still in the pool
    const problematicSoId = 260011801140;
    
    const [blRows] = await dbEOrder.execute(`
        SELECT r.so_id, r.cont_id, i.bl_no, mc.container_name
        FROM iod.trs_realization r
        LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id AND r.cont_id = i.cont_id
        LEFT JOIN iod.mst_container mc ON r.cont_size = mc.container_id
        WHERE r.so_id = ?
          AND (UPPER(COALESCE(mc.container_name, '')) NOT IN ('TRUCK', '1 TRUCK', 'PLANE', '1 FLIGHT', 'AIR', '1 AIR') OR mc.container_name IS NULL)
          AND (r.cont_id NOT LIKE 'TOLL-%' AND i.bl_no NOT LIKE 'TOLL-%' AND COALESCE(r.book_no, '') NOT LIKE 'TOLL-%')
    `, [problematicSoId]);

    if (blRows.length === 0) {
        console.log(`[SUCCESS] SO ID ${problematicSoId} is correctly EXCLUDED.`);
    } else {
        console.error(`[FAILURE] SO ID ${problematicSoId} is still included!`);
        console.table(blRows);
    }

    // Test 2: Scan for any remaining TOLL- identifiers in the pool
    const [tollRows] = await dbEOrder.execute(`
        SELECT r.so_id, r.cont_id, i.bl_no
        FROM iod.trs_realization r
        LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id AND r.cont_id = i.cont_id
        WHERE (r.cont_id LIKE 'TOLL-%' OR i.bl_no LIKE 'TOLL-%')
          AND r.eta < '9000-01-01'
          AND (r.cont_id NOT LIKE 'TOLL-%' AND COALESCE(i.bl_no, '') NOT LIKE 'TOLL-%') -- This is the filter we added
    `);

    if (tollRows.length === 0) {
        console.log("[SUCCESS] No 'TOLL-' prefixed numbers found in filtered pool.");
    } else {
        console.error("[FAILURE] 'TOLL-' prefixed numbers still found!");
        console.table(tollRows.slice(0, 5));
    }

    process.exit(0);
}

verifyExclusion().catch(err => {
    console.error(err);
    process.exit(1);
});
