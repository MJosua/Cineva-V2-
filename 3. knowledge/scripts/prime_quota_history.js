const { dbQuery } = require("../../config/db");

async function primeQuotaHistory() {
    console.log("Starting SeaRates Quota History Priming...");
    
    try {
        // Find latest cache entry that has api_calls in payload
        const rows = await dbQuery(`
            SELECT payload_json, last_updated 
            FROM sea_rates.container_tracking_cache 
            WHERE payload_json LIKE '%api_calls%'
            ORDER BY last_updated DESC
            LIMIT 100
        `);

        if (rows.length === 0) {
            console.log("No payloads found with quota info in cache.");
            process.exit(0);
        }

        // We'll take the latest one for today and maybe synthesize some history 
        // if multiple days are present in the cache.
        const dailyLatest = new Map();
        
        for (const row of rows) {
            try {
                const payload = typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : row.payload_json;
                const metadata = payload?.data?.metadata;
                
                if (metadata?.api_calls && metadata?.unique_shipments) {
                    const dateKey = new Date(row.last_updated).toISOString().slice(0, 10);
                    if (!dailyLatest.has(dateKey)) {
                        dailyLatest.set(dateKey, {
                            timestamp: row.last_updated,
                            api_calls: metadata.api_calls,
                            unique_shipments: metadata.unique_shipments
                        });
                    }
                }
            } catch (e) {
                // skip invalid json
            }
        }

        console.log(`Found data for ${dailyLatest.size} distinct days.`);

        for (const [date, data] of dailyLatest.entries()) {
            console.log(`Inserting snapshot for ${date}...`);
            await dbQuery(`
                INSERT INTO sea_rates.api_quota_usage_history 
                (api_calls_used, api_calls_total, unique_shipments_used, unique_shipments_total, snapshot_timestamp)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    api_calls_used = VALUES(api_calls_used),
                    api_calls_total = VALUES(api_calls_total),
                    unique_shipments_used = VALUES(unique_shipments_used),
                    unique_shipments_total = VALUES(unique_shipments_total)
            `, [
                data.api_calls.used, 
                data.api_calls.total, 
                data.unique_shipments.used, 
                data.unique_shipments.total,
                data.timestamp
            ]);
        }

        console.log("Priming Complete Successfuly.");
        process.exit(0);
    } catch (err) {
        console.error("Error priming history:", err);
        process.exit(1);
    }
}

primeQuotaHistory();
