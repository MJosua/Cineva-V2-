const { query } = require("express");
const { dbSR, dbQuerySR } = require("../config/db");
const fs = require('fs')

let blue = "\x1b[36m";

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
                *,
                l.name as location_name,
                l.location_id as location_list_id,
                l.lat as location_lat,
                l.lng as location_lang,
                r.long as pin_long,
	            r.lat as pin_lat,
                pod.location_id  as pod_id,
                DATE_FORMAT(pod.date , '%Y-%m-%d')pod_date,
	            pol.location_id as pol_id,
                DATE_FORMAT(pol.date , '%Y-%m-%d')pol_date,
                DATE_FORMAT(e.date , '%Y-%m-%d')e_date,
                v.vessel_id as vessel_vesid,
                e.vessel_id as event_vessel
            from
                sea_rates.shipments s
            left join sea_rates.containers c on
                s.shipment_id = c.shipment_id
            left join sea_rates.locations l on
                s.shipment_id = l.shipment_id
            left join sea_rates.events e on
                s.shipment_id = e.shipment_id
            left join sea_rates.route r on
                s.shipment_id = r.shipment_id
            left join sea_rates.vessel v on
                s.shipment_id = v.shipment_id
            left join sea_rates.pod pod on
                s.shipment_id = pod.shipment_id
            left join sea_rates.pol pol on
                s.shipment_id = pol.shipment_id 
            WHERE 
                s.number = ? 
                AND 
                s.so_id = ?
                and
                s.shipment_id = (
                    SELECT MAX(shipment_id) 
                    FROM sea_rates.shipments 
                    WHERE number = ?
                    AND so_id = ?
                )
            group by
                s.shipment_id,
                c.container_id,
                e.event_id,
                v.vessel_id,
                l.location_id;
            `
                ;


            dbSR.query(query, [number, so_id, number, so_id], (err, results) => {
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
                                date: row.e_date,
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
                                longitude: row.pin_long,
                                latitude: row.pin_lat
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
                                date: row.pod_date
                            });
                        }
                    }

                    if (row.pol_id) {
                        const existingPol = shipmentData[shipmentId].dataRoute[0].pol.find(pol => pol.location === row.pol_id);
                        if (!existingPol) {
                            shipmentData[shipmentId].dataRoute[0].pol.push({ 
                                location: row.pol_id, 
                                date: row.pol_date
                            });
                        }
                    }


                });

                const responseData = Object.values(shipmentData);
                return res.status(200).send(responseData);

            });

        } catch (error) {
            console.log(timestamp + " Error at User => GetSeaRatesTrackUser:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }
    },



}