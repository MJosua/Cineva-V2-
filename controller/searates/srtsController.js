const { query } = require("express");
const { dbSR, dbQuerySR, dbQuery, dbConf } = require("../../config/db");
const fs = require('fs')

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
module.exports = {

    GetSeaRatesTrackUser: async (req, res) => {
        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const number = req.params.number;

        const refresh = req.query.refresh;

        if (!req.dataToken.user_id) {
            console.log(timestamp + " Unauthorized!");
            return res.status(401).send({ error: "Unauthorized" });
        }
        console.log("trackuser")
        try {
            let query = `
                        select
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
                        r.long as pin_long,
                        r.lat as pin_lat,
                        v.vessel_id as vessel_vesid,
                        v.name,
                        v.imo as vimo,
                        e.vessel_id as event_vessel,
                        pod.location_id AS pod_id,
                        DATE_FORMAT(pod.date, '%Y-%m-%d') AS pod_date,
                        pol.location_id AS pol_id,
                        DATE_FORMAT(pol.date, '%Y-%m-%d') AS pol_date,
                        DATE_FORMAT(e.date, '%Y-%m-%d') AS e_date
                    from
                        sea_rates.shipments s
                    left join sea_rates.containers c 
                        on
                        s.shipment_id = c.shipment_id
                    left join sea_rates.events e 
                        on
                        c.container_id = e.container_id
                    left join sea_rates.locations l 
                        on
                        e.shipment_id = l.shipment_id
                        and e.location_id = l.location_id
                    LEFT JOIN (
                        SELECT event_id, MAX(location_id) AS location_list_id
                        FROM sea_rates.events
                        GROUP BY event_id
                    ) l_max ON l_max.event_id = e.event_id
                    left join sea_rates.route r 
                        on
                        s.shipment_id = r.shipment_id
                    left join sea_rates.vessel v 
                        on
                        s.shipment_id = v.shipment_id
                        and e.vessel_id = v.vessel_id
                    LEFT JOIN sea_rates.pod pod 
                        ON 
                        s.shipment_id = pod.shipment_id
                    LEFT JOIN sea_rates.pol pol 
                        ON 
                        s.shipment_id = pol.shipment_id
                    where
                        (
                            (cast(s.so_id as CHAR) = ?)
                        )
                        and
                        (
                        s.number = ?
                            and s.shipment_id = (
                            select
                                shipment_id
                            from
                                sea_rates.shipments
                            where
                                number = ?
                            order by
                                last_updated_date desc
                            limit 1
                                                )
                        )
                    order by
                        e.date desc;
            `
                ;


            dbSR.query(query, [so_id, number, number], (err, results) => {
                if (err) {
                    console.log(timestamp + " Error GetSeaRatesTrackUser:", err);
                    return res.status(500).send({ error: "Database Error", details: err });
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
                            // Include container data
                            container: {
                                container_id: row.container_id,
                                container_number: row.container_number,
                                size: row.size_type
                            },
                            // Initialize locations array
                            locations: [],
                            container_events: [],
                            pin_location: [],
                            vessels: [],
                            dataRoute: [
                                {
                                    pod: [],
                                    pol: []
                                }
                            ],
                        };
                    }

                    // Push location data if available
                    if (!shipmentData[shipmentId].locations) {
                        shipmentData[shipmentId].locations = []; // Initialize if undefined
                    }

                    if (row.location_list_id) {
                        const existingLocation = shipmentData[shipmentId].locations.find(
                            loc => loc.location_list_id === row.location_list_id
                        );

                        if (!existingLocation) {
                            shipmentData[shipmentId].locations.push({
                                location_list_id: row.location_list_id,
                                name: row.location_name,   // Fix: `row.location_names` -> `row.name`
                                state: row.state,
                                country: row.country,
                                locode: row.locode,
                                lat: row.location_lat,
                                lng: row.location_lang  // Fix: `row.lang` -> `row.lng`
                            });
                        }
                    }

                    // Check for duplicate events before adding
                    if (row.event_id) {
                        const existingEvent = shipmentData[shipmentId].container_events.find(ev => ev.event_id === row.event_id);
                        if (!existingEvent) {
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

                    // Check for duplicate pin locations before adding
                    if (row.pin_id) {
                        const existingPin = shipmentData[shipmentId].pin_location.find(
                            pin => pin.longitude === row.pin_long && pin.latitude === row.pin_lat
                        );
                        if (!existingPin) {
                            shipmentData[shipmentId].pin_location.push({
                                latitude: row.pin_lat,
                                longitude: row.pin_long,

                            });
                        }
                    }

                    // Check for duplicate vessels before adding
                    if (row.vessel_id) {
                        const existingVessel = shipmentData[shipmentId].vessels.find(v => v.imo === row.imo);
                        if (!existingVessel) {
                            shipmentData[shipmentId].vessels.push({
                                imo: row.imo,
                                name: row.name,
                                vessel_id: row.vessel_vesid
                            });
                        }
                    }

                    if (!shipmentData[shipmentId].dataRoute || shipmentData[shipmentId].dataRoute.length === 0) {
                        shipmentData[shipmentId].dataRoute = [{ pod: [], pol: [] }];
                    }

                    // Ensure pod_id exists before adding to pod list
                    if (row.pod_id) {
                        const existingPod = shipmentData[shipmentId].dataRoute[0].pod.find(pod => pod.location === row.pod_id);
                        if (!existingPod) {
                            shipmentData[shipmentId].dataRoute[0].pod.push({
                                location: row.pod_id,
                                date: formatDate(row.pod_date)
                            });
                        }
                    }

                    if (row.pol_id) {
                        const existingPol = shipmentData[shipmentId].dataRoute[0].pol.find(pol => pol.location === row.pol_id);
                        if (!existingPol) {
                            shipmentData[shipmentId].dataRoute[0].pol.push({
                                location: row.pol_id,
                                date: formatDate(row.pol_date)
                            });
                        }
                    }


                });

                const responseData = Object.values(shipmentData);

                if (responseData.length < 1) {
                    return res.status(400).json({ message: "No Data Tracking Yet" });

                }

                return res.status(200).send(responseData);
            });

        } catch (error) {
            console.log(timestamp + " Error at User => GetSeaRatesTrackUser:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }
    },

  

    GetSeaRatesTrackNumber: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const number = req.params.number.toLocaleString();
        let so_id
        so_id = req.params.so_id ? req.params.so_id.toLocaleString() : "0";


        console.log("so_id dari GetSeaRatesTrackNumberandsoid", so_id)
        const sealine = req.params?.sealine?.toLocaleString() || "auto";
        const refresh = req.query?.refresh === "true" ? true : false;


        // 📌 Fungsi reusable untuk simpan data Searates ke DB
        async function saveSearatesRecord(record) {
            let connection;
            console.log("record", record)
            const metadata = record.data.metadata;
            connection = await dbConf.promise().getConnection();
            console.log("record", record)
            // 🟢 Save shipment (UPSERT)
            const shipmentQuery = `
                INSERT INTO shipments(
                    shipment_id,
                    number,
                    so_id,
                    type,
                    sealine,
                    sealine_name,
                    status,
                    last_updated_date
                ) VALUES ( ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    type = VALUES(type),
                    sealine = VALUES(sealine),
                    sealine_name = VALUES(sealine_name),
                    status = VALUES(status),
                    last_updated_date = NOW()
    `;

            console.log("metadata with soid", metadata)
            const shipmentResult = await dbQuerySR(shipmentQuery, [
                record.shipment_id ?? null,
                number,
                so_id,
                metadata.type ?? null,
                metadata.sealine ?? null,
                metadata.sealine_name ?? null,
                metadata.status ?? null,
            ]);

            const shipmentId =
                shipmentResult.insertId ||
                (await dbQuerySR(
                    "SELECT id FROM shipments WHERE number = ?",
                    [metadata.number]
                ))[0][0].id;

            console.log(`✅ Shipment saved (Container Number : ${metadata.number})`);

            // 🟢 Save first-time event
            const firstTimeEventQuery = `
        INSERT INTO events(
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
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            date = VALUES(date),
            status = VALUES(status)

    `;

            await dbQuerySR(firstTimeEventQuery, [
                0,
                0,
                "First time API-CALL",
                "system",
                "FIRST_CALL",
                new Date(),
                1,
                null,
                null,
                0,
                shipmentId,
                "start",
            ]);

            // 🟢 Save locations
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
            shipment_id = VALUES(shipment_id)
    `;

            if (record.data.locations) {
                for (const l of record.data.locations) {
                    await dbQuerySR(locationsQuery, [
                        l.id ?? null,
                        l.name ?? null,
                        l.state ?? null,
                        l.country ?? null,
                        l.locode ?? null,
                        l.lat ?? null,
                        l.lng ?? null,
                        shipmentId,
                    ]);
                }
                console.log("✅ Locations upserted successfully");
            }

            // 🟢 Save route pin
            if (record.data.route_data?.pin?.length >= 2) {
                const [lat, long] = record.data.route_data.pin;

                const routeQuery = `
            INSERT INTO route(lat, \`long\`, shipment_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                lat = VALUES(lat),
                \`long\` = VALUES(\`long\`)
        `;

                await dbQuerySR(routeQuery, [lat ?? null, long ?? null, shipmentId]);
                console.log("✅ Route upserted successfully");
            } else {
                console.warn("⚠️ No route pin available");
            }

            // 🟢 Save POL
            if (record.data.route?.pol) {
                const pol = record.data.route.pol;

                const polQuery = `
            INSERT INTO pol(location_id, date, actual, shipment_id, last_updated_date)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                date = VALUES(date),
                actual = VALUES(actual),
                last_updated_date = NOW(),
                location_id = VALUES(location_id)
        `;

                await dbQuerySR(polQuery, [
                    pol.location ?? null,
                    pol.date ?? null,
                    pol.actual ?? null,
                    shipmentId,
                ]);
                console.log("✅ POL upserted successfully");
            }

            // 🟢 Save POD
            if (record.data.route?.pod) {
                const pod = record.data.route.pod;

                const podQuery = `
            INSERT INTO pod(location_id, date, predictive_eta, actual, shipment_id, last_updated_date)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                date = VALUES(date),
                predictive_eta = VALUES(predictive_eta),
                actual = VALUES(actual),
                last_updated_date = NOW(),
                location_id = VALUES(location_id)

        `;

                const row = await dbQuerySR(podQuery, [
                    pod.location ?? null,
                    pod.date ?? null,
                    pod.predictive_eta ?? null,
                    pod.actual ? 1 : 0,
                    shipmentId,
                ]);

                console.log("✅ POD upserted successfully");
            }

            // 🟢 Save vessels
            if (record.data.vessels) {
                const vesselsQuery = `
            INSERT INTO vessel(imo, name, vessel_id, shipment_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name)
        `;

                for (const v of record.data.vessels) {
                    await dbQuerySR(vesselsQuery, [
                        v.imo ?? null,
                        v.name ?? null,
                        v.id ?? null,
                        shipmentId,
                    ]);
                }
                console.log("✅ Vessels upserted successfully");

            }
            const routepod = record.data?.route;

            if (routepod.pod.actual === true) {




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
                console.log("updateEorder", updateEorder)



                // =====================================================================

                // i2iDelivered(record.so_id)

                const updatei2i = `
                        INSERT INTO iod.trs_realization_searates (
                            so_id,  
                            cont_id, 
                            ata,
                            atd
                        )
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            so_id = VALUES(so_id),
                            cont_id = VALUES(cont_id),
                            ata = VALUES(ata),
                            atd = VALUES(atd);
                    `;



                if (record.data.containers && Array.isArray(record.data.containers)) {
                    for (const container of record.data.containers) {
                        await connection.execute(updatei2i, [
                            record.so_id,
                            container.number ?? null,
                            record.data.route.pod?.date ?? null,
                            record.data.route.pol?.date ?? null,
                        ]);

                        console.log("✅", record.data.containers.length, "Containers inserted successfully to trs");
                    }
                }


            }


            // 🟢 Save containers + events


            if (record.data.containers) {
                const containersQuery = `
            INSERT INTO containers(container_id, container_number, iso_code, size_type, status, shipment_id)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                iso_code = VALUES(iso_code),
                size_type = VALUES(size_type),
                status = VALUES(status)
        `;


                const eventQuery = `
            INSERT INTO events(order_id, location_id, description, event_type, event_code, date, actual, vessel_id, voyage, container_id, shipment_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                description = VALUES(description),
                
                date = VALUES(date),
                status = VALUES(status),
                vessel_id = VALUES(vessel_id),
                voyage = VALUES(voyage),
                location_id = VALUES(location_id),
                actual = VALUES(actual),

                event_type = VALUES(event_type),
                event_code = VALUES(event_code),

                container_id = VALUES(container_id)

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
                console.log("✅ Containers and events upserted successfully");
            }

            return shipmentId; // biar bisa dipakai di luar fungsi
        }



        try {
            let query = `       
                        select
                            s.shipment_id,
                            s.last_updated_date,
                            s.number,
                            s.so_id,
                            s.sealine_name,
                            s.status,
                            c.container_number,
                            e.event_id,
                            e.order_id,
                            e.location_id,
                            e.description,
                            e.event_type,
                            e.event_code,
                            e.date,
                            e.actual,
                            e.vessel_id,
                            e.voyage,
                            e.container_id,
                            l.name as location_name,
                            l_max.location_list_id,
                            l.lat as location_lat,
                            l.lng as location_lang,
                            r.long as pin_long,
                            r.lat as pin_lat,
                            v.vessel_id as vessel_vesid,
                            v.name,
                            v.imo as vimo,
                            e.vessel_id as event_vessel,
                            pod.location_id as pod_id,
                            DATE_FORMAT(pod.date, '%Y-%m-%d') as pod_date,
                            pol.location_id as pol_id,
                            DATE_FORMAT(pol.date, '%Y-%m-%d') as pol_date,
                            DATE_FORMAT(e.date, '%Y-%m-%d') as e_date
                        from
                            sea_rates.shipments s
                        left join sea_rates.containers c 
                            on
                            s.shipment_id = c.shipment_id
                        left join sea_rates.events e
                            on
                            c.container_id = e.container_id
                            and s.shipment_id = e.shipment_id
                        left join sea_rates.locations l 
                            on
                            e.shipment_id = l.shipment_id
                            and e.location_id = l.location_id
                        left join (
                            select
                                event_id,
                                MAX(location_id) as location_list_id
                            from
                                sea_rates.events
                            group by
                                event_id
                        ) l_max on
                            l_max.event_id = e.event_id
                        left join sea_rates.route r 
                            on
                            s.shipment_id = r.shipment_id
                        left join sea_rates.vessel v 
                            on
                            s.shipment_id = v.shipment_id
                            and e.vessel_id = v.vessel_id
                        left join sea_rates.pod pod 
                            on
                            s.shipment_id = pod.shipment_id
                        left join sea_rates.pol pol 
                            on
                            s.shipment_id = pol.shipment_id
                        where
                            (
                                cast(s.so_id as CHAR) = ?
                            )
                            or (
                                s.number = ?
                                and s.shipment_id = (
                                select
                                    shipment_id
                                from
                                    sea_rates.shipments
                                where
                                    number = ?
                                order by
                                    last_updated_date desc
                                limit 1
                                )
                            )
                            AND e.event_id IS NOT NULL
                             and (
                            s.last_updated_date >= NOW() - INTERVAL 2 WEEK
                            or
                            pod.date <= NOW() and pod.actual = 1
                            )
                        order by
                            e.date desc;
            `
                ;
            const results = await dbQuerySR(query, [number, number, number]);
            let reload = false; // default q
            if (refresh && results) {
                const lastUpdate = new Date(results[0].last_updated_date);
                const now = new Date();
                const diffMs = now - lastUpdate;
                const diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours >= 5) {
                    reload = true;
                }

            }


            if (results.length < 1 || reload.toLocaleString() === "true") {

                try {



                    querycheck_so_Id_by_number =
                        `
                    select
                        ti.bl_no,
                        tso.so_id,
                        s.so_id,
                        s.last_updated_date 
                        from
                        trs_realization tr 
                        left join
                        trs_sales_order tso 
                        on
                        tr.so_id = tso.so_id 
                        left join
                        trs_invoice ti 
                        on
                        ti.invoice_id = tr.invoice_id
                        left join
                        sea_rates.shipments s 
                        on
                        s.so_id = tso.so_id 
                        where
                        s.number = "${number}"
                        order by s.last_updated_date DESC
                        limit 1
                    `


                    querycheck_by_so_Id =
                        `
                select
                    ti.bl_no,
                    tso.so_id,
                    s.so_id,
                    s.last_updated_date 
                    from
                    trs_realization tr 
                    left join
                    trs_sales_order tso 
                    on
                    tr.so_id = tso.so_id 
                    left join
                    trs_invoice ti 
                    on
                    ti.invoice_id = tr.invoice_id
                    left join
                    sea_rates.shipments s 
                    on
                    s.so_id = tso.so_id 
                    where
                    s.so_id = "${so_id}"
                    order by s.last_updated_date DESC
                    limit 1
                `

                    let checkresult
                    let contIdClean
                    if (so_id === "0" || so_id === 0) {
                        checkresult = await dbQuery(querycheck_so_Id_by_number);


                        console.log("checkresult by number", checkresult)
                        contIdClean = checkresult[0]?.cont_id?.replace("-", "");

                    } else {

                        checkresult = await dbQuery(querycheck_by_so_Id);
                        console.log("checkresult by so_id", checkresult)
                        contIdClean = checkresult[0]?.cont_id?.replace("-", "");


                    }

                    const url =
                        checkresult[0]?.bl_no
                            ? `https://tracking.searates.com/tracking?api_key=${key}&number=${checkresult[0].bl_no}&sealine=${sealine}&force_update=false&type=bl&route=true&ais=false`
                            : `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=${sealine}&force_update=false&route=true&ais=false`;

                    let searatesRes = await callaxios(url);

                    // ✅ cek aman pakai optional chaining
                    if (!searatesRes.data?.data?.metadata?.sealine_name) {
                        console.warn(`⚠️ Sealine name not found, try to find ${number} retrying with contIdClean... maybe not BL Number`);

                        const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=auto&force_update=false&route=true&ais=false`;
                        searatesRes = await callaxios(fallbackUrl); // pakai reassign, bukan const baru

                    }

                    const record = {
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,    // ini dari parameter function kamu
                        shipment_id: checkresult[0]?.shipment_id ?? null,
                        cont_id: number,        // kalau mau simpan cont_id juga
                        data: searatesRes.data  // seluruh hasil dari API
                    }; // pastikan sesuai struktur
                    // 🔥 Panggil logic UPSERT penuh

                    if (record.data) {
                        saveSearatesRecord(record);
                        return res.status(200).send({
                            message: "No data found manually on database, here is data from searates",
                            data: { data: searatesRes.data }
                        });
                    } else {
                        console.log("TIDAK ADA DATA DITEMUKAN dari so_id dan number")
                        return res.status(500).send({
                            message: "No data found manually on searates",
                        });
                    }

                    // Return fallback data
                    return res.status(200).send({
                        message: "Saved from fallback (Searates)",
                        data: searatesRes.data
                    });
                } catch (err) {
                    console.error("Error calling Searates fallback:", err);
                    return res.status(500).send({ error: "Fallback API failed", details: err });

                    console.warn("⚠️ SeaRates timeout. Retrying...");
                    await new Promise(r => setTimeout(r, 2000));
                    return axios.get(url, { timeout: 5000 }); // one retry

                }
            } else {


                const shipmentData = {};
                console.log("Call Searates Success using backend for SO ID : ", results[0].so_id)
                results.forEach(row => {
                    const shipmentId = row.shipments_id;
                    if (!shipmentData[shipmentId]) {
                        shipmentData[shipmentId] = {
                            container: [],
                            locations: [],
                            container_events: [],
                            pin_location: [],
                            vessels: [],
                            metadata: [],
                            dataRoute: [
                                {
                                    pod: [],
                                    pol: []
                                }
                            ],
                        };
                    }

                    // Check if the container is already added
                    const existingContainer = shipmentData[shipmentId].container.find(
                        c => c.container_id === row.container_id
                    );
                    if (!existingContainer && row.container_id) {
                        shipmentData[shipmentId].container.push({
                            container_id: row.container_id,
                            sealine_name: row.sealine_name,
                            shipment_id: shipmentId,
                            so_id: row.so_id,
                            number: row.number,
                            container_status: row.status,
                            container_number: row.container_number,
                        });
                    }

                    // Push location data if available
                    if (!shipmentData[shipmentId].locations) {
                        shipmentData[shipmentId].locations = []; // Initialize if undefined
                    }

                    if (row.location_list_id) {
                        const existingLocation = shipmentData[shipmentId].locations.find(
                            loc => loc.location_list_id === row.location_list_id
                        );

                        if (!existingLocation) {
                            shipmentData[shipmentId].locations.push({
                                location_list_id: row.location_list_id,
                                name: row.location_name,   // Fix: `row.location_names` -> `row.name`
                                state: row.state,
                                country: row.country,
                                locode: row.locode,
                                lat: row.location_lat,
                                lng: row.location_lang  // Fix: `row.lang` -> `row.lng`
                            });
                        }
                    }

                    // Check for duplicate events before adding
                    if (row.event_id) {
                        const containerEvents = shipmentData[shipmentId]?.container_events;
                        if (!containerEvents) {
                            console.warn(`shipmentData[${shipmentId}] or .container_events is missing`);
                            return;
                        }
                        const existingOrder = containerEvents.find(ev => ev.order_id === row.order_id);
                        if (!existingOrder) {
                            containerEvents.push({
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
                    } else {
                        const containerEvents = shipmentData[shipmentId]?.container_events;
                        if (!containerEvents) {
                            console.warn(`shipmentData[${shipmentId}] or .container_events is missing`);
                            return;
                        }

                        // Prevent adding "No Event Yet" multiple times
                        const hasNoEvent = containerEvents.some(ev => ev.description === "No Event Yet");
                        if (!hasNoEvent) {
                            containerEvents.push({
                                event_id: 1,
                                description: "No Event Yet",
                            });
                        }
                    }

                    // Check for duplicate pin locations before adding
                    if (row.pin_lat && row.pin_long) {


                        const pins = shipmentData[shipmentId].pin_location;

                        const isDuplicate = pins.some(
                            pin =>
                                parseFloat(pin.longitude).toFixed(6) === parseFloat(row.pin_long).toFixed(6) &&
                                parseFloat(pin.latitude).toFixed(6) === parseFloat(row.pin_lat).toFixed(6)
                        );

                        if (!isDuplicate) {
                            pins.push({
                                latitude: parseFloat(row.pin_lat),
                                longitude: parseFloat(row.pin_long),
                            });
                        }
                    }

                    // Check for duplicate vessels before adding

                    if (row.vessel_id) {
                        const existingVessel = shipmentData[shipmentId].vessels.find(v => v.vessel_id === row.vessel_id);

                        if (!existingVessel) {

                            shipmentData[shipmentId].vessels.push({
                                imo: row.vimo,
                                name: row.name,
                                vessel_id: row.vessel_vesid
                            });
                        }
                    }

                    if (!shipmentData[shipmentId].dataRoute || shipmentData[shipmentId].dataRoute.length === 0) {
                        shipmentData[shipmentId].dataRoute = [{ pod: [], pol: [] }];
                    }

                    // Ensure pod_id exists before adding to pod list
                    if (row.pod_id) {
                        const existingPod = shipmentData[shipmentId].dataRoute[0].pod.find(pod => pod.location === row.pod_id);
                        if (!existingPod) {
                            shipmentData[shipmentId].dataRoute[0].pod.push({
                                location: row.pod_id,
                                date: formatDate(row.pod_date)
                            });
                        }
                    }

                    if (row.pol_id) {
                        const existingPol = shipmentData[shipmentId].dataRoute[0].pol.find(pol => pol.location === row.pol_id);
                        if (!existingPol) {
                            shipmentData[shipmentId].dataRoute[0].pol.push({
                                location: row.pol_id,
                                date: formatDate(row.pol_date)
                            });
                        }
                    }

                    if (row.last_updated_date) {
                        shipmentData[shipmentId].metadata = {
                            ...shipmentData[shipmentId].metadata,
                            last_updated_date: row.last_updated_date,
                        };
                    }



                });

                const responseData = Object.values(shipmentData);
                return res.status(200).send(responseData);
            }
        } catch (error) {
            console.log(timestamp + " Error at User => GetSeaRatesTrackNumber:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }

        async function callaxios(url) {
            try {
                const res = await axios.get(url, { timeout: 5000 });
                return res.data;
                console.log("res.data", res.data)
            } catch (err) {
                if (err.code === 'ECONNABORTED') {
                    console.warn("⚠️ SeaRates timeout. Retrying...");
                    await new Promise(r => setTimeout(r, 2000));
                    return axios.get(url, { timeout: 5000 }); // one retry
                }
                throw err;
            }
        }

    },

    GetSeaRatesTrackNumberandsoid: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const number = req.params.number.toLocaleString();
        let so_id
        so_id = req.params.so_id ? req.params.so_id.toLocaleString() : "0";


        console.log("so_id dari GetSeaRatesTrackNumberandsoid", so_id)
        const sealine = req.params?.sealine?.toLocaleString() || "auto";
        const refresh = req.query?.refresh === "true" ? true : false;


        // 📌 Fungsi reusable untuk simpan data Searates ke DB
        async function saveSearatesRecord(record) {
            let connection;
            console.log("record", record)
            const metadata = record.data.metadata;
            connection = await dbConf.promise().getConnection();
            console.log("record", record)
            // 🟢 Save shipment (UPSERT)
            const shipmentQuery = `
                INSERT INTO shipments(
                    shipment_id,
                    number,
                    so_id,
                    type,
                    sealine,
                    sealine_name,
                    status,
                    last_updated_date
                ) VALUES ( ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    type = VALUES(type),
                    sealine = VALUES(sealine),
                    sealine_name = VALUES(sealine_name),
                    status = VALUES(status),
                    last_updated_date = NOW()
    `;

            console.log("metadata with soid", metadata)
            const shipmentResult = await dbQuerySR(shipmentQuery, [
                record.shipment_id ?? null,
                number,
                so_id,
                metadata.type ?? null,
                metadata.sealine ?? null,
                metadata.sealine_name ?? null,
                metadata.status ?? null,
            ]);

            const shipmentId =
                shipmentResult.insertId ||
                (await dbQuerySR(
                    "SELECT id FROM shipments WHERE number = ?",
                    [metadata.number]
                ))[0][0].id;

            console.log(`✅ Shipment saved (Container Number : ${metadata.number})`);

            // 🟢 Save first-time event
            const firstTimeEventQuery = `
        INSERT INTO events(
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
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            date = VALUES(date),
            status = VALUES(status)

    `;

            await dbQuerySR(firstTimeEventQuery, [
                0,
                0,
                "First time API-CALL",
                "system",
                "FIRST_CALL",
                new Date(),
                1,
                null,
                null,
                0,
                shipmentId,
                "start",
            ]);

            // 🟢 Save locations
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
            shipment_id = VALUES(shipment_id)
    `;

            if (record.data.locations) {
                for (const l of record.data.locations) {
                    await dbQuerySR(locationsQuery, [
                        l.id ?? null,
                        l.name ?? null,
                        l.state ?? null,
                        l.country ?? null,
                        l.locode ?? null,
                        l.lat ?? null,
                        l.lng ?? null,
                        shipmentId,
                    ]);
                }
                console.log("✅ Locations upserted successfully");
            }

            // 🟢 Save route pin
            if (record.data.route_data?.pin?.length >= 2) {
                const [lat, long] = record.data.route_data.pin;

                const routeQuery = `
            INSERT INTO route(lat, \`long\`, shipment_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                lat = VALUES(lat),
                \`long\` = VALUES(\`long\`)
        `;

                await dbQuerySR(routeQuery, [lat ?? null, long ?? null, shipmentId]);
                console.log("✅ Route upserted successfully");
            } else {
                console.warn("⚠️ No route pin available");
            }

            // 🟢 Save POL
            if (record.data.route?.pol) {
                const pol = record.data.route.pol;

                const polQuery = `
            INSERT INTO pol(location_id, date, actual, shipment_id, last_updated_date)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                date = VALUES(date),
                actual = VALUES(actual),
                last_updated_date = NOW(),
                location_id = VALUES(location_id)
        `;

                await dbQuerySR(polQuery, [
                    pol.location ?? null,
                    pol.date ?? null,
                    pol.actual ?? null,
                    shipmentId,
                ]);
                console.log("✅ POL upserted successfully");
            }

            // 🟢 Save POD
            if (record.data.route?.pod) {
                const pod = record.data.route.pod;

                const podQuery = `
            INSERT INTO pod(location_id, date, predictive_eta, actual, shipment_id, last_updated_date)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                date = VALUES(date),
                predictive_eta = VALUES(predictive_eta),
                actual = VALUES(actual),
                last_updated_date = NOW(),
                location_id = VALUES(location_id)

        `;

                const row = await dbQuerySR(podQuery, [
                    pod.location ?? null,
                    pod.date ?? null,
                    pod.predictive_eta ?? null,
                    pod.actual ? 1 : 0,
                    shipmentId,
                ]);

                console.log("✅ POD upserted successfully");
            }

            // 🟢 Save vessels
            if (record.data.vessels) {
                const vesselsQuery = `
            INSERT INTO vessel(imo, name, vessel_id, shipment_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name)
        `;

                for (const v of record.data.vessels) {
                    await dbQuerySR(vesselsQuery, [
                        v.imo ?? null,
                        v.name ?? null,
                        v.id ?? null,
                        shipmentId,
                    ]);
                }
                console.log("✅ Vessels upserted successfully");

            }
            const routepod = record.data?.route;

            if (routepod.pod.actual === true) {




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
                console.log("updateEorder", updateEorder)



                // =====================================================================

                // i2iDelivered(record.so_id)

                const updatei2i = `
                        INSERT INTO iod.trs_realization_searates (
                            so_id,  
                            cont_id, 
                            ata,
                            atd
                        )
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            so_id = VALUES(so_id),
                            cont_id = VALUES(cont_id),
                            ata = VALUES(ata),
                            atd = VALUES(atd);
                    `;



                if (record.data.containers && Array.isArray(record.data.containers)) {
                    for (const container of record.data.containers) {
                        await connection.execute(updatei2i, [
                            record.so_id,
                            container.number ?? null,
                            record.data.route.pod?.date ?? null,
                            record.data.route.pol?.date ?? null,
                        ]);

                        console.log("✅", record.data.containers.length, "Containers inserted successfully to trs");
                    }
                }


            }


            // 🟢 Save containers + events


            if (record.data.containers) {
                const containersQuery = `
            INSERT INTO containers(container_id, container_number, iso_code, size_type, status, shipment_id)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                iso_code = VALUES(iso_code),
                size_type = VALUES(size_type),
                status = VALUES(status)
        `;


                const eventQuery = `
            INSERT INTO events(order_id, location_id, description, event_type, event_code, date, actual, vessel_id, voyage, container_id, shipment_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                description = VALUES(description),
                
                date = VALUES(date),
                status = VALUES(status),
                vessel_id = VALUES(vessel_id),
                voyage = VALUES(voyage),
                location_id = VALUES(location_id),
                actual = VALUES(actual),

                event_type = VALUES(event_type),
                event_code = VALUES(event_code),

                container_id = VALUES(container_id)

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
                console.log("✅ Containers and events upserted successfully");
            }

            return shipmentId; // biar bisa dipakai di luar fungsi
        }



        try {
            let query = `       
                        select
                            s.shipment_id,
                            s.last_updated_date,
                            s.number,
                            s.so_id,
                            s.sealine_name,
                            s.status,
                            c.container_number,
                            e.event_id,
                            e.order_id,
                            e.location_id,
                            e.description,
                            e.event_type,
                            e.event_code,
                            e.date,
                            e.actual,
                            e.vessel_id,
                            e.voyage,
                            e.container_id,
                            l.name as location_name,
                            l_max.location_list_id,
                            l.lat as location_lat,
                            l.lng as location_lang,
                            r.long as pin_long,
                            r.lat as pin_lat,
                            v.vessel_id as vessel_vesid,
                            v.name,
                            v.imo as vimo,
                            e.vessel_id as event_vessel,
                            pod.location_id as pod_id,
                            DATE_FORMAT(pod.date, '%Y-%m-%d') as pod_date,
                            pol.location_id as pol_id,
                            DATE_FORMAT(pol.date, '%Y-%m-%d') as pol_date,
                            DATE_FORMAT(e.date, '%Y-%m-%d') as e_date
                        from
                            sea_rates.shipments s
                        left join sea_rates.containers c 
                            on
                            s.shipment_id = c.shipment_id
                        left join sea_rates.events e
                            on
                            c.container_id = e.container_id
                            and s.shipment_id = e.shipment_id
                        left join sea_rates.locations l 
                            on
                            e.shipment_id = l.shipment_id
                            and e.location_id = l.location_id
                        left join (
                            select
                                event_id,
                                MAX(location_id) as location_list_id
                            from
                                sea_rates.events
                            group by
                                event_id
                        ) l_max on
                            l_max.event_id = e.event_id
                        left join sea_rates.route r 
                            on
                            s.shipment_id = r.shipment_id
                        left join sea_rates.vessel v 
                            on
                            s.shipment_id = v.shipment_id
                            and e.vessel_id = v.vessel_id
                        left join sea_rates.pod pod 
                            on
                            s.shipment_id = pod.shipment_id
                        left join sea_rates.pol pol 
                            on
                            s.shipment_id = pol.shipment_id
                        where
                            (
                                cast(s.so_id as CHAR) = ?
                            )
                            or (
                                s.number = ?
                                and s.shipment_id = (
                                select
                                    shipment_id
                                from
                                    sea_rates.shipments
                                where
                                    number = ?
                                order by
                                    last_updated_date desc
                                limit 1
                                )
                            )
                            AND e.event_id IS NOT NULL
                             and (
                            s.last_updated_date >= NOW() - INTERVAL 2 WEEK
                            or
                            pod.date <= NOW() and pod.actual = 1
                            )
                        order by
                            e.date desc;
            `
                ;
            const results = await dbQuerySR(query, [so_id, number, number]);
            let reload = false; // default q
            if (refresh && results) {
                const lastUpdate = new Date(results[0].last_updated_date);
                const now = new Date();
                const diffMs = now - lastUpdate;
                const diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours >= 5) {
                    reload = true;
                }

            }


            if (results.length < 1 || reload.toLocaleString() === "true") {

                try {



                    querycheck_so_Id_by_number =
                        `
                    select
                        ti.bl_no,
                        tso.so_id,
                        s.so_id,
                        s.last_updated_date 
                        from
                        trs_realization tr 
                        left join
                        trs_sales_order tso 
                        on
                        tr.so_id = tso.so_id 
                        left join
                        trs_invoice ti 
                        on
                        ti.invoice_id = tr.invoice_id
                        left join
                        sea_rates.shipments s 
                        on
                        s.so_id = tso.so_id 
                        where
                        s.number = "${number}"
                        order by s.last_updated_date DESC
                        limit 1
                    `


                    querycheck_by_so_Id =
                        `
                select
                    ti.bl_no,
                    tso.so_id,
                    s.so_id,
                    s.last_updated_date 
                    from
                    trs_realization tr 
                    left join
                    trs_sales_order tso 
                    on
                    tr.so_id = tso.so_id 
                    left join
                    trs_invoice ti 
                    on
                    ti.invoice_id = tr.invoice_id
                    left join
                    sea_rates.shipments s 
                    on
                    s.so_id = tso.so_id 
                    where
                    s.so_id = "${so_id}"
                    order by s.last_updated_date DESC
                    limit 1
                `

                    let checkresult
                    let contIdClean
                    if (so_id === "0" || so_id === 0) {
                        checkresult = await dbQuery(querycheck_so_Id_by_number);


                        console.log("checkresult by number", checkresult)
                        contIdClean = checkresult[0]?.cont_id?.replace("-", "");

                    } else {

                        checkresult = await dbQuery(querycheck_by_so_Id);
                        console.log("checkresult by so_id", checkresult)
                        contIdClean = checkresult[0]?.cont_id?.replace("-", "");


                    }

                    const url =
                        checkresult[0]?.bl_no
                            ? `https://tracking.searates.com/tracking?api_key=${key}&number=${checkresult[0].bl_no}&sealine=${sealine}&force_update=false&type=bl&route=true&ais=false`
                            : `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=${sealine}&force_update=false&route=true&ais=false`;

                    let searatesRes = await callaxios(url);

                    // ✅ cek aman pakai optional chaining
                    if (!searatesRes.data?.data?.metadata?.sealine_name) {
                        console.warn(`⚠️ Sealine name not found, try to find ${number} retrying with contIdClean... maybe not BL Number`);

                        const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=auto&force_update=false&route=true&ais=false`;
                        searatesRes = await callaxios(fallbackUrl); // pakai reassign, bukan const baru

                    }

                    const record = {
                        so_id: so_id ?? checkresult[0]?.so_id ?? 0,    // ini dari parameter function kamu
                        shipment_id: checkresult[0]?.shipment_id ?? null,
                        cont_id: number,        // kalau mau simpan cont_id juga
                        data: searatesRes.data  // seluruh hasil dari API
                    }; // pastikan sesuai struktur
                    // 🔥 Panggil logic UPSERT penuh

                    if (record.data) {
                        saveSearatesRecord(record);
                        return res.status(200).send({
                            message: "No data found manually on database, here is data from searates",
                            data: { data: searatesRes.data }
                        });
                    } else {
                        console.log("TIDAK ADA DATA DITEMUKAN dari so_id dan number")
                        return res.status(500).send({
                            message: "No data found manually on searates",
                        });
                    }

                    // Return fallback data
                    return res.status(200).send({
                        message: "Saved from fallback (Searates)",
                        data: searatesRes.data
                    });
                } catch (err) {
                    console.error("Error calling Searates fallback:", err);
                    return res.status(500).send({ error: "Fallback API failed", details: err });

                    console.warn("⚠️ SeaRates timeout. Retrying...");
                    await new Promise(r => setTimeout(r, 2000));
                    return axios.get(url, { timeout: 5000 }); // one retry

                }
            } else {


                const shipmentData = {};
                console.log("Call Searates Success using backend for SO ID : ", results[0].so_id)
                results.forEach(row => {
                    const shipmentId = row.shipments_id;
                    if (!shipmentData[shipmentId]) {
                        shipmentData[shipmentId] = {
                            container: [],
                            locations: [],
                            container_events: [],
                            pin_location: [],
                            vessels: [],
                            metadata: [],
                            dataRoute: [
                                {
                                    pod: [],
                                    pol: []
                                }
                            ],
                        };
                    }

                    // Check if the container is already added
                    const existingContainer = shipmentData[shipmentId].container.find(
                        c => c.container_id === row.container_id
                    );
                    if (!existingContainer && row.container_id) {
                        shipmentData[shipmentId].container.push({
                            container_id: row.container_id,
                            sealine_name: row.sealine_name,
                            shipment_id: shipmentId,
                            so_id: row.so_id,
                            number: row.number,
                            container_status: row.status,
                            container_number: row.container_number,
                        });
                    }

                    // Push location data if available
                    if (!shipmentData[shipmentId].locations) {
                        shipmentData[shipmentId].locations = []; // Initialize if undefined
                    }

                    if (row.location_list_id) {
                        const existingLocation = shipmentData[shipmentId].locations.find(
                            loc => loc.location_list_id === row.location_list_id
                        );

                        if (!existingLocation) {
                            shipmentData[shipmentId].locations.push({
                                location_list_id: row.location_list_id,
                                name: row.location_name,   // Fix: `row.location_names` -> `row.name`
                                state: row.state,
                                country: row.country,
                                locode: row.locode,
                                lat: row.location_lat,
                                lng: row.location_lang  // Fix: `row.lang` -> `row.lng`
                            });
                        }
                    }

                    // Check for duplicate events before adding
                    if (row.event_id) {
                        const containerEvents = shipmentData[shipmentId]?.container_events;
                        if (!containerEvents) {
                            console.warn(`shipmentData[${shipmentId}] or .container_events is missing`);
                            return;
                        }
                        const existingOrder = containerEvents.find(ev => ev.order_id === row.order_id);
                        if (!existingOrder) {
                            containerEvents.push({
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
                    } else {
                        const containerEvents = shipmentData[shipmentId]?.container_events;
                        if (!containerEvents) {
                            console.warn(`shipmentData[${shipmentId}] or .container_events is missing`);
                            return;
                        }

                        // Prevent adding "No Event Yet" multiple times
                        const hasNoEvent = containerEvents.some(ev => ev.description === "No Event Yet");
                        if (!hasNoEvent) {
                            containerEvents.push({
                                event_id: 1,
                                description: "No Event Yet",
                            });
                        }
                    }

                    // Check for duplicate pin locations before adding
                    if (row.pin_lat && row.pin_long) {


                        const pins = shipmentData[shipmentId].pin_location;

                        const isDuplicate = pins.some(
                            pin =>
                                parseFloat(pin.longitude).toFixed(6) === parseFloat(row.pin_long).toFixed(6) &&
                                parseFloat(pin.latitude).toFixed(6) === parseFloat(row.pin_lat).toFixed(6)
                        );

                        if (!isDuplicate) {
                            pins.push({
                                latitude: parseFloat(row.pin_lat),
                                longitude: parseFloat(row.pin_long),
                            });
                        }
                    }

                    // Check for duplicate vessels before adding

                    if (row.vessel_id) {
                        const existingVessel = shipmentData[shipmentId].vessels.find(v => v.vessel_id === row.vessel_id);

                        if (!existingVessel) {

                            shipmentData[shipmentId].vessels.push({
                                imo: row.vimo,
                                name: row.name,
                                vessel_id: row.vessel_vesid
                            });
                        }
                    }

                    if (!shipmentData[shipmentId].dataRoute || shipmentData[shipmentId].dataRoute.length === 0) {
                        shipmentData[shipmentId].dataRoute = [{ pod: [], pol: [] }];
                    }

                    // Ensure pod_id exists before adding to pod list
                    if (row.pod_id) {
                        const existingPod = shipmentData[shipmentId].dataRoute[0].pod.find(pod => pod.location === row.pod_id);
                        if (!existingPod) {
                            shipmentData[shipmentId].dataRoute[0].pod.push({
                                location: row.pod_id,
                                date: formatDate(row.pod_date)
                            });
                        }
                    }

                    if (row.pol_id) {
                        const existingPol = shipmentData[shipmentId].dataRoute[0].pol.find(pol => pol.location === row.pol_id);
                        if (!existingPol) {
                            shipmentData[shipmentId].dataRoute[0].pol.push({
                                location: row.pol_id,
                                date: formatDate(row.pol_date)
                            });
                        }
                    }

                    if (row.last_updated_date) {
                        shipmentData[shipmentId].metadata = {
                            ...shipmentData[shipmentId].metadata,
                            last_updated_date: row.last_updated_date,
                        };
                    }



                });

                const responseData = Object.values(shipmentData);
                return res.status(200).send(responseData);
            }
        } catch (error) {
            console.log(timestamp + " Error at User => GetSeaRatesTrackNumber:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }

        async function callaxios(url) {
            try {
                const res = await axios.get(url, { timeout: 5000 });
                return res.data;
                console.log("res.data", res.data)
            } catch (err) {
                if (err.code === 'ECONNABORTED') {
                    console.warn("⚠️ SeaRates timeout. Retrying...");
                    await new Promise(r => setTimeout(r, 2000));
                    return axios.get(url, { timeout: 5000 }); // one retry
                }
                throw err;
            }
        }

    },

    SearatesCheck: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let number = req.params.number.toLocaleString();





        // 📌 Fungsi reusable untuk simpan data Searates ke DB
        async function saveSearatesRecord(record) {
            let connection;
            const metadata = record.data.metadata;

            console.log("metadata", metadata)

            // 🟢 Save shipment (UPSERT)
            const shipmentQuery = `
                INSERT INTO shipments(
                    shipment_id,
                    number,
                    so_id,
                    type,
                    sealine,
                    sealine_name,
                    status,
                    last_updated_date
                ) VALUES ( ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    type = VALUES(type),
                    sealine = VALUES(sealine),
                    sealine_name = VALUES(sealine_name),
                    status = VALUES(status),
                    last_updated_date = NOW()
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
                (await dbQuerySR(
                    "SELECT id FROM shipments WHERE number = ?",
                    [metadata.number]
                ))[0][0].id;

            console.log(`✅ Shipment saved (Container Number : ${metadata.number})`);

            // 🟢 Save first-time event
            const firstTimeEventQuery = `
                INSERT INTO events(
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
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    description = VALUES(description),
                    date = VALUES(date),
                    status = VALUES(status)
    `;

            await dbQuerySR(firstTimeEventQuery, [
                0,
                0,
                "First time API-CALL",
                "system",
                "FIRST_CALL",
                new Date(),
                1,
                null,
                null,
                0,
                shipmentId,
                "start",
            ]);

            // 🟢 Save locations
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
                    shipment_id = VALUES(shipment_id)
    `;

            if (record.data.locations) {
                for (const l of record.data.locations) {
                    await dbQuerySR(locationsQuery, [
                        l.id ?? null,
                        l.name ?? null,
                        l.state ?? null,
                        l.country ?? null,
                        l.locode ?? null,
                        l.lat ?? null,
                        l.lng ?? null,
                        shipmentId,
                    ]);
                }
                console.log("✅ Locations upserted successfully");
            }

            // 🟢 Save route pin
            if (record.data.route_data?.pin?.length >= 2) {
                const [lat, long] = record.data.route_data.pin;

                const routeQuery = `
            INSERT INTO route(lat, \`long\`, shipment_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                lat = VALUES(lat),
                \`long\` = VALUES(\`long\`)
        `;

                await dbQuerySR(routeQuery, [lat ?? null, long ?? null, shipmentId]);
                console.log("✅ Route upserted successfully");
            } else {
                console.warn("⚠️ No route pin available");
            }

            // 🟢 Save POL
            if (record.data.route?.pol) {
                const pol = record.data.route.pol;

                const polQuery = `
            INSERT INTO pol(location_id, date, actual, shipment_id, last_updated_date)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                date = VALUES(date),
                actual = VALUES(actual),
                last_updated_date = NOW(),
                location_id = VALUES(location_id)

        `;

                await dbQuerySR(polQuery, [
                    pol.location ?? null,
                    pol.date ?? null,
                    pol.actual ?? null,
                    shipmentId,
                ]);
                console.log("✅ POL upserted successfully");
            }

            // 🟢 Save POD
            if (record.data.route?.pod) {
                const pod = record.data.route.pod;

                const podQuery = `
            INSERT INTO pod(location_id, date, predictive_eta, actual, shipment_id, last_updated_date)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                date = VALUES(date),
                predictive_eta = VALUES(predictive_eta),
                actual = VALUES(actual),
                last_updated_date = NOW(),
                location_id = VALUES(location_id)

        `;

                await dbQuerySR(podQuery, [
                    pod.location ?? null,
                    pod.date ?? null,
                    pod.predictive_eta ?? null,
                    pod.actual ?? null,
                    shipmentId,
                ]);
                console.log("✅ POD upserted successfully");
            }


            // 🟢 Save vessels
            if (record.data.vessels) {
                const vesselsQuery = `
            INSERT INTO vessel(imo, name, vessel_id, shipment_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name)
        `;

                for (const v of record.data.vessels) {
                    await dbQuerySR(vesselsQuery, [
                        v.imo ?? null,
                        v.name ?? null,
                        v.id ?? null,
                        shipmentId,
                    ]);
                }
                console.log("✅ Vessels upserted successfully");
            }

            // 🟢 Save containers + events
            if (record.data.containers) {
                const containersQuery = `
            INSERT INTO containers(container_id, container_number, iso_code, size_type, status, shipment_id)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                iso_code = VALUES(iso_code),
                size_type = VALUES(size_type),
                status = VALUES(status)
        `;

                const eventQuery = `
            INSERT INTO events(order_id, location_id, description, event_type, event_code, date, actual, vessel_id, voyage, container_id, shipment_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                description = VALUES(description),
                date = VALUES(date),
                status = VALUES(status),
                vessel_id = VALUES(vessel_id),
                voyage = VALUES(voyage),
                location_id = VALUES(location_id),
                actual = VALUES(actual),

                event_type = VALUES(event_type),
                event_code = VALUES(event_code),

                container_id = VALUES(container_id)


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

                            console.log("e ", e)
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
                console.log("✅ Containers and events upserted successfully");
            }

            return shipmentId; // biar bisa dipakai di luar fungsi
        }


        try {
            let query = `       
                            select
                            ti.bl_no,
                            tso.so_id,
                            s.so_id,
                            s.shipment_id,
                            tr.cont_id, 
                            s.last_updated_date 
                            from
                            trs_realization tr 
                            left join
                            trs_sales_order tso 
                            on
                            tr.so_id = tso.so_id 
                            left join
                            trs_invoice ti 
                            on
                            ti.invoice_id = tr.invoice_id
                            left join
                            sea_rates.shipments s 
                            on
                            s.so_id = tso.so_id 
                            left join
                            sea_rates.pod pod
                            on
                            s.shipment_id = pod.shipment_id 
                            where
                            tso.e_order = ${number}
                       and
                          (
                            s.last_updated_date >= NOW() - INTERVAL 2 WEEK
                            or
                            (pod.date <= NOW() and pod.actual = 1)
                            )

                            
            `
                ;
            const results = await dbQuery(query, [number, number, number]);



            if (results.length < 1) {
                // console.log("Check Searates new save for SO ID : ", results[0].so_id)

                try {

                    querycheck_so_Id =
                        `
                        select
                            ti.bl_no,
                            tso.so_id,
                            s.so_id,
                            s.shipment_id,
                            tr.cont_id, 
                            s.last_updated_date 
                            from
                            trs_realization tr 
                            left join
                            trs_sales_order tso 
                            on
                            tr.so_id = tso.so_id 
                            left join
                            trs_invoice ti 
                            on
                            ti.invoice_id = tr.invoice_id
                            left join
                            sea_rates.shipments s 
                            on
                            s.so_id = tso.so_id 
                            where
                            tso.e_order = ${number}

                `

                    const checkresult = await dbQuery(querycheck_so_Id);


                    const contIdClean = checkresult[0]?.cont_id?.replace("-", "");
                    const url =
                        checkresult[0]?.bl_no
                            ? `https://tracking.searates.com/tracking?api_key=${key}&number=${checkresult[0].bl_no}&sealine=auto&force_update=false&route=true&ais=false`
                            : `https://tracking.searates.com/tracking?api_key=${key}&number=${contIdClean}&sealine=auto&force_update=false&route=true&ais=false`;

                    let searatesRes = await axios.get(url, { timeout: "10000" });

                    // ✅ cek aman pakai optional chaining
                    if (!searatesRes.data?.data?.metadata?.sealine_name) {
                        console.warn("⚠️ Sealine name not found by checking, retrying with contIdClean...");

                        const fallbackUrl = `https://tracking.searates.com/tracking?api_key=${key}&number=${contIdClean}&sealine=auto&force_update=false&route=true&ais=false`;
                        searatesRes = await axios.get(fallbackUrl, { timeout: "10000" }); // pakai reassign, bukan const baru
                    }

                    const record = {
                        so_id: checkresult[0]?.so_id,           // ini dari parameter function kamu
                        shipment_id: checkresult[0]?.shipment_id,
                        cont_id: contIdClean,        // kalau mau simpan cont_id juga
                        data: searatesRes.data.data  // seluruh hasil dari API
                    }; // pastikan sesuai struktur

                    // 🔥 Panggil logic UPSERT penuh


                    if (searatesRes) {
                        await saveSearatesRecord(record);
                        console.log("Check Searates, using Searates, Success for SO ID : ", checkresult[0]?.so_id)

                    }

                    // Return fallback data
                    return res.status(200).send({
                        message: "Saved from fallback (Searates)",
                        data: searatesRes.data
                    });
                } catch (err) {
                    console.error("Error calling Searates fallback:", err);
                    return res.status(500).send({ error: "Fallback API failed", details: err });
                }
            } else {


                console.log("Check Searates, using database, Success for SO ID : ", results[0].so_id)
                return res.status(200).send(results);
            }
        } catch (error) {
            console.log(timestamp + " Error at User => GetSeaRatesTrackNumber:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }
    },



}