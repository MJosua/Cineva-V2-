// Cron dependency
const cron = require('node-cron');
const { dbConf, dbQuery } = require(`../../config/db`);
// const order = require('../controller/order');
const { notifMailDeliver } = require('../mailer/eorder/eorder_mailer')

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    grey: "\x1b[90m",
};

module.exports = {

    shippingMailNotification: async () => {
        console.log(`AUTOMATION => shippingMailNotification [IS READY]`);

        // PROD: jalan tiap jam
        cron.schedule('0 * * * *', async () => {

            const date = new Date();
            const timestamp = colors.green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + colors.reset;

            try {
                const sqlCheckOrderProceed = await dbQuery(`
                   SELECT
                        el.is_notified,
                        me.email AS "to",
                        p.person_notice cc,
                        mo.order_id,
                        mos.status_order,
                        mo.po_buyer,
                        mc.company_name,
                        mc.company_id,
                        mo.created_by user_id,
                        GROUP_CONCAT(distinct d.email order by d.email separator ', ') as iod_mail
                    FROM
                        m_order mo
                    LEFT JOIN event_logger el ON
                        mo.order_id = el.order_id
                            AND el.event_type = 2
                    LEFT JOIN person p ON
                            mo.created_by = p.person_id
                    LEFT JOIN mst_employee me ON
                            mo.created_by = me.person_id
                    LEFT JOIN m_order_status mos ON
                            mo.status = mos.id
                    LEFT JOIN mst_company mc ON
                            mc.company_id = mo.company_id
                    left join map_resp_for_dist a on
                    a.distributor_id = mc.company_id
                    and NOW() between a.creation_date and coalesce(a.finish_date, '9999-12-31')
                	left join mst_team b on
                    a.team_id = b.team_id
                    and a.company_id = b.company_id
                    and b.active = 1
                	left join mst_team_member c on
                    b.team_id = c.team_id
                    and b.company_id = c.company_id
                	left join mst_employee d on
                    a.company_id = d.company_id
                    and c.employee_id = d.employee_id
                    WHERE
                            mo.status = 3
                            AND 
                            el.is_notified IS NULL 
                          and 
           					 b.team_category = 6
            					and 
            					me.email is not null
                     group by po_buyer
                `);

                if (!sqlCheckOrderProceed.length) {
                    console.log(`${timestamp} [INFO] Tidak ada order baru untuk dikirim notifikasi.`);
                    return;
                }

                console.log(`${timestamp} [INFO] ${sqlCheckOrderProceed.length} order ditemukan untuk dikirim email.`);

                // 🔁 Loop per row agar sequential dan bisa pakai await dengan aman
                for (const val of sqlCheckOrderProceed) {
                    const { order_id, to, cc, po_buyer, company_name, user_id, iod_mail } = val;

                    if (!order_id || !to) {
                        console.log(`[WARN] Skipping invalid data for order_id: ${order_id}`);
                        continue;
                    }

                    try {
                        // 1️⃣ Kirim email dulu
                        const mailResult = await notifMailDeliver(
                            order_id,
                            to,
                            cc,
                            po_buyer,
                            company_name
                        );

                        // Jika fungsi notifMailDeliver() mengembalikan boolean true = sukses
                        if (mailResult === true) {
                            console.log(`[SUCCESS] Email terkirim untuk Order ID ${order_id}`);

                            try {
                                // Send analyst email & update DB in parallel
                                await Promise.all([
                                    // Send analyst notification email
                                    (async () => {
                                        try {
                                            await notifMailDeliver(
                                                order_id,
                                                iod_mail,
                                                cc,
                                                po_buyer,
                                                company_name
                                            );
                                            console.log(`[INFO] Analyst email sent for order ${order_id}`);
                                        } catch (err) {
                                            console.warn(`[WARN] Analyst email failed for order ${order_id}: ${err.message}`);
                                        }
                                    })(),

                                    // Handle event_logger logic
                                    (async () => {
                                        try {
                                            const sqlCheck = await dbQuery(`
                                      SELECT order_id FROM event_logger WHERE order_id = ${order_id};
                                    `);

                                            if (sqlCheck.length > 0) {
                                                await dbQuery(`
                                        UPDATE event_logger
                                        SET login_trial_time = NOW(), is_notified = 1
                                        WHERE order_id = ${order_id};
                                      `);
                                                console.log(`[UPDATED] event_logger updated for order ${order_id}`);
                                            } else {
                                                await dbQuery(`
                                        INSERT INTO event_logger (login_trial_time, user_id, event_type, is_notified, order_id)
                                        VALUES (NOW(), ${user_id}, 2, 1, ${order_id});
                                      `);
                                                console.log(`[INSERTED] event_logger created for order ${order_id}`);
                                            }
                                        } catch (dbErr) {
                                            console.error(`[ERROR] Failed updating event_logger for order ${order_id}: ${dbErr.message}`);
                                        }
                                    })()
                                ]);

                            } catch (err) {
                                console.error(`[ERROR] Gagal memproses order ${order_id}:`, err);
                            }

                        } else {
                            console.log(`[FAILED] Email gagal dikirim untuk order ${order_id}`);
                        }


                    } catch (innerError) {
                        console.error(`[ERROR] Gagal memproses order ${order_id}:`, innerError);
                    }
                }

                console.log(timestamp + ` [RUNNING] AUTOMATION => shippingMailNotification sukses dijalankan.`);

            } catch (error) {
                console.error('Error at shippingMailNotification:', error);
            }
        });
    },


    shippingMailNotificationManual: async (orderIds = [250028500011]) => {
        console.log(`⚙️  MANUAL TEST => shippingMailNotificationManual [IS READY]`);

        const date = new Date();
        const timestamp =
            colors.green +
            date.toLocaleDateString("id") +
            " " +
            date.toLocaleTimeString("id") +
            colors.reset;

        try {
            if (!Array.isArray(orderIds) || orderIds.length === 0) {
                console.warn(`[WARN] No order IDs provided for manual test.`);
                return;
            }

            console.log(`[INFO] Running manual notification for orders: ${orderIds.join(", ")}`);

            const sqlCheckOrderProceed = await dbQuery(`
            SELECT
                el.is_notified,
                me.email AS "to",
                p.person_notice cc,
                mo.order_id,
                mos.status_order,
                mo.po_buyer,
                mc.company_name,
                mc.company_id,
                mo.created_by user_id,
                GROUP_CONCAT(DISTINCT d.email ORDER BY d.email SEPARATOR ', ') AS iod_mail
            FROM
                m_order mo
            LEFT JOIN event_logger el ON
                mo.order_id = el.order_id
                    AND el.event_type = 2
            LEFT JOIN person p ON
                mo.created_by = p.person_id
            LEFT JOIN mst_employee me ON
                mo.created_by = me.person_id
            LEFT JOIN m_order_status mos ON
                mo.status = mos.id
            LEFT JOIN mst_company mc ON
                mc.company_id = mo.company_id
            LEFT JOIN map_resp_for_dist a ON
                a.distributor_id = mc.company_id
                AND NOW() BETWEEN a.creation_date AND COALESCE(a.finish_date, '9999-12-31')
            LEFT JOIN mst_team b ON
                a.team_id = b.team_id
                AND a.company_id = b.company_id
                AND b.active = 1
            LEFT JOIN mst_team_member c ON
                b.team_id = c.team_id
                AND b.company_id = c.company_id
            LEFT JOIN mst_employee d ON
                a.company_id = d.company_id
                AND c.employee_id = d.employee_id
            WHERE
                mo.order_id IN (${orderIds.join(",")})
                AND me.email IS NOT NULL
                AND b.team_category = 6
            GROUP BY mo.order_id;
          `);

            if (!sqlCheckOrderProceed.length) {
                console.log(`${timestamp} [INFO] Tidak ada order ditemukan untuk dikirim notifikasi.`);
                return;
            }

            console.log(`${timestamp} [INFO] ${sqlCheckOrderProceed.length} order ditemukan untuk dikirim email.`);

            // 🔁 Process each order
            for (const val of sqlCheckOrderProceed) {
                const { order_id, to, cc, po_buyer, company_name, user_id, iod_mail } = val;

                if (!order_id || !to || !po_buyer || !company_name) {
                    console.warn(`[WARN] Skipping invalid data for order_id: ${order_id}`);
                    continue;
                }

                try {
                    // 1️⃣ Send main email first
                    const mailResult = await notifMailDeliver(
                        order_id,
                        to,
                        cc,
                        po_buyer,
                        company_name
                    );

                    if (mailResult === true) {
                        console.log(`[SUCCESS] Email terkirim untuk Order ID ${order_id}`);

                        // 2️⃣ Send analyst email & update DB in parallel
                        await Promise.all([
                            // Analyst email
                            (async () => {
                                try {
                                    await notifMailDeliver(
                                        order_id,
                                        iod_mail,
                                        cc,
                                        po_buyer,
                                        company_name
                                    );
                                    console.log(`[INFO] Analyst email sent for order ${order_id}`);
                                    console.log(`[INFO] Analyst email List : ${iod_mail}`);

                                } catch (err) {
                                    console.warn(`[WARN] Analyst email failed for order ${order_id}: ${err.message}`);
                                }
                            })(),

                            // Event logger update
                            (async () => {
                                try {
                                    const sqlCheck = await dbQuery(`
                        SELECT order_id FROM event_logger WHERE order_id = ${order_id};
                      `);

                                    if (sqlCheck.length > 0) {
                                        await dbQuery(`
                          UPDATE event_logger
                          SET login_trial_time = NOW(), is_notified = 1
                          WHERE order_id = ${order_id};
                        `);
                                        console.log(`[UPDATED] event_logger updated for order ${order_id}`);
                                    } else {
                                        await dbQuery(`
                          INSERT INTO event_logger (login_trial_time, user_id, event_type, is_notified, order_id)
                          VALUES (NOW(), ${user_id}, 2, 1, ${order_id});
                        `);
                                        console.log(`[INSERTED] event_logger created for order ${order_id}`);
                                    }
                                } catch (dbErr) {
                                    console.error(`[ERROR] Failed updating event_logger for order ${order_id}: ${dbErr.message}`);
                                }
                            })()
                        ]);
                    } else {
                        console.log(`[FAILED] Email gagal dikirim untuk order ${order_id}`);
                    }
                } catch (innerError) {
                    console.error(`[ERROR] Gagal memproses order ${order_id}:`, innerError);
                }
            }

            console.log(`${timestamp} ✅ MANUAL => shippingMailNotificationManual selesai dijalankan.`);

        } catch (error) {
            console.error("❌ Error at shippingMailNotificationManual:", error);
        }
    },



}