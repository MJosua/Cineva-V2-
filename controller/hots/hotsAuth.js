const {
    dbHots,
    dbQueryHots,
    // addSqlLogger
} = require("../../config/db");
const { generateTokenHT, hashPasswordHT } = require("../../config/encrypts");
const { hotsForgotPasswordMailer } = require('../../config/mailer');
// const cookieParser = require('cookie-parser');
const { compare } = require('bcrypt');

const bcrypt = require('bcrypt'); // For password comparison



let yellowTerminal = "\x1b[33m";

module.exports = {
    login: async (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { uid, asin } = req.body



        // cari username dulu
        let queryGetUid = `
                            SELECT
                                u.user_id,
                                u.employee_id,
                                u.firstname,
                                u.lastname,
                                u.role_id,
                                u.uid,
                                u.active,
                                u.login_attempt
                            FROM
                                user u
                            WHERE
                                LOWER(u.uid) = LOWER(?)
                                AND u.active = 1
                            LIMIT 1`
        let paramGetUid = [uid]


        // cari username dulu
        dbHots.execute(queryGetUid, paramGetUid, (err1, results1) => {

            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                })
                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err1)
            } else {

                if (!results1[0]) {
                    res.status(200).send({
                        success: false,
                        message: 'Username is not exist!'
                    })

                } else {

                    let dataLogin = results1[0]

                    if (dataLogin.login_attempt > process.env.SECURITY_TRIAL_LOGIN_HT || dataLogin.login_attempt == process.env.SECURITY_TRIAL_LOGIN_HT) {
                        res.status(200).send({
                            message: ` Too many login attempt! Please reset password by "forgot password" to login!`,
                            success: false,
                            // userData,
                            // token,
                            err: ''
                        });
                    } else if (dataLogin.login_attempt < process.env.SECURITY_TRIAL_LOGIN_HT || !dataLogin) {


                        let queryMatchUidPswd = `
                                            select
                                                u.user_id,
                                                u.firstname,
                                                u.lastname,
                                                u.uid,
                                                u.active,
                                                r.role_id,
                                                r.role_name,
                                                d.department_name,
                                                d.department_id,
                                                CONCAT(u.firstname, ' ', u.lastname) as user_name,
                                                u.superior_id,
                                                u.nik,
                                                (
                                                select
                                                    distinct 
                                                                                            JSON_ARRAYAGG(u2.superior_id)
                                                from
                                                    user u2
                                                where
                                                    superior_id is not null 
                                                                                        ) as team_leader_user_id,
                                                (
                                                select
                                                    distinct 
                                                                                            JSON_ARRAYAGG(tm.team_id)
                                                from
                                                    m_team_member tm 
                                                where
                                                    tm.user_id = u.user_id 
                                                                                        ) as team_id_linked
                                            from
                                                user u
                                            left join 
                                                                                                m_role r on
                                                u.role_id = r.role_id
                                            left join 
                                                                                                m_department d on
                                                u.department_id = d.department_id
                                                WHERE
                                                    LOWER(uid) = LOWER(?)
                                                    AND pswd = ?
                                                    AND u.role_id IN (1, 2, 4)
                    
                     `
                        let paramMatchUidPswd = [uid, asin]

                        dbHots.execute(queryMatchUidPswd, paramMatchUidPswd, (err2, results2) => {

                            if (err2) {

                                res.status(501).send({
                                    success: false,
                                    message: 'Username and Password Combination is not correct!',
                                    userData: {},
                                    tokek: ''
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err2)

                            } else if (results2[0]) {

                                let tokek = generateTokenHT(results2[0]);

                                res.status(200).send({
                                    success: true,
                                    message: `Login success! Welcome ${uid}`,
                                    userData: results2[0],
                                    tokek
                                })
                                // res.status(200).cookie('tokek', tokek, {
                                //     httpOnly: true,
                                //     secure: true, // Gunakan ini hanya jika menggunakan HTTPS
                                //     maxAge: 3600000 // Cookie berlaku selama 1 jam 
                                // }).send({
                                //     success: true,
                                //     message: `Login success! Welcome ${uid}`,
                                //     userdata: results2[0],
                                //     tokek
                                // })

                                //update token dan terakhir kali login
                                dbHots.execute(`UPDATE user 
                                            SET registration_nr = ?,
                                            last_login_date = now(),
                                            login_attempt = 0
                                            WHERE uid =  ?`, [tokek, uid])

                                console.log(timestamp, "HOTS Auth Login : " + uid + " success")

                            } else {

                                let incrementAttempt = dataLogin.login_attempt + 1

                                let queryUpdate = `UPDATE  user 
                                                    SET 
                                                    login_attempt = ?,
                                                    login_trial_time = now()
                                                    WHERE user_id = ?;`

                                let paramUpdate = [incrementAttempt, dataLogin.user_id]

                                dbHots.execute(queryUpdate, paramUpdate)

                                res.status(201).send({
                                    success: false,
                                    message: ` incorrect Password! ${process.env.SECURITY_TRIAL_LOGIN_HT - dataLogin.login_attempt} attempt left!`
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " incorrect password")

                            }

                        })

                    }
                }
            }
        });
    }
    , keepLogin: async (req, res) => {


        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {

            // validate token first
            let queryValidateToken = `SELECT registration_nr FROM user WHERE registration_nr = ?`
            let paramValidateToken = [req.token]

            dbHots.execute(queryValidateToken, paramValidateToken, (err1, results1) => {

                if (err1) {
                    res.status(500).send({
                        success: false,
                        message: `error at validate token `
                    })
                }

                let queryGetUserData = `
                                            select
                                                u.user_id,
                                                u.firstname,
                                                u.lastname,
                                                u.uid,
                                                u.active,
                                                r.role_id,
                                                r.role_name,
                                                d.department_name,
                                                d.department_id,
                                                u.superior_id,
                                                u.nik,
                                                (
                                                    SELECT JSON_ARRAYAGG(element) AS combined_data
                                                    FROM (
                                                        SELECT u2.superior_id AS element
                                                        FROM user u2
                                                        WHERE u2.superior_id IS NOT NULL
                                                    
                                                        UNION ALL
                                                    
                                                        SELECT t.assigned_to  AS element
                                                        FROM t_ticket t
                                                        WHERE t.assigned_to  IS NOT NULL

                                                        UNION ALL

                                                        select tm.user_id AS element
                                                        from m_team_member tm
                                                        where tm.team_leader = 1
                                                    ) AS combined
                                                ) as team_leader_user_id,
                                                (
                                                select
                                                    distinct 
                                                                                            JSON_ARRAYAGG(tm.team_id)
                                                from
                                                    m_team_member tm 
                                                where
                                                    tm.user_id = u.user_id 
                                                                                        ) as team_id_linked
                                            FROM
                                                user u
                                            LEFT JOIN m_role r ON
                                                u.role_id = r.role_id
                                            LEFT JOIN m_department d ON
                                                u.department_id = d.department_id
                                            WHERE user_id = ?  
                                            `
                let paramGetUserData = [req.dataToken.user_id]

                dbHots.execute(queryGetUserData, paramGetUserData, (err, results) => {

                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: `error at keeplogin`
                        })
                    } else {
                        if (results[0]) {
                            let tokek = generateTokenHT(results[0])
                            let userData = results[0]
                            res.status(200).send({
                                success: true,
                                userData,
                                tokek
                            })
                            let queryUpdateToken = `UPDATE user 
                                                        SET 
                                                        registration_nr = ? 
                                                        WHERE user_id = ?`
                            let paramUpdateToken = [tokek, req.dataToken.user_id]

                            dbHots.execute(queryUpdateToken, paramUpdateToken)
                            // res.status(200).cookie('tokek', tokek, {
                            //     httpOnly: true,
                            //     secure: true, // Gunakan ini hanya jika menggunakan HTTPS
                            //     maxAge: 3600000 // Cookie berlaku selama 1 jam 
                            // }).send({
                            //     success: true,
                            //     userData,
                            //     tokek
                            console.log(timestamp, `Hots_auth KeepLogin ${req.dataToken.uid} success`)

                        } else {
                            console.log(timestamp, "Hots_auth KeepLogin No Data")

                            res.status(200).send({
                                success: false,
                                message: `no data`
                            })
                        };

                    }
                })

            })



        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            })
        }


    }
    , forgotPassword: async (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uid = req.body.uid

        if (uid) {
            let queryGetEmail = `SELECT u.email, u.user_id FROM user u WHERE  u.uid = ?;`;
            let ParamGetEmail = [uid];

            dbHots.execute(queryGetEmail, ParamGetEmail, (err1, results1) => {

                if (err1) {
                    res.status(500).send({
                        success: false,
                        message: `error at forgot password HOTS! `,
                        err1
                    })

                } else {
                    if (results1[0]) {

                        let address = results1[0].email;

                        let token = generateTokenHT({ ...results1[0] })

                        if (address) {
                            hotsForgotPasswordMailer(address, token);

                            let queryUpdateToken = `UPDATE user  SET registration_nr = ? WHERE uid = ?;`
                            let paramUpdateToken = [token, uid]

                            dbHots.execute(queryUpdateToken, paramUpdateToken, (err2) => {

                                if (err2) {
                                    console.log(timestamp, "forgotPassword", err2)

                                } else {
                                    res.status(200).send({
                                        success: true,
                                        message: "Reset Password Link has been sent into your email",
                                        email: address
                                    });
                                    console.log(timestamp + '##### HOTS FORGOT PASSWORD => ' + uid + " => uid valid send to " + address)

                                }
                            })

                        } else {
                            res.status(200).send({
                                success: false,
                                message: "Cannot send email! No email Address founded!",
                            });
                            console.log(timestamp + '##### HOTS FORGOT PASSWORD => ' + uid + " => Cannot send email! No email Address founded!")

                        }

                    } else {
                        console.log(timestamp + '##### HOTS FORGOT PASSWORD => ' + uid + " => uid invalid")

                        res.status(200).send({
                            success: false,
                            message: `UID that you enter is not found! Please enter the correct one `
                        })
                    }

                }

            })

        } else {
            res.status(500).send({
                success: false,
                message: `email is not provided `
            })
        }


    }
    , verifyTokenForgotPassword: async (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {

            let query = `SELECT u.uid FROM user u WHERE u.registration_nr = ?`
            let param = [req.token]

            //MEMERIKA APAKAH TOKENN MASIH ADA DI DATABASE ATAU TIDAK. 

            dbHots.execute(query, param, (err, results) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: err,
                    });
                }

                if (!results[0]) {

                    res.status(200).send({
                        success: false,
                        message: "OOPS! Looks like you tried to change password more than once!",
                    });

                } else {

                    if (req.dataToken.Email) {

                        res.status(200).send({
                            success: true,
                            message: "token is valid, continue =>",
                        });

                        console.log(timestamp + `auth token verification for ${req.dataToken.email}`)

                    } else {

                        res.status(500).send({
                            success: false,
                            message: "The RESET Password link has already EXPIRED. Please try to input email again",
                        });

                        console.log(timestamp + `auth token verification Failed. `)

                    }

                }

            })




        } catch (error) {
            console.log(timestamp, "verifyTokenForgotPassword", error);

            res.status(500).send({
                success: false,
                message: "error 500",
            });
        }

    }
    , changePasswordForgotPassword: async (req, res) => {


        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            let { pswd } = req.body;

            //MENNGHAPUS DATA TOKEN DARI DATABASE UNTUK MENCEGAH USER MENGANTI KEMBALI PASSWORD
            let sqlUpdateToken = await dbQueryHots(`UPDATE user SET registration_nr = ' password reseted ' WHERE email = '${req.dataToken.email}';`);

            if (req.dataToken.email) {

                let queryChangePassword = `
                            UPDATE user 
                            SET asin = ?
                            WHERE Email = ?
                            `
                let paramChangePassword = [hashPasswordHT(pswd), req.dataToken.email]

                dbHots.execute(queryChangePassword, paramChangePassword, (err1, results1) => {

                    if (err1) {
                        res.status(500).send({
                            success: false,
                            message: err1,
                        });

                    } else {

                        let queryUpdateChangePassLog = `
                        UPDATE user 
                        SET 
                        last_pswd_changed = now(),
                        login_attempt = 0 
                        WHERE Email = ?;`;
                        let paramUpdateChangePassLog = [req.dataToken.email]

                        dbHots.execute(queryUpdateChangePassLog, paramUpdateChangePassLog, (err2, results2) => {
                            if (err2) {
                                res.status(500).send({
                                    success: false,
                                    message: err2,
                                });
                            } else {

                                // let sqlResetEventLogger = await dbQueryHots(
                                //     ` UPDATE event_logger 
                                // SET 
                                // login_attempt = 0
                                // WHERE user_id = ${req.dataToken.employee_id}; 
                                // `);

                                res.status(200).send({
                                    success: true,
                                    message: "Your Password has Changed!",
                                });
                                // addSqlLogger(req.dataToken.employee_id, query, (JSON.stringify(sqlInject)), 'changePasswordForgotPassword');
                                console.log(timestamp + "Auth forgot password change for email:", req.dataToken.email);



                            }
                        })

                    }

                })



            } else {
                res.status(401).send({
                    success: false,
                    message: "unauthorized",
                });
                console.log(timestamp + "Auth forgot password change for email UNANUNUNUN bodo ah");

            }


        } catch (error) {

            console.log(timestamp, "changePasswordForgotPassword", error);

            res.status(500).send({
                success: false,
                message: "something wrong",
            });

        }


    },
    // Get User Profile
    getProfile: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        let queryGetProfile = `
        SELECT 
            u.user_id,
            u.firstname,
            u.lastname,
            u.email,
            u.phone,
            u.employee_id,
            u.role_id,
            ur.role_name,
            u.department_id,
            d.department_name,
            u.superior_id,
            CONCAT(sup.firstname, ' ', sup.lastname) as superior_name,
            u.registration_date,
            u.active,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'team_id', tm.team_id,
                        'team_name', t.team_name,
                        'team_leader', tm.team_leader
                    )
                )
                FROM m_team_member tm
                LEFT JOIN m_team t ON t.team_id = tm.team_id
                WHERE tm.user_id = u.user_id 
            ) as teams
        FROM user u
        LEFT JOIN m_role ur ON ur.role_id = u.role_id
        LEFT JOIN m_department d ON d.department_id = u.department_id
        LEFT JOIN user sup ON sup.user_id = u.superior_id
        WHERE u.user_id = ?
    `;

        dbHots.execute(queryGetProfile, [user_id], (err, results) => {
            if (err) {
                console.log(timestamp, "GET PROFILE ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            if (!results.length) {
                return res.status(404).send({
                    success: false,
                    message: 'User not found!'
                });
            }

            console.log(timestamp, "GET PROFILE SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET PROFILE SUCCESS",
                data: results[0]
            });
        });
    },


    // / / / / // 
    pmlogin: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { uid, asin } = req.body



        // cari username dulu
        let queryGetUid = `
                            SELECT
                                u.user_id,
                                u.employee_id,
                                u.firstname,
                                u.lastname,
                                u.role_id,
                                u.uid,
                                u.active,
                                u.login_attempt
                            FROM
                                user u
                            WHERE
                                LOWER(u.uid) = LOWER(?)
                                AND u.active = 1
                            LIMIT 1`
        let paramGetUid = [uid]


        // cari username dulu
        dbHots.execute(queryGetUid, paramGetUid, (err1, results1) => {

            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                })
                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err1)
            } else {

                if (!results1[0]) {
                    res.status(200).send({
                        success: false,
                        message: 'Username is not exist!'
                    })

                } else {

                    let dataLogin = results1[0]

                    if (dataLogin.login_attempt > process.env.SECURITY_TRIAL_LOGIN_HT || dataLogin.login_attempt == process.env.SECURITY_TRIAL_LOGIN_HT) {
                        res.status(200).send({
                            message: ` Too many login attempt! Please reset password by "forgot password" to login!`,
                            success: false,
                            // userData,
                            // token,
                            err: ''
                        });
                    } else if (dataLogin.login_attempt < process.env.SECURITY_TRIAL_LOGIN_HT || !dataLogin) {


                        let queryMatchUidPswd = `
                                            select
                                            u.user_id,
                                            u.firstname,
                                            u.lastname,
                                            u.uid,
                                            u.active,
                                            r.role_id,
                                            r.role_name,
                                            d.department_name,
                                            d.department_id,
                                            CONCAT(u.firstname, ' ', u.lastname) as user_name,
                                            u.superior_id,
                                            u.nik,
                                            (
                                            select distinct 
                                                JSON_ARRAYAGG(u2.superior_id)
                                            from
                                                user u2
                                            where 
                                            superior_id is not null 
                                            ) as team_leader_user_id,
                                                (
                                                select
                                                    distinct 
                                                                                            JSON_ARRAYAGG(tm.team_id)
                                                from
                                                    m_team_member tm 
                                                where
                                                    tm.user_id = u.user_id 
                                                                                        ) as team_id_linked
                                                from
                                                    user u
                                                left join 
                                                    m_role r on
                                                    u.role_id = r.role_id
                                                left join 
                                                    m_department d on
                                                    u.department_id = d.department_id
                                                WHERE
                                                    LOWER(uid) = LOWER(?)
                                                    AND pswd = ?
                                                    AND u.role_id IN (1, 2, 4)
                    
                     `
                        let paramMatchUidPswd = [uid, asin]

                        dbHots.execute(queryMatchUidPswd, paramMatchUidPswd, (err2, results2) => {

                            if (err2) {

                                res.status(501).send({
                                    success: false,
                                    message: 'Username and Password Combination is not correct!',
                                    userData: {},
                                    tokek: ''
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err2)

                            } else if (results2[0]) {

                                let tokek = generateTokenHT(results2[0]);

                                res.status(200).send({
                                    success: true,
                                    message: `Login success! Welcome ${uid}`,
                                    userData: results2[0],
                                    tokek
                                })
                                // res.status(200).cookie('tokek', tokek, {
                                //     httpOnly: true,
                                //     secure: true, // Gunakan ini hanya jika menggunakan HTTPS
                                //     maxAge: 3600000 // Cookie berlaku selama 1 jam 
                                // }).send({
                                //     success: true,
                                //     message: `Login success! Welcome ${uid}`,
                                //     userdata: results2[0],
                                //     tokek
                                // })

                                //update token dan terakhir kali login
                                dbHots.execute(`UPDATE user 
                                            SET registration_nr = ?,
                                            last_login_date = now(),
                                            login_attempt = 0
                                            WHERE uid =  ?`, [tokek, uid])

                                console.log(timestamp, "HOTS Auth Login : " + uid + " success")

                            } else {

                                let incrementAttempt = dataLogin.login_attempt + 1

                                let queryUpdate = `UPDATE  user 
                                                    SET 
                                                    login_attempt = ?,
                                                    login_trial_time = now()
                                                    WHERE user_id = ?;`

                                let paramUpdate = [incrementAttempt, dataLogin.user_id]

                                dbHots.execute(queryUpdate, paramUpdate)

                                res.status(201).send({
                                    success: false,
                                    message: ` incorrect Password! ${process.env.SECURITY_TRIAL_LOGIN_HT - dataLogin.login_attempt} attempt left!`
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " incorrect password")

                            }

                        })

                    }
                }
            }
        });
    },

    pmlogout: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            console.log(timestamp, `Logout for user: ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Logout successful"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    pmkeepLogin: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [users] = await dbHots.promise().query(`
            SELECT u.*, r.role_name, d.department_name, jt.job_title as title_name
            FROM m_users u
            LEFT JOIN m_role r ON u.role_id = r.role_id
            LEFT JOIN m_department d ON u.department_id = d.department_id
            LEFT JOIN m_job_title jt ON u.jobtitle_id = jt.jobtitle_id
            WHERE u.user_id = ? AND u.active = 1
        `, [user_id]);

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            const user = users[0];
            console.log(timestamp, `Keep login successful for user: ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Token valid",
                data: {
                    user: {
                        user_id: user.user_id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role_name: user.role_name,
                        department_name: user.department_name,
                        title_name: user.title_name
                    }
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    pmregister: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const { firstname, lastname, uid, email, password, role_id, department_id, team_id, jobtitle_id } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            await dbPM.promise().query(`
                INSERT INTO pm_users 
                (firstname, lastname, uid, email, password, role_id, department_id, team_id, jobtitle_id, is_active, created_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            `, [firstname, lastname, uid, email, hashedPassword, role_id, department_id, team_id, jobtitle_id]);

            console.log(`${timestamp}User registration success for ${email}`);

            res.status(201).json({
                success: true,
                message: "User registered successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get user profile
    pmgetProfile: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbPM.promise().query(`
                SELECT u.*, r.role_name, d.department_name, t.team_name, j.job_title
                FROM pm_users u
                LEFT JOIN pm_role r ON u.role_id = r.role_id
                LEFT JOIN pm_department d ON u.department_id = d.department_id
                LEFT JOIN pm_team t ON u.team_id = t.team_id
                LEFT JOIN pm_job_title j ON u.jobtitle_id = j.jobtitle_id
                WHERE u.user_id = ? AND u.is_deleted = 0
            `, [user_id]);

            console.log(`${timestamp}Profile fetch success for user ${user_id}`);

            res.status(200).json({
                success: true,
                data: result[0] || null
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update user profile
    pmupdateProfile: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { firstname, lastname, email, phone, profile_picture } = req.body;

        try {
            await dbPM.promise().query(`
                UPDATE pm_users 
                SET firstname = ?, lastname = ?, email = ?, phone = ?, profile_picture = ?, updated_date = NOW()
                WHERE user_id = ?
            `, [firstname, lastname, email, phone, profile_picture, user_id]);

            console.log(`${timestamp}Profile update success for user ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Profile updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Forgot password
    pmforgotPassword: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const { email } = req.body;

        try {
            const [user] = await dbPM.promise().query(`
                SELECT user_id, email, firstname, lastname FROM pm_users 
                WHERE email = ? AND is_active = 1 AND is_deleted = 0
            `, [email]);

            if (user.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

            await dbPM.promise().query(`
                UPDATE pm_users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?
            `, [resetToken, resetExpiry, user[0].user_id]);

            console.log(`${timestamp}Password reset token generated for ${email}`);

            res.status(200).json({
                success: true,
                message: "Password reset token sent",
                reset_token: resetToken // In production, send via email
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Reset password
    pmresetPassword: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const { reset_token, new_password } = req.body;

        try {
            const [user] = await dbPM.promise().query(`
                SELECT user_id FROM pm_users 
                WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_deleted = 0
            `, [reset_token]);

            if (user.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired reset token"
                });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);

            await dbPM.promise().query(`
                UPDATE pm_users 
                SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_date = NOW()
                WHERE user_id = ?
            `, [hashedPassword, user[0].user_id]);

            console.log(`${timestamp}Password reset success for user ${user[0].user_id}`);

            res.status(200).json({
                success: true,
                message: "Password reset successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },





    /* 
     
    */

}