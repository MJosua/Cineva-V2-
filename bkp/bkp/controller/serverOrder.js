const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const fs = require('fs')
const { orderRecievedMailSender } = require('../config/mailer')
const ejs = require('ejs');
// const puppeteer = require('puppeteer');
const axios = require('axios');
// const { time } = require("console");
// const { json } = require("body-parser");
// const { parse } = require("path");

let green = "\x1b[32m"

module.exports = {


    getOrderAllIn: async (req, res) => {


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        // add feature on 20240105
        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let order_by_week = req.query.order_by_week ? ` ORDER BY mo.delv_week ` : ` ORDER BY mo.po_date `;
        let desc = req.query.desc ? `DESC ` : ``;
        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find || req.query.find !== '' ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id} ` : ''

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id} `))


        let query = ` 
    SELECT
	DISTINCT 
    mo.order_id,
	mco.company_name,
	mo.delv_week,
	mo.delv_week_desc,
	mpfd.final_dest,
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
	CASE
		WHEN md.cont_size  = 8 THEN ms.detail_id
		ELSE md.detail_id
	END detail_id, 
	CASE
		WHEN md.cont_size = 8 THEN ms.sku
		ELSE md.sku1
	END sku1,
	CASE
		WHEN md.cont_size = 8 THEN COALESCE(mps.product_name_no, mps.product_name)
		ELSE COALESCE(mp1.product_name_no, mp1.product_name)
	END product_name_1,
	CASE
		WHEN md.cont_size = 8 THEN mpls.img 
		ELSE mpl1.img
	END url_1,
	CASE
		WHEN md.cont_size = 8 THEN ms.qty 
		ELSE md.qty1
	END qty1,
	md.price1,
	CASE
		WHEN md.cont_size = 8 THEN mps.product_sku 
		ELSE mp1.product_sku 
	END prod_sku_1,
	md.sku2,
	COALESCE(mp2.product_name_no, mp2.product_name) product_name_2,
	mpl2.img url_2,
	md.qty2,
	md.price2,
	mp2.product_sku prod_sku_2,
	md.sku2,
	COALESCE(mp3.product_name_no, mp3.product_name) product_name_3,
	mpl3.img url_3,
	md.qty3,
	md.price3,
	mp3.product_sku prod_sku_3,
	md.remarks,
	md.bulk 
    FROM
        m_order mo
    JOIN mst_company mco ON
        mo.company_id = mco.company_id
    LEFT JOIN map_port_for_dist mpfd ON
        mo.port_shipment = mpfd.harbour_id
        AND mo.company_id = mpfd.distributor_id
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
        mo.port_shipment = mh.harbour_id
    LEFT JOIN mst_country mc ON
        mh.country_id = mc.country_name_id
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
        mo.company_id = ${req.dataToken.company_id} ` + status + find + range + order_by_week + desc;

        /*
        let query = ` SELECT distinct 
                    mo.order_id, mco.company_name, mo.delv_week, mo.delv_week_desc, mpfd.final_dest, mo.delv_year,
                    mo.po_buyer, concat(mh.harbour_name, ", " ,st.txt ) port_shipment, mo.ship_to, stp.company_name ,mo.po_buyer, stp.company_name ship_to, 
                    mo.po_url, concat(su.firstname, ' ', su.lastname ) created_by, mso.status_order status_name, mso.notes status_detail, mso.id is_status,
                    mct.container_name, md.cont_qty, DATE_FORMAT(mo.po_date,'%Y-%m-%d %T ') created_date, mo.tolling_id, md.cont_size
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

                dbConf.query(query,
                    (err, results) => {

                        if (err) {
                            res.status(500).send(err);
                            console.log(timestamp + "Error get getOrderAllIn !", err)
                        } else {
                            if (results[0]) {
                                let packet = results.slice(startIndex, endIndex)
                                let totalDataLength = results.length
                                let totalPage = Math.round(results.length / limit)

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
        let order_by_week = req.query.order_by_week ? ` ORDER BY mo.delv_week ` : ` ORDER BY mo.po_date `;
        let desc = req.query.desc ? `DESC ` : ``;
        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id}` : ''

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id} `))


        let query = ` 
 SELECT
	ms.po_buyer,
	ms.order_id, 
	stp.company_name ship_to,
	concat(mh.harbour_name, ', ', tp.txt) port_of_discharge,
	mo.delv_week_desc stuffing_week,
	mp.product_sku product_sku,
	COALESCE(mp.product_name_no, mp.product_name) product_description,
	COALESCE(trd.qty, 0) realization_quantity,
	concat(1 , ' X ', mc2.container_name ) completion_note,
	DATE_FORMAT(mo.po_date, '%b %d, %Y') po_date,
	concat(su.firstname, ' ', su.lastname ) submitted_by,
	mos.status_order order_status,
	mod2.remarks order_remarks,
	tr.cont_id container_id, 
	COALESCE(DATE_FORMAT(tr.delv_date, '%b %d, %Y'), 0) stuffing_date,
	COALESCE(DATE_FORMAT(tr.etd, '%b %d, %Y'), 0) etd,
	COALESCE(DATE_FORMAT(tr.eta, '%b %d, %Y'), 0) eta
FROM
	m_summary ms
LEFT JOIN m_order mo ON
	mo.order_id = ms.order_id
LEFT JOIN mst_company stp ON
	mo.ship_to = stp.company_id
LEFT JOIN mst_harbour mh ON
	mo.port_shipment = mh.harbour_id
LEFT JOIN mst_country mc ON
	mh.country_id = mc.country_id
LEFT JOIN sys_text tp ON
	tp.text_id = mc.country_name_id
	AND tp.lang_id = 1
LEFT JOIN mst_product mp ON
	mp.product_code = ms.sku
LEFT JOIN m_order_dtl mod2 ON
	mod2.order_id = mo.order_id
LEFT JOIN mst_container mc2 ON
	mc2.container_id = mod2.cont_size
LEFT JOIN sys_user su ON
	su.user_id = mo.created_by
LEFT JOIN m_order_status mos ON
	mos.id = mo.status
LEFT JOIN trs_sales_order tso ON
	tso.e_order = mo.order_id
LEFT JOIN trs_realization tr ON
	tso.so_id = tr.so_id
LEFT JOIN trs_realization_detail trd ON
	tr.so_id = trd.so_id
WHERE
	ms.company_id = ${req.dataToken.company_id} AND mo.status IN (3,4)  ` + status + find + range + order_by_week + desc;

        /*
        let query = ` SELECT distinct 
                    mo.order_id, mco.company_name, mo.delv_week, mo.delv_week_desc, mpfd.final_dest, mo.delv_year,
                    mo.po_buyer, concat(mh.harbour_name, ", " ,st.txt ) port_shipment, mo.ship_to, stp.company_name ,mo.po_buyer, stp.company_name ship_to, 
                    mo.po_url, concat(su.firstname, ' ', su.lastname ) created_by, mso.status_order status_name, mso.notes status_detail, mso.id is_status,
                    mct.container_name, md.cont_qty, DATE_FORMAT(mo.po_date,'%Y-%m-%d %T ') created_date, mo.tolling_id, md.cont_size
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

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error getRealizationAllIn !", err)
                    } else {

                        if (results[0]) {
                            let packet = results.slice(startIndex, endIndex)
                            let totalDataLength = results.length
                            let totalPage = Math.round(results.length / limit)

                            // res.status(200).send(results);
                            res.status(200).send({ find, packet, available_week, totalPage, totalDataLength, page });

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
        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let order_by_week = req.query.order_by_week ? ` ORDER BY mo.delv_week ` : ` ORDER BY mo.po_date `;
        let desc = req.query.desc ? `DESC ` : ``;
        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id} ` : ''

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id}  `))


        let query = ` 
    SELECT
        DISTINCT 
        mo.order_id,
        mco.company_name,
        mo.delv_week,
        mo.delv_week_desc,
        mo.stuffing_date,
        mpfd.final_dest,
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
        CASE WHEN md.cont_qty = 0 THEN 1 ELSE md.cont_qty END cont_qty,   
        DATE_FORMAT(mo.po_date, '%b %d, %Y') created_date,
        mo.tolling_id,
        md.cont_size
    FROM
        m_order mo
    JOIN mst_company mco ON
        mo.company_id = mco.company_id
    LEFT JOIN map_port_for_dist mpfd ON
        mo.port_shipment = mpfd.harbour_id
        AND mo.company_id = mpfd.distributor_id
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
        mo.port_shipment = mh.harbour_id
    LEFT JOIN mst_country mc ON
        mh.country_id = mc.country_name_id
    LEFT JOIN sys_text st ON
        mc.country_name_id = st.text_id
        AND st.lang_id = 1
    WHERE
        mo.company_id = ${req.dataToken.company_id} ` + status + find + range + order_by_week + desc;

        console.log(timestamp, "query getOrderHeader", query)

        try {

            if (req.dataToken.user_id) {

                // let { company_id } = req.body

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error getOrderHeader !", err)
                    } else {

                        if (results[0]) {

                            let packet = results.slice(startIndex, endIndex)
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
                        console.log(timestamp + "Error getOrderDetail!", err)
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
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let order_by_week = req.query.order_by_week ? ` ORDER BY mo.delv_week ` : ` ORDER BY mo.po_date `;
        let desc = req.query.desc ? `DESC ` : ``;
        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;
        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';
        let range = stuffingstart || stuffingend ? ` AND CASE WHEN mo.delv_week = 0 THEN 1 ELSE mo.delv_week END BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND (mo.po_buyer LIKE '%${req.query.find}%' OR mo.order_id LIKE '%${req.query.find}%') AND mo.company_id = ${req.dataToken.company_id}` : ''

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo WHERE mo.company_id = ${req.dataToken.company_id}  `))


        try {

            if (req.dataToken.user_id) {
                // let { company_id } = req.body 

                let query = `
                            SELECT
                                DISTINCT
                                det.order_id,
                                det.company_id,
                                mpfd.final_dest, 
                                mco.company_name,
                                det.created_by,
                                su.firstname,
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
                                det.company_id = ${req.dataToken.company_id}` + status + find + range + order_by_week + desc


                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error getOrderDetail!", err)
                    } else {

                        if (results) {

                            let packet = results.slice(startIndex, endIndex)
                            let totalDataLength = results.length
                            let totalPage = Math.round(results.length / limit)

                            res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                            console.log(timestamp + `get getOrderDetail2 data`);
                        } else {

                            let packet = []
                            let totalDataLength = 0
                            let totalPage = 0

                            res.status(200).send({ packet, available_week, totalPage, totalDataLength, page });
                            console.log(timestamp + `get getOrderDetail2 EMPTY data`);
                            addSqlLogger(req.dataToken.user_id, (query), '--data getOrderDetail2', 'getOrderDetail2')
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
    , getOneOrderDetail: async (req, res) => {

        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let order_id = req.params.order_id

        try {

            if (req.dataToken.user_id) {
                // let { company_id } = req.body 

                let query = `
                    SELECT DISTINCT
                        det.order_id,
                        det.company_id,
                        mco.company_name,
                        det.created_by,
                        su.firstname,
                        CASE
		                    WHEN det.cont_size  = 8 THEN ms.detail_id
                    		ELSE det.detail_id
	                    END detail_id,
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
                        det.price1,
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
                        mo.order_id = ms.order_id
                    LEFT JOIN mst_product mps ON
                        ms.sku = mps.product_code
                    LEFT JOIN m_product_link mpls ON
                        ms.sku = mpls.product_code
                    WHERE
                        det.order_id = ?`

                let parameter = [order_id]

                dbConf.query(query, parameter, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error getOneOrderDetail!", err)
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get getOneOrderDetail data`);
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), '--data getOneOrderDetail', `getOneOrderDetail-${order_id}`)

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
                    orderRecievedMailSender(user_id, req.dataToken.employee_id, order_id)
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

    }
    , stuffingWeek: async (req, res) => {


        let date = new Date();
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.company_id) {

            let getWeekLimit = (await dbQuery(`SELECT mcn.value FROM m_config_new mcn WHERE mcn.conditions = 9 AND mcn.company_id = ${req.dataToken.company_id}  AND mcn.active = 1;`))[0]

            //cuma 13 data week yang ditampilin untuk default.
            let weekLimit = getWeekLimit ? getWeekLimit.value : 13

            let query = `
                        SELECT
                            a.*
                        --	a.opcal_id, a.id, a.year, a.week, a.startingDate, a.endingDate  
                        FROM
                            (
                            SELECT
                                max(opcal_id) opcal_id,
                                CAST(concat(YEAR, RIGHT(concat('00', week), 2))AS UNSIGNED) AS id,
                                YEAR,
                                week,
                                DATE_FORMAT(FROM_UNIXTIME(concat(min(opcal_id), '00')), '%b %d, %Y') startingDate,
                                DATE_FORMAT(FROM_UNIXTIME(concat(max(opcal_id), '00')), '%b %d, %Y') endingDate
                            FROM
                                dat_operational_calendar doc
                            WHERE
                                opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-01-01')),
                                8)
                            GROUP BY
                                2,
                                3,
                                4) a
                        WHERE
                            a.opcal_id >= (SELECT
                                opcal_id
                            FROM
                                dat_operational_calendar
                            LEFT JOIN map_cont_for_dist mc ON
                            mc.company_id = 100
                            AND mc.dist_id = ${req.dataToken.company_id}
                            LEFT JOIN sys_text st ON
                            st.lang_id = 1
                            AND st.text_id = -100
                            WHERE week = (
                            SELECT
                                min(week)
                            FROM
                                dat_operational_calendar doc
                            WHERE
                                opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-01-01')),
                                8)
                                    AND opcal_id = LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-%m-%d')),
                                    8)
                                LIMIT 1) + CASE
                                WHEN COALESCE(mc.time_fence, 0) = 0 THEN st.txt
                                ELSE mc.time_fence
                            END AND opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-01-01')),
                                8) ORDER BY opcal_id ASC LIMIT 1) 
                            ORDER BY id LIMIT ${weekLimit};`


            dbConf.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);

                } else {
                    res.status(200).send(results);
                    console.log(timestamp + `get Order Stuffing Week for ${req.dataToken.company_id} limit ${weekLimit} success`);
                    addSqlLogger(req.dataToken.user_id, '-- query stuffing week', '--data stuffing week', 'getStuffingWeek')
                }
            })

        } else {
            res.status(401).send({
                success: false,
                message: 'unauthorized'
            })
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
                let query = `SELECT po_buyer FROM m_order WHERE company_id = ${req.dataToken.company_id} AND status = 0 OR status = 1 OR status = 2 OR status = 3 ;`;

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

        if (req.dataToken.company_id && order_id) {

            let query = ` 
            SELECT
                mo.order_id,
                DATE_FORMAT(trd.delv_date, '%Y-%m-%d') delv_date,
                tr.ship_name vessel_name,
                tr.ship_line shipping_line,
                tr.cont_id,
                DATE_FORMAT(tr.etd, '%Y-%m-%d') etd,
                DATE_FORMAT(tr.eta, '%Y-%m-%d') eta,
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

            let parameter = [req.body.order_id];

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
                        res.status(200).send(
                            {
                                success: true,
                                message: 'Your cancel request has been sent!'
                            }
                        );
                        console.log(timestamp + `cancel order  ${req.body.order_id} success`);
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

            let query = `
            SELECT
            min(a.stuffDate) minDate, max(a.stuffDate) maxDate
        FROM
            (
            SELECT
                DATE_FORMAT(FROM_UNIXTIME(concat(opcal_id, '00')), '%Y-%m-%d') stuffDate,
                YEAR,
                week
            FROM
                dat_operational_calendar doc
            WHERE
                opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-01-01')),
                8)
            GROUP BY 1,2,3
            ORDER BY 1
            ) a
        LEFT JOIN sys_text st ON
            st.lang_id = 1
            AND st.text_id = -100
        WHERE
            a.week >= (
            SELECT
                week
            FROM
                dat_operational_calendar
            WHERE
                opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-01-01')),
                8)
                    AND opcal_id = LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-%m-%d')),
                    8)
                LIMIT 1) + 5
                AND 
        a.week <= (
            SELECT
                week
            FROM
                dat_operational_calendar
            WHERE
                opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-01-01')),
                8)
                    AND opcal_id = LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-%m-%d')),
                    8)
                LIMIT 1) + ?  + 13 ;`;

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
            res.status(200).send(results);
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
        let timestamp = green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { user_id, company_id } = req.dataToken;

        //   request bodynya jadi gini: 
        /*
                order: {
                    [
                        {
                            delv_week: 0,
                            delv_week_desc: "",
                            delv_year: 0,
                            po_buyer: "",
                            stuffing_date: "YYYY-MM-DD",
                            port_shipment: 0,
                            ship_to: 0,
                            po_url: "",
                            final_dest: 0,
                            tolling_id: 1,
                            remarks: '-',
                            detail: [{
                                detail_id: 0,
                                cont_size: 0,
                                cont_qty: 0,
                                bulk: 1,
                                remarks: "",
                                Flavour:
                                    [{
                                        sku: 0,
                                        qty: 0,
                                    }],
                            }],
                            summary: [
                                {
                                    detail_id: 0,
                                    sku: 0,
                                    qty: 0
                                }
                            ]
                        }
                    ]
                };
 
        */


        let order = req.body.order
        console.log(timestamp, "order data", order)

        //query mendapatkan order_id terakhir dari database 
        async function generate_order_id(year) {

            let selectYear = year ? year : parseInt((new Date()).getFullYear())


            try {

                let prevOrderId = (await dbQuery(`SELECT
                                                    MAX(order_id) AS LATEST
                                                    FROM (
                                                    SELECT order_id FROM m_order mo WHERE company_id  = ${req.dataToken.company_id} AND delv_year = ${selectYear}
                                                    UNION ALL  
                                                    SELECT order_id  FROM m_order_dtl WHERE company_id  = ${req.dataToken.company_id} AND delv_year = ${selectYear}
                                                    UNION ALL 
                                                    SELECT order_id FROM m_summary WHERE company_id  = ${req.dataToken.company_id}
                                                    ) AS all_order_id;`))[0].LATEST;
                // let prevOrderId = (await dbQuery(`SELECT MAX(order_id) AS LATEST FROM m_order WHERE company_id = ${req.dataToken.company_id} AND delv_year = ${year};`))[0].LATEST;


                // membuat kepala tahun order_id 
                let yearOrderId = selectYear ? selectYear.toString() : date.getFullYear().toString();
                let stringCuttedYear = yearOrderId.slice(2, 5);

                //penciptaan order_id
                // satu kali API call ini menghabiskan satu order_id
                /*
                if (prevOrderId === null) {
                    // if (orderIDX === 0) {
                    // order_id = parseInt(stringCuttedYear + "00" + company_id + "00001");
                    console.log(timestamp + "No existing order! Starting Order ID: ", prevOrderId);
                    return (parseInt(stringCuttedYear + "00" + company_id + "00001"));
                    // } else if (orderIDX > 0) {
                    // order_id = parseInt(stringCuttedYear + "00" + company_id + "00001") + orderIDX;
                    // console.log("Order ID 10: ", order_id, orderIDX);
                    // }
                } else if (prevOrderId !== null) {
                    // order_id = parseInt(prevOrderId) + parseInt(orderIDX + 1);
                    // console.log("Order ID 11: ", order_id, orderIDX + 1);
                    console.log(timestamp + "Order ID 11: ", (prevOrderId + 1));
                    return (parseInt(prevOrderId) + 1)
                    // order_id = parseInt(prevOrderId) + 1
                }
                    */
                if (prevOrderId === null) {
                    // if (orderIDX === 0) {
                    // order_id = parseInt(stringCuttedYear + "00" + company_id + "00001");
                    // console.log(timestamp + "No existing order! Starting Order ID: ", prevOrderId);
                    return (parseInt(stringCuttedYear + "00" + company_id + "00000"));
                    // } else if (orderIDX > 0) {
                    // order_id = parseInt(stringCuttedYear + "00" + company_id + "00001") + orderIDX;
                    // console.log("Order ID 10: ", order_id, orderIDX);
                    // }
                } else if (prevOrderId !== null) {
                    // order_id = parseInt(prevOrderId) + parseInt(orderIDX + 1);
                    // console.log("Order ID 11: ", order_id, orderIDX + 1);
                    // console.log(timestamp + "Order ID 11: ", (prevOrderId));
                    return (parseInt(prevOrderId))
                    // order_id = parseInt(prevOrderId) + 1
                }

            } catch (error) {
                console.log(timestamp + "error get order_id: " + error)
            }

        }

        async function emergencyDeleteOrder(order, last_order_id) {

            // const queryGetOrder_id = ' SELECT mo.order_id FROM m_order mo WHERE mo.po_buyer = ?';
            // const queryEmergencyDeleteOrder = 'CALL delete_po_order(?, ?, ?);';
            const queryEmergencyDeleteOrder = 'CALL delete_order(?);';


            let order_index = 0


            for (const data of order) {

                order_index++

                let order_id = last_order_id + order_index

                console.log(timestamp, "order_id delete", order_id);

                setTimeout(async () => {

                    // let parameterEmergencyDeleteOrder = [data.po_buyer, company_id, data.delv_year];
                    let parameterEmergencyDeleteOrder = [order_id];


                    //jalankan query mendapatkan order_id dari po_buyer
                    dbConf.query(queryEmergencyDeleteOrder, parameterEmergencyDeleteOrder, async (err, results) => {


                        if (err) {

                            console.log(timestamp + " Cannot  order  for PO_BUYER" + (order_id))

                        } else {

                            // setTimeout(async () => {
                            //     let delete_order_id = results ? results : 0

                            //     if (order) {
                            //         for (const id of delete_order_id) {
                            //             dbConf.query(queryGetOrder_id, [id.order_id], async (err2, results2) => {

                            //                 if (err2) {
                            //                     console.log(timestamp, "ERROR! cannot delete order_id", id)
                            //                 } else {

                            //                     addSqlLogger(req.dataToken.user_id, ` ${queryEmergencyDeleteOrder} + ${id.order_id}`, results2, `DELETE error order-${id.order_id}`);
                            //                     console.log(timestamp + " just run emergency delete order for PO_BUYER and ORDER_ID " + (data.po_buyer) + ' and ' + (id.order_id))



                            //                 }

                            //             });

                            //         }

                            //     } else {
                            //         console.log(timestamp + " cannot delete order order ID is not found. po_buyer:" + data.po_buyer)

                            //     }

                            // }, 2000);
                            addSqlLogger(req.dataToken.user_id, ` ${queryEmergencyDeleteOrder} + ${order_id}`, results, `DELETE error order_id-${order_id}`);
                            // console.log(timestamp + " just run emergency delete order for PO_BUYER and ORDER_ID " + (data.po_buyer) + ' and ' + (id.order_id))
                            console.log(timestamp + " just run emergency delete order for PO_BUYER" + (order_id))


                        }

                    });

                }, 3000);

            }

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

                let order_id_raw = await generate_order_id(order[0].delv_year);

                let orderIndex = 0

                for (const order_data of order) {

                    //order_data adalah alias untuk tiap2 object yang ada dalam array 

                    orderIndex++
                    // let order_id = await generate_order_id()
                    let order_id = order_id_raw + orderIndex;

                    console.log(timestamp, "orderIndex ke ", orderIndex)

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


                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');

                    let formattedDate = `${year}-${month}-${day}`;

                    //penentuan  isi variabel delv_week
                    let delv_week = order_data.delv_week ? order_data.delv_week : (await dbQuery(`SELECT day2week('${order_data.stuffing_date}') AS wikwik;`))[0].wikwik;
                    let delv_week_desc = order_data.delv_week_desc ? order_data.delv_week_desc : `Week: ${(await dbQuery(`SELECT day2week('${order_data.stuffing_date}') AS wikwik;`))[0].wikwik} Date: ${order_data.stuffing_date} `


                    let stuffing_date_rev = order_data.stuffing_date ? order_data.stuffing_date : formattedDate;
                    let final_dest_check = order_data.final_dest ? order_data.final_dest : '-';
                    let specialCondition = await dbQuery(`SELECT COALESCE(mcn.conditions, 0) container FROM m_config_new mcn WHERE mcn.conditions = 8 AND mcn.company_id = ${company_id}`);
                    let number = await dbQuery(`SELECT company_number  FROM mst_company mc WHERE company_id = ${company_id}`);
                    // let selectWeek = order_data.stuffing_date ? await (dbQuery(`CALL day2week(${order_data.stuffing_date}, @wikwik);`)) : delv_week;

                    console.log(timestamp, "order_data.final_dest", order_data.final_dest)
                    console.log(timestamp, "final_dest_check", final_dest_check)

                    let checkCondition = specialCondition[0] ? specialCondition[0].container : '';
                    let checkNumber = number[0] ? number[0].company_number : '';
                    let tolling_id = order_data.tolling_id ? order_data.tolling_id : 0;

                    let po_buyer_pcl = checkCondition == 8 && checkNumber ? 'ND/' + checkNumber + '/' + po_buyer : '';

                    let query = `
                                    INSERT INTO m_order 
                                    (order_id, company_id, delv_week, delv_week_desc, 
                                    delv_year,  po_buyer, stuffing_date,
                                    po_date, port_shipment, ship_to, po_url,
                                    created_by, status, tolling_id, po_buyer_pcl, final_dest)
                                    VALUES
                                    (?, ?, ?, ?, 
                                    ?, ?, ?,
                                    now(), ?, ?, ?,
                                    ?, 0, ?, ?, '${final_dest_check}');  
                                    `;

                    let parameter = [
                        order_id, company_id, delv_week, delv_week_desc,
                        delv_year, po_buyer, stuffing_date_rev,
                        port_shipment, ship_to, po_url,
                        user_id, tolling_id, po_buyer_pcl,
                    ];

                    //memasukkan header
                    dbConf.query(query, parameter, (err) => {
                        if (err) {
                            console.log(timestamp, "error add header", err);
                            emergencyDeleteOrder(order, order_id_raw);
                        }
                    });
                    // addSqlLogger(user_id, (query.concat(parameter)), `insert query`, `addOrderHeader-${po_buyer}`);

                    //melakukan loop sesuai dengan jumlah  data dalam detail
                    // console.log(timestamp, "order_data.detail ", order_data.detail)
                    for (const detail of (order_data.detail)) {

                        let queryDetail = `
                                            INSERT INTO m_order_dtl
                                            (order_id, company_id, created_by, detail_id, 
                                                cont_size, cont_qty, 
                                                sku1, sku2, sku3, 
                                                qty1, qty2, qty3, 
                                                price1, price2, price3, 
                                                remarks, bulk, delv_week, delv_year)
                                                VALUES
                                                (?, ?, ?, ?, 
                                                    ?, ?, 
                                                    ?, ?, ?, 
                                                    ?, ?, ?, 
                                                    ?, ?, ?,
                                                    ?, ?, ?, ?);
                                                    
                                                    `
                        let parameterDetail = [
                            order_id, company_id, user_id, detail.detail_id,
                            detail.cont_size, detail.cont_qty,
                            (detail.Flavour[0] ? (detail.Flavour[0].sku > 1 ? detail.Flavour[0].sku : 0) : 0), (detail.Flavour[1] ? (detail.Flavour[1].sku > 1 ? detail.Flavour[1].sku : 0) : 0), (detail.Flavour[2] ? (detail.Flavour[2].sku > 1 ? detail.Flavour[2].sku : 0) : 0),
                            (detail.Flavour[0] ? (detail.Flavour[0].qty > 1 ? detail.Flavour[0].qty : 0) : 0), (detail.Flavour[1] ? (detail.Flavour[1].qty > 1 ? detail.Flavour[1].qty : 0) : 0), (detail.Flavour[2] ? (detail.Flavour[2].qty > 1 ? detail.Flavour[2].qty : 0) : 0),
                            0, 0, 0,
                            order_data.remarks, detail.bulk, delv_week, delv_year
                        ]

                        try {
                            dbConf.query(queryDetail, parameterDetail, (err) => {
                                if (err) {
                                    console.log(timestamp, "error add detail", err);
                                    emergencyDeleteOrder(order, order_id_raw);
                                }
                            })
                            console.log(timestamp, " addDetail on addOrder", po_buyer, " detail ", detail)
                        } catch (error) {
                            console.log(timestamp, "Error addDetail on addOrder", error)
                        }
                        // addSqlLogger(user_id, (query.concat(parameterDetail)), `insert query`, `addOrderDetail-${order_id}-${detail.detail_id}`)

                    }

                    // //melakukan loop sesuai dengan jumlah data dalam summary
                    // console.log(timestamp, "order_data.summary ", order_data.summary)
                    for (const summary of (order_data.summary)) {

                        let querySummary = `
                                INSERT INTO m_summary
                                (order_id, company_id, po_buyer, detail_id,
                                sku, qty, remarks, delv_date)
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?, ?); 
                                `
                        let parameterSummary = [order_id, company_id, po_buyer, summary.detail_id, summary.sku, summary.qty, order_data.remarks, stuffing_date_rev];
                        try {
                            dbConf.query(querySummary, parameterSummary, (err) => {
                                if (err) {
                                    console.log(timestamp, "error add Summary", err);
                                    emergencyDeleteOrder(order, order_id_raw);
                                }
                            })
                            console.log(timestamp, " addSummary on addOrder", po_buyer, " summary ", summary)
                        } catch (error) {
                            console.log(timestamp, "Error addSummary on addOrder", error)
                        }
                        // addSqlLogger(user_id, (querySummary.concat(parameterSummary)), `insert query results`, `addOrderDetail-${order_id}-${summary.detail_id}`)

                    }

                    //idupin kalau udah production. spam aja ini.
                    // orderRecievedMailSender(user_id, req.dataToken.employee_id, order_id)


                    // atau ini
                    // axios.post(process.env.LOCAL_MAILER_API + `/order/send_email_order/${order_id}`, {
                    //     headers: {
                    //         'Authorization': `Bearer ${req.token}`
                    //     }
                    // })

                    // axios.post(`https://anp.indofoodinternational.com:2864/order/send_email_order/${order_id}/${req.dataToken.employee_id}/${user_id}`, {
                    //     headers: {
                    //         'Authorization': `Bearer ` + req.token
                    //     }
                    // }).then((res) => {
                    //     console.log(timestamp, "Axios mailer success")

                    // }).catch((err) => {
                    //     console.log(timestamp, "error Axios send mail",)
                    // })


                };

                setTimeout(() => {
                    console.log(timestamp + `==========> add Order is success`)
                    res.status(200).send({
                        success: true,
                        message: 'All order has been added. check transaction list'
                    })
                }, 2000)

            } catch (error) {
                emergencyDeleteOrder(order, order_id_raw);
                console.log(timestamp + "error at add order" + error)
                // addSqlLogger(user_id, `no query`, `insert query results`, `FAILED addOrderDetail-${order}`)
                res.status(500).send({
                    success: false,
                    message: 'add order failed'
                })
                next(error);

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
        console.log({ order_id, user_id, employee_id })
        if (order_id) {
            orderRecievedMailSender(user_id, employee_id, order_id);
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

    }


}