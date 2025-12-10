/**
 * Coupon Service - Business logic for coupon generation and redemption
 * 
 * This service handles:
 * - Batch coupon generation (350k+ capacity)
 * - Coupon validation and lookup
 * - Thread-safe coupon redemption with transactions
 * - Form submission storage (EAV pattern)
 */

const { dbConf, dbQuery } = require('../config/db');
const crypto = require('crypto');

/**
 * Generate a unique, URL-safe coupon code/hash
 * @param {number} length - Code length (default 8)
 * @returns {string} URL-safe base64 code
 */
function generateRandomString(length = 8) {
    const bytes = Math.ceil(length * 0.75);
    return crypto.randomBytes(bytes)
        .toString('base64url')
        .slice(0, length)
        .toUpperCase();
}

/**
 * Generate a batch of unique coupon codes with hash payloads
 * @param {Object} options - Generation options
 * @param {number} options.count - Number of coupons to generate
 * @param {string} options.batchName - Name of the batch
 * @param {number} options.eventId - Event ID to link coupons to
 * @param {number} options.formId - Form ID for redemption form
 * @param {string} options.value - Prize/value description
 * @param {string} options.expiresAt - Expiration date (ISO string)
 * @param {string} options.country - Country for this batch
 * @param {string} options.createdBy - Admin user creating the batch
 * @returns {Promise<{batchId: number, totalCreated: number}>}
 */
async function generateBatch(options) {
    const {
        count = 100,
        batchName,
        eventId,
        formId,
        value,
        expiresAt,
        country,
        createdBy = 'admin'
    } = options;

    console.log(`[CouponService] Generating batch: ${batchName}, count: ${count}`);

    // 1. Create batch record
    const batchResult = await dbQuery(
        `INSERT INTO t_coupon_batches 
         (event_id, form_id, batch_name, country, total, value, expires_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, formId, batchName, country, count, value, expiresAt, createdBy]
    );

    const batchId = batchResult.insertId;

    // 2. Generate codes in chunks to handle large volumes (350k+)
    // We generate: 
    // - coupon_code (Real Key): 8-char random string (or can be sequential if desired)
    // - public_hash (Payload): 16-char random hash for URL

    const CHUNK_SIZE = 2000;
    let totalInserted = 0;

    // Use Sets to ensure uniqueness within the batch generation process
    const usedCodes = new Set();
    const usedHashes = new Set();

    for (let i = 0; i < count; i += CHUNK_SIZE) {
        const chunkSize = Math.min(CHUNK_SIZE, count - i);
        const chunkData = [];

        // Generate unique pairs for this chunk
        while (chunkData.length < chunkSize) {
            const realKey = generateRandomString(8); // Readable Key
            const hashPayload = generateRandomString(16); // URL Payload (longer)

            if (!usedCodes.has(realKey) && !usedHashes.has(hashPayload)) {
                usedCodes.add(realKey);
                usedHashes.add(hashPayload);
                chunkData.push([realKey, hashPayload]);
            }
        }

        // Build bulk insert query
        // Columns: coupon_code, public_hash, batch_id, event_id, form_id, country, value, expires_at
        const placeholders = chunkData.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values = chunkData.flatMap(([realKey, hashPayload]) => [
            realKey, hashPayload, batchId, eventId, formId, country, value, expiresAt
        ]);

        await dbQuery(
            `INSERT INTO t_coupons 
             (coupon_code, public_hash, batch_id, event_id, form_id, country, value, expires_at)
             VALUES ${placeholders}`,
            values
        );

        totalInserted += chunkData.length;
        console.log(`[CouponService] Inserted ${totalInserted}/${count} coupons`);
    }

    // 3. Update batch total
    await dbQuery(
        `UPDATE t_coupon_batches SET total = ? WHERE batch_id = ?`,
        [totalInserted, batchId]
    );

    return { batchId, totalCreated: totalInserted };
}

/**
 * Find a coupon by its public hash payload
 * @param {string} hash - Public hash from URL
 * @returns {Promise<Object|null>} Coupon data with form schema
 */
async function findCouponByHash(hash) {
    const results = await dbQuery(
        `SELECT c.*, f.json_schema, f.form_name
         FROM t_coupons c
         LEFT JOIN t_cstm_form_schema f ON c.form_id = f.form_id
         WHERE c.public_hash = ?`,
        [hash]
    );

    if (results.length === 0) {
        return null;
    }

    const coupon = results[0];

    // Parse JSON schema if present
    if (coupon.json_schema) {
        try {
            coupon.parsed_schema = JSON.parse(coupon.json_schema);
        } catch (e) {
            console.error('[CouponService] Failed to parse form schema:', e);
            coupon.parsed_schema = null;
        }
    }

    return coupon;
}

/**
 * Get coupon status
 * @param {Object} coupon - Coupon object
 * @returns {string} Status: valid, used, expired, not_found
 */
function getCouponStatus(coupon) {
    if (!coupon) return 'not_found';
    if (coupon.status === 1) return 'used';
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 'expired';
    return 'valid';
}

/**
 * Redeem a coupon using its public hash (transaction-safe)
 * @param {string} hash - Coupon public hash
 * @param {Object} userInfo - User information
 * @param {Object} answers - Form answers
 * @param {string} ip - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<{status: string, redeemedAt: string|null}>}
 */
async function redeemCoupon(hash, userInfo, answers, ip, userAgent) {
    const connection = await dbConf.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. Lock the coupon row for update (prevents race conditions)
        // Lookup by public_hash
        const [coupons] = await connection.query(
            `SELECT * FROM t_coupons WHERE public_hash = ? FOR UPDATE`,
            [hash]
        );

        if (coupons.length === 0) {
            await connection.rollback();
            return { status: 'not_found', redeemedAt: null };
        }

        const coupon = coupons[0];

        // 2. Check if already redeemed
        if (coupon.status === 1) {
            await connection.rollback();
            return { status: 'already_redeemed', redeemedAt: null };
        }

        // 3. Check if expired
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            await connection.rollback();
            return { status: 'expired', redeemedAt: null };
        }

        // 4. Insert form submission
        const [submissionResult] = await connection.query(
            `INSERT INTO t_cstm_form_submissions 
             (form_id, coupon_id, submitted_by, submitted_email, submitted_phone, submitted_ip, country)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                coupon.form_id,
                coupon.id,
                userInfo.name || null,
                userInfo.email || null,
                userInfo.phone || null,
                ip,
                coupon.country
            ]
        );

        const submissionId = submissionResult.insertId;

        // 5. Insert form details (EAV pattern)
        if (answers && Object.keys(answers).length > 0) {
            const detailValues = Object.entries(answers).flatMap(([key, value]) => [
                submissionId, coupon.form_id, key, String(value)
            ]);
            const detailPlaceholders = Object.keys(answers)
                .map(() => '(?, ?, ?, ?)')
                .join(', ');

            await connection.query(
                `INSERT INTO t_cstm_form_details (submission_id, form_id, cstm_key, cstm_val)
                 VALUES ${detailPlaceholders}`,
                detailValues
            );
        }

        // 6. Mark coupon as redeemed
        const redeemedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.query(
            `UPDATE t_coupons 
             SET status = 1, redeemed_by = ?, redeemed_at = ?, redeemed_ip = ?, redeemed_ua = ?
             WHERE id = ?`,
            [userInfo.name || userInfo.email, redeemedAt, ip, userAgent, coupon.id]
        );

        await connection.commit();

        console.log(`[CouponService] Coupon ${coupon.coupon_code} (Hash: ${hash}) redeemed successfully`);
        return { status: 'redeemed', redeemedAt };

    } catch (error) {
        await connection.rollback();
        console.error('[CouponService] Redeem error:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * List coupons by batch
 * @param {number} batchId - Batch ID
 * @param {Object} filters - Filters (status, limit, offset)
 * @returns {Promise<Object>} {coupons: [], total: number}
 */
async function listCouponsByBatch(batchId, filters = {}) {
    const { status, limit = 100, offset = 0 } = filters;

    let whereClause = 'WHERE batch_id = ?';
    const params = [batchId];

    if (status !== undefined) {
        whereClause += ' AND status = ?';
        params.push(status);
    }

    const countResult = await dbQuery(
        `SELECT COUNT(*) as total FROM t_coupons ${whereClause}`,
        params
    );

    const coupons = await dbQuery(
        `SELECT * FROM t_coupons ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        coupons,
        total: countResult[0].total
    };
}

/**
 * List batches by event
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} Batch list with stats
 */
async function listBatchesByEvent(eventId) {
    return await dbQuery(
        `SELECT b.*, 
                (SELECT COUNT(*) FROM t_coupons WHERE batch_id = b.batch_id AND status = 0) as unused_count,
                (SELECT COUNT(*) FROM t_coupons WHERE batch_id = b.batch_id AND status = 1) as used_count
         FROM t_coupon_batches b
         WHERE b.event_id = ?
         ORDER BY b.created_at DESC`,
        [eventId]
    );
}

/**
 * Get submissions for reporting
 * @param {number} eventId - Event ID
 * @param {Object} filters - Filters
 * @returns {Promise<Array>} Submissions with details
 */
async function getSubmissionsForExport(eventId, filters = {}) {
    const { batchId, limit = 10000 } = filters;

    let query = `
        SELECT 
            s.submission_id,
            c.coupon_code,
            s.submitted_by as name,
            s.submitted_email as email,
            s.submitted_phone as phone,
            s.country,
            s.created_at as submitted_at,
            c.value as prize_value
        FROM t_cstm_form_submissions s
        JOIN t_coupons c ON s.coupon_id = c.id
        WHERE c.event_id = ?
    `;
    const params = [eventId];

    if (batchId) {
        query += ' AND c.batch_id = ?';
        params.push(batchId);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ?';
    params.push(limit);

    return await dbQuery(query, params);
}

/**
 * Export batch coupons for printing/distribution
 * @param {number} batchId - Batch ID
 * @returns {Promise<Array>} List of { url, coupon_code, public_hash }
 */
async function exportBatchCoupons(batchId) {
    const coupons = await dbQuery(
        `SELECT coupon_code, public_hash, value, expires_at 
         FROM t_coupons 
         WHERE batch_id = ?`,
        [batchId]
    );
    return coupons;
}

module.exports = {
    generateRandomString,
    generateBatch,
    findCouponByHash,
    getCouponStatus,
    redeemCoupon,
    listCouponsByBatch,
    listBatchesByEvent,
    getSubmissionsForExport,
    exportBatchCoupons
};
