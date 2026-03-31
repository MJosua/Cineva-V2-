// Dependencies
const { default: axios } = require("axios");
const cron = require("node-cron");
const { dbConf, dbQuery, dbEOrder } = require("../../config/db");

// Handle dynamic path for SeaRates Tracking Engine (Dev vs Prod/Standalone)
const path = require('path');
const fs = require('fs');
let trackingEnginePath = "../../../../service/searates/trackingEngine";
if (!fs.existsSync(path.join(__dirname, trackingEnginePath + ".js"))) {
    // Fallback for standalone production environment (vendored)
    trackingEnginePath = "../../shared_services/service/searates/trackingEngine";
}
const { createSeaRatesTrackingEngine } = require(trackingEnginePath);

const apiKey = process.env.SECURITY_API_SEARATES_KEY; // Use environment variable for security
const { eorderDelivered } = require('../../mailer/eorder/eorder_mailer');
const { i2iDelivered } = require("../../mailer/i2i/i2i_mailer");
const ALLOWED_TRACKING_TYPES = new Set(['bl', 'bk', 'ct']);
const inFlightTracking = new Set();
let bypassQuotaFlag = false;
let silentModeFlag = true;
const sharedTrackingEngine = createSeaRatesTrackingEngine({
    apiKey,
    axiosInstance: axios,
    dbQuery,
    reserveQuotaSlot: (...args) => _reserveQuotaSlot(...args),
    finalizeReservedApiHit: (...args) => _finalizeReservedApiHit(...args),
    redactUrl: _redactUrl,
    logger: console
});

function normalizeTrackingNumber(value) {
    return sharedTrackingEngine.normalizeTrackingNumber(value);
}

function toNumericInvoiceId(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

if (!apiKey) {
    console.error("[INFO] CRITICAL: SECURITY_API_SEARATES_KEY environment variable is not set!");
    console.error("   Please set SECURITY_API_SEARATES_KEY in your .env file to enable Searates tracking.");
}

/**
 * Redact API key from Searates URL
 * @param {string} url 
 * @returns {string}
 */
function _redactUrl(url) {
    if (!url) return null;
    return url.replace(/api_key=[^&]+/, "api_key=HIDDEN");
}

/**
 * Check if API quota is still available for today (Unified with main backend)
 */
async function _checkAndQuotaAllowed() {
    try {
        const configRows = await dbQuery("SELECT daily_limit FROM sea_rates.api_quota_config WHERE api_name = 'searates_tracking' LIMIT 1");
        const limit = Math.min(configRows?.[0]?.daily_limit ?? 200, 200); // Strict hard cap at 200


        const usageRows = await dbQuery(`
            SELECT COUNT(*) as count 
            FROM sea_rates.api_usage_log 
            WHERE api_name = 'searates_tracking' 
            AND DATE(hit_timestamp) = CURDATE()
            AND status_code NOT IN ('LIMIT', 'LIMIT_ALERT')
        `);
        const usageCount = Number(usageRows?.[0]?.count ?? 0);

        return {
            allowed: usageCount < limit,
            usageCount: usageCount,
            limit: limit
        };
    } catch (err) {
        console.error("[INFO] Error checking quota:", err.message);
        return { allowed: true, usageCount: 0, limit: 200 };
    }
}

/**
 * Log an API hit attempt (Unified with main backend)
 */
async function _logApiHit(number, so_id, status, errorData = null, url = null, source = 'FRONTEND', requestedBy = 'SYSTEM', trackingType = null) {
    try {
        const detail = {
            data: errorData,
            url: _redactUrl(url),
            timestamp: new Date().toISOString()
        };
        await dbQuery(`
            INSERT INTO sea_rates.api_usage_log (api_name, tracking_number, so_id, status_code, tracking_type, error_details_json, request_source, requested_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'searates_tracking',
            number || null,
            so_id || 0,
            status,
            trackingType || null,
            JSON.stringify(detail),
            source,
            requestedBy
        ]);
    } catch (err) {
        console.error("[INFO] Error logging API hit:", err.message);
    }
}

async function _saveProviderQuotaSnapshot(quotaData) {
    if (!quotaData || !quotaData.api_calls || !quotaData.unique_shipments) return;
    
    try {
        // Throttle: Only save if no snapshot in the last 15 minutes to avoid spamming the history table
        const [recent] = await dbQuery(`
            SELECT id FROM sea_rates.api_quota_usage_history 
            WHERE snapshot_timestamp > DATE_SUB(NOW(), INTERVAL 15 MINUTE) 
            LIMIT 1
        `);
        
        if (recent?.length) return;

        await dbQuery(`
            INSERT INTO sea_rates.api_quota_usage_history (
                api_calls_total, api_calls_used, api_calls_remaining,
                unique_shipments_total, unique_shipments_used, unique_shipments_remaining
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            quotaData.api_calls.total || 600000,
            quotaData.api_calls.used || 0,
            quotaData.api_calls.remaining || 0,
            quotaData.unique_shipments.total || 20000,
            quotaData.unique_shipments.used || 0,
            quotaData.unique_shipments.remaining || 0
        ]);
    } catch (err) {
        console.error("[INFO] Error saving provider quota snapshot:", err.message);
    }
}

async function _reserveQuotaSlot(number, so_id, source = 'FRONTEND', requestedBy = 'SYSTEM', trackingType = null) {
    let connection;
    try {
        connection = await dbConf.getConnection();
        await connection.beginTransaction();

        const [configRows] = await connection.execute(
            "SELECT daily_limit FROM sea_rates.api_quota_config WHERE api_name = 'searates_tracking' LIMIT 1 FOR UPDATE"
        );
        const limit = Math.min(configRows?.[0]?.daily_limit ?? 200, 200);

        const [usageRows] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM sea_rates.api_usage_log
            WHERE api_name = 'searates_tracking'
            AND DATE(hit_timestamp) = CURDATE()
            AND status_code NOT IN ('LIMIT', 'LIMIT_ALERT')
        `);
        const usageCount = Number(usageRows?.[0]?.count ?? 0);
        const isBypassed = bypassQuotaFlag === true;

        if (usageCount >= limit && !isBypassed) {
            await connection.rollback();
            return {
                allowed: false,
                usageCount,
                limit,
                logId: null
            };
        }

        const [insertResult] = await connection.execute(`
            INSERT INTO sea_rates.api_usage_log (api_name, tracking_number, so_id, status_code, tracking_type, request_source, requested_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            'searates_tracking',
            number || null,
            so_id || 0,
            bypassQuotaFlag ? 'BYPASS_PENDING' : 'PENDING',
            trackingType || null,
            source,
            requestedBy
        ]);

        await connection.commit();
        return {
            allowed: true,
            usageCount: usageCount + 1,
            limit,
            logId: insertResult.insertId
        };
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error("[INFO] Error reserving quota slot:", err.message);
        return { allowed: true, usageCount: 0, limit: 200, logId: null };
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function _finalizeReservedApiHit(logId, status, errorData = null, url = null) {
    if (!logId) return;
    try {
        const detail = {
            data: errorData,
            url: _redactUrl(url),
            timestamp: new Date().toISOString()
        };
        await dbQuery(`
            UPDATE sea_rates.api_usage_log
            SET status_code = ?, error_details_json = ?
            WHERE log_id = ?
        `, [status, JSON.stringify(detail), logId]);
    } catch (err) {
        console.error("[INFO] Error finalizing API hit:", err.message);
    }
}

async function _createHotsAlertTicket(number, type = 'LIMIT', source = 'FRONTEND', requestedBy = 'SYSTEM', sealine = 'auto', errorData = null) {
    try {
        const normalizedNumber = sharedTrackingEngine.normalizeTrackingNumber(number);
        const alertCode = type === 'LIMIT' ? 'LIMIT_ALERT' : 'MAPPING_ALERT';
        const description = type === 'LIMIT'
            ? `SeaRates daily limit exceeded. Triggered by ${normalizedNumber}.`
            : `Missing carrier mapping for Shipping Line/Forwarder related to ${normalizedNumber}. SeaRates tracking used 'auto' mode which may be less accurate.`;

        // Attempt to extract so_id if not provided
        const providedSoId = errorData?.soId || errorData?.so_id;

        // Fetch extended metadata from IOD
        const [meta] = await dbQuery(`
            SELECT 
                r.so_id, so.so_number, r.po_number, c.company_name as distributor,
                r.eta as baseline_eta, r.etd as baseline_etd
            FROM iod.trs_realization r
            LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id AND r.cont_id = i.cont_id
            LEFT JOIN iod.trs_sales_order so ON r.so_id = so.so_id
            LEFT JOIN iod.mst_company c ON so.bill_to_party = c.company_id
            WHERE (r.so_id = ? AND ? > 0)
               OR (REPLACE(REPLACE(r.cont_id, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', ''))
               OR (REPLACE(REPLACE(r.book_no, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', ''))
               OR (REPLACE(REPLACE(i.bl_no, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', ''))
            LIMIT 1
        `, [providedSoId, providedSoId, normalizedNumber, normalizedNumber, normalizedNumber]);

        const soId = meta?.so_id || 0;
        const soNumber = meta?.so_number || 'N/A';
        const poNumber = meta?.po_number || 'N/A';
        const distributor = meta?.distributor || 'N/A';
        const baselineEtd = meta?.baseline_etd || 'N/A';
        const baselineEta = meta?.baseline_eta || 'N/A';

        const dateNow = new Date().toISOString().slice(0, 10);
        const dynamicTitle = `shipment tracking ${normalizedNumber} ${sealine} ${dateNow}`;

        // Anti-spam check (one per day per type per normalized number)
        const existingAlert = await dbQuery(`
            SELECT log_id FROM sea_rates.api_usage_log
            WHERE REPLACE(REPLACE(tracking_number, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', '')
            AND api_name = 'searates_tracking'
            AND status_code = ?
            AND DATE(hit_timestamp) = CURDATE()
            LIMIT 1
        `, [normalizedNumber, alertCode]);

        if (existingAlert?.length) return;

        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const prefix = `26${dateStr}07`;

        const lastTicketRows = await dbQuery(`SELECT ticket_id FROM hots.t_ticket WHERE ticket_id LIKE ? ORDER BY ticket_id DESC LIMIT 1`, [`${prefix}%`]);
        let seq = 1;
        if (lastTicketRows?.length) seq = parseInt(lastTicketRows[0].ticket_id.slice(-4), 10) + 1;
        
        let ticketId = `${prefix}${seq.toString().padStart(4, '0')}`;
        let created = false;
        let attempts = 0;

        while (!created && attempts < 10) {
            try {
                // 1. Create Ticket (Service 23: IT Project / HOTS)
                await dbQuery(`
                    INSERT INTO hots.t_ticket 
                    (ticket_id, service_id, service_name, status_id, created_by, creation_date, last_update, workflow_step, title) 
                    VALUES (?, 23, 'shipment tracking', 1, 1253, NOW(), NOW(), 1, ?)
                `, [ticketId, dynamicTitle]);
                created = true;
            } catch (e) {
                if (e.code === 'ER_DUP_ENTRY') {
                    seq++;
                    ticketId = `${prefix}${seq.toString().padStart(4, '0')}`;
                    attempts++;
                } else {
                    throw e;
                }
            }
        }

        // 2. Assign to Team 24 (Shipment Tracking Team)
        const assignResult = await dbQuery(`INSERT INTO hots.t_ticket_assignment (ticket_id, assigned_type, assigned_id, assignment_status, assigned_at) VALUES (?, 'team', 24, 'active', NOW())`, [ticketId]);
        const assignmentId = assignResult.insertId;

        // 3. Modular Ticket Details (app_data)
        const enrichedTimeline = `<p>🚨 <strong>Searates Alert:</strong></p><p><strong>Case :</strong> ${type}</p><p><strong>Timestamp :</strong> ${new Date().toLocaleString()}</p><p><strong>Source :</strong> ${source}</p><br/><p>📦 <strong>Shipment Details</strong></p><p><strong>Tracking Number :</strong> ${normalizedNumber}</p><p><strong>Sealine :</strong> ${sealine}</p><p><strong>SO ID :</strong> ${soId} / ${soNumber}</p><p><strong>PO Number :</strong> ${poNumber}</p><p><strong>Distributor :</strong> ${distributor}</p><br/><p>📅 <strong>Schedule Info</strong></p><p><strong>Baseline ETD :</strong> ${baselineEtd}</p><p><strong>Baseline ETA :</strong> ${baselineEta}</p><p><strong>Execution Status :</strong> ${type}</p><br/><p>⚙️ <strong>Data Context</strong></p><p>${description}</p><p><strong>Technical Logs :</strong> ${errorData ? JSON.stringify(errorData) : 'None'}</p>`;

        const workDetails = [
            [ticketId, 0, 23, 'app_data', ticketId, 'project_title', dynamicTitle, 1253, ticketId, 0, 'initial_data', ticketId, 1, 0, 1],
            [ticketId, 0, 23, 'app_data', ticketId, 'project_description', enrichedTimeline, 1253, ticketId, 0, 'initial_data', ticketId, 1, 0, 1],
            [ticketId, 0, 23, 'app_data', ticketId, 'project_category', 'shipment tracking', 1253, ticketId, 0, 'initial_data', ticketId, 1, 0, 1],
            [ticketId, 0, 23, 'app_data', ticketId, 'priority', 'medium', 1253, ticketId, 0, 'initial_data', ticketId, 1, 0, 1],
            [ticketId, 0, 23, 'app_data', ticketId, 'initial_notes', enrichedTimeline, 1253, ticketId, 0, 'initial_data', ticketId, 1, 0, 1]
        ];
        await dbQuery(`
            INSERT INTO hots.t_ticket_work_data
            (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value,
             created_by, root_ticket_id, ticket_depth, entry_type, timeline_group_id, is_latest, is_hidden, company_id)
            VALUES ?
        `, [workDetails]);

        // 4. Kanban Configuration (t_ticket_work_data_env)
        await dbQuery(`
            INSERT INTO hots.t_ticket_work_data_env (entity_id, ticket_id, root_ticket_id, status, sort_order) VALUES (?, ?, ?, 'todo', 0)
        `, [ticketId, ticketId, ticketId]);

        // 5. Rich Activity Timeline (t_ticket_work_data_report)
        await dbQuery(`
            INSERT INTO hots.t_ticket_work_data_report (entity_id, ticket_id, assignment_id, content, created_by) VALUES (?, ?, ?, ?, 1253)
        `, [ticketId, ticketId, assignmentId, enrichedTimeline]);

        // 6. Legacy Support (t_ticket_detail)
        const details = [
            [ticketId, 'requester_name', 'Requester Name', 'System Alert (SeaRates)', null, 'text', null, null, 0, JSON.stringify({ label: 'Requester Name' })],
            [ticketId, 'issue_description', 'Issue Description', description, null, 'textarea', null, null, 0, JSON.stringify({ label: 'Issue Description' })],
            [ticketId, 'category', 'Category', 'shipment tracking', null, 'text', null, null, 0, JSON.stringify({ label: 'Category' })]
        ];
        await dbQuery('INSERT INTO hots.t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?', [details]);
    } catch (err) {
        console.error("[INFO] Failed to create enriched alert ticket:", err.message);
    }
}

async function _syncToOnlineOrder(number, type, ata, atd, scac) {
    try {
        const normalizedType = type === 'ct' ? 'CONT' : type === 'bk' ? 'BOOK' : 'BL';
        
        const findSOQuery = `
            SELECT DISTINCT r.so_id, r.invoice_id
            FROM iod.trs_realization r
            LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id AND r.cont_id = i.cont_id
            WHERE REPLACE(REPLACE(r.cont_id, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', '')
               OR REPLACE(REPLACE(r.book_no, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', '')
               OR REPLACE(REPLACE(i.bl_no, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', '')
        `;
        const sos = await dbQuery(findSOQuery, [number, number, number]);

        if (!sos?.length) return;

        const soIds = sos.map(s => s.so_id);

        // 2. Batch Update trs_realization_searates
        const updateRealizationQuery = `
            INSERT INTO iod.trs_realization_searates (so_id, invoice_id, number, type, ata, atd, scac)
            SELECT so_id, invoice_id, ?, ?, ?, ?, ? FROM iod.trs_realization WHERE so_id IN (?)
            ON DUPLICATE KEY UPDATE invoice_id = VALUES(invoice_id), type = VALUES(type), ata = VALUES(ata), atd = VALUES(atd), scac = VALUES(scac)
        `;
        await dbQuery(updateRealizationQuery, [number, normalizedType, ata, atd, scac, soIds]);

        // 3. Batch Auto-close Orders if Arrived
        if (ata) {
            const updateOrderQuery = `
                UPDATE iod.m_order mo
                JOIN iod.trs_sales_order tso ON mo.order_id = tso.e_order
                SET mo.status = 4
                WHERE tso.so_id IN (?) AND mo.status < 4
            `;
            await dbQuery(updateOrderQuery, [soIds]);
            console.log(`[INFO] Group updated ${soIds.length} orders to DELIVERED for ${number}.`);

            // 4. Silent Mode Suppression: Register in event_logger to prevent automation emails
            if (silentModeFlag) {
                console.log(`[INFO] Silent Mode Active: Suppressing emails for ${number}...`);
                try {
                    // event_type 2 is 'shipping arrival' notification in notification.js
                    const suppressionQuery = `
                        INSERT INTO iod.event_logger (order_id, event_type, is_notified, login_trial_time, user_id)
                        SELECT mo.order_id, 2, 1, NOW(), COALESCE(mo.created_by, 1253)
                        FROM iod.m_order mo
                        JOIN iod.trs_sales_order tso ON mo.order_id = tso.e_order
                        WHERE tso.so_id IN (?)
                        ON DUPLICATE KEY UPDATE is_notified = 1, login_trial_time = NOW()
                    `;
                    await dbQuery(suppressionQuery, [soIds]);
                } catch (suppressErr) {
                    console.error("[INFO] Failed to suppress emails in event_logger:", suppressErr.message);
                }
            }
        }
    } catch (err) { console.error("[INFO] Error syncing to Online Order:", err.message); }
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
                    SELECT
                        tracking_number,
                        final_tracking_type,
                        so_id,
                        sealine,
                        MAX(last_updated_date) as last_updated_date,
                        MAX(eta) as eta,
                        MAX(etd) as etd,
                        MAX(internal_etd) as internal_etd,
                        MIN(priority) as priority,
                        MAX(mapping_missing) as mapping_missing
                    FROM (
                        SELECT
                            r.so_id, r.eta, r.etd, r.etd as internal_etd, msl.scac as sealine, s.last_updated_date,
                            CASE
                                WHEN (DATE(r.eta) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                     OR (DATE(r.etd) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                THEN 1
                                WHEN (DATE(r.eta) BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY))
                                     OR (DATE(r.etd) BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY))
                                THEN 2
                                ELSE 3
                            END as priority,
                            CASE WHEN msl.scac IS NULL THEN 1 ELSE 0 END as mapping_missing,
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
                         LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id AND r.cont_id = i.cont_id
                         LEFT JOIN iod.trs_realization_searates ts ON r.so_id = ts.so_id
                         LEFT JOIN sea_rates.m_shipping_line msl ON
                             (r.ship_line IS NOT NULL AND msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%')) OR
                             (r.fwd IS NOT NULL AND msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%'))
                         LEFT JOIN iod.mst_container mc ON r.cont_size = mc.container_id
                         LEFT JOIN (
                            SELECT
                                number AS normalized_number,
                                MAX(last_updated_date) AS last_updated_date,
                                MAX(
                                    CASE
                                        WHEN LOWER(COALESCE(status, '')) LIKE '%arrival%'
                                          OR LOWER(COALESCE(status, '')) LIKE '%delivered%'
                                        THEN 1 ELSE 0
                                    END
                                ) AS has_arrived
                            FROM sea_rates.shipments
                            WHERE number IS NOT NULL AND TRIM(number) != ''
                            GROUP BY number
                         ) s ON CASE
                            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
                            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
                            ELSE i.bl_no
                         END = s.normalized_number
                         WHERE i.bl_no IS NOT NULL AND r.eta < '9000-01-01' AND r.etd <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                         AND (UPPER(COALESCE(mc.container_name, '')) NOT IN ('TRUCK', '1 TRUCK', 'PLANE', '1 FLIGHT', 'AIR', '1 AIR') OR mc.container_name IS NULL)
                         AND (r.cont_id NOT LIKE 'TOLL-%' AND i.bl_no NOT LIKE 'TOLL-%' AND COALESCE(r.book_no, '') NOT LIKE 'TOLL-%')
                         AND (r.cont_id NOT LIKE '4066919%' AND i.bl_no NOT LIKE '4066919%') -- Safety for current report
                         AND YEAR(r.etd) >= YEAR(NOW()) - 1
                         AND ts.ata IS NULL
                         AND COALESCE(s.has_arrived, 0) = 0
                     ) AS sub1
                     GROUP BY tracking_number, final_tracking_type, sealine, so_id
                     HAVING
                         (MAX(last_updated_date) IS NULL) OR
                         (MIN(priority) = 1 AND MAX(last_updated_date) < DATE_SUB(NOW(), INTERVAL 1 DAY)) OR
                         (MIN(priority) = 2 AND MAX(last_updated_date) < DATE_SUB(NOW(), INTERVAL 3 DAY)) OR
                         (MIN(priority) = 3 AND MAX(last_updated_date) < DATE_SUB(NOW(), INTERVAL 5 DAY))
                     ORDER BY MIN(priority) ASC, MAX(last_updated_date) ASC
             `);

            blNumbers = rows.map(row => {
                const item = {
                    cont_id: row.tracking_number,
                    sealine: row.sealine || 'auto',
                    type: row.final_tracking_type,
                    priority: row.priority,
                    so_id: row.so_id,
                    eta: row.eta,
                    etd: row.etd,
                    internal_etd: row.internal_etd,
                    last_updated_date: row.last_updated_date,
                    mapping_missing: row.mapping_missing === 1
                };
                return item;
            });
            return blNumbers;
        } catch (error) {
            console.error("[INFO] Error fetching BL numbers:", error);
            return [];
        }
    }

    async function findCTNumber() {
        ctNumbers = [];
        try {
            const [rows] = await dbEOrder.execute(`
                    SELECT
                        tracking_number,
                        final_tracking_type,
                        so_id,
                        sealine,
                        MAX(last_updated_date) as last_updated_date,
                        MAX(eta) as eta,
                        MAX(etd) as etd,
                        MAX(internal_etd) as internal_etd,
                        MIN(priority) as priority,
                        MAX(mapping_missing) as mapping_missing
                    FROM (
                        SELECT
                            r.so_id, r.eta, r.etd, r.etd as internal_etd, msl.scac as sealine, s.last_updated_date,
                            CASE
                                WHEN (DATE(r.eta) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                     OR (DATE(r.etd) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                                THEN 1
                                WHEN (DATE(r.eta) BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY))
                                     OR (DATE(r.etd) BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY))
                                THEN 2
                                ELSE 3
                            END as priority,
                            CASE WHEN msl.scac IS NULL THEN 1 ELSE 0 END as mapping_missing,
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
                         LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id AND r.cont_id = i.cont_id
                         LEFT JOIN iod.trs_realization_searates ts ON r.so_id = ts.so_id
                         LEFT JOIN sea_rates.m_shipping_line msl ON
                             (r.ship_line IS NOT NULL AND msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%')) OR
                             (r.fwd IS NOT NULL AND msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%'))
                         LEFT JOIN iod.mst_container mc ON r.cont_size = mc.container_id
                         LEFT JOIN (
                            SELECT
                                number AS normalized_number,
                                MAX(last_updated_date) AS last_updated_date,
                                MAX(
                                    CASE
                                        WHEN LOWER(COALESCE(status, '')) LIKE '%arrival%'
                                          OR LOWER(COALESCE(status, '')) LIKE '%delivered%'
                                        THEN 1 ELSE 0
                                    END
                                ) AS has_arrived
                            FROM sea_rates.shipments
                            WHERE number IS NOT NULL AND TRIM(number) != ''
                            GROUP BY number
                         ) s ON CASE
                            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
                            WHEN LOWER(msl.type) = 'bl' AND i.bl_no IS NOT NULL AND TRIM(i.bl_no) != '' THEN i.bl_no
                            ELSE r.cont_id
                         END = s.normalized_number
                         WHERE r.cont_id IS NOT NULL AND r.eta < '9000-01-01' AND r.etd <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                         AND (UPPER(COALESCE(mc.container_name, '')) NOT IN ('TRUCK', '1 TRUCK', 'PLANE', '1 FLIGHT', 'AIR', '1 AIR') OR mc.container_name IS NULL)
                         AND (r.cont_id NOT LIKE 'TOLL-%' AND COALESCE(i.bl_no, '') NOT LIKE 'TOLL-%' AND COALESCE(r.book_no, '') NOT LIKE 'TOLL-%')
                         AND r.eta >= DATE_SUB(NOW(), INTERVAL 5 DAY) -- NEW: Prevent tracking dirty/reused CTs 5 days after ETA
                         AND i.bl_no IS NULL
                         AND ts.ata IS NULL
                         AND COALESCE(s.has_arrived, 0) = 0
                     ) AS sub1
                     GROUP BY tracking_number, final_tracking_type, sealine, so_id
                     HAVING
                         (MAX(last_updated_date) IS NULL) OR
                         (MIN(priority) = 1 AND MAX(last_updated_date) < DATE_SUB(NOW(), INTERVAL 1 DAY)) OR
                         (MIN(priority) = 2 AND MAX(last_updated_date) < DATE_SUB(NOW(), INTERVAL 3 DAY)) OR
                         (MIN(priority) = 3 AND MAX(last_updated_date) < DATE_SUB(NOW(), INTERVAL 5 DAY))
                     ORDER BY MIN(priority) ASC, MAX(last_updated_date) ASC
             `);

            ctNumbers = rows.map(row => {
                const item = {
                    cont_id: row.tracking_number,
                    sealine: row.sealine || 'auto',
                    type: row.final_tracking_type,
                    priority: row.priority,
                    so_id: row.so_id,
                    eta: row.eta,
                    etd: row.etd,
                    internal_etd: row.internal_etd,
                    last_updated_date: row.last_updated_date,
                    mapping_missing: row.mapping_missing === 1
                };
                return item;
            });
            return ctNumbers;
        } catch (error) {
            console.error("[INFO] Error fetching CT numbers:", error);
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
                        r.etd as internal_etd,
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
                        ON i.bl_no = s.number
                    LEFT JOIN iod.mst_container mc
                        ON r.cont_size = mc.container_id
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
                    AND (UPPER(COALESCE(mc.container_name, '')) NOT IN ('TRUCK', '1 TRUCK', 'PLANE', '1 FLIGHT', 'AIR', '1 AIR') OR mc.container_name IS NULL)
                    AND (r.cont_id NOT LIKE 'TOLL-%' AND i.bl_no NOT LIKE 'TOLL-%' AND COALESCE(r.book_no, '') NOT LIKE 'TOLL-%')
                    GROUP BY i.bl_no
            `, [startDate, endDate]);

            blNumbers = rows.map(row => ({
                cont_id: row.tracking_number,  // Use smart-selected tracking number
                so_id: row.so_id,
                sealine: row.sealine || 'auto',
                type: row.final_tracking_type,  // Use smart-selected type
                eta: row.eta,
                etd: row.etd,
                internal_etd: row.internal_etd
            }));
            // Extract BL numbers into an array
            return blNumbers; // Return the array if needed elsewhere
        } catch (error) {
            console.error("[INFO] Error fetching BL numbers:", error);
            return [];
        }
    }

    async function findBLNumberManualCount(startDate, endDate) {
        try {
            const [rows] = await dbEOrder.execute(`
                   SELECT COUNT(DISTINCT i.bl_no) as count
                    FROM iod.trs_realization r
                    LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
                    LEFT JOIN iod.mst_container mc ON r.cont_size = mc.container_id
                    LEFT JOIN sea_rates.shipments s ON i.bl_no = s.number
                    WHERE i.bl_no IS NOT NULL
                    AND r.eta < '9000-01-01'
                    AND (UPPER(COALESCE(mc.container_name, '')) NOT IN ('TRUCK', '1 TRUCK', 'PLANE', '1 FLIGHT', 'AIR', '1 AIR') OR mc.container_name IS NULL)
                    AND (r.cont_id NOT LIKE 'TOLL-%' AND i.bl_no NOT LIKE 'TOLL-%' AND COALESCE(r.book_no, '') NOT LIKE 'TOLL-%')
                    AND (
                        (DATEDIFF(r.eta, NOW()) > 30 AND (s.status IS NULL OR s.status = '') AND (YEAR(r.eta) = YEAR(CURDATE()) OR YEAR(r.etd) = YEAR(CURDATE())))
                        OR (r.eta BETWEEN ? AND ?)
                    )
            `, [startDate, endDate]);
            return rows?.[0]?.count || 0;
        } catch (error) {
            console.error("[INFO] Error counting BL numbers:", error);
            return 0;
        }
    }

    async function trackMultipleCTs(source = 'FRONTEND') {
                console.log(`[TRACKING] Starting batch tracking at ${new Date().toLocaleString()}...`);

        // De-duplicate: Group by tracking number
        const uniqueCTs = [];
        const ctMap = new Map();
        for (const ct of ctNumbers) {
            const normalizedKey = normalizeTrackingNumber(ct.cont_id);
            if (!ctMap.has(normalizedKey)) {
                ctMap.set(normalizedKey, { ...ct, so_ids: [ct.so_id] });
                uniqueCTs.push(ctMap.get(normalizedKey));
            } else {
                const existing = ctMap.get(normalizedKey);
                existing.so_ids.push(ct.so_id);
                existing.mapping_missing = existing.mapping_missing || ct.mapping_missing;
            }
        }

        const batchSize = 50;
        const baseDelay = 5000;
        let remainingRequests = null;
        let resetTime = null;

        for (let i = 0; i < uniqueCTs.length; i += batchSize) {
            const batch = uniqueCTs.slice(i, i + batchSize);
                        console.log(`[BATCH] Processing batch ${i / batchSize + 1}/${Math.ceil(uniqueCTs.length / batchSize)}...`);

            const trackingResults = await Promise.allSettled(
                batch.map(async ({ cont_id, so_ids, internal_etd, sealine, type, mapping_missing }) => {
                    try {
                        const response = await trackCTWithRateLimit({
                            cont_id,
                            so_id: so_ids[0],
                            internal_etd,
                            sealine: sealine || 'auto',
                            type: type || 'ct',
                            mapping_missing: !!mapping_missing,
                            source
                        });

                        remainingRequests = response?.headers?.['x-ratelimit-remaining'] ?? 'Unknown';
                        resetTime = response?.headers?.['x-ratelimit-reset'] ?? 'Unknown';

                        return response;
                    } catch (error) {
                        return { cont_id, error: error.message };
                    }
                })
            );

            // Filter results...
            const validResults = trackingResults
                .filter(res => res.status === "fulfilled" && res.value && res.value.status === "success")
                .map(res => res.value);

            if (validResults.length > 0) {
                try {
                    await saveToDatabase(validResults, ctMap);
                } catch (dbErr) {
                    console.error("[INFO] Batch DB Save Error:", dbErr.message);
                }
            }

            // ... log errors ...
            if (i + batchSize < uniqueCTs.length) {
                await new Promise(resolve => setTimeout(resolve, baseDelay));
            }
        }
                console.log("[SUCCESS] Batch tracking complete!");
    }


    async function trackMultipleBLs(source = 'FRONTEND') {
                console.log(`[TRACKING] Starting batch tracking at ${new Date().toLocaleString()}...`);

        // De-duplicate: Group by tracking number
        const uniqueBLs = [];
        const blMap = new Map();
        for (const bl of blNumbers) {
            const normalizedKey = normalizeTrackingNumber(bl.cont_id);
            if (!blMap.has(normalizedKey)) {
                blMap.set(normalizedKey, { ...bl, so_ids: [bl.so_id] });
                uniqueBLs.push(blMap.get(normalizedKey));
            } else {
                const existing = blMap.get(normalizedKey);
                existing.so_ids.push(bl.so_id);
                existing.mapping_missing = existing.mapping_missing || bl.mapping_missing;
            }
        }

        const batchSize = 50;
        const baseDelay = 5000;
        let remainingRequests = null;
        let resetTime = null;

        for (let i = 0; i < uniqueBLs.length; i += batchSize) {
            const batch = uniqueBLs.slice(i, i + batchSize);
                        console.log(`[BATCH] Processing batch ${i / batchSize + 1}/${Math.ceil(uniqueBLs.length / batchSize)}...`);

            const trackingResults = await Promise.allSettled(
                batch.map(async ({ cont_id, so_ids, internal_etd, sealine, type, mapping_missing }) => {
                    try {
                        const response = await trackBLWithRateLimit({
                            cont_id,
                            so_id: so_ids[0],
                            internal_etd,
                            sealine: sealine || 'auto',
                            type: type || 'bl',
                            mapping_missing: !!mapping_missing,
                            source
                        });

                        // Syncing handled inside trackBLWithRateLimit via _syncToOnlineOrder for all units

                        remainingRequests = response?.headers?.['x-ratelimit-remaining'] ?? 'Unknown';
                        resetTime = response?.headers?.['x-ratelimit-reset'] ?? 'Unknown';

                        return response;
                    } catch (error) {
                        return { cont_id, error: error.message };
                    }
                })
            );

            const validResults = trackingResults
                .filter(res => res.status === "fulfilled" && res.value && res.value.status === "success")
                .map(res => res.value);

            if (validResults.length > 0) {
                try {
                    await saveToDatabase(validResults, blMap);
                } catch (dbErr) {
                    console.error("[INFO] Batch DB Save Error:", dbErr.message);
                }
            }

            if (i + batchSize < uniqueBLs.length) {
                await new Promise(resolve => setTimeout(resolve, baseDelay));
            }
        }

                console.log("[SUCCESS] Batch tracking complete!");
        console.log("")
    }

    const EXCLUDED_PATTERNS = [/TOLL-/i];
    const EXCLUDED_CONTAINER_KEYWORDS = ["TRUCK", "PLANE", "FLIGHT", "AIR"];

    async function trackWithUnifiedEngine({ cont_id, so_id, internal_etd = null, sealine = 'auto', type = 'ct', mapping_missing = false, source = 'FRONTEND' }, retryCount = 0) {
        // High-level safety net for excluded identifiers
        if (EXCLUDED_PATTERNS.some(p => p.test(cont_id))) {
            console.log(`[SKIP] Identifier ${cont_id} is explicitly excluded (TOLL- prefix detected).`);
            return { cont_id, status: "skipped", error: "EXCLUDED_IDENTIFIER" };
        }

        const lockKey = normalizeTrackingNumber(cont_id);
        const scacCandidates = sealine && sealine !== 'auto' ? sealine.split(',').map((item) => item.trim()) : ['auto'];

        try {
            if (!lockKey) return { cont_id, status: "error", error: "INVALID_TRACKING_NUMBER" };
            if (inFlightTracking.has(lockKey)) {
                return { cont_id, status: "skipped", error: "DUPLICATE_IN_FLIGHT" };
            }
            inFlightTracking.add(lockKey);

            if (mapping_missing || sealine === 'auto') {
                await _createHotsAlertTicket(cont_id, 'MAPPING', source, 'SYSTEM', sealine, { soId: so_id });
            }

            let internalEtd = internal_etd;
            if (!internalEtd) {
                const [etdRows] = await dbEOrder.execute(`
                    SELECT r.etd
                    FROM iod.trs_realization r
                    LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id AND r.cont_id = i.cont_id
                    WHERE r.so_id = ?
                      AND (i.bl_no = ? OR r.cont_id = ? OR r.book_no = ?)
                    LIMIT 1
                `, [so_id, cont_id, cont_id, cont_id]);
                internalEtd = etdRows?.[0]?.etd || null;
            }

            const cacheEntry = await sharedTrackingEngine.getFreshTrackingCacheEntry(cont_id, so_id);
            if (cacheEntry?.payload && !cacheEntry?.last_error_code) {
                return {
                    cont_id,
                    so_id,
                    status: cacheEntry.payload?.status || "success",
                    details: cacheEntry.payload,
                    cached: true
                };
            }
            if (cacheEntry?.last_error_code) {
                return { cont_id, status: "error", error: cacheEntry.last_error_code };
            }

            const fetchResult = await sharedTrackingEngine.fetchBestSeaRatesMatch({
                containerNumber: cont_id,
                trackingNumber: cont_id,
                trackingType: type,
                scacCandidates,
                expected: {
                    internalEtd,
                    trackingType: type
                },
                soId: so_id,
                source
            });

            if (fetchResult.quotaBlocked) {
                console.warn(`[QUOTA] Daily quota reached. Skipping ${cont_id}`);
                await _logApiHit(cont_id, so_id, 'LIMIT', null, null, source);
                await _createHotsAlertTicket(cont_id, 'LIMIT', source, 'SYSTEM', sealine, { usageCount: fetchResult.quota?.usageCount, limit: fetchResult.quota?.limit, soId: so_id });
                return { cont_id, status: "error", error: "QUOTA_EXCEEDED" };
            }

            if (fetchResult.rawResponse?.status === 429 && retryCount < 3) {
                console.warn(`[RATE_LIMIT] Hit for ${cont_id}. Retrying...`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
                inFlightTracking.delete(lockKey);
                return trackWithUnifiedEngine({ cont_id, so_id, internal_etd: internalEtd, sealine, type, mapping_missing, source }, retryCount + 1);
            }

            if (fetchResult.normalizedData) {
                await sharedTrackingEngine.upsertTrackingCacheEntry({
                    containerNumber: cont_id,
                    soId: so_id,
                    trackingNumber: cont_id,
                    trackingType: type,
                    sealine: scacCandidates.join(','),
                    normalizedData: fetchResult.normalizedData,
                    rawResponse: fetchResult.rawResponse,
                    match: fetchResult.match,
                    isHistorical: fetchResult.isHistorical
                });

                console.log(`[TRACK] [${new Date().toLocaleString()}] SUCCESS ${cont_id} | SO: ${so_id} | Historical: ${!!fetchResult.isHistorical}`);
                
                // Save provider quota snapshot if available
                if (fetchResult.rawResponse?.api_calls || fetchResult.rawResponse?.unique_shipments) {
                    await _saveProviderQuotaSnapshot(fetchResult.rawResponse);
                }

                const { ata, atd, scac } = fetchResult.normalizedData;
                await _syncToOnlineOrder(cont_id, type, ata, atd, scac);
                return {
                    cont_id,
                    so_id,
                    status: fetchResult.rawResponse?.status || "success",
                    details: fetchResult.rawResponse
                };
            }

            await sharedTrackingEngine.upsertTrackingCacheEntry({
                containerNumber: cont_id,
                soId: so_id,
                trackingNumber: cont_id,
                trackingType: type,
                sealine: scacCandidates.join(','),
                rawResponse: fetchResult.rawResponse,
                lastErrorCode: fetchResult.rawResponse?.message || "NO_MATCH"
            });

            return { cont_id, status: "error", error: fetchResult.rawResponse?.message || "No matching live or historical data" };
        } catch (error) {
            console.error(`[INFO] Error in trackWithUnifiedEngine for ${cont_id}:`, error.message);
            return { cont_id, status: "error", error: error.message };
        } finally {
            inFlightTracking.delete(lockKey);
        }
    }

    async function trackBLWithRateLimit({ cont_id, so_id, internal_etd = null, sealine = 'auto', type = 'bl', mapping_missing = false, source = 'FRONTEND' }, retryCount = 0) {
        return trackWithUnifiedEngine({ cont_id, so_id, internal_etd, sealine, type, mapping_missing, source }, retryCount);
    }

    async function trackCTWithRateLimit({ cont_id, so_id, internal_etd = null, sealine = 'auto', type = 'ct', mapping_missing = false, source = 'FRONTEND' }, retryCount = 0) {
        return trackWithUnifiedEngine({ cont_id, so_id, internal_etd, sealine, type, mapping_missing, source }, retryCount);
    }

    async function saveToDatabase(data, groupMap = new Map()) {
        let connection;

        try {
            console.log("[INFO] Getting DB connection...");
            connection = await dbConf.getConnection();

            if (!connection) {
                throw new Error("[ERROR] Failed to get a database connection.");
            }

            console.log("[SUCCESS] Connection acquired. Starting transaction...");
            console.log(`=================================================================`);

            await connection.beginTransaction();

            for (const record of data) {
                const match = groupMap.get(normalizeTrackingNumber(record.cont_id));

                // Find invoice_id for this tracking number
                const [invRows] = await dbEOrder.execute(`
                    SELECT DISTINCT r.invoice_id 
                    FROM iod.trs_realization r
                    LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
                    WHERE i.bl_no = ? OR r.book_no = ? OR r.cont_id = ?
                    LIMIT 1
                `, [record.cont_id, record.cont_id, record.cont_id]);

                const invoice_id = invRows?.[0]?.invoice_id || null;
                record.invoice_id = invoice_id;

                const checkShipmentQuery = `
                    SELECT shipment_id
                    FROM shipments
                    WHERE REPLACE(REPLACE(number, 'TOLL-', ''), '-', '') = REPLACE(REPLACE(?, 'TOLL-', ''), '-', '')
                    ORDER BY last_updated_date DESC
                    LIMIT 1
                `;

                const [existingRows] = await connection.execute(checkShipmentQuery, [record.cont_id ?? null]);

                let shipmentId;
                let run = false;

                if (match && match.etd) {
                    const route = record.details?.data?.route;
                    const polDateStr = route?.pol?.date;

                    if (polDateStr && match.etd) {
                        const polDate = new Date(polDateStr);
                        const etdDate = new Date(match.etd);

                        if (!isNaN(polDate.getTime()) && !isNaN(etdDate.getTime())) {
                            const diffMs = polDate - etdDate;
                            const checketdrange = diffMs / (1000 * 60 * 60 * 24);

                                                        console.log(`[TRACKING] ETD Validation for ${record.cont_id}: Diff = ${checketdrange.toFixed(2)} days`);

                            if (checketdrange > -3) {
                                run = true;
                            } else {
                                run = false;
                                                                console.log(`[STOP] Container ${record.cont_id} invalid: ETD range mismatch (${checketdrange.toFixed(2)} days)`);
                            }
                        } else {
                            console.warn(`[INFO]Ã¯Â¸Â Invalid date format for ${record.cont_id}: pol=${polDateStr}, etd=${match.etd}`);
                            run = true; // Fallback to true if we can't calculate but have some data
                        }
                    } else {
                        console.log(`[INFO]Ã¯Â¸Â Missing ETD data for validation of ${record.cont_id}, proceeding...`);
                        run = true;
                    }
                } else {
                                        console.log(`[INFO] skipping ETD validation for ${record.cont_id} (No baseline ETD in realization)`);
                    run = true;
                }

                if (run) {
                    if (existingRows.length > 0) {
                        shipmentId = existingRows[0].shipment_id;
                                                console.log(`[UPDATE] Shipment already exists (ID: ${shipmentId}), updating...`);

                        const updateShipmentQuery = `
                                INSERT INTO shipments (shipment_id, status, number, invoice_id, so_id, type, sealine, sealine_name, last_updated_date)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                                ON DUPLICATE KEY UPDATE 
                                    status = VALUES(status),
                                    last_updated_date = NOW(),
                                    sealine = VALUES(sealine),
                                    sealine_name = VALUES(sealine_name),
                                    type = VALUES(type),
                                    invoice_id = COALESCE(VALUES(invoice_id), invoice_id),
                                    so_id = CASE WHEN so_id = 0 THEN VALUES(so_id) ELSE so_id END;
                            `;

                        const metadata = record.details.data.metadata;
                        const routeData = record.details.data.route;
                        const containersData = record.details.data.containers || [];
                        
                        let effectiveStatus = metadata.status ?? null;
                        
                        // Smart Status Override: If POD is actual, it's effectively delivered
                        if (routeData?.pod?.actual === true || routeData?.postpod?.actual === true) {
                            effectiveStatus = 'DELIVERED';
                        } else if (containersData.length > 0 && containersData.every(c => c.status === 'DELIVERED')) {
                            effectiveStatus = 'DELIVERED';
                        }

                        await connection.execute(updateShipmentQuery, [
                            shipmentId,
                            effectiveStatus,
                            record.cont_id ?? null,
                            record.invoice_id,
                            record.so_id ?? 0,
                            metadata.type ?? null,
                            metadata.sealine ?? null,
                            metadata.sealine_name ?? null
                        ]);

                        const routepod = record.details?.data?.route;
                        if (routepod && routepod.pol && routepod.pol.actual === true) {
                            const updatei2i = `
                                    INSERT INTO iod.trs_realization_searates (so_id, invoice_id, number, type, scac, atd)
                                    SELECT so_id, invoice_id, ?, ?, ?, ? FROM iod.trs_realization WHERE so_id = ?
                                    ON DUPLICATE KEY UPDATE invoice_id = VALUES(invoice_id), number = VALUES(number), type = VALUES(type), scac = VALUES(scac), atd = VALUES(atd);
                                `;
                            if (record.details.data.containers && Array.isArray(record.details.data.containers)) {
                                for (const container of record.details.data.containers) {
                                    await connection.execute(updatei2i, [normalizeTrackingNumber(container.number) ?? null, metadata.type ?? record.type ?? 'ct', metadata.sealine ?? null, routepod.pol?.date ?? null, record.so_id]);
                                }
                            }
                        }

                        if (routepod && routepod.pod && routepod.pod.actual === true) {
                            await connection.execute(`UPDATE iod.m_order mo JOIN iod.trs_sales_order tso ON mo.order_id = tso.e_order SET mo.status = 4 WHERE tso.so_id = ?;`, [record.so_id]);
                            if (!silentModeFlag) eorderDelivered(record.so_id);
                            const updatei2i = `
                                    INSERT INTO iod.trs_realization_searates (so_id, invoice_id, number, type, scac, ata, atd)
                                    SELECT so_id, invoice_id, ?, ?, ?, ?, ? FROM iod.trs_realization WHERE so_id = ?
                                    ON DUPLICATE KEY UPDATE invoice_id = VALUES(invoice_id), number = VALUES(number), type = VALUES(type), scac = VALUES(scac), ata = VALUES(ata), atd = VALUES(atd);
                                `;
                            if (record.details.data.containers && Array.isArray(record.details.data.containers)) {
                                for (const container of record.details.data.containers) {
                                    await connection.execute(updatei2i, [normalizeTrackingNumber(container.number) ?? null, metadata.type ?? record.type ?? 'ct', metadata.sealine ?? null, routepod.pod?.date ?? null, routepod.pol?.date ?? null, record.so_id]);
                                }
                            }
                        }

                        if (record.details.data.vessels && Array.isArray(record.details.data.vessels)) {
                            const updateVesselQuery = `INSERT INTO vessel (vessel_id, name, imo, shipment_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), imo = VALUES(imo);`;
                            for (const vsl of record.details.data.vessels) {
                                await connection.execute(updateVesselQuery, [vsl.id ?? null, vsl.name ?? null, vsl.imo ?? null, shipmentId]);
                            }
                        }

                        if (record.details.data.route_data?.pin?.length >= 2) {
                            const [lat, long] = record.details.data.route_data.pin;
                            await connection.execute(`UPDATE route SET lat = ?, \`long\` = ? WHERE shipment_id = ?;`, [lat ?? null, long ?? null, shipmentId]);
                        }

                        if (record.details.data.locations) {
                            const locQuery = `INSERT INTO locations (location_id, name, state, country, locode, lat, lng, shipment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), lat = VALUES(lat), lng = VALUES(lng);`;
                            for (const l of record.details.data.locations) {
                                await connection.execute(locQuery, [l.id ?? null, l.name ?? null, l.state ?? null, l.country ?? "", l.locode ?? null, l.lat ?? null, l.lng ?? null, shipmentId]);
                            }
                        }

                        const routepol = record.details.data.route;
                        if (routepol) {
                            const polQuery = `INSERT INTO pol (location_id, date, actual, shipment_id, last_updated_date) VALUES (?,?,?,?, NOW()) ON DUPLICATE KEY UPDATE date = VALUES(date), actual = VALUES(actual);`;
                            await connection.execute(polQuery, [routepol.pol.location ?? null, routepol.pol.date ?? null, routepol.pol.actual ?? null, shipmentId]);
                        }
                        if (routepod) {
                            const podQuery = `INSERT INTO pod (location_id, date, predictive_eta, actual, shipment_id, last_updated_date) VALUES (?,?,?,?,?, NOW()) ON DUPLICATE KEY UPDATE date = VALUES(date), predictive_eta = VALUES(predictive_eta), actual = VALUES(actual);`;
                            await connection.execute(podQuery, [routepod.pod.location ?? null, routepod.pod.date ?? null, routepod.predictive_eta ?? null, routepod.pod.actual ?? null, shipmentId]);
                        }

                        if (record.details.data.containers && Array.isArray(record.details.data.containers)) {
                            const eventQuery = `INSERT INTO events (order_id, location_id, description, event_type, event_code, date, actual, vessel_id, voyage, container_id, shipment_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE date = VALUES(date), actual = VALUES(actual), status = VALUES(status);`;
                            for (const [cidx, c] of record.details.data.containers.entries()) {
                                if (c.events && Array.isArray(c.events)) {
                                    for (const e of c.events) {
                                        await connection.execute(eventQuery, [e.order_id ?? null, e.location ?? null, e.description ?? null, e.event_type ?? null, e.event_code ?? null, e.date ?? null, e.actual ?? null, e.vessel ?? null, e.voyage ?? null, cidx + 1, shipmentId, e.status ?? null]);
                                    }
                                }
                            }
                        }
                    } else {
                        const metadata = record.details.data.metadata;
                        const routeData = record.details.data.route;
                        const containersData = record.details.data.containers || [];
                        
                        let effectiveStatus = metadata.status ?? null;
                        
                        // Smart Status Override: If POD is actual, it's effectively delivered
                        if (routeData?.pod?.actual === true || routeData?.postpod?.actual === true) {
                            effectiveStatus = 'DELIVERED';
                        } else if (containersData.length > 0 && containersData.every(c => c.status === 'DELIVERED')) {
                            effectiveStatus = 'DELIVERED';
                        }

                        const [shipResult] = await connection.execute(`
                            INSERT INTO shipments(number, invoice_id, so_id, type, sealine, sealine_name, status, last_updated_date)
                            VALUES(?, ?, ?, ?, ?, ?, ?, NOW())
                        `, [
                            record.cont_id ?? null,
                            record.invoice_id,
                            record.so_id ?? 0,
                            metadata.type ?? null,
                            metadata.sealine ?? null,
                            metadata.sealine_name ?? null,
                            effectiveStatus
                        ]);
                        shipmentId = shipResult.insertId;

                        // Insert initial event call
                        await connection.execute(`INSERT IGNORE INTO events(order_id, location_id, description, event_type, event_code, date, actual, shipment_id, status) VALUES(0, 0, 'First time API-CALL', 'system', 'FIRST_CALL', NOW(), 1, ?, 'start')`, [shipmentId]);

                        if (record.details.data.locations) {
                            const locQuery = `INSERT INTO locations (location_id, name, state, country, locode, lat, lng, shipment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                            for (const l of record.details.data.locations) {
                                await connection.execute(locQuery, [l.id ?? null, l.name ?? null, l.state ?? null, l.country ?? "", l.locode ?? null, l.lat ?? null, l.lng ?? null, shipmentId]);
                            }
                        }
                        if (record.details.data.route_data?.pin?.length >= 2) {
                            const [lat, long] = record.details.data.route_data.pin;
                            await connection.execute(`INSERT INTO route(lat, \`long\`, shipment_id) VALUES (?, ?, ?)`, [lat ?? null, long ?? null, shipmentId]);
                        }
                        const rp = record.details.data.route;
                        if (rp) {
                            if (rp.pol) await connection.execute(`INSERT INTO pol (location_id, date, actual, shipment_id, last_updated_date) VALUES (?,?,?,?, NOW())`, [rp.pol.location ?? null, rp.pol.date ?? null, rp.pol.actual ?? null, shipmentId]);
                            if (rp.pod) await connection.execute(`INSERT INTO pod (location_id, date, predictive_eta, actual, shipment_id, last_updated_date) VALUES (?,?,?,?,?, NOW())`, [rp.pod.location ?? null, rp.pod.date ?? null, rp.predictive_eta ?? null, rp.pod.actual ?? null, shipmentId]);
                        }
                        if (record.details.data.vessels) {
                            for (const vsl of record.details.data.vessels) {
                                await connection.execute(`INSERT INTO vessel (imo, name, vessel_id, shipment_id) VALUES (?, ?, ?, ?)`, [vsl.imo ?? null, vsl.name ?? null, vsl.id ?? null, shipmentId]);
                            }
                        }
                        if (record.details.data.containers) {
                            for (const [cidx, c] of record.details.data.containers.entries()) {
                                await connection.execute(`INSERT INTO containers (container_id, container_number, iso_code, size_type, status, shipment_id) VALUES (?, ?, ?, ?, ?, ?)`, [cidx + 1, c.number ?? null, c.iso_code ?? null, c.size_type ?? null, c.status ?? null, shipmentId]);
                                if (c.events) {
                                    for (const e of c.events) {
                                        await connection.execute(`INSERT INTO events (order_id, location_id, description, event_type, event_code, date, actual, vessel_id, voyage, container_id, shipment_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [e.order_id ?? null, e.location ?? null, e.description ?? null, e.event_type ?? null, e.event_code ?? null, e.date ?? null, e.actual ?? null, e.vessel ?? null, e.voyage ?? null, cidx + 1, shipmentId, e.status ?? null]);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            await connection.commit();
                        console.log(`[SUCCESS] Data saved successfully: ${data.length} records`);
        } catch (error) {
                        console.error("[ERROR] Error saving data:", error.message, error.stack);
            if (connection) await connection.rollback();
        } finally {
            if (connection) connection.release();
        }
    }

    const presetContainers = [
        { cont_id: "CAAU8591589" },
    ]
    async function trackMultipleCTsWithPreset() {
                console.log(`[TRACKING] Starting batch tracking at ${new Date().toLocaleString()}...`);

        const batchSize = 50; // Adjust batch size based on API limit
        const baseDelay = 5000; // Initial wait time between batches (in ms)
        let dynamicDelay = baseDelay; // Allow adjusting based on rate limits
        let remainingRequests = null;
        let resetTime = null;

        for (let i = 0; i < presetContainers.length; i += batchSize) {
            const batch = presetContainers.slice(i, i + batchSize);
                        console.log(`[BATCH] Processing batch ${i / batchSize + 1}/${Math.ceil(uniqueCTs.length / batchSize)}...`);

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
                .filter(res => res.status === "fulfilled" && res.value && res.value.status === "success")
                .map(res => res.value);

            const failedResults = trackingResults
                .filter(res => res.status === "rejected" || (res.value && res.value.error))
                .map(res => res.value ?? { cont_id: "Unknown", error: "Undefined response" });

            // Save successful results
            if (validResults.length > 0) {
                await saveToDatabase(validResults);
            } else {
                                console.warn("[WARN] No valid results to save.");
            }

            // Log failed tracking attempts
            if (failedResults.length > 0) {
                                console.error(`[ERROR] Failed to track ${failedResults.length} B / L numbers: `);
                failedResults.forEach(fail => console.error(`- ${fail.cont_id}: ${fail.error} `));
            }

            // Show rate limit info only when waiting
            if (remainingRequests !== null && resetTime !== null) {
                                console.log(`[STOP] Remaining Requests: ${remainingRequests === "Unknown" ? 0 : remainingRequests}, Rate Limit Resets In: ${resetTime === "Unknown" ? 0 : resetTime} seconds`);
            }

            // Adaptive delay based on rate limits
            if (i + batchSize < presetContainers.length) {
                console.log(`[WAIT] Waiting ...`);
                await new Promise(resolve => setTimeout(resolve, dynamicDelay));
            }
        }

                console.log("[SUCCESS] Batch tracking complete!");
    }


    // trackMultipleCTsWithPreset();

    // Schedule cron jobs at 00:00 AM & 06:00 PM
    // cron.schedule("17 * * * *", async () => {

    // Schedule cron jobs DAILY at 00:00 AM
    cron.schedule("0 0 * * *", async () => {
        silentModeFlag = false;
        await runBatchJob(70);
        silentModeFlag = true;
    });

        console.log("[WAIT] Cron job scheduler initialized...");
    // runBatchJob(25); // Disabled auto-fetch on startup


    async function test() {
        await runBatchJob(25);
    }

    async function manualtrack() {
        // Optimized to use shared batch logic with a default limit of 2 for manual runs
        await runBatchJob(2);
    }
    // if (ctNumbers.length > 0) {
    //     console.log("[BATCH] Starting CT tracking...");
    //     await trackMultipleCTs();
    // } else {
    //     console.log("[INFO]Ã¯Â¸Â No CT numbers found. Skipping CT tracking.");
    // }

    async function datetrack(startDate, endDate) {

                console.log("[TRACKING] Tracking BL numbers first...");




        blNumbers = await findBLNumberManual(startDate, endDate);

        if (blNumbers.length > 0) {
                        console.log("[BATCH] Starting BL tracking...");
            await trackMultipleBLs('MANUAL_FETCH');
        } else {
                        console.log("[WARN] No BL numbers found. Skipping BL tracking.");
        }

    }

    async function querytrack(number, soid) {

                console.log("[TRACKING] Tracking BL numbers first...");

        blNumbers = [
            { cont_id: number, so_id: soid },
        ];



        if (blNumbers.length > 0) {
                        console.log("[BATCH] Starting BL tracking...");
            await trackMultipleBLs('MANUAL_FETCH');
        } else {
                        console.log("[WARN] No BL numbers found. Skipping BL tracking.");
        }

    }

    async function runBatchJob(limit = 2) {
        process.env.TRACKING_SOURCE = 'AUTOBATCH';
        console.log(`[BATCH] Optimized Batch Tracking Started (Limit: ${limit})...`);

        let bls = await findBLNumber();
        let cts = await findCTNumber();

        // 1. Group by normalized tracking number to avoid duplicate API calls for same unit
        const uniqueBatch = [];
        const seen = new Set();

        for (const item of [...bls, ...cts]) {
            const dedupeKey = normalizeTrackingNumber(item.cont_id);
            if (!dedupeKey) continue;

            if (!seen.has(dedupeKey)) {
                seen.add(dedupeKey);
                uniqueBatch.push(item);
            } else {
                const existing = uniqueBatch.find(x => normalizeTrackingNumber(x.cont_id) === dedupeKey);
                if (existing) {
                    existing.mapping_missing = existing.mapping_missing || item.mapping_missing;
                }
            }
        }

        if (uniqueBatch.length === 0) {
            console.log("No shipments found requiring update.");
            return;
        }

        // 2. Sort globally by priority + last update age, then apply limit
        uniqueBatch.sort((a, b) => {
            const pA = Number(a.priority || 99);
            const pB = Number(b.priority || 99);
            if (pA !== pB) return pA - pB;

            const tA = a.last_updated_date ? new Date(a.last_updated_date).getTime() : 0;
            const tB = b.last_updated_date ? new Date(b.last_updated_date).getTime() : 0;
            return tA - tB;
        });

        const limitedBatch = uniqueBatch.slice(0, limit);
        console.log(`[BATCH] Tracking ${limitedBatch.length} unique units (Bundled)...`);

        // 3. Prepare internal state for existing functions
        const originalBLs = blNumbers;
        const originalCTs = ctNumbers;

        blNumbers = limitedBatch.filter(i => i.type === 'bl' || i.type === 'bk');
        ctNumbers = limitedBatch.filter(i => i.type === 'ct');

        // 4. Track
        if (blNumbers.length > 0) await trackMultipleBLs('AUTOBATCH');
        if (ctNumbers.length > 0) await trackMultipleCTs('AUTOBATCH');

        // 5. Restore state
        blNumbers = originalBLs;
        ctNumbers = originalCTs;

        console.log("[BATCH] Optimized batch tracking cycle complete.");
    }

    return {
        trackMultipleBLs,
        trackMultipleCTs,
        findCTNumber,
        findBLNumber,
        manualtrack,
        datetrack,
        datetrackCount: async (startDate, endDate) => {
            const count = await findBLNumberManualCount(startDate, endDate);
            console.log(`[INFO] Shipments found for range ${startDate} to ${endDate}: ${count}`);
            return count;
        },
        toggleQuotaBypass: (enabled) => {
            bypassQuotaFlag = !!enabled;
            console.log(`[INFO] Quota Bypass Mode: ${bypassQuotaFlag ? 'ON' : 'OFF'}`);
        },
        setSilentMode: (enabled) => {
            silentModeFlag = !!enabled;
            console.log(`[INFO] Silent Mode (Email suppression): ${silentModeFlag ? 'ON' : 'OFF'}`);
        },
        querytrack,
        manualTrackLimited: async () => {
            process.env.TRACKING_SOURCE = 'MANUAL_FETCH';
            await runBatchJob(50);
        },
        getQuotaStatus: async () => {
            const quota = await _checkAndQuotaAllowed();
                        console.log(`\n[REPORT] SeaRates API Quota Status:`);
            console.log(`- Used Today: ${quota.usageCount}`);
            console.log(`- Daily Limit: ${quota.limit}`);
            console.log(`- Remaining: ${Math.max(0, quota.limit - quota.usageCount)}`);
            return quota;
        }
    };
}

module.exports = { runCheck };
