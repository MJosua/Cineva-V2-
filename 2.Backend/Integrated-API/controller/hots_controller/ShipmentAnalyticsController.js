const { dbQuery } = require("../../config/db");
const { createShipmentAnalyticsService } = require("../../service/searates/tracking_analytics");

const shipmentAnalyticsService = createShipmentAnalyticsService({
    dbQuery,
    logger: console,
});

function buildErrorResponse(res, err, message) {
    console.error(message, err);
    return res.status(500).json({
        success: false,
        message,
        error: err.message,
    });
}

module.exports = {
    getReliability: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getReliability({
                days: req.query.days,
                limit: req.query.limit,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
            });
            return res.json({ success: true, ...data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading shipment reliability analytics");
        }
    },

    getTransitTimes: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getTransitTimes({
                days: req.query.days,
                limit: req.query.limit,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
            });
            return res.json({ success: true, ...data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading shipment transit time analytics");
        }
    },

    getQuota: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getQuota({
                days: req.query.days,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
            });
            return res.json({ success: true, ...data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading SeaRates quota analytics");
        }
    },

    getRisks: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getRisks({
                days: req.query.days,
                limit: req.query.limit,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
            });
            return res.json({ success: true, ...data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading shipment risk analytics");
        }
    },

    getDataList: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getDataList({
                page: req.query.page,
                limit: req.query.limit,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
                factory: req.query.factory,
                search: req.query.search,
                sortBy: req.query.sortBy,
                sortDir: req.query.sortDir
            });
            return res.json({ success: true, ...data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading shipment data list");
        }
    },

    getFreightReport: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getFreightReport({
                page: req.query.page,
                limit: req.query.limit,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
                factory: req.query.factory,
                search: req.query.search,
                dateType: req.query.dateType
            });
            return res.json({ success: true, ...data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading freight location report");
        }
    },

    getFactories: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getFactories();
            return res.json({ success: true, results: data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading factories list");
        }
    },

    getUsageDetails: async (req, res) => {
        try {
            const data = await shipmentAnalyticsService.getUsageDetails({
                type: req.query.type,
                date: req.query.date,
                month: req.query.month,
                search: req.query.search,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
            });
            return res.json({ success: true, results: data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading usage details");
        }
    },

    getReportNotes: async (req, res) => {
        try {
            const { reportKey } = req.query;
            const data = await shipmentAnalyticsService.getReportNotes(reportKey || 'searates_analytics_main');
            return res.json({ success: true, results: data });
        } catch (err) {
            return buildErrorResponse(res, err, "Error loading report notes");
        }
    },

    saveReportNote: async (req, res) => {
        try {
            const { reportKey, content } = req.body;
            const userId = req.dataToken?.user_id || req.user?.id || req.user?.user_id || 1;
            const noteId = await shipmentAnalyticsService.saveReportNote({
                reportKey: reportKey || 'searates_analytics_main',
                content,
                userId
            });
            return res.json({ success: true, noteId });
        } catch (err) {
            return buildErrorResponse(res, err, "Error saving report note");
        }
    },
};
