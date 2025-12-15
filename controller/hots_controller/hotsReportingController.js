// controller/hots_controller/hotsReportingController.js
// E-Order Reporting endpoints for HOTS with proper HOTS authentication
// Ported from spectator.js but uses HOTS token/auth

const { dbConf } = require("../../config/db");

let gray = "\x1b[90m";

/**
 * Helper: Generate date range SQL clause
 * Supports query params: ?days=7|30|90|365 OR ?from=YYYY-MM-DD&until=YYYY-MM-DD
 */
function getDateRangeClause(req, fieldName = 'mo.po_date') {
    const { from, until, days } = req.query;

    if (from && until) {
        // Custom date range
        return `AND ${fieldName} BETWEEN '${from}' AND '${until}'`;
    } else if (days) {
        // Preset days: 7, 30, 90, 365
        const numDays = parseInt(days) || 30;
        return `AND ${fieldName} BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL ${numDays} DAY) AND CURRENT_DATE`;
    } else {
        // Default: last 30 days
        return `AND ${fieldName} BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) AND CURRENT_DATE`;
    }
}

/**
 * Helper: Get comparison period for trend calculation
 */
function getComparisonClause(req, fieldName = 'mo.po_date') {
    const { days } = req.query;
    const numDays = parseInt(days) || 30;

    // Compare to the same period length before the current period
    return `AND ${fieldName} BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL ${numDays * 2} DAY) AND DATE_SUB(CURRENT_DATE, INTERVAL ${numDays} DAY)`;
}

module.exports = {
    /**
     * GET /hotsreporting/total_order/:uom
     * Query params: ?days=7|30|90|365 (default 30)
     * Get total order volume with comparison to previous period
     */
    totalOrderVolume: async (req, res) => {
        const date = new Date();
        const timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const uom = req.params.uom === 'pack' ? 1 : req.params.uom === 'carton' ? 2 : 0;
        const days = parseInt(req.query.days) || 30;
        const dateRangeClause = getDateRangeClause(req);
        const comparisonClause = getComparisonClause(req);

        // Simplified query - just get current period total and previous period total
        const query = `
        SELECT 
            COALESCE(current_period.total, 0) AS ttl_order_now,
            COALESCE(previous_period.total, 0) AS ttl_order_lm,
            COALESCE(containers.cont_40hc, 0) AS cont_40hc,
            COALESCE(containers.cont_40hc_qty, 0) AS cont_40hc_qty,
            COALESCE(containers.cont_40, 0) AS cont_40,
            COALESCE(containers.cont_40_qty, 0) AS cont_40_qty,
            COALESCE(containers.cont_20, 0) AS cont_20,
            COALESCE(containers.cont_20_qty, 0) AS cont_20_qty,
            COALESCE(containers.truck, 0) AS truck,
            COALESCE(containers.truck_qty, 0) AS truck_qty,
            CASE 
                WHEN COALESCE(previous_period.total, 0) = 0 THEN 0
                ELSE ROUND(((COALESCE(current_period.total, 0) - COALESCE(previous_period.total, 0)) / previous_period.total) * 100, 1)
            END AS diff
        FROM 
            (SELECT SUM(COALESCE(ms.qty, 0) * mp.uom) AS total
             FROM iod.m_order mo
             INNER JOIN iod.m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id
             INNER JOIN (SELECT product_code, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END AS uom FROM iod.mst_product WHERE active = 1) mp ON ms.sku = mp.product_code
             WHERE mo.status NOT IN (0, 77, 99) ${dateRangeClause}
            ) current_period,
            (SELECT SUM(COALESCE(ms.qty, 0) * mp.uom) AS total
             FROM iod.m_order mo
             INNER JOIN iod.m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id
             INNER JOIN (SELECT product_code, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END AS uom FROM iod.mst_product WHERE active = 1) mp ON ms.sku = mp.product_code
             WHERE mo.status NOT IN (0, 77, 99) ${comparisonClause}
            ) previous_period,
            (SELECT 
                SUM(CASE WHEN md.cont_size = 4 THEN COALESCE(md.cont_qty, 0) ELSE 0 END) AS cont_40hc,
                SUM(CASE WHEN md.cont_size = 4 THEN COALESCE(md.qty1, 0) + COALESCE(md.qty2, 0) + COALESCE(md.qty3, 0) ELSE 0 END) AS cont_40hc_qty,
                SUM(CASE WHEN md.cont_size = 2 THEN COALESCE(md.cont_qty, 0) ELSE 0 END) AS cont_40,
                SUM(CASE WHEN md.cont_size = 2 THEN COALESCE(md.qty1, 0) + COALESCE(md.qty2, 0) + COALESCE(md.qty3, 0) ELSE 0 END) AS cont_40_qty,
                SUM(CASE WHEN md.cont_size = 1 THEN COALESCE(md.cont_qty, 0) ELSE 0 END) AS cont_20,
                SUM(CASE WHEN md.cont_size = 1 THEN COALESCE(md.qty1, 0) + COALESCE(md.qty2, 0) + COALESCE(md.qty3, 0) ELSE 0 END) AS cont_20_qty,
                SUM(CASE WHEN md.cont_size = 8 THEN COALESCE(md.cont_qty, 0) ELSE 0 END) AS truck,
                SUM(CASE WHEN md.cont_size = 8 THEN COALESCE(md.qty1, 0) + COALESCE(md.qty2, 0) + COALESCE(md.qty3, 0) ELSE 0 END) AS truck_qty
             FROM iod.m_order mo
             INNER JOIN iod.m_order_dtl md ON mo.order_id = md.order_id AND mo.company_id = md.company_id
             WHERE mo.status NOT IN (0, 77, 99) ${dateRangeClause}
            ) containers
        `;

        try {
            dbConf.query(query, (err, results) => {
                if (err) {
                    console.error(timestamp + `HOTS Reporting: totalOrderVolume error:`, err.message);
                    return res.status(500).json({ success: false, error: err.message, sql: err.sql });
                }

                if (results && results.length > 0) {
                    const row = results[0];
                    const dataDiff = parseFloat(row.diff) || 0;

                    res.status(200).json({
                        success: true,
                        days: days,
                        increase: dataDiff >= 0,
                        diffPercent: Math.abs(dataDiff).toFixed(1),
                        ttl_order_lm: row.ttl_order_lm || 0,
                        ttl_order_now: row.ttl_order_now || 0,
                        cont_20: row.cont_20 || 0,
                        cont_40: row.cont_40 || 0,
                        cont_40hc: row.cont_40hc || 0,
                        cont_20_qty: row.cont_20_qty || 0,
                        cont_40_qty: row.cont_40_qty || 0,
                        cont_40hc_qty: row.cont_40hc_qty || 0,
                        truck: row.truck || 0,
                        truck_qty: row.truck_qty || 0
                    });
                } else {
                    res.status(200).json({ success: true, ttl_order_now: 0, ttl_order_lm: 0 });
                }
            });
        } catch (error) {
            console.error(timestamp + 'HOTS Reporting: totalOrderVolume exception:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * GET /hotsreporting/total_order_week/:uom
     * Get order volumes by week for current year (no date filter - always shows full year)
     */
    totalOrderByWeek: async (req, res) => {
        const date = new Date();
        const timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const uom = req.params.uom === 'pack' ? 1 : req.params.uom === 'carton' ? 2 : 0;

        // Simpler query that gets weekly aggregates
        const query = `
        SELECT 
            YEAR(mo.po_date) AS po_year,
            WEEK(mo.po_date, 1) AS week,
            SUM(COALESCE(ms.qty, 0) * mp.uom) AS volume
        FROM iod.m_order mo
        INNER JOIN iod.m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id
        INNER JOIN (
            SELECT product_code, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END AS uom
            FROM iod.mst_product WHERE active = 1
        ) mp ON ms.sku = mp.product_code
        WHERE mo.status NOT IN (0, 77, 99)
            AND YEAR(mo.po_date) = YEAR(CURRENT_DATE)
        GROUP BY YEAR(mo.po_date), WEEK(mo.po_date, 1)
        ORDER BY po_year, week ASC
        `;

        try {
            dbConf.query(query, (err, results) => {
                if (err) {
                    console.error(timestamp + `HOTS Reporting: totalOrderByWeek error:`, err.message);
                    return res.status(500).json({ success: false, error: err.message, sql: err.sql });
                }

                res.status(200).json({ success: true, results: results || [] });
            });
        } catch (error) {
            console.error(timestamp + 'HOTS Reporting: totalOrderByWeek exception:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * GET /hotsreporting/top_country/:uom
     * Query params: ?upto=10&days=30 OR ?from=YYYY-MM-DD&until=YYYY-MM-DD
     * Get top countries by order volume
     */
    topCountry: async (req, res) => {
        const date = new Date();
        const timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const uom = req.params.uom === 'pack' ? 1 : req.params.uom === 'carton' ? 2 : 0;
        const limit = parseInt(req.query.upto) || 10;
        const dateRangeClause = getDateRangeClause(req);

        const query = `
        SELECT 
            COALESCE(st.txt, 'Unknown') AS country_name, 
            SUM(COALESCE(ms.qty, 0) * mp.uom) AS sales
        FROM iod.m_order mo
        INNER JOIN iod.m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id
        INNER JOIN (
            SELECT product_code, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END AS uom
            FROM iod.mst_product WHERE active = 1
        ) mp ON ms.sku = mp.product_code
        LEFT JOIN iod.mst_company mc ON mo.company_id = mc.company_id
        LEFT JOIN iod.mst_country my ON mc.country_id = my.country_id
        LEFT JOIN iod.sys_text st ON my.country_name_id = st.text_id AND st.lang_id = 1
        WHERE mo.status NOT IN (0, 77, 99) ${dateRangeClause}
        GROUP BY st.txt
        ORDER BY sales DESC
        LIMIT ${limit}
        `;

        try {
            dbConf.query(query, (err, results) => {
                if (err) {
                    console.error(timestamp + `HOTS Reporting: topCountry error:`, err.message);
                    return res.status(500).json({ success: false, error: err.message, sql: err.sql });
                }

                res.status(200).json(results || []);
            });
        } catch (error) {
            console.error(timestamp + 'HOTS Reporting: topCountry exception:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * GET /hotsreporting/top_dist/:uom
     * Query params: ?upto=10&days=30 OR ?from=YYYY-MM-DD&until=YYYY-MM-DD
     * Get top distributors by order volume
     */
    topDistributor: async (req, res) => {
        const date = new Date();
        const timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const uom = req.params.uom === 'pack' ? 1 : req.params.uom === 'carton' ? 2 : 0;
        const limit = parseInt(req.query.upto) || 10;
        const dateRangeClause = getDateRangeClause(req);

        const query = `
        SELECT 
            COALESCE(mc.company_name, 'Unknown') AS company_name, 
            COALESCE(st.txt, '-') AS txt, 
            SUM(COALESCE(ms.qty, 0) * mp.uom) AS sales
        FROM iod.m_order mo
        INNER JOIN iod.m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id
        INNER JOIN (
            SELECT product_code, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END AS uom
            FROM iod.mst_product WHERE active = 1
        ) mp ON ms.sku = mp.product_code
        LEFT JOIN iod.mst_company mc ON mo.ship_to = mc.company_id
        LEFT JOIN iod.mst_country my ON mc.country_id = my.country_id
        LEFT JOIN iod.sys_text st ON my.country_name_id = st.text_id AND st.lang_id = 1
        WHERE mo.status NOT IN (0, 77, 99) ${dateRangeClause}
        GROUP BY mc.company_name, st.txt
        ORDER BY sales DESC
        LIMIT ${limit}
        `;

        try {
            dbConf.query(query, (err, results) => {
                if (err) {
                    console.error(timestamp + `HOTS Reporting: topDistributor error:`, err.message);
                    return res.status(500).json({ success: false, error: err.message, sql: err.sql });
                }

                res.status(200).json(results || []);
            });
        } catch (error) {
            console.error(timestamp + 'HOTS Reporting: topDistributor exception:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

