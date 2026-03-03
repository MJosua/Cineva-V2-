const {
  dbTMQuery,
  dbTM
} = require("../config/db");


let magenta = "\x1b[35m"

module.exports = {
    
    getTmcard: async (req, res) => {
        
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            username
        } = req.body;

        if (req.dataToken.user_id) {

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `
                SELECT * 
                FROM mst_trademark mst  
                LEFT JOIN mst_region mrc ON mrc.region_id = mst.tm_region 
                LEFT JOIN tm_status tms ON tms.tm_status_id = mst.tm_status;`;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: `${timestamp}  ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => get getTmcard for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getdata for ${username} success`);
                }
            })
            
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }

    },

    postTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            region,
            country,
            brand,
            status,
            regno,
            expDate,
            lastUpdate,
            classTM,
            notes,
            lastUser,
        } = req.body;

        if (req.dataToken.user_id) {


            // susu =  password 

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `
            INSERT INTO mst_trademark 
        (
            tm_details,
            tm_exp_date,
            tm_status,
            tm_creation_date,
            username,
            tm_brand,
            tm_region,
            tm_country,
            tm_class,
            tm_regno
        )
        VALUES 
        (
            '${notes}',
            '${expDate}',
            '${status}',
            '${lastUpdate}',
            '${lastUser}',
            '${brand}',
            '${region}',
            '${country}',
            '${classTM}',
            '${regno}'
        );`;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => postdata for ${lastUser} message: ${err}`);
                } else {
                    res.status(200).send({
                        message: ` successfully add trademark task !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => postdata success`);
                }
            })
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }


    },

    deleteTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            tm_id,
            lastUser
        } = req.body;

        if (req.dataToken.user_id) {

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `  DELETE FROM mst_trademark WHERE tm_id= '${tm_id}'; `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM  => deletedata for ${lastUser} message: ${err} `);
                } else {
                    res.status(200).send({
                        message: ` successfully deleting row!`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => deletedata for ${tm_id} for ${lastUser} success`);
                }
            })

        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }

    },

    updateTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            region,
            country,
            brand,
            status,
            regnochange,
            expDate,
            classTM,
            notes,
            lastUser,

            tmnyaid,
            dateUpdated,
        } = req.body;
        // susu =  password 

        if (req.dataToken.user_id) {

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `
        UPDATE mst_trademark
        SET 

            tm_details = '${notes}',
            tm_exp_date = '${expDate}',
            tm_status = '${status}',
            username = '${lastUser}',
            tm_brand = '${brand}',
            tm_region = '${region}',
            tm_country = '${country}',
            tm_class = '${classTM}',
            tm_regno = '${regnochange}',
            tm_updatedDate = '${dateUpdated}'

        WHERE tm_id = '${tmnyaid}'; `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => updatedata =>  update for ${lastUser} message: ${err} `);
                } else {
                    res.status(200).send({
                        message: ` successfully updating row!`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => updatedata for id ${tmnyaid} for ${lastUser} success`);
                }
            })
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }



    },

    getRegionTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;
        // susu =  password 

        if (req.dataToken.user_id) {

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = ` SELECT * FROM mst_region; `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM  => getregion for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getregion for ${username} success`);
                }
            })

        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }


    },

    getCountryTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username, event } = req.query;
        // susu =  password 
		
        
		if (req.dataToken.user_id) {

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `
                    SELECT 
                        mrc.region_id, mrc.country_id,
                        msc.country_desc
                    FROM map_region_countries mrc
                    LEFT JOIN 
                        mst_country msc 
                        ON mrc.country_id = msc.country_id  
                    WHERE
                        region_id = "${event}"; `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getcountry for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getcountry for ${username} with id ${event} success`);
                }
            })

        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }


    },

    getCountryAllTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;

        if (req.dataToken.user_id) {

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `
                    SELECT 
                        mrc.region_id, mrc.country_id,
                        msc.country_desc
                    FROM map_region_countries mrc
                    LEFT JOIN 
                        mst_country msc 
                        ON mrc.country_id = msc.country_id;`;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getcountryAll for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getcountryAll => for ${username} with ALL ID success`);
                }
            })
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }


    },

    getBrandTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;
        // susu =  password 

        if (req.dataToken.user_id) {
            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = ` SELECT * FROM  mst_brand WHERE company_id = 100 `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getbrand for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getbrand => for ${username} success`);
                }
            })
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }


    },

    getRegnoTMcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;
        // susu =  password 

        if (req.dataToken.user_id) {

            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = ` SELECT tm_regno FROM mst_trademark;`;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getregno for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get getRegnoTMcard data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getregno => for ${username} success`);
                }
            })
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }

    },

    getStatusTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;

        if (req.dataToken.user_id) {

            let query = `SELECT * FROM  tm_status; `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getStatusTmcard for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => Management => getStatusTmcard for ${username} success`);
                }
            })

        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }


        //INI JANGAN JAUH-JAUH DARI dbQuery

    },

    getunder6monthTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;

        if (req.dataToken.user_id) {

            let query = `
        SELECT 
        TIMESTAMPDIFF(MONTH, NOW(), mst.tm_exp_date) AS month_left,
        TIMESTAMPDIFF(DAY, NOW(), mst.tm_exp_date) AS days_left,
        mst.tm_brand, 
        mst.tm_country,
        mst.tm_exp_date,
        mst.tm_regno,
        mst.tm_class,
        ts.tm_status_id,
        mst.tm_region,
        mst.tm_details,
        tr.region_desc,
		mst.tm_id
    FROM 
        mst_trademark mst 
    LEFT JOIN
        tm_status ts ON mst.tm_status = ts.tm_status_id
    LEFT JOIN
        mst_region tr ON mst.tm_region = tr.region_id
    WHERE
        TIMESTAMPDIFF(MONTH, NOW(), mst.tm_exp_date) BETWEEN 2 AND 6
        &&
        ts.tm_status_id = 16
        ; 
        `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getunder6 for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getunder6 for ${username} success`);
                }
            })

        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }

        //INI JANGAN JAUH-JAUH DARI dbQuery

    },

    getunder1monthTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;

        if (req.dataToken.user_id) {
            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `
                SELECT 
                    TIMESTAMPDIFF(MONTH, NOW(), mst.tm_exp_date) AS month_left,
                    TIMESTAMPDIFF(DAY, NOW(), mst.tm_exp_date) AS days_left,
                    mst.tm_brand, 
                    mst.tm_country,
                    mst.tm_exp_date,
                    mst.tm_regno,
                    mst.tm_class,
                    ts.tm_status_id,
                    mst.tm_region,
                    mst.tm_details,
                    tr.region_desc,
					mst.tm_id
                FROM 
                    mst_trademark mst 
                    LEFT JOIN
                    tm_status ts ON mst.tm_status = ts.tm_status_id
                LEFT JOIN
                    mst_region tr ON mst.tm_region = tr.region_id
                WHERE
                    TIMESTAMPDIFF(MONTH, NOW(), mst.tm_exp_date) <= 1
                AND
                    ts.tm_status_id = 16;`;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getunder1 for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getunder1 for ${username} success`);
                }
            })
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }



    },

    getunder0monthTmcard: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;
        // susu =  password 

        if (req.dataToken.user_id) {
            let query = `
            SELECT 
                TIMESTAMPDIFF(MONTH, NOW(), mst.tm_exp_date) AS month_left,
                TIMESTAMPDIFF(DAY, NOW(), mst.tm_exp_date) AS days_left,
                mst.tm_brand, 
                mst.tm_country,
                mst.tm_exp_date,
                mst.tm_regno,
                mst.tm_class,
                ts.tm_status_id,
                mst.tm_region,
                mst.tm_details,
                tr.region_desc,
					mst.tm_id
            FROM 
                mst_trademark mst 
            LEFT JOIN
                tm_status ts ON mst.tm_status = ts.tm_status_id
            LEFT JOIN
                mst_region tr ON mst.tm_region = tr.region_id
            WHERE
                ts.tm_status_id = 1`;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getunder0 for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getunder0 for ${username} success`);
                }
            })

        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }

        //INI JANGAN JAUH-JAUH DARI dbQuery

    },

    getunderprocess: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username } = req.query;
        // susu =  password 

        if (req.dataToken.user_id) {
            //INI JANGAN JAUH-JAUH DARI dbQuery
            let query = `
                SELECT 
                    TIMESTAMPDIFF(MONTH, NOW(), mst.tm_exp_date) AS month_left,
                    TIMESTAMPDIFF(DAY, NOW(), mst.tm_exp_date) AS days_left,
                    mst.tm_brand, 
                    mst.tm_country,
                    mst.tm_exp_date,
                    mst.tm_regno,
                    mst.tm_class,
                    ts.tm_status_id,
                    mst.tm_region,
                    mst.tm_details,
                    tr.region_desc
                FROM 
					mst_trademark mst 
                LEFT JOIN
                    tm_status ts ON mst.tm_status = ts.tm_status_id
                LEFT JOIN
                    mst_region tr ON mst.tm_region = tr.region_id
                WHERE
                    ts.tm_status_id IN (19, 21, 20, 8, 13); `;

            dbTM.query(query, async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` ERROR! Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR TMM => getunder for ${username} message: ${err}`);
                } else {
                    res.status(200).send({
                        results,
                        message: ` successfully get all data !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} TMM => getunder for ${username} success`);
                }
            })
        } else {
            res.status(401).send({
                message: ` unauthorized`,
                success: false,
            });
        }


    }



}