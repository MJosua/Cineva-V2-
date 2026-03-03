// Dependencies
const { default: axios } = require("axios");
const cron = require("node-cron");
const { dbConf, dbQuery, dbEOrder } = require("../../config/db");

const apiKey = process.env.SEARATES_API_KEY; // Use environment variable for security
const { eorderDelivered } = require('../../mailer/eorder/eorder_mailer');
const { i2iDelivered } = require("../../mailer/i2i/i2i_mailer");

if (!apiKey) {
    console.error("❌ CRITICAL: SEARATES_API_KEY environment variable is not set!");
    console.error("   Please set SEARATES_API_KEY in your .env file to enable Searates tracking.");
}

/**
 * Check if API quota is still available for today (Unified with main backend)
 */
async function _checkAndQuotaAllowed() {
    try {
        const [config] = await dbQuery("SELECT daily_limit FROM sea_rates.api_quota_config WHERE api_name = 'searates_tracking' LIMIT 1");
        const limit = config?.[0]?.daily_limit ?? 200;

        const [usage] = await dbQuery(`
            SELECT COUNT(*) as count 
            FROM sea_rates.api_usage_log 
            WHERE api_name = 'searates_tracking' 
            AND DATE(hit_timestamp) = CURDATE()
            AND status_code NOT IN ('LIMIT', 'LIMIT_ALERT')
        `);
        const usageCount = usage?.[0]?.count ?? 0;

        return {
            allowed: usageCount < limit,
            usageCount: usageCount,
            limit: limit
        };
    } catch (err) {
        console.error("❌ Error checking quota:", err.message);
        return { allowed: true, usageCount: 0, limit: 200 };
    }
}

/**
 * Log an API hit attempt (Unified with main backend)
 */
async function _logApiHit(number, so_id, status, errorData = null) {
    try {
        await dbQuery(`
            INSERT INTO sea_rates.api_usage_log (api_name, tracking_number, so_id, status_code, error_details_json)
            VALUES (?, ?, ?, ?, ?)
        `, [
            'searates_tracking',
            number || null,
            so_id || 0,
            status,
            errorData ? JSON.stringify(errorData) : null
        ]);
    } catch (err) {
        console.error("❌ Error logging API hit:", err.message);
    }
}

/**
 * Create a system alert ticket in HOTS Service 7
 */
async function _createHotsAlertTicket(number) {
    try {
        // Anti-spam check
        const [existingAlert] = await dbQuery(`
            SELECT log_id FROM sea_rates.api_usage_log 
            WHERE api_name = 'searates_tracking' 
            AND status_code = 'LIMIT_ALERT' 
            AND DATE(hit_timestamp) = CURDATE() 
            LIMIT 1
        `);
        if (existingAlert?.length) return;

        // Note: Using broad dbQuery which is configured for HOTS usually
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const prefix = `26${dateStr}07`;

        const [lastTicket] = await dbQuery(`SELECT ticket_id FROM t_ticket WHERE ticket_id LIKE ? ORDER BY ticket_id DESC LIMIT 1`, [`${prefix}%`]);
        let seq = 1;
        if (lastTicket?.length) seq = parseInt(lastTicket[0].ticket_id.slice(-4)) + 1;
        const ticketId = `${prefix}${seq.toString().padStart(4, '0')}`;

        await dbQuery(`INSERT INTO t_ticket (ticket_id, service_id, status_id, created_by, creation_date, last_update, workflow_step) VALUES (?, 7, 1, 0, NOW(), NOW(), 1)`, [ticketId]);

        const details = [
            [ticketId, 'requester_name', 'Requester Name', 'System Alert (Child Backend)', null, 'text', null, null, 0, JSON.stringify({ label: 'Requester Name' })],
            [ticketId, 'support_type', 'Support Type', 'Software Issue', null, 'dropdown', null, null, 0, JSON.stringify({ label: 'Support Type' })],
            [ticketId, 'urgency', 'Urgency', 'Critical', null, 'dropdown', null, null, 0, JSON.stringify({ label: 'Urgency' })],
            [ticketId, 'issue_description', 'Issue Description', `SeaRates daily limit exceeded. Triggered by ${number} in Child Backend.`, null, 'textarea', null, null, 0, JSON.stringify({ label: 'Issue Description' })]
        ];
        await dbQuery('INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?', [details]);
        await _logApiHit(number, 0, 'LIMIT_ALERT', { ticket_id: ticketId });
        console.log(`🚨 HOTS Alert Ticket Created: ${ticketId}`);
    } catch (err) { console.error("❌ Failed to create alert ticket:", err.message); }
}

/**
 * Sync tracking results to Online Order (IOD)
 */
async function _syncToOnlineOrder(number, data) {
    try {
        const route = data.route || {};
        const ata = route.pod?.actual === true ? route.pod.date : null;
        const atd = route.pol?.actual === true ? route.pol.date : null;
        const scac = data.metadata?.sealine || null;

        // 1. Find all SOs sharing this tracking number (BL, Booking, or Container)
        const findSOQuery = `
            SELECT DISTINCT r.so_id 
            FROM iod.trs_realization r
            LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
            WHERE i.bl_no = ? OR r.book_no = ? OR r.cont_id = ?
        `;
        const [sos] = await dbQuery(findSOQuery, [number, number, number]);

        if (!sos?.length) return;

        const soIds = sos.map(s => s.so_id);

        // 2. Batch Update trs_realization_searates
        const updateRealizationQuery = `
            INSERT INTO iod.trs_realization_searates (so_id, invoice_id, cont_id, ata, atd, scac)
            SELECT so_id, invoice_id, ?, ?, ?, ? FROM iod.trs_realization WHERE so_id IN (?)
            ON DUPLICATE KEY UPDATE invoice_id = VALUES(invoice_id), ata = VALUES(ata), atd = VALUES(atd), scac = VALUES(scac)
        `;
        await dbQuery(updateRealizationQuery, [number, ata, atd, scac, soIds]);

        // 3. Batch Auto-close Orders if Arrived
        if (ata) {
            const updateOrderQuery = `
                UPDATE iod.m_order mo
                JOIN iod.trs_sales_order tso ON mo.order_id = tso.e_order
                SET mo.status = 4
                WHERE tso.so_id IN (?) AND mo.status < 4
            `;
            await dbQuery(updateOrderQuery, [soIds]);
            console.log(`📦 Group updated ${soIds.length} orders to DELIVERED for ${number}.`);
        }
    } catch (err) { console.error("❌ Error syncing to Online Order:", err.message); }
}

function runCheck() {
    let blNumbers = [];
    let ctNumbers = [];


    function formatContainerNumber(containerNumber) {
        if (!containerNumber) return null;

        const match = containerNumber.match(/^([A-Za-z]+)(\d+)$/);
        if (match) {
            return `${match[1]}-${match[2]}`;
        }
        return containerNumber; // fallback if not matching
    }


    // Find BL numbers that are not finished (ETA time date is further than date now)
    async function findBLNumber() {
        blNumbers = [];
        try {
            const [rows] = await dbEOrder.execute(`
                   SELECT * FROM (
                       SELECT 
                            tracking_number,
                            final_tracking_type,
                            so_id,
                            sealine,
                            last_updated_date,
                            CASE 
                                WHEN (DATE(eta) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                     OR (DATE(etd) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                THEN 1 ELSE 2 
                            END as priority
                        FROM (
                            SELECT 
                                r.so_id, r.eta, r.etd, msl.scac as sealine, s.last_updated_date,
                                CASE 
                                    WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
                                    WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
                                    ELSE i.bl_no
                                END as tracking_number,
                                CASE 
                                    WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN 'bk'
                                    WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN 'ct'
                                    ELSE 'bl'
                                END as final_tracking_type
                            FROM iod.trs_realization r
                            LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
                            LEFT JOIN iod.trs_realization_searates ts ON r.so_id = ts.so_id
                            LEFT JOIN sea_rates.m_shipping_line msl ON msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%') OR msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%')
                            LEFT JOIN sea_rates.shipments s ON REPLACE(CASE 
                                WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
                                WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
                                ELSE i.bl_no
                            END, '-', '') = s.number
                            WHERE i.bl_no IS NOT NULL AND r.eta < '9000-01-01' AND r.etd <= DATE_ADD(NOW(), INTERVAL 30 DAY) 
                            AND YEAR(r.etd) >= YEAR(NOW()) - 1
                            AND msl.scac IS NOT NULL
                            AND ts.ata IS NULL
                            AND (s.status IS NULL OR (s.status NOT LIKE '%arrival%' AND s.status NOT LIKE '%delivered%'))
                        ) AS sub1
                   ) AS sub2
                   WHERE 
                        (last_updated_date IS NULL) OR
                        (priority = 1 AND last_updated_date < DATE_SUB(NOW(), INTERVAL 1 DAY)) OR
                        (priority = 2 AND last_updated_date < DATE_SUB(NOW(), INTERVAL 5 DAY))
                   GROUP BY tracking_number, priority, final_tracking_type, so_id, sealine
                   ORDER BY priority ASC, last_updated_date ASC
            `);

            blNumbers = rows.map(row => ({
                cont_id: row.tracking_number,
                so_id: row.so_id,
                sealine: row.sealine || 'auto',
                type: row.final_tracking_type,
                priority: row.priority
            }));
            return blNumbers;
        } catch (error) {
            console.error("❌ Error fetching BL numbers:", error);
            return [];
        }
    }

    async function findCTNumber() {
        ctNumbers = [];
        try {
            const [rows] = await dbEOrder.execute(`
                   SELECT * FROM (
                       SELECT 
                            tracking_number,
                            final_tracking_type,
                            so_id,
                            sealine,
                            last_updated_date,
                            CASE 
                                WHEN (DATE(eta) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                     OR (DATE(etd) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                THEN 1 ELSE 2 
                            END as priority
                        FROM (
                            SELECT 
                                r.so_id, r.eta, r.etd, msl.scac as sealine, s.last_updated_date,
                                CASE 
                                    WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
                                    WHEN LOWER(msl.type) = 'bl' AND i.bl_no IS NOT NULL AND TRIM(i.bl_no) != '' THEN i.bl_no
                                    ELSE r.cont_id
                                END as tracking_number,
                                CASE 
                                    WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN 'bk'
                                    WHEN LOWER(msl.type) = 'bl' AND i.bl_no IS NOT NULL AND TRIM(i.bl_no) != '' THEN 'bl'
                                    ELSE 'ct'
                                END as final_tracking_type
                            FROM iod.trs_realization r
                            LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
                            LEFT JOIN iod.trs_realization_searates ts ON r.so_id = ts.so_id
                            LEFT JOIN sea_rates.m_shipping_line msl ON msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%') OR msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%')
                            LEFT JOIN sea_rates.containers c ON REPLACE(r.cont_id, '-', '') = c.container_number
                            LEFT JOIN sea_rates.shipments s ON c.shipment_id = s.shipment_id
                            WHERE r.cont_id IS NOT NULL AND r.eta < '9000-01-01' AND r.etd <= DATE_ADD(NOW(), INTERVAL 30 DAY) 
                            AND r.eta >= DATE_SUB(NOW(), INTERVAL 5 DAY) -- NEW: Prevent tracking dirty/reused CTs 5 days after ETA
                            AND msl.scac IS NOT NULL
                            AND i.bl_no IS NULL
                            AND ts.ata IS NULL
                            AND (s.status IS NULL OR (s.status NOT LIKE '%arrival%' AND s.status NOT LIKE '%delivered%'))
                        ) AS sub1
                   ) AS sub2
                   WHERE 
                        (last_updated_date IS NULL) OR
                        (priority = 1 AND last_updated_date < DATE_SUB(NOW(), INTERVAL 1 DAY)) OR
                        (priority = 2 AND last_updated_date < DATE_SUB(NOW(), INTERVAL 5 DAY))
                   GROUP BY tracking_number, priority, final_tracking_type, so_id, sealine
                   ORDER BY priority ASC, last_updated_date ASC
            `);

            ctNumbers = rows.map(row => ({
                cont_id: row.tracking_number,
                so_id: row.so_id,
                sealine: row.sealine || 'auto',
                type: row.final_tracking_type,
                priority: row.priority
            }));
            return ctNumbers;
        } catch (error) {
            console.error("❌ Error fetching CT numbers:", error);
            return [];
        }
    }

    async function findBLNumberManual(startDate, endDate) {
        blNumbers = [];
        try {
            // Using parameterized query to prevent SQL injection
            const [rows] = await dbEOrder.execute(`
                   SELECT 
                        i.bl_no,
                        r.book_no,
                        r.cont_id,
                        r.so_id,
                        s.status,
                        r.eta,
                        r.etd,
                        r.ship_line,
                        r.fwd,
                        msl.scac as sealine,
                        msl.type as trackingType,
                        -- Smart fallback: Select tracking number based on preference with fallback
                        CASE 
                            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
                            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
                            ELSE i.bl_no
                        END as tracking_number,
                        -- Smart fallback: Set type to match the actual number being used
                        CASE 
                            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN 'bk'
                            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN 'ct'
                            ELSE 'bl'
                        END as final_tracking_type
                    FROM iod.trs_realization r
                    LEFT JOIN iod.trs_invoice i 
                        ON r.invoice_id = i.invoice_id
                    LEFT JOIN sea_rates.shipments s 
                        ON REPLACE(i.bl_no, '-', '') = s.number
                    LEFT JOIN sea_rates.m_shipping_line msl
                        ON msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%')
                        OR msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%')
                    WHERE 
                        i.bl_no IS NOT NULL
                    AND r.eta < '9000-01-01'
                    AND (
                        (
                            DATEDIFF(r.eta, NOW()) > 30 
                            AND (s.status IS NULL OR s.status = '')
                            AND (YEAR(r.eta) = YEAR(CURDATE()) OR YEAR(r.etd) = YEAR(CURDATE()))
                        )
                        OR
                        (r.eta BETWEEN ? AND ?)
                    )
                    GROUP BY i.bl_no
            `, [startDate, endDate]);

            blNumbers = rows.map(row => ({
                cont_id: row.tracking_number,  // Use smart-selected tracking number
                so_id: row.so_id,
                sealine: row.sealine || 'auto',
                type: row.final_tracking_type  // Use smart-selected type
            }));
            // Extract BL numbers into an array
            return blNumbers; // Return the array if needed elsewhere
        } catch (error) {
            console.error("❌ Error fetching BL numbers:", error);
            return [];
        }
    }

    // Function to process all CT numbers and store data before sending to API
    async function trackMultipleCTs() {
        console.log(`\n🔍 Starting batch tracking at ${new Date().toLocaleString()}...`);

        const batchSize = 50; // Adjust batch size based on API limit
        const baseDelay = 5000; // Initial wait time between batches (in ms)
        let dynamicDelay = baseDelay; // Allow adjusting based on rate limits
        let remainingRequests = null;
        let resetTime = null;

        for (let i = 0; i < ctNumbers.length; i += batchSize) {
            const batch = ctNumbers.slice(i, i + batchSize);
            console.log(`🚀 Processing batch ${i / batchSize + 1}/${Math.ceil(ctNumbers.length / batchSize)}...`);

            const trackingResults = await Promise.allSettled(
                batch.map(async ({ cont_id, so_id, sealine, type }) => {
                    try {
                        const response = await trackCTWithRateLimit({ cont_id, so_id, sealine: sealine || 'auto', type: type || 'ct' });

                        // Extract rate limit headers
                        remainingRequests = response?.headers?.['x-ratelimit-remaining'] ?? 'Unknown';
                        resetTime = response?.headers?.['x-ratelimit-reset'] ?? 'Unknown';

                        return response; // This must be returned directly
                    } catch (error) {
                        return { cont_id, error: error.message };
                    }
                })
            );

            // Separate successful and failed results **(Fix: Ensure res.value exists before accessing status)**
            const validResults = trackingResults
                .filter(res => res.status === "fulfilled" && res.value && res.value.status && res.value.status !== "error")
                .map(res => res.value);

            const failedResults = trackingResults
                .filter(res => res.status === "rejected" || (res.value && res.value.error))
                .map(res => res.value ?? { cont_id: "Unknown", error: "Undefined response" });

            // Save successful results
            if (validResults.length > 0) {
                await saveToDatabase(validResults);
            } else {
                console.warn("⚠️ No valid results to save.");
            }

            // Log failed tracking attempts
            if (failedResults.length > 0) {
                console.error(`❌ Failed to track ${failedResults.length} CT numbers:`);
                failedResults.forEach(fail => console.error(`- ${fail.cont_id}: ${fail.error}`));
            }

            // Show rate limit info only when waiting
            if (remainingRequests !== null && resetTime !== null) {
                console.log(`🛑 Remaining Requests: ${remainingRequests === "Unknown" ? 0 : remainingRequests}, Rate Limit Resets In: ${resetTime === "Unknown" ? 0 : resetTime} seconds`);
            }

            // Adaptive delay based on rate limits
            if (i + batchSize < ctNumbers.length) {
                console.log(`⏳ Waiting ${dynamicDelay / 1000}s before next batch...`);
                await new Promise(resolve => setTimeout(resolve, dynamicDelay));
            }
        }

        console.log("✅ Batch tracking complete!");
    }

    async function trackMultipleBLs() {
        console.log(`\n🔍 Starting batch tracking at ${new Date().toLocaleString()}...`);

        const batchSize = 50; // Adjust batch size based on API limit
        const baseDelay = 5000; // Initial wait time between batches (in ms)
        let dynamicDelay = baseDelay; // Allow adjusting based on rate limits
        let remainingRequests = null;
        let resetTime = null;

        for (let i = 0; i < blNumbers.length; i += batchSize) {
            const batch = blNumbers.slice(i, i + batchSize);
            console.log(`🚀 Processing batch ${i / batchSize + 1}/${Math.ceil(blNumbers.length / batchSize)}...`);

            const trackingResults = await Promise.allSettled(
                batch.map(async ({ cont_id, so_id, sealine, type }) => {
                    try {
                        const response = await trackBLWithRateLimit({ cont_id, so_id, sealine: sealine || 'auto', type: type || 'bl' });

                        // Extract rate limit headers
                        remainingRequests = response?.headers?.['x-ratelimit-remaining'] ?? 'Unknown';
                        resetTime = response?.headers?.['x-ratelimit-reset'] ?? 'Unknown';

                        return response; // This must be returned directly
                    } catch (error) {
                        return { cont_id, error: error.message };
                    }
                })
            );

            // Separate successful and failed results **(Fix: Ensure res.value exists before accessing status)**
            const validResults = trackingResults
                .filter(res => res.status === "fulfilled" && res.value && res.value.status && res.value.status !== "error")
                .map(res => res.value);

            const failedResults = trackingResults
                .filter(res => res.status === "rejected" || (res.value && res.value.error))
                .map(res => res.value ?? { cont_id: "Unknown", error: "Undefined response" });

            // Save successful results
            if (validResults.length > 0) {

                await saveToDatabase(validResults);
            } else {
                console.warn("⚠️ No valid results to save.");
            }

            // Log failed tracking attempts
            if (failedResults.length > 0) {
                console.error(`❌ Failed to track ${failedResults.length} B/L numbers:`);
                failedResults.forEach(fail => console.error(`- ${fail.cont_id}: ${fail.error}`));
            }

            // Show rate limit info only when waiting
            if (remainingRequests !== null && resetTime !== null) {
                console.log(`🛑 Remaining Requests: ${remainingRequests === "Unknown" ? 0 : remainingRequests}, Rate Limit Resets In: ${resetTime === "Unknown" ? 0 : resetTime} seconds`);
            }

            // Adaptive delay based on rate limits
            if (i + batchSize < blNumbers.length) {
                console.log(`⏳ Waiting ${dynamicDelay / 1000}s before next batch...`);
                await new Promise(resolve => setTimeout(resolve, dynamicDelay));
            }
        }

        console.log("✅ Batch tracking complete!");
        console.log("")
    }



    async function trackBLWithRateLimit({ cont_id, so_id, sealine = 'auto', type = 'bl' }, retryCount = 0) {
        const url = `https://tracking.searates.com/tracking?api_key=${apiKey}&number=${cont_id}&type=${type}&sealine=${sealine}&force_update=false&route=true&ais=false`;

        try {
            // 1. Check Daily Quota (Unified)
            const quota = await _checkAndQuotaAllowed();
            if (!quota.allowed) {
                console.warn(`🛑 daily quota reached. Skipping ${cont_id}`);
                await _createHotsAlertTicket(cont_id);
                await _logApiHit(cont_id, so_id, 'LIMIT');
                return { cont_id, status: "error", error: "QUOTA_EXCEEDED" };
            }

            const response = await axios.get(url);
            _logApiHit(cont_id, so_id, 'SUCCESS');

            console.log(`🟢 [${new Date().toLocaleString()}] Tracking ${cont_id} :`, response.data.status);

            // Sync to Online Order immediately
            if (response.data.status === 'success') {
                await _syncToOnlineOrder(cont_id, response.data.data);
            }

            return { cont_id, so_id, status: response.data.status, details: response.data };
        } catch (error) {
            _logApiHit(cont_id, so_id, 'FAIL', error.response?.data || error.message);
            if (error.response) {
                const status = error.response.status;
                if (status === 429) {
                    const resetTime = error.response.headers?.['x-ratelimit-reset'] ?? 10;
                    const waitTime = (resetTime * 1000) || 10000;
                    console.warn(`⚠️ Rate limit hit for ${cont_id}. Retrying after ${waitTime / 1000}s... (Attempt ${retryCount + 1})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    if (retryCount < 3) return trackBLWithRateLimit({ cont_id, so_id, sealine, type }, retryCount + 1);
                }
            }
            return { cont_id, status: "error", error: error.message };
        }
    }

    async function trackCTWithRateLimit({ cont_id, so_id, sealine = 'auto', type = 'ct' }, retryCount = 0) {
        const url = `https://tracking.searates.com/tracking?api_key=${apiKey}&number=${cont_id}&type=${type}&sealine=${sealine}&force_update=false&route=true&ais=false`;

        try {
            // 1. Check Daily Quota (Unified)
            const quota = await _checkAndQuotaAllowed();
            if (!quota.allowed) {
                console.warn(`🛑 daily quota reached. Skipping ${cont_id}`);
                await _createHotsAlertTicket(cont_id);
                await _logApiHit(cont_id, so_id, 'LIMIT');
                return { cont_id, status: "error", error: "QUOTA_EXCEEDED" };
            }

            const response = await axios.get(url);
            _logApiHit(cont_id, so_id, 'SUCCESS');

            console.log(`🟢 [${new Date().toLocaleString()}] Tracking ${cont_id} :`, response.data.status);

            // Sync to Online Order immediately
            if (response.data.status === 'success') {
                await _syncToOnlineOrder(cont_id, response.data.data);
            }

            return { cont_id, so_id, status: response.data.status, details: response.data };
        } catch (error) {
            _logApiHit(cont_id, so_id, 'FAIL', error.response?.data || error.message);
            if (error.response) {
                const status = error.response.status;
                if (status === 429) {
                    const resetTime = error.response.headers?.['x-ratelimit-reset'] ?? 10;
                    const waitTime = (resetTime * 1000) || 10000;
                    console.warn(`⚠️ Rate limit hit for ${cont_id}. Retrying after ${waitTime / 1000}s... (Attempt ${retryCount + 1})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    if (retryCount < 3) return trackCTWithRateLimit({ cont_id, so_id, sealine, type }, retryCount + 1);
                }
            }
            return { cont_id, status: "error", error: error.message };
        }
    }


    async function saveToDatabase(data) {
        let connection;

        try {
            console.log("🔄 Getting DB connection...");
            connection = await dbConf.getConnection(); // Get a connection from the pool

            if (!connection) {
                throw new Error("❌ Failed to get a database connection.");
            }

            console.log("✅ Connection acquired. Starting transaction...");
            console.log(`=================================================================`);

            await connection.beginTransaction(); // Start transaction BEFORE the loop

            for (const record of data) {
                // Metadata and Logs handled via unified _logApiHit and _syncToOnlineOrder

                const [checketd] = await dbEOrder.execute(`
                    select tr.etd, tr.so_id   from iod.trs_realization tr 
             `);
                const match = checketd.find(row => row.so_id.toLocaleString() === record.so_id.toLocaleString());

                const checkShipmentQuery = `
                SELECT shipment_id FROM shipments WHERE number like ? and so_id = ?
            `;

                const [existingRows] = await connection.execute(checkShipmentQuery, [`%${record.cont_id}%`, record.so_id || 0]);

                let shipmentId;

                let run = false;

                if (match) {
                    // ✅ Null safety guard for route data
                    const route = record.details?.data?.route;
                    if (route && route.pol && route.pol.date) {
                        const polDate = new Date(route.pol.date);
                        const etdDate = new Date(match.etd);

                        const diffMs = polDate - etdDate; // milliseconds difference
                        const checketdrange = diffMs / (1000 * 60 * 60 * 24); // days difference

                        console.log("checketdrange", checketdrange)

                        if (checketdrange > -3) {
                            run = true;
                        } else {
                            run = false;
                            console.log(` Container ${record.cont_id} is not valid in term of etd range `)
                        }
                    } else {
                        console.warn("⚠️ Route or POL data not available, proceeding anyway");
                        run = true;
                    }

                } else {
                    console.log("No matching so_id found for record.so_id refresh method:", record.so_id);
                    run = true;
                }

                // Check if shipment already exists
                if (run) {

                    if (existingRows.length > 0) {
                        // Shipment exists
                        shipmentId = existingRows[0].shipment_id;
                        console.log(`📦 Shipment already exists (ID: ${shipmentId}), updating events only...`);

                        // Optionally update shipment status if changed
                        const updateShipmentQuery = `
                                INSERT INTO shipments (
                                    shipment_id,  
                                    status, 
                                    number,
                                    so_id,
                                    type,
                                    sealine,
                                    sealine_name,
                                    last_updated_date
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                                ON DUPLICATE KEY UPDATE
                                    status = VALUES(status),
                                    last_updated_date = NOW(),
                                    sealine = VALUES(sealine),
                                    sealine_name = VALUES(sealine_name);
                            `;

                        const metadata = record.details.data.metadata;

                        console.log("metadata.sealine", metadata.sealine)

                        await connection.execute(updateShipmentQuery, [
                            shipmentId,                               // first ? = shipment_id
                            metadata.status ?? null, // second ? = status

                            //metadata.number ganti jadi record.cont_id karena menyesuaikan data yang diinput di trs_invoice
                            record.cont_id ?? null,
                            record.so_id ?? 0,
                            metadata.type ?? null,
                            metadata.sealine ?? null,
                            metadata.sealine_name ?? null
                        ]);


                        // ✅ Null safety guard for route data
                        const routepod = record.details?.data?.route;
                        if (routepod) {
                            console.log("metadata.status", routepod.pod?.actual)
                        } else {
                            console.warn("⚠️ Route data not available, skipping route-related updates");
                        }


                        // MASUKKAN ATD 
                        if (routepod && routepod.pol && routepod.pol.actual === true) {

                            // =====================================================================

                            // i2iDelivered(record.so_id)

                            const updatei2i = `
                                    INSERT INTO iod.trs_realization_searates (
                                        so_id,
                                        invoice_id,
                                        cont_id, 
                                        atd
                                    )
                                    SELECT so_id, invoice_id, ?, ? FROM iod.trs_realization WHERE so_id = ?
                                    ON DUPLICATE KEY UPDATE
                                        invoice_id = VALUES(invoice_id),
                                        cont_id = VALUES(cont_id),
                                        atd = VALUES(atd);
                                `;




                            if (record.details.data.containers && Array.isArray(record.details.data.containers)) {
                                for (const container of record.details.data.containers) {
                                    console.log("container.number :", container.number)
                                    console.log("atd.number :", routepod.pol?.date)
                                    await connection.execute(updatei2i, [
                                        formatContainerNumber(container.number) ?? null,
                                        routepod.pol?.date ?? null,
                                        record.so_id
                                    ]);

                                    console.log("✅", record.details.data.containers.length, "Containers inserted successfully to trs as ATD");
                                }
                            }


                        }


                        // MASUKKAN ATA dan ATD terupdate
                        if (routepod && routepod.pod && routepod.pod.actual === true) {
                            const updateEorder = `
                                UPDATE iod.m_order mo
                                    JOIN iod.trs_sales_order tso 
                                        ON mo.order_id = tso.e_order
                                    SET mo.status = 4
                                    WHERE tso.so_id = ?;
                            `

                            await connection.execute(updateEorder, [
                                record.so_id
                            ]);

                            eorderDelivered(record.so_id)

                            // =====================================================================

                            // i2iDelivered(record.so_id)

                            const updatei2i = `
                                    INSERT INTO iod.trs_realization_searates (
                                        so_id,
                                        invoice_id,
                                        cont_id, 
                                        ata,
                                        atd
                                    )
                                    SELECT so_id, invoice_id, ?, ?, ? FROM iod.trs_realization WHERE so_id = ?
                                    ON DUPLICATE KEY UPDATE
                                        invoice_id = VALUES(invoice_id),
                                        cont_id = VALUES(cont_id),
                                        ata = VALUES(ata),
                                        atd = VALUES(atd);
                                `;




                            if (record.details.data.containers && Array.isArray(record.details.data.containers)) {
                                for (const container of record.details.data.containers) {
                                    console.log("container.number :", container.number)
                                    console.log("ata.number :", routepod?.pod?.date)
                                    console.log("atd.number :", routepod?.pol?.date)
                                    await connection.execute(updatei2i, [
                                        formatContainerNumber(container.number) ?? null,
                                        routepod?.pod?.date ?? null,
                                        routepod?.pol?.date ?? null,
                                        record.so_id
                                    ]);

                                    console.log("✅", record.details.data.containers.length, "Containers inserted successfully to trs as ATA");
                                }
                            }


                        }


                        const updateVesselQuery = `
                        INSERT INTO vessel (
                                vessel_id, name, imo, shipment_id
                            ) VALUES (?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                                vessel_id = VALUES(vessel_id),
                                name = VALUES(name),
                                imo = VALUES(imo),
                                shipment_id = VALUES(shipment_id);
                        `;

                        if (record.details.data.vessels && Array.isArray(record.details.data.vessels)) {
                            for (const [vslindx, vsl] of record.details.data.vessels.entries()) {
                                await connection.execute(updateVesselQuery, [
                                    vsl.id ?? null,
                                    vsl.name ?? null,
                                    vsl.imo ?? null,
                                    shipmentId
                                ]);
                            }
                            console.log("✅ Vessels inserted successfully");
                        }


                        const updateRouteQuery = `
                        UPDATE route
                        SET
                            lat = ?,
                            \`long\` = ?
                        WHERE shipment_id = ?;
                    `;

                        if (
                            record.details.data.route_data &&
                            Array.isArray(record.details.data.route_data.pin) &&
                            record.details.data.route_data.pin.length >= 2
                        ) {
                            const [lat, long] = record.details.data.route_data.pin;

                            console.log("========================");
                            console.log("lat", lat);
                            console.log("long", long);
                            console.log("shipmentId", shipmentId);
                            console.log("========================");

                            // Build a debug query string (just for logging!)
                            const debugQuery = updateRouteQuery
                                .replace("?", connection.escape(lat ?? null))
                                .replace("?", connection.escape(long ?? null))
                                .replace("?", connection.escape(shipmentId));

                            console.log("📝 Final running query:", debugQuery);

                            const [result] = await connection.execute(updateRouteQuery, [
                                lat ?? null,
                                long ?? null,
                                shipmentId,
                            ]);

                            console.log("✅ Route updated successfully", result);
                        } else {
                            console.warn("⚠️ Warning: No Route Yet");
                        }


                        const updatelocationquery =
                            `
                        INSERT INTO locations (
                                location_id, name, state, country, locode, lat, lng, shipment_id
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                                location_id = VALUES(location_id),
                                name = VALUES(name),
                                state = VALUES(state),
                                country = VALUES(country),
                                locode = VALUES(locode),
                                lat = VALUES(lat),
                                lng = VALUES(lng),
                                shipment_id = VALUES(shipment_id);
                        `;



                        if (record.details.data.locations) {
                            for (const lctns of record.details.data.locations) {
                                const country = lctns.country ? lctns.country : "";

                                await connection.execute(updatelocationquery, [
                                    lctns.id ?? null,
                                    lctns.name ?? null,
                                    lctns.state ?? null,
                                    country ?? null,
                                    lctns.locode ?? null,

                                    lctns.lat ?? null,
                                    lctns.lng ?? null,
                                    shipmentId,
                                ]);
                            }
                            console.log("✅ Location Updated successfully");
                        } else {
                        }

                        const polUpdateQuery = `
                            INSERT INTO pol (
                                location_id,
                                date,
                                actual,
                                shipment_id,
                                last_updated_date
                            )
                            VALUES (?,?,?,?, NOW())
                            ON DUPLICATE KEY UPDATE
                                location_id = VALUES(location_id),
                                date = VALUES(date),
                                actual = VALUES(actual),
                                shipment_id = VALUES(shipment_id),
                                last_updated_date = VALUES(last_updated_date)
                        `;

                        const routepol = record.details.data.route;
                        if (routepol) {

                            const [polresults] = await connection.execute(polUpdateQuery, [
                                routepol.pol.location ?? null,
                                routepol.pol.date ?? null,
                                routepol.pol.actual ?? null,
                                shipmentId,

                            ]);

                            console.log("✅ POL Updated successfully");
                        }


                        const podUpdateQuery = `
                            INSERT INTO pod (
                                location_id,
                                date,
                                predictive_eta,
                                actual,
                                shipment_id,
                                last_updated_date
                            )
                            VALUES (?,?,?,?,?, NOW())
                            ON DUPLICATE KEY UPDATE
                                location_id = VALUES(location_id),
                                date = VALUES(date),
                                predictive_eta = VALUES(predictive_eta),
                                actual = VALUES(actual),
                                last_updated_date = VALUES(last_updated_date)
                        `;
                        // Declaring port


                        if (routepod) {
                            const predictiveEta = routepod.predictive_eta ? routepod.predictive_eta : null;
                            const [podresults] = await connection.execute(podUpdateQuery, [
                                routepod.pod.location ?? null,
                                routepod.pod.date ?? null,
                                predictiveEta ?? null,
                                routepod.pod.actual ?? null,
                                shipmentId,
                            ]);
                            console.log("✅ POD Update successfully");
                        }


                        const updateeventQuery = `
                         INSERT INTO events (  
                            order_id,
                            location_id,
                            description,
                            event_type,
                            event_code,
    
                            date,
                            actual,
                            vessel_id,
                            voyage,
                            container_id,
    
                            shipment_id,
                            status
                        ) VALUES (
                                ?, ?, ?, ?, ?,
                                ?, ?, ?, ?, ?,
                                ?, ?
                                )
                        ON DUPLICATE KEY UPDATE 
                                location_id = VALUES(location_id),
                                description = VALUES(description),
                                event_type = VALUES(event_type),
                                event_code = VALUES(event_code),
                                date = VALUES(date),
                                actual = VALUES(actual),
                                vessel_id = VALUES(vessel_id),
                                voyage = VALUES(voyage),
                                container_id = VALUES(container_id),
                                status = VALUES(status)
                        `;

                        if (record.details.data.containers && Array.isArray(record.details.data.containers)) {
                            for (const [containerindx, container] of record.details.data.containers.entries()) {
                                if (container.events && Array.isArray(container.events)) {
                                    for (const [eventindx, event] of container.events.entries()) {
                                        await connection.execute(updateeventQuery, [
                                            event.order_id ?? null,
                                            event.location ?? null,
                                            event.description ?? null,
                                            event.event_type ?? null,
                                            event.event_code ?? null,
                                            event.date ?? null,
                                            event.actual ?? null,
                                            event.vessel ?? null,
                                            event.voyage ?? null,
                                            containerindx + 1,
                                            shipmentId,
                                            event.status ?? null
                                        ]);


                                    }
                                }
                            }
                            console.log("✅ Event Updated successfully");

                        } else {
                        }

                    } else {
                        // New shipment, insert it


                        console.log("📌 First time event Updated");

                        const shipmentQuery = `
                        INSERT INTO shipments(
                            number,
                            so_id,
                            type,
                            sealine,
                            sealine_name,
    
                            status,
    
                            last_updated_date
                        ) VALUES(?, ?, ?, ?, ?,
                          ?, 
                          NOW())`;


                        // Declaring Metadata
                        const metadata = record.details.data.metadata;
                        const updatedAt = metadata.updated_at ? new Date(metadata.updated_at) : null;


                        console.log("B\L sealine name ", metadata.sealine_name);
                        console.log("B\L record.cont_id ", record.cont_id);

                        const [shipmentResult] = await connection.execute(shipmentQuery, [
                            record.cont_id ?? null,
                            record.so_id ?? 0,
                            metadata.type ?? null,
                            metadata.sealine ?? null,
                            metadata.sealine_name ?? null,

                            metadata.status ?? null,

                        ]);

                        shipmentId = shipmentResult.insertId;
                        console.log(`✅ New shipment inserted(Container Number : ${metadata.number})`);


                        const firstTimeEventQuery = `
                        INSERT IGNORE INTO events(
                            order_id,
                            location_id,
                            description,
                            event_type,
                            event_code,
    
                            date,
                            actual,
                            vessel_id,
                            voyage,
                            container_id,
    
                            shipment_id,
                            status
                        ) VALUES(?, ?, ?, ?, ?,
                                  ?, ?, ?, ?, ?, 
                                  ?, ?)
                            `;

                        await connection.execute(firstTimeEventQuery, [
                            0,               // order_id
                            0,            // location_id
                            "First time API-CALL", // description
                            "system",        // event_type
                            "FIRST_CALL",    // event_code

                            new Date(),      // date (now)
                            1,            // actual
                            null,            // vessel_id
                            null,            // voyage
                            0, // container_id

                            shipmentId,       // shipment_id
                            "start"
                        ]);

                        // Insert locations, route, pol, pod, vessel, containers as usual
                        // 👉 You can keep this logic the same (or add similar "check first" logic if needed)

                        const locationsQuery = `
                        INSERT INTO locations (
                                location_id, name, state, country, locode, lat, lng, shipment_id
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                                name = VALUES(name),
                                state = VALUES(state),
                                country = VALUES(country),
                                locode = VALUES(locode),
                                lat = VALUES(lat),
                                lng = VALUES(lng),
                                shipment_id = VALUES(shipment_id);
                        `;

                        if (record.details.data.locations) {
                            for (const lctns of record.details.data.locations) {
                                const country = lctns.country ? lctns.country : "";

                                await connection.execute(locationsQuery, [
                                    lctns.id ?? null,
                                    lctns.name ?? null,
                                    lctns.state ?? null,
                                    country ?? null,
                                    lctns.locode ?? null,

                                    lctns.lat ?? null,
                                    lctns.lng ?? null,
                                    shipmentId,
                                ]);
                            }
                            console.log("✅ locations inserted successfully");
                        }

                        const routeQuery = `
                                INSERT INTO route(
                                    lat,
                                \`long\`,
                                    shipment_id
                                ) 
                                    VALUES 
                                    (?, ?, ?)
                                `;


                        if (record.details.data.route_data && Array.isArray(record.details.data.route_data.pin) && record.details.data.route_data.pin.length >= 2) {
                            const [lat, long] = record.details.data.route_data.pin; // Destructuring for clarity

                            const [routeResult] = await connection.execute(routeQuery, [
                                lat ?? null,
                                long ?? null,
                                shipmentId ?? null
                            ]);

                            console.log("✅ Route inserted successfully");
                        } else {
                            console.warn("⚠️ Warning: No Route Yet");
                        }


                        const polQuery = `
                        INSERT INTO pol (
                            location_id,
                            date,
                            actual,
                            shipment_id,
                            last_updated_date 
                            )
                            VALUES
                            (?,?,?,?,
                            NOW())
                        `

                        const routepol = record.details.data.route;
                        if (routepol) {

                            const [polresults] = await connection.execute(polQuery, [
                                routepol.pol.location ?? null,
                                routepol.pol.date ?? null,
                                routepol.pol.actual ?? null,
                                shipmentId,

                            ]);

                            console.log("✅ POL inserted successfully");
                        }


                        const podQuery = `
                        INSERT INTO pod (
                            location_id,
                            date,
                            predictive_eta,
                            actual,
                            shipment_id,
                            last_updated_date
                            )
                            VALUES
                            (?,?,?,?,?,
                            NOW())
                        `
                        // Declaring port


                        const routepod = record.details.data.route;
                        if (routepod) {
                            const predictiveEta = routepod.predictive_eta ? routepod.predictive_eta : null;
                            const [podresults] = await connection.execute(podQuery, [
                                routepod.pod.location ?? null,
                                routepod.pod.date ?? null,
                                predictiveEta ?? null,
                                routepod.pod.actual ?? null,
                                shipmentId,
                            ]);
                            console.log("✅ POD inserted successfully");
                        }


                        const vesselsQuery = `
                        INSERT INTO vessel (  
                            imo,
                            name,
                            vessel_id,
                            shipment_id
                        ) VALUES (?, ?, ?, ?)`;

                        if (record.details.data.vessels && Array.isArray(record.details.data.vessels)) {
                            for (const [vslindx, vsl] of record.details.data.vessels.entries()) {
                                await connection.execute(vesselsQuery, [
                                    vsl.imo ?? null,
                                    vsl.name ?? null,
                                    vsl.id ?? null,
                                    shipmentId
                                ]);
                            }
                            console.log("✅ Vessels inserted successfully");
                        }



                        const containersQuery = `
                        INSERT IGNORE INTO containers (  
                            container_id,
                            container_number,
                            iso_code,
                            size_type,
                            status,
    
                            shipment_id
                        ) VALUES (
                                  ?, ?, ?, ?, ?,
                                  ?
                                )`;

                        const eventQuery = `
                        INSERT IGNORE INTO events (  
                            order_id,
                            location_id,
                            description,
                            event_type,
                            event_code,
    
                            date,
                            actual,
                            vessel_id,
                            voyage,
                            container_id,
    
                            shipment_id,
                            status
                        ) VALUES (
                                ?, ?, ?, ?, ?,
                                ?, ?, ?, ?, ?,
                                ?, ?
                                )`;

                        if (record.details.data.containers && Array.isArray(record.details.data.containers)) {
                            for (const [containerindx, container] of record.details.data.containers.entries()) {
                                await connection.execute(containersQuery, [
                                    containerindx + 1,
                                    container.number ?? null,
                                    container.iso_code ?? null,
                                    container.size_type ?? null,
                                    container.status ?? null,

                                    shipmentId,
                                ]);

                                if (container.events && Array.isArray(container.events)) {
                                    for (const [eventindx, event] of container.events.entries()) {
                                        await connection.execute(eventQuery, [
                                            event.order_id ?? null,
                                            event.location ?? null,
                                            event.description ?? null,
                                            event.event_type ?? null,
                                            event.event_code ?? null,

                                            event.date ?? null,
                                            event.actual ?? null,
                                            event.vessel || null,
                                            event.voyage || null,
                                            containerindx + 1 ?? null,

                                            shipmentId,
                                            event.status || null,

                                        ]);
                                    }
                                }
                            }

                            console.log("✅", record.details.data.containers.length, "Containers inserted successfully");
                            console.log("✅ Event inserted successfully");
                        } else {
                        }

                    }

                }





            }



            await connection.commit(); // ✅ Only commit AFTER all loops finish
            console.log(` `);
            console.log(`=================================================================`);
            console.log(`✅ Data saved successfully: ${data.length} records`);

        } catch (error) {
            console.error("❌ Error saving data:", error.message, error.stack);
            if (connection) await connection.rollback(); // 🔥 Rollback everything if an error occurs
        } finally {
            if (connection) connection.release(); // ✅ Always release the connection
            blData = []
        }
    }


    const presetContainers = [

        { cont_id: "CAAU8591589" },

    ]


    async function trackMultipleCTsWithPreset() {
        console.log(`\n🔍 Starting batch tracking at ${new Date().toLocaleString()}...`);

        const batchSize = 50; // Adjust batch size based on API limit
        const baseDelay = 5000; // Initial wait time between batches (in ms)
        let dynamicDelay = baseDelay; // Allow adjusting based on rate limits
        let remainingRequests = null;
        let resetTime = null;

        for (let i = 0; i < presetContainers.length; i += batchSize) {
            const batch = presetContainers.slice(i, i + batchSize);
            console.log(`🚀 Processing batch ${i / batchSize + 1}/${Math.ceil(presetContainers.length / batchSize)}...`);

            const trackingResults = await Promise.allSettled(
                batch.map(async ({ cont_id }) => {
                    try {
                        const response = await trackBLWithRateLimit({ cont_id });

                        // Extract rate limit headers
                        remainingRequests = response?.headers?.['x-ratelimit-remaining'] ?? 'Unknown';
                        resetTime = response?.headers?.['x-ratelimit-reset'] ?? 'Unknown';

                        return response; // This must be returned directly
                    } catch (error) {
                        return { cont_id, error: error.message };
                    }
                })
            );

            // Separate successful and failed results **(Fix: Ensure res.value exists before accessing status)**
            const validResults = trackingResults
                .filter(res => res.status === "fulfilled" && res.value && res.value.status && res.value.status !== "error")
                .map(res => res.value);

            const failedResults = trackingResults
                .filter(res => res.status === "rejected" || (res.value && res.value.error))
                .map(res => res.value ?? { cont_id: "Unknown", error: "Undefined response" });

            // Save successful results
            if (validResults.length > 0) {
                await saveToDatabase(validResults);
            } else {
                console.warn("⚠️ No valid results to save.");
            }

            // Log failed tracking attempts
            if (failedResults.length > 0) {
                console.error(`❌ Failed to track ${failedResults.length} B/L numbers:`);
                failedResults.forEach(fail => console.error(`- ${fail.cont_id}: ${fail.error}`));
            }

            // Show rate limit info only when waiting
            if (remainingRequests !== null && resetTime !== null) {
                console.log(`🛑 Remaining Requests: ${remainingRequests === "Unknown" ? 0 : remainingRequests}, Rate Limit Resets In: ${resetTime === "Unknown" ? 0 : resetTime} seconds`);
            }

            // Adaptive delay based on rate limits
            if (i + batchSize < presetContainers.length) {
                console.log(`⏳ Waiting ${dynamicDelay / 1000}s before next batch...`);
                await new Promise(resolve => setTimeout(resolve, dynamicDelay));
            }
        }

        console.log("✅ Batch tracking complete!");
    }


    // trackMultipleCTsWithPreset();

    // Schedule cron jobs at 00:00 AM & 06:00 PM
    // cron.schedule("17 * * * *", async () => {

    // Schedule cron jobs DAILY at 00:00 AM
    cron.schedule("0 0 * * *", async () => {
        // Track BL first
        console.log("🔍 Tracking BL numbers first...");
        await findBLNumber();
        // FORCE LIMIT: 25 max for testing
        if (blNumbers.length > 25) blNumbers = blNumbers.slice(0, 25);

        console.log("✅ Found BL Numbers:", blNumbers);
        console.log("Total BL Count : ", blNumbers.length)
        if (blNumbers.length > 0) {
            console.log("🚀 Starting BL tracking...");
            await trackMultipleBLs();
        } else {
            console.log("⚠️ No BL numbers found. Skipping BL tracking.");
        }

        const remainingLimit = 25 - blNumbers.length;
        if (remainingLimit > 0) {
            // Then track CT numbers that are not part of a BL or where BL status is not fulfilled
            console.log("🔍 Tracking CT numbers...");
            await findCTNumber();
            if (ctNumbers.length > remainingLimit) ctNumbers = ctNumbers.slice(0, remainingLimit);

            console.log("Total CT Count : ", ctNumbers.length)
            if (ctNumbers.length > 0) {
                console.log("🚀 Starting CT tracking...");
                await trackMultipleCTs();
            } else {
                console.log("⚠️ No CT numbers found. Skipping CT tracking.");
            }
        } else {
            console.log("⚠️ Total quota of 25 consumed by BLs. Skipping CT tracking.");
        }

        console.log("✅ Completed tracking cycle.");
    });

    console.log("⏳ Cron job scheduler initialized...");


    async function test() {
        console.log("🔍 Tracking BL numbers first...");
        await findBLNumber();
        // FORCE LIMIT: 25 max for testing
        if (blNumbers.length > 25) blNumbers = blNumbers.slice(0, 25);

        console.log("✅ Found BL Numbers:", blNumbers);
        console.log("Total BL Count : ", blNumbers.length)
        if (blNumbers.length > 0) {
            console.log("🚀 Starting BL tracking...");
            await trackMultipleBLs();
        } else {
            console.log("⚠️ No BL numbers found. Skipping BL tracking.");
        }

        const remainingLimit = 25 - blNumbers.length;
        if (remainingLimit > 0) {
            // Then track CT numbers that are not part of a BL or where BL status is not fulfilled
            console.log("🔍 Tracking CT numbers...");
            await findCTNumber();
            if (ctNumbers.length > remainingLimit) ctNumbers = ctNumbers.slice(0, remainingLimit);

            console.log("Total CT Count : ", ctNumbers.length)
            if (ctNumbers.length > 0) {
                console.log("🚀 Starting CT tracking...");
                await trackMultipleCTs();
            } else {
                console.log("⚠️ No CT numbers found. Skipping CT tracking.");
            }
        } else {
            console.log("⚠️ Total quota of 25 consumed by BLs. Skipping CT tracking.");
        }

        console.log("✅ Completed testing tracking cycle.");
    }

    // test()

    // trackMultipleCTsWithPreset()



    async function manualtrack() {

        console.log("🔍 Tracking BL numbers first...");

        ctNumbers = [

        ]
            ;

        blNumbers = [

            { cont_id: "440510022602", so_id: "250010400175", sealine: null },
            { cont_id: "KMTCPKG2647714", so_id: "250010400180", sealine: null },
            { cont_id: "KMTCPKG2647715", so_id: "250010400182", sealine: null },
            { cont_id: "KMTCPKG2645716", so_id: "250010400183", sealine: null },
            { cont_id: "440510022640", so_id: "250010400187", sealine: null },
            { cont_id: "KMTCPKG2643711", so_id: "250010400188", sealine: null },
            { cont_id: "KMTCPKG2641712", so_id: "250010400189", sealine: null },
            { cont_id: "KMTCPKW1207823", so_id: "250010400192", sealine: null },
            { cont_id: "440510022596", so_id: "250010400194", sealine: null },
            { cont_id: "KMTCPKG2659197", so_id: "250010400197", sealine: null },
            { cont_id: "JKTSYD136713V", so_id: "250010800052", sealine: null },
            { cont_id: "JKTSYD136849V", so_id: "250010800056", sealine: null },
            { cont_id: "JKT50042000", so_id: "250011000047", sealine: null },
            { cont_id: "HASLS11251000042", so_id: "250011601501", sealine: null },
            { cont_id: "MAEU260434723", so_id: "250011601530", sealine: null },
            { cont_id: "KMTCJKT5283820", so_id: "250011601556", sealine: null },
            { cont_id: "A49FA02818", so_id: "250014500229", sealine: null },
            { cont_id: "ARM0417081", so_id: "250014500261", sealine: null },
            { cont_id: "A49FA02820", so_id: "250014500268", sealine: null },
            { cont_id: "OOLU2313325570", so_id: "250014500269", sealine: null },
            { cont_id: "JKTLYT136740V", so_id: "250015300279", sealine: null },
            { cont_id: "JKTAKL136743V", so_id: "250015300280", sealine: null },
            { cont_id: "JKTAKL136775V", so_id: "250015300282", sealine: null },
            { cont_id: "JKTAKL136739V", so_id: "250015300283", sealine: null },
            { cont_id: "JKTAKL136818V", so_id: "250015300286", sealine: null },
            { cont_id: "JKTAKL136785V", so_id: "250015300287", sealine: null },
            { cont_id: "JKTLYT136860V", so_id: "250015300288", sealine: null },
            { cont_id: "JKTAKL136819V", so_id: "250015300289", sealine: null },
            { cont_id: "JKTAKL136820V", so_id: "250015300290", sealine: null },
            { cont_id: "JKTAKL136795V", so_id: "250015300291", sealine: null },
            { cont_id: "JKTAKL136847V", so_id: "250015300292", sealine: null },
            { cont_id: "JKTAKL136858V", so_id: "250015300293", sealine: null },
            { cont_id: "JKTAKL136782V", so_id: "250015300294", sealine: null },
            { cont_id: "JKTAKL136821V", so_id: "250015300295", sealine: null },
            { cont_id: "JKTAKL136828V", so_id: "250015300296", sealine: null },
            { cont_id: "JKTAKL136842V", so_id: "250015300297", sealine: null },
            { cont_id: "JKTAKL136841V", so_id: "250015300298", sealine: null },
            { cont_id: "JKTAKL136859V", so_id: "250015300299", sealine: null },
            { cont_id: "JKTAKL136848V", so_id: "250015300304", sealine: null },
            { cont_id: "JKTHIR2543S008", so_id: "250015700026", sealine: null },
            { cont_id: "JKTHIR2545S001", so_id: "250015700028", sealine: null },
            { cont_id: "JKTHIR2545S016", so_id: "250015700028", sealine: null },
            { cont_id: "JKTHIR2545S017", so_id: "250015700028", sealine: null },
            { cont_id: "JKTHIR2545S015", so_id: "250015700029", sealine: null },
            { cont_id: "COIN25000377", so_id: "250016200008", sealine: null },
            { cont_id: "KMTCJKT5280938", so_id: "250017100091", sealine: null },
            { cont_id: "KMTCJKT5282793", so_id: "250017100094", sealine: null },
            { cont_id: "KMTCJKT5280965", so_id: "250017100098", sealine: null },
            { cont_id: "SUBCW25048555", so_id: "250017200042", sealine: null },
            { cont_id: "JKT25012917", so_id: "250017200043", sealine: null },
            { cont_id: "KTJ0294381B", so_id: "250017200044", sealine: null },
            { cont_id: "SUBCW25048966", so_id: "250017200048", sealine: null },
            { cont_id: "SUBCW25050545", so_id: "250017200049", sealine: null },
            { cont_id: "JKTMTK2545S008", so_id: "250017300267", sealine: null },
            { cont_id: "JKTMTK2545S013", so_id: "250017300268", sealine: null },
            { cont_id: "JKTCW25036863", so_id: "250017300269", sealine: null },
            { cont_id: "JKTCW25037075", so_id: "250017300271", sealine: null },
            { cont_id: "JKT25012910", so_id: "250017300272", sealine: null },
            { cont_id: "ID00557900", so_id: "250017300302", sealine: null },
            { cont_id: "JKTCW25037970", so_id: "250017300304", sealine: null },
            { cont_id: "JKT25012909", so_id: "250017300305", sealine: null },
            { cont_id: "JKSCB25019372", so_id: "250018100143", sealine: null },
            { cont_id: "JKSCB25018048", so_id: "250018100144", sealine: null },
            { cont_id: "JKSCB25019364", so_id: "250018100148", sealine: null },
            { cont_id: "JKT500524800", so_id: "250018300053", sealine: null },
            { cont_id: "DJA1414969", so_id: "250018700049", sealine: null },
            { cont_id: "DJA1414967", so_id: "250018700050", sealine: null },
            { cont_id: "JKTCW25034146", so_id: "250019800127", sealine: null },
            { cont_id: "ID00571800", so_id: "250020000009", sealine: null },
            { cont_id: "JKTLAE2545S007", so_id: "250022600061", sealine: null },
            { cont_id: "ID00545600", so_id: "250022600064", sealine: null },
            { cont_id: "JKTLAE2545S014", so_id: "250022600069", sealine: null },
            { cont_id: "JKT25012923", so_id: "250022600070", sealine: null },
            { cont_id: "KTJ0294381A", so_id: "250022600071", sealine: null },
            { cont_id: "KTJ0294381C", so_id: "250022600072", sealine: null },
            { cont_id: "EGLV080500541654", so_id: "250024800055", sealine: null },
            { cont_id: "EGLV080500490880", so_id: "250024800055", sealine: null },
            { cont_id: "EGLV080500427312", so_id: "250024800057", sealine: null },
            { cont_id: "EGLV080500490872", so_id: "250024800057", sealine: null },
            { cont_id: "EGLV08050043959", so_id: "250024800084", sealine: null },
            { cont_id: "EGLV080500456967", so_id: "250024800091", sealine: null },
            { cont_id: "EGLV080500484103", so_id: "250024800093", sealine: null },
            { cont_id: "EGLV080500569796", so_id: "250024800095", sealine: null },
            { cont_id: "EGLV080500541582", so_id: "250024800096", sealine: null },
            { cont_id: "EGLV080500541727", so_id: "250024800097", sealine: null },
            { cont_id: "EGLV080500427321", so_id: "250024800101", sealine: null },
            { cont_id: "EGLV080500500583", so_id: "250024800118", sealine: null },
            { cont_id: "EGLV080500490863", so_id: "250024800131", sealine: null },
            { cont_id: "EGLV080500484112", so_id: "250024800132", sealine: null },
            { cont_id: "EGLV080500541565", so_id: "250024800134", sealine: null },
            { cont_id: "EGLV080500536260", so_id: "250024800135", sealine: null },
            { cont_id: "EGLV080500500648", so_id: "250024800137", sealine: null },
            { cont_id: "DJA1415052", so_id: "250028100076", sealine: null },
            { cont_id: "JKT500521601", so_id: "250028100080", sealine: null },
            { cont_id: "DJA1415194A", so_id: "250028100080", sealine: null },
            { cont_id: "JKT500520500", so_id: "250028100081", sealine: null },
            { cont_id: "JKT500521600", so_id: "250028100081", sealine: null },
            { cont_id: "DJA1415194B", so_id: "250028100081", sealine: null },
            { cont_id: "EGLV091500555430", so_id: "250033000650", sealine: null },
            { cont_id: "EGLV091500555448", so_id: "250033000651", sealine: null },
            { cont_id: "EGLV091500555472", so_id: "250033000652", sealine: null },
            { cont_id: "EGLV091500562240", so_id: "250033000653", sealine: null },
            { cont_id: "EGLV091500555422", so_id: "250033000654", sealine: null },
            { cont_id: "EGLV091500555413", so_id: "250033000655", sealine: null },
            { cont_id: "EGLV091500562232", so_id: "250033000659", sealine: null },
            { cont_id: "MAEU260811083", so_id: "250034400185", sealine: null },
            { cont_id: "MAEU260937444", so_id: "250034400185", sealine: null },
            { cont_id: "MAEU260811118", so_id: "250034400189", sealine: null },
            { cont_id: "MAEU260937481", so_id: "250034400189", sealine: null },
            { cont_id: "7614ZA214214", so_id: "250049900006", sealine: null },
            { cont_id: "JKTCPT25100614", so_id: "250049900007", sealine: null },
            { cont_id: "JKTCPT2510063", so_id: "250049900008", sealine: null },
            { cont_id: "7614ZA229434", so_id: "250049900020", sealine: null },
            { cont_id: "7614ZA229421", so_id: "250049900021", sealine: null },
            { cont_id: "JKT500524900", so_id: "250054600090", sealine: null },
            { cont_id: "JKT500525000", so_id: "250054600091", sealine: null },
            { cont_id: "JKT500525100", so_id: "250054600092", sealine: null },
            { cont_id: "JKT500525200", so_id: "250054600093", sealine: null },
            { cont_id: "JKT500525300", so_id: "250054600094", sealine: null },
            { cont_id: "JKT500530800", so_id: "250054600095", sealine: null },
            { cont_id: "JKT500530900", so_id: "250054600096", sealine: null },
            { cont_id: "JKT500531000", so_id: "250054600097", sealine: null },
            { cont_id: "JKT500531100", so_id: "250054600098", sealine: null },
            { cont_id: "ONEYJKTF86555900", so_id: "250057300014", sealine: null },
            { cont_id: "KMTCJKT53177841", so_id: "250010400227", sealine: null },
            { cont_id: "OOLU2314389800", so_id: "250010700608", sealine: null },
            { cont_id: "OOLU2314389980", so_id: "250010700613", sealine: null },
            { cont_id: "OOLU2314134650", so_id: "250010700635", sealine: null },
            { cont_id: "OOLU2314134680", so_id: "250010700637", sealine: null },
            { cont_id: "OOLU2312823760", so_id: "250010700649", sealine: null },
            { cont_id: "OOLU2314390690", so_id: "250010700653", sealine: null },
            { cont_id: "OOLU2313455800", so_id: "250010700654", sealine: null },
            { cont_id: "OOLU2313455950", so_id: "250010700655", sealine: null },
            { cont_id: "OOLU2314390580", so_id: "250010700656", sealine: null },
            { cont_id: "JKTSYD136923V", so_id: "250010800058", sealine: null },
            { cont_id: "440510025672", so_id: "250011601494", sealine: null },
            { cont_id: "SNKO073251101256", so_id: "250011601627", sealine: null },
            { cont_id: "SNKO073251101117", so_id: "250011601686", sealine: null },
            { cont_id: "SNKO073251101257", so_id: "250011601696", sealine: null },
            { cont_id: "440510024811", so_id: "250011700008", sealine: null },
            { cont_id: "A49FA03061", so_id: "250014500272", sealine: null },
            { cont_id: "A49FA03252", so_id: "250014500295", sealine: null },
            { cont_id: "A49FA03253", so_id: "250014500304", sealine: null },
            { cont_id: "MAEU261504899", so_id: "250014500311", sealine: null },
            { cont_id: "MAEU261504971", so_id: "250014500316", sealine: null },
            { cont_id: "MAEU261965332", so_id: "250014500319", sealine: null },
            { cont_id: "COAU7264231540", so_id: "250014500321", sealine: null },
            { cont_id: "MAEU261504593", so_id: "250014500327", sealine: null },
            { cont_id: "MAEU261504459", so_id: "250014500328", sealine: null },
            { cont_id: "JKTLYT136877V", so_id: "250015300300", sealine: null },
            { cont_id: "JKTAKL136919V", so_id: "250015300301", sealine: null },
            { cont_id: "JKTAKL136937V", so_id: "250015300302", sealine: null },
            { cont_id: "JKTAKL136944V", so_id: "250015300303", sealine: null },
            { cont_id: "JKTAKL136875V", so_id: "250015300305", sealine: null },
            { cont_id: "JKTAKL136880V", so_id: "250015300306", sealine: null },
            { cont_id: "JKTAKL136918V", so_id: "250015300307", sealine: null },
            { cont_id: "JKTAKL136927V", so_id: "250015300308", sealine: null },
            { cont_id: "JKTAKL136931V", so_id: "250015300309", sealine: null },
            { cont_id: "JKTAKL136898V", so_id: "250015300310", sealine: null },
            { cont_id: "JKTAKL136956V", so_id: "250015300311", sealine: null },
            { cont_id: "JKTAKL136958V", so_id: "250015300312", sealine: null },
            { cont_id: "JKTAKL136957V", so_id: "250015300313", sealine: null },
            { cont_id: "JKTAKL136960V", so_id: "250015300314", sealine: null },
            { cont_id: "JKTAKL136961V", so_id: "250015300315", sealine: null },
            { cont_id: "JKTAKL136935V", so_id: "250015300317", sealine: null },
            { cont_id: "JKTAKL136936V", so_id: "250015300318", sealine: null },
            { cont_id: "JKTAKL136928V", so_id: "250015300319", sealine: null },
            { cont_id: "JKTHIR2550S001", so_id: "250015700030", sealine: null },
            { cont_id: "JKTHIR2550S016", so_id: "250015700030", sealine: null },
            { cont_id: "ID00586600", so_id: "250016300034", sealine: null },
            { cont_id: "KMTCJKT5328002", so_id: "250017100115", sealine: null },
            { cont_id: "EGLV080500627770", so_id: "250017100119", sealine: null },
            { cont_id: "KTJ0296235C", so_id: "250017200047", sealine: null },
            { cont_id: "KTJ0296235B", so_id: "250017200050", sealine: null },
            { cont_id: "KTJ0296274B", so_id: "250017200052", sealine: null },
            { cont_id: "KTJ0297118", so_id: "250017200053", sealine: null },
            { cont_id: "KTJ0296274A", so_id: "250017200054", sealine: null },
            { cont_id: "ID00573000", so_id: "250017200055", sealine: null },
            { cont_id: "ID00604000", so_id: "250017200056", sealine: null },
            { cont_id: "KTJ0297116C", so_id: "250017200058", sealine: null },
            { cont_id: "KTJ0297116B", so_id: "250017200059", sealine: null },
            { cont_id: "JKSCB25020251", so_id: "250018100152", sealine: null },
            { cont_id: "JKT500596600", so_id: "250018300069", sealine: null },
            { cont_id: "JKT500597000", so_id: "250018400050", sealine: null },
            { cont_id: "HLCUJK1251128087", so_id: "250018400051", sealine: null },
            { cont_id: "HLCUJK1251128105", so_id: "250018400052", sealine: null },
            { cont_id: "049FX13283", so_id: "250019500243", sealine: null },
            { cont_id: "049FX13665", so_id: "250019500251", sealine: null },
            { cont_id: "049FX13695", so_id: "250019500256", sealine: null },
            { cont_id: "SUBCB2505280802", so_id: "250019800141", sealine: null },
            { cont_id: "SUBCB2505503306", so_id: "250019800146", sealine: null },
            { cont_id: "ID00591000", so_id: "250019800147", sealine: null },
            { cont_id: "SNKO073251101149", so_id: "250021600155", sealine: null },
            { cont_id: "MAEU261789644", so_id: "250021600155", sealine: null },
            { cont_id: "SNKO073251101122", so_id: "250021600155", sealine: null },
            { cont_id: "SNKO073251001827", so_id: "250021600159", sealine: null },
            { cont_id: "SNKO073251101150", so_id: "250021600159", sealine: null },
            { cont_id: "EGLV080500578931", so_id: "250021600162", sealine: null },
            { cont_id: "EGLV080500631874", so_id: "250021600162", sealine: null },
            { cont_id: "KTJ0296233A", so_id: "250022600065", sealine: null },
            { cont_id: "KTJ0296233B", so_id: "250022600065", sealine: null },
            { cont_id: "KTJ0296235A", so_id: "250022600073", sealine: null },
            { cont_id: "KTJ0297117", so_id: "250022600076", sealine: null },
            { cont_id: "KTJ0296233C", so_id: "250022600077", sealine: null },
            { cont_id: "KTJ0297116A", so_id: "250022600078", sealine: null },
            { cont_id: "EGLV080500541522", so_id: "250024800138", sealine: null },
            { cont_id: "DJA1422450", so_id: "250028100088", sealine: null },
            { cont_id: "KMTCJKT5314956", so_id: "250028100090", sealine: null },
            { cont_id: "KMTCJKT5319957", so_id: "250028100090", sealine: null },
            { cont_id: "JKT500599500", so_id: "250028100094", sealine: null },
            { cont_id: "JKT500599501", so_id: "250028100094", sealine: null },
            { cont_id: "EGLV081500321687", so_id: "250028800099", sealine: null },
            { cont_id: "EGLV080500638836", so_id: "250028800101", sealine: null },
            { cont_id: "EGLV081500311215", so_id: "250028800103", sealine: null },
            { cont_id: "KMTCJKT5313003", so_id: "250029000085", sealine: null },
            { cont_id: "3100116387", so_id: "250029200042", sealine: null },
            { cont_id: "3100117057", so_id: "250029200042", sealine: null },
            { cont_id: "3100116380", so_id: "250029200047", sealine: null },
            { cont_id: "3100116385", so_id: "250029200047", sealine: null },
            { cont_id: "EGLV080500601992", so_id: "250033000693", sealine: null },
            { cont_id: "ONEYJKTF93215701", so_id: "250034400201", sealine: null },
            { cont_id: "ONEYJKTF93215700", so_id: "250034400203", sealine: null },
            { cont_id: "ONEYSUBF35778800", so_id: "250034400206", sealine: null },
            { cont_id: "ONEYSUBF35777702", so_id: "250034400210", sealine: null },
            { cont_id: "ONEYJKTF95465900", so_id: "250043100094", sealine: null },
            { cont_id: "SUBCB25055909", so_id: "250049300011", sealine: null },
            { cont_id: "7614ZA229434", so_id: "250049900020", sealine: null },
            { cont_id: "7614ZA229421", so_id: "250049900021", sealine: null },
            { cont_id: "7614ZA236418", so_id: "250049900022", sealine: null },
            { cont_id: "7614ZA237941", so_id: "250049900023", sealine: null },
            { cont_id: "JKT500524900", so_id: "250054600090", sealine: null },
            { cont_id: "JKT500525000", so_id: "250054600091", sealine: null },
            { cont_id: "JKT500525100", so_id: "250054600092", sealine: null },
            { cont_id: "JKT500525200", so_id: "250054600093", sealine: null },
            { cont_id: "JKT500525300", so_id: "250054600094", sealine: null },
            { cont_id: "JKT500530800", so_id: "250054600095", sealine: null },
            { cont_id: "JKT500530900", so_id: "250054600096", sealine: null },
            { cont_id: "JKT500531000", so_id: "250054600097", sealine: null },
            { cont_id: "JKT500531100", so_id: "250054600098", sealine: null },
            { cont_id: "ONEYJKTF95336600", so_id: "250054600102", sealine: null },
            { cont_id: "ONEYJKTF95339900", so_id: "250054600116", sealine: null },
            { cont_id: "ONEYJKTF95341900", so_id: "250054600117", sealine: null },
            { cont_id: "ONEYJKTF95344500", so_id: "250054600118", sealine: null },
            { cont_id: "ONEYJKTF95346700", so_id: "250054600119", sealine: null },
            { cont_id: "ONEYJKTF95386400", so_id: "250054600120", sealine: null },
            { cont_id: "GMSUJKT8220074", so_id: "250057300014", sealine: null },
            { cont_id: "ONEYJKTF86555900", so_id: "250057300014", sealine: null },
            { cont_id: "GMSUJKT8120074", so_id: "250057300015", sealine: null },


        ]

        if (blNumbers.length > 0) {
            console.log("🚀 Starting BL tracking...");
            await trackMultipleBLs();
        } else {
            console.log("⚠️ No BL numbers found. Skipping BL tracking.");
        }

        // if (ctNumbers.length > 0) {
        //     console.log("🚀 Starting CT tracking...");
        //     await trackMultipleCTs();
        // } else {
        //     console.log("⚠️ No CT numbers found. Skipping CT tracking.");
        // }

    }

    async function datetrack(startDate, endDate) {

        console.log("🔍 Tracking BL numbers first...");




        const blNumbers = await findBLNumberManual(startDate, endDate);

        if (blNumbers.length > 0) {
            console.log("🚀 Starting BL tracking...");
            await trackMultipleBLs();
        } else {
            console.log("⚠️ No BL numbers found. Skipping BL tracking.");
        }

    }

    async function querytrack(number, soid) {

        console.log("🔍 Tracking BL numbers first...");

        blNumbers = [
            { cont_id: number, so_id: soid },
        ];



        if (blNumbers.length > 0) {
            console.log("🚀 Starting BL tracking...");
            await trackMultipleBLs();
        } else {
            console.log("⚠️ No BL numbers found. Skipping BL tracking.");
        }

    }

    return {
        trackMultipleBLs,
        trackMultipleCTs,
        findCTNumber,
        findBLNumber,
        manualtrack,
        datetrack,
        querytrack
    };

}

module.exports = { runCheck };
