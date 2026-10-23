function createSeaRatesTrackingEngine({
    apiKey,
    axiosInstance,
    dbQuery = null,
    reserveQuotaSlot = null,
    finalizeReservedApiHit = null,
    redactUrl = null,
    logger = console,
}) {
    const inFlightRequests = new Map();
    let trackingCacheAvailable;

    function normalizeTrackingNumber(value) {
        if (!value) return "";
        let str = String(value).trim().toUpperCase();
        return str.replace(/[^A-Za-z0-9]/g, "").trim().toUpperCase();
    }

    function normalizeLooseText(value) {
        if (!value) return "";
        return String(value)
            .normalize("NFKD")
            .replace(/[^\w\s]/g, " ")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    function looseTextMatch(expected, actual) {
        const left = normalizeLooseText(expected);
        const right = normalizeLooseText(actual);
        if (!left || !right) return false;
        return left.includes(right) || right.includes(left);
    }

    function isDeliveredStatus(status) {
        const normalized = normalizeLooseText(status);
        return normalized.includes("DELIVERED") || normalized.includes("ARRIVAL") || normalized.includes("ARRIVED");
    }

    function diffDays(d1, d2) {
        if (!d1 || !d2) return 999;
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 999;
        return Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
    }

    function signedDayDiff(d1, d2) {
        if (!d1 || !d2) return null;
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return null;
        return (date2 - date1) / (1000 * 60 * 60 * 24);
    }

    function extractRouteLocationName(data, routeKey) {
        const point = data?.route?.[routeKey];
        if (!point) return null;

        const matchedLocation = (data?.locations || []).find((location) =>
            String(location?.id ?? location?.location_id ?? "") === String(point.location ?? "")
        );

        if (matchedLocation?.name && matchedLocation?.locode) {
            return `${matchedLocation.name} ${matchedLocation.locode}`;
        }

        return matchedLocation?.name || matchedLocation?.locode || point.location || null;
    }

    function extractVoyageId(data) {
        for (const container of data?.containers || []) {
            for (const event of container?.events || []) {
                if (event?.voyage) return event.voyage;
            }
        }
        return null;
    }

    function validateRouteExpectation(data, expected = {}) {
        const expectedPol = expected?.pol;
        const expectedPod = expected?.pod;

        if (!expectedPol && !expectedPod) return null;

        const actualPol = extractRouteLocationName(data, "pol");
        const actualPod = extractRouteLocationName(data, "pod") || extractRouteLocationName(data, "postpod");
        const polMatch = !expectedPol || looseTextMatch(expectedPol, actualPol);
        const podMatch = !expectedPod || looseTextMatch(expectedPod, actualPod);
        const polKnown = !expectedPol || !!actualPol;
        const podKnown = !expectedPod || !!actualPod;

        if (polMatch && podMatch) return true;
        if (polKnown && podKnown) return false;
        return null;
    }

    function scoreVoyageCandidate(normalizedData, expected = {}) {
        const trackingType = String(expected?.trackingType || "ct").toLowerCase();
        const internalEtd = expected?.internalEtd || expected?.etd || null;
        const internalEta = expected?.internalEta || expected?.eta || null;
        const searatesEtd = normalizedData?.route?.pol?.date || null;
        const searatesEta = normalizedData?.route?.pod?.predictive_eta || normalizedData?.route?.pod?.date || null;
        const etdDiff = internalEtd ? diffDays(internalEtd, searatesEtd) : 0;
        const etaDiff = internalEta ? diffDays(internalEta, searatesEta) : null;
        const etaDelta = internalEta ? signedDayDiff(internalEta, searatesEta) : null;

        let withinTolerance = true;
        if (internalEtd && trackingType === "ct") {
            withinTolerance = etdDiff <= 14;
        }

        const actualPol = extractRouteLocationName(normalizedData, "pol");
        const actualPod = extractRouteLocationName(normalizedData, "pod") || extractRouteLocationName(normalizedData, "postpod");
        const actualVessel = normalizedData?.vessels?.[0]?.name || null;
        const polMatched = expected?.pol ? looseTextMatch(expected.pol, actualPol) : false;
        const podMatched = expected?.pod ? looseTextMatch(expected.pod, actualPod) : false;
        const vesselMatched = expected?.vesselName ? looseTextMatch(expected.vesselName, actualVessel) : false;
        const routeValidated = validateRouteExpectation(normalizedData, expected);
        const hasRouteData = Array.isArray(normalizedData?.route_data?.route) && normalizedData.route_data.route.length > 0;

        let score = 25;
        if (internalEtd) {
            if (trackingType === "ct") {
                score = 100 - Math.min(etdDiff, 14) * 5;
            } else {
                score = 100 - Math.min(etdDiff, 60) * 2;
            }
        }

        if (!withinTolerance) {
            score = -1000;
        }

        if (polMatched) score += 20;
        if (podMatched) score += 20;
        if (vesselMatched) score += 15;
        if (routeValidated === true) score += 15;
        if (routeValidated === false) score -= 15;
        if (hasRouteData) score += 5;

        return {
            score,
            etdDiff,
            etaDiff,
            etaDelta,
            withinTolerance,
            polMatched,
            podMatched,
            vesselMatched,
            routeValidated,
            hasRouteData,
            internalEta,
            searatesEta,
            internalEtd,
            searatesEtd,
            routePol: actualPol,
            routePod: actualPod,
            vesselName: actualVessel,
            voyageId: extractVoyageId(normalizedData),
            trackingType
        };
    }

    function pickBestVoyageCandidate(candidates) {
        if (!Array.isArray(candidates) || !candidates.length) return null;

        return [...candidates].sort((left, right) => {
            const scoreDiff = (right.match?.score ?? -1000) - (left.match?.score ?? -1000);
            if (scoreDiff !== 0) return scoreDiff;

            const etdDiff = (left.match?.etdDiff ?? 999) - (right.match?.etdDiff ?? 999);
            if (etdDiff !== 0) return etdDiff;

            const routePriority = Number(right.match?.routeValidated === true) - Number(left.match?.routeValidated === true);
            if (routePriority !== 0) return routePriority;

            return Number(right.match?.hasRouteData === true) - Number(left.match?.hasRouteData === true);
        })[0];
    }

    function getRefreshWindowHours({ status, isHistorical = false, lastErrorCode = null } = {}) {
        if (lastErrorCode) return 6;
        if (isDeliveredStatus(status)) return 24 * 7;
        if (isHistorical) return 24 * 14;
        return 6;
    }

    function shouldRefreshShipmentData(rows, { refresh = false, isArrived = false, cacheEntry = null } = {}) {
        if (!rows?.length) return true;

        const lastUpdated = rows[0]?.last_updated_date ? new Date(rows[0].last_updated_date) : null;
        if (!lastUpdated || isNaN(lastUpdated.getTime())) return true;

        const status = cacheEntry?.tracking_status || rows[0]?.status || null;
        const ttlHours = getRefreshWindowHours({
            status,
            isHistorical: Boolean(cacheEntry?.is_historical),
            lastErrorCode: cacheEntry?.last_error_code
        });
        const diffHours = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (refresh) {
            return diffHours >= ttlHours;
        }

        if (isArrived) {
            return diffHours >= 24 * 7;
        }

        return diffHours >= ttlHours || !rows[0]?.so_id;
    }

    async function withInFlightTracking(lockKey, factory) {
        if (!lockKey) return factory();
        if (inFlightRequests.has(lockKey)) {
            return inFlightRequests.get(lockKey);
        }

        const promise = (async () => {
            try {
                return await factory();
            } finally {
                inFlightRequests.delete(lockKey);
            }
        })();

        inFlightRequests.set(lockKey, promise);
        return promise;
    }

    async function ensureTrackingCacheAvailable() {
        if (!dbQuery) return false;
        if (typeof trackingCacheAvailable === "boolean") {
            return trackingCacheAvailable;
        }

        try {
            const rows = await dbQuery(`
                SELECT 1 AS present
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'container_tracking_cache'
                LIMIT 1
            `);
            trackingCacheAvailable = Boolean(rows?.length);
        } catch (err) {
            logger.warn?.("Warning checking container_tracking_cache availability:", err.message);
            trackingCacheAvailable = false;
        }

        return trackingCacheAvailable;
    }

    async function getFreshTrackingCacheEntry(containerNumber, soId = 0) {
        if (!containerNumber || !(await ensureTrackingCacheAvailable())) return null;

        try {
            const rows = await dbQuery(`
                SELECT *
                FROM container_tracking_cache
                WHERE container_number = ?
                  AND so_id = ?
                LIMIT 1
            `, [normalizeTrackingNumber(containerNumber), Number(soId) || 0]);

            const row = rows?.[0];
            if (!row) return null;

            if (row.expires_at && new Date(row.expires_at) <= new Date()) {
                return null;
            }

            if (row.payload_json) {
                try {
                    row.payload = JSON.parse(row.payload_json);
                } catch (err) {
                    row.payload = null;
                }
            }

            return row;
        } catch (err) {
            logger.warn?.("Warning reading container_tracking_cache:", err.message);
            return null;
        }
    }

    async function upsertTrackingCacheEntry({
        containerNumber,
        soId = 0,
        trackingNumber = null,
        trackingType = null,
        sealine = null,
        normalizedData = null,
        rawResponse = null,
        match = null,
        isHistorical = false,
        lastErrorCode = null,
        trackingContext = null
    }) {
        if (!containerNumber || !(await ensureTrackingCacheAvailable())) return;

        const normalizedContainer = normalizeTrackingNumber(containerNumber);
        const trackingStatus = normalizedData?.metadata?.status || rawResponse?.message || lastErrorCode || "UNKNOWN";
        const ttlHours = getRefreshWindowHours({
            status: trackingStatus,
            isHistorical,
            lastErrorCode
        });
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
        const routePod = extractRouteLocationName(normalizedData, "pod") || extractRouteLocationName(normalizedData, "postpod");

        try {
            const payloadToStore = rawResponse && typeof rawResponse === "object"
                ? {
                    ...rawResponse,
                    match_details: match || rawResponse.match_details || null,
                    tracking_context: trackingContext || rawResponse.tracking_context || null,
                }
                : rawResponse;

            await dbQuery(`
                INSERT INTO container_tracking_cache (
                    container_number,
                    so_id,
                    tracking_number,
                    tracking_type,
                    sealine,
                    voyage_id,
                    vessel_name,
                    etd,
                    eta,
                    pol,
                    pod,
                    last_updated,
                    tracking_status,
                    payload_json,
                    expires_at,
                    is_historical,
                    last_error_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    tracking_number = VALUES(tracking_number),
                    tracking_type = VALUES(tracking_type),
                    sealine = VALUES(sealine),
                    voyage_id = VALUES(voyage_id),
                    vessel_name = VALUES(vessel_name),
                    etd = VALUES(etd),
                    eta = VALUES(eta),
                    pol = VALUES(pol),
                    pod = VALUES(pod),
                    last_updated = VALUES(last_updated),
                    tracking_status = VALUES(tracking_status),
                    payload_json = VALUES(payload_json),
                    expires_at = VALUES(expires_at),
                    is_historical = VALUES(is_historical),
                    last_error_code = VALUES(last_error_code)
            `, [
                normalizedContainer,
                Number(soId) || 0,
                trackingNumber || normalizedContainer,
                trackingType || null,
                sealine || null,
                match?.voyageId || null,
                match?.vesselName || normalizedData?.vessels?.[0]?.name || null,
                normalizedData?.route?.pol?.date || null,
                normalizedData?.route?.pod?.predictive_eta || normalizedData?.route?.pod?.date || null,
                match?.routePol || extractRouteLocationName(normalizedData, "pol") || null,
                match?.routePod || routePod || null,
                now,
                trackingStatus,
                payloadToStore ? JSON.stringify(payloadToStore) : null,
                expiresAt,
                isHistorical ? 1 : 0,
                lastErrorCode || null
            ]);
        } catch (err) {
            logger.warn?.("Warning writing container_tracking_cache:", err.message);
        }
    }

    function isValidSeaRatesResponse(data) {
        if (!data) return false;
        if (data.status === "error") return false;
        if (!data.metadata) return false;
        return true;
    }

    function normalizeSeaRatesData(rawResponse) {
        if (!rawResponse) return null;

        const data = rawResponse?.data || rawResponse;

        if (!isValidSeaRatesResponse(data)) {
            if (data && typeof data === "object" && Object.keys(data).length > 0) {
                logger.warn?.("SeaRates response failed validation:", JSON.stringify(data).substring(0, 200));
            }
            return null;
        }

        const result = {
            metadata: data.metadata || {},
            containers: data.containers || [],
            locations: data.locations || [],
            vessels: data.vessels || [],
            route: data.route || {},
            route_data: data.route_data || {},
            api_calls: data.api_calls || null,
            unique_shipments: data.unique_shipments || null,
            message: rawResponse.message || data.message || null
        };

        if (rawResponse?.status === "error" || result.metadata.status === "UNKNOWN" || result.message === "SEALINE_HASNT_PROVIDE_INFO") {
            result.is_unknown = true;
        }

        return result;
    }

    async function callSeaRatesAPI(url, { timeoutMs = 15000 } = {}) {
        const MAX_ATTEMPTS = 4; // 1 initial + 3 retries
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const response = await axiosInstance.get(url, {
                    timeout: timeoutMs,
                    headers: { Accept: "application/json" }
                });
                return response.data;
            } catch (err) {
                lastError = err;
                if (err.code === "ECONNABORTED" && attempt < MAX_ATTEMPTS) {
                    logger.warn?.(`SeaRates timeout (Attempt ${attempt}/${MAX_ATTEMPTS}): ${redactUrl ? redactUrl(url) : url}`);
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    continue;
                }
                break;
            }
        }

        if (lastError?.code === "ECONNABORTED") {
            logger.error?.(`SeaRates tracking failed after ${MAX_ATTEMPTS} attempts due to timeout: ${redactUrl ? redactUrl(url) : url}`);
        }
        return { message: lastError?.message || "Unknown Error", status: lastError?.response?.status || "error" };
    }

    async function fetchSeaRatesHistory(number) {
        const url = `https://tracking.searates.com/history?api_key=${apiKey}&number=${number}`;
        try {
            const response = await axiosInstance.get(url, { timeout: 10000 });
            if (response.data && response.data.status === "success") {
                return response.data.requests || [];
            }
        } catch (err) {
            logger.error?.(`Error fetching SeaRates history for ${number}:`, err.message);
        }
        return [];
    }

    async function getBestHistoricalVoyage(number, expected = {}) {
        const expectedContext = typeof expected === "string" ? { internalEtd: expected } : (expected || {});
        if (!expectedContext.internalEtd && !expectedContext.vesselName && !expectedContext.pol && !expectedContext.pod) {
            return null;
        }

        const history = await fetchSeaRatesHistory(number);
        if (!history.length) return null;

        const candidates = [];

        for (const entry of history) {
            const detailUrl = `https://tracking.searates.com/history?api_key=${apiKey}&number=${number}&id=${entry.id}`;
            try {
                const resp = await axiosInstance.get(detailUrl, { timeout: 10000 });
                const normalized = normalizeSeaRatesData(resp.data);
                if (!normalized) continue;

                const match = scoreVoyageCandidate(normalized, expectedContext);
                if (match.withinTolerance) {
                    candidates.push({
                        rawResponse: resp.data,
                        normalizedData: normalized,
                        match
                    });
                }
            } catch (err) {
                logger.warn?.(`Failed to fetch history detail for ID ${entry.id}`);
            }
        }

        const bestSnapshot = pickBestVoyageCandidate(candidates);
        if (!bestSnapshot?.rawResponse) return null;

        bestSnapshot.rawResponse.is_historical = true;
        bestSnapshot.rawResponse.match_details = bestSnapshot.match;
        return bestSnapshot.rawResponse;
    }

    async function fetchBestLiveVoyage({
        trackingNumber,
        trackingType,
        scacCandidates,
        expected,
        soId,
        requestedBy,
        source = "FRONTEND"
    }) {

        const candidates = [];
        let lastErrorResponse = null;

        for (const scac of scacCandidates) {
            const url = `https://tracking.searates.com/tracking?api_key=${apiKey}&number=${trackingNumber}&sealine=${scac}&force_update=false&type=${trackingType}&route=true&ais=false`;
            const quota = reserveQuotaSlot
                ? await reserveQuotaSlot(trackingNumber, soId, source, requestedBy, trackingType)
                : { allowed: true, usageCount: 0, limit: 0, logId: null };

            if (!quota.allowed) {
                return {
                    bestCandidate: null,
                    lastErrorResponse: { message: "QUOTA_EXCEEDED" },
                    quota,
                    blockedByQuota: true
                };
            }

            try {
                const rawResponse = await callSeaRatesAPI(url);
                const normalizedData = normalizeSeaRatesData(rawResponse);

                if (normalizedData && !normalizedData.is_unknown) {
                    const match = scoreVoyageCandidate(normalizedData, {
                        ...expected,
                        trackingType
                    });

                    if (match.withinTolerance) {
                        if (finalizeReservedApiHit) {
                            await finalizeReservedApiHit(quota.logId, "SUCCESS", {
                                etd_diff_days: match.etdDiff,
                                route_validated: match.routeValidated,
                                score: match.score
                            }, url);
                        }

                        candidates.push({
                            rawResponse,
                            normalizedData,
                            match,
                            successfulUrl: url,
                            sealine: scac
                        });
                    } else if (finalizeReservedApiHit) {
                        await finalizeReservedApiHit(quota.logId, "FAIL", {
                            message: "ETD_MISMATCH",
                            searates_etd: normalizedData?.route?.pol?.date || null,
                            internal_etd: expected?.internalEtd || null,
                            etd_diff_days: match.etdDiff
                        }, url);
                    }
                } else {
                    lastErrorResponse = rawResponse;
                    if (finalizeReservedApiHit) {
                        await finalizeReservedApiHit(quota.logId, "FAIL", rawResponse, url);
                    }
                    if (rawResponse?.message === "SEALINE_HASNT_PROVIDE_INFO") {
                        break;
                    }
                }
            } catch (err) {
                lastErrorResponse = { message: err.message, status: err.response?.status };
                if (finalizeReservedApiHit) {
                    await finalizeReservedApiHit(quota.logId, "FAIL", lastErrorResponse, url);
                }
            }
        }

        return {
            bestCandidate: pickBestVoyageCandidate(candidates),
            lastErrorResponse,
            quota: null,
            blockedByQuota: false
        };
    }

    async function fetchBestSeaRatesMatch({
        containerNumber,
        trackingNumber,
        trackingType,
        scacCandidates,
        expected,
        soId,
        requestedBy,
        source = "FRONTEND"
    }) {
        const normalizedNumber = normalizeTrackingNumber(trackingNumber || containerNumber);

        const liveResult = await withInFlightTracking(
            `${normalizeTrackingNumber(trackingNumber)}::${Number(soId) || 0}`,
            async () => fetchBestLiveVoyage({
                trackingNumber,
                trackingType,
                scacCandidates,
                expected,
                soId,
                requestedBy,
                source
            })
        );

        if (liveResult.blockedByQuota) {
            return {
                quotaBlocked: true,
                quota: liveResult.quota,
                rawResponse: liveResult.lastErrorResponse,
                normalizedData: null,
                successfulUrl: null,
                match: null,
                isHistorical: false
            };
        }

        if (liveResult.bestCandidate) {
            return {
                quotaBlocked: false,
                quota: null,
                rawResponse: liveResult.bestCandidate.rawResponse,
                normalizedData: liveResult.bestCandidate.normalizedData,
                successfulUrl: liveResult.bestCandidate.successfulUrl,
                match: liveResult.bestCandidate.match,
                isHistorical: false
            };
        }

        if (liveResult.lastErrorResponse?.message === "SEALINE_HASNT_PROVIDE_INFO") {
            return {
                quotaBlocked: false,
                quota: null,
                rawResponse: liveResult.lastErrorResponse,
                normalizedData: null,
                successfulUrl: null,
                match: null,
                isHistorical: false
            };
        }

        const historyResponse = await getBestHistoricalVoyage(containerNumber || trackingNumber, {
            ...expected,
            trackingType
        });

        if (!historyResponse) {
            return {
                quotaBlocked: false,
                quota: null,
                rawResponse: liveResult.lastErrorResponse,
                normalizedData: null,
                successfulUrl: null,
                match: null,
                isHistorical: false
            };
        }

        const normalizedData = normalizeSeaRatesData(historyResponse);
        const match = historyResponse.match_details || scoreVoyageCandidate(normalizedData, {
            ...expected,
            trackingType
        });

        return {
            quotaBlocked: false,
            quota: null,
            rawResponse: historyResponse,
            normalizedData,
            successfulUrl: `https://tracking.searates.com/history?number=${containerNumber || trackingNumber}&matched=true`,
            match,
            isHistorical: true
        };
    }

    return {
        normalizeTrackingNumber,
        normalizeLooseText,
        looseTextMatch,
        isDeliveredStatus,
        diffDays,
        signedDayDiff,
        scoreVoyageCandidate,
        pickBestVoyageCandidate,
        getRefreshWindowHours,
        shouldRefreshShipmentData,
        getFreshTrackingCacheEntry,
        upsertTrackingCacheEntry,
        normalizeSeaRatesData,
        getBestHistoricalVoyage,
        fetchBestSeaRatesMatch,
        callSeaRatesAPI,
    };
}

module.exports = {
    createSeaRatesTrackingEngine,
};
