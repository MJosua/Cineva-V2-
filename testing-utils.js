const readline = require('readline');
const { dbConf, dbQuery, dbTMQuery, dbHots } = require('./config/db');
const express = require('express');
const { API_URL, PORT } = require('./index');
const { shippingMailNotificationManual } = require('./automation/notification');
const { stuffingWeek } = require('./controller/order');
const { orderController, hotsSettingsController, hotsDashboardController, hotsAuth } = require('./controller');
const { hotsSubmitMailer, hotsApproveRequest } = require('./mailer/hots/hots_mailer');
const App = express();
App.listen(App.get('port'), () => {
    console.log(`🚀 Server running at http://${API_URL}:${PORT}`);
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.setPrompt('> ');
rl.prompt();

const req = {
    dataToken: { company_id: 999 }, // fake token for testing
    query: {},
    body: {},
    user: {
        id: 1,
        username: "yosuaXG",
        role_name: "admin",
        department_name: "IT",      // 👈 optional: adjust to 'HR', 'Finance', etc.
        email: "yosua.prima@gmail.com",
    },
};


const res = {
    status(code) {
        this.statusCode = code;
        return this; // allow chaining like res.status(200).send()
    },
    send(data) {
        console.log(`Response ${this.statusCode || 200}:`, data);
    },
    json(data) {
        console.log(`Response ${this.statusCode || 200}:`, JSON.stringify(data, null, 2));
    },
};



rl.on('line', async (input) => {
    const cmd = input.trim();

    console.clear();
    if (cmd === '/mail') {
        console.log('📧 Sending mail...');
        await hotsSubmitMailer(true, 2025012310098300, 'yosuaXG', 'service_name', 'josua.prima@gmail.com');
    }
    else if (cmd === '/port') {
        console.log('✅ Server is running on port', App.get('port'));
    }
    else if (cmd === '/mail1') {
        console.log('📧 Sending approval mail...');
        await hotsApproveRequest(true, 2025012310098300,);
    }
    else if (cmd === '/exit') {
        console.log('👋 Exiting...');
        process.exit(0);
    }
    else if (cmd === '/cekso') {

        let result = await dbQuery(`CALL insert_so()`);

        // result[0] = rows (if your SP does SELECT)
        // result[1] = metadata (OkPacket)
        let affected = result?.[0]?.affectedRows || result?.[1]?.affectedRows || 0;

        console.log(
            `call insert_so [WAS DONE]: affectedRows=${affected}`
        );
    }

    else if (cmd.startsWith("/ceksosingle")) {

        const order_id = Number(cmd.split(" ")[1]);

        console.log("------ /ceksosingle Debug (Node SQL) ------");
        if (!order_id) {
            console.log("⚠️ Usage: /ceksosingle <ORDER_ID>");
            return;
        }

        try {
            console.log("\nSTEP 1: Fetching HEAD data...");
            const headQuery = `
                
            
SELECT DISTINCT 
                    100 AS company_id,
                    0 AS ver,
                    a.company_id AS client_id,
                    NULL AS so_number,
                    NOW() AS so_date,
                    CASE WHEN LENGTH(TRIM(a.po_buyer_pcl)) > 0 THEN a.po_buyer_pcl ELSE a.po_buyer END AS po_buyer,
                    a.po_date,
                    a.ship_to,
                    a.bill_to AS bill,
                    a.notify1,
                    mc.curr_code,
                    a.notify2,
                    e.team_id AS pic,
                    NOW() AS create_date,
                    b.remarks AS so_desc,
                    CASE 
					    WHEN a.delv_week = 0 THEN (
					        SELECT week 
					        FROM dat_operational_calendar 
					        WHERE year = a.delv_year 
					        LIMIT 1
					    ) 
					    ELSE a.delv_week 
					END AS delv_week,
                    a.delv_year AS year_delv,
                    COALESCE(
                        CONCAT(b.cont_qty,' X ',c.container_name,' / ',FORMAT(c.cbm,0)),
                        '1 TRUCK'
                    ) AS completion_note,
                    NULL AS trade_promo,
                    NULL AS cont20,
                    NULL AS cont40,
                    NULL AS cont40hc,
                    0 AS flag,
                    COALESCE(p.incoterm_id,4) AS incoterm_id,
                    mt.factory_id AS factory,
                    e.rm_id,
                    a.created_by,
                    p.harbour_id AS port_shipment,
                    p.final_dest,
                    p.cifto AS cif_to,
                    CASE 
                        WHEN DATE(a.po_date) = DATE(a.stuffing_date) THEN a.stuffing_date 
                        ELSE a.stuffing_date 
                    END AS delv_date,
                    NULL AS inv_date,
                    0 AS cancel,
                    NULL AS reason_id,
                    NULL AS start_date,
                    NOW() AS finish_date,
                    NULL AS approval_id,
                    NULL AS anp_no,
                    MIN(t.top_id) AS top,
                    CASE a.tolling_id WHEN 1 THEN 1 WHEN 6 THEN 1 ELSE NULL END AS truck,
                    NULL AS oth_anp,
                    a.order_id,
                    ROW_NUMBER() OVER (PARTITION BY a.company_id, YEAR(a.po_date) ORDER BY a.order_id) AS row_num
                FROM m_order a
                INNER JOIN m_order_dtl b ON a.order_id = b.order_id AND a.company_id = b.company_id
                LEFT JOIN mst_container c ON b.cont_size = c.container_id
    
                LEFT JOIN map_resp_for_dist d 
                    ON a.company_id = d.distributor_id
                    AND NOW() BETWEEN d.creation_date AND COALESCE(d.finish_date,'9999-12-31')
    
                left join mst_company mc
                	on a.company_id = mc.company_id
                    
                LEFT JOIN mst_team e 
                    ON d.team_id = e.team_id AND e.team_category = 6
    
                LEFT JOIN mst_top t ON a.company_id = t.company_id AND t.expired_date IS NULL
    
                LEFT JOIN map_port_for_dist p 
                    ON a.company_id = p.distributor_id
                    AND p.company_id = 100
                    AND p.finish_date IS NULL
                    AND a.port_shipment = p.id
    
    
                LEFT JOIN mst_product mp ON b.sku1 = mp.product_code
                 LEFT JOIN mst_tolling mt ON mp.tolling_id = mt.id
    
                WHERE a.status = 0 AND a.order_id = ?
                GROUP BY a.company_id, a.order_id;
            
            `;

            const head = await dbQuery(headQuery, [order_id]);
            console.log("HEAD RESULT:", JSON.stringify(head, null, 2));

            if (!head[0]) {
                console.log("❌ No HEAD data found! Cannot proceed.");
                return;
            }

            const h = head[0];  // shortcut

            // =========================================
            // STEP 2: Construct SO ID
            // =========================================
            console.log("\nSTEP 2: Generating SO_ID...");

            const soIdQuery = `
                SELECT CAST(RIGHT(MAX(so_id), 5) AS UNSIGNED) + ? AS next_so
                FROM trs_sales_order
                WHERE client_id = ?;
            `;

            const soRow = await dbQuery(soIdQuery, [h.row_num, h.client_id]);
            const next_so = soRow[0]?.next_so || h.row_num;

            const so_id =
                String(new Date().getFullYear()).slice(2) +
                String(h.client_id).padStart(5, "0") +
                String(next_so).padStart(5, "0");

            console.log("Generated SO_ID:", so_id);

            // =========================================
            // STEP 3: Insert Header
            // =========================================
            console.log("\nSTEP 3: INSERT HEADER...");

            const insertHeader = `
                INSERT INTO trs_sales_order (
                    company_id, so_id, version, client_id, so_number, 
                    so_date,
                    po_number, po_date, ship_to_id, bill_to_party, notify_party, 
                    notify_party2,
                    pic_id, creation_date, so_desc, week_delv, year_delv, week_inv,
                    year_inv, completion_note, trade_promo,cont20, cont40, 
                    cont40hc, flag, incoterm_id, factory_id, rm_id,
                     created_by, port_shipment, final_dest, cif_to, delv_date,
                    inv_date, cancel, reason_id, start_date, finish_date,
                     approval_id, anp_no, top_id, truck, oth_anp,
                    e_order, curr_code
                ) VALUES (
                 ?,?,?,?,?,
                 ?,?,?,?,?,
                 ?,?,?,?,?,
                 
                 ?,?,?,?,?,
                 ?,?,?,?,?,
                 ?,?,?,?,?,
                 
                 ?,?,?,?,?,
                 ?,?,?,?,?,
                 
                 ?,?,?,?,?)
            `;

            const headerParams = [
                h.company_id, so_id, h.ver, h.client_id, h.so_number, h.so_date,
                h.po_buyer, h.po_date, h.ship_to, h.bill, h.notify1, h.notify2,
                h.pic, h.create_date, h.so_desc, h.delv_week, h.year_delv,
                null, null, h.completion_note, h.trade_promo,
                h.cont20, h.cont40, h.cont40hc, h.flag, h.incoterm_id, h.factory,
                h.rm_id, h.created_by, h.port_shipment, h.final_dest, h.cif_to,
                h.delv_date, h.inv_date, h.cancel, h.reason_id, h.start_date,
                h.finish_date, h.approval_id, h.anp_no, h.top, h.truck, h.oth_anp,
                h.order_id, h.curr_code
            ];

            const insertHeaderResult = await dbQuery(insertHeader, headerParams);
            console.log("HEADER INSERT RESULT:", insertHeaderResult);

            // =========================================
            // STEP 4: Get newly inserted SO
            // =========================================
            console.log("\nSTEP 4: Checking inserted SO...");
            const soCheck = await dbQuery(
                `SELECT * FROM trs_sales_order WHERE so_id = ?`,
                [so_id]
            );
            console.log(soCheck);

            // =========================================
            // STEP 5: Details
            // =========================================
            console.log("\nSTEP 5: Fetching DETAIL rows...");

            const detailQuery = `
                SELECT a.company_id, ?,  0 AS ver, b.detail_id, a.company_id, b.sku1 AS sku, b.qty1 AS qty
                FROM m_order a
                JOIN m_order_dtl b ON a.order_id = b.order_id AND a.company_id = b.company_id
                WHERE a.order_id = ?;
            `;

            const details = await dbQuery(detailQuery, [so_id, order_id]);
            console.log("DETAIL ROWS:", JSON.stringify(details, null, 2));

            // =========================================
            // STEP 6: Insert details
            // =========================================
            console.log("STEP 6: INSERT DETAILS...");

            for (const d of details) {
                const q = `
                    INSERT INTO trs_so_detail 
                    (company_id, so_id, version, detail_nr, client_id, sku_id, quantity, value, disc, delivery_date, delivery_period, so_detail_desc, freight_surcharge, rate_unit, dist_channel)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,2)
                `;

                const p = [
                    d.company_id, so_id, d.ver, d.detail_id, d.company_id, d.sku,
                    d.qty, 0, 0, h.delv_date, null, null, null, null
                ];

                console.log("INSERT DETAIL:", p);
                await dbQuery(q, p);
            }

            // =========================================
            // DONE
            // =========================================
            console.log("\n🎉 ALL DONE. No MySQL errors.");

        } catch (err) {
            console.log("\n❌ CAUGHT ERROR DURING EXECUTION:");
            console.log("Message:", err.message);
            console.log("Code:", err.code);
            console.log("SQL:", err.sql);
        }
    }


    else if (cmd.startsWith("/ceksodebug")) {

        const order_id_raw = cmd.split(" ")[1];
        const order_id = Number(order_id_raw);
    
        console.log("------ /ceksodebug ------");
        console.log("Input Order ID:", order_id);
        console.log("------------------------------------");
    
        if (!order_id) {
            console.log("⚠️ Usage: /ceksodebug <ORDER_ID>");
            return;
        }
    
        try {
            const query = `CALL insert_so_single(?)`;
    
            console.log("Executing:", query, "Param:", order_id);
    
            const result = await dbQuery(query, [order_id]);
    
            console.log("========== RAW RESULT =============");
            console.dir(result, { depth: 10 });
            console.log("===================================");
    
            // Extract SO ID
            const so_id = result?.[0]?.[0]?.so_id ?? null;
    
            if (!so_id) {
                console.log("❌ No SO ID returned from procedure.");
                return;
            }
    
            console.log("===================================");
            console.log("🎉 SUCCESS — SO CREATED!");
            console.log("📦 New SO_ID:", so_id);
            console.log("===================================");
    
        } catch (err) {
            console.error("❌ MySQL Error:", err);
            console.log("❌ Error processing SO.");
        }
    }
    



    else if (cmd === 'cekmail') {

        shippingMailNotificationManual()

    }

    else if (cmd === 'cekweekada') {

        await orderController.stuffingWeek(req, res, true);
    }

    else if (cmd === 'cekweek') {

        await hotsSettingsController.todaysweek(req, res);

    }


    else if (cmd === 'ceklmailapprovehots') {

        await hotsApproveRequest(false, 2025012310098379);

    }

    else if (cmd === 'ceklmailprivatehots') {

        await hotsSubmitMailer(false, 2025012310098379, "yosua", "service.service_name", "josua.prima@gmail.com");

    }

    else if (cmd === "dashboardtest") {

        await hotsDashboardController.getDashboardFunctions(req, res);

    }


    else if (cmd.startsWith("/verifyuser")) {
        const username = cmd.split(" ")[1];
        if (!username) {
            console.log("⚠️ Usage: /verifyuser <username>");
        } else {
            console.log(`🔍 Manually verifying user '${username}'...`);
            await hotsAuth.manualVerifyAndPromoteUserByUID(username);
        }
    }


    else if (cmd === '/listhotsuserdraft') {
        console.log('📋 Listing all HOTS user drafts...\n');

        try {
            const [rows] = await dbHots.promise().query(`
                SELECT 
                    draft_id,
                    uid AS username,
                    CONCAT(firstname, ' ', lastname) AS fullname,
                    email,
                    department_id,
                    leader_id,
                    approval_status,
                    DATE_FORMAT(approval_date, '%Y-%m-%d %H:%i:%s') AS approval_date
                FROM user_draft
                ORDER BY draft_id DESC
            `);

            if (rows.length === 0) {
                console.log('⚠️ No user drafts found.');
            } else {
                // Format approval_status with color
                const coloredRows = rows.map(row => {
                    let statusColored;
                    switch (row.approval_status) {
                        case 'pending':
                            statusColored = '\x1b[33mPENDING\x1b[0m'; // yellow
                            break;
                        case 'verified':
                            statusColored = '\x1b[36mVERIFIED\x1b[0m'; // cyan
                            break;
                        case 'approved':
                            statusColored = '\x1b[32mAPPROVED\x1b[0m'; // green
                            break;
                        case 'rejected':
                            statusColored = '\x1b[31mREJECTED\x1b[0m'; // red
                            break;
                        default:
                            statusColored = row.approval_status;
                    }
                    return {
                        ...row,
                        approval_status: statusColored
                    };
                });

                console.table(coloredRows);
            }

        } catch (err) {
            console.error('❌ Error listing HOTS user drafts:', err.message);
        }
    }


    else {
        console.log(`Unknown command: ${cmd}`);
    }

    rl.prompt();
});
