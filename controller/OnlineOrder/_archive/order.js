const { dbConf, dbQuery, addSqlLogger } = require("../../config/db");
const fs = require('fs')
const { orderRecievedMailSender } = require('../../service/mailer/eorder/eorder_mailer');
const ejs = require('ejs');

module.exports = {

    getOrderDetail: async (req, res) => {

        try {

            if (req.dataToken.user_id) {

                let query = `
                    SELECT 
                    det.order_id, det.company_id, mco.company_name, det.created_by, su.firstname,  
                    CASE
		                WHEN det.cont_size  = 8 THEN ms.detail_id
		                ELSE det.detail_id
                    END detail_id,
                    det.cont_size, mc.container_name, 
                    CASE
                        WHEN det.cont_qty = 0 THEN 1
                        ELSE det.cont_qty
                    END cont_qty, 
                    CASE
                        WHEN det.cont_size = 8 THEN ms.sku
                        ELSE det.sku1
                    END sku1,
                    CASE
                        WHEN det.cont_size = 8 THEN COALESCE(mps.product_name_no, mps.product_name)
                        ELSE COALESCE(mp1.product_name_no, mp1.product_name)
                    END product_name_1,
                    CASE
                        WHEN det.cont_size = 8 THEN mpls.img 
                        ELSE mpl1.img
                    END url_1,
                    CASE
                        WHEN det.cont_size = 8 THEN ms.qty 
                        ELSE det.qty1
                    END qty1,
                    CASE
                        WHEN det.cont_size = 8 THEN mps.product_sku 
                        ELSE mp1.product_sku 
                    END prod_sku_1,
                    det.price1,
                    det.sku2,COALESCE(mp2.product_name_no, mp2.product_name) product_name_2,
                    mpl2.img url_2, det.qty2,det.price2, mp2.product_sku prod_sku_2,
                    det.sku2,COALESCE(mp3.product_name_no, mp3.product_name) product_name_3,
                    mpl3.img url_3, det.qty3,det.price3, mp3.product_sku prod_sku_3,
                    det.remarks, det.bulk
                    FROM 
                    m_order_dtl det
                    JOIN mst_company mco ON det.company_id = mco.company_id  
                    LEFT JOIN sys_user su ON su.user_id = det.created_by 
                    LEFT JOIN mst_container mc ON mc.container_id = det.cont_size
                    LEFT JOIN mst_product mp1 ON det.sku1 = mp1.product_code
                    LEFT JOIN mst_product mp2 ON det.sku2 = mp2.product_code
                    LEFT JOIN mst_product mp3 ON det.sku3 = mp3.product_code
                    LEFT JOIN m_product_link mpl1 ON det.sku1 = mpl1.product_code 
                    LEFT JOIN m_product_link mpl2 ON det.sku2 = mpl2.product_code 
                    LEFT JOIN m_product_link mpl3 ON det.sku3 = mpl3.product_code 
                    LEFT JOIN m_summary ms ON det.order_id  = ms.order_id  
                    LEFT JOIN mst_product mps ON ms.sku = mps.product_code
                    LEFT JOIN m_product_link mpls ON ms.sku = mpls.product_code 
                    WHERE det.company_id = ${req.dataToken.company_id} ;
                `

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error getOrderDetail 1: " + err);
                    } else {
                        res.status(200).send(results);
                        log.eorder.info(`get getOrderDetail for: ${req.dataToken.company_id} success `)
                        addSqlLogger(req.dataToken.user_id, (query), '--data getOrderDetail', `getOrderDetail`)
                    }
                })
            } else {
                res.status(200).send({
                    success: false,
                    message: 'unauthorized'
                })
            }

        } catch (error) {
            log.eorder.info(error);
            res.status(500).send(error);
        }


    },

    addOrderHeader: async (req, res) => {


        if (req.dataToken.active === 1) {



            // add tolliing_id to header (20240306)
            let {
                order_id, user_id, company_id,
                // delv_week, delv_week_desc, 
                delv_year, po_buyer, stuffing_date,
                port_shipment, ship_to, po_url, final_dest
            } = req.body;


            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            let stuffing_date_rev = stuffing_date ? stuffing_date : formattedDate;
            let delv_week = req.body.delv_week ? req.body.delv_week : (await dbQuery(`SELECT day2week('${req.body.stuffing_date}') AS wikwik;`))[0].wikwik;
            let delv_week_desc = req.body.delv_week_desc ? req.body.delv_week_desc : `Week: ${(await dbQuery(`SELECT day2week('${req.body.stuffing_date}') AS wikwik;`))[0].wikwik} Date: ${req.body.stuffing_date} `



            let final_dest_check = final_dest ? final_dest : 0;

            let tolling_id = req.body.tolling_id ? req.body.tolling_id : 0;

            // untuk PO Buyer KHUSUS PCL
            let number = await dbQuery(`SELECT company_number  FROM mst_company mc WHERE company_id = ${company_id}`)
            let specialCondition = await dbQuery(`SELECT COALESCE(mcn.conditions, 0) container FROM special_t_condition mcn WHERE mcn.conditions = 8 AND mcn.company_id = ${company_id}`)
            let checkNumber = number[0] ? number[0].company_number : ''
            let checkCondition = specialCondition[0] ? specialCondition[0].container : ''
            let po_buyer_pcl = checkCondition == 8 && checkNumber ? 'ND/' + checkNumber + '/' + po_buyer : ''

            let query = `
            INSERT INTO m_order 
            (order_id, company_id, delv_week, delv_week_desc, delv_year,  po_buyer, stuffing_date,
            po_date, port_shipment, ship_to, po_url, created_by, status, tolling_id, po_buyer_pcl, final_dest)
            VALUES
            (?, ?, ?, ?, ?, ?, ?,
            now(), ?, ?, ?, ?, 0, ?, ?, ?); 

            `;

            let parameter = [
                order_id, company_id, delv_week, delv_week_desc, delv_year, po_buyer, stuffing_date_rev,
                port_shipment, ship_to, po_url, user_id, tolling_id, po_buyer_pcl, final_dest_check
            ]

            dbConf.query(query, parameter, async (err, results) => {

                if (err) {


                    setTimeout(async () => {
                        let hardDeleteOrder = await dbQuery(`CALL  delete_order(${order_id});`);
                        addSqlLogger(req.dataToken.user_id, ` CALL  delete_order(${order_id});`, hardDeleteOrder, `CALL  delete_order(${order_id});`);
                    }, 3000)

                    res.status(500).send({ message: ` failed insert order ${po_buyer});` });


                    log.eorder.error("Error Push order header: " + err);
                } else {
                    res.status(200).send(results);

                    //MAILER
                    orderRecievedMailSender(user_id, req.dataToken.employee_id, order_id, company_id)
                    // axios.post(`https://anp.indofoodinternational.com:2864/order/send_email_order/${order_id}/${req.dataToken.employee_id}/${user_id}`, {
                    //     headers: {
                    //         'Authorization': `Bearer ` + req.token
                    //     }
                    // }).then((res) => {
                    //     log.eorder.info("Axios mailer success")

                    // }).catch((err) => {
                    //     log.eorder.info("error Axios send mail",)
                    // })

                    log.eorder.info(`add Order Header ${order_id} for ${user_id} success`)
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderHeader-${po_buyer}`)
                }

            });

        } else {
            res.status(401).send(results);
            log.eorder.warn(`GABOLEH add Order Header ${order_id} for ${user_id} UNAUTHORIZED`)
        }

    },
    addOrderDetail: async (req, res) => {


        // DAPATKAN email dari user_id
        // let getEmail = (await dbQuery(`SELECT me.email, me.employee_id FROM mst_employee me WHERE me.email = ${dbConf.escape(req.body.email)};`))[0];

        /*
            Data
        */
        let userData = (await dbQuery(`SELECT su.employee_id, me.email dist_mail, mc.company_name  , group_concat(d.email) iod_mail 
         FROM  sys_user su 
         LEFT JOIN mst_employee me ON su.employee_id = me.employee_id
         LEFT JOIN mst_company mc ON su.company_id = mc.company_id 
         LEFT JOIN map_resp_for_dist a ON a.distributor_id  = su.company_id  
         LEFT JOIN mst_team b ON a.team_id = b.team_id AND a.company_id = b.company_id 
         LEFT JOIN mst_team_member c ON b.team_id = c.team_id AND b.company_id = c.company_id 
         LEFT JOIN mst_employee d ON a.company_id = d.company_id AND c.employee_id = d.employee_id 
         LEFT JOIN mst_employee e ON a.company_id = e.company_id AND b.rm_id = e.employee_id 
         WHERE su.user_id = ${dbConf.escape(req.dataToken.user_id)} AND b.team_category = 6;`))[0];


        if (req.dataToken.active === 1) {

            let {
                order_id, user_id, company_id, detail_id, cont_size, cont_qty,
                sku1, sku2, sku3, qty1, qty2, qty3, price1, price2, price3, remarks, bulk, delv_week, delv_year,
            } = req.body

            let query = `
            INSERT INTO m_order_dtl
            (order_id, company_id, created_by, detail_id, 
                cont_size, cont_qty, 
                sku1, sku2, sku3, qty1, qty2, qty3, price1, price2, price3, 
                remarks, bulk, delv_week, delv_year)
                VALUES
                (?, ?, ?, ?, 
                    ?, ?, 
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?);
                     
                    `
            let parameter = [order_id, company_id, user_id, detail_id,
                cont_size, cont_qty,
                sku1, sku2, sku3, qty1, qty2, qty3, price1, price2, price3,
                remarks, bulk, delv_week, delv_year]

            dbConf.query(query, parameter, async (err, results) => {

                if (err) {

                    setTimeout(async () => {

                        let hardDeleteOrder = await dbQuery(`CALL  delete_order(${order_id});`);

                        addSqlLogger(req.dataToken.user_id, ` CALL  delete_order(${order_id});`, hardDeleteOrder, `CALL  delete_order(${order_id});`);
                    }, 3000)

                    res.status(500).send(err);
                    log.eorder.error("Error Push order detail Data: " + err);

                } else {

                    //END CONNECTION
                    res.status(200).send(results);
                    log.eorder.info(`add Order Detail no. ${order_id} by ${user_id} success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderDetail-${order_id}-${detail_id}`)
                }
            })

        } else {
            res.status(200).send(results);
        }

    },
    addOrderSummary: async (req, res) => {


        if (req.dataToken.active === 1) {

            let {
                order_id, company_id, po_buyer, detail_id,
                sku, qty
                // , top_desc
            } = req.body

            let query = `
            INSERT INTO m_summary
            (order_id, company_id, po_buyer, detail_id,
            sku, qty)
            VALUES
            (?, ?, ?, ?, ?, ?); 
            `
            let parameter = [order_id, company_id, po_buyer, detail_id, sku, qty];

            dbConf.query(query, parameter, async (err, results) => {

                if (err) {


                    setTimeout(async () => {

                        let hardDeleteOrder = await dbQuery(`CALL  delete_order(${order_id});`);

                        addSqlLogger(req.dataToken.user_id, ` CALL  delete_order(${order_id});`, hardDeleteOrder, `CALL  delete_order(${order_id});`);
                    }, 3000)

                    res.status(500).send(err);
                    log.eorder.error("Error Push addOrderSummary: " + err);
                } else {


                    //END CONNECTION
                    res.status(200).send(results);
                    log.eorder.info(`add Order Summary ${order_id} success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderSummary-${order_id}-${detail_id}`)
                }
            })

        } else {
            res.status(200).send(results);
            log.eorder.warn(`add Order Summary by ${user_id} UNAUTHORIZE`);
        }

    },

    getOrderContainerDetail: async (req, res) => {

        // TIMESTAMP GENERATOR



        let order_id = req.params.order_id
        let getBlockingCompany = (await dbQuery(`select company_id from special_t_condition mcn where conditions = 12;`))[0];

        let blockingSoIdCompany = getBlockingCompany && getBlockingCompany.company_id ? getBlockingCompany.company_id : 0;

        if (req.dataToken.company_id && order_id) {

            let query = ` 
            SELECT
                mo.order_id,
                tso.so_id,
                DATE_FORMAT(trd.delv_date, '%d-%b-%Y') delv_date,
                tr.ship_name vessel_name,
                tr.ship_line shipping_line,
                tr.cont_id,
                DATE_FORMAT(COALESCE(trs.atd, tr.etd), '%d-%b-%Y') etd,
                DATE_FORMAT(COALESCE(trs.ata, tr.eta), '%d-%b-%Y') eta,
                mos.status_order,
                mos.notes status_detail,
                COALESCE(mp.product_name_no, mp.product_name) product_name,
                trd.qty, 
                CASE
                    WHEN sum(ms.qty) <= sum(trd.qty) THEN 1
                    ELSE 0
                END finished
            FROM
                m_order mo
            LEFT JOIN m_summary ms ON
                mo.order_id = ms.order_id
            LEFT JOIN m_order_status mos ON
                mos.id = mo.status
            LEFT JOIN trs_sales_order tso ON
                mo.order_id = tso.e_order
            LEFT JOIN trs_realization tr ON
                tso.so_id = tr.so_id
            LEFT JOIN iod.trs_realization_searates trs on
                trs.so_id = tr.so_id and trs.invoice_id = tr.invoice_id
            LEFT JOIN trs_invoice tri on
                tr.invoice_id = tri.invoice_id    
            LEFT JOIN trs_realization_detail trd ON
                tr.cont_id = trd.cont_id
                AND tr.so_id = trd.so_id
                AND tr.invoice_id = trd.invoice_id
            LEFT JOIN mst_product mp ON
                trd.sku = mp.product_code
            WHERE
                mo.order_id = ?
            GROUP BY
                1,2,3,4,10; `

            let parameter = [order_id];

            dbConf.query(query, parameter, (err, results) => {

                if (err) {
                    res.status(500).send(err);

                    log.eorder.info("Error get Order Container Detail", err)
                } else {
                    res.status(200).send(results);
                    log.eorder.info(`get Order Container Detail ${req.dataToken.uid}`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), '-- data getOrderContainerDetail', 'getOrderContainerDetail')
                }
            }
            )
        } else {
            res.status(401).send({
                success: false,
                message: 'unauthorized'
            })
        }


    },

    deleteOrder: async (req, res) => {


        //depereced

        if (req.dataToken.user_id) {

            // try {

            //     if (req.dataToken.user_id) {

            //     } else {
            //         res.status(200).send({
            //             success: false,
            //             message: 'unauthorized'
            //         })
            //     }


            // } catch (error) {
            //     console.log(error);
            //     res.status(500).send(error);
            // }

            let { company_id, delv_week } = req.body;

            dbConf.query(
                `
                DELETE FROM m_order WHERE company_id = ? AND delv_week = ? ;
    
                DELETE FROM m_order_dtl WHERE company_id = ?  AND delv_week = ?; 
                `, [company_id, delv_week, company_id, delv_week],
                (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        log.eorder.info("Error while deleteing order:", err);
                    }
                    res.status(200).send(results);
                    log.eorder.info(" delete order success for : " + company_id + " week " + delv_week)
                }
            )

        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }
    },

    getPI: async (req, res) => {
        let order_id = req.params.id;

        const templatePath = './config/layout.html';
        const template = fs.readFileSync(templatePath, 'utf-8');
        //REAL query for database

        let query = await dbQuery(`
            SELECT a.so_id, a.so_number, upper(date_format(a.po_date,'%d-%b-%Y')) AS so_date, a.po_number, upper(concat(date_format(a.delv_date,'%d-%b-%Y'),' week ',right(concat('0', a.week_delv),2))) AS tentative_stuff,
                coalesce(upper(concat(e.harbour_name, ', ', e.harbour_desc)),'') AS port_shipment, coalesce(upper(h.harbour_name),'') port_discharge, b.sku_id, upper(coalesce(c.product_name_no, c.product_name)) product_name,
                b.quantity, c.per_carton, CASE WHEN (pt.product_type_id & 256) <> 0 THEN 'PACKS' WHEN (pt.product_type_id & 128) THEN 'CUPS' WHEN (pt.product_type_id & 64) THEN 'CUPS' WHEN (pt.product_type_id & 32) THEN 'CUPS' END AS uom, b.value, b.quantity * (b.value - coalesce(b.disc,0)) AS amount, 
                upper(concat(CASE a.incoterm WHEN 1 THEN 'CIF' WHEN 2 THEN 'FOB' WHEN 3 THEN 'CNF' WHEN 4 THEN 'DAP' END, ' ', CASE a.incoterm WHEN 1 THEN (CASE WHEN LENGTH(trim(coalesce(a.cif_to,''))) = 0 THEN h.harbour_name ELSE a.cif_to END) WHEN 2 THEN e.harbour_name WHEN 3 THEN (CASE WHEN LENGTH(trim(coalesce(a.cif_to,''))) = 0 THEN h.harbour_name ELSE a.cif_to END) WHEN 4 THEN coalesce(upper(concat(e.harbour_name, ', ', e.harbour_desc)),'')  END)) incoterm,
                upper(number_to_word(i.ttl_amount, CASE WHEN f.curr_code <> 'USD' THEN f.curr_code ELSE b.rate_unit END)) say_total, i.ttl_amount, a.completion_note, coalesce(a.so_desc,'') so_desc, coalesce(a.trade_promo, "") trade_promo, record_count, b.detail_nr, coalesce(b.disc,0) AS disc, coalesce(a.final_dest, coalesce(upper(h.harbour_name)),'') final_dest, j.top_desc 'desc',
                CASE WHEN ship.company_id IS NOT NULL THEN concat_ws(CHAR(10 using utf8),ship.company_name, ship_addr.street, ship_addr.complex, ship_addr.city) ELSE concat_ws(CHAR(10 using utf8),f.company_name, consignee.street, consignee.complex, consignee.city) END consignee, 
                CASE WHEN notify1.company_id IS NULL THEN CASE WHEN ship.company_id IS NOT NULL THEN concat_ws(CHAR(10 using utf8),ship.company_name, ship_addr.street, ship_addr.complex, ship_addr.city) ELSE concat_ws(CHAR(10 using utf8),f.company_name, consignee.street, consignee.complex, consignee.city) END ELSE concat_ws(CHAR(10 using utf8), notify1.company_name, notify_addr.street, notify_addr.complex, notify_addr.city) END notify, 
                concat_ws(CHAR(10 using utf8),notify2.company_name, notify_addr2.street, notify_addr2.complex, notify_addr2.city) notify2, 
                concat_ws(CHAR(10 using utf8), bill.company_name, bill_addr.street, bill_addr.complex, bill_addr.city) bill, 
                coalesce(factory.street,'') as fac_street, coalesce(factory.complex,'') as fac_complex, coalesce(factory.city, '') as fac_city,
                coalesce(factory.regency,'') fac_telp, coalesce(factory.province,'') fac_telp2, coalesce(factory.postal_code,'') fac_fax, date_format(a.po_date, '%Y') AS so_year,
                ev1.flag appr1, concat(COALESCE(p1.firstname,''),' ',coalesce(p1.lastname,'')) approver1, ev2.flag appr2, concat(COALESCE(p2.firstname,''),' ',coalesce(p2.lastname,'')) approver2,
                ev3.flag appr3, e3.team_name approver3, ev4.flag appr4, concat(COALESCE(p4.firstname,''),' ',coalesce(p4.lastname,'')) approver4, COALESCE(date_format(ev1.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date1,
                COALESCE(date_format(ev2.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date2,COALESCE(date_format(ev3.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date3,COALESCE(date_format(ev4.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date4,
                (b.quantity * coalesce(b.freight_surcharge,0)) freight, coalesce(b.freight_surcharge,0) freight_unit, CASE f.curr_code WHEN 'IDR' THEN f.curr_code ELSE b.rate_unit END rate_unit, coalesce(ev1.employee_id,0) emp1,coalesce(ev2.employee_id,0) emp2,'log' emp3, coalesce(ev4.employee_id,0) emp4, CASE a.incoterm WHEN 1 THEN 'CIF' WHEN 2 THEN 'FOB' WHEN 3 THEN 'CNF' WHEN 4 THEN 'DAP' END inco, f.dist_channel,
                coalesce(a.oth_anp, "") oth_anp, concat(trim(c.product_desc)," x ", trim(c.per_carton), " Packs") AS content, ev5.flag appr5, concat(COALESCE(p5.firstname,''),' ',coalesce(p5.lastname,'')) approver5, COALESCE(date_format(ev5.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date5
            FROM trs_sales_order a
                INNER JOIN trs_so_detail b ON 
                 a.so_id = b.so_id
                 AND a.client_id = b.client_id
                 AND a.version = b.version
                 AND a.company_id = b.company_id
                INNER JOIN m_order online ON 
                 a.e_order = online.order_id 
                LEFT JOIN mst_product c ON 
                 b.sku_id = c.product_code
                 AND b.company_id = c.company_id
                LEFT JOIN mst_product_type pt ON 
                 c.product_type_id = pt.product_type_id 
                 AND c.company_id = pt.company_id 
                 AND c.division_id = pt.division_id 
                LEFT JOIN mst_factory d ON 
                 a.factory_id = d.factory_id
                 AND b.company_id = d.company_id
                LEFT JOIN mst_harbour e ON 
                 d.harbour_id = e.harbour_id
                LEFT JOIN mst_company f ON 
                 a.client_id = f.company_id
                LEFT JOIN mst_harbour h ON 
                 a.port_shipment = h.harbour_id
                LEFT JOIN (SELECT so_id, client_id, sum(quantity * (value - coalesce(disc,0) + coalesce(freight_surcharge,0))) ttl_amount, max(detail_nr) record_count FROM trs_so_detail GROUP BY so_id, client_id) i ON 
                 a.so_id = i.so_id
                 AND a.client_id = i.client_id
                LEFT JOIN mst_top j ON 
                 a.client_id = j.company_id AND a.top_id = j.top_id 
                 AND a.po_date between j.start_date and coalesce(j.expired_date, '9999-12-31')
                LEFT JOIN mst_top_foreign_code k ON 
                 j.top_sap_code = k.id AND j.company_id = a.company_id 
                 AND k.active = 1
                LEFT JOIN mst_company notify1 ON 
                 a.notify_party = notify1.company_id
                LEFT JOIN address notify_addr ON 
                 notify1.address_id = notify_addr.address_id
                LEFT JOIN mst_company notify2 ON 
                 a.notify_party2 = notify2.company_id
                LEFT JOIN address notify_addr2 ON 
                 notify2.address_id = notify_addr2.address_id
                LEFT JOIN mst_company bill ON 
                 a.bill_to_party = bill.company_id
                LEFT JOIN address bill_addr ON 
                 bill.address_id = bill_addr.address_id
                LEFT JOIN address consignee ON 
                 f.address_id = consignee.address_id
                LEFT JOIN address factory on
                 d.plant = CAST(factory.community AS UNSIGNED)
                LEFT JOIN mst_company ship ON 
                 a.ship_to_id = ship.company_id 
                LEFT JOIN address ship_addr ON 
                 ship.address_id = ship_addr.address_id
                LEFT JOIN trs_approval appr ON 
                 a.approval_id  = appr.id AND a.so_id = appr.key AND a.company_id = appr.company_id 
                LEFT JOIN trs_approval_event ev1 ON 
                 appr.id = ev1.appr_id AND appr.company_id = ev1.company_id AND ev1.id = 1
                LEFT JOIN trs_approval_event ev2 ON 
                 appr.id = ev2.appr_id AND appr.company_id = ev2.company_id AND ev2.id = 4
                LEFT JOIN trs_approval_event ev3 ON 
                 appr.id = ev3.appr_id AND appr.company_id = ev3.company_id AND ev3.id = 2
                LEFT JOIN trs_approval_event ev4 ON 
                 appr.id = ev4.appr_id AND appr.company_id = ev4.company_id AND ev4.id = 3
                LEFT JOIN trs_approval_event ev5 ON 
                 appr.id = ev5.appr_id AND appr.company_id = ev5.company_id AND ev5.id = 5
                LEFT JOIN mst_employee e1 ON 
                 ev1.employee_id = e1.employee_id AND ev1.company_id = e1.company_id 
                LEFT JOIN person p1 ON 
                 e1.person_id = p1.person_id 
                LEFT JOIN mst_employee e2 ON 
                 ev2.employee_id = e2.employee_id AND ev2.company_id = e2.company_id 
                LEFT JOIN person p2 ON 
                 e2.person_id = p2.person_id 
                LEFT JOIN mst_team e3 ON 
                 e3.team_id = 27 AND ev3.company_id = e3.company_id 
                LEFT JOIN mst_employee e4 ON 
                 ev4.employee_id = e4.employee_id AND ev4.company_id = e4.company_id 
                LEFT JOIN person p4 ON 
                 e4.person_id = p4.person_id
                LEFT JOIN mst_employee e5 ON 
                 ev5.employee_id = e5.employee_id AND ev5.company_id = e5.company_id 
                LEFT JOIN person p5 ON 
                 e5.person_id = p5.person_id
            WHERE
                 online.order_id = ${order_id}
            AND COALESCE(a.cancel,0) = 0
                 ORDER BY
                 b.detail_nr;`);



        let header = await query[0];
        // const compiledTemplate = ejs.render(template, { header, query });

        //make sure user using auth
        if (req.dataToken.user_id) {

            // // membunuh PDF pupetter
            // const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();

            try {

                // const browser = await puppeteer.launch({ headless: true });
                // const page = await browser.newPage();
                const compiledTemplate = ejs.render(template, { header, query });

                // Set content of the page
                await page.setContent(compiledTemplate, { timeout: 30000 });

                // Generate PDF
                const pdf = await page.pdf();

                // await browser.close();

                res.contentType('application/pdf');
                res.status(200).send(pdf);

                log.eorder.info(`get PDF for order_id: ${order_id} success`)

                addSqlLogger(req.dataToken.user_id, '-- query get PI', '-- data PI', 'getPI')
            } catch (err) {

                log.eorder.error(`Error generating PDF report for order_id: ${order_id} message: ${err}`)
                res.status(400).send('Error generating PDF report');

            } finally {

                await browser.close();

            }
        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }



    },

    getOrderDetailTolling: async (req, res) => {

        let query = await dbQuery(`
    SELECT	 
        ms.order_id ,
        ms.company_id,
        mc.company_name,
        ms.po_buyer, 
        ms.detail_id,
        ms.sku,
        COALESCE(mp.product_name, mp.product_name_no) 
        product_name,
        ms.qty,
        det.created_by,
        det.cont_size,
        cont.container_name, 
        det.remarks,
        det.delv_week,
        det.delv_year, 
        head.po_date 
    FROM
        m_summary ms
    LEFT JOIN mst_company mc ON
        ms.company_id = mc.company_id
    LEFT JOIN mst_product mp ON
        ms.sku = mp.product_code
    LEFT JOIN m_order_dtl det ON
        ms.order_id = det.order_id AND det.detail_id = 1
    LEFT JOIN m_order head ON
        ms.order_id = head.order_id
    LEFT JOIN mst_container cont ON
        cont.container_id = det.cont_size
    WHERE
        ms.company_id = ? AND cont.container_id = 8
    ORDER BY
        head.po_date ,
        ms.order_id,
        detail_id ; 
             `);

        //make sure user using auth
        if (req.dataToken.user_id) {

            dbConf.query(
                query, [req.body.company_id],
                (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.info(`getOrderDetailTolling  ${req.body.company_id} error ${err}`);
                    } else {
                        res.status(200).send(
                            results
                        );
                        log.eorder.info(`getOrderDetailTolling  ${req.body.company_id} success`);
                        addSqlLogger(req.dataToken.user_id, 'query getOrderDetailTolling', '--data getOrderDetailTolling', `getOrderDetailTolling-${req.dataToken.uid}`)
                    }
                }
            )

        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }



    },

    addOrderDetailTolling: async (req, res) => {


        if (req.dataToken.active === 1) {

            let {
                order_id, company_id, po_buyer, detail_id, user_id,
                sku, qty, remarks, delv_date, delv_year
            } = req.body

            let query = `
            INSERT INTO m_summary
            (order_id, company_id, po_buyer, detail_id,
                sku, qty, remarks, delv_date )
                VALUES
            (?, ?, ?, ?, ?, ?, ?, ?);

                    
            INSERT INTO m_order_dtl
            (order_id, company_id, created_by, detail_id, 
                cont_size, cont_qty, delv_year, remarks)
                VALUES
                (?, ?, ?, ?, 8, 0 , ?, ?);
                    
                   CALL insert_so;
            `

            let parameter = [order_id, company_id, po_buyer, detail_id,
                sku, qty, remarks, delv_date, order_id,
                company_id, user_id, detail_id, delv_year, remarks]

            dbConf.query(query, parameter, async (err, results) => {

                if (err) {

                    setTimeout(async () => {
                        let hardDeleteOrder = await dbQuery(`CALL  delete_order(${order_id});`);
                        addSqlLogger(req.dataToken.user_id, ` CALL  delete_order(${order_id});`, hardDeleteOrder, `delete order at addDetailTolling`);
                    }, 3000)

                    res.status(500).send(err);
                    log.eorder.info("Error Push addOrderDetailTolling", err)
                } else {

                    //END CONNECTION
                    res.status(200).send(results);
                    log.eorder.info(`add Order addOrderDetailTolling ${order_id} success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderDetailTolling-${detail_id}-${req.dataToken.uid}`)
                }

            })

        } else {
            res.status(200).send({
                success: false,
                message: 'unauthorized'
            });
            log.eorder.info(`add Order addOrderDetailTolling   UNAUTHORIZE`);
        }
    },

    containerTracking: async (req, res) => {


        let container_id = req.query.container_id

        try {

            // PRODUCTION?  aktifkan di bawah
            if (container_id) {
                try {

                    // let results = await axios.get(`${process.env.URL}?api_key=${process.env.SECURITY_API_SEARATES_KEY}&number=${container_id}&route=true&ais=true`)
                    // if (results.status == 200) {


                    //     let location = results.data.data.locations
                    //     let facility = results.data.data.facility
                    //     let route = results.data.data.route
                    //     let vessels = results.data.data.vessels
                    //     let route_data_route = results.data.data.route_data.route
                    //     let route_data_ais = results.data.data.route_data.ais.status == 'OK' ? results.data.data.route_data.ais.data : {}
                    //     let pin_location = results.data.data.route_data.pin
                    //     let container_number = container_id
                    //     // let container = results.data.data.containers
                    //     let container_status = results.data.data.containers[0].status
                    //     let container_events = results.data.data.containers[0].events

                    //     let data = results.data.data

                    //     log.eorder.info("results.data at container tracking", results.data)

                    //     res.status(200).send({
                    //         // data
                    //         location,
                    //         route,
                    //         facility,
                    //         vessels,
                    //         route_data_route,
                    //         route_data_ais,
                    //         pin_location,
                    //         container_number,
                    //         // container,
                    //         container_status,
                    //         container_events
                    //     })
                    //     addSqlLogger(req.dataToken.user_id, 'container tracking', container_id, `containerTracking-${req.dataToken.uid}`)
                    //     log.eorder.info('successfully send container track for ' + container_id)


                    //     // // Production
                    // } else {
                    //     res.status(500).send([])
                    // }

                    res.status(200).send({
                        "location": [
                            {
                                "id": 1,
                                "name": "Jakarta",
                                "state": "Daerah Khusus Ibukota Jakarta",
                                "country": "Indonesia",
                                "country_code": "ID",
                                "locode": "IDJKT",
                                "lat": -6.1333333333333,
                                "lng": 106.83333333333,
                                "timezone": "Asia/Jakarta"
                            },
                            {
                                "id": 2,
                                "name": "Los Angeles",
                                "state": "California",
                                "country": "United States",
                                "country_code": "US",
                                "locode": "USLAX",
                                "lat": 34.05223,
                                "lng": -118.24368,
                                "timezone": "America/Los_Angeles"
                            },
                            {
                                "id": 3,
                                "name": "Kaohsiung",
                                "state": "Kaohsiung",
                                "country": "Taiwan",
                                "country_code": "TW",
                                "locode": "TWKHH",
                                "lat": 22.61626,
                                "lng": 120.31333,
                                "timezone": "Asia/Taipei"
                            }
                        ],
                        "route": {
                            "prepol": {
                                "location": 1,
                                "date": "2024-05-30 00:00:00",
                                "actual": true
                            },
                            "pol": {
                                "location": 1,
                                "date": "2024-05-30 00:00:00",
                                "actual": true
                            },
                            "pod": {
                                "location": 2,
                                "date": "2024-07-09 00:00:00",
                                "actual": false,
                                "predictive_eta": null
                            },
                            "postpod": {
                                "location": 2,
                                "date": "2024-07-09 00:00:00",
                                "actual": false
                            }
                        },
                        "vessels": [
                            {
                                "id": 1,
                                "name": "EVER BLESS",
                                "imo": 9790074,
                                "call_sign": "BKLT",
                                "mmsi": 416039000,
                                "flag": "TW"
                            },
                            {
                                "id": 2,
                                "name": "EVER MACH",
                                "imo": 9935210,
                                "call_sign": "9V7626",
                                "mmsi": 563199600,
                                "flag": "SG"
                            }
                        ],
                        "route_data_route": [
                            {
                                "path": [
                                    [
                                        -6.1333,
                                        106.8333
                                    ],
                                    [
                                        -6.0694,
                                        106.8467
                                    ],
                                    [
                                        -6.0584,
                                        106.8516
                                    ],
                                    [
                                        -6.0529,
                                        106.8601
                                    ],
                                    [
                                        -6.0531,
                                        106.8722
                                    ],
                                    [
                                        -6.0729,
                                        106.9667
                                    ],
                                    [
                                        -6.0729,
                                        106.9822
                                    ],
                                    [
                                        -6.0656,
                                        106.9929
                                    ],
                                    [
                                        -6.0511,
                                        106.9988
                                    ],
                                    [
                                        -2.5884,
                                        107.6651
                                    ],
                                    [
                                        -2.5704,
                                        107.669
                                    ],
                                    [
                                        -2.5526,
                                        107.6738
                                    ],
                                    [
                                        -2.535,
                                        107.6794
                                    ],
                                    [
                                        1.5314,
                                        109.0859
                                    ],
                                    [
                                        1.5509,
                                        109.0932
                                    ],
                                    [
                                        1.5698,
                                        109.1015
                                    ],
                                    [
                                        1.5884,
                                        109.1108
                                    ],
                                    [
                                        8.6546,
                                        112.8831
                                    ],
                                    [
                                        8.6684,
                                        112.8903
                                    ],
                                    [
                                        8.6825,
                                        112.8971
                                    ],
                                    [
                                        8.6967,
                                        112.9036
                                    ],
                                    [
                                        11.4318,
                                        114.0993
                                    ],
                                    [
                                        11.446,
                                        114.1058
                                    ],
                                    [
                                        11.4599,
                                        114.1128
                                    ],
                                    [
                                        11.4737,
                                        114.1202
                                    ],
                                    [
                                        22.1713,
                                        120.1793
                                    ],
                                    [
                                        22.1846,
                                        120.1838
                                    ],
                                    [
                                        22.1969,
                                        120.1818
                                    ],
                                    [
                                        22.2082,
                                        120.1733
                                    ],
                                    [
                                        22.3104,
                                        120.0629
                                    ],
                                    [
                                        22.3217,
                                        120.055
                                    ],
                                    [
                                        22.3332,
                                        120.0547
                                    ],
                                    [
                                        22.345,
                                        120.062
                                    ],
                                    [
                                        22.6163,
                                        120.3133
                                    ]
                                ],
                                "type": "SEA",
                                "transport_type": "VESSEL"
                            },
                            {
                                "path": [
                                    [
                                        22.6163,
                                        120.3133
                                    ],
                                    [
                                        22.3446,
                                        120.0616
                                    ],
                                    [
                                        22.3326,
                                        120.0544
                                    ],
                                    [
                                        22.3205,
                                        120.0544
                                    ],
                                    [
                                        22.3083,
                                        120.0615
                                    ],
                                    [
                                        21.6555,
                                        120.6373
                                    ],
                                    [
                                        21.6427,
                                        120.6509
                                    ],
                                    [
                                        21.6327,
                                        120.6662
                                    ],
                                    [
                                        21.6255,
                                        120.6835
                                    ],
                                    [
                                        21.5701,
                                        120.8554
                                    ],
                                    [
                                        21.5665,
                                        120.8713
                                    ],
                                    [
                                        21.5659,
                                        120.8873
                                    ],
                                    [
                                        21.5682,
                                        120.9035
                                    ],
                                    [
                                        21.7387,
                                        121.6409
                                    ],
                                    [
                                        21.7442,
                                        121.656
                                    ],
                                    [
                                        21.7528,
                                        121.669
                                    ],
                                    [
                                        21.7647,
                                        121.6798
                                    ],
                                    [
                                        21.9563,
                                        121.8191
                                    ],
                                    [
                                        21.9677,
                                        121.8272
                                    ],
                                    [
                                        21.9791,
                                        121.8352
                                    ],
                                    [
                                        21.9907,
                                        121.8431
                                    ],
                                    [
                                        24.2041,
                                        123.3263
                                    ],
                                    [
                                        24.2157,
                                        123.334
                                    ],
                                    [
                                        24.2272,
                                        123.3419
                                    ],
                                    [
                                        24.2387,
                                        123.3498
                                    ],
                                    [
                                        28.4205,
                                        126.2259
                                    ],
                                    [
                                        28.562443292294898,
                                        128.12590767238157
                                    ],
                                    [
                                        28.637,
                                        129.1239
                                    ],
                                    [
                                        28.639,
                                        129.1388
                                    ],
                                    [
                                        28.6427,
                                        129.1532
                                    ],
                                    [
                                        28.6481,
                                        129.1671
                                    ],
                                    [
                                        28.9435,
                                        129.8079
                                    ],
                                    [
                                        28.949,
                                        129.8222
                                    ],
                                    [
                                        28.9525,
                                        129.837
                                    ],
                                    [
                                        28.9541,
                                        129.8523
                                    ],
                                    [
                                        32.6022,
                                        -118.5049
                                    ],
                                    [
                                        32.6037,
                                        -118.4892
                                    ],
                                    [
                                        32.6069,
                                        -118.4739
                                    ],
                                    [
                                        32.6121,
                                        -118.459
                                    ],
                                    [
                                        32.7422,
                                        -118.1471
                                    ],
                                    [
                                        32.7499,
                                        -118.1346
                                    ],
                                    [
                                        32.7609,
                                        -118.1264
                                    ],
                                    [
                                        32.775,
                                        -118.1226
                                    ],
                                    [
                                        33.325,
                                        -118.0691
                                    ],
                                    [
                                        33.3398,
                                        -118.0685
                                    ],
                                    [
                                        33.3546,
                                        -118.0696
                                    ],
                                    [
                                        33.3692,
                                        -118.0724
                                    ],
                                    [
                                        34.0522,
                                        -118.2437
                                    ]
                                ],
                                "type": "SEA",
                                "transport_type": "VESSEL"
                            }
                        ],
                        "route_data_ais": {
                            "last_event": {
                                "description": "Transship container loaded on vessel",
                                "date": "2024-06-21 00:00:00",
                                "voyage": "1355-004E"
                            },
                            "discharge_port": {
                                "name": "Los Angeles",
                                "country_code": "US",
                                "code": "LAX",
                                "date": "2024-07-09 00:00:00",
                                "date_label": "ETA"
                            },
                            "vessel": {
                                "name": "EVER MACH",
                                "imo": 9935210,
                                "call_sign": "9V7626",
                                "mmsi": 563199600,
                                "flag": "SG"
                            },
                            "last_vessel_position": {
                                "lat": 28.4205,
                                "lng": 126.2259,
                                "updated_at": "2024-06-28 04:48:06"
                            },
                            "departure_port": {
                                "country_code": "CN",
                                "code": "YTN",
                                "date": "2024-06-26 13:13:00",
                                "date_label": "ATD"
                            },
                            "arrival_port": {
                                "country_code": "US",
                                "code": "LAX",
                                "date": "2024-07-10 11:00:00",
                                "date_label": "ETA"
                            },
                            "updated_at": "2024-06-28 08:32:56"
                        },
                        "pin_location": [
                            28.562443292294898,
                            128.12590767238157
                        ],
                        "container_number": "EMCU-8593893",
                        "container_status": "IN_TRANSIT",
                        "container_events": [
                            {
                                "order_id": 1,
                                "location": 1,
                                "facility": null,
                                "description": "Container loaded at first POL",
                                "event_type": "EQUIPMENT",
                                "event_code": "LOAD",
                                "status": "CLL",
                                "date": "2024-05-30 00:00:00",
                                "actual": true,
                                "is_additional_event": true,
                                "type": "sea",
                                "transport_type": "VESSEL",
                                "vessel": 1,
                                "voyage": "1090-053A"
                            },
                            {
                                "order_id": 2,
                                "location": 3,
                                "facility": null,
                                "description": "Transship container loaded on vessel",
                                "event_type": "EQUIPMENT",
                                "event_code": "LOAD",
                                "status": "CLT",
                                "date": "2024-06-21 00:00:00",
                                "actual": true,
                                "is_additional_event": false,
                                "type": "sea",
                                "transport_type": "VESSEL",
                                "vessel": 2,
                                "voyage": "1355-004E"
                            },
                            {
                                "order_id": 3,
                                "location": 2,
                                "facility": null,
                                "description": "Vessel arrival at final POD",
                                "event_type": "TRANSPORT",
                                "event_code": "ARRI",
                                "status": "VAD",
                                "date": "2024-07-09 00:00:00",
                                "actual": false,
                                "is_additional_event": true,
                                "type": "sea",
                                "transport_type": "VESSEL",
                                "vessel": 2,
                                "voyage": "1355-004E"
                            }
                        ]
                    })
                } catch (error) {
                    log.eorder.error("Exception: " + error);
                    res.status(500).send(error)
                }
            } else {
                res.status(400).send({
                    message: "container_id is undefine"

                })
            }



        } catch (error) {
            log.eorder.error("Exception: " + error);
            res.status(500).send(error)
        }
    },

    checkOrderReal: async (req, res) => {
        let { blno } = req.params

        let getsoid = (await dbQuery(`select invoice_id from trs_realization where cont_id = ${blno} or ;`));
        // Error prevention: Check if getBlockingCompany is not empty and has the value you expect
        let blockingSoIdCompany = getBlockingCompany.length
            ? getBlockingCompany.map(row => row.company_id).join(', ')
            : '0';

    },
    saveSseaRates: async (req, res) => {

    }

}
