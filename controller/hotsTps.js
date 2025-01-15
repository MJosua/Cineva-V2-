const {
    // untuk koneksi ke database hots
    dbHots,
    dbQueryHots,

    //untuk koneksi ke database i2i
    dbConf,
    dbQuery
} = require("../config/db");

const { uploadFile } = require("./order");
const { hotsMailer } = require('../config/mailer')


let green = "\x1b[32m"


/*
untuk utilitas pricing structure



*/


module.exports = {


    getRegion: async (req, res) => {


        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let query = `SELECT region_id, region_desc FROM mst_region mr`

            dbConf.execute(query, (err, results) => {

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
                AND su.type_id = 2`

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
    getSKU: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {

        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getSKU is Unauthorized");
        }


    }


}