/**
 * Delivery Notification Mailer
 * Generates HTML for delivery notification email
 */

const { dbQuery } = require('../config/db');

async function getNotifMailDeliverHtml(order_id) {
  try {
    if (!order_id) {
      return { error: "order_id is required" };
    }

    const sql = `
      SELECT
        mc.company_name,
        mo.po_buyer,
        mh.harbour_name,
        DATE_FORMAT(trd.delv_date, '%b %d, %Y') AS delv_date,
        COALESCE(mp.product_name_no, mp.product_name) AS product_name,
        trd.qty,
        mo.order_id,
        tr.ship_name AS vessel_name,
        tr.ship_line AS shipping_line,
        DATE_FORMAT(tr.etd, '%b %d, %Y') AS etd,
        DATE_FORMAT(tr.eta, '%b %d, %Y') AS eta,
        tr.cont_id,
        tr.so_id
      FROM m_order mo
      LEFT JOIN trs_sales_order tso 
        ON tso.e_order = mo.order_id
      LEFT JOIN trs_realization tr 
        ON tr.so_id = tso.so_id
      LEFT JOIN trs_realization_detail trd 
        ON tr.cont_id = trd.cont_id
       AND tr.so_id = trd.so_id
       AND tr.invoice_id = trd.invoice_id
      LEFT JOIN mst_product mp 
        ON mp.product_code = trd.sku
      LEFT JOIN mst_company mc 
        ON mc.company_id = mo.company_id
      LEFT JOIN map_port_for_dist mpfd 
        ON mo.company_id = mpfd.distributor_id
      LEFT JOIN mst_harbour mh 
        ON mpfd.harbour_id = mh.harbour_id
      WHERE mo.order_id = ?
      ORDER BY tr.cont_id, mp.product_name
    `;

    const rows = await dbQuery(sql, [order_id]);

    if (!rows.length) {
      return { error: "No delivery data found" };
    }

    const tableRows = rows.map(r => `
      <tr>
        <td style="border:1px solid black;padding:5px 10px;">${r.delv_date || '-'}</td>
        <td style="border:1px solid black;padding:5px 10px;">${r.cont_id || '-'}</td>
        <td style="border:1px solid black;padding:5px 10px;">${r.product_name || '-'}</td>
        <td style="border:1px solid black;padding:5px 10px;text-align:right;">
          ${Number(r.qty || 0).toLocaleString()}
        </td>
        <td style="border:1px solid black;padding:5px 10px;">${r.etd || '-'}</td>
        <td style="border:1px solid black;padding:5px 10px;">${r.eta || '-'}</td>
      </tr>
    `).join('');

    const header = rows[0];

    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Dear ${header.company_name || 'Customer'},</p>

        <p>
          This email is to inform you that your order
          <b>${header.po_buyer || '-'}</b> has been shipped.
        </p>

        <p>
          Shipping Line: <b>${header.shipping_line || '-'}</b><br>
          Estimated Arrival: <b>${header.eta || '-'}</b>
        </p>

        <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
          <thead>
            <tr>
              <th style="border:1px solid black;padding:5px 10px;">Stuffing Date</th>
              <th style="border:1px solid black;padding:5px 10px;">Container ID</th>
              <th style="border:1px solid black;padding:5px 10px;">Item Name</th>
              <th style="border:1px solid black;padding:5px 10px;">Qty</th>
              <th style="border:1px solid black;padding:5px 10px;">ETD</th>
              <th style="border:1px solid black;padding:5px 10px;">ETA</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <p style="margin-top: 20px;">
          Please note that this is an estimated delivery and may vary depending on conditions.
        </p>

        <p>
          <b>International Operations Division</b><br>
          PT Indofood CBP Sukses Makmur, Tbk.<br>
          Indofood Tower, 23rd Floor, Jakarta, Indonesia<br>
          <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com</a>
        </p>
      </div>
    `;

    return {
      html,
      po_buyer: header.po_buyer,
      company_name: header.company_name
    };

  } catch (err) {
    console.error("Delivery mail error:", err);
    return { error: err.message };
  }
}



module.exports = {
  getNotifMailDeliverHtml
};
