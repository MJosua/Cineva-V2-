const { dbHots } = require('../../../config/db');

function toInt(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function actorId(req) {
  return req?.dataToken?.user_id || 1;
}

function errorResponse(res, error, label) {
  console.error(`[CinevaSubscriptionController] ${label}:`, error);
  return res.status(500).json({ ok: false, error: error.message });
}

module.exports = {
  /**
   * Get current subscription for the logged-in company
   */
  async getSubscription(req, res) {
    try {
      const companyId = req.dataToken?.company_id || 1;

      const [rows] = await dbHots.promise().query(
        `SELECT s.*, p.plan_name, p.price_monthly, p.features_json
         FROM t_subscription s
         LEFT JOIN m_plan p ON p.plan_code = s.plan_code
         WHERE s.company_id = ?
         LIMIT 1`,
        [companyId]
      );

      if (!rows.length) {
        // Return default "starter" if no sub found (for testing/graceful migration)
        return res.status(200).json({
          ok: true,
          subscription: {
            plan_code: 'starter',
            plan_name: 'Starter (Default)',
            status: 'trial',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        });
      }

      const sub = rows[0];
      if (sub.features_json) {
        try { sub.features = JSON.parse(sub.features_json); } catch (e) { sub.features = []; }
      }

      return res.status(200).json({ ok: true, subscription: sub });
    } catch (error) {
      return errorResponse(res, error, 'getSubscription');
    }
  },

  /**
   * Get all invoices for a company
   */
  async getInvoices(req, res) {
    try {
      const companyId = req.dataToken?.company_id || 1;

      const [rows] = await dbHots.promise().query(
        `SELECT i.* FROM t_saas_invoice i WHERE i.company_id = ? ORDER BY i.invoice_date DESC`,
        [companyId]
      );

      return res.status(200).json({ ok: true, invoices: rows });
    } catch (error) {
      return errorResponse(res, error, 'getInvoices');
    }
  },

  /**
   * Mock Upgrade Plan (Creates an invoice)
   */
  async upgradePlan(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const companyId = req.dataToken?.company_id || 1;
      const { plan_code } = req.body;

      if (!plan_code) return res.status(400).json({ ok: false, error: 'plan_code is required' });

      const [planRows] = await dbHots.promise().query(`SELECT * FROM m_plan WHERE plan_code = ? LIMIT 1`, [plan_code]);
      if (!planRows.length) return res.status(404).json({ ok: false, error: 'Plan not found' });
      const plan = planRows[0];

      await conn.beginTransaction();

      // Create SaaS Invoice
      const invoiceNum = `INV-SaaS-${Date.now()}`;
      const [invResult] = await conn.query(
        `INSERT INTO t_saas_invoice (invoice_number, company_id, plan_code, total_amount, status) VALUES (?, ?, ?, ?, 'pending')`,
        [invoiceNum, companyId, plan_code, plan.price_monthly]
      );

      // In a real scenario, Midtrans token generation would happen here
      // For now, we mock the payment token
      const mockToken = `mock-midtrans-snap-${Date.now()}`;
      await conn.query(`UPDATE t_saas_invoice SET payment_token = ? WHERE invoice_id = ?`, [mockToken, invResult.insertId]);

      await conn.commit();

      return res.status(200).json({ 
        ok: true, 
        message: 'Upgrade initiated', 
        new_plan: plan.plan_name,
        invoice_id: invResult.insertId,
        payment_token: mockToken
      });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'upgradePlan');
    } finally {
      conn.release();
    }
  },

  /**
   * Handle Invoice Payment (Mock Midtrans callback or manual pay)
   */
  async payInvoice(req, res) {
    const conn = await dbHots.promise().getConnection();
    try {
      const invoiceId = toInt(req.params.id);
      const companyId = req.dataToken?.company_id || 1;

      const [invRows] = await dbHots.promise().query(`SELECT * FROM t_saas_invoice WHERE invoice_id = ? AND company_id = ? LIMIT 1`, [invoiceId, companyId]);
      if (!invRows.length) return res.status(404).json({ ok: false, error: 'Invoice not found' });
      const invoice = invRows[0];

      if (invoice.status === 'paid') return res.status(400).json({ ok: false, error: 'Invoice already paid' });

      await conn.beginTransaction();

      // Mark Invoice as Paid
      await conn.query(`UPDATE t_saas_invoice SET status = 'paid', paid_at = NOW() WHERE invoice_id = ?`, [invoiceId]);

      // Update or Create Subscription
      const [existingSub] = await conn.query(`SELECT subscription_id FROM t_subscription WHERE company_id = ? LIMIT 1`, [companyId]);
      
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month period

      if (existingSub.length) {
        await conn.query(
          `UPDATE t_subscription SET plan_code = ?, status = 'active', current_period_start = NOW(), current_period_end = ?, last_invoice_id = ? WHERE subscription_id = ?`,
          [invoice.plan_code, periodEnd, invoiceId, existingSub[0].subscription_id]
        );
      } else {
        await conn.query(
          `INSERT INTO t_subscription (company_id, plan_code, status, current_period_start, current_period_end, last_invoice_id) VALUES (?, ?, 'active', NOW(), ?, ?)`,
          [companyId, invoice.plan_code, periodEnd, invoiceId]
        );
      }

      await conn.commit();

      return res.status(200).json({ ok: true, message: 'Payment successful, subscription updated', token: invoice.payment_token });
    } catch (error) {
      await conn.rollback();
      return errorResponse(res, error, 'payInvoice');
    } finally {
      conn.release();
    }
  }
};
