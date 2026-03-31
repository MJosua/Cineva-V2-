/**
 * tracking_analytics.js
 * Run this script to generate metadata and benchmarks for SeaRates Tracking.
 * 
 * Target: `sea_rates.api_usage_log` & `sea_rates.shipments`
 */

const { dbQuery } = require('../database/mysql_helper');

async function analyzeCarrierReliability() {
    console.log("=== Analyzing Carrier Reliability (SUCCESS LOGS) ===");
    
    // We need to join log with shipment to get SCAC, but api_usage_log only has numeric/string tracking
    // For a real production run, we query the shipment table directly for Delivered items:
    const query = `
        SELECT 
            s.sealine as scac, 
            COUNT(*) as total_success,
            AVG(DATEDIFF(pod.date, pol.date)) as avg_transit_days
        FROM sea_rates.shipments s
        LEFT JOIN sea_rates.pol pol ON s.shipment_id = pol.shipment_id
        LEFT JOIN sea_rates.pod pod ON s.shipment_id = pod.shipment_id
        WHERE s.status LIKE '%DELIVERED%' OR s.status LIKE '%ARRIVED%'
        GROUP BY s.sealine
        ORDER BY total_success DESC
        LIMIT 10;
    `;
    
    // Pseudo-code execution:
    console.log("Run Query: ", query);
}

async function analyzeFailures() {
    console.log("=== Analyzing Common Failures ===");
    const query = `
        SELECT 
            status_code, 
            JSON_EXTRACT(error_details_json, '$.error') as error_msg,
            COUNT(*) as error_count
        FROM sea_rates.api_usage_log
        WHERE status_code = 'FAIL'
        GROUP BY status_code, JSON_EXTRACT(error_details_json, '$.error')
        ORDER BY error_count DESC;
    `;
    console.log("Run Query: ", query);
}

// Export for manual runs
module.exports = {
    analyzeCarrierReliability,
    analyzeFailures
};
