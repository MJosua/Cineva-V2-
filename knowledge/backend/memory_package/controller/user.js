const { query } = require("express");
const { dbConf, dbQuery } = require("../config/db");
const fs = require('fs');
const { feedback_eorder, feedback_eorder_admin } = require("../service/mailer/eorder/eorder_mailer");

let blue = "\x1b[36m";

module.exports = {
    port: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            // check auth
            if (req.dataToken.user_id) {
                let company_id = req.dataToken.company_id

                let query = `
                 select
                    md.harbour_id,
                    concat(h.harbour_name, ", " , tp.txt, " - ", md.final_dest , " - ", mi.incoterm_name )  
                                harbour_name,
                    harbour_code,
                    tp.txt,
                    md.final_dest,
                    md.id as md_id,
                    md.distributor_id,
                    md.port_link
                from
                    map_port_for_dist md
                left join mst_harbour h on
                    md.harbour_id = h.harbour_id
                left join mst_country mc on
                    h.country_id = mc.country_id
                left join mst_incoterm mi on
                    md.incoterm_id = mi.id
                left join sys_text tp on
                    tp.text_id = mc.country_name_id
                    and tp.lang_id = 1
                where
                    md.company_id = 100
                    and 
                    distributor_id = ${company_id}
                    and
                    now() between md.creation_date and coalesce(md.finish_date, '9999-12-31') 
                ;
                `

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error Get port list", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user Port List for ${company_id} success`);
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
    portfind: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            if (req.dataToken.user_id) {

                let query = `
                select mpd.id, mh.harbour_code
                    from 
                    mst_harbour mh
                    left join map_port_for_dist mpd
                    on mh.harbour_id = mpd.harbour_id
                    where
                    mpd.finish_date is null
                    and
                    mpd.distributor_id = ${req.dataToken.company_id}
                `

                dbConf.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error Get port list", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `get user Port List for ${req.dataToken.company_id} success`);
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
                    TXT; `
                    :

                    STP_PCL

                        ?
                        `
                    SELECT 
                        b.company_id AS keyy, 
                        CONCAT(
                            CASE 
                                WHEN b.company_id = ${company_id} THEN b.company_name 
                                ELSE b.company_name 
                            END, 
                            " - ", 
                            COALESCE(b.company_notice, '')
                        ) AS txt 
                    FROM mst_company a
                    LEFT JOIN mst_company b 
                        ON TRIM(a.user_company_id) = TRIM(b.user_company_id)
                    WHERE 
                        a.user_company_id <> 'default'
                        AND b.company_type_id IN (2, 7)
                        AND a.company_id = ${company_id}
                        AND b.company_id <> ${company_id} -- This ensures filtering is done correctly
                    ORDER BY keyy DESC;
`

                        :

                        ` SELECT
                    LEFT(group_concat(KEYY),
                    3) keyy,
                    txt
                FROM 
                (
                   SELECT 
                        b.company_id keyy, 
                            CONCAT(
                                CASE 
                                    WHEN ${company_id} = b.company_id THEN b.company_name 
                                    ELSE b.company_name
                                END,
                                CASE 
                                    WHEN COALESCE(b.company_notice, '') <> '' THEN CONCAT(' - ', b.company_notice) 
                                    ELSE ''
                                END
                            ) txt 
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
    findntp: async (req, res) => {
        const date = new Date();
        const timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            if (!req.dataToken?.user_id) {
                return res.status(401).send({ success: false, message: 'error_auth' });
            }

            const company_id = req.params.company_id;

            const querynotify = `
            SELECT * FROM mst_company mc 
            WHERE company_type_id = 7 
            AND parent_company_id = ?
          `;

            // Use await instead of wrapping with new Promise
            const notifyTP = await new Promise((resolve, reject) => {
                dbConf.query(querynotify, [company_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            res.status(200).send({ Notify: notifyTP });
            console.log("notifyTP", notifyTP)
            console.log(timestamp + `get user findntp for ${company_id} list success.`);

        } catch (error) {
            console.error(timestamp + "Error in findntp queries:", error);
            res.status(500).send(error);
        }
    }


    , ostp: async (req, res) => {
        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            if (req.dataToken.user_id) {
                let company_id = req.dataToken.company_id;



                let checkcompanyname = `
                        SELECT company_name FROM mst_company mcn 
                        WHERE company_id = ${company_id}
                    `;


                let querynotify = `
                    SELECT * FROM mst_company mc 
                    WHERE company_type_id = 7 
                    AND parent_company_id = ${company_id}
                `;

                let querybill = `
                    SELECT * FROM mst_company mc 
                    WHERE company_type_id = 8 
                    AND parent_company_id = ${company_id}
                `;


                let checkbtpspecialconditionhidebtp = `
                SELECT active FROM m_config_new mspc 
                WHERE company_id = ${company_id}
                and
                conditions = 14
                and
                active = 1
            `;

                let checkbtpspecialconditionhidentp = `
                SELECT value FROM m_config_new mspc 
                WHERE company_id = ${company_id}
                and
                conditions = 18
                and
                active = 1
            `;

                // Run both queries in parallel
                Promise.all([
                    new Promise((resolve, reject) => {
                        dbConf.query(querynotify, (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    }),
                    new Promise((resolve, reject) => {
                        dbConf.query(querybill, (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    }),
                    new Promise((resolve, reject) => {
                        dbConf.query(checkcompanyname, (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    }),
                    new Promise((resolve, reject) => {
                        dbConf.query(checkbtpspecialconditionhidebtp, (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    }),
                    new Promise((resolve, reject) => {
                        dbConf.query(checkbtpspecialconditionhidentp, (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    }),

                ])
                    .then(([notifyTP, billTP, checkcompanyname, spcbtp, spcntp]) => {


                        const defaultEntrybtp = {
                            company_id,
                            company_name: checkcompanyname[0].company_name
                        };

                        let notifyTPFinal = notifyTP;

                        if (spcntp.length > 0) {
                            const spcntpValue = spcntp[0].value;

                            // Find matching company in notifyTP
                            const specialCompany = notifyTP.find(n => n.company_id.toString() === spcntpValue.toString());
                            console.log("spcntpValue", spcntpValue)
                            console.log("specialCompany", specialCompany)

                            if (specialCompany) {
                                // Reorder so specialCompany is first
                                notifyTPFinal = [
                                    specialCompany,
                                    ...notifyTP.filter(n => n.company_id.toString() !== spcntpValue.toString())
                                ];
                            }
                        }

                        // Combine the default with the first real entry (optional merging)

                        // Rest of the entries, skipping the first
                        const restEntriesbtp = billTP;


                        res.status(200).send({

                            "Notify": notifyTPFinal,
                            "BillTP": spcbtp.length > 0 ? billTP : [defaultEntrybtp, ...restEntriesbtp]
                        });

                        console.log(timestamp + `get user shiptoparty for ${company_id} list success.`);
                    })
                    .catch((err) => {
                        console.log(timestamp + "Error in ship to party queries:", err);
                        res.status(500).send(err);
                    });

            } else {
                res.status(401).send({ success: false, message: 'error_auth' });
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

                    feedback_eorder(form.title, form.feedback, imgUrl, req.dataToken.company_id, req.dataToken.user_id)
                    feedback_eorder_admin(form.title, form.feedback, imgUrl, req.dataToken.company_id, req.dataToken.user_id)


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

    GetUpdateList: async (req, res) => {
        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            let query = `
                SELECT * FROM update_event WHERE update_status = 1;
            `;

            dbConf.query(query, (err, results) => {
                if (err) {
                    console.log(timestamp + "Error GetLatestUpdate ", err);
                    return res.status(500).send(err);
                }
                console.log(timestamp + `GetLatestUpdate success`);
                res.status(200).send(results);
            });

        } catch (error) {
            console.log(timestamp + "Error at User => GetLatestUpdate", error);
            res.status(500).send(error);
        }
    },


    GetLatestUpdate: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 


        try {

            let employee_id = req.dataToken.employee_id

            let query = `
                SELECT
                    *
                FROM
                    update_event

               `

            dbConf.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);
                    console.log(timestamp + "Error GetLatestUpdate ", err);
                } else {
                    res.status(200).send(results);
                    console.log(timestamp + `get GetLatestUpdate  success`);
                }
            })


        } catch (error) {
            console.log(timestamp + "Error at User => GetLatestUpdate" + error);
            res.status(500).send(error);
        }



    },

    GetUpcomingUpdate: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 


        try {

            let employee_id = req.dataToken.employee_id

            let query = `
                SELECT
                    *
                FROM
                    update_event
               `

            dbConf.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);
                    console.log(timestamp + "Error GetLatestUpdate ", err);
                } else {
                    res.status(200).send(results);
                    console.log(timestamp + `get GetLatestUpdate  success`);
                }
            })


        } catch (error) {
            console.log(timestamp + "Error at User => GetLatestUpdate" + error);
            res.status(500).send(error);
        }



    },

    setUpdateList: async (req, res) => {

        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            let { update_description, update_status, update_date } = req.body

            let query = `
            INSERT INTO 
            update_event 
            (description, update_status, date)
            VALUES
            (?, ?, ?)
            `
            let parameter = [update_description, update_status, update_date]

            dbConf.query(query, parameter,
                (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "fail setUpdateList:", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `user add setUpdateList success `);
                    }
                }
            )
        } catch (error) {
            console.log(timestamp + error);
            res.status(500).send(error);
        }

    },

}