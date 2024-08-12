const { dbConf, dbQuery } = require("../config/db");
const fs = require('fs');


let gray = "\x1b[90m"
module.exports = {
    //DONE: REGISTERED
    getCoordinate: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let query = `SELECT mc.rm_name, mc.rm_email,  mc.longitude , mc.latitude, mc.category, st.txt country_desc 
			FROM mst_country mc
        LEFT JOIN sys_text st ON st.text_id = mc.country_name_id 
        WHERE st.lang_id = 1`;

        let param = req.params.id

        if (param === 'ALL') {
            let finalQuery = query.concat('', `;`)
            dbConf.query(finalQuery,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get coordinate error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get coordinate success`);

                    }

                });

        } else {
            let finalQuery = query.concat('', ` AND category = '${param}';`)

            dbConf.query(finalQuery,
                (err, results) => {


                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get coordinate error! ${err}`);

                    }

                    res.status(200).send(results);
                    console.log(timestamp + `get coordinate success`);

                })
        }

    },
    //DONE : UPDATED 20240415
    totalOrderVolume: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;

        let query = `
        SELECT COALESCE(ttl_order_now,0) ttl_order_now, COALESCE(ttl_order_lm,0) ttl_order_lm, cont_40hc, cont_40hc_qty, cont_40, cont_40_qty, cont_20, cont_20_qty, truck, truck_qty, round((((COALESCE(ttl_order_now,0) - COALESCE(ttl_order_lm,0)) / COALESCE(ttl_order_lm,1)) * 100),0) diff
				FROM 
				(SELECT sum(COALESCE(ms.qty,0) * uom) ttl_order_now
				FROM m_order mo 
				INNER JOIN m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id
				INNER JOIN (SELECT product_code, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp ON ms.sku = mp.product_code 
				WHERE MONTH(mo.po_date) = MONTH(now()) AND mo.status NOT IN (0,77,99)) mtd,
				(SELECT sum(COALESCE(qty,0) * uom) ttl_order_lm
				FROM m_order mo 
				INNER JOIN m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id 
				INNER JOIN (SELECT product_code, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp ON ms.sku = mp.product_code 
				WHERE MONTH(mo.po_date) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH) AND mo.status NOT IN (77,99)) lm,
				(SELECT COALESCE(sum(COALESCE(cont_40hc,0)),0) cont_40hc, sum(qty) cont_40hc_qty FROM (SELECT mo.po_buyer, sum(COALESCE(md.cont_qty,0)) cont_40hc, sum(COALESCE(md.qty1 * mp1.uom,0) + COALESCE(md.qty2 * mp2.uom,0) + COALESCE(md.qty3 * mp3.uom,0)) qty FROM m_order mo 
				INNER JOIN m_order_dtl md ON mo.order_id = md.order_id AND mo.company_id = md.company_id 
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp1 ON md.sku1 = mp1.product_code
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp2 ON md.sku2 = mp2.product_code
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp3 ON md.sku3 = mp3.product_code
				WHERE mo.status NOT IN (0,77,99) AND md.cont_size = 4 AND MONTH(mo.po_date) = MONTH(now())
				GROUP BY mo.po_buyer 
				)a ) 40hc,
				(SELECT COALESCE(sum(COALESCE(cont_40,0)),0) cont_40, sum(qty) cont_40_qty FROM (SELECT mo.po_buyer, sum(COALESCE(md.cont_qty,0)) cont_40, sum(COALESCE(md.qty1 * mp1.uom,0) + COALESCE(md.qty2 * mp2.uom,0) + COALESCE(md.qty3 * mp3.uom,0)) qty FROM m_order mo 
				INNER JOIN m_order_dtl md ON mo.order_id = md.order_id AND mo.company_id = md.company_id 
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp1 ON md.sku1 = mp1.product_code
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp2 ON md.sku2 = mp2.product_code
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp3 ON md.sku3 = mp3.product_code
				WHERE mo.status NOT IN (0,77,99) AND md.cont_size = 2 AND MONTH(mo.po_date) = MONTH(now())
				GROUP BY mo.po_buyer 
				)a ) 40ft,
				(SELECT COALESCE(sum(COALESCE(cont_20,0)),0) cont_20, sum(qty) cont_20_qty FROM (SELECT mo.po_buyer, sum(COALESCE(md.cont_qty,0)) cont_20, sum(COALESCE(md.qty1 * mp1.uom,0) + COALESCE(md.qty2 * mp2.uom,0) + COALESCE(md.qty3 * mp3.uom,0)) qty 
				FROM m_order mo 
				INNER JOIN m_order_dtl md ON mo.order_id = md.order_id AND mo.company_id = md.company_id 
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp1 ON md.sku1 = mp1.product_code
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp2 ON md.sku2 = mp2.product_code
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp3 ON md.sku3 = mp3.product_code
				WHERE mo.status NOT IN (0,77,99) AND md.cont_size = 1 AND MONTH(mo.po_date) = MONTH(now())
				GROUP BY mo.po_buyer 
				)a ) 20ft,
				(SELECT COALESCE(sum(COALESCE(truck,0)),0) truck, sum(qty) truck_qty FROM (SELECT mo.po_buyer, sum(COALESCE(md.cont_qty,0)) truck, sum(COALESCE(ms.qty * mp.uom,0)) qty 
				FROM m_order mo 
				INNER JOIN m_order_dtl md ON mo.order_id = md.order_id AND mo.company_id = md.company_id 
				INNER JOIN m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id 
				LEFT JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp ON ms.sku = mp.product_code
				WHERE mo.status NOT IN (0,77,99) AND md.cont_size = 8 AND MONTH(mo.po_date) = MONTH(now())
				GROUP BY mo.po_buyer 
				)a ) truck
        `;



        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {


            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get totalOrderVolume error! ${err}`);

                    } else {

                        if (results) {

                            let dataDiff = parseInt(results[0].diff)
                            let increase = dataDiff.toString().includes('-') ? false : true;
                            let diffPercent = dataDiff.toFixed(1);
                            let ttl_order_lm = results[0].ttl_order_lm
                            let ttl_order_now = results[0].ttl_order_now

                            let cont_20 = results[0].cont_20
                            let cont_40 = results[0].cont_40
                            let cont_40hc = results[0].cont_40hc
                            let cont_20_qty = results[0].cont_20_qty
                            let cont_40_qty = results[0].cont_40_qty
                            let cont_40hc_qty = results[0].cont_40hc_qty
                            let truck = results[0].truck
                            let truck_qty = results[0].truck_qty

                            res.status(200).send({
                                increase,
                                diffPercent,
                                ttl_order_lm,
                                ttl_order_now,
                                cont_20,
                                cont_40,
                                cont_40hc,
                                cont_20_qty,
                                cont_40_qty,
                                cont_40hc_qty,
                                truck,
                                truck_qty
                            });
                            console.log(timestamp + `get totalOrderVolume success: res send`);

                        } else {
                            res.status(200).send();
                            console.log(timestamp + `get totalOrderVolume success: no results`);
                        }

                    }

                });
        } else {
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }
    },
    ////DONE : UPDATED 20240415
    incomingOrderVolume: async (req, res) => {

        // LINE GRAPH

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;


        let selector = req.query.show_by

        //in week

        // quarterly
        let query_default = `
                SELECT doc.year po_year, doc.week po_date, sum(ms.qty * uom) volume FROM m_order mo 
                INNER JOIN m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id 
                INNER JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp ON ms.sku = mp.product_code 
                LEFT JOIN dat_operational_calendar doc on
                opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(CASE YEAR WHEN YEAR(now()) THEN now() ELSE date_add(now(), INTERVAL 1 YEAR) END , '%Y-01-01')),
                8) AND LEFT(unix_timestamp(DATE_FORMAT(po_date, '%Y-%m-%d')), 8) = doc.opcal_id 
                WHERE mo.status NOT IN (0,77,99) AND mo.po_date BETWEEN DATE_FORMAT((CURRENT_DATE - INTERVAL 3 MONTH), '%Y-%m-01') AND now()
                GROUP BY 1,2
                ORDER BY 1,2 ASC`;


        let query_month = `
                SELECT year(po_date) po_year, DATE_FORMAT(po_date,'%m/%d') po_date, sum(ms.qty * uom) volume FROM m_order mo 
                INNER JOIN m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id 
                INNER JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp ON ms.sku = mp.product_code 
                WHERE mo.status NOT IN (0,77,99) AND mo.po_date BETWEEN DATE_FORMAT((CURRENT_DATE - INTERVAL 1 MONTH), '%Y-%m-%d') AND now()
                GROUP BY 1,2
                ORDER BY 1,2 ASC `;
        let query_year = `
                SELECT year(po_date) po_year, DATE_FORMAT(po_date,'%m') po_month, DATE_FORMAT(po_date,'%b') po_date, sum(ms.qty * uom) volume FROM m_order mo 
                INNER JOIN m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id 
                INNER JOIN (SELECT company_id, product_code, country_id, CASE ${uom} WHEN 1 THEN per_carton ELSE 1 END uom FROM mst_product WHERE active = 1) mp ON ms.sku = mp.product_code 
                WHERE mo.status NOT IN (0,77,99) AND mo.po_date BETWEEN DATE_FORMAT((CURRENT_DATE), '%Y-01-01') AND now()
                GROUP BY 1,2
                ORDER BY 1,2 ASC `;


        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query((selector == 'month' ? query_month : selector == 'year' ? query_year : query_default),
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get incomingOrderVolume error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get incomingOrderVolume success`);

                    }

                });

        } else {

            console.log(timestamp + `get incomingOrderVolume UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
    //DONE : UPDATED 20240415
    topCountry: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;
        let limit = req.query.upto ? parseInt(req.query.upto) : 5;


        /*
        req query: 
        upto= (max data that shown)
        from = (date from)
        until = (date end)

        */

        function timelimit() {
            if (req.query.from && req.query.until) {
                return `AND mo.po_date BETWEEN '${req.query.from}' AND '${req.query.until}'`
            } else {
                return `AND mo.po_date BETWEEN CURRENT_DATE - INTERVAL 1 MONTH AND CURRENT_DATE`
            }
        }

        let query = `
    SELECT
        st.txt country_name,
        sum(ms.qty * uom) sales
    FROM
        m_order mo
    INNER JOIN m_summary ms ON
        mo.order_id = ms.order_id
        AND mo.company_id = ms.company_id
    INNER JOIN (
        SELECT
            company_id,
            product_code,
            country_id,
            CASE
                ${uom} WHEN 1 THEN per_carton
                ELSE 1
            END uom
        FROM
            mst_product
        WHERE
            active = 1) mp ON
        ms.sku = mp.product_code
    LEFT JOIN mst_company mc ON
        mo.company_id = mc.company_id
    LEFT JOIN mst_country my ON
        mc.country_id = my.country_id
    LEFT JOIN sys_text st ON
        my.country_name_id = st.text_id
        AND st.lang_id = 1
    WHERE
        mo.status NOT IN (0, 77, 99)
        ${timelimit()}
    GROUP BY
        1
    ORDER BY
        2 DESC
    LIMIT ${limit}
    

        `;

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get topCountry error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get topCountry success`);

                    }

                }
            );

        } else {
            console.log(timestamp + `get topCountry UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }


    },
    ////DONE : UPDATED 20240415
    totalOrderByWeek: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;

        let query = `
        SELECT
	po_year,
	week,
	sum(volume) volume
FROM
	(
	SELECT
		DISTINCT YEAR po_year,
		week,
		0 volume
	FROM
		dat_operational_calendar
	WHERE
		opcal_id >= LEFT(UNIX_TIMESTAMP(DATE_FORMAT(now(), '%Y-01-01')),
		8)
		AND factory_id = 1
		AND year >= YEAR(now())
UNION
	SELECT
		doc.year po_year,
		doc.week,
		sum(ms.qty * uom) volume
	FROM
		m_order mo
	INNER JOIN m_summary ms ON
		mo.order_id = ms.order_id
		AND mo.company_id = ms.company_id
	INNER JOIN (
		SELECT
			company_id,
			product_code,
			country_id,
			CASE
				${uom} WHEN 1 THEN per_carton
				ELSE 1
			END uom
		FROM
			mst_product
		WHERE
			active = 1) mp ON
		ms.sku = mp.product_code
	LEFT JOIN (
		SELECT
			DISTINCT company_id,
			YEAR,
			DATE_FORMAT(FROM_UNIXTIME(CONCAT(opcal_id, '00')), '%Y-%m-%d') tgl,
			week
		FROM
			dat_operational_calendar
		WHERE
			opcal_id >= LEFT(UNIX_TIMESTAMP(DATE_FORMAT(now(), '%Y-01-01')),
			8)
				AND factory_id = 1
				AND year >= YEAR(now())) doc ON
		DATE_FORMAT(mo.po_date, '%Y-%m-%d') = doc.tgl
	WHERE
		mo.status NOT IN (0, 77, 99)
	GROUP BY
		1,
		2
	ORDER BY
		1,
		2 ASC  
) a
GROUP BY
	1,
	2
ORDER BY
	1,
	2 ASC `;

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {


            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send({
                            success: false,
                            err
                        });
                        console.log(timestamp + `get totalOrderByWeek error! ${err}`);

                    } else {

                        res.status(200).send({
                            success: true,
                            results
                        });
                        console.log(timestamp + `get totalOrderByWeek success`);

                    }

                }
            );

        } else {
            console.log(timestamp + `get totalOrderByWeek UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: 'UNAUTHORIZED'
            });
        }

    },
    // DONE : UPDATED 20240415
    topDistributor: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;
        let limit = req.query.upto ? parseInt(req.query.upto) : 5;

        /*
        req query: 
        upto = (max data that shown) 
        */

        let query = `
    SELECT
        mc.company_name,
        st.txt,
        sum(ms.qty * uom) sales
    FROM
        m_order mo
    INNER JOIN m_summary ms ON
        mo.order_id = ms.order_id
        AND mo.company_id = ms.company_id
    INNER JOIN (
        SELECT
            product_code,
            CASE
                ${uom} WHEN 1 THEN per_carton
                ELSE 1
            END uom
        FROM
            mst_product
        WHERE
            active = 1) mp ON
        ms.sku = mp.product_code
    LEFT JOIN mst_company mc ON
        mo.ship_to = mc.company_id
    LEFT JOIN mst_country my ON
        mc.country_id = my.country_id
    LEFT JOIN sys_text st ON
        my.country_name_id = st.text_id
        AND st.lang_id = 1
    WHERE
        mo.status NOT IN (0, 77, 99)
        AND mo.po_date BETWEEN '2024-02-21' AND now()
    GROUP BY
        1,
        2
    ORDER BY
        3 DESC
    LIMIT ${limit};`;

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get topDistributor error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get topDistributor success`);

                    }

                });

        } else {

            console.log(timestamp + `get topDistributor UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }

    },
    // DONE : UPDATED 20240415
    topFlavour: async (req, res) => {

        /*
        req query: 
        upto= (max data that shown)
        from = (date from)
        until = (date end)

        */

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;
        let limit = req.query.upto ? parseInt(req.query.upto) : 5;

        function timelimit() {
            if (req.query.from && req.query.until) {
                return `AND mo.po_date BETWEEN '${req.query.from}' AND '${req.query.until}'`
            } else {
                return `AND mo.po_date BETWEEN CURRENT_DATE - INTERVAL 1 MONTH AND CURRENT_DATE`
            }
        }

        let query = `
    SELECT
        mf.flavour_name,
        sum(ms.qty * uom) sales
    FROM
        m_order mo
    INNER JOIN m_summary ms ON
        mo.order_id = ms.order_id
        AND mo.company_id = ms.company_id
    INNER JOIN (
        SELECT
            company_id,
            product_code,
            flavour_id,
            CASE
                ${uom} WHEN 1 THEN per_carton
                ELSE 1
            END uom
        FROM
            mst_product
        WHERE
            active = 1) mp ON
        ms.sku = mp.product_code
    LEFT JOIN mst_flavour mf ON
        mp.flavour_id = mf.flavour_id
        AND mp.company_id = mf.company_id
    WHERE
        mo.status NOT IN (0, 77, 99)
       ${timelimit()} 
    GROUP BY
        1
    ORDER BY
        2 DESC
    LIMIT ${limit}`

        /*`
SELECT
    mf.flavour_name,
    sum(ms.qty * uom) sales
FROM
    m_order mo
INNER JOIN m_summary ms ON
    mo.order_id = ms.order_id
    AND mo.company_id = ms.company_id
INNER JOIN (
    SELECT
        company_id,
        product_code,
        flavour_id,
        CASE
            ${uom} WHEN 1 THEN per_carton
            ELSE 1
        END uom
    FROM
        mst_product
    WHERE
        active = 1) mp ON
    ms.sku = mp.product_code
LEFT JOIN mst_flavour mf ON
    mp.flavour_id = mf.flavour_id
    AND mp.company_id = mf.company_id
WHERE
    mo.status NOT IN (77, 99)
    ${timelimit()}
GROUP BY
    1
ORDER BY
    2 DESC
LIMIT ${limit} 
`;
*/

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get topFlavour error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get topFlavour success`);

                    }

                }
            );

        } else {

            console.log(timestamp + `get topFlavour UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
    // DONE : ON TESTING
    byCont20: async (req, res) => {

        /*
        req query: 
        upto= (max data that shown)
        from = (date from)
        until = (date end)

        */

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;
        let limit = req.query.upto ? parseInt(req.query.upto) : 5;

        function timelimit() {
            if (req.query.from && req.query.until) {
                return `AND mo.po_date BETWEEN '${req.query.from}' AND '${req.query.until}'`
            } else {
                return `AND mo.po_date BETWEEN CURRENT_DATE - INTERVAL 1 MONTH AND CURRENT_DATE`
            }
        }

        let query = `
SELECT
	mf.flavour_name,
	sum(ms.qty * uom) sales
FROM
	m_order mo
INNER JOIN m_summary ms ON
	mo.order_id = ms.order_id
	AND mo.company_id = ms.company_id
INNER JOIN (
	SELECT
		company_id,
		product_code,
		flavour_id,
		CASE
			${uom} WHEN 1 THEN per_carton
			ELSE 1
		END uom
	FROM
		mst_product
	WHERE
		active = 1) mp ON
	ms.sku = mp.product_code
LEFT JOIN mst_flavour mf ON
	mp.flavour_id = mf.flavour_id
	AND mp.company_id = mf.company_id
WHERE
	mo.status NOT IN (77, 99)
	${timelimit()}
GROUP BY
	1
ORDER BY
	2 DESC
LIMIT ${limit}
        `;

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get topFlavour error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get topFlavour success`);

                    }

                }
            );

        } else {

            console.log(timestamp + `get topFlavour UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
    byCont40hc: async (req, res) => {

        /*
        req query: 
        upto= (max data that shown)
        from = (date from)
        until = (date end)

        */

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;
        let limit = req.query.upto ? parseInt(req.query.upto) : 5;

        function timelimit() {
            if (req.query.from && req.query.until) {
                return `AND mo.po_date BETWEEN '${req.query.from}' AND '${req.query.until}'`
            } else {
                return `AND mo.po_date BETWEEN CURRENT_DATE - INTERVAL 1 MONTH AND CURRENT_DATE`
            }
        }

        let query = `
SELECT
	mf.flavour_name,
	sum(ms.qty * uom) sales
FROM
	m_order mo
INNER JOIN m_summary ms ON
	mo.order_id = ms.order_id
	AND mo.company_id = ms.company_id
INNER JOIN (
	SELECT
		company_id,
		product_code,
		flavour_id,
		CASE
			${uom} WHEN 1 THEN per_carton
			ELSE 1
		END uom
	FROM
		mst_product
	WHERE
		active = 1) mp ON
	ms.sku = mp.product_code
LEFT JOIN mst_flavour mf ON
	mp.flavour_id = mf.flavour_id
	AND mp.company_id = mf.company_id
WHERE
	mo.status NOT IN (77, 99)
	${timelimit()}
GROUP BY
	1
ORDER BY
	2 DESC
LIMIT ${limit}
        `;

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get topFlavour error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get topFlavour success`);

                    }

                }
            );

        } else {

            console.log(timestamp + `get topFlavour UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
    byTrucking: async (req, res) => {

        /*
        req query: 
        upto= (max data that shown)
        from = (date from)
        until = (date end)

        */

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uom = req.params.uom == 'pack' ? 1 : req.params.uom == 'carton' ? 2 : 0;
        let limit = req.query.upto ? parseInt(req.query.upto) : 5;

        function timelimit() {
            if (req.query.from && req.query.until) {
                return `AND mo.po_date BETWEEN '${req.query.from}' AND '${req.query.until}'`
            } else {
                return `AND mo.po_date BETWEEN CURRENT_DATE - INTERVAL 1 MONTH AND CURRENT_DATE`
            }
        }

        let query = `
SELECT
	mf.flavour_name,
	sum(ms.qty * uom) sales
FROM
	m_order mo
INNER JOIN m_summary ms ON
	mo.order_id = ms.order_id
	AND mo.company_id = ms.company_id
INNER JOIN (
	SELECT
		company_id,
		product_code,
		flavour_id,
		CASE
			${uom} WHEN 1 THEN per_carton
			ELSE 1
		END uom
	FROM
		mst_product
	WHERE
		active = 1) mp ON
	ms.sku = mp.product_code
LEFT JOIN mst_flavour mf ON
	mp.flavour_id = mf.flavour_id
	AND mp.company_id = mf.company_id
WHERE
	mo.status NOT IN (77, 99)
	${timelimit()}
GROUP BY
	1
ORDER BY
	2 DESC
LIMIT ${limit}
        `;

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get topFlavour error! ${err}`);

                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + `get topFlavour success`);

                    }

                }
            );

        } else {

            console.log(timestamp + `get topFlavour UNAUTHORIZED`);
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
    allOrder: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;

        let order_by_week = req.query.order_by_week ? ` ORDER BY mo.delv_week ` : ` ORDER BY mo.po_date `;
        let desc = req.query.desc ? `DESC ` : ``;
        let status = parseInt(req.query.status) ? ` AND mo.status = ${parseInt(req.query.status)}` : ``;

        let stuffingstart = parseInt(req.query.stuffingstart) ? req.query.stuffingstart : '1';
        let stuffingend = parseInt(req.query.stuffingend) ? req.query.stuffingend : '99';

        let range = stuffingstart || stuffingend ? ` AND  mo.delv_week BETWEEN ${stuffingstart} AND ${stuffingend} ` : ``
        let find = req.query.find ? ` AND mo.po_buyer LIKE '%${req.query.find}%'` : ''

        let company_id = parseInt(req.query.company_id) ? `AND mo.company_id = ${parseInt(req.query.company_id)}` : ``;


        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let available_week = (await dbQuery(`SELECT DISTINCT mo.delv_week, mo.delv_week_desc FROM m_order mo`))
        let available_company_id = (await dbQuery(`SELECT DISTINCT mo.company_id, mc.company_name  FROM m_order mo LEFT JOIN mst_company mc ON mo.company_id = mc.company_id `))

        let query = `
    SELECT
        coun.country_desc country,
        mc.company_name distributor_name ,
        mh.harbour_name port_of_discharge,
        mo.order_id ,
        mo.po_buyer ,
        mp.product_sku , 
        sum(ms2.qty) sum_of_qty,
        mo.delv_week week_delivery,
        mo.po_date,
        concat(p.firstname, " ", p.lastname) submitted_by,
        mo.delv_year year,
        mos.status_order order_status
    FROM
        m_order mo
    LEFT JOIN mst_company mc ON
        mo.company_id = mc.company_id
    LEFT JOIN mst_country coun ON
        mc.country_id = coun.country_id
    LEFT JOIN mst_harbour mh ON 
        mh.harbour_id = mo.port_shipment
    LEFT JOIN m_summary ms2 ON
        ms2.order_id = mo.order_id
    LEFT JOIN mst_product mp ON
        mp.product_code = ms2.sku
    LEFT JOIN person p ON
        p.person_id = mo.created_by
    LEFT JOIN m_order_status mos ON
        mos.id = mo.status
    WHERE mo.company_id > 0 GROUP BY mo.order_id `+ status + find + order_by_week + desc + company_id;

        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get allOrder error! ${err}`);

                    } else {

                        let packet = results.slice(startIndex, endIndex)
                        let totalDataLength = results.length
                        let totalPage = Math.round(results.length / limit)

                        res.status(200).send({ packet, available_week, available_company_id, totalPage, totalDataLength, page });

                        console.log(timestamp + `get allOrder success`);

                    }

                }
            );

        } else {
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
    orderDetail: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let order_id = req.params.order_id ? parseInt(req.params.order_id) : 0

        let query = `
    SELECT
        det.order_id ,
        mc.company_name,
        concat(su.firstname, ' ', su.lastname) created_by  ,
        det.detail_id,
        mc2.container_name,
        det.cont_qty, 
        mp1.product_sku sku_1,
        COALESCE(mp1.product_name, mp1.product_name_no) sku_name_1,
        det.qty1,
        mp2.product_sku sku_2,
        COALESCE(mp2.product_name, mp2.product_name_no) sku_name_2,
        det.qty2,
        mp3.product_sku sku_3,
        COALESCE(mp3.product_name, mp3.product_name_no) sku_name_3,
        det.qty3,
        det.remarks 
    FROM
        m_order_dtl det
    LEFT JOIN mst_company mc ON
        mc.company_id = det.company_id
    LEFT JOIN sys_user su ON
        su.user_id = det.created_by
    LEFT JOIN mst_container mc2 ON
        mc2.container_id = det.cont_size 
    LEFT JOIN mst_product mp1 ON
        mp1.product_code = det.sku1
    LEFT JOIN mst_product mp2 ON
        mp2.product_code = det.sku2
    LEFT JOIN mst_product mp3 ON
        mp3.product_code = det.sku3
    WHERE
        det.order_id = ${order_id}; `



        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get orderDetail error! ${err}`);

                    } else {

                        res.status(200).send({ results, success: true });

                        console.log(timestamp + `get orderDetail success`);

                    }

                }
            );

        } else {
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
    orderSummary: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let order_id = req.params.order_id ? parseInt(req.params.order_id) : 0

        let query = `
    SELECT
        ms.order_id,
        ms.company_id,
        ms.po_buyer,
        ms.detail_id, 
        mp.product_sku,
        COALESCE(mp.product_name_no, mp.product_name) product_name,
        ms.qty ,
        ms.top_desc,
        ms.remarks ,
        ms.delv_date, 
        mo.status,
        mos.status_order
    FROM
        m_summary ms
    LEFT JOIN mst_product mp ON
        mp.product_code = ms.sku
    LEFT JOIN m_order mo ON
        mo.order_id = ms.order_id
    LEFT JOIN m_order_status mos ON
        mos.id = mo.status
    WHERE
        ms.order_id = ${order_id} ; `



        if (req.dataToken.type_id == 7 || req.dataToken.type_id == 9 || req.dataToken.type_id == 8) {

            dbConf.query(query,
                (err, results) => {

                    if (err) {

                        res.status(500).send(err);
                        console.log(timestamp + `get orderSummary error! ${err}`);

                    } else {

                        res.status(200).send({ results, success: true });

                        console.log(timestamp + `get orderSummary success`);

                    }

                }
            );

        } else {
            res.status(401).send({
                success: false,
                message: "UNAUTHORIZED"
            });
        }



    },
}



// let finalQuery = query.concat('', `WHERE category = '${req.params.id}';`)