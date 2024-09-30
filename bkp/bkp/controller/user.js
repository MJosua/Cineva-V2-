const { query } = require("express");
const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const fs = require('fs')

let blue = "\x1b[36m";

module.exports = {
    port: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            if (req.dataToken.user_id) {
                let company_id = req.dataToken.company_id

                let query = `
                SELECT md.harbour_id, concat(h.harbour_name, ", " ,tp.txt, " - ", md.final_dest  )   harbour_name, tp.txt, md.final_dest  FROM map_port_for_dist md
                LEFT JOIN mst_harbour h ON md.harbour_id = h.harbour_id 
                LEFT JOIN mst_country mc on h.country_id = mc.country_id  
                LEFT JOIN sys_text tp ON tp.text_id = mc.country_name_id  AND tp.lang_id = 1
                WHERE md.company_id = 100 AND distributor_id = ${company_id} AND
                now() BETWEEN md.creation_date AND COALESCE(md.finish_date, '9999-12-31') ;`

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error Get port list", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user Port List for ${company_id} success`);
                        addSqlLogger(req.dataToken.user_id, (query), `--getPort`, `getPort`)
                    }

                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }


    },
    stp: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        // console.log("req.data.token at ship to party", req.dataToken.company_id)
        // let { company_id } = req.body;
        try {
            if (req.dataToken.user_id) {

                let company_id = req.dataToken.company_id

                let checkCondition = (await dbQuery(`
                    SELECT
						COALESCE(mconf.conditions , 0 ) cond
					FROM
						m_config_new mconf
					WHERE
						mconf.company_id = ${company_id}
					AND active = 1;`))

                let STP_DETAIL = checkCondition.find((data) => data.cond == 4)
                let STP_PCL = checkCondition.find((data) => data.cond == 6)


                let query = STP_DETAIL ? `
                SELECT
	LEFT(group_concat(KEYY),
	3) keyy,
	txt
FROM 
	(
	SELECT 
		b.company_id keyy, 
		concat ((CASE
			${company_id} WHEN b.company_id THEN concat(b.company_name)
			ELSE b.company_name
		END)," - ", COALESCE(b.company_notice, '')) txt 
	FROM
		mst_company a
	LEFT JOIN mst_company b ON
		trim(a.user_company_id) = trim(b.user_company_id)
	WHERE
		a.user_company_id <> 'default'
		AND b.company_type_id IN (2,7) AND a.company_id = ${company_id}  
	ORDER BY
		a.company_name 
	) a
GROUP BY
	TXT; `  : STP_PCL ? `SELECT * FROM 
	 (SELECT
		b.company_id keyy,
		CASE
			${company_id} WHEN b.company_id THEN concat(b.company_name)
		ELSE b.company_name
	END txt
FROM
		mst_company a
LEFT JOIN mst_company b ON
		trim(a.user_company_id) = trim(b.user_company_id)
WHERE
		a.user_company_id <> 'default'
	AND b.company_type_id IN (2, 7)
	AND a.company_id = ${company_id}
ORDER BY
		keyy DESC) a 
		WHERE a.keyy <> ${company_id}` : ` SELECT
                    LEFT(group_concat(KEYY),
                    3) keyy,
                    txt
                FROM 
                (
                    SELECT
                        b.company_id keyy, 
                         CASE
                            ${company_id} WHEN b.company_id THEN concat(b.company_name)
                        ELSE b.company_name
                        END txt 
                    FROM
                        mst_company a
                    LEFT JOIN mst_company b ON
                        trim(a.user_company_id) = trim(b.user_company_id)
                    WHERE
                        a.user_company_id <> 'default'
                        AND b.company_type_id IN (2,7) AND a.company_id = ${company_id}  
                        ORDER BY
                        a.company_name
                ) a
                GROUP BY
                        keyy, TXT;  
                `;

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get company on ship to party", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user shiptoparty for ${company_id} list success.`)
                        addSqlLogger(req.dataToken.user_id, (query), '--data getShipToParty', `getShipToParty`)
                    }
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }
    },
    profile: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        // console.log("req.data.token at profile", req.dataToken)
        // let { userID } = req.body;

        try {
            if (req.dataToken.user_id) {

                let userID = req.dataToken.user_id

                let query = `
                SELECT
                    su.active,
                    mc.company_name,
                    a.complex ,
                    a.street,
                    a.city,
                    a.postal_code ,
                    a.province,
                    mc2.country_desc, 
                    mc.npwp ,
                    me2.appl_phone_nr phone,
                    mc.url_website,
                    mc.url_logo ,
                    me2.email, 
                    GROUP_CONCAT(DISTINCT mt.due_days ORDER BY mt.due_days ASC SEPARATOR ',') AS due_days ,
                    GROUP_CONCAT(DISTINCT mt.credit_limit ORDER BY mt.credit_limit ASC SEPARATOR ',') AS credit_limit,
                    GROUP_CONCAT(DISTINCT mt.top_desc ORDER BY mt.top_desc ASC SEPARATOR ',') AS top_desc
                FROM
                    sys_user su
                LEFT JOIN mst_company mc ON
                    su.company_id = mc.company_id
                LEFT JOIN address a ON
                    mc.address_id = a.address_id
                LEFT JOIN mst_country mc2 ON
                    mc.country_id = mc2.country_id
                LEFT JOIN mst_employee me ON
                    mc.company_id = me.company_id
                    AND me.company_id = 100
                LEFT JOIN mst_employee me2 ON 
                    su.employee_id = me2.employee_id 
                LEFT JOIN mst_top mt ON
                    mt.company_id = mc.company_id
                    AND mt.company_id = me.company_id
                    AND now() BETWEEN mt.start_date AND COALESCE(mt.expired_date, '9999-12-31')
                WHERE
                    su.user_id = ${userID};
               `

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get detail profile", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user profile ${userID} success`);
                        addSqlLogger(req.dataToken.user_id, (query), '--data getProfile', `getProfile`)
                    }
                })

            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    },
    top: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            if (req.dataToken.user_id) {

                let userID = req.dataToken.user_id

                let query = `
                SELECT
                    COALESCE(conf_due_days.value, mt.due_days) due_days ,
                    concat( mc.curr_code, ' ' ,format(mt.credit_limit, 'en-US')) credit_limit,
                    COALESCE(conf_top_desc.value, mt.top_desc) top_desc
                FROM
                    sys_user su
                LEFT JOIN mst_company mc ON
                    su.company_id = mc.company_id
                LEFT JOIN address a ON
                    mc.address_id = a.address_id
                LEFT JOIN mst_country mc2 ON
                    mc.country_id = mc2.country_id
                LEFT JOIN mst_employee me ON
                    mc.company_id = me.company_id
                    AND me.company_id = 100
                LEFT JOIN m_config_new conf_top_desc ON
                    su.company_id = conf_top_desc.company_id
                    AND conf_top_desc.conditions = 3
                    AND conf_top_desc.active = 1
                LEFT JOIN m_config_new conf_due_days ON
                    su.company_id = conf_due_days.company_id
                    AND conf_due_days.conditions = 5
                    AND conf_due_days.active = 1
                LEFT JOIN mst_top mt ON
                    mt.company_id = mc.company_id
                    AND now() BETWEEN mt.start_date AND COALESCE(mt.expired_date, '9999-12-31')
                WHERE
                    su.user_id =  ${userID};
                   `

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get detail profile", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user profile ${userID} success`);
                        addSqlLogger(req.dataToken.user_id, (query), '--data getTOP', `getTOP`)
                    }

                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }



    },
    addFeedback: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {

            let form = JSON.parse(req.body.data)
            let imgUrl = !req.files[0] ? '' : `/feedback/${req.files[0].filename}`

            let query = `
            INSERT INTO m_feedback 
            (user_id, company_id, title, feedback, created_date, img_url)
            VALUES
            (${req.dataToken.user_id}, ${req.dataToken.company_id}, ?, ?, now(), ?)
            `
            let parameter = [form.title, form.feedback, imgUrl]

            dbConf.query(query, parameter, (err, results) => {

                if (err) {
                    res.status(500).send(err);
                    console.log(timestamp + "fail user add feedback:", err);
                } else {
                    res.status(200).send(results);
                    console.log(timestamp + `user add feedback success `);
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addFeedback-`)
                }

            })
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }

    },
    getFeedback: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        try {
            if (req.dataToken.user_id) {

                let userID = req.dataToken.user_id

                let query = ` SELECT * FROM m_feedback mf WHERE company_id = ${req.dataToken.user_id} ; `

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get user feedback", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user feedback ${userID} success`);
                        addSqlLogger(req.dataToken.user_id, (query), `--data getFeedback-`, `getFeedback-`)
                    }
                })

            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }

    },
    addContactUs: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            // if (req.dataToken.user_id) {
            let { namaewa, email, message } = req.body

            // console.log("req.body.data.title ", form.title)
            // console.log("req.body.data.feedback ", form.feedback)
            // console.log("req.files ", req.files[0]) 

            let query = `
            INSERT INTO m_contactus 
            (user_id, company_id, name, email, message, created_date)
            VALUES
            (${req.dataToken.user_id}, ${req.dataToken.company_id}, ?, ?, ?, now())
            `
            let parameter = [namaewa, email, message]

            dbConf.query(query, parameter,
                (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "fail user add feedback:", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `user add feedback success `);
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addContactUs-`)
                    }
                }
            )
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }

    },
    addRequstDataChange: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let {
                user_id,
                company_id
            } = req.dataToken

            let {
                address,
                email,
                contact_person,
                contact_number,
                website,
                tin,
                remarks
            } = req.body

            let query = `
                INSERT INTO 
                m_request_data_change 
                (user_id, company_id, req_date, address, 
                email, contact_person, contact_number, 
                website, tin, remarks)
                VALUES
                (?, ?, now(), ?, 
                ?, ?, ?, 
                ?, ?, ?);
               `

            let parameter = [user_id, company_id, address,
                email, contact_person, contact_number,
                website, tin, remarks]

            dbConf.query(query, parameter,
                (err, results) => {

                    if (err) {
                        res
                            .status(500)
                            .send({
                                err,
                                success: false,
                                message: 'Something wrong while sending your data. Please try again!'
                            });

                        console.log(timestamp + "fail user add feedback:", err);

                    } else {

                        res.status(200).send({
                            results,
                            success: true,
                            message: 'Successfully send requst data. Our team will check and change it soon!'
                        });

                        console.log(timestamp + `Add Reqest Data Change: SUCCESS `);
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addRequstDataChange-`)
                    }
                }
            )

        } else {
            res.status(500).send(err);
            console.log(timestamp + "UNAUTHORIZED Add Reqest Data Change:", err);
        }


    },
    getBanner: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        try {
            if (req.dataToken.user_id) {

                let query = `
                SELECT
                    mb.company_id ,
                    mb.img_url,
                    mb.caption_remarks
                FROM
                    m_banner mb
                LEFT JOIN mst_company mc ON
                    mc.company_id = mb.company_id
                LEFT JOIN sys_user su ON
                    su.user_id = mb.created_by
                WHERE
                    mb.company_id = ${req.dataToken.company_id}
                    OR mb.company_id = 999
                    AND NOW() BETWEEN mb.starting_date AND COALESCE(mb.ending_date, '9999-12-31' );`

                dbConf.query(query, (err, results) => {

                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get user Banner ", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user Banner ${req.dataToken.uid} success`);
                        addSqlLogger(req.dataToken.user_id, (query), '--data getBanner', `getBanner-`)
                    }

                })
            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }

    },
    getEmail: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 


        try {
            if (req.dataToken.user_id) {

                let employee_id = req.dataToken.employee_id

                let query = `
                SELECT
                    p.person_notice 
                FROM
                    person p
                WHERE person_id = ${employee_id};
               `

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error get detail profile", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get email for ${employee_id} success`);
                        addSqlLogger(req.dataToken.user_id, (query), '--data getEmail', `getEmail-`)
                    }
                })

            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + "Error at User => getEmail" + error);
            res.status(500).send(error);
        }



    },
    updateEmail: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            if (req.dataToken.user_id) {

                console.log(timestamp + "new email list: ", req.body.emailList)
                let employee_id = req.dataToken.employee_id;
                let emailList = req.body.emailList;

                let query = `
                UPDATE
                    person
                SET
                    person_notice = ?
                WHERE
                    person_id = ?;
               `
                let parameter = [emailList, employee_id]
                dbConf.query(query, parameter, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "update user email list", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `update user email list for ${employee_id} success`);
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `updateEmail-`)
                    }
                }
                )
            } else {
                res.status(401).send({
                    success: false,
                    message: 'error_auth'
                })
            }
        } catch (error) {
            console.log(timestamp + "update user email list" + error);
            res.status(500).send(error);
        }



    },



}