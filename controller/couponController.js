/**
 * Coupon Controller - API endpoints for coupon system
 */

const couponService = require('../service/couponService');

module.exports = {
    /**
     * GET /api/event/coupon/:hash
     * Public endpoint - Validate coupon hash and return decoded info + form
     */
    checkCoupon: async (req, res) => {
        try {
            const { hash } = req.params; // "code" param in router is actually the hash

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    status: 'invalid',
                    message: 'Coupon hash is required'
                });
            }

            const coupon = await couponService.findCouponByHash(hash);
            const status = couponService.getCouponStatus(coupon);

            if (status === 'not_found') {
                return res.status(404).json({
                    success: false,
                    status: 'not_found',
                    message: 'Coupon not found'
                });
            }

            if (status === 'used') {
                return res.status(200).json({
                    success: false,
                    status: 'used',
                    message: 'Coupon has already been redeemed'
                });
            }

            if (status === 'expired') {
                return res.status(200).json({
                    success: false,
                    status: 'expired',
                    message: 'Coupon has expired'
                });
            }

            // Valid coupon - return REAL CODE (decoded) + schema
            return res.status(200).json({
                success: true,
                status: 'valid',
                coupon: {
                    coupon_code: coupon.coupon_code, // The Real Key (e.g. Serial)
                    public_hash: coupon.public_hash, // The URL Payload
                    value: coupon.value,
                    expires_at: coupon.expires_at,
                    event_id: coupon.event_id,
                    form_id: coupon.form_id
                },
                form: coupon.parsed_schema ? {
                    form_id: coupon.form_id,
                    form_name: coupon.form_name,
                    schema: coupon.parsed_schema
                } : null
            });

        } catch (error) {
            console.error('[CouponController] checkCoupon error:', error);
            return res.status(500).json({
                success: false,
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    /**
     * POST /api/event/coupon/:hash/redeem
     * Public endpoint - Redeem coupon with form submission
     */
    redeemCoupon: async (req, res) => {
        try {
            const { hash } = req.params; // "code" param is hash
            const { user, answers } = req.body;

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    status: 'invalid',
                    message: 'Coupon hash is required'
                });
            }

            // Get client info
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            const result = await couponService.redeemCoupon(
                hash,
                user || {},
                answers || {},
                ip,
                userAgent
            );

            if (result.status === 'redeemed') {
                return res.status(200).json({
                    success: true,
                    status: 'redeemed',
                    message: 'Coupon redeemed successfully',
                    redeemed_at: result.redeemedAt
                });
            }

            // Handle non-success statuses
            const statusMessages = {
                'not_found': 'Coupon not found',
                'already_redeemed': 'Coupon has already been redeemed',
                'expired': 'Coupon has expired'
            };

            return res.status(200).json({
                success: false,
                status: result.status,
                message: statusMessages[result.status] || 'Unable to redeem coupon'
            });

        } catch (error) {
            console.error('[CouponController] redeemCoupon error:', error);
            return res.status(500).json({
                success: false,
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    /**
     * POST /api/admin/event/:event_id/coupons/generate
     * Admin endpoint - Generate coupon batch
     */
    generateBatch: async (req, res) => {
        try {
            const { event_id } = req.params;
            const { count, batch_name, value, expires_at, form_id, country } = req.body;

            if (!count || !batch_name) {
                return res.status(400).json({
                    success: false,
                    message: 'count and batch_name are required'
                });
            }

            // Limit batch size for safety (can be adjusted)
            const maxBatchSize = 500000;
            if (count > maxBatchSize) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum batch size is ${maxBatchSize}`
                });
            }

            const result = await couponService.generateBatch({
                count: parseInt(count),
                batchName: batch_name,
                eventId: parseInt(event_id),
                formId: form_id ? parseInt(form_id) : null,
                value,
                expiresAt: expires_at,
                country,
                createdBy: req.user?.username || 'admin'
            });

            return res.status(200).json({
                success: true,
                batch_id: result.batchId,
                total_created: result.totalCreated,
                message: `Generated ${result.totalCreated} coupons`
            });

        } catch (error) {
            console.error('[CouponController] generateBatch error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate coupons'
            });
        }
    },

    /**
     * GET /api/admin/event/:event_id/coupons
     * Admin endpoint - List batches and coupons
     */
    listCoupons: async (req, res) => {
        try {
            const { event_id } = req.params;
            const { batch_id, status, limit, offset } = req.query;

            if (batch_id) {
                // List coupons in specific batch
                const result = await couponService.listCouponsByBatch(
                    parseInt(batch_id),
                    {
                        status: status !== undefined ? parseInt(status) : undefined,
                        limit: parseInt(limit) || 100,
                        offset: parseInt(offset) || 0
                    }
                );
                return res.status(200).json({
                    success: true,
                    ...result
                });
            }

            // List batches for event
            const batches = await couponService.listBatchesByEvent(parseInt(event_id));
            return res.status(200).json({
                success: true,
                batches
            });

        } catch (error) {
            console.error('[CouponController] listCoupons error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch coupons'
            });
        }
    },

    /**
     * GET /api/admin/event/:event_id/coupons/export_batch
     * Admin endpoint - Export coupons in batch as CSV
     */
    exportBatch: async (req, res) => {
        try {
            const { event_id } = req.params;
            const { batch_id, domain } = req.query; // domain for URL construction

            if (!batch_id) {
                return res.status(400).json({
                    success: false,
                    message: 'batch_id is required'
                });
            }

            const coupons = await couponService.exportBatchCoupons(parseInt(batch_id));

            // Construct base URL from env or query
            const baseUrl = domain || process.env.FRONTEND_URL || 'https://event.indofood.com';

            // Generate CSV
            const headers = ['URL', 'Real Code', 'Public Hash', 'Value', 'Expires At'];
            const csvRows = [headers.join(',')];

            coupons.forEach(c => {
                const url = `${baseUrl}/event/coupon/${c.public_hash}`;
                const row = [
                    url,
                    c.coupon_code,
                    c.public_hash,
                    c.value || '',
                    c.expires_at ? new Date(c.expires_at).toISOString().split('T')[0] : ''
                ];
                csvRows.push(row.map(field => `"${field}"`).join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=coupons_batch_${batch_id}.csv`);
            return res.send(csvRows.join('\n'));

        } catch (error) {
            console.error('[CouponController] exportBatch error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to export batch'
            });
        }
    },

    /**
     * GET /api/admin/event/:event_id/submissions/export
     * Admin endpoint - Export submissions as JSON (can be converted to CSV)
     */
    exportSubmissions: async (req, res) => {
        try {
            const { event_id } = req.params;
            const { batch_id, format } = req.query;

            const submissions = await couponService.getSubmissionsForExport(
                parseInt(event_id),
                { batchId: batch_id ? parseInt(batch_id) : null }
            );

            if (format === 'csv') {
                // Simple CSV export
                const headers = ['submission_id', 'coupon_code', 'name', 'email', 'phone', 'country', 'submitted_at', 'prize_value'];
                const csvRows = [headers.join(',')];

                submissions.forEach(row => {
                    csvRows.push(headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
                });

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=submissions_event_${event_id}.csv`);
                return res.send(csvRows.join('\n'));
            }

            return res.status(200).json({
                success: true,
                total: submissions.length,
                submissions
            });

        } catch (error) {
            console.error('[CouponController] exportSubmissions error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to export submissions'
            });
        }
    }
};
