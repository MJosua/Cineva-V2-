function createShipmentAnalyticsService({
    dbQuery,
    logger = console,
}) {
    // Cache for dashboard card summary (5 minutes)
    let cardSummaryCache = null;
    let lastCacheTime = 0;
    const CACHE_TTL = 5 * 60 * 1000;

    if (typeof dbQuery !== "function") {
        throw new Error("createShipmentAnalyticsService requires dbQuery");
    }

    function clampInt(value, fallback, min, max) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) return fallback;
        return Math.min(Math.max(parsed, min), max);
    }

    function parseDate(value) {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function diffDays(dateLeft, dateRight) {
        const left = parseDate(dateLeft);
        const right = parseDate(dateRight);
        if (!left || !right) return null;
        return (right.getTime() - left.getTime()) / (1000 * 60 * 60 * 24);
    }

    function absDiffDays(dateLeft, dateRight) {
        const value = diffDays(dateLeft, dateRight);
        return value === null ? null : Math.abs(value);
    }

    function round(value, precision = 1) {
        if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
        const factor = 10 ** precision;
        return Math.round(Number(value) * factor) / factor;
    }

    function formatDateKey(date) {
        return date.toISOString().slice(0, 10);
    }

    function labelQuotaStatus(usageRate) {
        if (usageRate >= 90) return "critical";
        if (usageRate >= 70) return "warning";
        return "healthy";
    }

    async function getReliability({ days = 90, limit = 10, fromDate = null, toDate = null } = {}) {
        const safeLimit = clampInt(limit, 10, 1, 50);

        const safeDays = clampInt(days, 90, 7, 365);
        let whereMatch = "s.last_updated_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        const params = [safeDays];

        if (fromDate) {
            whereMatch = "s.last_updated_date >= ?";
            params[0] = fromDate;
            if (toDate) {
                whereMatch += " AND s.last_updated_date < DATE_ADD(?, INTERVAL 1 DAY)";
                params.push(toDate);
            }
        }

        const rows = await dbQuery(`
            SELECT
                s.shipment_id,
                MAX(COALESCE(NULLIF(s.sealine, ''), NULLIF(msl.scac, ''), 'UNMAPPED')) AS scac,
                MAX(COALESCE(NULLIF(msl.shippingline_name, ''), NULLIF(s.sealine_name, ''), NULLIF(s.sealine, ''), 'Unknown Carrier')) AS carrier_name,
                MAX(tr.eta) AS internal_eta,
                MAX(COALESCE(pod.predictive_eta, pod.date)) AS searates_eta,
                MAX(ts.ata) AS actual_arrival,
                MAX(s.status) AS tracking_status,
                MAX(s.last_updated_date) AS last_updated_date,
                MAX(
                    CASE
                        WHEN UPPER(COALESCE(s.status, '')) LIKE '%DELIVER%'
                          OR UPPER(COALESCE(s.status, '')) LIKE '%ARRIV%'
                        THEN 1 ELSE 0
                    END
                ) AS delivered_flag
            FROM sea_rates.shipments s
            LEFT JOIN sea_rates.pod pod ON pod.shipment_id = s.shipment_id
            LEFT JOIN iod.trs_realization tr ON tr.so_id = s.so_id
            LEFT JOIN iod.trs_realization_searates ts ON ts.so_id = s.so_id
            LEFT JOIN sea_rates.m_shipping_line msl ON msl.scac = s.sealine
            WHERE ${whereMatch}
            GROUP BY s.shipment_id
        `, params);

        const grouped = new Map();

        for (const row of rows) {
            const scac = row.scac || "UNMAPPED";
            const entry = grouped.get(scac) || {
                scac,
                carrierName: row.carrier_name || "Unknown Carrier",
                trackedShipments: 0,
                measurableShipments: 0,
                actualMeasuredShipments: 0,
                onTimeShipments: 0,
                severeDelayShipments: 0,
                deliveredShipments: 0,
                totalEtaGapDays: 0,
                totalActualEtaGapDays: 0,
                lastUpdatedDate: row.last_updated_date || null,
            };

            entry.trackedShipments += 1;

            if (row.delivered_flag) {
                entry.deliveredShipments += 1;
            }

            const etaGapDays = absDiffDays(row.internal_eta, row.searates_eta);
            if (etaGapDays !== null) {
                entry.measurableShipments += 1;
                entry.totalEtaGapDays += etaGapDays;
                if (etaGapDays <= 3) entry.onTimeShipments += 1;
                if (etaGapDays >= 7) entry.severeDelayShipments += 1;
            }

            const actualGapDays = absDiffDays(row.internal_eta, row.actual_arrival);
            if (actualGapDays !== null) {
                entry.actualMeasuredShipments += 1;
                entry.totalActualEtaGapDays += actualGapDays;
            }

            if (!entry.lastUpdatedDate || (row.last_updated_date && new Date(row.last_updated_date) > new Date(entry.lastUpdatedDate))) {
                entry.lastUpdatedDate = row.last_updated_date;
            }

            grouped.set(scac, entry);
        }

        const results = [...grouped.values()].map((entry) => {
            const avgEtaGapDays = entry.measurableShipments
                ? entry.totalEtaGapDays / entry.measurableShipments
                : null;
            const avgActualEtaGapDays = entry.actualMeasuredShipments
                ? entry.totalActualEtaGapDays / entry.actualMeasuredShipments
                : null;
            const onTimeRate = entry.measurableShipments
                ? (entry.onTimeShipments / entry.measurableShipments) * 100
                : null;
            const coverageRate = entry.trackedShipments
                ? (entry.measurableShipments / entry.trackedShipments) * 100
                : 0;

            const precisionScore = avgEtaGapDays === null ? 55 : Math.max(0, 100 - avgEtaGapDays * 12);
            const actualScore = avgActualEtaGapDays === null ? precisionScore : Math.max(0, 100 - avgActualEtaGapDays * 10);
            const reliabilityScore = round(
                precisionScore * 0.45
                + actualScore * 0.25
                + (onTimeRate ?? 0) * 0.2
                + coverageRate * 0.1,
                1
            );

            return {
                scac: entry.scac,
                carrierName: entry.carrierName,
                trackedShipments: entry.trackedShipments,
                measurableShipments: entry.measurableShipments,
                deliveredShipments: entry.deliveredShipments,
                onTimeShipments: entry.onTimeShipments,
                severeDelayShipments: entry.severeDelayShipments,
                avgEtaGapDays: round(avgEtaGapDays, 1),
                avgActualEtaGapDays: round(avgActualEtaGapDays, 1),
                onTimeRate: round(onTimeRate, 1),
                coverageRate: round(coverageRate, 1),
                reliabilityScore,
                lastUpdatedDate: entry.lastUpdatedDate,
            };
        });

        results.sort((left, right) => {
            const scoreDiff = (right.reliabilityScore ?? 0) - (left.reliabilityScore ?? 0);
            if (scoreDiff !== 0) return scoreDiff;
            const measurableDiff = (right.measurableShipments ?? 0) - (left.measurableShipments ?? 0);
            if (measurableDiff !== 0) return measurableDiff;
            return (left.avgEtaGapDays ?? 999) - (right.avgEtaGapDays ?? 999);
        });

        return {
            days: safeDays,
            results: results.slice(0, safeLimit),
            summary: {
                carrierCount: grouped.size,
                trackedShipments: results.reduce((sum, entry) => sum + entry.trackedShipments, 0),
                measurableShipments: results.reduce((sum, entry) => sum + entry.measurableShipments, 0),
                averageEtaGapDays: round(
                    results.reduce((sum, entry) => sum + (entry.avgEtaGapDays ?? 0) * entry.measurableShipments, 0)
                    / Math.max(results.reduce((sum, entry) => sum + entry.measurableShipments, 0), 1),
                    1
                ),
            },
        };
    }

    async function getTransitTimes({ days = 120, limit = 12, fromDate = null, toDate = null } = {}) {
        const safeLimit = clampInt(limit, 12, 1, 50);

        const safeDays = clampInt(days, 120, 14, 365);
        let whereMatch = "s.last_updated_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        const params = [safeDays];

        if (fromDate) {
            whereMatch = "s.last_updated_date >= ?";
            params[0] = fromDate;
            if (toDate) {
                whereMatch += " AND s.last_updated_date < DATE_ADD(?, INTERVAL 1 DAY)";
                params.push(toDate);
            }
        }

        const rows = await dbQuery(`
            SELECT
                s.shipment_id,
                MAX(COALESCE(pol_loc.name, CONCAT('POL ', pol.location_id))) AS pol_name,
                MAX(COALESCE(pod_loc.name, CONCAT('POD ', pod.location_id))) AS pod_name,
                MAX(COALESCE(NULLIF(s.sealine, ''), 'UNMAPPED')) AS scac,
                MAX(COALESCE(NULLIF(s.sealine_name, ''), NULLIF(s.sealine, ''), 'Unknown Carrier')) AS carrier_name,
                MIN(pol.date) AS pol_date,
                MAX(COALESCE(ts.ata, pod.date, pod.predictive_eta)) AS arrival_date
            FROM sea_rates.shipments s
            LEFT JOIN sea_rates.pol pol ON pol.shipment_id = s.shipment_id
            LEFT JOIN sea_rates.pod pod ON pod.shipment_id = s.shipment_id
            LEFT JOIN sea_rates.locations pol_loc
                ON pol_loc.shipment_id = s.shipment_id
               AND pol_loc.location_id = pol.location_id
            LEFT JOIN sea_rates.locations pod_loc
                ON pod_loc.shipment_id = s.shipment_id
               AND pod_loc.location_id = pod.location_id
            LEFT JOIN iod.trs_realization_searates ts ON ts.so_id = s.so_id
            WHERE ${whereMatch}
            GROUP BY s.shipment_id
        `, params);

        const grouped = new Map();

        for (const row of rows) {
            const transitDays = diffDays(row.pol_date, row.arrival_date);
            if (transitDays === null || transitDays < 0) {
                continue;
            }

            const routeKey = `${row.pol_name || "Unknown POL"} -> ${row.pod_name || "Unknown POD"} :: ${row.scac || "UNMAPPED"}`;
            const entry = grouped.get(routeKey) || {
                routeKey,
                polName: row.pol_name || "Unknown POL",
                podName: row.pod_name || "Unknown POD",
                scac: row.scac || "UNMAPPED",
                carrierName: row.carrier_name || "Unknown Carrier",
                shipmentCount: 0,
                totalTransitDays: 0,
                minTransitDays: transitDays,
                maxTransitDays: transitDays,
            };

            entry.shipmentCount += 1;
            entry.totalTransitDays += transitDays;
            entry.minTransitDays = Math.min(entry.minTransitDays, transitDays);
            entry.maxTransitDays = Math.max(entry.maxTransitDays, transitDays);
            grouped.set(routeKey, entry);
        }

        const results = [...grouped.values()].map((entry) => ({
            routeKey: entry.routeKey,
            routeLabel: `${entry.polName} -> ${entry.podName}`,
            polName: entry.polName,
            podName: entry.podName,
            scac: entry.scac,
            carrierName: entry.carrierName,
            shipmentCount: entry.shipmentCount,
            avgTransitDays: round(entry.totalTransitDays / entry.shipmentCount, 1),
            minTransitDays: round(entry.minTransitDays, 1),
            maxTransitDays: round(entry.maxTransitDays, 1),
        }));

        results.sort((left, right) => {
            const countDiff = (right.shipmentCount ?? 0) - (left.shipmentCount ?? 0);
            if (countDiff !== 0) return countDiff;
            return (right.avgTransitDays ?? 0) - (left.avgTransitDays ?? 0);
        });

        return {
            days: safeDays,
            results: results.slice(0, safeLimit),
            summary: {
                routeCount: grouped.size,
                averageTransitDays: round(
                    results.reduce((sum, entry) => sum + (entry.avgTransitDays ?? 0) * entry.shipmentCount, 0)
                    / Math.max(results.reduce((sum, entry) => sum + entry.shipmentCount, 0), 1),
                    1
                ),
            },
        };
    }

    async function getQuota({ days = 14, fromDate = null, toDate = null } = {}) {
        let safeDays = clampInt(days, 14, 1, 31);
        
        let quotaWhere = "hit_timestamp >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        const quotaParams = [safeDays];
        
        let providerWhere = "snapshot_timestamp >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        const providerParams = [safeDays];

        if (fromDate) {
            quotaWhere = "hit_timestamp >= ?";
            providerWhere = "snapshot_timestamp >= ?";
            quotaParams[0] = fromDate;
            providerParams[0] = fromDate;
            
            if (toDate) {
                quotaWhere += " AND hit_timestamp < DATE_ADD(?, INTERVAL 1 DAY)";
                providerWhere += " AND snapshot_timestamp < DATE_ADD(?, INTERVAL 1 DAY)";
                quotaParams.push(toDate);
                providerParams.push(toDate);
            }
            
            // Calculate safeDays for the history loop if fromDate is provided
            const start = new Date(fromDate);
            const end = toDate ? new Date(toDate) : new Date();
            safeDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        const [configRow] = await dbQuery(`
            SELECT LEAST(COALESCE(daily_limit, 200), 200) AS daily_limit
            FROM sea_rates.api_quota_config
            WHERE api_name = 'searates_tracking'
            LIMIT 1
        `);
        const dailyLimit = Number(configRow?.daily_limit ?? 200);

        const rows = await dbQuery(`
            SELECT
                DATE(hit_timestamp) AS usage_date,
                COUNT(*) AS total_logs,
                SUM(CASE WHEN status_code NOT IN ('LIMIT', 'LIMIT_ALERT') THEN 1 ELSE 0 END) AS counted_hits,
                SUM(CASE WHEN status_code = 'SUCCESS' THEN 1 ELSE 0 END) AS success_hits,
                SUM(CASE WHEN status_code = 'FAIL' THEN 1 ELSE 0 END) AS fail_hits,
                SUM(CASE WHEN status_code = 'PENDING' THEN 1 ELSE 0 END) AS pending_hits,
                SUM(CASE WHEN status_code = 'LIMIT' THEN 1 ELSE 0 END) AS limit_hits
            FROM sea_rates.api_usage_log
            WHERE api_name = 'searates_tracking'
              AND ${quotaWhere}
            GROUP BY DATE(hit_timestamp)
            ORDER BY usage_date ASC
        `, quotaParams);

        const historyMap = new Map(
            rows.map((row) => {
                const countedHits = Number(row.counted_hits ?? 0);
                const usageRate = dailyLimit > 0 ? (countedHits / dailyLimit) * 100 : 0;
                return [
                    row.usage_date instanceof Date ? formatDateKey(row.usage_date) : String(row.usage_date),
                    {
                        date: row.usage_date instanceof Date ? formatDateKey(row.usage_date) : String(row.usage_date),
                        countedHits,
                        totalLogs: Number(row.total_logs ?? 0),
                        successHits: Number(row.success_hits ?? 0),
                        failHits: Number(row.fail_hits ?? 0),
                        pendingHits: Number(row.pending_hits ?? 0),
                        limitHits: Number(row.limit_hits ?? 0),
                        remainingHits: Math.max(dailyLimit - countedHits, 0),
                        usageRate: round(usageRate, 1),
                        quotaStatus: labelQuotaStatus(usageRate),
                    }
                ];
            })
        );

        const history = [];
        const loopEnd = parseDate(toDate) || new Date();
        loopEnd.setHours(0, 0, 0, 0);

        for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
            const date = new Date(loopEnd);
            date.setDate(date.getDate() - offset);
            const dateKey = formatDateKey(date);
            history.push(historyMap.get(dateKey) || {
                date: dateKey,
                countedHits: 0,
                totalLogs: 0,
                successHits: 0,
                failHits: 0,
                pendingHits: 0,
                limitHits: 0,
                remainingHits: dailyLimit,
                usageRate: 0,
                quotaStatus: "healthy",
            });
        }

        const today = history[history.length - 1] || {
            countedHits: 0,
            remainingHits: dailyLimit,
            usageRate: 0,
            quotaStatus: "healthy",
        };

        const [providerHistory] = await Promise.all([
            dbQuery(`
                SELECT 
                    DATE(snapshot_timestamp) AS usage_date,
                    MAX(api_calls_used) AS api_calls_used,
                    MAX(api_calls_total) AS api_calls_total,
                    MAX(unique_shipments_used) AS unique_shipments_used,
                    MAX(unique_shipments_total) AS unique_shipments_total
                FROM sea_rates.api_quota_usage_history
                WHERE ${providerWhere}
                GROUP BY DATE(snapshot_timestamp)
                ORDER BY usage_date ASC
            `, providerParams)
        ]);

        const providerHistoryFormatted = providerHistory.map(row => ({
            date: row.usage_date instanceof Date ? formatDateKey(row.usage_date) : String(row.usage_date),
            apiCallsUsed: row.api_calls_used,
            apiCallsTotal: row.api_calls_total,
            uniqueShipmentsUsed: row.unique_shipments_used,
            uniqueShipmentsTotal: row.unique_shipments_total
        }));

        const latestProvider = providerHistoryFormatted[providerHistoryFormatted.length - 1] || null;

        return {
            days: safeDays,
            dailyLimit,
            today,
            history,
            providerHistory: providerHistoryFormatted,
            providerStatus: latestProvider ? {
                apiCalls: {
                    used: latestProvider.apiCallsUsed,
                    total: latestProvider.apiCallsTotal,
                    remaining: Math.max(0, latestProvider.apiCallsTotal - latestProvider.apiCallsUsed),
                    usageRate: latestProvider.apiCallsTotal > 0 ? (latestProvider.apiCallsUsed / latestProvider.apiCallsTotal) * 100 : 0
                },
                uniqueShipments: {
                    used: latestProvider.uniqueShipmentsUsed,
                    total: latestProvider.uniqueShipmentsTotal,
                    remaining: Math.max(0, latestProvider.uniqueShipmentsTotal - latestProvider.uniqueShipmentsUsed),
                    usageRate: latestProvider.uniqueShipmentsTotal > 0 ? (latestProvider.uniqueShipmentsUsed / latestProvider.uniqueShipmentsTotal) * 100 : 0
                }
            } : null
        };
    }

    async function getUsageDetails({ type = 'bl', date = null, month = null, search = '', fromDate = null, toDate = null } = {}) {
        let where = "WHERE s.container_number NOT LIKE 'TOLL%' AND s.tracking_number NOT LIKE 'TOLL%'";
        const params = [];
        
        if (type) {
            where += " AND s.tracking_type = ?";
            params.push(type);
        }

        if (fromDate && toDate) {
            where += " AND DATE(s.last_updated) BETWEEN ? AND ?";
            params.push(fromDate, toDate);
        } else if (month) {
            where += " AND DATE_FORMAT(s.last_updated, '%Y-%m') = ?";
            params.push(month);
        } else if (date) {
            where += " AND DATE(s.last_updated) = ?";
            params.push(date);
        }

        if (search) {
            // Support alphanumeric search (stripping hyphens/spaces for container/tracking matching)
            const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, '');
            where += " AND (s.container_number LIKE ? OR s.container_number LIKE ? OR s.tracking_number LIKE ? OR s.tracking_number LIKE ? OR s.so_id LIKE ? OR s.sealine LIKE ? OR msl.shippingline_name LIKE ?)";
            const p = `%${search}%`;
            const cp = `%${cleanSearch}%`;
            params.push(p, cp, p, cp, p, p, p);
        }

        const rows = await dbQuery(`
            SELECT 
                s.container_number,
                s.tracking_number,
                s.sealine as scac,
                COALESCE(msl.shippingline_name, s.sealine) as sealine_name,
                s.last_updated,
                s.tracking_status,
                s.so_id
            FROM sea_rates.container_tracking_cache s
            LEFT JOIN sea_rates.m_shipping_line msl ON msl.scac = s.sealine
            ${where}
            ORDER BY s.last_updated DESC
            LIMIT 1000
        `, params);
        
        return rows;
    }

    /**
     * Efficiently match carrier names using in-memory SCAC mapping
     */
    async function getShippingLineMap() {
        const rows = await dbQuery("SELECT scac, i2i_shipline, shippingline_name FROM sea_rates.m_shipping_line WHERE scac IS NOT NULL");
        return rows.map(r => ({
            scac: r.scac,
            name: r.shippingline_name,
            patterns: (r.i2i_shipline || '').split(',').map(p => p.trim().toUpperCase()).filter(Boolean)
        }));
    }

    function matchCarrier(shipLine, fwd, mapping) {
        const sl = (shipLine || '').toUpperCase();
        const fw = (fwd || '').toUpperCase();
        if (!sl && !fw) return null;

        for (const m of mapping) {
            if (m.patterns.some(p => sl.includes(p) || fw.includes(p))) {
                return { scac: m.scac, name: m.name };
            }
        }
        return null;
    }

    async function getRisks({ days = 180, limit = 20, fromDate = null, toDate = null } = {}) {
        const safeLimit = clampInt(limit, 20, 1, 100);
        const safeDays = clampInt(days, 180, 30, 365);
        let whereMatch = "tr.etd >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        const params = [safeDays];

        if (fromDate) {
            whereMatch = "tr.etd >= ?";
            params[0] = fromDate;
            if (toDate) {
                whereMatch += " AND tr.etd < DATE_ADD(?, INTERVAL 1 DAY)";
                params.push(toDate);
            }
        }

        // 1. Fetch main aggregate data from indexed tables
        const [rows, carrierMapping] = await Promise.all([
            dbQuery(`
                SELECT
                    tr.so_id,
                    tr.cont_id AS container_number,
                    MAX(NULLIF(ti.bl_no, '')) AS bl_number,
                    MAX(NULLIF(tr.book_no, '')) AS booking_number,
                    MAX(tr.po_number) AS po_number,
                    MAX(tr.etd) AS internal_etd,
                    MAX(tr.eta) AS internal_eta,
                    MAX(tr.ship_line) AS ship_line,
                    MAX(tr.fwd) AS fwd,
                    MAX(s.sealine) AS s_scac,
                    MAX(s.sealine_name) AS s_carrier,
                    MAX(s.shipment_id) AS shipment_id,
                    MAX(s.status) AS tracking_status,
                    MAX(s.last_updated_date) AS last_updated_date,
                    MAX(COALESCE(pod.predictive_eta, pod.date)) AS searates_eta,
                    MAX(ts.ata) AS actual_arrival,
                    MAX(CASE WHEN s.shipment_id IS NULL THEN 1 ELSE 0 END) AS missing_shipment,
                    MAX(CASE WHEN tr.invoice_id IS NULL THEN 1 ELSE 0 END) AS missing_invoice
                FROM iod.trs_realization tr
                LEFT JOIN iod.trs_invoice ti ON ti.invoice_id = tr.invoice_id
                LEFT JOIN iod.trs_realization_searates ts ON ts.so_id = tr.so_id
                LEFT JOIN sea_rates.shipments s ON s.so_id = tr.so_id
                LEFT JOIN sea_rates.pod pod ON pod.shipment_id = s.shipment_id
                WHERE ${whereMatch}
                GROUP BY tr.so_id, tr.cont_id
            `, params),
            getShippingLineMap()
        ]);

        const riskRows = [];
        const summary = {
            totalRisks: 0,
            missingMapping: 0,
            missingShipment: 0,
            overdue: 0,
            staleTracking: 0,
            largeEtaGap: 0,
        };

        const today = new Date();
        for (const row of rows) {
            // Exclude TOLL shipments from SeaRates analytics
            if (row.cont_id?.toUpperCase().includes('TOLL')) continue;

            // Node-side carrier matching (avoids heavy SQL JOIN ON LIKE)
            const matched = matchCarrier(row.ship_line, row.fwd, carrierMapping);
            const scac = row.s_scac || matched?.scac || "UNMAPPED";
            const carrierName = row.s_carrier || matched?.name || row.ship_line || row.fwd || "Unknown Carrier";
            const missingMapping = scac === "UNMAPPED";

            const overdueDays = row.actual_arrival ? 0 : Math.max(Math.round(diffDays(row.internal_eta, today) ?? 0), 0);
            const signedEtaGapDays = diffDays(row.internal_eta, row.searates_eta);
            const absEtaGapDays = signedEtaGapDays === null ? null : Math.abs(signedEtaGapDays);
            const staleTrackingDays = Math.max(Math.round(diffDays(row.last_updated_date, today) ?? 0), 0);

            const riskReasons = [];
            let riskScore = 0;

            if (missingMapping) {
                riskReasons.push("Missing SCAC mapping");
                riskScore += 45;
                summary.missingMapping += 1;
            }
            if (row.missing_invoice) {
                riskReasons.push("Missing invoice mapping");
                riskScore += 35;
            }
            if (row.missing_shipment) {
                riskReasons.push("No SeaRates shipment cached");
                riskScore += 30;
                summary.missingShipment += 1;
            }
            if (overdueDays > 0) {
                riskReasons.push(`Past internal ETA by ${overdueDays} day(s)`);
                riskScore += Math.min(overdueDays * 4, 40);
                summary.overdue += 1;
            }
            if (absEtaGapDays !== null && absEtaGapDays >= 7) {
                riskReasons.push(`ETA gap ${signedEtaGapDays > 0 ? "+" : ""}${round(signedEtaGapDays, 1)} day(s)`);
                riskScore += Math.min(absEtaGapDays * 3, 30);
                summary.largeEtaGap += 1;
            }
            if (!row.actual_arrival && staleTrackingDays >= 7) {
                riskReasons.push(`Tracking stale for ${staleTrackingDays} day(s)`);
                riskScore += Math.min(staleTrackingDays * 2, 25);
                summary.staleTracking += 1;
            }

            if (riskReasons.length === 0) {
                continue;
            }

            summary.totalRisks += 1;
            riskRows.push({
                soId: row.so_id,
                containerNumber: row.container_number || null,
                blNumber: row.bl_number || null,
                bookingNumber: row.booking_number || null,
                poNumber: row.po_number || null,
                scac,
                carrierName,
                trackingStatus: row.tracking_status || (row.missing_shipment ? "UNTRACKED" : "UNKNOWN"),
                internalEtd: row.internal_etd || null,
                internalEta: row.internal_eta || null,
                searatesEta: row.searates_eta || null,
                actualArrival: row.actual_arrival || null,
                overdueDays,
                etaGapDays: signedEtaGapDays === null ? null : round(signedEtaGapDays, 1),
                staleTrackingDays,
                missingMapping: Boolean(missingMapping),
                missingShipment: Boolean(row.missing_shipment),
                missingInvoice: Boolean(row.missing_invoice),
                riskScore,
                riskReasons,
                lastUpdatedDate: row.last_updated_date || null,
            });
        }

        riskRows.sort((left, right) => {
            const riskDiff = (right.riskScore ?? 0) - (left.riskScore ?? 0);
            if (riskDiff !== 0) return riskDiff;
            return (right.overdueDays ?? 0) - (left.overdueDays ?? 0);
        });

        return {
            days: safeDays,
            results: riskRows.slice(0, safeLimit),
            summary,
        };
    }

    async function getCardSummaryData() {
        // Return cached data if valid and not too old
        const now = Date.now();
        if (cardSummaryCache && (now - lastCacheTime < CACHE_TTL)) {
            return cardSummaryCache;
        }

        const [currentRows, previousRows] = await Promise.all([
            dbQuery(`
                SELECT COUNT(DISTINCT shipment_id) AS total
                FROM sea_rates.shipments
                WHERE last_updated_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            `),
            dbQuery(`
                SELECT COUNT(DISTINCT shipment_id) AS total
                FROM sea_rates.shipments
                WHERE last_updated_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                  AND last_updated_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            `)
        ]);

        const currentTotal = Number(currentRows?.[0]?.total ?? 0);
        const previousTotal = Number(previousRows?.[0]?.total ?? 0);
        const denominator = previousTotal || 1;
        const trend = previousTotal === 0 && currentTotal > 0
            ? 100
            : Math.round(((currentTotal - previousTotal) / denominator) * 100);

        const [quota, risks, reliability] = await Promise.all([
            getQuota({ days: 7 }),
            getRisks({ days: 180, limit: 10 }),
            getReliability({ days: 90, limit: 10 }),
        ]);

        return {
            total: currentTotal,
            trend,
            trendDirection: trend > 3 ? "up" : trend < -3 ? "down" : "neutral",
            sparklineData: quota.history.map((item) => ({ value: item.countedHits })),
            quickStats: [
                {
                    label: "High Risk",
                    value: Number(risks.summary.totalRisks ?? 0),
                    color: "bg-rose-50 text-rose-700",
                },
                {
                    label: "Quota Left",
                    value: Number(quota.today.remainingHits ?? 0),
                    color: "bg-amber-50 text-amber-700",
                },
                {
                    label: "Avg ETA Gap",
                    value: Number(Math.round(reliability.summary.averageEtaGapDays ?? 0)),
                    color: "bg-sky-50 text-sky-700",
                },
            ],
        };

        // Cache the result
        cardSummaryCache = result;
        lastCacheTime = now;

        return result;
    }

    async function getDataList({ 
        page = 1, 
        limit = 25, 
        fromDate = null, 
        toDate = null, 
        factory = 'all', 
        search = '',
        sortBy = 'delv_date',
        sortDir = 'desc'
    } = {}) {
        const safePage = Math.max(1, parseInt(page));
        const safeLimit = clampInt(limit, 25, 1, 1000);
        const offset = (safePage - 1) * safeLimit;

        // Default to current month if no dates provided
        if (!fromDate && !toDate) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            fromDate = firstDay.toISOString().split('T')[0];
            toDate = lastDay.toISOString().split('T')[0];
        }

        let whereClause = "WHERE 1=1";
        const params = [];

        if (fromDate) {
            whereClause += " AND tr.delv_date >= ?";
            params.push(fromDate);
        }
        if (toDate) {
            whereClause += " AND tr.delv_date < DATE_ADD(?, INTERVAL 1 DAY)";
            params.push(toDate);
        }
        if (factory && factory !== 'all') {
            whereClause += " AND mf.factory_sname = ?";
            params.push(factory);
        }
        if (search) {
            whereClause += " AND (ti.invoice_id LIKE ? OR ti.bl_no LIKE ? OR tr.book_no LIKE ? OR tr.cont_id LIKE ?)";
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const countQueryText = `
            SELECT COUNT(*) as total FROM (
                SELECT 1
                FROM iod.trs_invoice ti
                LEFT JOIN iod.trs_realization tr ON ti.invoice_id = tr.invoice_id AND ti.cont_id = tr.cont_id
                LEFT JOIN iod.trs_sales_order tso ON tso.so_id = tr.so_id
                LEFT JOIN iod.mst_factory mf ON tso.factory_id = mf.factory_id
                ${whereClause}
                GROUP BY ti.invoice_id, ti.cont_id
            ) as sub
        `;

        const countResult = await dbQuery(countQueryText, params);
        const totalRows = countResult[0]?.total || 0;

        // Normalize sortBy to prevent SQL injection (simple check)
        const allowedSortKeys = ['delv_date', 'invoice_id', 'bl_no', 'book_no', 'ct_tr', 'eta', 'factory_sname'];
        const safeSortBy = allowedSortKeys.includes(sortBy) ? sortBy : 'delv_date';
        const safeSortDir = sortDir === 'asc' ? 'ASC' : 'DESC';

        const dataQueryText = `
            SELECT
                tr.year_delv,
                tr.delv_date,
                ti.invoice_id,
                tr.ship_line,
                tr.fwd,
                msl.type as fwd_type,
                msl2.type as shipline_type,
                ti.bl_no,
                tr.book_no,
                tso.so_id,
                tr.cont_id as ct_tr,
                ti.cont_id as ct_ti,
                tr.etd,
                tr.eta,
                mf.factory_sname
            FROM iod.trs_invoice ti
            LEFT JOIN iod.trs_realization tr ON ti.invoice_id = tr.invoice_id AND ti.cont_id = tr.cont_id
            LEFT JOIN iod.trs_sales_order tso ON tso.so_id = tr.so_id
            LEFT JOIN iod.mst_factory mf ON tso.factory_id = mf.factory_id
            LEFT JOIN sea_rates.m_shipping_line msl ON msl.i2i_shipline = tr.fwd
            LEFT JOIN sea_rates.m_shipping_line msl2 ON msl2.i2i_shipline = tr.ship_line
            ${whereClause}
            GROUP BY ti.invoice_id, ti.cont_id
            ORDER BY ${safeSortBy === 'ct_tr' ? 'ti.cont_id' : safeSortBy === 'factory_sname' ? 'mf.factory_sname' : `tr.${safeSortBy}`} ${safeSortDir}
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, safeLimit, offset];
        const rows = await dbQuery(dataQueryText, dataParams);

        return {
            page: safePage,
            limit: safeLimit,
            totalRows,
            totalPages: Math.ceil(totalRows / safeLimit),
            results: rows,
            fromDate,
            toDate,
            factorySearch: factory,
            searchQuery: search
        };
    }

    async function getFactories() {
        const rows = await dbQuery(`
            SELECT DISTINCT factory_sname 
            FROM iod.mst_factory 
            WHERE factory_sname IS NOT NULL AND factory_sname != ''
              AND active = 1
            ORDER BY factory_sname ASC
        `);
        return rows.map(r => r.factory_sname);
    }
    async function getFreightReport({ 
        page = 1, 
        limit = 25, 
        fromDate = null, 
        toDate = null, 
        factory = 'all', 
        search = '',
        dateType = 'eta' // 'eta' or 'stuffing'
    } = {}) {
        const safePage = Math.max(1, parseInt(page));
        const safeLimit = clampInt(limit, 25, 1, 500);
        const offset = (safePage - 1) * safeLimit;

        // Default to current month if no dates provided
        if (!fromDate && !toDate) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            fromDate = firstDay.toISOString().split('T')[0];
            toDate = lastDay.toISOString().split('T')[0];
        }

        let shipmentWhere = "WHERE 1=1";
        const params = [];

        const dateField = dateType === 'stuffing' ? 'tr.delv_date' : 'tr.eta';

        if (fromDate) {
            shipmentWhere += ` AND ${dateField} >= ?`;
            params.push(fromDate);
        }
        if (toDate) {
            shipmentWhere += ` AND ${dateField} < DATE_ADD(?, INTERVAL 1 DAY)`;
            params.push(toDate);
        }
        if (factory && factory !== 'all') {
            shipmentWhere += " AND mf.factory_sname = ?";
            params.push(factory);
        }
        if (search) {
            shipmentWhere += ` AND (
                tr.cont_id LIKE ? OR 
                tr.book_no LIKE ? OR 
                tr.po_number LIKE ? OR
                EXISTS (
                    SELECT 1 FROM sea_rates.locations l 
                    WHERE l.shipment_id = s.shipment_id 
                    AND (l.name LIKE ? OR l.country LIKE ? OR l.locode LIKE ?)
                )
            )`;
            const p = `%${search}%`;
            params.push(p, p, p, p, p, p);
        }

        const countQuery = `
            SELECT COUNT(DISTINCT s.shipment_id) as total
            FROM sea_rates.shipments s
            INNER JOIN iod.trs_realization tr ON tr.so_id = s.so_id
            LEFT JOIN iod.trs_sales_order tso ON tso.so_id = tr.so_id
            LEFT JOIN iod.mst_factory mf ON mf.factory_id = tso.factory_id
            ${shipmentWhere}
        `;
        const countRes = await dbQuery(countQuery, params);
        const totalRows = countRes[0]?.total || 0;

        // Get paginated shipment IDs
        const shipmentIdsQuery = `
            SELECT DISTINCT s.shipment_id
            FROM sea_rates.shipments s
            INNER JOIN iod.trs_realization tr ON tr.so_id = s.so_id
            LEFT JOIN iod.trs_sales_order tso ON tso.so_id = tr.so_id
            LEFT JOIN iod.mst_factory mf ON mf.factory_id = tso.factory_id
            ${shipmentWhere}
            ORDER BY s.shipment_id DESC
            LIMIT ? OFFSET ?
        `;
        const idsRes = await dbQuery(shipmentIdsQuery, [...params, safeLimit, offset]);
        const sids = idsRes.map(r => r.shipment_id);

        if (sids.length === 0) {
            return { page: safePage, limit: safeLimit, totalRows, results: [] };
        }

        // Get full data for those shipment IDs ordered by chronological event sequence
        const rows = await dbQuery(`
            SELECT
                s.shipment_id,
                tr.so_id,
                tr.cont_id AS container_number,
                tr.book_no AS booking_number,
                tr.po_number,
                tr.etd,
                tr.eta,
                mf.factory_sname,
                loc.name AS location_name,
                loc.country AS country_name,
                loc.locode,
                e.order_id
            FROM sea_rates.shipments s
            INNER JOIN iod.trs_realization tr ON tr.so_id = s.so_id
            LEFT JOIN iod.trs_sales_order tso ON tso.so_id = tr.so_id
            LEFT JOIN iod.mst_factory mf ON mf.factory_id = tso.factory_id
            INNER JOIN sea_rates.events e ON e.shipment_id = s.shipment_id
            INNER JOIN sea_rates.locations loc ON loc.shipment_id = e.shipment_id AND loc.location_id = e.location_id
            WHERE s.shipment_id IN (?)
            ORDER BY s.shipment_id DESC, e.order_id ASC
        `, [sids]);

        const shipmentsMap = new Map();
        for (const row of rows) {
            const sid = row.shipment_id;
            const entry = shipmentsMap.get(sid) || {
                shipmentId: sid,
                soId: row.so_id,
                containerNumber: row.container_number,
                bookingNumber: row.booking_number,
                poNumber: row.po_number,
                etd: row.etd,
                eta: row.eta,
                factory_sname: row.factory_sname,
                path: [],
                countries: new Set(),
            };

            entry.path.push({
                name: row.location_name,
                country: row.country_name,
                locode: row.locode,
            });
            if (row.country_name) {
                entry.countries.add(row.country_name);
            }
            shipmentsMap.set(sid, entry);
        }

        const results = sids.map(sid => {
            const s = shipmentsMap.get(sid);
            if (!s) return null;
            return {
                ...s,
                countries: [...s.countries],
                countryCount: s.countries.size,
                transitPath: s.path.map(p => p.country).filter((c, i, a) => c && (i === 0 || c !== a[i-1])),
                stops: s.path.length
            };
        }).filter(Boolean);

        return {
            page: safePage,
            limit: safeLimit,
            totalRows,
            totalPages: Math.ceil(totalRows / safeLimit),
            results,
            fromDate,
            toDate
        };
    }
    async function getReportNotes(reportKey) {
        const rows = await dbQuery(`
            SELECT 
                wd.id,
                wd.field_value as content,
                wd.created_at,
                u.firstname,
                u.lastname,
                (SELECT attribute_value FROM hots.user_profile WHERE user_id = u.user_id AND attribute_name = 'profile_picture' LIMIT 1) as profile_picture
            FROM hots.t_ticket_work_data wd
            LEFT JOIN hots.user u ON u.user_id = wd.created_by
            WHERE wd.data_type = 'REPORT_DISCUSSION'
              AND wd.entity_id = ?
              AND wd.field_name = 'note'
            ORDER BY wd.created_at DESC
        `, [reportKey]);
        return rows;
    }

    async function saveReportNote({ reportKey, content, userId }) {
        const result = await dbQuery(`
            INSERT INTO hots.t_ticket_work_data 
            (data_type, entity_id, field_name, field_value, field_type, created_by, service_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, ['REPORT_DISCUSSION', reportKey, 'note', content, 'report', userId, 0]);
        return result.insertId;
    }

    return {
        getReliability,
        getTransitTimes,
        getQuota,
        getRisks,
        getCardSummaryData,
        getDataList,
        getFreightReport,
        getFactories,
        getUsageDetails,
        getReportNotes,
        saveReportNote,
    };
}

module.exports = {
    createShipmentAnalyticsService,
};
