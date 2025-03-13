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
                s.*,
                c.*,
                l.location_id,
                l.lat,
                l.lng,
                l.name,
                e.*,
                r.long as "pin_long",
                r.lat as "pon_lat",
                r.pin_id,
                v.*
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
	            s.shipment_id = v.vessel_id       
                WHERE 
                s.number = ? 
                AND 
                s.so_id = ?
            `;


            dbSR.query(query, [number, so_id], (err, results) => {
                if (err) {
                    console.log(timestamp + " Error GetSeaRatesTrackUser:", err);
                    return res.status(500).send({ error: "Database Error", details: err });
                }

                const shipmentData = {};
                results.forEach(row => {
                    const shipmentId = row.shipment_id;

                    if (!shipmentData[shipmentId]) {
                        shipmentData[shipmentId] = {
                            shipment_id: row.shipment_id,
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
                        };
                    }

                    // Push location data if available
                    if (row.location_id) {
                        const existingLocation = shipmentData[shipmentId].locations.find(
                            loc => loc.location_id === row.location_id && loc.latitude === row.lat && loc.longitude === row.lng
                        );
                        if (!existingLocation) {
                            shipmentData[shipmentId].locations.push({
                                location_id: row.location_id,
                                latitude: row.lat,
                                longitude: row.lng,
                                name: row.name
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
                                event_code: row.event_code,
                                date: row.date,
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
                            pin => pin.longitude === row.pin_long && pin.latitude === row.pon_lat
                        );
                        if (!existingPin) {
                            shipmentData[shipmentId].pin_location.push({
                                longitude: row.pin_long,
                                latitude: row.pon_lat
                            });
                        }
                    }
            
                    // Check for duplicate vessels before adding
                    if (row.vessel_id) {
                        const existingVessel = shipmentData[shipmentId].vessels.find(v => v.imo === row.imo);
                        if (!existingVessel) {
                            shipmentData[shipmentId].vessels.push({
                                imo: row.imo,
                                name: row.name
                            });
                        }
                    }



                });

                const responseData = Object.values(shipmentData);

                console.log("🛠️ Final Response Data:", JSON.stringify(responseData, null, 2));
                return res.status(200).send(responseData);

            });

        } catch (error) {
            console.log(timestamp + " Error at User => GetSeaRatesTrackUser:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error });
        }
    },



}