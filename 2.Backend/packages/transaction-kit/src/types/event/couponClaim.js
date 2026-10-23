/**
 * @hots/transaction-kit — Event coupon claim / redeem
 * Head: src/index.js
 * Source: Integrated-API service/couponService.js `redeemCoupon` (already correct: transaction +
 * `SELECT … FOR UPDATE` on t_coupons by public_hash, status 1 = used, expires_at, insert submission +
 * EAV details, mark redeemed). Ported as a kit type so other programs reuse the same rules, with:
 *  - lookup field as a parameter (`lookupBy`: 'public_hash' | 'coupon_code');
 *  - optional request id idempotency (network retry returns the same success);
 *  - the redemption event goes to the outbox (e-mail / winner notice after commit).
 *
 * input: { code, user: { name?, email?, phone? }, answers?, ip?, user_agent?, request_id? }
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */
const { validation, notFound, conflict, ruleViolation } = require('../../kernel/errors');
const { assertIdentifier } = require('../../kernel/idempotency');

function createCouponClaimType({ repo = mysqlCouponRepo(), name = 'event.coupon_claim', lookupBy = 'public_hash', eventType = 'coupon_redeemed' } = {}) {
  if (!['public_hash', 'coupon_code'].includes(lookupBy)) throw new Error(`${name}: lookupBy must be public_hash or coupon_code`);

  return {
    name,
    check(input) {
      if (!input.code) throw validation('code is required');
    },
    idempotencyKey: (input) => (input.request_id ? `${name}:${input.request_id}` : null),
    async execute(conn, input, ctx) {
      const coupon = await repo.lockCoupon(conn, lookupBy, input.code);
      if (!coupon) throw notFound('Coupon not found', { status: 'not_found' });
      if (Number(coupon.status) === 1) throw conflict('Coupon already redeemed', { status: 'already_redeemed' });
      if (coupon.expires_at && new Date(coupon.expires_at) < ctx.now) throw ruleViolation('Coupon expired', { status: 'expired' });

      const user = input.user || {};
      const submissionId = await repo.insertSubmission(conn, coupon, user, input.ip ?? null);
      if (input.answers && Object.keys(input.answers).length) await repo.insertAnswers(conn, submissionId, coupon.form_id, input.answers);
      await repo.markRedeemed(conn, coupon.id, { by: user.name || user.email || null, at: ctx.now, ip: input.ip ?? null, ua: input.user_agent ?? null });

      return {
        result: { status: 'redeemed', coupon_id: coupon.id, submission_id: submissionId, redeemed_at: ctx.now.toISOString() },
        events: [{ event_type: eventType, ref_id: coupon.id, event_id: coupon.event_id, submission_id: submissionId, idempotency_key: `${eventType}_${coupon.id}` }],
      };
    },
  };
}

function mysqlCouponRepo({ couponTable = 't_coupons', submissionTable = 't_cstm_form_submissions', detailTable = 't_cstm_form_details' } = {}) {
  [couponTable, submissionTable, detailTable].forEach(assertIdentifier);
  return {
    async lockCoupon(conn, field, code) {
      const [rows] = await conn.query(`SELECT * FROM ${couponTable} WHERE ${field === 'coupon_code' ? 'coupon_code' : 'public_hash'} = ? FOR UPDATE`, [code]);
      return rows[0] || null;
    },
    async insertSubmission(conn, coupon, user, ip) {
      const [res] = await conn.query(
        `INSERT INTO ${submissionTable} (form_id, coupon_id, submitted_by, submitted_email, submitted_phone, submitted_ip, country) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [coupon.form_id, coupon.id, user.name || null, user.email || null, user.phone || null, ip, coupon.country],
      );
      return res.insertId;
    },
    async insertAnswers(conn, submissionId, formId, answers) {
      const rows = Object.entries(answers).map(([k, v]) => [submissionId, formId, k, String(v)]);
      await conn.query(`INSERT INTO ${detailTable} (submission_id, form_id, cstm_key, cstm_val) VALUES ?`, [rows]);
    },
    async markRedeemed(conn, couponId, { by, at, ip, ua }) {
      await conn.query(`UPDATE ${couponTable} SET status = 1, redeemed_by = ?, redeemed_at = ?, redeemed_ip = ?, redeemed_ua = ? WHERE id = ?`, [by, at, ip, ua, couponId]);
    },
  };
}

module.exports = { createCouponClaimType, mysqlCouponRepo };
