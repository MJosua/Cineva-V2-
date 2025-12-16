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


// ✅ Safe global HTTP helper
async function callaxios(url) {
    const controller = new AbortController();
    const timeoutMs = 8000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await axios.get(url, { signal: controller.signal });
        return res.data;
    } catch (err) {
        if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
            console.warn(`⚠️ SeaRates timeout: ${url}`);
            await new Promise(r => setTimeout(r, 2000));
            try {
                const retry = await axios.get(url, { signal: controller.signal });
                return retry.data;
            } catch (retryErr) {
                console.error("❌ Retry failed:", retryErr.message);
                throw retryErr;
            }
        }
        console.error("❌ Axios error:", err.message);
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

// ✅ Crash guards
process.on("unhandledRejection", err => {
    console.error("⚠️ Unhandled Promise Rejection:", err);
});
process.on("uncaughtException", err => {
    console.error("💥 Uncaught Exception:", err);
});

module.exports = {

    GetSeaRatesTrackUser: async (req, res) => {
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const number = req.params.number;
        const refresh = req.query.refresh;
        const so_id = req.params.so_id || "0"; // ✅ ensure defined

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

        // ✅ Reuse one global axios wrapper (abort-safe)
        async function callaxios(url) {
            const controller = new AbortController();
            const timeoutMs = 8000;
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
                        const retry = await axios.get(url, { signal: controller.signal });
                        return retry.data;
                    } catch (retryErr) {
                        console.error("❌ Retry failed:", retryErr.message);
                        throw retryErr;
                    }
                }
                console.error("❌ Axios error:", err.message);
                throw err;
            } finally {
                clearTimeout(timer);
            }
        }

        // ✅ Function to save fetched data into DB (same as before)
        async function saveSearatesRecord(record) {
            let connection;
            try {
                connection = await dbConf.promise().getConnection();
                const metadata = record.data.metadata;


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
                    number ?? metadata.number,
                    record.so_id,
                    metadata.type ?? null,
                    metadata.sealine ?? null,
                    metadata.sealine_name ?? null,
                    metadata.status ?? null,
                ]);

                const shipmentId =
                    shipmentResult.insertId ||
                    (await dbQuerySR("SELECT shipment_id FROM shipments WHERE number = ?", [metadata.number]))[0]?.[0]?.shipment_id;

                if (!shipmentId) {
                    console.error("❌ No valid shipment_id found for", metadata.number);
                    throw new Error("Shipment ID not found after insert");
                }

                console.log(`✅ Shipment saved (${metadata.number}) → ID: ${shipmentId}`);

                // Locations
                if (record.data.locations?.length) {
                    const locQuery = `
                        INSERT INTO locations (location_id, name, lat, lng, shipment_id)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            name=VALUES(name), lat=VALUES(lat), lng=VALUES(lng);
                    `;
                    for (const l of record.data.locations)
                        await dbQuerySR(locQuery, [l.id, l.name, l.lat, l.lng, shipmentId]);
                }

                // Routes (POL/POD)
                if (record.data.route?.pol) {
                    const pol = record.data.route.pol;
                    await dbQuerySR(`
                        INSERT INTO pol(location_id, date, actual, shipment_id)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE date=VALUES(date), actual=VALUES(actual);
                    `, [pol.location, pol.date, pol.actual, shipmentId]);
                }

                if (record.data.route?.pod) {
                    const pod = record.data.route.pod;
                    await dbQuerySR(`
                        INSERT INTO pod(location_id, date, actual, shipment_id)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE date=VALUES(date), actual=VALUES(actual);
                    `, [pod.location, pod.date, pod.actual, shipmentId]);
                }

                // Route pin
                if (record.data.route_data?.pin?.length >= 2) {
                    const [lat, lng] = record.data.route_data.pin;
                    await dbQuerySR(
                        `INSERT INTO route(lat, \`long\`, shipment_id)
                         VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE lat=VALUES(lat), \`long\`=VALUES(\`long\`);`,
                        [lat, lng, shipmentId]
                    );
                }


                // ==========================================
                // 🔹 PATCHED SECTION: CONTAINERS + EVENTS
                // ==========================================
                if (record.data.containers) {
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

                    for (const [i, c] of record.data.containers.entries()) {
                        await dbQuerySR(containersQuery, [
                            i + 1,
                            c.number ?? null,
                            c.iso_code ?? null,
                            c.size_type ?? null,
                            c.status ?? null,
                            shipmentId,
                        ]);

                        if (c.events) {
                            for (const e of c.events) {
                                await dbQuerySR(eventQuery, [
                                    e.order_id ?? null,
                                    e.location ?? null,
                                    e.description ?? null,
                                    e.event_type ?? null,
                                    e.event_code ?? null,
                                    e.date ?? null,
                                    e.actual ?? null,
                                    e.vessel ?? null,
                                    e.voyage ?? null,
                                    i + 1,
                                    shipmentId,
                                    e.status ?? null,
                                ]);
                            }
                        }
                    }
                    console.log("✅ Containers and events upserted");
                }

                console.log("✅ saveSearatesRecord complete with shipment id = ", shipmentId);
                return shipmentId;
            } catch (err) {
                console.error("❌ saveSearatesRecord failed:", err);
                throw err;
            } finally {
                if (connection) connection.release();
            }
        }


        let connection;

        // 🟣 Main execution flow
        try {

            connection = await dbConf.promise().getConnection();


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

            let reload = false;
            if (refresh && results.length) {
                const diffHours = (new Date() - new Date(results[0].last_updated_date)) / (1000 * 60 * 60);
                reload = diffHours >= 5 || !results[0].so_id;
            }

            // 🔁 Fetch fresh data if missing or outdated
            if (!results.length || reload) {
                const checkQuery = so_id === "0" ? `
                   SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                   FROM trs_realization tr
                   LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                   LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                   LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                   WHERE s.number = "${number}" ORDER BY s.last_updated_date DESC LIMIT 1
               ` : `
                   SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                   FROM trs_realization tr
                   LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                   LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                   LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                   WHERE s.so_id = "${so_id}" ORDER BY s.last_updated_date DESC LIMIT 1
               `;

                const checkresult = await dbQuery(checkQuery);
                const bl_no = checkresult[0]?.bl_no;
                const contIdClean = checkresult[0]?.cont_id?.replace("-", "");

                const url = bl_no
                    ? `https://tracking.searates.com/tracking?api_key=${key}&number=${bl_no}&sealine=${sealine}&force_update=false&type=bl&route=true&ais=false`
                    : `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=${sealine}&force_update=false&route=true&ais=false`;

                let searatesRes = await callaxios(url);
                if (!searatesRes?.data?.metadata?.sealine_name) { // remove one `.data`
                    console.warn(`⚠️ Missing sealine name for ${number}, retrying with auto`);
                    const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=auto&force_update=false&route=true&ais=false`;
                    searatesRes = await callaxios(fallbackUrl);
                }

                const record = {
                    so_id: so_id ?? checkresult[0]?.so_id ?? 0,
                    shipment_id: checkresult[0]?.shipment_id ?? null,
                    cont_id: number,
                    data: searatesRes.data
                };

                if (record.data) {


                    await saveSearatesRecord(record);
                    return res.status(200).send({
                        message: "Fetched from SeaRates and saved",
                        data: searatesRes
                    });
                } else {
                    return res.status(404).send({ message: "No data from SeaRates" });
                }
            }

            // 🟢 Otherwise, respond from DB
            const shipmentData = {};
            for (const row of results) {
                const id = row.shipment_id;
                if (!shipmentData[id]) {
                    shipmentData[id] = {
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,
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
                // Events
                if (row.event_id && !shipmentData[id].events.some(e => e.event_id === row.event_id)) {
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

                // Vessels
                if (row.vessel_name && !shipmentData[id].vessels.some(v => v.name === row.vessel_name)) {
                    shipmentData[id].vessels.push({
                        name: row.vessel_name,
                        imo: row.vessel_imo
                    });
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

        // ✅ Helper to call SeaRates API with timeout + retry
        async function callaxios(url) {
            const controller = new AbortController();
            const timeoutMs = 8000;
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
                        const retry = await axios.get(url, { signal: controller.signal });
                        return retry.data;
                    } catch (retryErr) {
                        console.error("❌ Retry failed:", retryErr.message);
                        throw retryErr;
                    }
                }
                console.error("❌ Axios error:", err.message);
                throw err;
            } finally {
                clearTimeout(timer);
            }
        }

        // ✅ Function to save fetched data into DB (same as before)
        async function saveSearatesRecord(record) {
            let connection;
            try {
                connection = await dbConf.promise().getConnection();
                const metadata = record.data.metadata;


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
                    number ?? metadata.number,
                    record.so_id,
                    metadata.type ?? null,
                    metadata.sealine ?? null,
                    metadata.sealine_name ?? null,
                    metadata.status ?? null,
                ]);

                const shipmentId =
                    shipmentResult.insertId ||
                    (await dbQuerySR("SELECT shipment_id FROM shipments WHERE number = ?", [metadata.number]))[0]?.[0]?.shipment_id;

                if (!shipmentId) {
                    console.error("❌ No valid shipment_id found for", metadata.number);
                    throw new Error("Shipment ID not found after insert");
                }

                console.log(`✅ Shipment saved (${metadata.number}) → ID: ${shipmentId}`);

                // Locations
                if (record.data.locations?.length) {
                    const locQuery = `
                        INSERT INTO locations (location_id, name, lat, lng, shipment_id)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            name=VALUES(name), lat=VALUES(lat), lng=VALUES(lng);
                    `;
                    for (const l of record.data.locations)
                        await dbQuerySR(locQuery, [l.id, l.name, l.lat, l.lng, shipmentId]);
                }

                // Routes (POL/POD)
                if (record.data.route?.pol) {
                    const pol = record.data.route.pol;
                    await dbQuerySR(`
                        INSERT INTO pol(location_id, date, actual, shipment_id)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE date=VALUES(date), actual=VALUES(actual);
                    `, [pol.location, pol.date, pol.actual, shipmentId]);
                }

                if (record.data.route?.pod) {
                    const pod = record.data.route.pod;
                    await dbQuerySR(`
                        INSERT INTO pod(location_id, date, actual, shipment_id)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE date=VALUES(date), actual=VALUES(actual);
                    `, [pod.location, pod.date, pod.actual, shipmentId]);
                }

                // Route pin
                if (record.data.route_data?.pin?.length >= 2) {
                    const [lat, lng] = record.data.route_data.pin;
                    await dbQuerySR(
                        `INSERT INTO route(lat, \`long\`, shipment_id)
                         VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE lat=VALUES(lat), \`long\`=VALUES(\`long\`);`,
                        [lat, lng, shipmentId]
                    );
                }


                // ==========================================
                // 🔹 PATCHED SECTION: CONTAINERS + EVENTS
                // ==========================================
                if (record.data.containers) {
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

                    for (const [i, c] of record.data.containers.entries()) {
                        await dbQuerySR(containersQuery, [
                            i + 1,
                            c.number ?? null,
                            c.iso_code ?? null,
                            c.size_type ?? null,
                            c.status ?? null,
                            shipmentId,
                        ]);

                        if (c.events) {
                            for (const e of c.events) {
                                await dbQuerySR(eventQuery, [
                                    e.order_id ?? null,
                                    e.location ?? null,
                                    e.description ?? null,
                                    e.event_type ?? null,
                                    e.event_code ?? null,
                                    e.date ?? null,
                                    e.actual ?? null,
                                    e.vessel ?? null,
                                    e.voyage ?? null,
                                    i + 1,
                                    shipmentId,
                                    e.status ?? null,
                                ]);
                            }
                        }
                    }
                    console.log("✅ Containers and events upserted");
                }

                console.log("✅ saveSearatesRecord complete with shipment id = ", shipmentId);
                return shipmentId;
            } catch (err) {
                console.error("❌ saveSearatesRecord failed:", err);
                throw err;
            } finally {
                if (connection) connection.release();
            }
        }

        // 🟣 Main flow
        let connection;
        try {
            connection = await dbConf.promise().getConnection();

            // 🟢 Get existing cached data
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

            let reload = false;
            if (refresh && results.length) {
                const diffHours = (new Date() - new Date(results[0].last_updated_date)) / (1000 * 60 * 60);
                reload = diffHours >= 5 || !results[0].so_id;
            }

            // 🔁 Fetch fresh data if missing or outdated
            if (!results.length || reload) {
                const checkQuery = so_id === "0" ? `
                    SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                    FROM trs_realization tr
                    LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                    LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                    LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                    WHERE s.number = "${number}" ORDER BY s.last_updated_date DESC LIMIT 1
                ` : `
                    SELECT ti.bl_no, tso.so_id, s.so_id, s.last_updated_date
                    FROM trs_realization tr
                    LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                    LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                    LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                    WHERE s.so_id = "${so_id}" ORDER BY s.last_updated_date DESC LIMIT 1
                `;

                const checkresult = await dbQuery(checkQuery);
                const bl_no = checkresult[0]?.bl_no;
                const url = bl_no
                    ? `https://tracking.searates.com/tracking?api_key=${key}&number=${bl_no}&sealine=${sealine}&force_update=false&type=bl&route=true&ais=false`
                    : `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=${sealine}&force_update=false&route=true&ais=false`;

                let searatesRes = await callaxios(url);
                if (!searatesRes.data?.data?.metadata?.sealine_name) {
                    console.warn(`⚠️ Missing sealine name for ${number}, retrying with auto`);
                    const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=auto&force_update=false&route=true&ais=false`;
                    searatesRes = await callaxios(fallbackUrl);
                }

                const record = {
                    so_id: so_id ?? checkresult[0]?.so_id ?? 0,
                    shipment_id: checkresult[0]?.shipment_id ?? null,
                    cont_id: number,
                    data: searatesRes.data
                };


                if (record.data) {


                    const normalized = {
                        shipment_id: checkresult[0]?.shipment_id ?? null,
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,
                        metadata: searatesRes.data.metadata,
                        container: searatesRes.data.containers || [],
                        events: (searatesRes.data.containers || []).flatMap(c => c.events || []),
                        locations: searatesRes.data.locations || [],
                        vessels: searatesRes.data.vessels || [],
                        dataRoute: [{
                            pol: searatesRes.data.route?.pol ? [searatesRes.data.route.pol] : [],
                            pod: searatesRes.data.route?.pod ? [searatesRes.data.route.pod] : []
                        }],
                        pin_location: searatesRes.data.route_data?.pin
                            ? { lat: searatesRes.data.route_data.pin[0], lng: searatesRes.data.route_data.pin[1] }
                            : {}
                    };

                    await saveSearatesRecord(record);
                    return res.status(200).send({
                        message: "Fetched from SeaRates and saved",
                        data: normalized
                    });
                }
                return res.status(404).send({ message: "No data from SeaRates" });
            }

            // 🟢 Return cached data
            const shipmentData = {};
            for (const row of results) {
                const id = row.shipment_id;
                if (!shipmentData[id]) {
                    shipmentData[id] = {
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,
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
                // Events
                if (row.event_id && !shipmentData[id].events.some(e => e.event_id === row.event_id)) {
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

                // Vessels
                if (row.vessel_name && !shipmentData[id].vessels.some(v => v.name === row.vessel_name)) {
                    shipmentData[id].vessels.push({
                        name: row.vessel_name,
                        imo: row.vessel_imo
                    });
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

        // ✅ Unified axios with AbortController
        async function callaxios(url) {
            const controller = new AbortController();
            const timeoutMs = 10000;
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const res = await axios.get(url, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' },
                });
                return res.data;
            } catch (err) {
                if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
                    console.warn(`⚠️ SeaRates timeout: ${url}`);
                    await new Promise(r => setTimeout(r, 2000)); // wait before retry
                    try {
                        const retry = await axios.get(url, { signal: controller.signal });
                        return retry.data;
                    } catch (retryErr) {
                        console.error("❌ Retry failed:", retryErr.message);
                        throw retryErr;
                    }
                }
                console.error("❌ Axios error:", err.message);
                throw err;
            } finally {
                clearTimeout(timer);
            }
        }

        // ✅ Database save logic with safe connection handling
        async function saveSearatesRecord(record) {
            let connection;
            try {
                connection = await dbConf.promise().getConnection();
                const metadata = record.data.metadata;
                console.log("metadata", metadata);

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
                    number,
                    record.so_id ?? 0,
                    metadata.type ?? null,
                    metadata.sealine ?? null,
                    metadata.sealine_name ?? null,
                    metadata.status ?? null,
                ]);

                const shipmentId =
                    shipmentResult.insertId ||
                    (await dbQuerySR("SELECT id FROM shipments WHERE number = ?", [metadata.number]))[0][0]?.id;

                console.log(`✅ Shipment saved: ${metadata.number}`);

                // 🟢 First event
                await dbQuerySR(`
                    INSERT INTO events (
                        order_id, location_id, description, event_type, event_code, date,
                        actual, vessel_id, voyage, container_id, shipment_id, status
                    ) VALUES (0,0,'First time API-CALL','system','FIRST_CALL',NOW(),1,NULL,NULL,0,?,'start')
                    ON DUPLICATE KEY UPDATE description=VALUES(description), date=VALUES(date), status=VALUES(status);
                `, [shipmentId]);

                // 🟢 Locations
                if (record.data.locations?.length) {
                    const locQuery = `
                        INSERT INTO locations (location_id, name, state, country, locode, lat, lng, shipment_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            name=VALUES(name), state=VALUES(state), country=VALUES(country),
                            locode=VALUES(locode), lat=VALUES(lat), lng=VALUES(lng);
                    `;
                    for (const l of record.data.locations) {
                        await dbQuerySR(locQuery, [l.id, l.name, l.state, l.country, l.locode, l.lat, l.lng, shipmentId]);
                    }
                }

                // 🟢 Route pin
                if (record.data.route_data?.pin?.length >= 2) {
                    const [lat, long] = record.data.route_data.pin;
                    await dbQuerySR(
                        `INSERT INTO route(lat, \`long\`, shipment_id)
                         VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE lat=VALUES(lat), \`long\`=VALUES(\`long\`);`,
                        [lat, long, shipmentId]
                    );
                    console.log("✅ Route upserted successfully");
                } else {
                    console.warn("⚠️ No route pin available");
                }

                // 🟢 POL
                if (record.data.route?.pol) {
                    const pol = record.data.route.pol;
                    await dbQuerySR(`
                        INSERT INTO pol(location_id, date, actual, shipment_id, last_updated_date)
                        VALUES (?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE date=VALUES(date), actual=VALUES(actual);
                    `, [pol.location, pol.date, pol.actual, shipmentId]);
                }

                // 🟢 POD
                if (record.data.route?.pod) {
                    const pod = record.data.route.pod;
                    await dbQuerySR(`
                        INSERT INTO pod(location_id, date, predictive_eta, actual, shipment_id, last_updated_date)
                        VALUES (?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE date=VALUES(date), predictive_eta=VALUES(predictive_eta), actual=VALUES(actual);
                    `, [pod.location, pod.date, pod.predictive_eta, pod.actual, shipmentId]);
                }

                // 🟢 Vessels
                if (record.data.vessels?.length) {
                    for (const v of record.data.vessels) {
                        await dbQuerySR(`
                            INSERT INTO vessel(imo, name, vessel_id, shipment_id)
                            VALUES (?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE name=VALUES(name);
                        `, [v.imo, v.name, v.id, shipmentId]);
                    }
                }

                // 🟢 Containers & events
                if (record.data.containers?.length) {
                    const contQuery = `
                        INSERT INTO containers(container_id, container_number, iso_code, size_type, status, shipment_id)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE iso_code=VALUES(iso_code), size_type=VALUES(size_type), status=VALUES(status);
                    `;
                    const eventQuery = `
                        INSERT INTO events(order_id, location_id, description, event_type, event_code, date,
                                           actual, vessel_id, voyage, container_id, shipment_id, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE description=VALUES(description), date=VALUES(date), status=VALUES(status);
                    `;
                    for (const [i, c] of record.data.containers.entries()) {
                        await dbQuerySR(contQuery, [i + 1, c.number, c.iso_code, c.size_type, c.status, shipmentId]);
                        if (c.events?.length) {
                            for (const e of c.events) {
                                await dbQuerySR(eventQuery, [
                                    e.order_id, e.location, e.description, e.event_type, e.event_code,
                                    e.date, e.actual, e.vessel, e.voyage, i + 1, shipmentId, e.status
                                ]);
                            }
                        }
                    }
                }

                console.log("✅ saveSearatesRecord complete");
                return shipmentId;

            } catch (err) {
                console.error("❌ saveSearatesRecord failed:", err);
                throw err;
            } finally {
                if (connection) connection.release?.();
            }
        }

        // 🟣 Main Process
        try {
            const query = `
                SELECT ti.bl_no, tso.so_id, s.so_id, s.shipment_id, tr.cont_id, s.last_updated_date
                FROM trs_realization tr
                LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                LEFT JOIN sea_rates.pod pod ON s.shipment_id = pod.shipment_id
                WHERE tso.e_order = ${number}
                AND (
                    s.last_updated_date >= NOW() - INTERVAL 2 WEEK
                    OR (pod.date <= NOW() AND pod.actual = 1)
                );
            `;

            const results = await dbQuery(query, [number]);
            if (!results.length) {
                console.log(`🔄 No data found locally, fetching new for e_order: ${number}`);

                const querycheck_so_Id = `
                    SELECT ti.bl_no, tso.so_id, s.so_id, s.shipment_id, tr.cont_id, s.last_updated_date
                    FROM trs_realization tr
                    LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                    LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id
                    LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                    WHERE tso.e_order = ${number};
                `;

                const checkresult = await dbQuery(querycheck_so_Id);
                if (!checkresult.length) return res.status(404).send({ message: "No matching record found in DB" });

                const contIdClean = checkresult[0]?.cont_id?.replace("-", "");
                const bl_no = checkresult[0]?.bl_no;

                const url = bl_no
                    ? `https://tracking.searates.com/tracking?api_key=${key}&number=${bl_no}&sealine=auto&force_update=false&route=true&ais=false`
                    : `https://tracking.searates.com/tracking?api_key=${key}&number=${contIdClean}&sealine=auto&force_update=false&route=true&ais=false`;

                let searatesRes = await callaxios(url);

                if (!searatesRes.data?.data?.metadata?.sealine_name) {
                    console.warn("⚠️ Missing sealine, retrying with contIdClean...");
                    const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${contIdClean}&sealine=auto&force_update=false&route=true&ais=false`;
                    searatesRes = await callaxios(fallbackUrl);
                }

                const record = {
                    so_id: checkresult[0]?.so_id,
                    shipment_id: checkresult[0]?.shipment_id,
                    cont_id: contIdClean,
                    data: searatesRes.data.data
                };

                await saveSearatesRecord(record);
                console.log(`✅ Saved new tracking for SO ID: ${checkresult[0]?.so_id}`);

                return res.status(200).send({
                    message: "Saved from fallback (Searates)",
                    data: searatesRes.data
                });
            }

            console.log(`✅ Using cached Searates data for SO ID: ${results[0].so_id}`);
            return res.status(200).send(results);

        } catch (error) {
            console.error(timestamp + " ❌ Error at SearatesCheck:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error.message });
        }
    },



}