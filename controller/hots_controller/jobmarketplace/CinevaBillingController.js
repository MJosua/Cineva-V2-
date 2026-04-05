const { dbHots } = require('../../../config/db');

function toInt(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseLimit(req, fallback = 50, max = 200) {
  const n = toInt(req.query.limit, fallback);
  return Math.max(1, Math.min(max, n || fallback));
}

function parseOffset(req, fallback = 0) {
  const n = toInt(req.query.offset, fallback);
  return Math.max(0, n || fallback);
}

function actorId(req) {
  return req?.dataToken?.user_id || 1;
}

function errorResponse(res, error, label) {
  console.error(`[CinevaBillingController] ${label}:`, error);
  return res.status(500).json({ ok: false, error: error.message });
}

module.exports = {
  /**
   * List all billings with filters
   */
  async listBillings(req, res) {
    try {
      const limit = parseLimit(req, 50);
      const offset = parseOffset(req, 0);
      const status = req.query.status;
      const companyId = req.query.company_id || req.dataToken?.company_id;

      const where = [];
      const params = [];

      if (status && status !== 'all') {
        where.push('b.billing_status = ?');
        params.push(status);
      }
      if (companyId) {
        where.push('b.company_id = ?');
        params.push(companyId);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const [rows] = await dbHots.promise().query(
        `SELECT b.*, j.title as job_title, j.job_code
         FROM t_billing b
         LEFT JOIN t_job_list j ON j.job_id = b.job_id
         ${whereClause}
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return res.status(200).json({ ok: true, billings: rows });
    } catch (error) {
      return errorResponse(res, error, 'listBillings');
    }
  },

  /**
   * Get total stats/report for billing
   */
  async getReport(req, res) {
    try {
      const companyId = req.query.company_id || req.dataToken?.company_id;
      const where = companyId ? 'WHERE company_id = ?' : '';
      const params = companyId ? [companyId] : [];

      const [totals] = await dbHots.promise().query(
        `SELECT 
          COUNT(*) as invoices,
          SUM(total_amount) as revenue,
          SUM(platform_fee_amount) as platform_fees,
          SUM(talent_share_amount) as talent_payments,
          SUM(talent_count) as talents
         FROM t_billing
         ${where}`,
        params
      );

      const [byTier] = await dbHots.promise().query(
        `SELECT 
          tier, billing_status,
          COUNT(*) as total_invoices,
          SUM(total_amount) as total_revenue,
          SUM(platform_fee_amount) as total_platform_fees,
          SUM(talent_share_amount) as total_talent_payments
         FROM t_billing
         ${where}
         GROUP BY tier, billing_status`,
        params
      );

      return res.status(200).json({
        ok: true,
        report: {
          totals: totals[0] || { invoices: 0, revenue: 0, platform_fees: 0, talent_payments: 0, talents: 0 },
          by_tier_and_status: byTier
        }
      });
    } catch (error) {
      return errorResponse(res, error, 'getReport');
    }
  },

  /**
   * Record a payment for an invoice
   */
  async recordPayment(req, res) {
    try {
      const billingId = toInt(req.params.id);
      const { payment_method, payment_reference, payment_notes } = req.body;

      if (!billingId) return res.status(400).json({ ok: false, error: 'Invalid billing_id' });

      const [result] = await dbHots.promise().query(
        `UPDATE t_billing SET 
          billing_status = 'paid',
          payment_method = ?,
          payment_reference = ?,
          payment_notes = ?,
          payment_date = NOW(),
          updated_at = NOW()
         WHERE billing_id = ?`,
        [payment_method, payment_reference, payment_notes, billingId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ ok: false, error: 'Billing record not found' });
      }

      return res.status(200).json({ ok: true, message: 'Payment recorded' });
    } catch (error) {
      return errorResponse(res, error, 'recordPayment');
    }
  },

  /**
   * Export billing data (as JSON for now, as seen in reference)
   */
  async exportBillings(req, res) {
    try {
      const companyId = req.query.company_id || req.dataToken?.company_id;
      const where = companyId ? 'WHERE b.company_id = ?' : '';
      const params = companyId ? [companyId] : [];

      const [rows] = await dbHots.promise().query(
        `SELECT b.*, j.title as job_title
         FROM t_billing b
         LEFT JOIN t_job_list j ON j.job_id = b.job_id
         ${where}
         ORDER BY b.created_at DESC`,
        params
      );

      return res.status(200).json({ ok: true, data: rows });
    } catch (error) {
      return errorResponse(res, error, 'exportBillings');
    }
  }
};
