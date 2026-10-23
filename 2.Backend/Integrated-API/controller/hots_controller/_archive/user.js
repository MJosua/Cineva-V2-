const { dbConf, dbQuery, addSqlLogger } = require("../../config/db");

module.exports = {

    GetUpdateList: async (req, res) => {
        try {
            let query = `
                SELECT * FROM update_event WHERE update_status = 1;
            `;

            dbConf.query(query, (err, results) => {
                if (err) {
                    log.eorder.error("Error GetLatestUpdate ", err);
                    return res.status(500).send(err);
                }
                log.eorder.info(`GetLatestUpdate success`);
                res.status(200).send(results);
            });

        } catch (error) {
            log.eorder.error("Error at User => GetLatestUpdate", error);
            res.status(500).send(error);
        }
    },


    GetLatestUpdate: async (req, res) => {
        try {
            let query = `
                SELECT
                    *
                FROM
                    update_event
               `

            dbConf.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);
                    log.eorder.error("Error GetLatestUpdate ", err);
                } else {
                    res.status(200).send(results);
                    log.eorder.info(`get GetLatestUpdate  success`);
                }
            })

        } catch (error) {
            log.eorder.error("Error at User => GetLatestUpdate", error);
            res.status(500).send(error);
        }

    },

    GetUpcomingUpdate: async (req, res) => {
        try {
            let query = `
                SELECT
                    *
                FROM
                    update_event
               `

            dbConf.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);
                    log.eorder.error("Error GetLatestUpdate ", err);
                } else {
                    res.status(200).send(results);
                    log.eorder.info(`get GetLatestUpdate  success`);
                }
            })

        } catch (error) {
            log.eorder.error("Error at User => GetLatestUpdate", error);
            res.status(500).send(error);
        }

    },

    setUpdateList: async (req, res) => {
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
                        log.eorder.error("fail setUpdateList:", err);
                    } else {
                        res.status(200).send(results);
                        log.eorder.info(`user add setUpdateList success `);
                    }
                }
            )
        } catch (error) {
            log.eorder.error(error);
            res.status(500).send(error);
        }

    },

}
