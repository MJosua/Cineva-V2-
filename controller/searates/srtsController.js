const { query } = require("express");
const { dbSR, dbQuerySR, dbQuery, dbConf } = require("../../config/db");
const fs = require('fs');
const { default: axios } = require("axios");
const { timeout } = require("puppeteer");

let blue = "\x1b[36m";

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
const key = process.env.SECURITY_API_SEARATES_KEY;


// ============================================
// 🔧 INTERNAL HELPERS (Not Exported)
// ============================================

/**
 * Safe HTTP GET with timeout and retry
 * @param {string} url - The URL to fetch
 * @returns {object|null} - Response data or null on failure
 */
async function _callSeaRatesAPI(url) {
    const controller = new AbortController();
    const timeoutMs = 10000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await axios.get(url, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
        });
        return res.data;
    } catch (err) {
        if (err.name === "AbortError" || err.code === "ECONNABORTED") {
            console.warn(`⚠️ SeaRates timeout: ${url}`);
            await new Promise((r) => setTimeout(r, 2000));
            try {
                const retry = await axios.get(url, { timeout: timeoutMs });
                return retry.data;
            } catch (retryErr) {
                console.error("❌ Retry failed:", retryErr.message);
                return null;
            }
        }
        console.error("❌ Axios error:", err.message);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Validate SeaRates API response has required structure
 * @param {object} data - The data object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function _isValidSeaRatesResponse(data) {
    if (!data) return false;
    if (data.status === "error") return false;
    if (!data.metadata) return false;
    return true;
}

/**
 * Normalize SeaRates response to consistent shape
 * Handles both { data: {...} } wrapper and direct {...} structures
 * @param {object} rawResponse - Raw axios response body
 * @returns {object|null} - Normalized data or null if invalid
 */
function _normalizeSeaRatesData(rawResponse) {
    if (!rawResponse) return null;

    // Handle wrapped response: { data: { metadata: {...} } }
    const data = rawResponse?.data || rawResponse;

    if (!_isValidSeaRatesResponse(data)) {
        console.warn("⚠️ SeaRates response failed validation:", JSON.stringify(data)?.substring(0, 200));
        return null;
    }

    return {
        metadata: data.metadata || {},
        containers: data.containers || [],
        locations: data.locations || [],
        vessels: data.vessels || [],
        route: data.route || {},
        route_data: data.route_data || {}
    };
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
        console.warn(`⚠️ Cannot save: record.data is missing for ${number}`);
        return null;
    }

    const metadata = record.data.metadata;
    if (!metadata) {
        console.warn(`⚠️ Cannot save: metadata is missing for ${number}`);
        return null;
    }

    let connection;
    try {
        connection = await dbConf.promise().getConnection();

        // ====== SHIPMENT ======
        const shipmentQuery = `
            INSERT INTO shipments (
                shipment_id, number, so_id, type, sealine, sealine_name, status, last_updated_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
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
            metadata.type ?? null,
            metadata.sealine ?? null,
            metadata.sealine_name ?? null,
            metadata.status ?? null,
        ]);

        const shipmentId =
            shipmentResult.insertId ||
            (await dbQuerySR("SELECT shipment_id FROM shipments WHERE number = ?", [metadata.number ?? number]))?.[0]?.[0]?.shipment_id;

        if (!shipmentId) {
            console.error(`❌ No valid shipment_id found for ${number}`);
            return null;
        }

        console.log(`✅ Shipment saved (${number}) → ID: ${shipmentId}`);

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

        // ====== ROUTE PIN ======
        const routeData = record.data.route_data || {};
        if (routeData.pin?.length >= 2) {
            const [lat, lng] = routeData.pin;
            const updateResult = await dbQuerySR(
                `UPDATE route SET lat = ?, \`long\` = ? WHERE shipment_id = ?`,
                [lat, lng, shipmentId]
            );
            if (updateResult.affectedRows === 0) {
                await dbQuerySR(
                    `INSERT INTO route(lat, \`long\`, shipment_id) VALUES (?, ?, ?)`,
                    [lat, lng, shipmentId]
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
            console.log("✅ Vessels saved");
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
            console.log("✅ Containers and events upserted");
        }

        console.log(`✅ _saveSearatesRecord complete for shipment_id = ${shipmentId}`);
        return shipmentId;

    } catch (err) {
        console.error(`❌ _saveSearatesRecord failed for ${number}:`, err.message);
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


// ============================================
// ✅ EXPORTED CONTROLLER FUNCTIONS
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
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const number = req.params.number?.toString();
        const so_id = req.params.so_id?.toString() || "0";
        const sealine = req.params?.sealine?.toString() || "auto";
        const refresh = req.query?.refresh === "true";

        console.log("so_id dari GetSeaRatesTrackNumber", so_id);

        let connection;

        // 🟣 Main execution flow
        try {

            connection = await dbConf.promise().getConnection();

            // 1️⃣ CHECK LOCAL DATABASE FIRST
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
                       v.imo as vessel_imo
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
                   WHERE 
                   (s.number = ? OR c.container_number = ?)
                   AND (s.so_id = ? OR ? = '0')
                   order by e.order_id ASC 
           `, [number, number, so_id, so_id]);

            // 2️⃣ DETERMINE IF REFRESH NEEDED
            let reload = false;
            if (refresh) {
                reload = true;
                console.log(`🔄 Refresh requested for ${number}, fetching fresh data from SeaRates...`);
            } else if (results.length) {
                const diffHours = (new Date() - new Date(results[0].last_updated_date)) / (1000 * 60 * 60);
                reload = diffHours >= 5 || !results[0].so_id;
            }

            // 3️⃣ FETCH FROM SEARATES IF NEEDED
            if (!results.length || reload) {
                const checkQuery = so_id === "0" ? `
                   SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                   FROM trs_realization tr
                   LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                   LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                   LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                   WHERE s.number = ? ORDER BY s.last_updated_date DESC LIMIT 1
               ` : `
                   SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                   FROM trs_realization tr
                   LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                   LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                   LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                   WHERE s.so_id = ? ORDER BY s.last_updated_date DESC LIMIT 1
               `;

                const checkresult = await dbQuery(checkQuery, [so_id === "0" ? number : so_id]);
                const bl_no = checkresult[0]?.bl_no;

                const url = bl_no
                    ? `https://tracking.searates.com/tracking?api_key=${key}&number=${bl_no}&sealine=${sealine}&force_update=false&type=bl&route=true&ais=false`
                    : `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=${sealine}&force_update=false&route=true&ais=false`;

                let searatesRes = await _callSeaRatesAPI(url);

                // 4️⃣ VALIDATE API RESPONSE
                let normalizedData = _normalizeSeaRatesData(searatesRes);

                if (!normalizedData) {
                    console.warn(`⚠️ First attempt failed for ${number}, retrying with auto sealine...`);
                    const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=auto&force_update=false&route=true&ais=false`;
                    searatesRes = await _callSeaRatesAPI(fallbackUrl);
                    normalizedData = _normalizeSeaRatesData(searatesRes);
                }

                // 5️⃣ SAVE ONLY IF VALID
                if (normalizedData) {
                    const record = {
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,
                        shipment_id: checkresult[0]?.shipment_id ?? null,
                        cont_id: number,
                        data: normalizedData
                    };

                    await _saveSearatesRecord(record, number);

                    // Enrich vessels with voyage
                    const enrichedData = _enrichVesselsWithVoyage(normalizedData);

                    return res.status(200).send({
                        message: "Fetched from SeaRates and saved",
                        data: { data: enrichedData }
                    });
                } else {
                    console.warn(`⚠️ No valid data from SeaRates for ${number}`);
                    return res.status(404).send({ message: "No data from SeaRates" });
                }
            }

            // 6️⃣ RETURN CACHED DATA FROM DB
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

            // 🧭 Add route + pin_location from separate tables
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

            console.log(`✅ Returning cached shipment data (${Object.keys(shipmentData).length} records)`);
            return res.status(200).send(Object.values(shipmentData));

        } catch (error) {
            console.log(timestamp + " Error GetSeaRatesTrackNumber:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        } finally {
            if (connection) connection.release();
        }
    },


    GetSeaRatesTrackNumberandsoid: async (req, res) => {
        const date = new Date();
        const timestamp = date.toLocaleString("id-ID");
        const number = req.params.number?.toString() ?? "";
        const so_id = req.params.so_id?.toString() ?? "0";
        const sealine = req.params?.sealine?.toString() || "auto";
        const refresh = req.query?.refresh === "true";

        console.log("number:", number);
        console.log("so_id:", so_id);

        // 🟣 Main flow
        let connection;
        try {
            connection = await dbConf.promise().getConnection();

            // 1️⃣ CHECK LOCAL DATABASE FIRST
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
                        v.imo as vessel_imo
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
                    WHERE s.number = ?
                        OR s.so_id = ?
                    order by e.order_id ASC 
            `, [number, so_id]);

            // 2️⃣ DETERMINE IF REFRESH NEEDED
            let reload = false;
            if (refresh) {
                reload = true;
                console.log(`🔄 Refresh requested for ${number}, fetching fresh data from SeaRates...`);
            } else if (results.length) {
                const diffHours = (new Date() - new Date(results[0].last_updated_date)) / (1000 * 60 * 60);
                reload = diffHours >= 5 || !results[0].so_id;
            }

            // 3️⃣ FETCH FROM SEARATES IF NEEDED
            if (!results.length || reload) {
                const checkQuery = so_id === "0" ? `
                    SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                    FROM trs_realization tr
                    LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                    LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                    LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                    WHERE s.number = ? ORDER BY s.last_updated_date DESC LIMIT 1
                ` : `
                    SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                    FROM trs_realization tr
                    LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                    LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                    LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                    WHERE s.so_id = ? ORDER BY s.last_updated_date DESC LIMIT 1
                `;

                const checkresult = await dbQuery(checkQuery, [so_id === "0" ? number : so_id]);
                const bl_no = checkresult[0]?.bl_no;

                const url = bl_no
                    ? `https://tracking.searates.com/tracking?api_key=${key}&number=${bl_no}&sealine=${sealine}&force_update=false&type=bl&route=true&ais=false`
                    : `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=${sealine}&force_update=false&route=true&ais=false`;

                let searatesRes = await _callSeaRatesAPI(url);

                // 4️⃣ VALIDATE API RESPONSE
                let normalizedData = _normalizeSeaRatesData(searatesRes);

                if (!normalizedData) {
                    console.warn(`⚠️ First attempt failed for ${number}, retrying with auto sealine...`);
                    const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=auto&force_update=false&route=true&ais=false`;
                    searatesRes = await _callSeaRatesAPI(fallbackUrl);
                    normalizedData = _normalizeSeaRatesData(searatesRes);
                }

                // 5️⃣ SAVE ONLY IF VALID
                if (normalizedData) {
                    const record = {
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,
                        shipment_id: checkresult[0]?.shipment_id ?? null,
                        cont_id: number,
                        data: normalizedData
                    };

                    await _saveSearatesRecord(record, number);

                    // Flatten and deduplicate events
                    const allEvents = (normalizedData.containers || []).flatMap(c => c.events || []);
                    const uniqueEvents = allEvents.reduce((acc, event) => {
                        const exists = acc.some(e =>
                            e.order_id === event.order_id &&
                            e.event_code === event.event_code &&
                            e.location === event.location
                        );
                        if (!exists) acc.push(event);
                        return acc;
                    }, []);

                    const enrichedData = _enrichVesselsWithVoyage(normalizedData);

                    const normalized = {
                        shipment_id: checkresult[0]?.shipment_id ?? null,
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,
                        metadata: enrichedData.metadata,
                        container: enrichedData.containers || [],
                        events: uniqueEvents,
                        locations: enrichedData.locations || [],
                        vessels: enrichedData.vessels || [],
                        dataRoute: [{
                            pol: enrichedData.route?.pol ? [enrichedData.route.pol] : [],
                            pod: enrichedData.route?.pod ? [enrichedData.route.pod] : []
                        }],
                        pin_location: enrichedData.route_data?.pin
                            ? { lat: enrichedData.route_data.pin[0], lng: enrichedData.route_data.pin[1] }
                            : {}
                    };

                    return res.status(200).send({
                        message: "Fetched from SeaRates and saved",
                        data: { data: enrichedData }
                    });
                }

                console.warn(`⚠️ No valid data from SeaRates for ${number}`);
                return res.status(404).send({ message: "No data from SeaRates" });
            }

            // 6️⃣ RETURN CACHED DATA FROM DB
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

            // 🧭 Add route + pin_location from separate tables
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

            console.log(`✅ Returning cached shipment data (${Object.keys(shipmentData).length} records)`);
            return res.status(200).send(Object.values(shipmentData));
        } catch (err) {
            console.error(`${timestamp} ❌ Error in GetSeaRatesTrackNumberandsoid:`, err);
            return res.status(500).send({ error: "Internal Server Error", details: err.message });
        } finally {
            if (connection) connection.release();
        }
    },



    SearatesCheck: async (req, res) => {
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const number = req.params.number?.toString();

        console.log(`${timestamp} 🔎 Running SearatesCheck for e_order: ${number}`);

        // 🟣 Main Process
        try {
            // 1️⃣ CHECK LOCAL DATABASE FIRST (with parameterized query - FIXED SQL INJECTION)
            const query = `
                SELECT ti.bl_no, tso.so_id, s.so_id, s.shipment_id, tr.cont_id, s.last_updated_date
                FROM trs_realization tr
                LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                LEFT JOIN sea_rates.pod pod ON s.shipment_id = pod.shipment_id
                WHERE tso.e_order = ?
                AND (
                    s.last_updated_date >= NOW() - INTERVAL 2 WEEK
                    OR (pod.date <= NOW() AND pod.actual = 1)
                );
            `;

            const results = await dbQuery(query, [number]);

            // 2️⃣ IF DATA EXISTS AND IS VALID, RETURN IT
            if (results.length) {
                console.log(`✅ Using cached Searates data for SO ID: ${results[0].so_id}`);
                return res.status(200).send(results);
            }

            // 3️⃣ NO LOCAL DATA - FETCH FROM SEARATES
            console.log(`🔄 No data found locally, fetching new for e_order: ${number}`);

            const querycheck_so_Id = `
                SELECT ti.bl_no, tso.so_id, s.so_id, s.shipment_id, tr.cont_id, s.last_updated_date
                FROM trs_realization tr
                LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                WHERE tso.e_order = ?;
            `;

            const checkresult = await dbQuery(querycheck_so_Id, [number]);
            if (!checkresult.length) {
                return res.status(200).send({ message: "No matching record found in DB" });
            }

            const contIdClean = checkresult[0]?.cont_id?.replace("-", "") ?? "";
            const bl_no = checkresult[0]?.bl_no;

            const url = bl_no
                ? `https://tracking.searates.com/tracking?api_key=${key}&number=${bl_no}&sealine=auto&force_update=false&route=true&ais=false`
                : `https://tracking.searates.com/tracking?api_key=${key}&number=${contIdClean}&sealine=auto&force_update=false&route=true&ais=false`;

            let searatesRes = await _callSeaRatesAPI(url);

            // 4️⃣ VALIDATE API RESPONSE
            let normalizedData = _normalizeSeaRatesData(searatesRes);

            if (!normalizedData) {
                console.warn(`⚠️ First attempt failed, retrying with contIdClean: ${contIdClean}`);
                const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${contIdClean}&sealine=auto&force_update=false&route=true&ais=false`;
                searatesRes = await _callSeaRatesAPI(fallbackUrl);
                normalizedData = _normalizeSeaRatesData(searatesRes);
            }

            // 5️⃣ SAVE ONLY IF VALID
            if (!normalizedData) {
                console.warn(`⚠️ SeaRates returned no valid data for e_order: ${number}`);
                return res.status(200).send({
                    message: "Tracking data not available. SeaRates may be unreachable or subscription expired."
                });
            }

            const record = {
                so_id: checkresult[0]?.so_id,
                shipment_id: checkresult[0]?.shipment_id,
                cont_id: contIdClean,
                data: normalizedData
            };

            const savedShipmentId = await _saveSearatesRecord(record, contIdClean || bl_no || number);

            if (!savedShipmentId) {
                console.warn(`⚠️ Failed to save SeaRates data for ${number}`);
                return res.status(500).send({ message: "Failed to save tracking data" });
            }

            console.log(`✅ Saved new tracking for SO ID: ${checkresult[0]?.so_id}`);

            // Enrich vessels with voyage
            const enrichedData = _enrichVesselsWithVoyage(normalizedData);

            return res.status(200).send({
                message: "Saved from SeaRates",
                data: { data: enrichedData }
            });

        } catch (error) {
            console.error(timestamp + " ❌ Error at SearatesCheck:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error.message });
        }
    },



}