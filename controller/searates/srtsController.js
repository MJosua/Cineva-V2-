const { query } = require("express");
const { dbSR, dbQuerySR } = require("../../config/db");
const fs = require('fs')

const { default: axios } = require("axios");

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

        const so_id = req.params.so_id;
        const number = req.params.number;

        if (!req.dataToken.user_id) {
            console.log(timestamp + " Unauthorized!");
            return res.status(401).send({ error: "Unauthorized" });
        }

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



        try {
            let query = `       
                        select
                            s.shipment_id,
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
                        order by
                            e.date desc;

                            
            `
                ;
            const results = await dbQuerySR(query, [number, number, number]);
            if (results.length < 1) {
                try {
                    const url = `https://tracking.searates.com/tracking?api_key=${key}&number=${number}&sealine=auto&force_update=false&route=true&ais=false`;

                    const searatesRes = await axios.get(url);
                    console.log("Fallback from Searates:", searatesRes.data);

                    // Return fallback data
                    return res.status(200).send({ data: searatesRes.data });
                } catch (err) {
                    console.error("Error calling Searates fallback:", err);
                    return res.status(500).send({ error: "Fallback API failed", details: err });
                }
            } else {


                const shipmentData = {};
                console.log("Call Searates Success for SO ID : ", results[0].so_id)

                results.forEach(row => {
                    const shipmentId = row.shipments_id;
                    console.log("row", row)
                    if (!shipmentData[shipmentId]) {
                        shipmentData[shipmentId] = {
                            container: [],
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
                        console.log("  shipmentData[shipmentId].vessels", shipmentData[shipmentId].vessels)
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
                return res.status(200).send(responseData);
            }
        } catch (error) {
            console.log(timestamp + " Error at User => GetSeaRatesTrackNumber:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }
    },



}