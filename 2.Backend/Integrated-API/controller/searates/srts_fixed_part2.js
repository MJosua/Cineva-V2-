
    GetSeaRatesTrackNumberandsoid: async (req, res) => {
        const date = new Date();
        const timestamp = date.toLocaleString("id-ID");
        const rawNumber = req.params.number?.toString() || "";
        const number = rawNumber.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
        const so_id = req.params.so_id?.toString() ?? "0";
        const sealine = req.params?.sealine?.toString() || "auto";
        const refresh = req.query?.refresh === "true";

        try {
            const results = await dbQuerySR(`
                SELECT 
                    s.shipment_id, s.last_updated_date, s.number, s.so_id, s.sealine_name, s.status,
                    c.container_number, e.event_id, e.description, e.event_type, e.event_code, e.date, e.actual,
                    e.vessel_id, e.voyage, e.location_id, e.order_id,
                    l.name as location_name, l.lat as location_lat, l.lng as location_lng,
                    v.vessel_id as vessel_vesid, v.name as vessel_name, v.imo as vessel_imo,
                    tr.po_number
                FROM sea_rates.shipments s 
                LEFT JOIN sea_rates.containers c ON s.shipment_id = c.shipment_id 
                LEFT JOIN sea_rates.events e ON e.shipment_id = s.shipment_id AND e.container_id = c.container_id 
                LEFT JOIN sea_rates.locations l ON s.shipment_id = l.shipment_id AND e.location_id = l.location_id 
                LEFT JOIN sea_rates.vessel v ON s.shipment_id = v.shipment_id AND v.vessel_id = e.vessel_id 
                LEFT JOIN iod.trs_realization tr ON s.so_id = tr.so_id
                WHERE (REPLACE(s.number, "-", "") = ? OR s.number = ? OR s.so_id = ?)
                ORDER BY s.last_updated_date DESC, e.order_id ASC 
            `, [number, rawNumber, so_id]);

            const isArrived = results.some(r => _isDeliveredStatus(r.status));
            const cacheEntry = await _getFreshTrackingCacheEntry(number, so_id);
            const reload = _shouldRefreshShipmentData(results, { refresh, isArrived, cacheEntry });

            if (!results.length || reload) {
                const mappingRows = await _loadTrackingMappings({ number, rawNumber, soId: so_id, includeEOrder: true });
                let mapping = mappingRows?.[0] || { so_id: 0, invoice_id: "0", shipment_id: null, cont_id: number, internal_etd: null };

                const trackingContext = _buildTrackingContext(mappingRows.length > 0 ? mappingRows : [mapping], {
                    rawNumber, normalizedNumber: number, soId: so_id, sealineOverride: sealine
                });

                const fetchResult = await _fetchBestSeaRatesMatch({
                    containerNumber: number, trackingNumber: trackingContext.trackingNumber,
                    trackingType: trackingContext.trackingType, scacCandidates: trackingContext.scacCandidates,
                    expected: trackingContext.expected, soId: so_id !== "0" ? so_id : (mapping.so_id ?? 0),
                    requestedBy: req.dataToken?.uid, source: "FRONTEND"
                });

                if (fetchResult.quotaBlocked) return res.status(429).send({ message: "Daily limit reached." });

                if (fetchResult.normalizedData) {
                    const record = {
                        so_id: so_id !== "0" ? so_id : (mapping.so_id ?? 0),
                        invoice_id: mapping.invoice_id ?? null,
                        shipment_id: results[0]?.shipment_id ?? mapping.shipment_id ?? null,
                        cont_id: trackingContext.trackingNumber, data: fetchResult.normalizedData
                    };

                    await _saveSearatesRecord(record, trackingContext.trackingNumber);
                    await _syncToOnlineOrder(trackingContext.trackingNumber, fetchResult.normalizedData, record.so_id);
                    await _upsertTrackingCacheEntry({
                        containerNumber: number, soId: record.so_id, trackingNumber: trackingContext.trackingNumber,
                        trackingType: trackingContext.trackingType, sealine: trackingContext.scacCandidates.join(","),
                        normalizedData: fetchResult.normalizedData, rawResponse: fetchResult.rawResponse,
                        match: fetchResult.match, isHistorical: fetchResult.isHistorical
                    });

                    return res.status(200).send([{
                        message: "Saved from SeaRates",
                        so_id: record.so_id,
                        metadata: fetchResult.normalizedData.metadata,
                        containers: fetchResult.normalizedData.containers,
                        route: fetchResult.normalizedData.route,
                        po_number: mapping.po_number || null
                    }]);
                }
                return res.status(404).send({ status: "error", message: fetchResult.rawResponse?.message || "No data" });
            }

            const shipmentData = {};
            results.forEach(row => {
                const id = row.shipment_id;
                if (!shipmentData[id]) {
                    shipmentData[id] = {
                        so_id: row.so_id, shipment_id: id,
                        metadata: { last_updated_date: row.last_updated_date, number: row.number, so_id: row.so_id, po_number: row.po_number, sealine_name: row.sealine_name, status: row.status },
                        container: [], events: [], locations: [], vessels: []
                    };
                }
                if (row.container_number && !shipmentData[id].container.some(c => c.container_number === row.container_number)) {
                    shipmentData[id].container.push({ container_number: row.container_number, so_id: row.so_id, container_status: row.status });
                }
                if (row.event_id && !shipmentData[id].events.some(e => e.event_id === row.event_id)) {
                    shipmentData[id].events.push({
                        event_id: row.event_id, order_id: row.order_id, description: row.description,
                        event_type: row.event_type, event_code: row.event_code, date: row.date, actual: row.actual,
                        vessel_id: row.vessel_id, voyage: row.voyage, location_id: row.location_id
                    });
                }
                if (row.location_name && !shipmentData[id].locations.some(l => l.name === row.location_name)) {
                    shipmentData[id].locations.push({ location_id: row.location_id, name: row.location_name, lat: row.location_lat, lng: row.location_lng });
                }
                if (row.vessel_vesid && !shipmentData[id].vessels.some(v => v.vessel_id === row.vessel_vesid)) {
                    shipmentData[id].vessels.push({ vessel_id: row.vessel_vesid, name: row.vessel_name, imo: row.vessel_imo, voyage: row.voyage });
                }
            });

            await Promise.all(Object.keys(shipmentData).map(async (id) => {
                const [pol] = await dbQuerySR(`SELECT location_id as location, date, actual FROM sea_rates.pol WHERE shipment_id = ? LIMIT 1`, [id]);
                const [pod] = await dbQuerySR(`SELECT location_id as location, date, actual, predictive_eta FROM sea_rates.pod WHERE shipment_id = ? LIMIT 1`, [id]);
                const [pin] = await dbQuerySR(`SELECT lat, \`long\` FROM sea_rates.route WHERE shipment_id = ? LIMIT 1`, [id]);
                shipmentData[id].dataRoute = [{ pol: pol ? [pol] : [], pod: pod ? [pod] : [] }];
                shipmentData[id].pin_location = pin ? { lat: pin.lat, lng: pin.long } : {};
            }));

            return res.status(200).send(Object.values(shipmentData));
        } catch (err) {
            console.error(`${timestamp} Error in GetSeaRatesTrackNumberandsoid:`, err);
            return res.status(500).send({ error: "Internal Server Error", details: err.message });
        }
    },

    SearatesCheck: async (req, res) => {
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const rawNumber = req.params.number?.toString() || "";
        const soIdParam = req.params.so_id || "0";
        const number = rawNumber.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();

        try {
            const checkQuery = `
                SELECT ti.bl_no, tr.book_no, tr.cont_id, tr.so_id, tr.invoice_id, tr.etd as internal_etd,
                       msl.scac as sealine, msl.type as mapping_type, s.last_updated_date, s.status
                FROM trs_realization tr
                LEFT JOIN trs_sales_order tso ON tr.so_id = tso.so_id
                LEFT JOIN trs_invoice ti ON ti.invoice_id = tr.invoice_id AND ti.cont_id = tr.cont_id
                LEFT JOIN sea_rates.shipments s ON s.so_id = tso.so_id
                LEFT JOIN sea_rates.m_shipping_line msl ON msl.i2i_shipline LIKE CONCAT('%', tr.ship_line, '%') OR msl.i2i_shipline LIKE CONCAT('%', tr.fwd, '%')
                WHERE (tso.e_order = ? OR REPLACE(tr.cont_id, "-", "") = ? OR tr.cont_id = ? OR ti.bl_no = ? OR tr.book_no = ?)
                ${soIdParam !== '0' ? 'AND tr.so_id = ?' : ''}
            `;
            const mappingRows = await dbQuery(checkQuery, [rawNumber, number, rawNumber, rawNumber, rawNumber, ...(soIdParam !== '0' ? [soIdParam] : [])]);
            
            let mapping = mappingRows?.[0] || { so_id: 0, invoice_id: "0", shipment_id: null, cont_id: number, internal_etd: null };

            const cacheEntry = await _getFreshTrackingCacheEntry(number, soIdParam);
            const isArrived = _isDeliveredStatus(mapping.status);
            const reload = _shouldRefreshShipmentData(
                mapping.last_updated_date ? [{ last_updated_date: mapping.last_updated_date, status: mapping.status, so_id: mapping.so_id }] : [],
                { refresh: true, isArrived, cacheEntry }
            );

            if (!reload && mapping.last_updated_date) {
                const fullData = await dbQuerySR(`SELECT * FROM sea_rates.v_shipmet_tracking_detail WHERE number = ?`, [mapping.bl_no || mapping.book_no || mapping.cont_id]);
                return res.status(200).send({ message: "Loaded from Cache", data: fullData?.[0] || {} });
            }

            const trackingContext = _buildTrackingContext(mappingRows?.length ? mappingRows : [mapping], {
                rawNumber, normalizedNumber: number, soId: soIdParam, sealineOverride: "auto"
            });

            const fetchResult = await _fetchBestSeaRatesMatch({
                containerNumber: number, trackingNumber: trackingContext.trackingNumber,
                trackingType: trackingContext.trackingType, scacCandidates: trackingContext.scacCandidates,
                expected: trackingContext.expected, soId: mapping.so_id, requestedBy: req.dataToken?.uid, source: "FRONTEND"
            });

            if (fetchResult.quotaBlocked) return res.status(429).send({ message: "Daily limit reached." });

            if (fetchResult.normalizedData) {
                const record = {
                    so_id: mapping.so_id, invoice_id: mapping.invoice_id, shipment_id: mapping.shipment_id,
                    cont_id: trackingContext.trackingNumber, data: fetchResult.normalizedData
                };
                await _saveSearatesRecord(record, trackingContext.trackingNumber);
                await _syncToOnlineOrder(trackingContext.trackingNumber, fetchResult.normalizedData, record.so_id);
                await _upsertTrackingCacheEntry({
                    containerNumber: number, soId: record.so_id, trackingNumber: trackingContext.trackingNumber,
                    trackingType: trackingContext.trackingType, sealine: trackingContext.scacCandidates.join(","),
                    normalizedData: fetchResult.normalizedData, rawResponse: fetchResult.rawResponse, match: fetchResult.match
                });
                return res.status(200).send({ message: "Saved from SeaRates", data: { data: _enrichVesselsWithVoyage(fetchResult.normalizedData) } });
            }

            return res.status(404).send({ status: "error", message: "Tracking data not available at SeaRates." });

        } catch (error) {
            console.error(timestamp + " Error at SearatesCheck:", error);
            return res.status(500).send({ error: "Internal Server Error", details: error.message });
        }
    },
}
