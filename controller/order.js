const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const fs = require('fs')
const { orderRecievedMailSender } = require('../mailer/eorder/eorder_mailer');
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


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

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

        // console.log(timestamp, "getOrderAllIn",
        //     {
        //         page, limit, order_by_week, desc, status, stuffingstart, stuffingend, range, find
        //     }, "query: ", query)

        /*
        let query = ` SELECT distinct 
                    mo.order_id, mco.company_name, mo.delv_week, mo.delv_week_desc, mpfd.final_dest, mo.delv_year,
                    mo.po_buyer, concat(mh.harbour_name, ", " ,st.txt ) port_shipment, mo.ship_to, stp.company_name ,mo.po_buyer, stp.company_name ship_to, 
                    mo.po_url, concat(su.firstname, ' ', su.lastname ) created_by, mso.status_order status_name, mso.notes status_detail, mso.id is_status,
                    mct.container_name, md.cont_qty, DATE_FORMAT(mo.po_date,'%d-%b-%Y %T ') created_date, mo.tolling_id, md.cont_size
                    FROM 
                    m_order mo
                    JOIN mst_company mco ON mo.company_id = mco.company_id  
                    LEFT JOIN map_port_for_dist mpfd ON mo.port_shipment = mpfd.harbour_id 
                    AND mo.company_id  = mpfd.distributor_id  
                    LEFT JOIN mst_company stp ON stp.company_id = mo.ship_to 
                    LEFT JOIN sys_user su ON su.user_id = mo.created_by 
                    LEFT JOIN m_order_status mso ON mo.status = mso.id
                    LEFT JOIN m_order_dtl md on md.order_id = mo.order_id 
                    LEFT JOIN mst_container mct on md.cont_size = mct.container_id 
                    LEFT JOIN mst_harbour mh on mo.port_shipment = mh.harbour_id 
                    LEFT JOIN mst_country mc on mh.country_id = mc.country_name_id          
                    LEFT JOIN sys_text st on mc.country_name_id = st.text_id AND st.lang_id =1
                    WHERE mo.company_id =  ${req.dataToken.company_id} ` + status + find + range + order_by_week + desc;
*/

        try {


            if (req.dataToken.user_id) {

                // let { company_id } = req.body

                dbConf.query(queryCount, (err, countResults) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + " Error counting total orders!", err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count

                    dbConf.query(query,
                        (err, results) => {

                            if (err) {
                                res.status(500).send(err);
                                console.log(timestamp + "Error get getOrderAllIn !", err)
                            } else {
                                if (results[0]) {
                                    let packet = results

                                    // res.status(200).send(results);
                                    res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                    console.log(timestamp + `get getOrderAllIn Success`);
                                } else {

                                    let packet = []
                                    let totalDataLength = 0
                                    let totalPage = 0

                                    res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                    console.log(timestamp + `get getOrderAllIn EMPTY data`);
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , getRealizationAllIn: async (req, res) => {


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

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
                    coalesce(DATE_FORMAT(tr.etd, '%b %d, %Y'), 0) etd,
                    coalesce(DATE_FORMAT(tr.eta, '%b %d, %Y'), 0) eta,
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

        // console.log(timestamp, "getRealizationAllIn",
        //     {
        //         page, limit, order_by_week, desc, status, stuffingstart, stuffingend, range, find
        //     }, "query: ", query)
        /*
        let query = ` SELECT distinct 
                    mo.order_id, mco.company_name, mo.delv_week, mo.delv_week_desc, mpfd.final_dest, mo.delv_year,
                    mo.po_buyer, concat(mh.harbour_name, ", " ,st.txt ) port_shipment, mo.ship_to, stp.company_name ,mo.po_buyer, stp.company_name ship_to, 
                    mo.po_url, concat(su.firstname, ' ', su.lastname ) created_by, mso.status_order status_name, mso.notes status_detail, mso.id is_status,
                    mct.container_name, md.cont_qty, DATE_FORMAT(mo.po_date,'%d-%b-%Y %T ') created_date, mo.tolling_id, md.cont_size
                    FROM 
                    m_order mo
                    JOIN mst_company mco ON mo.company_id = mco.company_id  
                    LEFT JOIN map_port_for_dist mpfd ON mo.port_shipment = mpfd.harbour_id 
                    AND mo.company_id  = mpfd.distributor_id  
                    LEFT JOIN mst_company stp ON stp.company_id = mo.ship_to 
                    LEFT JOIN sys_user su ON su.user_id = mo.created_by 
                    LEFT JOIN m_order_status mso ON mo.status = mso.id
                    LEFT JOIN m_order_dtl md on md.order_id = mo.order_id 
                    LEFT JOIN mst_container mct on md.cont_size = mct.container_id 
                    LEFT JOIN mst_harbour mh on mo.port_shipment = mh.harbour_id 
                    LEFT JOIN mst_country mc on mh.country_id = mc.country_name_id          
                    LEFT JOIN sys_text st on mc.country_name_id = st.text_id AND st.lang_id =1
                    WHERE mo.company_id =  ${req.dataToken.company_id} ` + status + find + range + order_by_week + desc;
*/

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
                        console.log(timestamp + " Error counting total orders!", err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count

                    // let { company_id } = req.body

                    dbConf.query(query, (err, results) => {

                        if (err) {
                            res.status(500).send(err);
                            console.log(timestamp + "Error getRealizationAllIn !", err)
                        } else {

                            if (results[0]) {
                                let packet = results
                                // res.status(200).send(results);
                                res.status(200).send({
                                    find, packet, available_week, totalPage,
                                    totalDataLength, page
                                });

                                console.log(timestamp + `get getRealizationAllIn success data`);
                            } else {

                                let packet = []
                                let totalDataLength = 0
                                let totalPage = 0

                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                console.log(timestamp + `get getRealizationAllIn EMPTY data`);
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , getOrderHeaderWithID: async (req, res) => {


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 
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
                        console.log(timestamp + "Error getOrderHeader with ID !", err)
                    } else {

                        if (results[0]) {

                            let packet = results
                            let totalDataLength = results.length
                            let totalPage = Math.round(results.length / limit)

                            // res.status(200).send(results);
                            res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                            console.log(timestamp + `get getOrderHeader data`);
                        } else {

                            let packet = []
                            let totalDataLength = 0
                            let totalPage = 0

                            res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                            console.log(timestamp + `get getOrderHeader EMPTY data`);
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , getOrderHeader: async (req, res) => {


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        // add feature on 20240105
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let page = parseInt(req.query.page, 10);
        page = isNaN(page) || page < 1 ? 1 : page; // Ensure page is valid
        let offset = (page - 1) * limit; // Correct offset calculation
        let desc = req.query.desc === "1" ? `DESC ` : `ASC`;

        let status = ' ';
        if (req.query.status !== 0 && req.query.status !== undefined && req.query.status !== "0") {
            const statusList = req.query.status.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
            console.log("statusList", statusList)

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

        // console.log(timestamp, "getOrderHeader",
        //     {
        //         page, limit, order_by_week, desc, status, stuffingstart, stuffingend, range, find
        //     }, "query: ", query)

        try {

            if (req.dataToken.user_id) {

                dbConf.query(queryCount, (err, countResults) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + " Error counting total orders!", err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count



                    dbConf.query(query, (err, results) => {
                        if (err) {
                            res.status(500).send(err);
                            console.log(timestamp + "Error getOrderHeader !", err)
                        } else {

                            if (results[0]) {

                                let packet = results

                                // res.status(200).send(results);
                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                console.log(timestamp + `get getOrderHeader data`);
                            } else {

                                let packet = []


                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                console.log(timestamp + `get getOrderHeader EMPTY data`);
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , getOrderDetail: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

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
                        console.log(timestamp + "Error getOrderDetail 1!", err)
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get getOrderDetail for: ${req.dataToken.company_id} success `)
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }


    }
    , getOrderDetail2: async (req, res) => {


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) * 20 : 9999;
        let offset = (page - 1) * limit; // Correct offset calculation
        let desc = req.query.desc === "1" ? `DESC ` : `ASC`;

        let status = '';
        console.log("status", req.query)
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

                // console.log(timestamp, "getOrderDetail2",
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
                        console.log(timestamp + " Error counting total orders!", err);
                        return;
                    }
                    let totalDataLength = countResults[0]?.total_orders || 0;
                    let totalPage = Math.ceil(totalDataLength / limit); // Use ceil to ensure correct page count

                    dbConf.query(query, (err, results) => {

                        if (err) {
                            res.status(500).send(err);
                            console.log(timestamp + "Error getOrderDetail 2!", err)
                        } else {

                            if (results) {

                                let packet = results

                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                console.log(timestamp + `get getOrderDetail2 data`);

                            } else {

                                let packet = []
                                let totalDataLength = 0
                                let totalPage = 0

                                res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                                console.log(timestamp + `get getOrderDetail2 EMPTY data`);
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , getOneOrderDetail: async (req, res) => {



        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let order_id = req.params.order_id
        //untuk menghilangkan week tertentu.
        let getBlockingCompany = (await dbQuery(`select company_id from m_config_new mcn where conditions = 12;`));
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
                        console.log(timestamp + "Error getOneOrderDetail!", err)
                    } else {
                        res.status(200).send(results);

                    }
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })
            }

        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , getOneOrderDetailRealization: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let order_id = req.params.order_id
        //untuk menghilangkan week tertentu.
        let getBlockingCompany = (await dbQuery(`select company_id from m_config_new mcn where conditions = 12;`));
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
                        case
                            when det.company_id not in (${blockingSoIdCompany})
                            and tae.appr_date is not null then so.so_id
                            else ''
                        end as so_id,
                        DATE_FORMAT(trd.delv_date, '%d-%b-%Y') delv_date,
                        tr.ship_name vessel_name,
                        tr.ship_line shipping_line,
                        tr.cont_id,
                        COALESCE(mp.product_name_no, mp.product_name) product_name,
                        trd.qty, 
                        DATE_FORMAT(tr.etd, '%d-%b-%Y') etd,
                        DATE_FORMAT(tr.eta, '%d-%b-%Y') eta
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
                        console.log(timestamp + "Error getOneOrderDetail!", err)
                    } else {
                        res.status(200).send(results);

                    }
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })
            }

        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , getOneOrderAllNoToken: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let order_id = req.params.order_id

        console.log("order_id", order_id)
        //untuk menghilangkan week tertentu.
        let getBlockingCompany = (await dbQuery(`select company_id from m_config_new mcn where conditions = 12;`))[0];

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
                    left join m_config_new msc on
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    }
    , addOrderHeader: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

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
            let specialCondition = await dbQuery(`SELECT COALESCE(mcn.conditions, 0) container FROM m_config_new mcn WHERE mcn.conditions = 8 AND mcn.company_id = ${company_id}`)
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


                    console.log(timestamp + "Error Push order header ", err)
                } else {
                    res.status(200).send(results);

                    //MAILER
                    orderRecievedMailSender(user_id, req.dataToken.employee_id, order_id, company_id)
                    // axios.post(`https://anp.indofoodinternational.com:2864/order/send_email_order/${order_id}/${req.dataToken.employee_id}/${user_id}`, {
                    //     headers: {
                    //         'Authorization': `Bearer ` + req.token
                    //     }
                    // }).then((res) => {
                    //     console.log(timestamp, "Axios mailer success")

                    // }).catch((err) => {
                    //     console.log(timestamp, "error Axios send mail",)
                    // })

                    console.log(timestamp + `add Order Header ${order_id} for ${user_id} success`)
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderHeader-${po_buyer}`)
                }

            });

        } else {
            res.status(401).send(results);
            console.log(timestamp + `GABOLEH add Order Header ${order_id} for ${user_id} UNAUTHORIZED`)
        }

    }
    , addOrderDetail: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

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
                    console.log(timestamp + "Error Push order detail Data", err)

                } else {

                    //END CONNECTION
                    res.status(200).send(results);
                    console.log(timestamp + `add Order Detail no. ${order_id} by ${user_id} success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderDetail-${order_id}-${detail_id}`)
                }
            })

        } else {
            res.status(200).send(results);
        }

    }
    , addOrderSummary: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

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
                    console.log(timestamp + "Error Push addOrderSummary", err)
                } else {

                    // let callSO = await dbQuery('CALL insert_so;');

                    //END CONNECTION
                    res.status(200).send(results);
                    console.log(timestamp + `add Order Summary ${order_id} success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderSummary-${order_id}-${detail_id}`)
                }
            })

        } else {
            res.status(200).send(results);
            console.log(timestamp + `add Order Summary by ${user_id} UNAUTHORIZE`);
        }

    },
    stuffingWeek: async (req, res, test = false) => {
        let sql;
        try {
            const date = new Date();
            const timestamp = `${date.toLocaleDateString('id')} ${date.toLocaleTimeString('id')}`;
            const IOD_TIMEZONE = 7; // GMT+7 (adjust if different)
            const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
                month: 'short', // Nov
                day: '2-digit', // 03
                year: 'numeric' // 2025
            });

            let getWeekLimit = (await dbQuery(`SELECT mcn.value FROM m_config_new mcn WHERE mcn.conditions = 9 AND mcn.company_id = ${req.dataToken.company_id}  AND mcn.active = 1;`))[0]
            
            let getWeekBlock = await dbQuery(`
                SELECT mcn.value 
                FROM m_config_new mcn 
                WHERE 
                  mcn.conditions = 21 
                  AND 
                  mcn.company_id = ${req.dataToken.company_id}  
                  or 
                  mcn.company_id = 100 
                  AND 
                  mcn.active = 1
                  ;
            `);

            

            const blockedWeeks = getWeekBlock.map(row => Number(row.value));

            let weekLimit = getWeekLimit ? getWeekLimit.value : 13
            const weeksList = [];


            // Mock or real token
            const company_id = test === true ? 101 : req?.dataToken?.company_id;
            const user_id = test === true ? 1098 : req?.dataToken?.user_id ?? 0;


            // Unauthorized check
            if (!req?.dataToken && !test) {
                const msg = 'Unauthorized — missing token or company_id';
                console.error('|ERROR|', msg);
                return res ? res.status(401).send({ success: false, message: msg }) : { success: false, message: msg };
            }

            // --- Step 1: Determine Current Date Info ---
            const today = new Date();
            const todayIsSunday = today.getDay() === 0;
            let actualWeek = 0;
            let deliveryWeek = -1;
            let deliveryYear = today.getFullYear();

            // --- Step 2: Get OPCAL_ID equivalent ---
            const todayOpcal = await dbQuery(`
                SELECT opcal_id 
                FROM dat_operational_calendar 
                WHERE DATE(FROM_UNIXTIME(opcal_id * 100)) = CURDATE()
                LIMIT 1
            `);
            const strTodayCalId = todayOpcal[0]?.opcal_id || null;

            // --- Step 3: Get Delivery Week Info ---
            sql = `
                SELECT week, delivery_week, year 
                FROM dat_operational_calendar 
                WHERE 
                  opcal_id >= ${strTodayCalId} 
                  and YEAR >= ${deliveryYear}
                  AND factory_id=1 
                  AND product_type_id=256 
                group by week
                ORDER BY opcal_id
                limit ${weekLimit}
            `;
            const deliveryData = (await dbQuery(sql)) ?? {};

            actualWeek = deliveryData.week ?? 0;
            deliveryWeek = deliveryData.delivery_week ?? -1;

            // --- Step 4: Distributor Time Fence ---
            sql = `
                SELECT COALESCE(time_fence, 0) AS time_fence 
                FROM map_cont_for_dist 
                WHERE dist_id=${company_id}
                  AND NOW() BETWEEN start_date AND COALESCE(finish_date, '9999-12-31')
            `;

            const timeFenceData = (await dbQuery(sql))[0] ?? {};
            const timeFence = timeFenceData.time_fence ?? 0;
            if (timeFence !== 0) deliveryWeek = timeFence;
            // --- Step 5: Loop through deliveryRows ---
            for (const row of deliveryData) {
                let actualWeek = row.week ?? 0;
                let deliveryWeek = row.delivery_week ?? -1;
                let deliveryYear = row.year ?? new Date().getFullYear();


                // Apply distributor time fence if any
                if (timeFence !== 0) {
                    deliveryWeek = timeFence;
                }
                // Adjust week-year overflow (week > 52)
                deliveryWeek += actualWeek;
                if (deliveryWeek > 52) {
                    deliveryWeek = deliveryWeek - 52;
                    deliveryYear += 1;
                }



                // --- Step 6: Get First Day of Week (OPCAL for deliveryWeek) ---
                sql = `
                    SELECT opcal_id 
                    FROM dat_operational_calendar 
                    WHERE 
                    year = ${deliveryYear}
                    and
                    factory_id=1 
                    AND 
                    week=${deliveryWeek} 
                    AND 
                    product_type_id=256 
                    LIMIT 1
                `;
                const opcalFirstDayData = await dbQuery(sql);
                const numOpcalId = opcalFirstDayData[0]?.opcal_id ?? null;

                if (!numOpcalId) continue; // skip this week if no data found

                // --- Step 7: Convert opcal_id to Date ---
                const opcalEpochSec = Number(numOpcalId) * 100;
                const minDateObj = new Date(opcalEpochSec * 1000);
                const todayIsSunday = new Date().getDay() === 0;
                if (minDateObj.getDay() === 0) {
                    // Adjust Sunday to Monday
                    minDateObj.setDate(minDateObj.getDate() + (todayIsSunday ? -6 : 1));
                }

                const minDate = DATE_FORMATTER.format(minDateObj);


                const minDay = minDateObj.getDay(); // 0=Sunday, 1=Monday, ... 6=Saturday


                // --- Step 8: check for max Date ---

                let nextdeliverycheckyear
                let nextdeliverycheckweek

                if (deliveryWeek === 52) {
                    nextdeliverycheckyear = deliveryYear + 1
                    nextdeliverycheckweek = 1
                } else {
                    nextdeliverycheckyear = deliveryYear
                    nextdeliverycheckweek = deliveryWeek + 1

                }

                sqlNextRow = `
                    SELECT opcal_id 
                    FROM dat_operational_calendar 
                    WHERE 
                    year = ${nextdeliverycheckyear}
                    and
                    factory_id=1 
                    AND 
                    week=${nextdeliverycheckweek} 
                    AND 
                    product_type_id=256 
                    LIMIT 1
                `;


                const nextRow = await dbQuery(sqlNextRow);
                const nextOpcalId = nextRow[0]?.opcal_id ?? null;


                let maxDateObj;

                if (nextOpcalId) {
                    const nextEpochSec = Number(nextOpcalId) * 100;
                    maxDateObj = new Date(nextEpochSec * 1000);
                    maxDateObj.setDate(maxDateObj.getDate() - 1);

                } else {
                    // if there's no next week (e.g. end of year), fallback = +6 days
                    console.log(" Reminder sudah tidak ada opcal id untuk kalender berikutnya ")
                    maxDateObj = new Date(minDateObj);
                    maxDateObj.setDate(maxDateObj.getDate() + 6);
                }

                const maxDate = DATE_FORMATTER.format(maxDateObj);


                // Push into weeksList
                // SKIP BLOCKED WEEKS
                if (blockedWeeks.includes(deliveryWeek)) {
                    console.log(`⛔ Skip blocked week: ${deliveryWeek}`);
                    continue;
                }

                // Push into weeksList
                weeksList.push({
                    opcal_id: numOpcalId,
                    id: `${deliveryYear}${String(deliveryWeek).padStart(2, '0')}`,
                    year: deliveryYear,
                    week: deliveryWeek,
                    startingDate: minDate,
                    endingDate: maxDate,
                });
            }

            // --- Step 8: Return Result ---
            const result = {
                success: true,
                weeksList,
            };

            console.log("res", weeksList)

            if (weeksList.length === 0) {
                const msg = "No more week, please contact admin to generate calendar.";
                const result = { success: false, message: msg };

                console.warn("|WARN|", msg);

                if (res) {
                    return res.status(404).send(result);
                } else {
                    return result;
                }
            }

            if (res) {
                return res.status(200).send(result);
            } else {
                return result;
            }

        } catch (err) {
            console.error('|ERROR| GET STUFFINGWEEK', err);
            const result = { success: false, message: err.message };
            return res ? res.status(500).send(result) : result;
        }
    }
    , getOrder_id: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

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
                        console.log(timestamp + "Error get order id", err)
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get order_id for ${req.dataToken.user_id} & ${year}: ${results[0].LATEST}`);
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }


    }
    , getExistPo: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        try {
            if (req.dataToken.company_id) {
                let query = `SELECT po_buyer FROM m_order WHERE company_id = ${req.dataToken.company_id} AND status IN (0, 1, 2, 3, 66); `;

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get order id", err)
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get exsiting_po ${req.dataToken.user_id}`);
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
            console.log(timestamp + error);
            res.status(500).send(error);
        }

    }
    , getContainer: async (req, res) => {

        // TIMESTAMP GENERATOR
        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        try {

            if (req.dataToken.company_id) {

                let query = `SELECT mc.container_id, mc.container_name 
                FROM map_cont_for_dist mcfd LEFT JOIN mst_container mc ON mcfd.cont_type & mc.container_id 
                WHERE mcfd.company_id = 100 AND mcfd.dist_id = ${req.dataToken.company_id};`;

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get Order container limiter", err)
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get Order container limiter ${req.dataToken.user_id}`);
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
            console.log(timestamp + 'ERROR ' + error);
            res.status(500).send(error);
        }

    }
    , getOrderContainerDetail: async (req, res) => {

        // TIMESTAMP GENERATOR
        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';



        let order_id = req.params.order_id
        let getBlockingCompany = (await dbQuery(`select company_id from m_config_new mcn where conditions = 12;`))[0];

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
                DATE_FORMAT(tr.etd, '%d-%b-%Y') etd,
                DATE_FORMAT(tr.eta, '%d-%b-%Y') eta,
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

                    console.log(timestamp + "Error get Order Container Detail", err)
                } else {
                    res.status(200).send(results);
                    console.log(timestamp + `get Order Container Detail ${req.dataToken.uid}`);
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


    }
    , cancelOrder: async (req, res) => {
        const redcolor = "\x1b[31m";

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

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
                        console.log(timestamp + `cancel order  ${req.body.order_id} error ${err}`);
                    } else {
                        console.log(redcolor + timestamp + `cancel order  ${req.body.order_id} success`);

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

    }
    , deleteOrder: async (req, res) => {


        //depereced
        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {
            // timestamp + 

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
                        console.log(timestamp + "Error while deleteing order:", err);
                    }
                    res.status(200).send(results);
                    console.log(timestamp + " delete order success for : " + company_id + " week " + delv_week)
                }
            )

        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }
    }
    , uploadFile: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

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
                console.log(timestamp + "Error upload files:", error);
                fs.unlinkSync(`.public/files/PoFile/${req.files[0].filename}`)
            }
        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }


    }
    , deleteFile: async (req, res) => {

        //depereced
        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {
            try {

                fs.unlinkSync(`./public${req.body.po_url}`)

                res.status(200).send({
                    message: 'Delete po file success!'
                });
                console.log(timestamp + "Order Delete upload files Success:", error);
            } catch (error) {

                res.status(500).send({
                    message: 'Delete failed :('
                });

                console.log(timestamp + "Order Error delete files:", error);
            }
        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
        }
    }
    , getPI: async (req, res) => {
        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
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

                console.log(`${timestamp}get PDF for order_id: ${order_id} success`)

                addSqlLogger(req.dataToken.user_id, '-- query get PI', '-- data PI', 'getPI')
            } catch (err) {

                console.log(`${timestamp} Error generating PDF report for order_id: ${order_id} message: ${err}`)
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



    }
    , getOrderDetailTolling: async (req, res) => {
        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

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
                        console.log(timestamp + `getOrderDetailTolling  ${req.body.company_id} error ${err}`);
                    } else {
                        res.status(200).send(
                            results
                        );
                        console.log(timestamp + `getOrderDetailTolling  ${req.body.company_id} success`);
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



    }
    , addOrderDetailTolling: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

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
                    console.log(timestamp + "Error Push addOrderDetailTolling", err)
                } else {

                    //END CONNECTION
                    res.status(200).send(results);
                    console.log(timestamp + `add Order addOrderDetailTolling ${order_id} success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addOrderDetailTolling-${detail_id}-${req.dataToken.uid}`)
                }

            })

        } else {
            res.status(200).send(results);
            console.log(timestamp + `add Order addOrderDetailTolling   UNAUTHORIZE`);
        }
    }
    , getStuffingDateTrucking: async (req, res) => {

        let date = new Date();

        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

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
                    console.log(timestamp + "Error Push getStuffingDateTrucking", err)
                } else {
                    //END CONNECTION
                    res.status(200).send(results);
                    console.log(timestamp + `add Order getStuffingDateTrucking  success`);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), '--data stuffingdate trucking', `getStuffingDateTrucking-${req.dataToken.uid}`)
                }

            });

        } else {
            res.status(401).send("Unauthorized");
            console.log(timestamp + `add Order addOrderDetailTolling   UNAUTHORIZE`);
        }
    }
    , containerTracking: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let container_id = req.query.container_id

        try {

            //DEV data dummy
            /*
                       let location = [
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
                               "name": "Port Klang",
                               "state": "Selangor",
                               "country": "Malaysia",
                               "country_code": "MY",
                               "locode": "MYPKG",
                               "lat": 2.99903,
                               "lng": 101.39141,
                               "timezone": "Asia/Kuala_Lumpur"
                           },
                           {
                               "id": 3,
                               "name": "Charleston",
                               "state": "South Carolina",
                               "country": "United States",
                               "country_code": "US",
                               "locode": "USCHS",
                               "lat": 32.77657,
                               "lng": -79.93092,
                               "timezone": "America/New_York"
                           }
                       ]
                       let route = {
                           "prepol": {
                               "location": 1,
                               "date": "2024-05-01",
                               "actual": true
                           },
                           "pol": {
                               "location": 1,
                               "date": "2024-05-01",
                               "actual": true
                           },
                           "pod": {
                               "location": 3,
                               "date": "2024-06-26",
                               "actual": false,
                               "predictive_eta": null
                           },
                           "postpod": {
                               "location": 3,
                               "date": "2024-06-26",
                               "actual": false
                           }
                       }
                       let vessels = [
                           {
                               "id": 1,
                               "name": "CMA CGM CASSIOPEIA",
                               "imo": 9410765,
                               "call_sign": "9HA5007",
                               "mmsi": 215196000,
                               "flag": "MT"
                           },
                           {
                               "id": 2,
                               "name": "EVER ORDER",
                               "imo": 9872406,
                               "call_sign": "VRUB8",
                               "mmsi": 477717400,
                               "flag": "HK"
                           }
                       ]
                       let route_data_route = [
                           {
                               "path": [
                                   [
                                       -6.1333333333333,
                                       106.83333333333002
                                   ],
                                   [
                                       -6.114287008431011,
                                       106.83641028243761
                                   ],
                                   [
                                       -6.025404158886997,
                                       106.85076937827307
                                   ],
                                   [
                                       -6.006357833984708,
                                       106.85384632738067
                                   ],
                                   [
                                       -5.986595808887002,
                                       106.73151932827358
                                   ],
                                   [
                                       -5.894373025097706,
                                       106.16065999910711
                                   ],
                                   [
                                       -5.874611,
                                       106.03833299999997
                                   ],
                                   [
                                       -5.47729025,
                                       106.04564145
                                   ],
                                   [
                                       -3.62312675,
                                       106.07974754999998
                                   ],
                                   [
                                       -3.225806,
                                       106.08705600000002
                                   ],
                                   [
                                       -3.10075175,
                                       106.01686845
                                   ],
                                   [
                                       -2.5171652499999997,
                                       105.68932655000003
                                   ],
                                   [
                                       -2.392111,
                                       105.61913900000002
                                   ],
                                   [
                                       -2.3463651999999997,
                                       105.54563480000002
                                   ],
                                   [
                                       -2.1328848,
                                       105.20261519999997
                                   ],
                                   [
                                       -2.087139,
                                       105.12911099999997
                                   ],
                                   [
                                       -1.73194725,
                                       104.91905685
                                   ],
                                   [
                                       -0.07438575000000003,
                                       103.93880415000001
                                   ],
                                   [
                                       0.280806,
                                       103.72874999999999
                                   ],
                                   [
                                       0.6656851500000001,
                                       103.36312499999997
                                   ],
                                   [
                                       2.46178785,
                                       101.65687500000001
                                   ],
                                   [
                                       2.846667,
                                       101.29124999999999
                                   ],
                                   [
                                       2.857636879183531,
                                       101.28509443072068
                                   ],
                                   [
                                       2.9088296487066763,
                                       101.25636844075058
                                   ],
                                   [
                                       2.9197995278902074,
                                       101.25021287147126
                                   ],
                                   [
                                       2.931684098706676,
                                       101.27139244075056
                                   ],
                                   [
                                       2.9871454291835313,
                                       101.37023043072065
                                   ],
                                   [
                                       2.99903,
                                       101.39141000000001
                                   ]
                               ],
                               "type": "SEA",
                               "transport_type": "VESSEL"
                           },
                           {
                               "path": [
                                   [
                                       2.999,
                                       101.3914
                                   ],
                                   [
                                       3.001,
                                       101.3157
                                   ],
                                   [
                                       3.0028,
                                       101.2994
                                   ],
                                   [
                                       3.0072,
                                       101.2839
                                   ],
                                   [
                                       3.0143,
                                       101.2691
                                   ],
                                   [
                                       5.235,
                                       97.5254
                                   ],
                                   [
                                       5.245,
                                       97.5061
                                   ],
                                   [
                                       5.2527,
                                       97.486
                                   ],
                                   [
                                       5.258,
                                       97.4649
                                   ],
                                   [
                                       5.6443,
                                       95.4405
                                   ],
                                   [
                                       5.6455,
                                       95.4227
                                   ],
                                   [
                                       5.6424,
                                       95.4057
                                   ],
                                   [
                                       5.6347,
                                       95.3896
                                   ],
                                   [
                                       -25.3602,
                                       46.8111
                                   ],
                                   [
                                       -25.3672,
                                       46.7994
                                   ],
                                   [
                                       -25.3736,
                                       46.7874
                                   ],
                                   [
                                       -25.3793,
                                       46.7749
                                   ],
                                   [
                                       -33.683,
                                       27.2647
                                   ],
                                   [
                                       -33.6883,
                                       27.252
                                   ],
                                   [
                                       -33.6933,
                                       27.2393
                                   ],
                                   [
                                       -33.698,
                                       27.2265
                                   ],
                                   [
                                       -34.209,
                                       25.8105
                                   ],
                                   [
                                       -34.214,
                                       25.7953
                                   ],
                                   [
                                       -34.2183,
                                       25.78
                                   ],
                                   [
                                       -34.2219,
                                       25.7645
                                   ],
                                   [
                                       -34.4072,
                                       24.8483
                                   ],
                                   [
                                       -34.411,
                                       24.8282
                                   ],
                                   [
                                       -34.4143,
                                       24.8081
                                   ],
                                   [
                                       -34.4172,
                                       24.7879
                                   ],
                                   [
                                       -35.0052,
                                       20.1561
                                   ],
                                   [
                                       -35.0073,
                                       20.1356
                                   ],
                                   [
                                       -35.0081,
                                       20.1151
                                   ],
                                   [
                                       -35.0077,
                                       20.0945
                                   ],
                                   [
                                       -34.9862,
                                       19.6461
                                   ],
                                   [
                                       -34.9849,
                                       19.6325
                                   ],
                                   [
                                       -34.9823,
                                       19.6191
                                   ],
                                   [
                                       -34.9783,
                                       19.606
                                   ],
                                   [
                                       -34.5435,
                                       18.3853
                                   ],
                                   [
                                       -34.538,
                                       18.3729
                                   ],
                                   [
                                       -34.5306,
                                       18.3617
                                   ],
                                   [
                                       -34.5215,
                                       18.3517
                                   ],
                                   [
                                       -27.5421,
                                       11.9255
                                   ],
                                   [
                                       -26.757673938533753,
                                       10.696740306982576
                                   ],
                                   [
                                       -16.1521,
                                       -5.9163
                                   ],
                                   [
                                       -16.1448,
                                       -5.9278
                                   ],
                                   [
                                       -16.1373,
                                       -5.9392
                                   ],
                                   [
                                       -16.1299,
                                       -5.9507
                                   ],
                                   [
                                       32.511,
                                       -79.7736
                                   ],
                                   [
                                       32.5196,
                                       -79.7847
                                   ],
                                   [
                                       32.5298,
                                       -79.7941
                                   ],
                                   [
                                       32.5414,
                                       -79.8018
                                   ],
                                   [
                                       32.7766,
                                       -79.9309
                                   ]
                               ],
                               "type": "SEA",
                               "transport_type": "VESSEL"
                           }
                       ]
                       let pin_location = [
                           -26.757673938533753,
                           10.696740306982576
                       ]
                       let container_status = "IN_TRANSIT"
                       let container_number = "EGSU9428146"
                       let container_events = [
                           {
                               "order_id": 1,
                               "location": 1,
                               "facility": null,
                               "description": "Container loaded at first POL",
                               "event_type": "EQUIPMENT",
                               "event_code": "LOAD",
                               "status": "CLL",
                               "date": "2024-05-01",
                               "actual": true,
                               "is_additional_event": true,
                               "type": "sea",
                               "transport_type": "VESSEL",
                               "vessel": 2,
                               "voyage": "0397-062N"
                           },
                           {
                               "order_id": 2,
                               "location": 2,
                               "facility": null,
                               "description": "Transship container loaded on vessel",
                               "event_type": "EQUIPMENT",
                               "event_code": "LOAD",
                               "status": "CLT",
                               "date": "2024-05-13",
                               "actual": true,
                               "is_additional_event": false,
                               "type": "sea",
                               "transport_type": "VESSEL",
                               "vessel": 1,
                               "voyage": "1TU7US1MA"
                           },
                           {
                               "order_id": 3,
                               "location": 3,
                               "facility": null,
                               "description": "Vessel arrival at final POD",
                               "event_type": "TRANSPORT",
                               "event_code": "ARRI",
                               "status": "VAD",
                               "date": "2024-06-26",
                               "actual": false,
                               "is_additional_event": true,
                               "type": "sea",
                               "transport_type": "VESSEL",
                               "vessel": 1,
                               "voyage": "1TU7US1MA"
                           }
                       ]
                       let facility = []
                       let number = [];

                       // =============================================================

                       {
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
}
                       
           */
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

                    //     console.log(timestamp, "results.data at container tracking", results.data)

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
                    //     console.log(timestamp + 'successfully send container track for ' + container_id)


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
                    console.log(error)
                    res.status(500).send(error)
                }
            } else {
                res.status(400).send({
                    message: "container_id is undefine"

                })
            }



        } catch (error) {
            console.log(error)
            res.status(500).send(error)
        }
    }
    , addOrder: async (req, res, next) => {


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let { user_id, company_id, active } = req.dataToken;
        let order = req.body.order;

        if (!order || order.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid request data." });
        }

        console.log(timestamp, "Received Orders:", order);

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
            console.log(timestamp, "order_id delete list", orderList);

            await Promise.all(orderList.map(order_id =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        let parameterEmergencyDeleteOrder = [order_id];

                        dbConf.query(queryEmergencyDeleteOrder, parameterEmergencyDeleteOrder, async (err, results) => {
                            if (err) {
                                console.log(timestamp + " Cannot delete order for order_id " + order_id);
                            } else {
                                addSqlLogger(req.dataToken.user_id, `${queryEmergencyDeleteOrder} + ${order_id}`, results, `DELETE error order_id-${order_id}`);
                                console.log(timestamp + " just ran emergency delete order for order_id " + order_id);
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
            console.log(timestamp + `==========> add Order is success`)

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
                    console.log(white + "==================NEW=ORDER======================")

                    console.log(timestamp, "orderIndex ke ", orderIndex)
                    console.log(timestamp, "order_id ", order_id)

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

                    console.log(timestamp, "Po_Buyer ", po_buyer)


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

                    let specialCondition = await dbQuery(`SELECT COALESCE(mcn.conditions, 0) container FROM m_config_new mcn WHERE mcn.conditions = 8 AND mcn.company_id = ${company_id}`);
                    let number = await dbQuery(`SELECT company_number  FROM mst_company mc WHERE company_id = ${company_id}`);
                    // let selectWeek = order_data.stuffing_date ? await (dbQuery(`CALL day2week(${order_data.stuffing_date}, @wikwik);`)) : delv_week;

                    console.log(timestamp, "final_dest", final_dest)

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

                    // console.log(timestamp, "order_data.detail ", order_data.detail)
                    for (const detail of (order_data.detail)) {
                        console.log(`Detail",
                           SKU : ${(detail.Flavour[0] ? (detail.Flavour[0].sku > 1 ? detail.Flavour[0].sku : 0) : 0)}, 
                           Qty : ${(detail.Flavour[0] ? (detail.Flavour[0].qty > 1 ? detail.Flavour[0].qty : 0) : 0)},

                           SKU : ${(detail.Flavour[1] ? (detail.Flavour[1].sku > 1 ? detail.Flavour[1].sku : 0) : 0)}, 
                           Qty :  ${(detail.Flavour[1] ? (detail.Flavour[1].qty > 1 ? detail.Flavour[1].qty : 0) : 0)},

                           SKU :  ${(detail.Flavour[2] ? (detail.Flavour[2].qty > 1 ? detail.Flavour[2].qty : 0) : 0)},
                           Qty : ${(detail.Flavour[2] ? (detail.Flavour[2].sku > 1 ? detail.Flavour[2].sku : 0) : 0)},
                             
                        `)
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
                        console.log("summary", summary)
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

                console.log(timestamp + `==========> add Order is success`)

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
                console.log(timestamp + " error at add order, " + error)
                // addSqlLogger(user_id, `no query`, `insert query results`, `FAILED addOrderDetail-${order}`)
                res.status(500).send({
                    success: false,
                    message: error
                })
                next(error);

            } finally {
                console.log(white + "================================================")

            }

        } else {

            res.status(401).send({
                success: false,
                message: "user is not active or data is not available. cannot insert order"
            });
            console.log(timestamp + `add Order is inactive. Order is not inserted`);

        }



    }
    , mailerAPI: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { order_id, user_id, employee_id } = req.params
        console.log({ order_id, user_id, employee_id, company_id })
        if (order_id) {
            orderRecievedMailSender(user_id, employee_id, order_id, company_id);
            res.status(400).send({
                success: true,
                message: 'email has been sent'
            })
            console.log(timestamp, " mailerAPI: Executing mailer function ")
        } else {
            res.status(500).send({
                success: false,
                message: 'order_id is empty'
            })
            console.log(timestamp, " FAILED at mailerAPI: order_id is not provided ")
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
    saveSseaRates: async (req, res) => [

    ]


}