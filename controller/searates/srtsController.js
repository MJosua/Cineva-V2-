const { query } = require("express");
const { dbSR, dbQuerySR, dbQuery, dbConf } = require("../../config/db");
const fs = require('fs');
const { default: axios } = require("axios");
const { timeout } = require("puppeteer");
const { createSeaRatesTrackingEngine } = require("../../service/searates/trackingEngine");

let blue = "\x1b[36m";

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
const key = process.env.SECURITY_API_SEARATES_KEY;
const sharedTrackingEngine = createSeaRatesTrackingEngine({
    apiKey: key,
    axiosInstance: axios,
    dbQuery: dbQuerySR,
    reserveQuotaSlot: (...args) => _reserveQuotaSlot(...args),
    finalizeReservedApiHit: (...args) => _finalizeReservedApiHit(...args),
    redactUrl: _redactUrl,
    logger: console
});

function _normalizeTrackingNumber(value) {
    return sharedTrackingEngine.normalizeTrackingNumber(value);
}

const EXCLUDED_SEARATES_CONTAINER_NAMES = ["TRUCK", "1 TRUCK", "PLANE", "1 FLIGHT", "AIR", "1 AIR"];

function _normalizeLooseText(value) {
    if (!value) return "";
    return String(value)
        .normalize("NFKD")
        .replace(/[^\w\s]/g, " ")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

function _looseTextMatch(expected, actual) {
    const left = _normalizeLooseText(expected);
    const right = _normalizeLooseText(actual);
    if (!left || !right) return false;
    return left.includes(right) || right.includes(left);
}

function _isDeliveredStatus(status) {
    const normalized = _normalizeLooseText(status);
    return normalized.includes("DELIVERED") || normalized.includes("ARRIVAL") || normalized.includes("ARRIVED");
}

function _deriveEffectiveStatus(data) {
    if (!data) return null;
    const metadata = data.metadata || {};
    const route = data.route || {};
    const containers = data.containers || [];
    
    // 1. Check if POD/PostPOD event is marked as ACTUAL
    if (route.pod?.actual === true || route.postpod?.actual === true) {
        return "DELIVERED";
    }
    
    // 2. Check if all containers are delivered
    if (containers.length > 0 && containers.every(c => _isDeliveredStatus(c.status))) {
        return "DELIVERED";
    }
    
    return metadata.status || "IN_TRANSIT";
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

function _getRefreshWindowHours({ status, isHistorical = false, lastErrorCode = null } = {}) {
    return sharedTrackingEngine.getRefreshWindowHours({ status, isHistorical, lastErrorCode });
}

function _shouldRefreshShipmentData(rows, { refresh = false, isArrived = false, cacheEntry = null } = {}) {
    // Rule: If already arrived, stop fetching regardless of refresh flag
    if (isArrived) return false;

    if (!rows?.length) return true;

    const lastUpdated = rows[0]?.last_updated_date ? new Date(rows[0].last_updated_date) : null;
    if (!lastUpdated || isNaN(lastUpdated.getTime())) return true;

    const diffDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    // Rule: If not yet arrived, use cache for 7 days unless forced refresh
    if (refresh) return true;
    return diffDays >= 7;
}

async function _getFreshTrackingCacheEntry(containerNumber, soId = 0) {
    return sharedTrackingEngine.getFreshTrackingCacheEntry(containerNumber, soId);
}

async function _upsertTrackingCacheEntry({
    containerNumber,
    soId = 0,
    trackingNumber = null,
    trackingType = null,
    sealine = null,
    normalizedData = null,
    rawResponse = null,
    match = null,
    isHistorical = false,
    lastErrorCode = null
}) {
    return sharedTrackingEngine.upsertTrackingCacheEntry({
        containerNumber,
        soId,
        trackingNumber,
        trackingType,
        sealine,
        normalizedData,
        rawResponse,
        match,
        isHistorical,
        lastErrorCode
    });
}

async function _loadTrackingMappings({ number, rawNumber, soId = "0", includeEOrder = false }) {
    const conditions = [];
    const params = [];

    if (soId !== "0") {
        conditions.push("tr.so_id = ?");
        params.push(soId);
    } else {
        conditions.push("REPLACE(tr.cont_id, '-', '') = ?");
        params.push(number);
        conditions.push("tr.cont_id = ?");
        params.push(rawNumber);
        conditions.push("REPLACE(COALESCE(ti.bl_no, ''), '-', '') = ?");
        params.push(number);
        conditions.push("ti.bl_no = ?");
        params.push(rawNumber);
        conditions.push("REPLACE(COALESCE(tr.book_no, ''), '-', '') = ?");
        params.push(number);
        conditions.push("tr.book_no = ?");
        params.push(rawNumber);

        if (includeEOrder) {
            conditions.push("tso.e_order = ?");
            params.push(rawNumber);
        }
    }

    const sql = `
        SELECT DISTINCT
            tr.cont_id,
            tr.book_no,
            ti.bl_no,
            tr.so_id,
            tso.e_order,
            tr.invoice_id,
            tr.po_number,
            tr.ship_name,
            tr.cont_size,
            tr.etd AS internal_etd,
            tr.eta,
            s.shipment_id,
            s.last_updated_date,
            s.status AS shipment_status,
            msl.scac AS sealine,
            UPPER(COALESCE(msl.type, '')) AS mapping_type,
            UPPER(COALESCE(mc.container_name, '')) AS container_name
        FROM trs_realization tr
        LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
        LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
        LEFT JOIN mst_container mc ON mc.container_id = tr.cont_size
        LEFT JOIN sea_rates.shipments s ON s.so_id = tr.so_id
        LEFT JOIN sea_rates.m_shipping_line msl
            ON msl.i2i_shipline LIKE CONCAT('%', tr.ship_line, '%')
            OR msl.i2i_shipline LIKE CONCAT('%', tr.fwd, '%')
        WHERE (${conditions.join(" OR ")})
+          AND (UPPER(COALESCE(mc.container_name, '')) NOT IN (?) OR mc.container_name IS NULL)
+          AND (tr.cont_id NOT LIKE 'TOLL-%' AND COALESCE(ti.bl_no, '') NOT LIKE 'TOLL-%' AND COALESCE(tr.book_no, '') NOT LIKE 'TOLL-%')
        ORDER BY s.last_updated_date DESC, tr.etd DESC
    `;

    return dbQuery(sql, [...params, ...EXCLUDED_SEARATES_CONTAINER_NAMES]);
}

function _buildTrackingContext(rows, { rawNumber, normalizedNumber, soId = "0", sealineOverride = "auto", trackingTypeOverride = "auto" } = {}) {
    const primary = rows?.[0] || null;
    const fallbackCandidates = [...new Set(rows?.map((row) => String(row?.sealine || "").trim()).filter(Boolean) || [])];
    const scacCandidates = sealineOverride && sealineOverride !== "auto" ? [sealineOverride] : fallbackCandidates;

    if (!scacCandidates.length) {
        scacCandidates.push("auto");
    }

    const mappingType = String(primary?.mapping_type || "").toUpperCase();
    let trackingNumber = rawNumber || normalizedNumber || primary?.cont_id;
    let trackingType = "ct";

    const normalizedInput = _normalizeTrackingNumber(rawNumber || normalizedNumber);
    const normalizedBL = _normalizeTrackingNumber(primary?.bl_no);
    const normalizedBK = _normalizeTrackingNumber(primary?.book_no);
    const normalizedCT = _normalizeTrackingNumber(primary?.cont_id);

    // 1. Precise Match Priority
    if (normalizedInput === normalizedBL && primary?.bl_no) {
        trackingNumber = primary.bl_no;
        trackingType = "bl";
    } else if (normalizedInput === normalizedBK && primary?.book_no) {
        trackingNumber = primary.book_no;
        trackingType = "bk";
    } else if (normalizedInput === normalizedCT && primary?.cont_id) {
        trackingNumber = primary.cont_id;
        trackingType = "ct";
    }
    // 2. Global Preference (BL > BK > CT)
    else if (primary?.bl_no) {
        trackingNumber = primary.bl_no;
        trackingType = "bl";
    } else if (primary?.book_no) {
        trackingNumber = primary.book_no;
        trackingType = "bk";
    } else if (primary?.cont_id) {
        trackingNumber = primary.cont_id;
        trackingType = "ct";
    }

    // 3. Override by Mapping Type if it explicitly matches a field
    if (mappingType === "BK" && primary?.book_no) {
        trackingNumber = primary.book_no;
        trackingType = "bk";
    } else if (mappingType === "CT" && primary?.cont_id) {
        trackingNumber = primary.cont_id;
        trackingType = "ct";
    } else if (mappingType === "BL" && primary?.bl_no) {
        trackingNumber = primary.bl_no;
        trackingType = "bl";
    }


    // 4. Force override if user explicitly specified a type
    if (trackingTypeOverride && trackingTypeOverride !== "auto") {
        // Map common frontend names to SeaRates internal types
        const typeMap = {
            'container': 'ct',
            'bl': 'bl',
            'booking': 'bk'
        };
        trackingType = typeMap[trackingTypeOverride.toLowerCase()] || trackingTypeOverride;
    }

    return {
        primary,
        scacCandidates,
        trackingNumber,
        trackingType,
        expected: {
            internalEtd: primary?.internal_etd || null,
            internalEta: primary?.eta || null,
            vesselName: primary?.ship_name || null,
            pol: primary?.expected_pol || null,
            pod: primary?.expected_pod || null,
            trackingType
        },
        lockKey: `${_normalizeTrackingNumber(trackingNumber)}::${Number(soId !== "0" ? soId : primary?.so_id) || 0}`
    };
}

function _roundMetric(value, digits = 1) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
    const factor = 10 ** digits;
    return Math.round(Number(value) * factor) / factor;
}

function _serializeTrackingContext(trackingContext = null) {
    if (!trackingContext) return null;
    return {
        trackingNumber: trackingContext.trackingNumber || null,
        trackingType: trackingContext.trackingType || null,
        scacCandidates: Array.isArray(trackingContext.scacCandidates) ? trackingContext.scacCandidates : [],
        expected: trackingContext.expected || null
    };
}

function _summarizeMatchConfidence(score) {
    if (score === null || score === undefined || Number.isNaN(Number(score))) {
        return {
            score: null,
            label: "Unrated",
            color: "gray"
        };
    }

    const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(score))));
    if (normalizedScore >= 90) {
        return { score: normalizedScore, label: "High", color: "green" };
    }
    if (normalizedScore >= 70) {
        return { score: normalizedScore, label: "Medium", color: "yellow" };
    }
    return { score: normalizedScore, label: "Low", color: "red" };
}

function _buildTrackingAnalytics({
    match = null,
    trackingContext = null,
    normalizedData = null,
    cachePayload = null,
    isHistorical = false
} = {}) {
    const payloadMatch = match || cachePayload?.match_details || null;
    const payloadContext = trackingContext ? _serializeTrackingContext(trackingContext) : (cachePayload?.tracking_context || null);

    const internalEta = payloadMatch?.internalEta
        || payloadContext?.expected?.internalEta
        || payloadContext?.internalEta
        || null;
    const internalEtd = payloadMatch?.internalEtd
        || payloadContext?.expected?.internalEtd
        || payloadContext?.internalEtd
        || null;

    const searatesEta = payloadMatch?.searatesEta
        || normalizedData?.route?.pod?.predictive_eta
        || normalizedData?.route?.pod?.date
        || null;
    const searatesEtd = payloadMatch?.searatesEtd
        || normalizedData?.route?.pol?.date
        || null;

    const etaGapDays = payloadMatch?.etaDelta ?? (
        internalEta && searatesEta ? sharedTrackingEngine.signedDayDiff(internalEta, searatesEta) : null
    );
    const etaGapAbsoluteDays = payloadMatch?.etaDiff ?? (
        internalEta && searatesEta ? sharedTrackingEngine.diffDays(internalEta, searatesEta) : null
    );
    const etdDiffDays = payloadMatch?.etdDiff ?? (
        internalEtd && searatesEtd ? sharedTrackingEngine.diffDays(internalEtd, searatesEtd) : null
    );

    const confidence = _summarizeMatchConfidence(payloadMatch?.score ?? null);

    return {
        trackingNumber: payloadContext?.trackingNumber || normalizedData?.metadata?.number || null,
        trackingType: payloadMatch?.trackingType || payloadContext?.trackingType || null,
        scacCandidates: payloadContext?.scacCandidates || [],
        confidenceScore: confidence.score,
        confidenceLabel: confidence.label,
        confidenceColor: confidence.color,
        rawScore: payloadMatch?.score ?? null,
        etaGapDays: _roundMetric(etaGapDays, 1),
        etaGapAbsoluteDays: _roundMetric(etaGapAbsoluteDays, 1),
        etdDiffDays: _roundMetric(etdDiffDays, 1),
        internalEta,
        internalEtd,
        searatesEta,
        searatesEtd,
        vesselMatched: payloadMatch?.vesselMatched ?? null,
        polMatched: payloadMatch?.polMatched ?? null,
        podMatched: payloadMatch?.podMatched ?? null,
        routeValidated: payloadMatch?.routeValidated ?? null,
        hasRouteData: payloadMatch?.hasRouteData ?? Boolean(normalizedData?.route_data?.route?.length),
        routePol: payloadMatch?.routePol || null,
        routePod: payloadMatch?.routePod || null,
        vesselName: payloadMatch?.vesselName || normalizedData?.vessels?.[0]?.name || null,
        voyageId: payloadMatch?.voyageId || null,
        isHistorical: Boolean(isHistorical || cachePayload?.is_historical),
    };
}

function _attachTrackingAnalytics(payload, trackingAnalytics) {
    if (!payload || typeof payload !== "object") return payload;
    return {
        ...payload,
        tracking_analytics: trackingAnalytics
    };
}

function _buildSeaRatesFrontendRecord({
    soId = 0,
    poNumber = null,
    normalizedData = null,
    trackingAnalytics = null
} = {}) {
    const containers = normalizedData?.containers || normalizedData?.container || [];
    return {
        so_id: soId,
        metadata: normalizedData?.metadata || {},
        containers,
        events: normalizedData?.events || containers.flatMap((container) => container?.events || []),
        locations: normalizedData?.locations || [],
        vessels: normalizedData?.vessels || [],
        route: normalizedData?.route || {},
        route_data: normalizedData?.route_data || {},
        po_number: poNumber || normalizedData?.metadata?.po_number || null,
        tracking_analytics: trackingAnalytics
    };
}

// ============================================
// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ INTERNAL HELPERS (Not Exported)
// ============================================

function _normalizeSeaRatesData(rawResponse) {
    return sharedTrackingEngine.normalizeSeaRatesData(rawResponse);
}

async function _fetchBestSeaRatesMatch({
    containerNumber,
    trackingNumber,
    trackingType,
    scacCandidates,
    expected,
    soId,
    requestedBy,
    source = "FRONTEND"
}) {
    return sharedTrackingEngine.fetchBestSeaRatesMatch({
        containerNumber,
        trackingNumber,
        trackingType,
        scacCandidates,
        expected,
        soId,
        requestedBy,
        source
    });
}

/**
 * UNIFIED: Save SeaRates tracking data to database
 * @param {object} record - { so_id, shipment_id, cont_id, data }
 * @param {string} number - Tracking number for logging
 * @returns {number|null} - shipment_id on success, null on failure
 */
async function _saveSearatesRecord(record, number) {
    // ====== VALIDATION ======
    if (!record?.data) {
        console.warn(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Cannot save: record.data is missing for ${number}`);
        return null;
    }

    const metadata = record.data.metadata;
    if (!metadata) {
        console.warn(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Cannot save: metadata is missing for ${number}`);
        return null;
    }

    let connection;
    try {
        connection = await dbConf.promise().getConnection();

        // ====== SHIPMENT ======
        const shipmentQuery = `
            INSERT INTO shipments (
                shipment_id, number, so_id, invoice_id, type, sealine, sealine_name, status, last_updated_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                so_id=VALUES(so_id),
                invoice_id=VALUES(invoice_id),
                type=VALUES(type),
                sealine=VALUES(sealine),
                sealine_name=VALUES(sealine_name),
                status=VALUES(status),
                last_updated_date=NOW();
        `;

        const shipmentResult = await dbQuerySR(shipmentQuery, [
            record.shipment_id ?? null,
            number ?? metadata.number ?? null,
            record.so_id ?? 0,
            record.invoice_id ?? null,
            metadata.type ?? null,
            metadata.sealine ?? null,
            metadata.sealine_name ?? null,
            _deriveEffectiveStatus(record.data),
        ]);

        const shipmentId =
            shipmentResult.insertId ||
            (await dbQuerySR("SELECT shipment_id FROM shipments WHERE number = ?", [metadata.number ?? number]))?.[0]?.[0]?.shipment_id;

        if (!shipmentId) {
            console.error(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ No valid shipment_id found for ${number}`);
            return null;
        }

        console.log(`[ERROR] Shipment saved (${number}) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ ID: ${shipmentId}`);

        // ====== LOCATIONS ======
        const locations = record.data.locations || [];
        if (locations.length) {
            const locQuery = `
                INSERT INTO locations (location_id, name, state, country, locode, lat, lng, shipment_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name=VALUES(name), state=VALUES(state), country=VALUES(country),
                    locode=VALUES(locode), lat=VALUES(lat), lng=VALUES(lng);
            `;
            for (const l of locations) {
                await dbQuerySR(locQuery, [
                    l.id ?? l.location_id ?? null,
                    l.name ?? null,
                    l.state ?? null,
                    l.country ?? null,
                    l.locode ?? null,
                    l.lat ?? null,
                    l.lng ?? null,
                    shipmentId
                ]);
            }
        }

        // ====== ROUTE POL ======
        const route = record.data.route || {};
        if (route.pol) {
            const pol = route.pol;
            await dbQuerySR(`
                INSERT INTO pol(location_id, date, actual, shipment_id, last_updated_date)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE date=VALUES(date), actual=VALUES(actual), last_updated_date=NOW();
            `, [pol.location ?? null, pol.date ?? null, pol.actual ?? null, shipmentId]);
        }

        // ====== ROUTE POD ======
        if (route.pod) {
            const pod = route.pod;
            await dbQuerySR(`
                INSERT INTO pod(location_id, date, predictive_eta, actual, shipment_id, last_updated_date)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE date=VALUES(date), predictive_eta=VALUES(predictive_eta), actual=VALUES(actual), last_updated_date=NOW();
            `, [pod.location ?? null, pod.date ?? null, pod.predictive_eta ?? null, pod.actual ?? null, shipmentId]);
        }

        // ====== ROUTE PIN & FULL POLYLINE ======
        const routeData = record.data.route_data || {};
        const fullRoute = routeData.route || null;
        if (routeData.pin?.length >= 2) {
            const [lat, lng] = routeData.pin;
            const updateResult = await dbQuerySR(
                `UPDATE route SET lat = ?, \`long\` = ?, route_json = ? WHERE shipment_id = ?`,
                [lat, lng, fullRoute ? JSON.stringify(fullRoute) : null, shipmentId]
            );
            if (updateResult.affectedRows === 0) {
                await dbQuerySR(
                    `INSERT INTO route(lat, \`long\`, route_json, shipment_id) VALUES (?, ?, ?, ?)`,
                    [lat, lng, fullRoute ? JSON.stringify(fullRoute) : null, shipmentId]
                );
            }
        }

        // ====== VESSELS ======
        const vessels = record.data.vessels || [];
        if (vessels.length) {
            const vesselQuery = `
                INSERT INTO vessel(vessel_id, imo, name, shipment_id)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    imo=VALUES(imo),
                    name=VALUES(name);
            `;
            for (const v of vessels) {
                await dbQuerySR(vesselQuery, [
                    v.id ?? v.vessel_id ?? null,
                    v.imo ?? null,
                    v.name ?? null,
                    shipmentId
                ]);
            }
            console.log("[ERROR] Vessels saved");
        }

        // ====== CONTAINERS + EVENTS ======
        const containers = record.data.containers || [];
        if (containers.length) {
            const containersQuery = `
                INSERT INTO containers (container_id, container_number, iso_code, size_type, status, shipment_id)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    iso_code=VALUES(iso_code),
                    size_type=VALUES(size_type),
                    status=VALUES(status);
            `;
            const eventQuery = `
                INSERT INTO events (
                    order_id, location_id, description, event_type, event_code, date, actual,
                    vessel_id, voyage, container_id, shipment_id, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    description=VALUES(description),
                    date=VALUES(date),
                    vessel_id=VALUES(vessel_id),
                    voyage=VALUES(voyage),
                    status=VALUES(status);
            `;

            for (const [i, c] of containers.entries()) {
                await dbQuerySR(containersQuery, [
                    i + 1,
                    c.number ?? c.container_number ?? null,
                    c.iso_code ?? null,
                    c.size_type ?? null,
                    c.status ?? null,
                    shipmentId,
                ]);

                const events = c.events || [];
                for (const e of events) {
                    await dbQuerySR(eventQuery, [
                        e.order_id ?? null,
                        e.location ?? e.location_id ?? null,
                        e.description ?? null,
                        e.event_type ?? null,
                        e.event_code ?? null,
                        e.date ?? null,
                        e.actual ?? null,
                        e.vessel ?? e.vessel_id ?? null,
                        e.voyage ?? null,
                        i + 1,
                        shipmentId,
                        e.status ?? null,
                    ]);
                }
            }
            console.log("[ERROR] Containers and events upserted");
        }

        console.log(`[ERROR] _saveSearatesRecord complete for shipment_id = ${shipmentId}`);
        return shipmentId;

    } catch (err) {
        console.error(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ _saveSearatesRecord failed for ${number}:`, err.message);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Enrich vessels with voyage info from container events
 * @param {object} data - Normalized SeaRates data
 * @returns {object} - Data with enriched vessels
 */
/**
 * Reserve an API quota slot atomically using row-level FOR UPDATE lock
 * @param {string} number - Tracking number
 * @param {string|number} so_id - Sales Order ID
 * @param {string} source - Request source ('FRONTEND', 'AUTOBATCH', etc)
 * @param {string|null} requestedBy - User ID from token
 * @returns {object} - { allowed: boolean, usageCount: number, limit: number, logId: number|null }
 */
async function _reserveQuotaSlot(number, so_id = 0, source = 'FRONTEND', requestedBy = null) {
    let connection;
    try {
        connection = await dbConf.promise().getConnection();
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

        if (usageCount >= limit) {
            await connection.rollback();
            return {
                allowed: false,
                usageCount,
                limit,
                logId: null
            };
        }

        const [insertResult] = await connection.execute(`
            INSERT INTO sea_rates.api_usage_log (api_name, tracking_number, so_id, status_code, request_source, requested_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            'searates_tracking',
            number || null,
            so_id || 0,
            'PENDING',
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
        if (connection) await connection.rollback();
        console.error("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error reserving quota slot:", err.message);
        return { allowed: true, usageCount: 0, limit: 200, logId: null };
    } finally {
        if (connection) connection.release();
    }
}

async function _finalizeReservedApiHit(logId, status, errorData = null) {
    if (!logId) return;
    try {
        await dbQuerySR(`
            UPDATE api_usage_log
            SET status_code = ?, error_details_json = ?
            WHERE log_id = ?
        `, [
            status,
            errorData ? JSON.stringify(errorData) : null,
            logId
        ]);
    } catch (err) {
        console.error("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error finalizing API hit:", err.message);
    }
}

/**
 * Log an API hit attempt
 * @param {string} number - Tracking number
 * @param {string|number} so_id - Sales Order ID
 * @param {string} status - 'SUCCESS', 'FAIL', 'LIMIT', 'LIMIT_ALERT'
 * @param {object|null} errorData - Optional error details
 * @param {string|null} url - Optional URL used for the request
 * @param {string} source - Request source
 * @param {string|null} requestedBy - User ID from token
 */
async function _logApiHit(number, so_id, status, errorData = null, url = null, source = 'FRONTEND', requestedBy = null) {
    try {
        const detail = {
            data: errorData,
            url: _redactUrl(url),
            timestamp: new Date().toISOString()
        };

        await dbQuerySR(`
            INSERT INTO api_usage_log (api_name, tracking_number, so_id, status_code, error_details_json, request_source, requested_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            'searates_tracking',
            number || null,
            so_id || 0,
            status,
            JSON.stringify(detail),
            source,
            requestedBy
        ]);
        console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Logged API Hit: ${number} | Status: ${status}`);
    } catch (err) {
        console.error("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error logging API hit:", err.message);
    }
}

/**
 * Create a system alert ticket in HOTS Service 7
 * @param {string} number - Tracking number that triggered the alert
 */
async function _createHotsAlertTicket(number) {
    const timestamp = blue + new Date().toLocaleString('id') + ' : ';
    console.log(timestamp + `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Generating HOTS Alert Ticket for SeaRates Quota Limit...`);

    try {
        // 1. Check if alert already sent today to avoid spam
        const [existingAlert] = await dbQuerySR(`
            SELECT log_id FROM api_usage_log 
            WHERE api_name = 'searates_tracking' 
            AND status_code = 'LIMIT_ALERT' 
            AND DATE(hit_timestamp) = CURDATE() 
            LIMIT 1
        `);

        if (existingAlert?.length) {
            console.log(timestamp + "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Alert ticket already created today. Skipping.");
            return;
        }

        // 2. Fetch Service 7 Config
        const [serviceConfig] = await dbQuery("SELECT service_name FROM m_service WHERE service_id = 7");
        if (!serviceConfig?.length) {
            console.error(timestamp + "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Service 7 not found in m_service");
            return;
        }

        // 3. Generate Ticket ID (using HOTS logic)
        // Note: We'll use a simplified version of generateCustomTicketID logic for system alert
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const prefix = `26${dateStr}07`; // Assuming 26 is the year/system prefix, 07 is service_id

        const [lastTicket] = await dbQuery(`
            SELECT ticket_id FROM t_ticket 
            WHERE ticket_id LIKE ? ORDER BY ticket_id DESC LIMIT 1
        `, [`${prefix}%`]);

        let seq = 1;
        if (lastTicket?.length) {
            const lastSeq = parseInt(lastTicket[0].ticket_id.slice(-4));
            seq = lastSeq + 1;
        }
        const ticketId = `${prefix}${seq.toString().padStart(4, '0')}`;

        // 4. Insert into t_ticket
        await dbQuery(`
            INSERT INTO t_ticket (ticket_id, service_id, status_id, created_by, creation_date, last_update, workflow_step)
            VALUES (?, 7, 1, 0, NOW(), NOW(), 1)
        `, [ticketId]);

        // 5. Insert into t_ticket_detail (EAV structure)
        const details = [
            [ticketId, 'requester_name', 'Requester Name', 'System Alert', null, 'text', null, null, 0, JSON.stringify({ label: 'Requester Name' })],
            [ticketId, 'support_type', 'Support Type', 'Software Issue', null, 'dropdown', null, null, 0, JSON.stringify({ label: 'Support Type' })],
            [ticketId, 'urgency', 'Urgency', 'Critical', null, 'dropdown', null, null, 0, JSON.stringify({ label: 'Urgency' })],
            [ticketId, 'issue_description', 'Issue Description',
                `SeaRates daily limit (200) has been reached.\nTriggered by Tracking Number: ${number}\nPlease check for SQL logic errors or potential data leaks in srtsController.js.`,
                null, 'textarea', null, null, 0, JSON.stringify({ label: 'Issue Description' })
            ]
        ];

        await dbQuery(
            'INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_id, field_type, row_index, column_key, revision, field_meta_json) VALUES ?',
            [details]
        );

        // 6. Log the alert creation
        await _logApiHit(number, 0, 'LIMIT_ALERT', { ticket_id: ticketId });
        console.log(timestamp + `[ERROR] HOTS Alert Ticket Created: ${ticketId}`);

    } catch (err) {
        console.error(timestamp + "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Failed to create alert ticket:", err.message);
    }
}


function _enrichVesselsWithVoyage(data) {
    if (!data?.vessels?.length || !data?.containers?.length) return data;

    data.vessels = data.vessels.map(vessel => {
        const eventWithVoyage = data.containers
            .flatMap(c => c.events || [])
            .find(e => (e.vessel === vessel.id || e.vessel_id === vessel.id) && e.voyage);

        return {
            ...vessel,
            voyage: eventWithVoyage?.voyage || null
        };
    });

    return data;
}

/**
 * Sync tracking results to Online Order (IOD) for audience visibility
 * @param {string} number - Tracking number
 * @param {object} data - Normalized SeaRates data
 * @param {number} target_so_id - Optional: Target specific Sales Order ID
 */
async function _syncToOnlineOrder(number, data, target_so_id = null) {
    try {
        const route = data.route || {};
        const metadata = data.metadata || {};

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Delivery Detection Logic:
        // 1. Check if POD (Port of Delivery) has an ACTUAL arrival date
        // 2. OR Check if SeaRates metadata status explicitly says "DELIVERED"
        const isPodActual = route.pod?.actual === true;
        const isMetadataDelivered = metadata.status?.toUpperCase() === "DELIVERED" || metadata.status?.toUpperCase() === "ARRIVAL";

        const ata = isPodActual ? route.pod.date : (isMetadataDelivered ? new Date().toISOString().slice(0, 10) : null);
        const atd = route.pol?.actual === true ? route.pol.date : null;
        const scac = metadata.sealine || null;

        let soIds = [];

        if (target_so_id && target_so_id != 0 && target_so_id != "0") {
            soIds = [target_so_id];
        } else {
            // Fuzzy Find all SOs sharing this tracking number
            const [sos] = await dbQuery(`
                SELECT DISTINCT r.so_id 
                FROM iod.trs_realization r
                LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
                WHERE i.bl_no = ? OR r.book_no = ? OR r.cont_id = ?
            `, [number, number, number]);

            if (sos?.length) {
                soIds = sos.map(s => s.so_id);
            }
        }

        if (!soIds.length) return;

        // 2. Batch Update trs_realization_searates
        const updateRealizationQuery = `
         INSERT INTO iod.trs_realization_searates 
                (so_id, invoice_id, number, ata, atd, scac, type)
            SELECT 
                so_id, 
                invoice_id, 
                ?,        -- number (replacing cont_id)
                ?,        -- ata
                ?,        -- atd
                ?,        -- scac
                'ct'      -- type (fixed value)
            FROM iod.trs_realization 
            WHERE so_id IN (?)
            ON DUPLICATE KEY UPDATE 
                invoice_id = VALUES(invoice_id),
                ata = VALUES(ata),
                atd = VALUES(atd),
                scac = VALUES(scac),
                type = VALUES(type)`;
        await dbQuery(updateRealizationQuery, [number, ata, atd, scac, soIds]);

        // 3. Batch Auto-close Orders if Arrived
        if (ata || isMetadataDelivered) {
            const updateOrderQuery = `
                UPDATE iod.m_order mo
                JOIN iod.trs_sales_order tso ON mo.order_id = tso.e_order
                SET mo.status = 4
                WHERE tso.so_id IN (?) AND mo.status < 4
            `;
            await dbQuery(updateOrderQuery, [soIds]);
            console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Synced ${soIds.length} orders to DELIVERED status for ${number}.`);
        }
    } catch (err) {
        console.error("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error syncing to Online Order:", err.message);
    }
}


// ============================================
// [ERROR] EXPORTED CONTROLLER FUNCTIONS
// ============================================

module.exports = {

    GetSeaRatesTrackUser: async (req, res) => {
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const number = req.params.number;
        const refresh = req.query.refresh;
        const so_id = req.params.so_id || "0";

        if (!req.dataToken?.user_id) {
            console.log(timestamp + " Unauthorized!");
            return res.status(401).send({ error: "Unauthorized" });
        }

        console.log("trackuser");

        let connection;
        try {
            connection = await dbConf.promise().getConnection();

            const sql = `
                SELECT
                    s.shipment_id,
                    s.number,
                    s.so_id,
                    s.sealine_name,
                    s.status,
                    c.container_number,
                    e.*,
                    l.name AS location_name,
                    l_max.location_list_id,
                    l.lat AS location_lat,
                    l.lng AS location_lang,
                    r.long AS pin_long,
                    r.lat AS pin_lat,
                    v.vessel_id AS vessel_vesid,
                    v.name,
                    v.imo AS vimo,
                    e.vessel_id AS event_vessel,
                    pod.location_id AS pod_id,
                    DATE_FORMAT(pod.date, '%Y-%m-%d') AS pod_date,
                    pol.location_id AS pol_id,
                    DATE_FORMAT(pol.date, '%Y-%m-%d') AS pol_date,
                    DATE_FORMAT(e.date, '%Y-%m-%d') AS e_date
                FROM sea_rates.shipments s
                LEFT JOIN sea_rates.containers c ON s.shipment_id = c.shipment_id
                LEFT JOIN sea_rates.events e ON c.container_id = e.container_id
                LEFT JOIN sea_rates.locations l ON e.shipment_id = l.shipment_id AND e.location_id = l.location_id
                LEFT JOIN (
                    SELECT event_id, MAX(location_id) AS location_list_id
                    FROM sea_rates.events
                    GROUP BY event_id
                ) l_max ON l_max.event_id = e.event_id
                LEFT JOIN sea_rates.route r ON s.shipment_id = r.shipment_id
                LEFT JOIN sea_rates.vessel v ON s.shipment_id = v.shipment_id AND e.vessel_id = v.vessel_id
                LEFT JOIN sea_rates.pod pod ON s.shipment_id = pod.shipment_id
                LEFT JOIN sea_rates.pol pol ON s.shipment_id = pol.shipment_id
                WHERE (CAST(s.so_id AS CHAR) = ?)
                AND (
                    s.number = ?
                    AND s.shipment_id = (
                        SELECT shipment_id FROM sea_rates.shipments
                        WHERE number = ?
                        ORDER BY last_updated_date DESC
                        LIMIT 1
                    )
                )
                ORDER BY e.date DESC;
            `;


            const stream = connection.queryStream(sql, [so_id, number]);
            const results = [];

            for await (const row of stream) {
                results.push(row);
            }

            const shipmentData = {};

            results.forEach(row => {
                const shipmentId = row.shipments_id;
                if (!shipmentData[shipmentId]) {
                    shipmentData[shipmentId] = {
                        shipment_id: shipmentId,
                        so_id: row.so_id,
                        number: row.number,
                        container_status: row.status,
                        container: {
                            container_id: row.container_id,
                            container_number: row.container_number,
                            size: row.size_type
                        },
                        locations: [],
                        container_events: [],
                        pin_location: [],
                        vessels: [],
                        dataRoute: [{ pod: [], pol: [] }]
                    };
                }

                if (row.location_list_id) {
                    const exists = shipmentData[shipmentId].locations.find(l => l.location_list_id === row.location_list_id);
                    if (!exists) {
                        shipmentData[shipmentId].locations.push({
                            location_list_id: row.location_list_id,
                            name: row.location_name,
                            state: row.state,
                            country: row.country,
                            locode: row.locode,
                            lat: row.location_lat,
                            lng: row.location_lang
                        });
                    }
                }

                if (row.event_id) {
                    const exists = shipmentData[shipmentId].container_events.find(e => e.event_id === row.event_id);
                    if (!exists) {
                        shipmentData[shipmentId].container_events.push({
                            event_id: row.event_id,
                            order_id: row.order_id,
                            location_id: row.location_id,
                            description: row.description,
                            event_type: row.event_type,
                            vessel_id: row.event_vessel,
                            event_code: row.event_code,
                            date: formatDate(row.e_date),
                            actual: row.actual,
                            voyage: row.voyage,
                            container_id: row.container_id,
                            shipment_id: row.shipment_id
                        });
                    }
                }

                if (row.pin_lat && row.pin_long) {
                    const pins = shipmentData[shipmentId].pin_location;
                    const exists = pins.some(pin =>
                        parseFloat(pin.longitude).toFixed(6) === parseFloat(row.pin_long).toFixed(6) &&
                        parseFloat(pin.latitude).toFixed(6) === parseFloat(row.pin_lat).toFixed(6)
                    );
                    if (!exists) {
                        pins.push({ latitude: parseFloat(row.pin_lat), longitude: parseFloat(row.pin_long) });
                    }
                }

                if (row.vessel_id) {
                    const exists = shipmentData[shipmentId].vessels.find(v => v.imo === row.vimo);
                    if (!exists) {
                        shipmentData[shipmentId].vessels.push({
                            imo: row.vimo,
                            name: row.name,
                            vessel_id: row.vessel_vesid
                        });
                    }
                }

                if (row.pod_id) {
                    const exists = shipmentData[shipmentId].dataRoute[0].pod.find(p => p.location === row.pod_id);
                    if (!exists) {
                        shipmentData[shipmentId].dataRoute[0].pod.push({
                            location: row.pod_id,
                            date: formatDate(row.pod_date)
                        });
                    }
                }

                if (row.pol_id) {
                    const exists = shipmentData[shipmentId].dataRoute[0].pol.find(p => p.location === row.pol_id);
                    if (!exists) {
                        shipmentData[shipmentId].dataRoute[0].pol.push({
                            location: row.pol_id,
                            date: formatDate(row.pol_date)
                        });
                    }
                }
            });

            const responseData = Object.values(shipmentData);
            if (!responseData.length) return res.status(400).json({ message: "No Data Tracking Yet" });

            return res.status(200).send(responseData);

        } catch (err) {
            console.log(timestamp + " Error GetSeaRatesTrackUser:", err);
            return res.status(500).send({ error: "Internal Server Error", details: err });
        } finally {
            if (connection) connection.release();
        }
    },



    GetSeaRatesTrackNumber: async (req, res) => {
        const rawNumber = req.params.number?.toString() || "";
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const number = rawNumber.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase(); // Normalize: strip hyphens/spaces
        const so_id = req.params.so_id?.toString() || "0";
        
        // Priority: Query Params (from new UI) > Legacy Params
        const sealine = req.query?.sealine?.toString() || req.params?.sealine?.toString() || "auto";
        const trackingType = req.query?.type?.toString() || "auto"; // container, bl, booking
        
        const refresh = req.query?.refresh === "true";

        console.log("so_id dari GetSeaRatesTrackNumber", so_id);

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ Main execution flow
        try {

            // 1ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ CHECK LOCAL DATABASE FIRST
            const results = await dbQuerySR(`
                SELECT 
                       s.shipment_id ,
                       s.last_updated_date ,
                       s.number ,
                       s.so_id ,
                       s.sealine_name ,
                       s.status ,
                       c.container_number ,
                       e.event_id ,
                       e.description ,
                       e.event_type ,
                       e.event_code ,
                       e.date ,
                       e.actual ,
                       e.vessel_id ,
                       e.voyage ,
                       e.location_id ,
                       e.order_id,
                       l.name as location_name,
                       l.lat as location_lat ,
                       l.lng as location_lng ,
                       v.vessel_id as vessel_vesid,
                       v.name as vessel_name,
                       v.imo as vessel_imo,
                       ts.ata as integration_ata
                   FROM sea_rates.shipments s 
                   LEFT JOIN iod.trs_realization_searates ts ON s.so_id = ts.so_id
                   LEFT JOIN sea_rates.containers c 	
                       ON s.shipment_id = c.shipment_id 
                   LEFT JOIN sea_rates.events e 
                       ON e.shipment_id = s.shipment_id 
                       AND e.container_id = c.container_id 
                   LEFT JOIN sea_rates.locations l 
                       ON s.shipment_id = l.shipment_id 
                       AND e.location_id = l.location_id 
                   LEFT JOIN sea_rates.vessel v  
                       ON s.shipment_id = v.shipment_id 
                       AND v.vessel_id = e.vessel_id 
                   WHERE 
                   (
                       REPLACE(s.number, "-", "") = ? 
                       OR s.number = ? 
                       OR REPLACE(c.container_number, "-", "") = ? 
                       OR c.container_number = ?
                   )
                   AND (s.so_id = ? OR ? = '0')
                   order by e.order_id ASC 
            `, [number, rawNumber, number, rawNumber, so_id, so_id]);

            // 2ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ DETERMINE IF REFRESH NEEDED (Smart Caching)
            const isArrived = results.some(r =>
                _isDeliveredStatus(r.status) ||
                (r.actual === 1 && r.location_name && r.description?.toLowerCase().includes('arrival')) ||
                r.integration_ata !== null
            );
            const cacheEntry = await _getFreshTrackingCacheEntry(number, so_id);
            const reload = _shouldRefreshShipmentData(results, { refresh, isArrived, cacheEntry });

            // 3ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ FETCH FROM SEARATES IF NEEDED
            if (!results.length || reload) {
                if (!results.length && !refresh && cacheEntry?.payload?.data && !cacheEntry?.last_error_code) {
                    const cachedNormalized = _normalizeSeaRatesData(cacheEntry.payload);
                    if (cachedNormalized) {
                        const enrichedData = _enrichVesselsWithVoyage(cachedNormalized);
                        return res.status(200).send({
                            message: "Loaded from container tracking cache",
                            data: { data: enrichedData }
                        });
                    }
                }

                if (!results.length && !refresh && cacheEntry?.last_error_code) {
                    return res.status(404).send({
                        status: "error",
                        message: cacheEntry.last_error_code,
                        searched: {
                            number: cacheEntry.tracking_number || number,
                            sealine: cacheEntry.sealine || "auto",
                            type: cacheEntry.tracking_type || "ct"
                        },
                        data: cacheEntry.payload || null
                    });
                }

                const mappingRows = await _loadTrackingMappings({ number, rawNumber, soId: so_id, includeEOrder: false });
                
                // [MOD] Orphan Support: Default to dummy mapping if not found in IOD
                let resolvedMapping = mappingRows?.[0];
                if (!resolvedMapping) {
                    resolvedMapping = {
                        so_id: 0,
                        invoice_id: "0",
                        shipment_id: null,
                        cont_id: number,
                        internal_etd: null
                    };
                }

                const trackingContext = _buildTrackingContext(mappingRows.length > 0 ? mappingRows : [resolvedMapping], {
                    rawNumber,
                    normalizedNumber: number,
                    soId: so_id,
                    sealineOverride: sealine,
                    trackingTypeOverride: trackingType
                });

                const fetchResult = await _fetchBestSeaRatesMatch({
                    containerNumber: number,
                    trackingNumber: trackingContext.trackingNumber,
                    trackingType: trackingContext.trackingType,
                    scacCandidates: trackingContext.scacCandidates,
                    expected: trackingContext.expected,
                    soId: so_id !== "0" ? so_id : (resolvedMapping.so_id ?? 0),
                    requestedBy: req.dataToken?.uid,
                    source: "FRONTEND"
                });

                if (fetchResult.quotaBlocked) {
                    await _createHotsAlertTicket(number);
                    await _logApiHit(number, so_id, 'LIMIT', null, null, 'FRONTEND', req.dataToken?.uid);
                    return res.status(429).send({
                        message: "Daily SeaRates tracking limit (200) has been reached. Please contact IT Support (Service 7).",
                        usage: fetchResult.quota?.usageCount,
                        limit: fetchResult.quota?.limit
                    });
                }

                if (fetchResult.normalizedData) {
                    const record = {
                        so_id: so_id !== "0" ? so_id : (resolvedMapping.so_id ?? 0),
                        invoice_id: resolvedMapping.invoice_id ?? null,
                        shipment_id: results[0]?.shipment_id ?? resolvedMapping.shipment_id ?? null,
                        cont_id: trackingContext.trackingNumber,
                        data: fetchResult.normalizedData
                    };

                    await _saveSearatesRecord(record, trackingContext.trackingNumber);
                    await _syncToOnlineOrder(trackingContext.trackingNumber, fetchResult.normalizedData, record.so_id);
                    await _upsertTrackingCacheEntry({
                        containerNumber: number,
                        soId: record.so_id,
                        trackingNumber: trackingContext.trackingNumber,
                        trackingType: trackingContext.trackingType,
                        sealine: trackingContext.scacCandidates.join(","),
                        normalizedData: fetchResult.normalizedData,
                        rawResponse: fetchResult.rawResponse,
                        match: fetchResult.match,
                        isHistorical: fetchResult.isHistorical
                    });

                    const enrichedData = _enrichVesselsWithVoyage(fetchResult.normalizedData);
                    return res.status(200).send({
                        message: fetchResult.isHistorical ? "Fetched from SeaRates History and saved" : "Fetched from SeaRates and saved",
                        data: { data: enrichedData }
                    });
                }

                const lastErrorCode = fetchResult.rawResponse?.message || "No matching live or historical data";
                await _upsertTrackingCacheEntry({
                    containerNumber: number,
                    soId: so_id !== "0" ? so_id : (resolvedMapping?.so_id ?? 0),
                    trackingNumber: trackingContext.trackingNumber,
                    trackingType: trackingContext.trackingType,
                    sealine: trackingContext.scacCandidates.join(","),
                    rawResponse: fetchResult.rawResponse,
                    lastErrorCode
                });
                _logApiHit(number, so_id, 'FAIL', fetchResult.rawResponse, fetchResult.successfulUrl, 'FRONTEND', req.dataToken?.uid);

                let errorMessage = "No data from SeaRates";
                if (fetchResult.rawResponse?.message === "WRONG_NUMBER") {
                    errorMessage = `The tracking number "${trackingContext.trackingNumber}" is not recognized by the carrier or has no matching historical record.`;
                } else if (fetchResult.rawResponse?.message === "WRONG_SEALINE") {
                    errorMessage = `The sealines tried (${trackingContext.scacCandidates.join(', ')}) are incorrect for tracking number "${trackingContext.trackingNumber}".`;
                } else if (fetchResult.rawResponse?.message) {
                    errorMessage = fetchResult.rawResponse.message;
                }

                return res.status(404).send({
                    status: "error",
                    message: errorMessage,
                    searched: {
                        number: trackingContext.trackingNumber,
                        sealine: trackingContext.scacCandidates,
                        type: trackingContext.trackingType
                    },
                    url: _redactUrl(fetchResult.successfulUrl),
                    data: fetchResult.rawResponse
                });
            }

            // 6ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ RE-SYNC STATUS ACCURACY (Ensures delivered status trickles down even from cache)
            if (results.length > 0) {
                const firstRow = results[0];
                const cachedDataForSync = {
                    metadata: { status: firstRow.status, sealine: firstRow.sealine_name },
                    route: { pod: { actual: firstRow.status?.toUpperCase() === "DELIVERED" || firstRow.status?.toUpperCase() === "ARRIVAL" } }
                };
                _syncToOnlineOrder(number, cachedDataForSync, (so_id !== "0" ? so_id : null) ?? firstRow.so_id ?? 0);
            }

            // 7ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ RETURN CACHED DATA FROM DB
            const shipmentData = {};
            for (const row of results) {
                const id = row.shipment_id;
                if (!shipmentData[id]) {
                    shipmentData[id] = {
                        so_id: so_id ?? results[0]?.so_id ?? 0,
                        shipment_id: id,
                        metadata: {
                            last_updated_date: row.last_updated_date,
                            number: row.number,
                            so_id: row.so_id,
                            sealine_name: row.sealine_name,
                            status: row.status
                        },
                        container: [],
                        events: [],
                        locations: [],
                        vessels: []
                    };
                }

                // Containers
                if (row.container_number && !shipmentData[id].container.some(c => c.container_number === row.container_number)) {
                    shipmentData[id].container.push({
                        container_number: row.container_number,
                        so_id: row.so_id,
                        sealine_name: row.sealine_name,
                        container_status: row.status
                    });
                }
                // Events - deduplicate based on order_id, event_code, and location_id
                if (row.event_id && !shipmentData[id].events.some(e =>
                    e.order_id === row.order_id &&
                    e.event_code === row.event_code &&
                    e.location_id === row.location_id
                )) {
                    shipmentData[id].events.push({
                        event_id: row.event_id,
                        order_id: row.order_id,
                        description: row.description,
                        event_type: row.event_type,
                        event_code: row.event_code,
                        date: row.date,
                        actual: row.actual,
                        vessel_id: row.vessel_id,
                        voyage: row.voyage,
                        location_id: row.location_id
                    });
                }

                // Locations (add IDs)
                if (row.location_name && !shipmentData[id].locations.some(l => l.name === row.location_name)) {
                    shipmentData[id].locations.push({
                        location_id: row.location_id,
                        location_list_id: row.location_id,
                        name: row.location_name,
                        lat: row.location_lat,
                        lng: row.location_lng
                    });
                }

                // Vessels - collect with voyage from events
                if (row.vessel_vesid && !shipmentData[id].vessels.some(v => v.vessel_id === row.vessel_vesid)) {
                    shipmentData[id].vessels.push({
                        vessel_id: row.vessel_vesid,
                        name: row.vessel_name,
                        imo: row.vessel_imo,
                        voyage: row.voyage || null  // Get voyage from event
                    });
                } else if (row.vessel_vesid && row.voyage) {
                    // Update voyage if vessel exists but didn't have voyage yet
                    const existingVessel = shipmentData[id].vessels.find(v => v.vessel_id === row.vessel_vesid);
                    if (existingVessel && !existingVessel.voyage) {
                        existingVessel.voyage = row.voyage;
                    }
                }
            }

            // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ Add route + pin_location from separate tables
            await Promise.all(Object.keys(shipmentData).map(async (id) => {
                const [pol] = await dbQuerySR(`
                    SELECT location_id as location, date, actual FROM sea_rates.pol WHERE shipment_id = ? LIMIT 1
                `, [id]);

                const [pod] = await dbQuerySR(`
                    SELECT location_id as location, date, actual, predictive_eta FROM sea_rates.pod WHERE shipment_id = ? LIMIT 1
                `, [id]);

                const [pin] = await dbQuerySR(`
                    SELECT lat, \`long\` FROM sea_rates.route WHERE shipment_id = ? LIMIT 1
                `, [id]);

                shipmentData[id].dataRoute = [{
                    pol: pol ? [pol] : [],
                    pod: pod ? [pod] : []
                }];
                shipmentData[id].pin_location = pin ? { lat: pin.lat, lng: pin.long } : {};
            }));

            console.log(` Returning cached shipment data (${Object.keys(shipmentData).length} records)`);
            return res.status(200).send(Object.values(shipmentData));

        } catch (error) {
            console.log(timestamp + " Error GetSeaRatesTrackNumber:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }
    },


    GetSeaRatesTrackNumberandsoid: async (req, res) => {
        const rawNumber = req.params.number?.toString() || "";
        const date = new Date();
        const timestamp = date.toLocaleString("id-ID");
        const number = rawNumber.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
        const so_id = req.params.so_id?.toString() ?? "0";
        
        // Priority: Query Params (from new UI) > Legacy Params
        const sealine = req.query?.sealine?.toString() || req.params?.sealine?.toString() || "auto";
        const trackingType = req.query?.type?.toString() || "auto"; // container, bl, booking
        
        const refresh = req.query?.refresh === "true";

        console.log("number:", number);
        console.log("so_id:", so_id);

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ Main flow
        try {

            // 1ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ CHECK LOCAL DATABASE FIRST
            const results = await dbQuerySR(`
                SELECT 
                        s.shipment_id ,
                        s.last_updated_date ,
                        s.number ,
                        s.so_id ,
                        s.sealine_name ,
                        s.status ,
                        c.container_number ,
                        e.event_id ,
                        e.description ,
                        e.event_type ,
                        e.event_code ,
                        e.date ,
                        e.actual ,
                        e.vessel_id ,
                        e.voyage ,
                        e.location_id ,
                        e.order_id,
                        l.name as location_name,
                        l.lat as location_lat ,
                        l.lng as location_lng ,
                        v.vessel_id as vessel_vesid,
                        v.name as vessel_name,
                        v.imo as vessel_imo,
                        tr.po_number
                    FROM sea_rates.shipments s 
                    LEFT JOIN sea_rates.containers c 	
                        ON s.shipment_id = c.shipment_id 
                    LEFT JOIN sea_rates.events e 
                        ON e.shipment_id = s.shipment_id 
                        AND e.container_id = c.container_id 
                    LEFT JOIN sea_rates.locations l 
                        ON s.shipment_id = l.shipment_id 
                        AND e.location_id = l.location_id 
                    LEFT JOIN sea_rates.vessel v  
                        ON s.shipment_id = v.shipment_id 
                        AND v.vessel_id = e.vessel_id 
                    LEFT JOIN iod.trs_realization tr
                        ON s.so_id = tr.so_id
                    WHERE 
                        REPLACE(s.number, "-", "") = ? 
                        OR s.number = ?
                        OR s.so_id = ?
                    ORDER BY s.last_updated_date DESC, e.order_id ASC 
            `, [number, rawNumber, so_id]);

            // 2ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ DETERMINE IF REFRESH NEEDED
            const isArrived = results.some(r => 
                _isDeliveredStatus(r.status) || 
                (r.actual === 1 && r.location_name && r.description?.toLowerCase().includes('arrival')) ||
                r.integration_ata !== null
            );
            const cacheEntry = await _getFreshTrackingCacheEntry(number, so_id);
            const reload = _shouldRefreshShipmentData(results, { refresh, isArrived, cacheEntry });

            if (!results.length || reload) {
                if (!results.length && !refresh && cacheEntry?.payload?.data && !cacheEntry?.last_error_code) {
                    const cachedNormalized = _normalizeSeaRatesData(cacheEntry.payload);
                    if (cachedNormalized) {
                        const enrichedData = _enrichVesselsWithVoyage(cachedNormalized);
                        return res.status(200).send([{
                            message: "Loaded from container tracking cache",
                            so_id: so_id !== "0" ? so_id : (cacheEntry.so_id ?? 0),
                            metadata: enrichedData.metadata,
                            containers: enrichedData.containers,
                            route: enrichedData.route,
                            route_data: enrichedData.route_data,
                            po_number: cacheEntry.payload?.data?.metadata?.po_number || ""
                        }]);
                    }
                }

                if (!results.length && !refresh && cacheEntry?.last_error_code) {
                    return res.status(404).send({
                        status: "error",
                        message: cacheEntry.last_error_code,
                        searched: {
                            number: cacheEntry.tracking_number || number,
                            sealine: cacheEntry.sealine || "auto",
                            type: cacheEntry.tracking_type || "ct"
                        },
                        data: cacheEntry.payload || null
                    });
                }

                const mappingRows = await _loadTrackingMappings({ number, rawNumber, soId: so_id, includeEOrder: true });
                
                // [MOD] Orphan Support: Default to dummy mapping
                let mapping = mappingRows?.[0];
                if (!mapping) {
                    mapping = {
                        so_id: 0,
                        invoice_id: "0",
                        shipment_id: results[0]?.shipment_id ?? null,
                        cont_id: number,
                        internal_etd: null
                    };
                }

                const trackingContext = _buildTrackingContext(mappingRows.length > 0 ? mappingRows : [mapping], {
                    rawNumber,
                    normalizedNumber: number,
                    soId: so_id,
                    sealineOverride: sealine,
                    trackingTypeOverride: trackingType
                });

                const fetchResult = await _fetchBestSeaRatesMatch({
                    containerNumber: number,
                    trackingNumber: trackingContext.trackingNumber,
                    trackingType: trackingContext.trackingType,
                    scacCandidates: trackingContext.scacCandidates,
                    expected: trackingContext.expected,
                    soId: so_id !== "0" ? so_id : (mapping.so_id ?? 0),
                    requestedBy: req.dataToken?.uid,
                    source: "FRONTEND"
                });

                if (fetchResult.quotaBlocked) {
                    return res.status(429).send({
                        message: "Daily limit reached.",
                        usage: fetchResult.quota?.usageCount,
                        limit: fetchResult.quota?.limit
                    });
                }

                if (fetchResult.normalizedData) {
                    const record = {
                        so_id: so_id !== "0" ? so_id : (mapping.so_id ?? 0),
                        invoice_id: mapping.invoice_id ?? null,
                        shipment_id: results[0]?.shipment_id ?? mapping.shipment_id ?? null,
                        cont_id: trackingContext.trackingNumber,
                        data: fetchResult.normalizedData
                    };

                    await _saveSearatesRecord(record, trackingContext.trackingNumber);
                    await _syncToOnlineOrder(trackingContext.trackingNumber, fetchResult.normalizedData, record.so_id);
                    await _upsertTrackingCacheEntry({
                        containerNumber: number,
                        soId: record.so_id,
                        trackingNumber: trackingContext.trackingNumber,
                        trackingType: trackingContext.trackingType,
                        sealine: trackingContext.scacCandidates.join(","),
                        normalizedData: fetchResult.normalizedData,
                        rawResponse: fetchResult.rawResponse,
                        match: fetchResult.match,
                        isHistorical: fetchResult.isHistorical
                    });

                    const enrichedData = _enrichVesselsWithVoyage(fetchResult.normalizedData);
                    return res.status(200).send([{
                        message: fetchResult.isHistorical ? "Saved from SeaRates History" : "Saved from SeaRates",
                        so_id: record.so_id,
                        metadata: enrichedData.metadata,
                        containers: enrichedData.containers,
                        route: enrichedData.route,
                        route_data: enrichedData.route_data,
                        po_number: mapping.po_number || null
                    }]);
                }

                const lastErrorCode = fetchResult.rawResponse?.message || "No matching live or historical data";
                await _upsertTrackingCacheEntry({
                    containerNumber: number,
                    soId: so_id !== "0" ? so_id : (mapping?.so_id ?? 0),
                    trackingNumber: trackingContext.trackingNumber,
                    trackingType: trackingContext.trackingType,
                    sealine: trackingContext.scacCandidates.join(","),
                    rawResponse: fetchResult.rawResponse,
                    lastErrorCode
                });
                _logApiHit(trackingContext.trackingNumber, so_id, 'FAIL', fetchResult.rawResponse, fetchResult.successfulUrl, 'FRONTEND', req.dataToken?.uid);

                let errorMessage = "No data from SeaRates";
                if (fetchResult.rawResponse?.message === "WRONG_NUMBER") {
                    errorMessage = `The tracking number "${trackingContext.trackingNumber}" is not recognized by the carrier or has no matching historical record.`;
                } else if (fetchResult.rawResponse?.message === "WRONG_SEALINE") {
                    errorMessage = `The sealines tried (${trackingContext.scacCandidates.join(', ')}) are incorrect for tracking number "${trackingContext.trackingNumber}".`;
                } else if (fetchResult.rawResponse?.message) {
                    errorMessage = fetchResult.rawResponse.message;
                }

                return res.status(404).send({
                    status: "error",
                    message: errorMessage,
                    searched: {
                        number: trackingContext.trackingNumber,
                        sealine: trackingContext.scacCandidates,
                        type: trackingContext.trackingType
                    },
                    url: _redactUrl(fetchResult.successfulUrl),
                    data: fetchResult.rawResponse
                });
            }

            // 6ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ RE-SYNC STATUS ACCURACY (Ensures delivered status trickles down even from cache)
            if (results.length > 0) {
                const firstRow = results[0];
                const cachedDataForSync = {
                    metadata: { status: firstRow.status, sealine: firstRow.sealine_name },
                    route: { pod: { actual: firstRow.status?.toUpperCase() === "DELIVERED" || firstRow.status?.toUpperCase() === "ARRIVAL" } }
                };
                _syncToOnlineOrder(number, cachedDataForSync, so_id ?? firstRow.so_id ?? 0);
            }

            // 7ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ RETURN CACHED DATA FROM DB
            const shipmentData = {};
            for (const row of results) {
                const id = row.shipment_id;
                if (!shipmentData[id]) {
                    shipmentData[id] = {
                        so_id: so_id ?? results[0]?.so_id ?? 0,
                        shipment_id: id,
                        metadata: {
                            last_updated_date: row.last_updated_date,
                            number: row.number,
                            so_id: row.so_id,
                            po_number: row.po_number,
                            sealine_name: row.sealine_name,
                            status: row.status
                        },
                        container: [],
                        events: [],
                        locations: [],
                        vessels: []
                    };
                }

                // Containers
                if (row.container_number && !shipmentData[id].container.some(c => c.container_number === row.container_number)) {
                    shipmentData[id].container.push({
                        container_number: row.container_number,
                        so_id: row.so_id,
                        sealine_name: row.sealine_name,
                        container_status: row.status
                    });
                }
                // Events - deduplicate based on order_id, event_code, and location_id
                if (row.event_id && !shipmentData[id].events.some(e =>
                    e.order_id === row.order_id &&
                    e.event_code === row.event_code &&
                    e.location_id === row.location_id
                )) {
                    shipmentData[id].events.push({
                        event_id: row.event_id,
                        order_id: row.order_id,
                        description: row.description,
                        event_type: row.event_type,
                        event_code: row.event_code,
                        date: row.date,
                        actual: row.actual,
                        vessel_id: row.vessel_id,
                        voyage: row.voyage,
                        location_id: row.location_id
                    });
                }

                // Locations (add IDs)
                if (row.location_name && !shipmentData[id].locations.some(l => l.name === row.location_name)) {
                    shipmentData[id].locations.push({
                        location_id: row.location_id,
                        location_list_id: row.location_id,
                        name: row.location_name,
                        lat: row.location_lat,
                        lng: row.location_lng
                    });
                }

                // Vessels - collect with voyage from events
                if (row.vessel_vesid && !shipmentData[id].vessels.some(v => v.vessel_id === row.vessel_vesid)) {
                    shipmentData[id].vessels.push({
                        vessel_id: row.vessel_vesid,
                        name: row.vessel_name,
                        imo: row.vessel_imo,
                        voyage: row.voyage || null  // Get voyage from event
                    });
                } else if (row.vessel_vesid && row.voyage) {
                    // Update voyage if vessel exists but didn't have voyage yet
                    const existingVessel = shipmentData[id].vessels.find(v => v.vessel_id === row.vessel_vesid);
                    if (existingVessel && !existingVessel.voyage) {
                        existingVessel.voyage = row.voyage;
                    }
                }
            }

            // 3. Add route + pin_location from separate tables
            await Promise.all(Object.keys(shipmentData).map(async (id) => {
                const [pol] = await dbQuerySR(`
                    SELECT location_id as location, date, actual FROM sea_rates.pol WHERE shipment_id = ? LIMIT 1
                `, [id]);

                const [pod] = await dbQuerySR(`
                    SELECT location_id as location, date, actual, predictive_eta FROM sea_rates.pod WHERE shipment_id = ? LIMIT 1
                `, [id]);

                const [pin] = await dbQuerySR(`
                    SELECT lat, \`long\` FROM sea_rates.route WHERE shipment_id = ? LIMIT 1
                `, [id]);

                shipmentData[id].dataRoute = [{
                    pol: pol ? [pol] : [],
                    pod: pod ? [pod] : []
                }];
                shipmentData[id].pin_location = pin ? { lat: pin.lat, lng: pin.long } : {};
            }));

            console.log(`[INFO] Returning cached shipment data (${Object.keys(shipmentData).length} records) for ${number}`);
            return res.status(200).send(Object.values(shipmentData));
        } catch (err) {
            console.error(`${timestamp} Error in GetSeaRatesTrackNumberandsoid:`, err);
            return res.status(500).send({ error: "Internal Server Error", details: err.message });
        }
    },



    SearatesCheck: async (req, res) => {
        const rawNumber = req.params.number?.toString() || "";
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const soIdParam = req.params.so_id || "0";
        const number = rawNumber.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();

        console.log(`${timestamp} Running SearatesCheck for e_order: ${number}`);

        try {
            const checkQuery = `
                SELECT
                    ti.bl_no,
                    tr.book_no,
                    tr.cont_id,
                    tr.so_id,
                    tr.invoice_id,
                    tr.etd as internal_etd,
                    msl.scac as sealine,
                    msl.type as mapping_type,
                    s.last_updated_date,
                    s.status
                FROM trs_realization tr
                LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id AND ti.cont_id = tr.cont_id
                LEFT JOIN mst_container mc ON mc.container_id = tr.cont_size
                LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                LEFT JOIN sea_rates.m_shipping_line msl
                    ON msl.i2i_shipline LIKE CONCAT('%', tr.ship_line, '%')
                    OR msl.i2i_shipline LIKE CONCAT('%', tr.fwd, '%')
                WHERE (tso.e_order = ? OR REPLACE(tr.cont_id, "-", "") = ? OR tr.cont_id = ? OR ti.bl_no = ? OR tr.book_no = ?)
                AND UPPER(COALESCE(mc.container_name, '')) NOT IN (?, ?)
                ${soIdParam !== '0' ? 'AND tr.so_id = ?' : ''}
            `;

            const queryParams = [rawNumber, number, rawNumber, rawNumber, rawNumber, ...EXCLUDED_SEARATES_CONTAINER_NAMES];
            if (soIdParam !== '0') queryParams.push(soIdParam);

            const mappingRows = await dbQuery(checkQuery, queryParams);
            
            // [MOD] Orphan Support: Use default mapping if not found in IOD
            let mapping = mappingRows?.[0];
            if (!mapping) {
                mapping = {
                    so_id: 0,
                    invoice_id: "0",
                    shipment_id: null,
                    cont_id: number,
                    internal_etd: null
                };
            }

            const scacCandidates = mappingRows?.length > 0
                ? [...new Set(mappingRows.map(r => r.sealine).filter(s => !!s))]
                : ['auto'];
            if (scacCandidates.length === 0) scacCandidates.push('auto');

            // 2. DETERMINE IF REFRESH NEEDED
            const lastUpdated = mapping.last_updated_date ? new Date(mapping.last_updated_date) : null;
            const isArrived = _isDeliveredStatus(mapping.status);
            const cacheEntry = await _getFreshTrackingCacheEntry(number, soIdParam);
            const reload = _shouldRefreshShipmentData(
                lastUpdated ? [{ last_updated_date: lastUpdated, status: mapping.status, so_id: mapping.so_id }] : [],
                { refresh: true, isArrived, cacheEntry }
            );

            if (!reload && lastUpdated) {
                console.log(`[INFO] Using cached Searates data for e_order: ${number}`);
                const fullData = await dbQuerySR(`SELECT * FROM sea_rates.v_shipmet_tracking_detail WHERE number = ?`, [mapping.bl_no || mapping.book_no || mapping.cont_id]);

                let analytics = null;
                if (cacheEntry?.payload_json) {
                    try {
                        const payload = typeof cacheEntry.payload_json === 'string' ? JSON.parse(cacheEntry.payload_json) : cacheEntry.payload_json;
                        analytics = payload.match_details || null;
                    } catch (e) { }
                }

                if (Array.isArray(fullData) && fullData.length > 0) {
                    return res.status(200).send({
                        message: "Loaded from Cache",
                        data: {
                            ...fullData[0],
                            tracking_analytics: analytics
                        }
                    });
                }
                return res.status(200).send(fullData);
            }

            // 3. FETCH FROM SEARATES
            console.log(`[INFO] Fetching fresh data for e_order: ${number} (Candidates: ${scacCandidates.join(', ')})`);

            const enrichedMappingRows = await _loadTrackingMappings({ number, rawNumber, soId: soIdParam, includeEOrder: true });
            const resolvedMapping = enrichedMappingRows?.[0] || mapping;
            const trackingContext = _buildTrackingContext(enrichedMappingRows?.length ? enrichedMappingRows : [resolvedMapping], {
                rawNumber,
                normalizedNumber: number,
                soId: soIdParam,
                sealineOverride: "auto"
            });

            const fetchResult = await _fetchBestSeaRatesMatch({
                containerNumber: number,
                trackingNumber: trackingContext.trackingNumber,
                trackingType: trackingContext.trackingType,
                scacCandidates: trackingContext.scacCandidates,
                expected: trackingContext.expected,
                soId: resolvedMapping?.so_id ?? mapping.so_id,
                requestedBy: req.dataToken?.uid,
                source: "FRONTEND"
            });

            if (fetchResult.quotaBlocked) {
                return res.status(429).send({ message: "Daily limit reached.", usage: fetchResult.quota?.usageCount, limit: fetchResult.quota?.limit });
            }

            if (fetchResult.normalizedData) {
                const record = {
                    so_id: resolvedMapping?.so_id ?? mapping.so_id,
                    invoice_id: resolvedMapping?.invoice_id ?? mapping.invoice_id,
                    shipment_id: resolvedMapping?.shipment_id ?? null,
                    cont_id: trackingContext.trackingNumber,
                    data: fetchResult.normalizedData
                };

                await _saveSearatesRecord(record, trackingContext.trackingNumber);
                await _syncToOnlineOrder(trackingContext.trackingNumber, fetchResult.normalizedData, record.so_id);
                await _upsertTrackingCacheEntry({
                    containerNumber: number,
                    soId: record.so_id,
                    trackingNumber: trackingContext.trackingNumber,
                    trackingType: trackingContext.trackingType,
                    sealine: trackingContext.scacCandidates.join(","),
                    normalizedData: fetchResult.normalizedData,
                    rawResponse: fetchResult.rawResponse,
                    match: fetchResult.match,
                    isHistorical: fetchResult.isHistorical
                });
                _logApiHit(trackingContext.trackingNumber, record.so_id, 'SUCCESS', null, fetchResult.successfulUrl, 'FRONTEND', req.dataToken?.uid);

                const enrichedData = _enrichVesselsWithVoyage(fetchResult.normalizedData);
                return res.status(200).send({
                    message: fetchResult.isHistorical ? "Saved from SeaRates History" : "Saved from SeaRates",
                    data: { data: enrichedData }
                });
            }

            const lastErrorCode = fetchResult.rawResponse?.message || "Tracking data not available at SeaRates.";
            await _upsertTrackingCacheEntry({
                containerNumber: number,
                soId: resolvedMapping?.so_id ?? mapping.so_id,
                trackingNumber: trackingContext.trackingNumber,
                trackingType: trackingContext.trackingType,
                sealine: trackingContext.scacCandidates.join(","),
                rawResponse: fetchResult.rawResponse,
                lastErrorCode
            });
            _logApiHit(trackingContext.trackingNumber, resolvedMapping?.so_id ?? mapping.so_id, 'FAIL', fetchResult.rawResponse, fetchResult.successfulUrl || `https://tracking.searates.com/tracking?number=${trackingContext.trackingNumber}`, 'FRONTEND', req.dataToken?.uid);

            let errorMessage = "Tracking data not available at SeaRates.";
            if (fetchResult.rawResponse?.message === "WRONG_NUMBER") {
                errorMessage = `The tracking number "${trackingContext.trackingNumber}" is not recognized by the carrier or has no matching historical record.`;
            } else if (fetchResult.rawResponse?.message === "WRONG_SEALINE") {
                errorMessage = `The sealines tried (${trackingContext.scacCandidates.join(', ')}) are incorrect for tracking number "${trackingContext.trackingNumber}".`;
            } else if (fetchResult.rawResponse?.message) {
                errorMessage = fetchResult.rawResponse.message;
            }

            return res.status(200).send({
                status: "error",
                message: errorMessage,
                searched: {
                    number: trackingContext.trackingNumber,
                    sealine: trackingContext.scacCandidates,
                    type: trackingContext.trackingType
                },
                url: _redactUrl(fetchResult.successfulUrl || `https://tracking.searates.com/tracking?number=${trackingContext.trackingNumber}`),
                data: fetchResult.rawResponse
            });
        } catch (error) {
            console.error(timestamp + " Error at SearatesCheck:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error.message });
        }
    },

    getSealineList: async (req, res) => {
        try {
            const rows = await dbQuerySR(`
                SELECT scac, sealine_name, type
                FROM sea_rates.m_shipping_line
                WHERE scac IS NOT NULL AND scac != ''
                ORDER BY sealine_name ASC
            `);
            return res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('[srtsController] getSealineList error:', err.message);
            return res.status(500).json({ success: false, message: err.message });
        }
    },

}
