const {
    // untuk koneksi ke database hots
    dbHots,
    dbQueryHots,

    //untuk koneksi ke database i2i
    dbConf,
    dbQuery
} = require("../../config/db");

const { uploadFile } = require("../order");
const { hotsMailer } = require('../../mailer/hots/hots_mailer');
const { ConsoleInfo } = require("../../Utility/consoleinfo");


let green = "\x1b[32m"


/*
untuk utilitas pricing structure



*/


module.exports = {


    getRM: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        if (req.dataToken.user_id) {



            let query = ` 	-- get  RM
                              SELECT 
                                distinct UPPER(CONCAT(coalesce(rm_code, ''), " | ", rm_desc)) as product_name_complete
                                from iod.mst_rm
                            `


            dbConf.execute(query, (err, results) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error at getRM, message:", err);

                } else {
                    console.log(timestamp, "successfully getRM!");
                    res.status(200).send({
                        success: true,
                        message: "Successfully fetched SKU data",
                        results,
                    });
                }

            })




        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getRM is Unauthorized");
        }


    },

    getSKUNoFilter: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        if (req.dataToken.user_id) {



            let query = ` 	-- get SKU of distributor && RM
                            select
                                distinct UPPER(CONCAT(coalesce(mp.product_code, ''), " | ", coalesce(mp.product_name_no, mp.product_name), " - ", mp.product_sku)) as product_name_complete
                                from
                                map_item_for_dist mi
                            left join mst_company mc on
                                mi.distributor_id = mc.company_id
                            inner join mst_product mp on
                                mi.product_id = mp.product_id
                            and mp.company_id = 100
                            and mp.active = 1
                            left join mst_country c on
                                mc.country_id = c.country_id
                            left join sys_text tc on
                                c.country_name_id = tc.text_id
                            and tc.lang_id = 1
                            left join m_product_link link on
                                mp.product_code = link.product_code
                            and flag = 1
                            left join mst_rm rm on
                                
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
                            and mf.company_id = 100
                            and mp.tolling_id not in (1, 6)
                            and coalesce( mi.moq, 0 ) > 0
                            order by
                                mpc.product_type_name
                            `


            dbConf.execute(query, (err, results) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error at getSKU, message:", err);

                } else {
                    console.log(timestamp, "successfully getSKU!");
                    res.status(200).send({
                        success: true,
                        message: "Successfully fetched SKU data",
                        results,
                    });
                }

            })




        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getSKU is Unauthorized");
        }


    },

    getAllSkunRM: async (req, res) => {
        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        if (!req.dataToken.user_id) {
            console.log(timestamp, "getAllProductNames is Unauthorized");
            return res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
        }
        // `       Jadi BOM`
        const queryRM = `
            select
                distinct 
                UPPER(
                    CONCAT(
                        coalesce(mb.rm_matcode, ''), 
                        ' | ',
                        mbt.rm_type,
                        ' ',
                        mp.product_sku,
                        ' | ',
                        mb.rm_desc
                    
                    )
                ) as product_name_complete,
                mb.rm_type
            from
                iod.mst_bom mb
            left join iod.mst_product mp
                on
                mb.fg_matcode = mp.product_code
            left join iod.mst_bom_type mbt 
                on
                mbt.id = mb.rm_type
        `;


        const querySKU = `
            SELECT DISTINCT 
                UPPER(CONCAT(
                    COALESCE(mp.product_code, ''), " | ",
                    COALESCE(mp.product_name_no, mp.product_name), " - ",
                    mp.product_sku
                )) AS product_name_complete,
                0 AS rm_type
            FROM map_item_for_dist mi
            LEFT JOIN mst_company mc ON mi.distributor_id = mc.company_id
            INNER JOIN mst_product mp ON mi.product_id = mp.product_id AND mp.company_id = 100 AND mp.active = 1
            LEFT JOIN mst_country c ON mc.country_id = c.country_id
            LEFT JOIN sys_text tc ON c.country_name_id = tc.text_id AND tc.lang_id = 1
            LEFT JOIN m_product_link link ON mp.product_code = link.product_code AND flag = 1
            -- LEFT JOIN mst_rm rm -- unused, remove to prevent syntax error
            LEFT JOIN mst_brand mb ON mp.brand_id = mb.brand_id AND mp.company_id = mb.company_id
            LEFT JOIN mst_product_type mpc ON mp.product_type_id = mpc.product_type_id AND mp.division_id = mpc.division_id
            LEFT JOIN mst_flavour mf ON mf.flavour_id = mp.flavour_id
            WHERE NOW() BETWEEN mi.creation_date AND COALESCE(mi.finish_date, '9999-12-31')
            AND mf.company_id = 100
            AND mp.tolling_id NOT IN (1, 6)
            AND COALESCE(mi.moq, 0) > 0
            ORDER BY mpc.product_type_name
        `;

        try {
            const [rmResults] = await dbConf.promise().execute(queryRM);
            const [skuResults] = await dbConf.promise().execute(querySKU);

            const combinedResults = [...rmResults, ...skuResults];

            console.log(timestamp, "Successfully fetched RM and SKU data!");
            ConsoleInfo.info("KETARIK COK")
            res.status(200).send({
                success: true,
                message: "Combined RM and SKU results",
                results: combinedResults
            });

        } catch (err) {
            console.log(timestamp, "Error at getAllProductNames, message:", err);
            res.status(500).send({
                success: false,
                message: "INTERNAL SERVER ERROR",
                error: err.message
            });
        }
    },

    getPurpose: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        if (req.dataToken.user_id) {



            let query = ` 	
                            SELECT *
                            FROM hots.m_srf_purpose
                            WHERE active=1;
                            `


            dbConf.execute(query, (err, results) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error at getSRF_Purpose, message:", err);

                } else {
                    console.log(timestamp, "successfully getSRF_Purpose!");
                    res.status(200).send({
                        success: true,
                        message: "Successfully fetched getSRF_Purpose data",
                        results,
                    });
                }

            })




        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getSKU is Unauthorized");
        }


    },

    getPONumbersrf: async (req, res) => {

        const today = new Date();
        let deliveryYear = today.getFullYear();
        const company_id = req.params.company_id;
        
        let querygetPONumbersrf = ` 
                select 
                    tso.po_number,
                   	GREATEST(
				        tsd.quantity - COALESCE(SUM(trd.qty), 0),
				        0
				    ) AS remaining_qty,
                    tsd.quantity as "quantity dari tsd",
                    trd.qty  as "quantity dari trd",
                    tso.so_id,
                    tsd.sku_id                  
                    from
                    trs_so_detail tsd 
                    join
                    trs_sales_order tso 
                    on
                    tsd.so_id = tso.so_id and tsd.client_id = tso.client_id 
                    join
                    dat_cwo dc 
                    on
                    tsd.so_id = dc.so_id and tsd.sku_id = dc.product_code 
                    left join
                    trs_realization_detail trd 
                    on
                    tsd.so_id = trd.so_id and tsd.sku_id = trd.sku 
                    where
                    tso.client_id  in (${company_id})
                    and
                    dc.close = 0
                    and 
					year(tso.delv_date) >= ${deliveryYear}
					group by 
					tsd.so_id, tsd.sku_id  
					HAVING  
					remaining_qty > 0
        `

        param = req.dataToken.company_id


        if (param) {

            dbQuery.execute(querygetPONumbersrf, param, (err, res) => {


                if (err) {
                    res.status(500).send({
                        success: false,
                        message: `error get PO, no number `,
                        err1
                    })
                } else {

                    if (results1[0]) {
                        res.status(200).send({
                            success: false,
                            message: "Cannot send email! No email Address founded!",
                        });
                        console.log(timestamp + '##### HOTS FORGOT PASSWORD => ' + uid + " => Cannot send email! No email Address founded!")

                    }

                }

            })


        } else {
            res.status(401).send({
                success: false,
                message: `No Token Found `,
                err1
            })
        }


    },



}