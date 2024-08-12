const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const { hashPassword, createToken } = require("../config/encrypts");
const { forgotPasswordMailSender } = require('../config/mailer');

let yellowTerminal = "\x1b[33m";

module.exports = {
    login: async (req, res) => {

        let { uid, pswd } = req.body

        let queryGetUid = `
                        SELECT 
                            uid 
                        FROM 
                            sys_user su 
                        WHERE su.uid = ? 
                        LIMIT 1`
        let paramGetUid = [uid]

        dbConf.execute(queryGetUid, paramGetUid, (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                })
            } else {
                if (!results1[0]) {
                    res.status(200).send({
                        success: false,
                        message: 'Username is not exist!'
                    })
                } else {
                    let queryMatchUidPswd = `
                    SELECT
                    su.user_id, su.company_id, su.employee_id, su.firstname, su.lastname, su.type_id,
                    su.uid, su.lang_id, su.active 
                    FROM sys_user su 
                    WHERE uid = ? AND pswd = ?
                    `
                    let paramMatchUidPswd = [uid, pswd]

                    dbConf.execute(queryMatchUidPswd, paramMatchUidPswd, (err2, results2) => {

                        if (err2) {
                            res.status(500).send({
                                success: false,
                                message: err2,
                                userData: {},
                                tokek: ''
                            })
                        } else if (results2[0]) {
                            res.status(200).send({
                                success: true,
                                message: `Login success! Welcome ${uid}`,
                                userdata: results2[0],
                                tokek: createToken(results2[0])
                            })

                        } else {
                            res.status(200).send({
                                success: false,
                                message: `incorrect password`
                            })

                        }

                    })
                }
            }
        });
    }
}
/* 

CREATE TABLE `sys_user` (
  `user_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `firstname` varchar(64) DEFAULT NULL,
  `lastname` varchar(64) DEFAULT NULL,
  `type_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `uid` varchar(30) NOT NULL,
  `pswd` varchar(64) NOT NULL,
  `prev_pswd` varchar(64) DEFAULT NULL,
  `last_pswd_changed` datetime DEFAULT NULL,
  `asin` varchar(500) DEFAULT NULL,
  `lang_id` int DEFAULT NULL,
  `last_login_date` datetime DEFAULT NULL,
  `active` int DEFAULT NULL,
  `user_notice` varchar(128) DEFAULT NULL,
  `registration_nr` varchar(1024) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `registration_date` datetime DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`,`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

*/