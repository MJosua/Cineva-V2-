/**
 * Container Tracking Data Normalizer
 * 
 * Normalizes data from two sources:
 * 1. Backend database - stored/cached container tracking data
 * 2. SeaRates API - live tracking data from SeaRates service
 * 
 * This ensures consistent data structure regardless of the source.
 */

/**
 * Normalize a date string to ISO format
 * SeaRates uses "YYYY-MM-DD HH:mm:ss" format, backend uses ISO format
 */
const normalizeDate = (dateStr) => {
    if (!dateStr) return null;

    // If already ISO format, return as-is
    if (dateStr.includes('T')) {
        return dateStr;
    }

    // Convert "YYYY-MM-DD HH:mm:ss" to ISO format
    try {
        const [datePart, timePart] = dateStr.split(' ');
        if (datePart && timePart) {
            return `${datePart}T${timePart}.000Z`;
        }
        return dateStr;
    } catch (e) {
        console.warn('Date normalization failed:', dateStr, e);
        return dateStr;
    }
};

/**
 * Normalize a boolean/number actual flag
 * SeaRates uses true/false, backend uses 1/0
 */
const normalizeActual = (actual) => {
    if (typeof actual === 'boolean') return actual ? 1 : 0;
    return actual ? 1 : 0;
};

/**
 * Normalize locations array
 * SeaRates uses 'id', backend uses 'location_id' and 'location_list_id'
 */
const normalizeLocations = (locations, isFromSeaRates) => {
    if (!Array.isArray(locations)) return [];

    return locations.map((loc, index) => ({
        // Unified IDs - ensure both id styles are available
        location_id: loc.location_id ?? loc.id ?? index + 1,
        location_list_id: loc.location_list_id ?? loc.id ?? index + 1,
        id: loc.id ?? loc.location_id ?? loc.location_list_id ?? index + 1,
        // Location details
        name: loc.name || 'Unknown',
        state: loc.state || null,
        country: loc.country || null,
        country_code: loc.country_code || null,
        locode: loc.locode || null,
        lat: loc.lat ?? loc.latitude ?? null,
        lng: loc.lng ?? loc.longitude ?? null,
        timezone: loc.timezone || null,
    }));
};

/**
 * Normalize vessels array
 * SeaRates uses 'id', backend uses 'vessel_id'
 */
const normalizeVessels = (vessels, isFromSeaRates) => {
    if (!Array.isArray(vessels)) return [];

    return vessels.map((vessel, index) => ({
        vessel_id: vessel.vessel_id ?? vessel.id ?? index + 1,
        id: vessel.id ?? vessel.vessel_id ?? index + 1,
        name: vessel.name || 'Unknown',
        imo: String(vessel.imo || ''),
        call_sign: vessel.call_sign || null,
        mmsi: vessel.mmsi || null,
        flag: vessel.flag || null,
        voyage: vessel.voyage || null,
    }));
};

/**
 * Normalize events array
 * SeaRates nests events in containers[0].events with 'location' and 'vessel' as IDs
 * Backend has flat events array with 'location_id' and 'vessel_id'
 */
const normalizeEvents = (events, isFromSeaRates) => {
    if (!Array.isArray(events)) return [];

    return events.map((event, index) => ({
        event_id: event.event_id ?? index + 1,
        order_id: event.order_id ?? index + 1,
        description: event.description || '',
        event_type: event.event_type || '',
        event_code: event.event_code || '',
        status: event.status || null,
        date: normalizeDate(event.date),
        actual: normalizeActual(event.actual),
        // Normalize location reference - SeaRates uses 'location', backend uses 'location_id'
        location_id: event.location_id ?? event.location ?? null,
        location: event.location ?? event.location_id ?? null,
        // Normalize vessel reference - SeaRates uses 'vessel', backend uses 'vessel_id'
        vessel_id: event.vessel_id ?? event.vessel ?? null,
        vessel: event.vessel ?? event.vessel_id ?? null,
        voyage: event.voyage || null,
        // Additional SeaRates fields
        facility: event.facility ?? null,
        type: event.type || null,
        transport_type: event.transport_type || null,
        is_additional_event: event.is_additional_event ?? false,
    }));
};

/**
 * Normalize containers array
 * SeaRates uses 'number' and 'status', backend uses 'container_number' and 'container_status'
 */
const normalizeContainers = (containers, isFromSeaRates) => {
    if (!Array.isArray(containers)) return [];

    return containers.map((container, index) => ({
        container_number: container.container_number ?? container.number ?? '',
        number: container.number ?? container.container_number ?? '',
        iso_code: container.iso_code || null,
        size_type: container.size_type || null,
        container_status: container.container_status ?? container.status ?? '',
        status: container.status ?? container.container_status ?? '',
        so_id: container.so_id ?? 0,
        sealine_name: container.sealine_name || null,
        is_status_from_sealine: container.is_status_from_sealine ?? true,
        events_mirrored: container.events_mirrored ?? false,
    }));
};

/**
 * Normalize route/dataRoute structure
 * SeaRates uses: { route: { pol: {...}, pod: {...} } }
 * Backend uses: { dataRoute: [{ pol: [...], pod: [...] }] }
 */
const normalizeDataRoute = (data, isFromSeaRates) => {
    if (isFromSeaRates && data.route) {
        // Convert SeaRates route format to backend dataRoute format
        const route = data.route;
        return [{
            prepol: route.prepol ? [{
                location: route.prepol.location,
                date: normalizeDate(route.prepol.date),
                actual: normalizeActual(route.prepol.actual),
            }] : [],
            pol: route.pol ? [{
                location: route.pol.location,
                date: normalizeDate(route.pol.date),
                actual: normalizeActual(route.pol.actual),
            }] : [],
            pod: route.pod ? [{
                location: route.pod.location,
                date: normalizeDate(route.pod.date),
                actual: normalizeActual(route.pod.actual),
                predictive_eta: route.pod.predictive_eta || null,
            }] : [],
            postpod: route.postpod ? [{
                location: route.postpod.location,
                date: normalizeDate(route.postpod.date),
                actual: normalizeActual(route.postpod.actual),
            }] : [],
        }];
    }

    // Already in backend format or existing dataRoute
    if (Array.isArray(data.dataRoute) && data.dataRoute.length > 0) {
        return data.dataRoute.map(route => ({
            prepol: route.prepol || [],
            pol: Array.isArray(route.pol) ? route.pol.map(p => ({
                ...p,
                date: normalizeDate(p.date),
                actual: normalizeActual(p.actual),
            })) : [],
            pod: Array.isArray(route.pod) ? route.pod.map(p => ({
                ...p,
                date: normalizeDate(p.date),
                actual: normalizeActual(p.actual),
            })) : [],
            postpod: route.postpod || [],
        }));
    }

    return [];
};

/**
 * Normalize pin location
 * SeaRates uses: route_data.pin as [lat, lng] array
 * Backend uses: pin_location as { lat, lng } object
 */
const normalizePinLocation = (data, isFromSeaRates) => {
    if (isFromSeaRates && data.route_data?.pin) {
        const pin = data.route_data.pin;
        if (Array.isArray(pin) && pin.length === 2) {
            return { lat: pin[0], lng: pin[1] };
        }
    }

    if (data.pin_location) {
        if (typeof data.pin_location === 'object') {
            return {
                lat: data.pin_location.lat ?? data.pin_location.latitude ?? null,
                lng: data.pin_location.lng ?? data.pin_location.longitude ?? null,
            };
        }
    }

    return {};
};

/**
 * Normalize metadata
 */
const normalizeMetadata = (data, isFromSeaRates) => {
    const metadata = data.metadata || {};

    return {
        type: metadata.type || 'BL',
        number: metadata.number || '',
        sealine: metadata.sealine || '',
        sealine_name: metadata.sealine_name || '',
        status: metadata.status || '',
        is_status_from_sealine: metadata.is_status_from_sealine ?? true,
        from_cache: metadata.from_cache ?? false,
        // Normalize the update timestamp - backend uses 'last_updated_date', SeaRates uses 'updated_at'
        last_updated_date: normalizeDate(metadata.last_updated_date || metadata.updated_at),
        updated_at: normalizeDate(metadata.updated_at || metadata.last_updated_date),
        cache_expires: metadata.cache_expires || null,
        so_id: metadata.so_id ?? 0,
    };
};

/**
 * Detect if data is from SeaRates API (vs from backend database)
 */
const isSeaRatesFormat = (data) => {
    // SeaRates has 'route' object, backend has 'dataRoute' array
    if (data.route && !data.dataRoute) return true;

    // SeaRates has 'route_data' with 'pin' array
    if (data.route_data?.pin) return true;

    // SeaRates containers use 'number' and 'status', backend uses 'container_number' and 'container_status'
    if (data.containers?.[0]?.number && !data.containers?.[0]?.container_number) return true;

    // SeaRates locations use 'id' only, backend uses 'location_id' and 'location_list_id'
    if (data.locations?.[0]?.id && !data.locations?.[0]?.location_id) return true;

    return false;
};

/**
 * Get source type label for debugging
 */
const getSourceType = (data) => {
    if (isSeaRatesFormat(data)) return 'searates';
    return 'database';
};

/**
 * Derive the correct location order from events
 * This fixes the issue where backend location IDs don't match the route order
 * Returns locations in the order they appear in the voyage (based on event order_id)
 */
const deriveLocationOrderFromEvents = (events, locations) => {
    if (!Array.isArray(events) || events.length === 0 || !Array.isArray(locations)) {
        return [];
    }

    // Sort events by order_id to get the chronological order
    const sortedEvents = [...events].sort((a, b) => (a.order_id || 0) - (b.order_id || 0));

    // Extract unique location IDs in order of appearance
    const seenLocations = new Set();
    const orderedLocationIds = [];

    for (const event of sortedEvents) {
        const locId = event.location_id ?? event.location;
        if (locId && !seenLocations.has(locId)) {
            seenLocations.add(locId);
            orderedLocationIds.push(locId);
        }
    }

    // Map location IDs to location objects, preserving the derived order
    const orderedLocations = orderedLocationIds.map((locId, index) => {
        const loc = locations.find(l =>
            l.location_id === locId ||
            l.location_list_id === locId ||
            l.id === locId
        );

        if (loc) {
            return {
                ...loc,
                // Add route_order for map drawing
                route_order: index + 1,
                // Ensure consistent ID for lookups
                location_id: locId,
                location_list_id: locId,
                id: locId,
            };
        }
        return null;
    }).filter(Boolean);

    return orderedLocations;
};

/**
 * Find departure (ETD) and arrival (ETA) information from events
 * Uses POL departure event for ETD and POD arrival event for ETA
 */
const extractETDandETA = (events, dataRoute, locations) => {
    let etd = null;
    let eta = null;
    let departureLocation = null;
    let arrivalLocation = null;

    if (!Array.isArray(events) || events.length === 0) {
        return { etd, eta, departureLocation, arrivalLocation };
    }

    // Sort events by order_id
    const sortedEvents = [...events].sort((a, b) => (a.order_id || 0) - (b.order_id || 0));

    // Find the first DEPA (departure) event from POL - this is the ETD
    const firstDepartureEvent = sortedEvents.find(e =>
        e.event_code === 'DEPA' && e.event_type === 'TRANSPORT'
    );

    // Find the last ARRI (arrival) event at POD - this is the ETA
    const arrivalEvents = sortedEvents.filter(e =>
        e.event_code === 'ARRI' && e.event_type === 'TRANSPORT'
    );
    const lastArrivalEvent = arrivalEvents.length > 0 ? arrivalEvents[arrivalEvents.length - 1] : null;

    // Find location by ID with all possible ID fields
    const findLocation = (locId) => locations?.find(loc =>
        loc.location_id === locId || loc.location_list_id === locId || loc.id === locId
    );

    if (firstDepartureEvent) {
        etd = firstDepartureEvent.date;
        const locId = firstDepartureEvent.location_id ?? firstDepartureEvent.location;
        departureLocation = findLocation(locId)?.name || null;
    }

    if (lastArrivalEvent) {
        eta = lastArrivalEvent.date;
        const locId = lastArrivalEvent.location_id ?? lastArrivalEvent.location;
        arrivalLocation = findLocation(locId)?.name || null;
    }

    // Fallback to dataRoute if events don't provide enough info
    if (!etd && dataRoute?.[0]?.pol?.[0]?.date) {
        etd = dataRoute[0].pol[0].date;
    }
    if (!eta && dataRoute?.[0]?.pod?.[0]?.date) {
        eta = dataRoute[0].pod[0].date;
    }

    // Fallback location from dataRoute
    if (!departureLocation && dataRoute?.[0]?.pol?.[0]?.location && locations) {
        const polId = dataRoute[0].pol[0].location;
        departureLocation = findLocation(polId)?.name || null;
    }
    if (!arrivalLocation && dataRoute?.[0]?.pod?.[0]?.location && locations) {
        const podId = dataRoute[0].pod[0].location;
        arrivalLocation = findLocation(podId)?.name || null;
    }

    return { etd, eta, departureLocation, arrivalLocation };
};

/**
 * Main normalizer function
 * Takes raw data from either source and returns a unified structure
 */
export const normalizeContainerTrackingData = (rawData) => {
    if (!rawData) return null;

    const isFromSeaRates = isSeaRatesFormat(rawData);
    const sourceType = getSourceType(rawData);

    console.log(`ðŸ“¦ Normalizing data from: ${sourceType}`);

    // Extract events - SeaRates nests them in containers[0].events
    let events = rawData.events || [];
    if (isFromSeaRates && rawData.containers?.[0]?.events) {
        events = rawData.containers[0].events;
    }

    // Normalize all data structures
    const normalizedLocations = normalizeLocations(rawData.locations, isFromSeaRates);
    const normalizedVessels = normalizeVessels(rawData.vessels, isFromSeaRates);
    const normalizedEvents = normalizeEvents(events, isFromSeaRates);
    const normalizedContainers = normalizeContainers(rawData.containers || rawData.container, isFromSeaRates);
    const normalizedDataRoute = normalizeDataRoute(rawData, isFromSeaRates);
    const normalizedPinLocation = normalizePinLocation(rawData, isFromSeaRates);
    const normalizedMetadata = normalizeMetadata(rawData, isFromSeaRates);

    // Derive correct location order from events (fixes backend mismatched IDs)
    const orderedLocations = deriveLocationOrderFromEvents(normalizedEvents, normalizedLocations);

    // Extract ETD/ETA and locations
    const { etd, eta, departureLocation, arrivalLocation } = extractETDandETA(
        normalizedEvents,
        normalizedDataRoute,
        normalizedLocations
    );

    const normalized = {
        // Source info for debugging
        _source: sourceType,
        _isFromSeaRates: isFromSeaRates,

        // Core data
        metadata: normalizedMetadata,
        containers: normalizedContainers,
        events: normalizedEvents,
        locations: normalizedLocations,
        vessels: normalizedVessels,
        dataRoute: normalizedDataRoute,
        pin_location: normalizedPinLocation,

        // Ordered locations for map route - derived from events' order_id
        // Use this for drawing the map route to ensure correct sequence:
        // Jakarta â†’ Tanjung Pelepas â†’ Port Louis â†’ Cape Town
        orderedLocations,

        // Computed values for UI
        etd,
        eta,
        departureLocation,
        arrivalLocation,

        // Preserve route_data for map drawing if available
        route_data: rawData.route_data || null,

        // Facilities if available (SeaRates only)
        facilities: rawData.facilities || [],
    };

    console.log(`âœ… Normalized data:`, {
        source: sourceType,
        containers: normalized.containers.length,
        events: normalized.events.length,
        locations: normalized.locations.length,
        orderedLocations: normalized.orderedLocations.map(l => l.name),
        vessels: normalized.vessels.length,
        etd: normalized.etd,
        eta: normalized.eta,
        departureLocation: normalized.departureLocation,
        arrivalLocation: normalized.arrivalLocation,
    });

    return normalized;
};

/**
 * Calculate progress percentage between POL and POD
 */
export const calculateProgress = (etd, eta) => {
    if (!etd || !eta) return 0;

    const polDate = new Date(etd);
    const podDate = new Date(eta);

    if (isNaN(polDate.getTime()) || isNaN(podDate.getTime())) {
        console.warn("âš ï¸ Invalid date format for progress calculation");
        return 0;
    }

    const now = new Date();
    const totalDuration = podDate - polDate;

    if (totalDuration <= 0) {
        console.warn("âš ï¸ Invalid duration (pod before pol)");
        return 0;
    }

    const progressDuration = now - polDate;
    const progress = Math.max(0, Math.min(progressDuration / totalDuration, 1));
    return Math.max(0, Math.min(100, progress * 100));
};

/**
 * Find location name by ID (handles all ID formats)
 */
export const findLocationName = (locations, locationId) => {
    if (!Array.isArray(locations) || locationId == null) return null;

    const loc = locations.find(l =>
        l.location_id === locationId ||
        l.location_list_id === locationId ||
        l.id === locationId
    );

    return loc?.name || null;
};

/**
 * Find vessel by ID (handles all ID formats)
 */
export const findVessel = (vessels, vesselId) => {
    if (!Array.isArray(vessels) || vesselId == null) return null;

    return vessels.find(v =>
        v.vessel_id === vesselId ||
        v.id === vesselId
    ) || null;
};

export default normalizeContainerTrackingData;




