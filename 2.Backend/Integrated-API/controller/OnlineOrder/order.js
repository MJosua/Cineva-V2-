const { dbConf, dbQuery, addSqlLogger } = require("../../config/db");
const fs = require('fs')
const { orderRecievedMailSender } = require('../../service/mailer/eorder/eorder_mailer');
const ejs = require('ejs');
// const puppeteer = require('puppeteer');
const axios = require('axios');
const { group } = require("console");
const { NULL } = require("mysql/lib/protocol/constants/types");
// const { time } = require("console");
// const { json } = require("body-parser");
// const { parse } = require("path");

let green = "\x1b[32m"
let white = "\x1b[37m";

module.exports = {


    getOrderAllIn: async (req, res) => {

        // add feature on 20240105
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let page = parseInt(req.query.page, 10);
        page = isNaN(page) || page < 1 ? 1 : page; // Ensure page is valid
        let offset = (page - 1) * limit; // Correct offset calculation
        let desc = req.query.desc === "1" ? `DESC ` : `ASC`;

        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find || req.query.find !== '' ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id} ` : ''
        let order_by_week = req.query.order_by_week === "1" ? `ORDER BY mo.po_date ${desc}` : `  ORDER BY mo.order_id ${desc} `;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id} limit 30  `))

        let queryCount =
            `
            SELECT COUNT(*) AS total_orders FROM m_order mo
            where
            company_id = ${req.dataToken.company_id}
            `
            +
            status
            +
            find
            +
            range
            ;

        let query = ` 
        SELECT
        DISTINCT 
        mo.order_id,
        mco.company_name,
        mo.delv_week,
        mo.delv_week_desc,
        mo.final_dest,
        mo.delv_year,
        mo.po_buyer,
        mo.po_date,
        concat(mh.harbour_name, ", " , st.txt ) port_shipment,
        mo.ship_to,
        stp.company_name ,
        mo.po_buyer,
        stp.company_name ship_to,
        mo.po_url,
        concat(su.firstname, ' ', su.lastname ) created_by,
        mso.status_order status_name,
        mso.notes status_detail,
        mso.id is_status,
        mct.container_name, 
        md.cont_size,
        CASE
            WHEN md.cont_qty = 0 THEN 1
            ELSE md.cont_qty
        END cont_qty,
        DATE_FORMAT(mo.po_date, '%b %d, %Y') created_date,
        mo.tolling_id,
        CASE
            WHEN md.cont_qty = 0 THEN 1
            ELSE md.cont_qty
        END cont_qty,
        ms.detail_id,
        ms.sku,
        COALESCE(mps.product_name_no, mps.product_name) product_name,
        mpls.img url,
        ms.qty,
        md.price1,
        mps.product_sku prod_sku,
        md.remarks,
        md.bulk 
        FROM
            m_order mo
        JOIN mst_company mco ON
            mo.company_id = mco.company_id
        LEFT JOIN map_port_for_dist mpfd ON
           mo.port_shipment = mpfd.id
	        and mo.company_id = mpfd.distributor_id
        LEFT JOIN mst_company stp ON
            stp.company_id = mo.ship_to
        LEFT JOIN sys_user su ON
            su.user_id = mo.created_by
        LEFT JOIN m_order_status mso ON
            mo.status = mso.id
        LEFT JOIN m_order_dtl md ON
            md.order_id = mo.order_id
        LEFT JOIN mst_container mct ON
            md.cont_size = mct.container_id
        LEFT JOIN mst_harbour mh ON
            mpfd.harbour_id = mh.harbour_id
        LEFT JOIN mst_country mc ON
            mh.country_id = mc.country_id
        LEFT JOIN sys_text st ON
            mc.country_name_id = st.text_id
            AND st.lang_id = 1  
        LEFT JOIN mst_product mp1 ON md.sku1 = mp1.product_code
        LEFT JOIN mst_product mp2 ON md.sku2 = mp2.product_code
        LEFT JOIN mst_product mp3 ON md.sku3 = mp3.product_code
        LEFT JOIN m_product_link mpl1 ON md.sku1 = mpl1.product_code 
        LEFT JOIN m_product_link mpl2 ON md.sku2 = mpl2.product_code 
        LEFT JOIN m_product_link mpl3 ON md.sku3 = mpl3.product_code 
        LEFT JOIN m_summary ms ON mo.order_id  = ms.order_id  
        LEFT JOIN mst_product mps ON ms.sku = mps.product_code
        LEFT JOIN m_product_link mpls ON ms.sku = mpls.product_code 
    WHERE
        mo.company_id = ${req.dataToken.company_id} `
            +
            status
            +
            find
            +
            range
            +
            order_by_week
            +
            ` LIMIT `
            +
            limit
            +
            ` OFFSET `
            +
            offset
            ;

        try {


            if (req.dataToken.user_id) {

                // let { company_id } = req.body

                dbConf.query(queryCount, (err, countResults) => {
                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error counting total orders: " + err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count

                    dbConf.query(query,
                        (err, results) => {

                            if (err) {
                                res.status(500).send(err);
                                log.eorder.error("Error get getOrderAllIn: " + err);
                            } else {
                                if (results[0]) {
                                    let packet = results

                                    // res.status(200).send(results);
                                    res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                    log.eorder.info(`get getOrderAllIn Success`);
                                } else {

                                    let packet = []
                                    let totalDataLength = 0
                                    let totalPage = 0

                                    res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                    log.eorder.info(`get getOrderAllIn EMPTY data`);
                                    addSqlLogger(req.dataToken.user_id, query, ' -- data getOrderAllIn', 'getOrderAllIn')
                                }

                            }


                        }
                    )


                }
                )


            } else {
                res.status(200).send({
                    success: false,
                    message: 'unauthorized'
                })
            }


        } catch (error) {
            log.eorder.error("Exception in getOrderAllIn: " + error);
            res.status(500).send(error);
        }



    },
    getRealizationAllIn: async (req, res) => {

        // add feature on 20240105
        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let offset = (page - 1) * limit; // Correct offset calculation

        let desc = req.query.desc === "1" ? `DESC ` : `ASC`;
        let order_by_week = req.query.order_by_week === "1" ? `ORDER BY mo.po_date ${desc}` : `  ORDER BY mo.order_id ${desc} `;

        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%')` : ''


        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id} `))


        let query = ` 
                select
                po_buyer,
                order_id,
                so_id,
                ship_to,
                port_of_discharge,
                stuffing_week,
                product_sku,
                product_description,
                realization_quantity,
                completion_note,
                po_date,
                submitted_by,
                order_status,
                order_remarks,
                container_id,
                stuffing_date,
                etd,
                eta,
                status -- Include status here
            from
                (
                select
                    ms.po_buyer,
                    ms.order_id,
                    tr.so_id,
                    stp.company_name ship_to,
                    concat(mh.harbour_name, ', ', tp.txt) port_of_discharge,
                    mo.delv_week_desc stuffing_week,
                    mp.product_sku product_sku,
                    coalesce(mp.product_name_no, mp.product_name) product_description,
                    coalesce(trd.qty, 0) realization_quantity,
                    concat(1 , ' X ', mc2.container_name ) completion_note,
                    DATE_FORMAT(mo.po_date, '%b %d, %Y') po_date,
                    concat(su.firstname, ' ', su.lastname ) submitted_by,
                    mos.status_order order_status,
                    mod2.remarks order_remarks,
                    tr.cont_id container_id,
                    coalesce(DATE_FORMAT(tr.delv_date, '%b %d, %Y'), 0) stuffing_date,
                    coalesce(DATE_FORMAT(trs.atd, '%b %d, %Y'), DATE_FORMAT(tr.etd, '%b %d, %Y'), 0) etd,
                    coalesce(DATE_FORMAT(trs.ata, '%b %d, %Y'), DATE_FORMAT(tr.eta, '%b %d, %Y'), 0) eta,
                    mo.delv_week,
                    stp.company_id,
                    mo.status -- Include status here
                from
                    m_summary ms
                left join m_order mo on
                    mo.order_id = ms.order_id
                left join (
                    select
                        order_id,
                        remarks,
                        cont_size
                    from
                        m_order_dtl
                    group by
                        order_id) mod2 on
                    mod2.order_id = mo.order_id
                left join mst_company stp on
                    mo.ship_to = stp.company_id
                LEFT JOIN map_port_for_dist mpfd ON
                    mo.port_shipment = mpfd.id
                        and mo.company_id = mpfd.distributor_id    
                left join mst_harbour mh on
                    mpfd.harbour_id = mh.harbour_id            
                left join mst_country mc on
                    mh.country_id = mc.country_id
                left join sys_text tp on
                    tp.text_id = mc.country_name_id
                    and tp.lang_id = 1
                left join mst_product mp on
                    mp.product_code = ms.sku
                    and mp.active = 1
                left join mst_container mc2 on
                    mc2.container_id = mod2.cont_size
                left join sys_user su on
                    su.user_id = mo.created_by
                left join m_order_status mos on
                    mos.id = mo.status
                left join trs_sales_order tso on
                    tso.e_order = mo.order_id
                left join trs_realization tr on
                    tso.so_id = tr.so_id
                left join iod.trs_realization_searates trs on
                    trs.so_id = tr.so_id and trs.invoice_id = tr.invoice_id
                left join trs_realization_detail trd on
                    tr.so_id = trd.so_id
                    and tr.invoice_id = trd.invoice_id
                    and tr.cont_id = trd.cont_id
                    and ms.sku = trd.sku
                where
                    ms.company_id = ${req.dataToken.company_id}
                    and mo.status in (3, 4)
                group by
                    tr.invoice_id,
                    tr.cont_id,
                    tr.so_id,
                    ms.sku,
                    ms.po_buyer,
                    ms.order_id,
                    stp.company_name,
                    mh.harbour_name,
                    tp.txt,
                    mo.delv_week_desc,
                    mp.product_sku,
                    mp.product_name_no,
                    mp.product_name,
                    mod2.remarks,
                    mc2.container_name,
                    mo.po_date,
                    su.firstname,
                    su.lastname,
                    mos.status_order,
                    stp.company_id,
                    tr.delv_date,
                    tr.etd,
                    tr.eta,
                    mo.delv_week,
                    mo.status -- Include status in GROUP BY
                order by
                    tr.invoice_id,
                    tr.cont_id,
                    tr.so_id
                ) mo
            where
                mo.realization_quantity > 0
    ` + status + find + range + order_by_week + ` limit ` + limit
            +
            ` OFFSET `
            +
            offset
            ;

        try {

            if (req.dataToken.user_id) {

                let queryCount =
                    `
             select
                COUNT(*) as total_orders
            from
                trs_realization tr
            left join 
            trs_sales_order tso on
                tso.so_id = tr.so_id 
            left join 
            m_order mo on
                mo.order_id = tso.e_order 
            where
                mo.company_id = ${req.dataToken.company_id}
            
            `+
                    status
                    +
                    find
                    +
                    range
                    ;

                dbConf.query(queryCount, (err, countResults) => {
                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error counting total orders: " + err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count

                    // let { company_id } = req.body

                    dbConf.query(query, (err, results) => {

                        if (err) {
                            res.status(500).send(err);
                            log.eorder.error("Error getRealizationAllIn: " + err);
                        } else {

                            if (results[0]) {
                                let packet = results
                                // res.status(200).send(results);
                                res.status(200).send({
                                    find, packet, available_week, totalPage,
                                    totalDataLength, page
                                });

                                log.eorder.info(`get getRealizationAllIn success data`);
                            } else {

                                let packet = []
                                let totalDataLength = 0
                                let totalPage = 0

                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                log.eorder.info(`get getRealizationAllIn EMPTY data`);
                                addSqlLogger(req.dataToken.user_id, (query), `-- data getRealizationAllIn-${req.dataToken.uid}`, `getRealizationAllIn-${req.dataToken.uid}`)
                            }

                        }
                    })

                }
                )

                // let { company_id } = req.body



            } else {
                res.status(200).send({
                    success: false,
                    message: 'unauthorized'
                })
            }



        } catch (error) {
            log.eorder.error("Exception in getRealizationAllIn: " + error);
            res.status(500).send(error);
        }



    },
    getOrderHeaderWithID: async (req, res) => {
        let order_id = req.params.order_id
        // add feature on 20240105
        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let desc = req.query.desc === "1" ? `DESC ` : `ASC`;
        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : ' 1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : ' 99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id} ` : ''
        let order_by_week = req.query.order_by_week ? ` ORDER BY mo.delv_week ${desc}` : ` ORDER BY mo.order_id ${desc}`;
        let offset = (page - 1) * limit; // Correct offset calculation


        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id}  `))


        let query = ` 
            select
            distinct 
            mo.order_id,
            mco.company_name,
            mo.delv_week,
            mo.delv_week_desc,
            mo.stuffing_date,
            mo.final_dest,
            mo.delv_year,
            mo.po_buyer,
            concat(mh.harbour_name, ", " , st.txt ) port_shipment,
            mo.ship_to,
            stp.company_name ,
            mo.po_buyer,
            stp.company_name ship_to,
            mo.po_url,
            concat(su.firstname, ' ', su.lastname ) created_by,
            mso.status_order status_name,
            mso.notes status_detail,
            mso.id is_status,
            mct.container_name,
            case
                when md.cont_qty = 0 then 1
                else md.cont_qty
            end cont_qty,
            DATE_FORMAT(mo.po_date, '%b %d, %Y') created_date,
            mo.po_date,
            mo.tolling_id,
            md.cont_size,
            btp.company_name as bill_to_name,
            mo.bill_to,
            CASE 
                WHEN ntp1.company_notice IS NOT NULL 
                    AND ntp1.company_notice <> '' 
                THEN CONCAT(ntp1.company_name, ' - ', ntp1.company_notice)
                ELSE ntp1.company_name
            END AS notify1_name,
            mo.notify1,
            CASE 
                WHEN ntp2.company_notice IS NOT NULL 
                    AND ntp2.company_notice <> '' 
                THEN CONCAT(ntp2.company_name, ' - ', ntp2.company_notice)
                ELSE ntp2.company_name
            END AS notify2_name,
            mo.notify2
        from
            m_order mo
        join mst_company mco on
            mo.company_id = mco.company_id
        left join map_port_for_dist mpfd on
            mo.port_shipment = mpfd.id
            and mo.company_id = mpfd.distributor_id
        left join mst_company stp on
            stp.company_id = mo.ship_to
        left join sys_user su on
            su.user_id = mo.created_by
        left join m_order_status mso on
            mo.status = mso.id
        left join m_order_dtl md on
            md.order_id = mo.order_id
        left join mst_container mct on
            md.cont_size = mct.container_id
        left join mst_harbour mh on
            mpfd.harbour_id = mh.harbour_id
        left join mst_country mc on
            mh.country_id = mc.country_id
        left join sys_text st on
            mc.country_name_id = st.text_id
            and st.lang_id = 1
        left join mst_company btp on
            mo.bill_to = btp.company_id
        left join mst_company ntp1 on
            mo.notify1 = ntp1.company_id
            and ntp1.company_type_id = 7
        left join mst_company ntp2 on
            mo.notify2 = ntp2.company_id
            and ntp2.company_type_id = 7
        WHERE
            mo.company_id = ${req.dataToken.company_id} 
        and
        mo.order_id = ${order_id}
        `
            +
            status
            +
            find
            +
            range
            +
            order_by_week
            +
            ` LIMIT `
            +
            limit
            +
            ` OFFSET `
            +
            offset

            ;


        try {

            if (req.dataToken.user_id) {

                // let { company_id } = req.body

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error getOrderHeader with ID: " + err)
                    } else {

                        if (results[0]) {

                            let packet = results
                            let totalDataLength = results.length
                            let totalPage = Math.round(results.length / limit)

                            // res.status(200).send(results);
                            res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                            log.eorder.info(`get getOrderHeader data success`);
                        } else {

                            let packet = []
                            let totalDataLength = 0
                            let totalPage = 0

                            res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                            log.eorder.info(`get getOrderHeader EMPTY data`);
                            addSqlLogger(req.dataToken.user_id, query, '--data getOrderHeader', 'getOrderHeader')
                        }

                    }
                })

            } else {
                res.status(200).send({
                    success: false,
                    message: 'unauthorized'
                })
            }


        } catch (error) {
            log.eorder.error("Exception in getOrderHeaderWithID: " + error);
            res.status(500).send(error);
        }



    },
    getOrderHeader: async (req, res) => {

        // add feature on 20240105
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let page = parseInt(req.query.page, 10);
        page = isNaN(page) || page < 1 ? 1 : page; // Ensure page is valid
        let offset = (page - 1) * limit; // Correct offset calculation
        let desc = req.query.desc === "1" ? `DESC ` : `ASC`;

        let status = ' ';
        if (req.query.status !== 0 && req.query.status !== undefined && req.query.status !== "0") {
            const statusList = req.query.status.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
            log.eorder.info("statusList: " + JSON.stringify(statusList));

            if (statusList.length >= 1) {
                status = ` AND mo.status IN (${statusList.join(',')}) `;
            }
        }


        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : ' 1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : ' 99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id} ` : ''
        let order_by_week = req.query.order_by_week === "1" ? `ORDER BY mo.po_date ${desc}` : `  ORDER BY mo.order_id ${desc} `;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id}  limit 30 `))

        let queryCount =
            `
        SELECT COUNT(*) AS total_orders FROM m_order mo
        where
            company_id = ${req.dataToken.company_id}
        `
            +
            status
            +
            find
            +
            range
            ;

        let query = ` 
            select
            distinct 
            mo.order_id,
            mco.company_name,
            mo.delv_week,
            mo.delv_week_desc,
            mo.stuffing_date,
            mo.final_dest,
            mo.delv_year,
            mo.po_buyer,
            concat(mh.harbour_name, ", " , st.txt ) port_shipment,
            mo.ship_to,
            stp.company_name ,
            mo.po_buyer,
            stp.company_name ship_to,
            mo.po_url,
            concat(su.firstname, ' ', su.lastname ) created_by,
            mso.status_order status_name,
            mso.notes status_detail,
            mso.id is_status,
            mct.container_name,
            case
                when md.cont_qty = 0 then 1
                else md.cont_qty
            end cont_qty,
            DATE_FORMAT(mo.po_date, '%b %d, %Y') created_date,
            mo.po_date,
            mo.tolling_id,
            md.cont_size,
            btp.company_name as bill_to_name,
            mo.bill_to,
            CASE 
                WHEN ntp1.company_notice IS NOT NULL 
                    AND ntp1.company_notice <> '' 
                THEN CONCAT(ntp1.company_name, ' - ', ntp1.company_notice)
                ELSE ntp1.company_name
            END AS notify1_name,
            mo.notify1,
            CASE 
                WHEN ntp2.company_notice IS NOT NULL 
                    AND ntp2.company_notice <> '' 
                THEN CONCAT(ntp2.company_name, ' - ', ntp2.company_notice)
                ELSE ntp2.company_name
            END AS notify2_name,
            mo.notify2
        from
            m_order mo
        join mst_company mco on
            mo.company_id = mco.company_id
        left join map_port_for_dist mpfd on
           mo.port_shipment = mpfd.id
            and mo.company_id = mpfd.distributor_id
        left join mst_company stp on
            stp.company_id = mo.ship_to
        left join sys_user su on
            su.user_id = mo.created_by
        left join m_order_status mso on
            mo.status = mso.id
        left join m_order_dtl md on
            md.order_id = mo.order_id
        left join mst_container mct on
            md.cont_size = mct.container_id
        left join mst_harbour mh on
            mpfd.harbour_id = mh.harbour_id
        left join mst_country mc on
            mh.country_id = mc.country_id
        left join sys_text st on
            mc.country_name_id = st.text_id
            and st.lang_id = 1
        left join mst_company btp on
            mo.bill_to = btp.company_id
        left join mst_company ntp1 on
            mo.notify1 = ntp1.company_id
            and ntp1.company_type_id = 7
        left join mst_company ntp2 on
            mo.notify2 = ntp2.company_id
            and ntp2.company_type_id = 7
    WHERE
        mo.company_id = ${req.dataToken.company_id} `
            +
            status
            +
            find
            +
            range
            +
            order_by_week
            +
            ` LIMIT `
            +
            limit
            +
            ` OFFSET `
            +
            offset
            ;

        // log.eorder.info("getOrderHeader",
        //     {
        //         page, limit, order_by_week, desc, status, stuffingstart, stuffingend, range, find
        //     }, "query: ", query)

        try {

            if (req.dataToken.user_id) {

                dbConf.query(queryCount, (err, countResults) => {
                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error counting total orders: " + err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count



                    dbConf.query(query, (err, results) => {
                        if (err) {
                            res.status(500).send(err);
                            log.eorder.error("Error getOrderHeader: " + err);
                        } else {

                            if (results[0]) {

                                let packet = results

                                // res.status(200).send(results);
                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                log.eorder.info(`get getOrderHeader data success`);
                            } else {

                                let packet = []


                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                log.eorder.info(`get getOrderHeader EMPTY data`);
                                // addSqlLogger(req.dataToken.user_id, query, '--data getOrderHeader', 'getOrderHeader')
                            }

                        }
                    })

                }
                )

                // let { company_id } = req.body



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
    // getOrderDetail: [ARCHIVED],
    getOrderDetail2: async (req, res) => {

        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) * 20 : 9999;
        let offset = (page - 1) * limit; // Correct offset calculation
        let desc = req.query.desc === "1" ? `DESC ` : `ASC`;

        let status = '';
        log.eorder.info("status: " + JSON.stringify(req.query));
        if (req.query.status !== 0 && req.query.status !== undefined && req.query.status !== "0") {

            const statusList = req.query.status.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
            if (statusList.length > 0) {
                status = ` AND mo.status IN (${statusList.join(',')})`;
            }
        }
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id}` : ''
        let order_by_week = req.query.order_by_week === "1" ? `  ORDER BY mo.po_date ${desc}  ` : `ORDER BY mo.order_id ${desc} `;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit * 10;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id} limit 30  `))


        try {

            if (req.dataToken.user_id) {
                // let { company_id } = req.body 

                let query = `
                            SELECT
                                DISTINCT
                                det.order_id,
                                mo.order_id as morder_id,
                                det.company_id,
                                mo.final_dest, 
                                mco.company_name,
                                det.created_by,
                                su.firstname,
                                mo.delv_week,
                                mo.po_date,
                                CASE
                                WHEN det.cont_size = 8 THEN ms.detail_id
                                    ELSE det.detail_id
                                END detail_id,
                                det.cont_size,
                                mc.container_name,
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
                                det.sku2,
                                COALESCE(mp2.product_name_no, mp2.product_name) product_name_2,
                                mpl2.img url_2,
                                det.qty2,
                                det.price2,
                                mp2.product_sku prod_sku_2,
                                det.sku2,
                                COALESCE(mp3.product_name_no, mp3.product_name) product_name_3,
                                mpl3.img url_3,
                                det.qty3,
                                det.price3,
                                mp3.product_sku prod_sku_3,
                                det.remarks,
                                det.bulk
                            FROM
                                m_order_dtl det
                            INNER JOIN m_order mo ON
                                mo.order_id = det.order_id
                            JOIN mst_company mco ON
                                det.company_id = mco.company_id
                            LEFT JOIN map_port_for_dist mpfd ON
                                mo.port_shipment = mpfd.harbour_id
                                AND mo.company_id = mpfd.distributor_id
                            LEFT JOIN sys_user su ON
                                su.user_id = det.created_by
                            LEFT JOIN mst_container mc ON
                                mc.container_id = det.cont_size
                            LEFT JOIN mst_product mp1 ON
                                det.sku1 = mp1.product_code
                            LEFT JOIN mst_product mp2 ON
                                det.sku2 = mp2.product_code
                            LEFT JOIN mst_product mp3 ON
                                det.sku3 = mp3.product_code
                            LEFT JOIN m_product_link mpl1 ON
                                det.sku1 = mpl1.product_code
                            LEFT JOIN m_product_link mpl2 ON
                                det.sku2 = mpl2.product_code
                            LEFT JOIN m_product_link mpl3 ON
                                det.sku3 = mpl3.product_code
                            LEFT JOIN m_summary ms ON
                                det.order_id = ms.order_id
                            LEFT JOIN mst_product mps ON
                                ms.sku = mps.product_code
                            LEFT JOIN m_product_link mpls ON
                                ms.sku = mpls.product_code
                            WHERE
                                det.company_id = ${req.dataToken.company_id}
                                `
                    + status + find + range + order_by_week + ` limit ` + limit
                    +
                    ` OFFSET `
                    +
                    offset
                    ;


                ;

                // log.eorder.info("getOrderDetail2",
                //     {
                //         page, limit, order_by_week, desc, status, stuffingstart, stuffingend, range, find
                //     }, "query: ", query)


                let queryCount =
                    `
            SELECT COUNT(*) AS total_orders FROM m_order mo
            where
            company_id = ${req.dataToken.company_id}
            
            `
                    +
                    status
                    +
                    find
                    +
                    range
                    ;

                dbConf.query(queryCount, (err, countResults) => {
                    if (err) {
                        res.status(500).send(err);
                        log.eorder.info(" Error counting total orders!", err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count

                    dbConf.query(query, (err, results) => {

                        if (err) {
                            res.status(500).send(err);
                            log.eorder.error("Error getOrderDetail 2: " + err);
                        } else {

                            if (results) {

                                let packet = results

                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                log.eorder.info(`get getOrderDetail2 data success`);

                            } else {

                                let packet = []
                                let totalDataLength = 0
                                let totalPage = 0

                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                log.eorder.info(`get getOrderDetail2 EMPTY data`);
                                // addSqlLogger(req.dataToken.user_id, (query), '--data getOrderDetail2', 'getOrderDetail2')
                            }
                        }
                    })


                }

                )




            } else {
                res.status(200).send({
                    success: false,
                    message: 'unauthorized'
                })
            }

        } catch (error) {
            log.eorder.error("Exception in getOrderDetail2: " + error);
            res.status(500).send(error);
        }



    },
    getOneOrderDetail: async (req, res) => {


        let order_id = req.params.order_id
        //untuk menghilangkan week tertentu.
        let getBlockingCompany = (await dbQuery(`select company_id from special_t_condition mcn where conditions = 12;`));
        // Error prevention: Check if getBlockingCompany is not empty and has the value you expect
        let blockingSoIdCompany = getBlockingCompany.length
            ? getBlockingCompany.map(row => row.company_id).join(', ')
            : '0';

        try {

            if (req.dataToken.user_id) {
                // let { company_id } = req.body 

                let query = `
                                                            
                      WITH ApprovedSO AS (
    -- This CTE finds all approved Sales Orders that are not cancelled.
    -- The INNER JOINs here are efficient because we only want orders that meet all criteria.
    SELECT
        so.e_order,
        so.so_id
    FROM
        trs_sales_order so
    INNER JOIN trs_approval ta ON
        so.so_id = ta.key AND so.company_id = ta.company_id
    INNER JOIN trs_approval_event tae ON
        so.approval_id = tae.appr_id AND so.company_id = tae.company_id
    WHERE
        so.cancel = 0
      AND tae.id = 4                -- Specific approval event
      AND tae.appr_date IS NOT NULL -- The approval has been dated
)
-- Main Query
SELECT DISTINCT -- Consider removing DISTINCT if you can resolve the source of duplicates
    det.order_id,
    det.company_id,
    mco.company_name,
    det.created_by,
    su.firstname,
    CASE WHEN det.cont_size = 8 THEN ms.detail_id ELSE det.detail_id END AS detail_id,
    mc.container_name,
    CASE WHEN det.cont_qty = 0 THEN 1 ELSE det.cont_qty END AS cont_qty,
    -- SKU 1 details
    CASE WHEN det.cont_size = 8 THEN ms.sku ELSE det.sku1 END AS sku1,
    CASE WHEN det.cont_size = 8 THEN COALESCE(mps.product_name_no, mps.product_name) ELSE COALESCE(mp1.product_name_no, mp1.product_name) END AS product_name_1,
    CASE WHEN det.cont_size = 8 THEN mpls.img ELSE mpl1.img END AS url_1,
    CASE WHEN det.cont_size = 8 THEN ms.qty ELSE det.qty1 END AS qty1,
    det.price1,
    CASE WHEN det.cont_size = 8 THEN mps.product_sku ELSE mp1.product_sku END AS prod_sku_1,
    -- SKU 2 details
    det.sku2,
    COALESCE(mp2.product_name_no, mp2.product_name) AS product_name_2,
    mpl2.img AS url_2,
    det.qty2,
    det.price2,
    mp2.product_sku AS prod_sku_2,
    -- SKU 3 details
    det.sku3, -- Original query had det.sku2 here, assuming it was a typo for sku3
    COALESCE(mp3.product_name_no, mp3.product_name) AS product_name_3,
    mpl3.img AS url_3,
    det.qty3,
    det.price3,
    mp3.product_sku AS prod_sku_3,
    det.remarks,
    det.bulk,
    -- Simplified so_id logic using the CTE
    CASE WHEN det.company_id NOT IN (${blockingSoIdCompany}) THEN COALESCE(approved_so.so_id, '') ELSE '' END AS so_id
FROM
    m_order_dtl det
INNER JOIN m_order mo ON
    mo.order_id = det.order_id
INNER JOIN mst_company mco ON
    det.company_id = mco.company_id
LEFT JOIN sys_user su ON
    su.user_id = det.created_by
LEFT JOIN mst_container mc ON
    mc.container_id = det.cont_size
-- Joins for SKU 1 based on container size
LEFT JOIN mst_product mp1 ON
    det.sku1 = mp1.product_code AND det.cont_size <> 8
LEFT JOIN m_product_link mpl1 ON
    det.sku1 = mpl1.product_code AND det.cont_size <> 8
-- Joins for Summary SKU based on container size
LEFT JOIN m_summary ms ON
    mo.order_id = ms.order_id AND det.cont_size = 8
LEFT JOIN mst_product mps ON
    ms.sku = mps.product_code AND det.cont_size = 8
LEFT JOIN m_product_link mpls ON
    ms.sku = mpls.product_code AND det.cont_size = 8
-- Joins for SKU 2 & 3
LEFT JOIN mst_product mp2 ON
    det.sku2 = mp2.product_code
LEFT JOIN m_product_link mpl2 ON
    det.sku2 = mpl2.product_code
LEFT JOIN mst_product mp3 ON
    det.sku3 = mp3.product_code
LEFT JOIN m_product_link mpl3 ON
    det.sku3 = mpl3.product_code
-- Join our pre-filtered approved sales orders
LEFT JOIN ApprovedSO approved_so ON
    mo.order_id = approved_so.e_order
WHERE
    det.order_id = ${order_id} ;
                        `

                let parameter = [order_id]

                dbConf.query(query, parameter, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error getOneOrderDetail: " + err);
                    } else {
                        res.status(200).send(results);
                        log.eorder.info("getOneOrderDetail success");
                    }
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })
            }

        } catch (error) {
            log.eorder.error("Exception in getOneOrderDetail: " + error);
            res.status(500).send(error);
        }



    },
    getOneOrderDetailRealization: async (req, res) => {


        let order_id = req.params.order_id
        //untuk menghilangkan week tertentu.
        let getBlockingCompany = (await dbQuery(`select company_id from special_t_condition mcn where conditions = 12;`));
        // Error prevention: Check if getBlockingCompany is not empty and has the value you expect
        let blockingSoIdCompany = getBlockingCompany.length
            ? getBlockingCompany.map(row => row.company_id).join(', ')
            : '0';

        try {

            if (req.dataToken.user_id) {
                // let { company_id } = req.body 

                let query = `
                    select
                        distinct det.order_id,
                        det.company_id,
                        mco.company_name,
                        det.created_by,
                        su.firstname,
                        tr.so_id,
                        DATE_FORMAT(trd.delv_date, '%d-%b-%Y') delv_date,
                        tr.ship_name vessel_name,
                        tr.ship_line shipping_line,
                        tr.cont_id,
                        COALESCE(mp.product_name_no, mp.product_name) product_name,
                        trd.qty, 
                        DATE_FORMAT(COALESCE(trs.atd, tr.etd), '%d-%b-%Y') etd,
                        DATE_FORMAT(COALESCE(trs.ata, tr.eta), '%d-%b-%Y') eta
                    from
                        m_order_dtl det
                    join mst_company mco on
                        det.company_id = mco.company_id
                    left join sys_user su on
                        su.user_id = det.created_by
                    left join trs_sales_order so on
                        det.order_id = so.e_order
                        and so.cancel = 0
                    left join trs_realization tr on
                        so.so_id = tr.so_id    
                    left join iod.trs_realization_searates trs on
                        trs.so_id = tr.so_id and trs.invoice_id = tr.invoice_id
                    left join trs_realization_detail trd on
                        tr.cont_id = trd.cont_id
                        and tr.so_id = trd.so_id
                        and tr.invoice_id = trd.invoice_id
                    left join mst_product mp on
                        trd.sku = mp.product_code    
                    left join trs_approval_event tae on
                        so.approval_id = tae.appr_id
                        and tae.company_id = so.company_id
                        and tae.id = 4
                    where
                    det.order_id = ?`

                let parameter = [order_id]

                dbConf.query(query, parameter, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error getOneOrderDetailRealization: " + err);
                    } else {
                        res.status(200).send(results);
                        log.eorder.info("getOneOrderDetailRealization success");
                    }
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })
            }

        } catch (error) {
            log.eorder.error("Exception in getOneOrderDetailRealization: " + error);
            res.status(500).send(error);
        }



    },
    getOneOrderAllNoToken: async (req, res) => {

        let order_id = req.params.order_id

        log.eorder.info("order_id: " + order_id)
        //untuk menghilangkan week tertentu.
        let getBlockingCompany = (await dbQuery(`select company_id from special_t_condition mcn where conditions = 12;`))[0];

        // Error prevention: Check if getBlockingCompany is not empty and has the value you expect
        let blockingSoIdCompany = getBlockingCompany && getBlockingCompany.company_id ? getBlockingCompany.company_id : 0;
        try {

            let queryHeader = ` 
                        select
                        distinct 
                        mo.order_id,
                        mco.company_name,
                        mo.delv_week,
                        mo.delv_week_desc,
                        DATE_FORMAT(mo.stuffing_date, '%b %d, %Y') Stuffing_date_format,
                        mo.stuffing_date,
                        mo.final_dest,
                        mo.delv_year,
                        mo.po_buyer,
                        concat(mh.harbour_name, ", " , st.txt ) port_shipment,
                        mo.ship_to,
                        stp.company_name ,
                        stpa.street,
                        stpa.complex,
                        stpa.city,
                        stpc.country_desc as country,
                        mo.po_buyer,
                        stp.company_name ship_to,
                        mo.po_url,
                        mo.created_by as creator_id,
                        concat(su.firstname, ' ', su.lastname ) created_by,
                        mso.status_order status_name,
                        mso.notes status_detail,
                        mso.id is_status,
                        mct.container_name,
                        minc.incoterm_name,
                        case
                            when md.cont_qty = 0 then 1
                            else md.cont_qty
                        end cont_qty,
                        DATE_FORMAT(mo.po_date, '%b %d, %Y') created_date,
                        mo.po_date,
                        mo.tolling_id,
                        md.cont_size,
                        btp.company_name as bill_to_name,
                        btpa.street as bill_to_street,
                        btpa.complex as bill_to_complex,
                        btpa.city as bill_to_city,
                        btc.country_desc as bill_to_country,
                        mo.bill_to,
                        CASE 
                            WHEN ntp1.company_notice IS NOT NULL 
                                AND ntp1.company_notice <> '' 
                            THEN CONCAT(ntp1.company_name, ' - ', ntp1.company_notice)
                            ELSE ntp1.company_name
                        END AS notify1_name,
                        mo.notify1,
                        CASE 
                            WHEN ntp2.company_notice IS NOT NULL 
                                AND ntp2.company_notice <> '' 
                            THEN CONCAT(ntp2.company_name, ' - ', ntp2.company_notice)
                            ELSE ntp2.company_name
                        END AS notify2_name,
                        mo.notify2
                    from
                        m_order mo
                    join mst_company mco on
                        mo.company_id = mco.company_id
                    left join map_port_for_dist mpfd on
                        mo.port_shipment = mpfd.id
                        and mo.company_id = mpfd.distributor_id
                    left join mst_company stp on
                        stp.company_id = mo.ship_to
                    left join address stpa on
                        stp.address_id = stpa.address_id      
                    left join mst_country stpc on
                        stpa.country = stpc.iso_code collate utf8mb4_general_ci
                    left join sys_user su on
                        su.user_id = mo.created_by
                    left join m_order_status mso on
                        mo.status = mso.id
                    left join m_order_dtl md on
                        md.order_id = mo.order_id
                    left join mst_container mct on
                        md.cont_size = mct.container_id
                    left join mst_harbour mh on
                        mpfd.harbour_id = mh.harbour_id
                    left join mst_incoterm minc on
                        mpfd.incoterm_id = minc.id    
                    left join mst_country mc on
                        mh.country_id = mc.country_id
                    left join sys_text st on
                        mc.country_name_id = st.text_id
                        and st.lang_id = 1
                    left join mst_company btp on
                        mo.bill_to = btp.company_id
                    left join address btpa on
                        btp.address_id = btpa.address_id
                    left join mst_country btc on
                        btpa.country = btc.iso_code     collate utf8mb4_general_ci
                    left join mst_company ntp1 on
                        mo.notify1 = ntp1.company_id
                        and ntp1.company_type_id = 7
                    left join mst_company ntp2 on
                        mo.notify2 = ntp2.company_id
                        and ntp2.company_type_id = 7
                     where   
                    mo.order_id = ?   `


            let queryDetail = `
                    select
                        distinct
                                            det.order_id,
                        det.company_id,
                        mco.company_name,
                        det.created_by,
                        su.firstname,
                        case
                                                when det.cont_size = 8 then ms.detail_id
                            else det.detail_id
                        end detail_id,
                        mc.container_name,
                        case
                            when det.cont_qty = 0 then 1
                            else det.cont_qty
                        end cont_qty,
                        case
                            when det.cont_size = 8 then ms.sku
                            else det.sku1
                        end sku1,
                        case
                            when det.cont_size = 8 then coalesce(mps.product_name_no, mps.product_name)
                            else coalesce(mp1.product_name_no, mp1.product_name)
                        end product_name_1,
                        case
                            when det.cont_size = 8 then mpls.img
                            else mpl1.img
                        end url_1,
                        case
                            when det.cont_size = 8 then ms.qty
                            else det.qty1
                        end qty1,
                        det.price1,
                        case
                            when det.cont_size = 8 then mps.product_sku
                            else mp1.product_sku
                        end prod_sku_1,
                        det.sku2,
                        coalesce(mp2.product_name_no, mp2.product_name) product_name_2,
                        mpl2.img url_2,
                        det.qty2,
                        det.price2,
                        mp2.product_sku prod_sku_2,
                        det.sku2,
                        coalesce(mp3.product_name_no, mp3.product_name) product_name_3,
                        mpl3.img url_3,
                        det.qty3,
                        det.price3,
                        mp3.product_sku prod_sku_3,
                        det.remarks,
                        det.bulk,
                        CASE 
                        WHEN det.company_id NOT IN (${blockingSoIdCompany}) THEN so.so_id
                            ELSE ''
                        END AS so_id
                    from
                        m_order_dtl det
                    inner join m_order mo on
                        mo.order_id = det.order_id
                    join mst_company mco on
                        det.company_id = mco.company_id
                    left join sys_user su on
                        su.user_id = det.created_by
                    left join mst_container mc on
                        mc.container_id = det.cont_size
                    left join mst_product mp1 on
                        det.sku1 = mp1.product_code
                    left join mst_product mp2 on
                        det.sku2 = mp2.product_code
                    left join mst_product mp3 on
                        det.sku3 = mp3.product_code
                    left join m_product_link mpl1 on
                        det.sku1 = mpl1.product_code
                    left join m_product_link mpl2 on
                        det.sku2 = mpl2.product_code
                    left join m_product_link mpl3 on
                        det.sku3 = mpl3.product_code
                    left join m_summary ms on
                        mo.order_id = ms.order_id
                    left join mst_product mps on
                        ms.sku = mps.product_code
                    left join m_product_link mpls on
                        ms.sku = mpls.product_code
                    left join trs_sales_order so on
                        mo.order_id = so.e_order
                        and 
                        so.cancel = 0
                    left join special_t_condition msc on
                        msc.company_id = det.company_id
                    WHERE
                        det.order_id = ?`

            const [headerData, detailsData] = await Promise.all([
                dbQuery(queryHeader, [order_id]),
                dbQuery(queryDetail, [order_id])
            ]);


            res.status(200).json({
                header: headerData[0] || {},
                details: detailsData
            });



        } catch (error) {
            log.eorder.info(error);
            res.status(500).send(error);
        }



    },
    // addOrderHeader: [ARCHIVED],
    // addOrderDetail: [ARCHIVED],
    // addOrderSummary: [ARCHIVED],
    stuffingWeek: async (req, res, test = false) => {
        try {
            const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            });

            // ===============================
            // AUTH / CONFIG
            // ===============================
            const company_id = test ? 101 : req?.dataToken?.company_id;
            const user_id = test ? 1098 : req?.dataToken?.user_id ?? 0;


            if (!req?.dataToken && !test) {
                return res.status(401).send({
                    success: false,
                    message: "Unauthorized — missing token or company_id",
                });
            }

            // ===============================
            // YEAR RANGE (CURRENT + NEXT)
            // ===============================
            const currentYear = new Date().getFullYear();
            const years = [currentYear, currentYear + 1];

            // ===============================
            // CONFIG VALUES
            // ===============================
            const getWeekLimit = (await dbQuery(`
            SELECT value 
            FROM special_t_condition 
            WHERE conditions = 9
              AND company_id = ${company_id}
              AND active = 1
            LIMIT 1
        `))[0];

            const getWeekBlock = await dbQuery(`
            SELECT value 
            FROM special_t_condition
            WHERE conditions = 21
              AND (company_id = ${company_id} OR company_id = 100)
              AND active = 1
        `);

            const blockedWeeks = getWeekBlock.map(r => Number(r.value));
            const weekLimit = getWeekLimit ? Number(getWeekLimit.value) : 13;

            // ===============================
            // TODAY / CURRENT WEEK
            // ===============================
            const todayOpcal = await dbQuery(`
            SELECT opcal_id 
            FROM dat_operational_calendar
            WHERE DATE(FROM_UNIXTIME(CONCAT(opcal_id, '00'))) = CURDATE()
            LIMIT 1
        `);

            const todayCalId = todayOpcal[0]?.opcal_id ?? null;

            const todayWeekRow = todayCalId
                ? await dbQuery(`
                SELECT week,delivery_week 
                FROM dat_operational_calendar
                WHERE opcal_id = ${todayCalId}
                and
                year = ${currentYear}
                LIMIT 1
            `)
                : [];

            const currentWeek = todayWeekRow[0]?.week ?? 0;
            const DeliveryWeek = todayWeekRow[0]?.delivery_week ?? 0;



            // ===============================
            // GET UNIQUE WEEKS (BOTH YEARS)
            // ===============================
            const calendarData = await dbQuery(`
            SELECT 
                year,
                week,
                MIN(concat(opcal_id, '00')) AS first_opcal
            FROM dat_operational_calendar
            WHERE year IN (${years.join(",")})
              AND factory_id = 1
              AND product_type_id = 256
            GROUP BY year, week
            ORDER BY year, first_opcal
        `);

            if (!calendarData.length) {
                return res.status(200).send({ success: true, weeksList: [] });
            }

            // ===============================
            // START WEEK = currentWeek + 5
            // ===============================
            let startWeek = currentWeek + DeliveryWeek;
            if (startWeek > 52) startWeek -= 52;
            log.eorder.info("currentWeek: " + currentWeek);
            log.eorder.info("DeliveryWeek: " + DeliveryWeek);
            log.eorder.info("startWeek: " + startWeek);
            log.eorder.info("todayOpcal: " + JSON.stringify(todayOpcal));
            // ===============================
            // SORT & ROTATE WEEKS
            // ===============================
            const orderedWeeks = calendarData
                .sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return a.week - b.week;
                });

            let rotated = [
                ...orderedWeeks.filter(w => w.week >= startWeek),
                ...orderedWeeks.filter(w => w.week < startWeek),
            ];

            // ===============================
            // APPLY BLOCK + LIMIT
            // ===============================
            rotated = rotated.filter(w => !blockedWeeks.includes(w.week));
            rotated = rotated.slice(0, weekLimit);

            // ===============================
            // BUILD RESPONSE
            // ===============================
            const weeksList = [];

            for (let i = 0; i < rotated.length; i++) {
                const curr = rotated[i];
                const next = rotated[i + 1];

                const minDateObj = new Date(curr.first_opcal * 1000);
                if (minDateObj.getDay() === 0) {
                    minDateObj.setDate(minDateObj.getDate() + 1);
                }

                const minDate = DATE_FORMATTER.format(minDateObj);

                let maxDateObj;
                if (next) {
                    maxDateObj = new Date(next.first_opcal * 1000);
                    maxDateObj.setDate(maxDateObj.getDate() - 1);
                } else {
                    maxDateObj = new Date(minDateObj);
                    maxDateObj.setDate(maxDateObj.getDate() + 6);
                }

                const maxDate = DATE_FORMATTER.format(maxDateObj);

                weeksList.push({
                    opcal_id: curr.first_opcal,
                    id: `${curr.year}${String(curr.week).padStart(2, "0")}`,
                    year: curr.year,
                    week: curr.week,
                    startingDate: minDate,
                    endingDate: maxDate,
                });
            }

            return res.status(200).send({
                success: true,
                weeksList,
            });

        } catch (err) {
            log.eorder.error("Exception in stuffingWeek: " + err);
            return res.status(500).send({
                success: false,
                message: err.message,
            });
        }
    },
    addOrder: async (req, res, next) => {


        let { user_id, company_id, active } = req.dataToken;
        let order = req.body.order || (Array.isArray(req.body) ? req.body : null);

        if (!order || order.length === 0) {
            return res.status(400).json({
                success: false,
                message: !order ? "Invalid request: missing order data." : "Invalid request: order list cannot be empty."
            });
        }

        log.eorder.info("Received Orders: " + JSON.stringify(order));

        let orderList = []

        //query mendapatkan order_id terakhir dari database 
        const generateOrderId = async (year) => {
            let currentYear = year || new Date().getFullYear();
            let yearPrefix = String(currentYear).slice(2, 4);
            let latestOrder = await dbQuery(`
                SELECT MAX(order_id) AS latest FROM (
                    SELECT order_id FROM m_order WHERE company_id = ${company_id} AND delv_year = ${currentYear}
                    UNION ALL  
                    SELECT order_id FROM m_order_dtl WHERE company_id = ${company_id} AND delv_year = ${currentYear}
                    UNION ALL 
                    SELECT order_id FROM m_summary WHERE company_id = ${company_id}
                ) AS all_orders;
            `);

            let latestId = latestOrder[0]?.latest || null;

            return latestId ? parseInt(latestId) : parseInt(`${yearPrefix}00${company_id}00000`);
        };

        async function emergencyDeleteOrder(order, last_order_id) {
            const queryEmergencyDeleteOrder = 'CALL delete_order(?);';
            log.eorder.info("order_id delete list: " + JSON.stringify(orderList));

            await Promise.all(orderList.map(order_id =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        let parameterEmergencyDeleteOrder = [order_id];

                        dbConf.query(queryEmergencyDeleteOrder, parameterEmergencyDeleteOrder, async (err, results) => {
                            if (err) {
                                log.eorder.error("Cannot delete order for order_id " + order_id);
                            } else {
                                addSqlLogger(req.dataToken.user_id, `${queryEmergencyDeleteOrder} + ${order_id}`, results, `DELETE error order_id-${order_id}`);
                                log.eorder.info("just ran emergency delete order for order_id " + order_id);
                            }
                            resolve();
                        });

                    }, 3000);
                })
            ));
        }


        /**
         * 
         * @param {number} orderIndex - order index secara global
         * @param {number} detailIndex - detail index dari function
         * @param {number} detailLength - detail length fixed
         * @param {number} summaryIndex - summary index dari function
         * @param {number} summaryLenth - summary length fixed
         * @param {number} order_id - order_id untuk mailer
         */
        function checkStatusInsert(orderIndex, detailIndex, detailLength, summaryIndex, summaryLenth, order_id) {

            let dataLength = order.length

            // if ((orderIndex === order.length) && (order_data.detail.length === detail.detail_id) && (order_data.summary.length === summary.detail_id)) {
            // if ((orderIndex === order.length) && (detailIndex === detailLength) && (summaryIndex === summaryLenth)) {
            log.eorder.info(`==========> add Order is success`)

            // orderRecievedMailSender(user_id, req.dataToken.employee_id, order_id)
            res.status(200).send({
                success: true,
                message: 'All order has been added. check transaction list'
            })
            // }

            // console.log({ orderIndex, dataLength, detailIndex, detailLength, summaryIndex, summaryLenth })
        }

        // try {

        if (req.dataToken.active === 1 && order) {


            try {

                let order_id_raw = await generateOrderId(order[0].delv_year);

                let orderIndex = 0

                for (const order_data of order) {

                    //order_data adalah alias untuk tiap2 object yang ada dalam array 

                    orderIndex++

                    // let order_id = await generate_order_id()
                    let order_id = order_id_raw + orderIndex;
                    orderList.push(order_id);
                    log.eorder.info("==================NEW ORDER======================")

                    log.eorder.info("orderIndex: " + orderIndex)
                    log.eorder.info("order_id: " + order_id)

                    //object destructuring karena akan dideclare secara global
                    let {
                        // // user_id dan company_id diprovide dari data token
                        // user_id, 
                        // company_id, 
                        // delv_week,
                        // delv_week_desc,
                        delv_year, po_buyer,
                        port_shipment, ship_to, po_url

                    } = order_data;

                    log.eorder.info("Po_Buyer: " + po_buyer)


                    const date = new Date();
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');

                    let formattedDate = `${year}-${month}-${day}`;

                    //penentuan  isi variabel delv_week
                    let delv_week = order_data.delv_week ? order_data.delv_week : (await dbQuery(`SELECT day2week('${order_data.stuffing_date}') AS wikwik;`))[0].wikwik;
                    let delv_week_desc = order_data.delv_week_desc ? order_data.delv_week_desc : `Week: ${(await dbQuery(`SELECT day2week('${order_data.stuffing_date}') AS wikwik;`))[0].wikwik} Date: ${order_data.stuffing_date} `


                    let stuffing_date_rev = order_data.stuffing_date ? order_data.stuffing_date : formattedDate;
                    let final_dest = order_data.final_dest ? order_data.final_dest : '-';

                    let notify_to_1 = order_data.notify_to_1 ? order_data.notify_to_1 : null;
                    let notify_to_2 = order_data.notify_to_2 ? order_data.notify_to_2 : null;
                    let bill_to = order_data.bill_to ? order_data.bill_to : null;

                    let specialCondition = await dbQuery(`SELECT COALESCE(mcn.conditions, 0) container FROM special_t_condition mcn WHERE mcn.conditions = 8 AND mcn.company_id = ${company_id}`);
                    let number = await dbQuery(`SELECT company_number  FROM mst_company mc WHERE company_id = ${company_id}`);
                    // let selectWeek = order_data.stuffing_date ? await (dbQuery(`CALL day2week(${order_data.stuffing_date}, @wikwik);`)) : delv_week;

                    log.eorder.info("final_dest: " + final_dest)

                    let checkCondition = specialCondition[0] ? specialCondition[0].container : '';
                    let checkNumber = number[0] ? number[0].company_number : '';
                    let tolling_id = order_data.tolling_id ? order_data.tolling_id : 0;

                    let po_buyer_pcl = checkCondition == 8 && checkNumber ? 'ND/' + checkNumber + '/' + po_buyer : '';

                    let query = `
                                    INSERT INTO m_order 
                                    (order_id, company_id, delv_week, delv_week_desc, 
                                    delv_year,  po_buyer, stuffing_date,
                                    po_date, port_shipment, ship_to, po_url,
                                    created_by, status, tolling_id, po_buyer_pcl, final_dest, 
                                    bill_to, notify1, notify2)
                                    VALUES
                                    (?, ?, ?, ?, 
                                    ?, ?, ?,
                                    now(), ?, ?, ?,
                                    ?, 0, ?, ?, ?,
                                    ?,?,?
                                    );  
                                    `;

                    let parameter = [
                        order_id, company_id, delv_week, delv_week_desc,
                        delv_year, po_buyer, stuffing_date_rev,
                        port_shipment, ship_to, po_url,
                        user_id, tolling_id, po_buyer_pcl, final_dest,
                        bill_to, notify_to_1, notify_to_2
                    ];

                    await dbQuery(query, parameter);

                    // log.eorder.info("order_data.detail ", order_data.detail)
                    for (const detail of (order_data.detail)) {
                        log.eorder.info(`Detail - SKU1: ${(detail.Flavour[0]?.sku > 1 ? detail.Flavour[0].sku : 0)}, Qty1: ${(detail.Flavour[0]?.qty > 1 ? detail.Flavour[0].qty : 0)}, SKU2: ${(detail.Flavour[1]?.sku > 1 ? detail.Flavour[1].sku : 0)}, Qty2: ${(detail.Flavour[1]?.qty > 1 ? detail.Flavour[1].qty : 0)}, SKU3: ${(detail.Flavour[2]?.sku > 1 ? detail.Flavour[2].sku : 0)}, Qty3: ${(detail.Flavour[2]?.qty > 1 ? detail.Flavour[2].qty : 0)}`);
                        let queryDetail = `
                                            INSERT INTO m_order_dtl
                                            (order_id, company_id, created_by, detail_id, 
                                                cont_size, cont_qty, 
                                                sku1, sku2, sku3, 
                                                qty1, qty2, qty3, 
                                                price1, price2, price3, 
                                                remarks, bulk, delv_week, delv_year,
                                                custom
                                                )
                                                VALUES
                                                (?, ?, ?, ?, 
                                                    ?, ?, 
                                                    ?, ?, ?, 
                                                    ?, ?, ?, 
                                                    ?, ?, ?,
                                                    ?, ?, ?, ?,
                                                    ?
                                                    );
                                                    
                                                    `

                        let customInInteger;
                        if (detail.custom === false) {
                            customInInteger = 0;
                        } else {
                            customInInteger = 1;
                        }

                        let parameterDetail = [
                            order_id, company_id, user_id, detail.detail_id,
                            detail.cont_size, detail.cont_qty,
                            (detail.Flavour[0] ? (detail.Flavour[0].sku > 1 ? detail.Flavour[0].sku : 0) : 0), (detail.Flavour[1] ? (detail.Flavour[1].sku > 1 ? detail.Flavour[1].sku : 0) : 0), (detail.Flavour[2] ? (detail.Flavour[2].sku > 1 ? detail.Flavour[2].sku : 0) : 0),
                            (detail.Flavour[0] ? (detail.Flavour[0].qty > 1 ? detail.Flavour[0].qty : 0) : 0), (detail.Flavour[1] ? (detail.Flavour[1].qty > 1 ? detail.Flavour[1].qty : 0) : 0), (detail.Flavour[2] ? (detail.Flavour[2].qty > 1 ? detail.Flavour[2].qty : 0) : 0),
                            0, 0, 0,
                            order_data.remarks, detail.bulk, delv_week, delv_year,
                            customInInteger
                        ]

                        await dbQuery(queryDetail, parameterDetail);

                    }
                    // //melakukan loop sesuai dengan jumlah data dalam summary
                    for (const summary of (order_data.summary)) {
                        log.eorder.info("summary: " + JSON.stringify(summary));
                        let querySummary = `
                                INSERT INTO m_summary
                                (order_id, company_id, po_buyer, detail_id,
                                sku, qty, remarks, delv_date)
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?, ?); 
                                `
                        let parameterSummary = [order_id, company_id, po_buyer, summary.detail_id, summary.sku, summary.qty, order_data.remarks, stuffing_date_rev];

                        // addSqlLogger(user_id, (querySummary.concat(parameterSummary)), `insert query results`, `addOrderDetail-${order_id}-${summary.detail_id}`)
                        await dbQuery(querySummary, parameterSummary);


                    }
                    // Insert SO after details are successfully added
                    let queryInsertSO = `CALL insert_so_single(?);`;
                    let paramInsertSO = [order_id];
                    await dbQuery(queryInsertSO, [order_id]);

                };

                log.eorder.info(`==========> add Order is success`)

                orderList.forEach((order_id) => {
                    orderRecievedMailSender(user_id, req.dataToken.employee_id, order_id, company_id);
                });

                res.status(200).send({
                    success: true,
                    message: 'All order has been added. check transaction list'
                })
            }
            catch (error) {
                emergencyDeleteOrder(order);
                log.eorder.error("Exception in addOrder: " + error);
                // addSqlLogger(user_id, `no query`, `insert query results`, `FAILED addOrderDetail-${order}`)
                res.status(500).send({
                    success: false,
                    message: error
                })
                next(error);

            } finally {
                log.eorder.info("================================================")

            }

        } else {

            res.status(401).send({
                success: false,
                message: "user is not active or data is not available. cannot insert order"
            });
            log.eorder.warn(`add Order is inactive. Order is not inserted`);
        }
    },



    getOrder_id: async (req, res) => {


        try {

            let year = req.query.year ? req.query.year : parseInt((new Date()).getFullYear())

            if (req.dataToken.user_id) {

                let query = `SELECT MAX(order_id) AS LATEST 
                                FROM (
                                SELECT order_id FROM m_order WHERE company_id = ${req.dataToken.company_id} AND delv_year = ${year}
                                UNION ALL 
                                SELECT order_id FROM m_order_dtl WHERE company_id = ${req.dataToken.company_id} AND delv_year = ${year}
                                UNION ALL  
                                SELECT order_id FROM m_summary WHERE company_id = ${req.dataToken.company_id} 
                                )AS combined_values;`;

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.info("Error get order id", err)
                    } else {
                        res.status(200).send(results);
                        log.eorder.info(`get order_id for ${req.dataToken.user_id} & ${year}: ${results[0].LATEST}`);
                        addSqlLogger(req.dataToken.user_id, (query), (JSON.stringify(results)), 'getOrder_id')
                    }
                }
                )
            } else {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })
            }


        } catch (error) {
            log.eorder.error("Exception in getOrder_id: " + error);
            res.status(500).send(error);
        }
    },
    getExistPo: async (req, res) => {


        try {
            if (req.dataToken.company_id) {
                let query = `SELECT po_buyer FROM m_order WHERE company_id = ${req.dataToken.company_id} AND status IN (0, 1, 2, 3, 66); `;

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.info("Error get order id", err)
                    } else {
                        res.status(200).send(results);
                        log.eorder.info(`get exsiting_po for ${req.dataToken.user_id}`);
                        addSqlLogger(req.dataToken.user_id, (query), `--data getExistPo`, 'getExistPo')
                    }
                }
                )
            } else {

                res.status(200).send({
                    success: false,
                    message: 'unauthorized'
                })
            }
        } catch (error) {
            log.eorder.error("Exception in getExistPo: " + error);
            res.status(500).send(error);
        }
    },
    getContainer: async (req, res) => {

        try {

            if (req.dataToken.company_id) {

                let query = `SELECT mc.container_id, mc.container_name 
                FROM map_cont_for_dist mcfd LEFT JOIN mst_container mc ON mcfd.cont_type & mc.container_id 
                WHERE mcfd.company_id = 100 AND mcfd.dist_id = ${req.dataToken.company_id};`;

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.error("Error get Order container limiter: " + err);
                    } else {
                        res.status(200).send(results);
                        log.eorder.info(`get Order container limiter for ${req.dataToken.user_id}`);
                        //addSqlLogger(req.dataToken.user_id, (query), '--data getContainer', 'getContainer')
                    }
                }
                )
            } else {
                res.status(200).send({
                    success: false,
                    message: 'unauthorized'
                })
            }
        } catch (error) {
            log.eorder.error("Exception in getContainer: " + error);
            res.status(500).send(error);
        }
    },
    cancelOrder: async (req, res) => {
        const redcolor = "\x1b[31m";


        if (req.dataToken.user_id) {

            let remarks = (await dbQuery(`SELECT remarks FROM m_order_dtl WHERE order_id = ${req.body.order_id}`))[0].remarks

            let query = `
                UPDATE m_order
                SET status = 77
                WHERE order_id = ?;
            
            UPDATE m_order_dtl
            SET remarks =  ? 
            WHERE order_id = ?;
            
            UPDATE trs_sales_order
            SET cancel = 1, reason_id = 99
            WHERE e_order = ?;
            `
            let parameter = [
                req.body.order_id,
                (remarks.concat(`[CANCELED FOR REASON: ${req.body.cancelRemark}]`)),
                req.body.order_id,
                req.body.order_id
            ];

            dbConf.query(query, parameter,
                (err, results) => {

                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: 'Failed when cancel order'
                        });
                        log.eorder.info(`cancel order  ${req.body.order_id} error ${err}`);
                    } else {
                        log.eorder.info(`cancel order  ${req.body.order_id} success`);

                        res.status(200).send(
                            {
                                success: true,
                                message: 'Your cancel request has been sent!'
                            }
                        );
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), 'addCancelOrder')

                    }
                }
            )

        } else {
            res.status(401).send({
                success: false,
                message: 'Unauthorized!'
            });
        }

    },
    uploadFile: async (req, res) => {


        if (req.dataToken.user_id) {
            try {
                let fileIsExist = req.files[0]
                let fileUrl = `/files/PoFile/${req.files[0].filename}`
                let fileOriginalName = `${req.files[0].originalname}`
                // if (fileIsExist) {
                res.status(200).send({
                    fileUrl,
                    fileOriginalName,
                    message: 'upload success!'
                });
                addSqlLogger(req.dataToken.user_id, '-- no query on upload file', fileUrl, 'uploadFile')
            } catch (error) {
                res.status(500).send(
                    {
                        error,
                        message: 'something error while upload files :('
                    }
                );
                log.eorder.info("Error upload files:", error);
                fs.unlinkSync(`.public/files/PoFile/${req.files[0].filename}`)
            }
        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }


    },
    deleteFile: async (req, res) => {

        //depereced

        if (req.dataToken.user_id) {
            try {

                fs.unlinkSync(`./public${req.body.po_url}`)

                res.status(200).send({
                    message: 'Delete po file success!'
                });
                log.eorder.info("Order Delete upload files Success:", error);
            } catch (error) {

                res.status(500).send({
                    message: 'Delete failed :('
                });

                log.eorder.info("Order Error delete files:", error);
            }
        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }
    },
    // getPI: [ARCHIVED],
    // getOrderDetailTolling: [ARCHIVED],
    // addOrderDetailTolling: [ARCHIVED],
    getStuffingDateTrucking: async (req, res) => {



        let limit = req.params.limit ? req.params.limit : 5

        if (req.dataToken.active === 1) {

            //update to activate trucing 
            let query = `
            SELECT
            CASE
                WHEN DAY(NOW()) > 20 THEN DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 MONTH), '%Y-%m-01')
                ELSE DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
            END AS min_date,
            CASE
                WHEN DAY(NOW()) > 20 THEN DATE_FORMAT(LAST_DAY(DATE_ADD(NOW(), INTERVAL 2 MONTH)), '%Y-%m-%d')
                ELSE DATE_FORMAT(LAST_DAY(DATE_ADD(NOW(), INTERVAL 1 MONTH)), '%Y-%m-%d')
            END AS max_date;
            `;

            let parameter = [limit];

            dbConf.query(query, parameter, async (err, results) => {

                if (err) {
                    res.status(500).send(err);
                    log.eorder.info("Error Push getStuffingDateTrucking", err)
                } else {
                    //END CONNECTION
                    res.status(200).send(results);
                    log.eorder.info(`add Order getStuffingDateTrucking  success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), '--data stuffingdate trucking', `getStuffingDateTrucking-${req.dataToken.uid}`)
                }

            });

        } else {
            res.status(401).send("Unauthorized");
            log.eorder.info(`add Order addOrderDetailTolling   UNAUTHORIZE`);
        }
    },
    // containerTracking: [ARCHIVED],
    mailerAPI: async (req, res) => {
        let { order_id, user_id, employee_id, company_id } = req.body;
        if (order_id) {
            orderRecievedMailSender(user_id, employee_id, order_id, company_id);
            res.status(200).send({
                success: true,
                message: 'email has been sent'
            })
            log.eorder.info(" mailerAPI: Executing mailer function ")
        } else {
            res.status(500).send({
                success: false,
                message: 'order_id is empty'
            })
            log.eorder.info(" FAILED at mailerAPI: order_id is not provided ")
        }
    },
    // checkOrderReal: [ARCHIVED],
    // saveSseaRates: [ARCHIVED]
}