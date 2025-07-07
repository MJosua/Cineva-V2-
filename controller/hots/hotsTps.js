const {
    // untuk koneksi ke database hots
    dbHots,
    dbQueryHots,

    //untuk koneksi ke database i2i
    dbConf,
    dbQuery
} = require("../../config/db");

const { uploadFile } = require("../order");
const { hotsMailer } = require('../../config/mailer')


let green = "\x1b[32m"


/*
untuk utilitas pricing structure



*/


module.exports = {


    getRegion: async (req, res) => {


        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let country_id = req.params.country_id

            if (!country_id || country_id == 0) {

                res.status(204).send({
                    success: false,
                    message: `country_id is not provided properly`
                });

                console.log(timestamp, "country_id is not provided properly");

            } else {

                let query = `SELECT
                                    mr.region_id, st.txt 
                                FROM
                                    map_region_countries mrc
                                LEFT JOIN mst_region mr ON
                                    mrc.region_id = mr.region_id
                                LEFT JOIN sys_text st ON
                                    st.text_id = mr.region_name_id
                                WHERE
                                    mrc.country_id = ? -- param untuk dilempar
                                    AND st.lang_id = 1 -- fix
                                    `

                let parameter = [country_id]

                dbConf.execute(query, parameter, (err, results) => {

                    if (err) {

                        res.status(500).send({
                            success: false,
                            message: `INTERNAL SERVER ERROR`
                        });
                        console.log(timestamp, "Error at getRegion, message:", err);

                    } else {
                        res.status(200).send({
                            success: true,
                            message: `successfully get data region`,
                            results
                        });
                        console.log(timestamp, "successfully getRegion!");
                    }

                })

            }


        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getRegion is Unauthorized");


        }

    },
    getCountry: async (req, res) => {


        //get country with analyzt employee_id parameter

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let employee_id = req.params.employee_id

            if (!employee_id || employee_id == 0) {

                res.status(204).send({
                    success: false,
                    message: `employee_id is not provided properly`
                });

                console.log(timestamp, "employee_id is not provided properly");


            } else {

                let query = `SELECT
                                    DISTINCT c.country_id,
                                    st.txt country
                                FROM
                                    map_resp_for_dist MAP
                                LEFT JOIN mst_company mc ON
                                    MAP.distributor_id = mc.company_id
                                LEFT JOIN mst_country c ON
                                    mc.country_id = c.country_id
                                LEFT JOIN sys_text st ON
                                    c.country_name_id = st.text_id
                                    AND st.lang_id = 1
                                LEFT JOIN mst_team mt ON
                                    MAP.team_id = mt.team_id
                                    AND MAP.company_id = mt.company_id
                                LEFT JOIN mst_team_member mtm ON
                                    mt.team_id = mtm.team_id
                                    AND mt.company_id = mtm.company_id
                                WHERE
                                    mtm.employee_id = ?
                                    AND MAP.finish_date IS NULL `;

                let parameter = [employee_id]

                dbConf.execute(query, parameter, (err, results) => {

                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: `INTERNAL SERVER ERROR`
                        });
                        console.log(timestamp, "Error at getCountry, message:", err);
                    } else {
                        res.status(200).send({
                            success: true,
                            message: `successfully get data Country`,
                            results
                        });
                        console.log(timestamp, "successfully getCountry!");
                    }

                })
            }





        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getCountry is Unauthorized");
        }

    },
    getAnaliyst: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {

            let query = `
            SELECT
            DISTINCT
                    concat(su.firstname, " ", su.lastname) name,
                    me.employee_id
            FROM
                mst_employee me
            LEFT JOIN person p ON
                me.person_id = p.person_id
            LEFT JOIN sys_user su ON
                su.employee_id = me.employee_id
            WHERE
                me.department_id = 4
                AND su.active = 1
                AND su.firstname IS NOT NULL
                AND su.lastname IS NOT NULL
                AND su.type_id = 2
                AND me.email IS NOT null`

            dbConf.execute(query, (err, results) => {

                if (err) {
                    res.status(500).send({
                        success: false,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error at getAnalyst, message:", err);
                } else {
                    res.status(200).send({
                        success: true,
                        message: `successfully get data Analyst`,
                        results
                    });
                    console.log(timestamp, "successfully getAnalyst!");
                }

            })


        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getAnaliyst is Unauthorized");
        }


    },
    getDistributor: async (req, res) => {


        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let country_id = req.params.country_id

            if (!country_id || country_id == 0) {

                res.status(204).send({
                    success: false,
                    message: `country_id is not provided properly`
                });

                console.log(timestamp, "country_id is not provided properly");

            } else {

                let query = `	SELECT
                                    mc.company_id ,
                                    mc.company_name
                                FROM
                                    mst_company mc
                                WHERE
                                    country_id = ?	-- untuk PARAMETER country TO distributor
                                    AND company_type_id = 2
                                    `

                let parameter = [country_id]

                dbConf.execute(query, parameter, (err, results) => {

                    if (err) {

                        res.status(500).send({
                            success: false,
                            message: `INTERNAL SERVER ERROR`
                        });
                        console.log(timestamp, "Error at getDistributor, message:", err);

                    } else {
                        res.status(200).send({
                            success: true,
                            message: `successfully get data Distributor`,
                            results
                        });
                        console.log(timestamp, "successfully getDistributor!");
                    }

                })

            }


        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getDistributor is Unauthorized");


        }

    },
    getPort: async (req, res) => {


        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let company_id = req.params.company_id

            if (!company_id || company_id == 0) {

                res.status(204).send({
                    success: false,
                    message: `company_id is not provided properly`
                });

                console.log(timestamp, "company_id is not provided properly");

            } else {

                let query = `SELECT
                                md.harbour_id,
                                concat(h.harbour_name, ", " , tp.txt, " - ", md.final_dest ) harbour_name,
                                h.harbour_name port_name,
                                harbour_code,
                                tp.txt,
                                md.final_dest
                            FROM
                                map_port_for_dist md
                            LEFT JOIN mst_harbour h ON
                                md.harbour_id = h.harbour_id
                            LEFT JOIN mst_country mc ON
                                h.country_id = mc.country_id
                            LEFT JOIN sys_text tp ON
                                tp.text_id = mc.country_name_id
                                AND tp.lang_id = 1
                            WHERE
                                md.company_id = 100
                                AND distributor_id = ?
                                AND now() BETWEEN md.creation_date AND COALESCE(md.finish_date, '9999-12-31') ;
	
	
                                    `

                let parameter = [company_id]

                dbConf.execute(query, parameter, (err, results) => {

                    if (err) {

                        res.status(500).send({
                            success: false,
                            message: `INTERNAL SERVER ERROR`
                        });
                        console.log(timestamp, "Error at getPort, message:", err);

                    } else {
                        res.status(200).send({
                            success: true,
                            message: `successfully get data Port`,
                            results
                        });
                        console.log(timestamp, "successfully getPort!");
                    }

                })

            }


        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getPort is Unauthorized");


        }

    },
    getSKU: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {

            let company_id = req.params.company_id

            if (!company_id || company_id == 0) {

                res.status(204).send({
                    success: false,
                    message: `company_id is not provided properly`
                });

                console.log(timestamp, "company_id is not provided properly");

            } else {

                let query = ` 	-- get SKU of distributor
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
                            mp.tolling_id
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
                            AND mi.distributor_id = ?
                            AND mf.company_id = 100
                            AND mp.tolling_id NOT IN (1, 6)
                            AND COALESCE( mi.moq, 0 ) > 0
                        ORDER BY
                            mpc.product_type_name
                            `

                let parameter = [company_id]

                dbConf.execute(query, parameter, (err, results) => {

                    if (err) {

                        res.status(500).send({
                            success: false,
                            message: `INTERNAL SERVER ERROR`
                        });
                        console.log(timestamp, "Error at getSKU, message:", err);

                    } else {
                        res.status(200).send({
                            success: true,
                            message: `successfully get data SKU`,
                            results
                        });
                        console.log(timestamp, "successfully getSKU!");
                    }

                })

            }


        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getSKU is Unauthorized");
        }


    },
    addPs: async (req, res) => {


        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let {
                country_id,
                cost_analyst_id,
                rm_id,
                matcode,
                CBP,
                RBP,
                DBP,
                CIF,
                FOB,
                TP1,
                TP2,
                Incentive,
                COGS,
                GP_after_freight,
                curr_code,
                distributor,
                port,
                proposal_no,
                proposal_date,
                created_date,
                SKU,

            } = req.body

            let query = ` INSER INTO t_ps_summary 
                            (country_id,
                                cost_analyst_id,
                                rm_id,
                                matcode,
                                CBP,
                                RBP,
                                DBP,
                                CIF,
                                FOB,
                                TP1,
                                TP2,
                                Incentive,
                                COGS,
                                GP_after_freight,
                                curr_code,
                                distributor,
                                port,
                                proposal_no,
                                proposal_date,
                                created_date,
                                SKU)
                            VALUES
                            (?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?)`;
            let parameter = [country_id,
                cost_analyst_id,
                rm_id,
                matcode,
                CBP,
                RBP,
                DBP,
                CIF,
                FOB,
                TP1,
                TP2,
                Incentive,
                COGS,
                GP_after_freight,
                curr_code,
                distributor,
                port,
                proposal_no,
                proposal_date,
                created_date,
                SKU];

            dbHots.execute(query, parameter, (err) => {

                if (err) {
                    res.status(500).send({
                        success: true,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error HOTS postAddPs is Unauthorized");

                } else {
                    res.status(200).send({
                        success: true,
                        message: `Pricing Structure Added!`
                    });
                    console.log(timestamp, "HOTS postAddPs is SUCCESS");
                }
            })

        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "postAddPs is Unauthorized");
        }

    }


}