const { dbConf, dbQuery, addSqlLogger } = require("../../config/db");
const log = require('../../core/logger');
const fs = require('fs');

//20230804 : ad and change some query

let gray = "\x1b[90m"
module.exports = {
    getProductCatalog: async (req, res) => {
        try {
            if (req.dataToken.user_id) {
                const companyId = req.dataToken.company_id;

                const productQuery = `
                SELECT DISTINCT
                    UPPER(CONCAT(COALESCE(mp.product_name_no, mp.product_name), ' - ', mp.product_sku)) AS product_name_complete,
                    tc.txt AS country_name,
                    mpc.product_type_name AS cat_name,
                    mc.company_name,
                    mp.product_code,
                    UPPER(mp.product_sku) AS product_sku,
                    UPPER(COALESCE(mp.product_name_no, mp.product_name)) AS product_name,
                    mp.ctn_height,
                    mp.ctn_length,
                    mp.ctn_width,
                    mp.ctn_thick,
                    mp.cont20,
                    mp.cont40,
                    mp.cont40hc,
                    COALESCE(mi.moq, 0) AS moq,
                    COALESCE(mi.truck, 0) AS truck_moq,
                    COALESCE(mi.moq20, 0) AS moq20,
                    -- Pricing Subqueries
                    (SELECT rate_unit FROM trs_so_detail WHERE client_id = mi.distributor_id AND company_id = mp.company_id AND sku_id = mp.product_code ORDER BY so_id DESC, version DESC LIMIT 1) rate_unit,
                    (SELECT value FROM trs_so_detail WHERE client_id = mi.distributor_id AND company_id = mp.company_id AND sku_id = mp.product_code ORDER BY so_id DESC, version DESC LIMIT 1) price,
                    link.img,
                    link.order,
                    mb.brand_name,
                    mp.net_weight,
                    mp.per_carton,
                    mf.flavour_desc AS flavour_name,
                    mp.tolling_id,
                    mi.truck_load,
                    mi.qty_per_pallet,
                    mi.shipment_type
                FROM map_item_for_dist mi
                JOIN mst_company mc ON mi.distributor_id = mc.company_id
                JOIN mst_product mp ON mi.product_id = mp.product_id AND mp.company_id = 100
                JOIN iod.map_fac_for_dist mffd ON mffd.dist_id = mi.distributor_id AND mffd.company_id = mp.company_id
                LEFT JOIN mst_country c ON mc.country_id = c.country_id
                LEFT JOIN sys_text tc ON c.country_name_id = tc.text_id AND tc.lang_id = 1
                LEFT JOIN m_product_link link ON mp.product_code = link.product_code AND link.flag = 1
                LEFT JOIN mst_brand mb ON mb.brand_id = mp.brand_id AND mb.company_id = mp.company_id
                LEFT JOIN mst_product_type mpc ON mp.product_type_id = mpc.product_type_id AND mp.division_id = mpc.division_id
                LEFT JOIN mst_flavour mf ON mf.flavour_id = mp.flavour_id
                WHERE
                    NOW() BETWEEN mi.creation_date AND COALESCE(mi.finish_date, '9999-12-31')
                    AND mi.distributor_id = ?
                    AND mf.company_id = 100
                    AND JSON_CONTAINS(mffd.tolling_id, CAST(mp.tolling_id AS JSON))
                ORDER BY
                    mpc.product_type_id DESC;
                `;

                const containerQuery = `
                    SELECT mc.container_id, mc.container_name 
                    FROM map_cont_for_dist mcfd 
                    LEFT JOIN mst_container mc ON mcfd.cont_type & mc.container_id 
                    WHERE mcfd.company_id = 100 AND mcfd.dist_id = ?;
                `;

                const [products, containers] = await Promise.all([
                    dbQuery(productQuery, [companyId]),
                    dbQuery(containerQuery, [companyId])
                ]);

                res.status(200).send({
                    products,
                    containers
                });

                log.eorder.info(`get consolidated catalog for ${companyId} success`);

            } else {
                res.status(401).send({ success: false, message: 'unauthorized' })
            }
        } catch (error) {
            log.eorder.error(`get product catalog error: ${error.message}`);
            res.status(500).send({ success: false, error: error.message });
        }
    },
    // Simplified and unified product fetching end
    getOMCode: async (req, res) => {

        /**
         * Produk yang ditampilkan hanya product yang MOQnya nol
        * hal ini untuk menyaring produk dari IAI, SWK, dan SWT.
        */

        try {
            if (req.dataToken.user_id) {

                let date = new Date();
                let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

                // add query AND mp.division_id = mpc.division_id 

                let query = `
                    SELECT JSON_OBJECTAGG(other_code, product_code) AS skuMap
                    FROM map_product_code
                    where 
                    distributor_id = ${req.dataToken.company_id}
                    ;
                `

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        log.eorder.info(`get om code catalog for ${req.dataToken.company_id} error! ${err}`);
                    } else {
                        res.status(200).send(results);
                        log.eorder.info(`get om code catalog for ${req.dataToken.company_id} success`);
                        // addSqlLogger(req.dataToken.user_id, (query), '-- data getProductCatalog', ` getProductCatalog`)

                    }

                })

            } else {

                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })

            }
        } catch (error) {

            if (error) {
                res.status(500).send(error);
                log.eorder.info(`get product order error! ${error}`);
            }
        }



    }
};


// ARCHIVED / UNUSED FUNCTIONS
// -----------------------------------------------------------------------------
const archived = {
    getProductOrder_OLD: async (req, res) => {
        /**
         * Produk yang ditampilkan hanya product yang MOQnya lebih dari nol
         * hal ini untuk mencegah produk dari IAI, SWK, dan SWT tampil pada get product.
         * 
         * add AND mp.division_id = mpc.division_id 
         * ===================
         * 20240502 = SELAMAT HARI PENDIDIKAN NASIONAL
         */

        try {
            let query = req.query.trucking == 1 ? `
            SELECT
            DISTINCT UPPER(CONCAT(COALESCE(mp.product_name_no, mp.product_name), " - ", mp.product_sku )) product_name_complete ,
            tc.txt country_name,
            mpc.product_type_name cat_name ,
            mc.company_name,
            mp.product_code,
            UPPER(mp.product_sku) product_sku,
            UPPER(COALESCE(mp.product_name_no, mp.product_name)) product_name,
            mp.ctn_height,
            mp.ctn_length,
            mp.ctn_width,
            mp.ctn_thick,
            mp.cont20,
            mp.cont40,
            mp.cont40hc,
            mi.qty_per_pallet,
            COALESCE(mi.moq, 0) moq ,
                    coalesce(mi.truck, 0) truck_moq,
            COALESCE(mi.moq20, 0) moq20 ,
            (
            SELECT
                rate_unit
            FROM
                trs_so_detail
            WHERE
                client_id = mi.distributor_id
                AND company_id = mp.company_id
                AND sku_id = mp.product_code
            ORDER BY
                so_id DESC,
                version DESC
            LIMIT 1) rate_unit,
            (
            SELECT
                value
            FROM
                trs_so_detail
            WHERE
                client_id = mi.distributor_id
                AND company_id = mp.company_id
                AND sku_id = mp.product_code
            ORDER BY
                so_id DESC,
                version DESC
            LIMIT 1) price,
            link.img,
            link.order ,
            mb.brand_name,
            mp.net_weight,
            mp.per_carton ,
            mf.flavour_desc flavour_name,
            mp.tolling_id,
            mp.truck AS truck_load
        FROM
            map_item_for_dist mi
        LEFT JOIN mst_company mc ON
            mi.distributor_id = mc.company_id
        INNER JOIN mst_product mp ON
            mi.product_id = mp.product_id
            AND mp.company_id = 100
            AND mp.active = 1
        LEFT JOIN mst_country c ON
            mc.country_id = c.country_id
        LEFT JOIN sys_text tc ON
            c.country_name_id = tc.text_id
            AND tc.lang_id = 1
        LEFT JOIN m_product_link link ON
            mp.product_code = link.product_code
            AND flag = 1
        LEFT JOIN mst_brand mb ON
            mp.brand_id = mb.brand_id
            AND mp.company_id = mb.company_id
        LEFT JOIN mst_product_type mpc ON
            mp.product_type_id = mpc.product_type_id
            AND mp.division_id = mpc.division_id
        LEFT JOIN mst_flavour mf ON
            mf.flavour_id = mp.flavour_id
        WHERE
            now() BETWEEN mi.creation_date AND COALESCE(mi.finish_date, '9999-12-31')
            AND mi.distributor_id = ${req.dataToken.company_id}
            AND mf.company_id = 100
            AND mp.tolling_id IN (1, 6)
        ORDER BY
            mpc.product_type_name  
            `: `


            SELECT
	DISTINCT UPPER(CONCAT(COALESCE(mp.product_name_no, mp.product_name), " - ", mp.product_sku )) product_name_complete ,
	tc.txt country_name,
	mpc.product_type_name cat_name ,
	mc.company_name,
	mp.product_code,
	UPPER(mp.product_sku) product_sku,
	UPPER(COALESCE(mp.product_name_no, mp.product_name)) product_name,
	mp.ctn_height,
	mp.ctn_length,
	mp.ctn_width,
	mp.ctn_thick,
	mp.cont20,
	mp.cont40,
	mp.cont40hc,
	COALESCE(mi.moq, 0) moq ,
                    coalesce(mi.truck, 0) truck_moq,
	COALESCE(mi.moq20, 0) moq20 ,
	(
	SELECT
		rate_unit
	FROM
		trs_so_detail
	WHERE
		client_id = mi.distributor_id
		AND company_id = mp.company_id
		AND sku_id = mp.product_code
	ORDER BY
		so_id DESC,
		version DESC
	LIMIT 1) rate_unit,
	(
	SELECT
		value
	FROM
		trs_so_detail
	WHERE
		client_id = mi.distributor_id
		AND company_id = mp.company_id
		AND sku_id = mp.product_code
	ORDER BY
		so_id DESC,
		version DESC
	LIMIT 1) price,
	link.img,
	link.order ,
	mb.brand_name,
	mp.net_weight,
	mp.per_carton ,
	mf.flavour_desc flavour_name,
	mp.tolling_id,
    mp.truck AS truck_load
FROM
	map_item_for_dist mi
LEFT JOIN mst_company mc ON
	mi.distributor_id = mc.company_id
INNER JOIN mst_product mp ON
	mi.product_id = mp.product_id
	AND mp.company_id = 100
	AND mp.active = 1
LEFT JOIN mst_country c ON
	mc.country_id = c.country_id
LEFT JOIN sys_text tc ON
	c.country_name_id = tc.text_id
	AND tc.lang_id = 1
LEFT JOIN m_product_link link ON
	mp.product_code = link.product_code
	AND flag = 1
LEFT JOIN mst_brand mb ON
	mp.brand_id = mb.brand_id
	AND mp.company_id = mb.company_id
LEFT JOIN mst_product_type mpc ON
	mp.product_type_id = mpc.product_type_id
	AND mp.division_id = mpc.division_id
LEFT JOIN mst_flavour mf ON
	mf.flavour_id = mp.flavour_id
WHERE
	now() BETWEEN mi.creation_date AND COALESCE(mi.finish_date, '9999-12-31')
	AND mi.distributor_id = ${req.dataToken.company_id}
	AND mf.company_id = 100
	AND mp.tolling_id NOT IN (1, 6)
	AND COALESCE( mi.moq, 0 ) > 0
ORDER BY
	mpc.product_type_name  
            `;
            if (req.dataToken.user_id) {

                let date = new Date();
                let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
                // timestamp + 

                // let { company_id } = req.body;

                dbConf.query(query,
                    (err, results) => {

                        if (err) {
                            res.status(500).send(err);
                            log.eorder.info(`get product order for ${req.dataToken.company_id} error! ${err}`);
                        } else {

                            res.status(200).send(results);
                            log.eorder.info(`get product order for ${req.dataToken.company_id} success`);
                        }


                    });

            } else {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })
            }
        } catch (error) {

            if (error) {
                res.status(500).send(error);
                log.eorder.info(`get product order error! ${error}`);
            }
        }


    },
    getProductTrucking_OLD: async (req, res) => {

        /**
         * Produk yang ditampilkan hanya product yang MOQnya nol
         * hal ini untuk menyaring produk dari IAI, SWK, dan SWT.
         * 
         * add AND mp.division_id = mpc.division_id 
         */

        try {
            if (req.dataToken.user_id) {

                let date = new Date();
                let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
                // timestamp + 
                let query = `
                select
                    distinct UPPER(CONCAT(coalesce(mp.product_name_no, mp.product_name), " - ", mp.product_sku )) product_name_complete ,
                    tc.txt country_name,
                    mpc.product_type_name cat_name ,
                    mc.company_name,
                    mp.product_code,
                    UPPER(mp.product_sku) product_sku,
                    UPPER(coalesce(mp.product_name_no, mp.product_name)) product_name,
                    mp.ctn_height,
                    mp.ctn_length,
                    mp.ctn_width,
                    mp.ctn_thick,
                    mp.cont20,
                    mp.cont40,
                    mp.cont40hc,
                    coalesce(mi.moq, 0) moq,
                    coalesce(mi.truck, 0) truck_moq,
                    (
                    select
                        rate_unit
                    from
                        trs_so_detail
                    where
                        client_id = mi.distributor_id
                        and company_id = mp.company_id
                        and sku_id = mp.product_code
                    order by
                        so_id desc,
                        version desc
                    limit 1) rate_unit,
                    (
                    select
                        value
                    from
                        trs_so_detail
                    where
                        client_id = mi.distributor_id
                        and company_id = mp.company_id
                        and sku_id = mp.product_code
                    order by
                        so_id desc,
                        version desc
                    limit 1) price,
                    link.img,
                    link.order ,
                    mb.brand_name,
                    mp.net_weight,
                    mp.per_carton ,
                    mf.flavour_desc flavour_name,
                    mp.tolling_id,
                    mp.truck AS truck_load
                from
                    map_item_for_dist mi
                left join mst_company mc on
                    mi.distributor_id = mc.company_id
                left join mst_product mp on
                    mi.product_id = mp.product_id
                    and mp.company_id = 100
                left join mst_country c on
                    mc.country_id = c.country_id
                left join sys_text tc on
                    c.country_name_id = tc.text_id
                    and tc.lang_id = 1
                left join m_product_link link on
                    mp.product_code = link.product_code
                    and flag = 1
                left join mst_brand mb on
                    mp.brand_id = mb.brand_id
                    and mp.company_id = mb.company_id
                left join mst_product_type mpc on
                    mp.product_type_id = mpc.product_type_id
                    and mp.division_id = mpc.division_id
                left join mst_flavour mf on
                    mf.flavour_id = mp.flavour_id
                where
                    now() between mi.creation_date and coalesce(mi.finish_date, '9999-12-31')
                    and mi.distributor_id = ${req.dataToken.company_id}
                    and coalesce( mi.moq, 0 ) > 0
                    and mf.company_id = 100
                order by
                    mpc.product_type_name
                ;`

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        log.eorder.info(`get product trucking for ${req.dataToken.company_id} error! ${err}`);
                    } else {
                        res.status(200).send(results);
                        log.eorder.info(`get product trucking for ${req.dataToken.company_id} success`);
                    }


                })

            } else {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })
            }
        } catch (error) {

            if (error) {
                res.status(500).send(error);
                log.eorder.info(`get product trucking error! ${error}`);
            }
        }



    },
}
