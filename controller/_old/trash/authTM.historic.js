const { dbTM, dbTMQuery } = require("../config/db");
const { hashPasswordTM, createTokenTM } = require("../config/encrypts");


let gray = "\x1b[90m"
module.exports = {
    login: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username, susu } = req.body;

        let cekUsername = await dbTMQuery(`
        SELECT su.username, su.user_id, su.company_id, al.login_attempt, al.login_trial_time, al.login_attempt_exp  
        FROM sys_user su
        LEFT JOIN act_login al 
        ON su.user_id = al.user_id  
        WHERE su.username = ${dbTM.escape(username)}`)

        // cara darurat buat tarik value password yang sudah dihash. hehehe
        //let kepiting = dbTM.escape(hashPasswordTM(susu));
        //console.log(kepiting)

        if (cekUsername[0]) {

            let dataLogin = cekUsername[0]

            if (dataLogin.login_attempt > process.env.SECURITY_TRIAL_LOGIN_TM || dataLogin.login_attempt == process.env.SECURITY_TRIAL_LOGIN_TM) {
                res.status(200).send({
                    message: ` Your Account is blocked due to Too Many Trial of Login. Reset your password!`,
                    success: false,
                    // userData,
                    // token,
                    err: ''
                });


            } else if (dataLogin.login_attempt < process.env.SECURITY_TRIAL_LOGIN_TM || !dataLogin) {

                //data user yang juga dipakai untuk login
                let query = `SELECT su.username, su.user_id, su.lang_id, su.type_id, mt.type_name, al.login_attempt, al.login_trial_time, al.login_attempt_exp FROM sys_user su
                LEFT JOIN act_login al ON su.user_id = al.user_id  
                LEFT JOIN mst_type mt ON su.type_id = mt.type_id 
                WHERE su.username = '${username}' AND su.asin = ${dbTM.escape(hashPasswordTM(susu))};`;

                dbTM.query(query, async (err, results) => {

                    // ERROR PAS LOGIN
                    if (err) {
                        res.status(200).send({
                            message: ` Something Error but its not your fault :(`,
                            success: false,
                            // userData,
                            // token: [],
                            err
                        });
                        console.log(`${timestamp} ERROR at auth -> login TMM  message: ${err}`);

                    } else {

                        //JIKA LOGIN BERHASIL MAKA INI:
                        let sqlCheckActLogin = await dbTMQuery(`SELECT al.user_id, al.tokek FROM act_login al WHERE al.user_id = ${dataLogin.user_id} `)

                        if (results[0]) {


                            let tokek = createTokenTM({ ...results[0] });
                            let siapa = results[0];

                            //SUDAH PERNAH LOGIN
                            if (sqlCheckActLogin[0]) {

                                let prevToken = !sqlCheckActLogin[0].tokek ? '' : sqlCheckActLogin[0].tokek
                                let sqlChange = await dbTMQuery(`
                                UPDATE act_login 
                                SET 
                                login_attempt = 0,
                                tokek = '${tokek}',
                                tokek_bangke = '${prevToken}'
                                WHERE user_id = ${dataLogin.user_id};`)


                                //BELUM PERNAH LOGIN
                            } else {
                                let sqlInject = await dbTMQuery(
                                    `
                                    INSERT INTO
                                    act_login
                                    (user_id, username , tokek)
                                    VALUES
                                    (${dataLogin.user_id}, '${dataLogin.username}', '${tokek}')
                                    `
                                )
                            }

                            let sqlChangeLastLogin = dbTMQuery(
                                `
                                 UPDATE sys_user SET last_login = now() WHERE user_id = '${dataLogin.user_id}';
                                `);

                            // BUAT TOKEN DARI DATA RESULTSSSSSS

                            //siapa: userData
                            //tokek: token

                            res.status(200).send({
                                message: ` Welcome ${username}!`,
                                success: true,
                                siapa,
                                tokek,
                            });
                            console.log(timestamp + `==> Auth TMM Login ${username} success: true`);



                            // JIKA LOGIN GAGAL MAKA INI:
                        } else {


                            if (sqlCheckActLogin[0]) {
                                let loginAttemt = dataLogin.login_attempt


                                // if (loginAttemt == 0) {
                                let incrementAttempt = dataLogin.login_attempt + 1
                                let sqlInject = await dbTMQuery(
                                    `
                                        UPDATE act_login 
                                        SET 
                                        login_attempt = ${incrementAttempt},
                                        login_trial_time = now()
                                        WHERE user_id = ${dataLogin.user_id};
                                        `
                                )
                                // console.log("jalankan query SQL UPDATE")
                                // } 
                                // else {
                                //     let incrementAttempt = dataLogin.login_attempt + 1
                                //     let sqlInject = await dbQuery(
                                //         `
                                //         UPDATE act_login 
                                //         SET 
                                //         login_attempt = ${incrementAttempt},
                                //         login_trial_time = now()
                                //         WHERE user_id = ${dataLogin.user_id};
                                //         `
                                //     )
                                //     console.log("jalankan query SQL UPDATE")

                                // }

                            } else {
                                let sqlInject = await dbTMQuery(
                                    `
                                    INSERT INTO
                                    act_login
                                    (user_id, username , login_attempt , login_trial_time)
                                    VALUES
                                    (${dataLogin.user_id}, '${dataLogin.username}', 1, now())
                                    `
                                )
                                // console.log("jalankan query SQL INSERT")
                            }


                            res.status(200).send({
                                message: ` Wrong Password!`,
                                success: false,
                                // userData,
                                // token,

                            });
                            console.log(timestamp + `==> Auth Login TMM  ${username} success: false`);

                        }

                    }
                })
            }
        } else {
            res.status(200).send({
                message: ` username ${username} is not exist! please enter the correct one`,
                success: false,
                // userData,
                // token,
                err: ''
            });
            console.log(timestamp + `==> Auth Login TMM ${username}: Username is not exist`);

        }

    }
    , createUser: async (req, res) => {
        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            company_id,
            employee_id,
            type_id,
            username,
            susu,
            lang_id
        } = req.body;
        // susu =  password

        let newUser_id = company_id + '0001';

        let cekUserID = await dbTMQuery(`SELECT MAX(user_id) latest_id FROM sys_user su WHERE company_id = ${company_id}`)
        let cekUsername = await dbTMQuery(`SELECT username latest_username FROM sys_user su WHERE username = ${dbTM.escape(username)}`)
        let user_id = cekUserID == [] ? parseInt(newUser_id) : cekUserID[0].latest_id + 1;

        // console.log('cek user_id', cekUserID)
        // console.log('cek username', cekUsername)
        // console.log('user_id final', user_id)

        //INI JANGAN JAUH-JAUH DARI dbQuery
        let query = `
        INSERT INTO 
        sys_user 
        (user_id, company_id, employee_id, type_id, username, asin, registration_no, lang_id, registration_date, status ) 
        VALUES 
        ( ?, ?, ?, ?, '?', ?, ?, ?, now(), 0 )
        `;

        if (cekUsername[0]) {
            res.status(200).send({
                message: `username ${username} already exist! Please try another !`,
                success: false,
                err: ''
            });
            console.log(`${timestamp} AUTH TMM => createUser for ${username} is DUPLICATES USERNAME`);
        } else {
            dbTMQuery.query(query, [user_id, company_id, employee_id, type_id, username, hashPasswordTM(susu), user_id, lang_id], async (err, results) => {
                if (err) {
                    res.status(500).send({
                        message: ` Please Check Connection`,
                        success: false,
                        err
                    });
                    console.log(`${timestamp} ERROR at auth -> createUser message: ${err}`);
                } else {
                    res.status(200).send({
                        message: ` successfully create ${username}'s account !`,
                        success: true,
                        err: ''
                    });
                    console.log(`${timestamp} AUTH TMM => createUser for ${username} success`);
                }
            })
        }

    }
    , keepLogin: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        let dataToken = req.dataToken
        // console.log("dataToken", dataToken)

        try {
            let validateToken = await dbTMQuery(
                `SELECT al.user_id, al.tokek FROM act_login al WHERE al.user_id=${ 
                    req.dataToken.user_id
                 } AND al.tokek =  ${dbTM.escape(req.token)};`
            );

            if (validateToken[0]) {


                let userData = await dbTMQuery(
                    `SELECT su.username, su.user_id, su.lang_id, su.type_id, mt.type_name, al.login_attempt, al.login_trial_time, al.login_attempt_exp FROM sys_user su
                    LEFT JOIN act_login al ON su.user_id = al.user_id  
                    LEFT JOIN mst_type mt ON su.type_id = mt.type_id 
                    WHERE su.username = '${req.dataToken.username}';`
                );

                let tokek = createTokenTM(...userData);
                res.status(200).send({
                    ...userData,
                    tokek,
                    message: "auth keeplogin success",
                    success: true
                });

                // ===> DIlakukan untuk di database

                //Update Token Yang Teregister
                let sqlUpdateToken = dbTMQuery(`
                UPDATE act_login 
                SET 
                tokek = '${tokek}',
                tokek_bangke = '${validateToken[0].tokek}'
                WHERE user_id = ${dbTM.escape(req.dataToken.user_id)};`);

                // UPDATE data kapan kali terakhir aktif login. 
                let sqlUpdateLoginLog = dbTMQuery(`
                UPDATE sys_user SET last_login = now() WHERE user_id = '${req.dataToken.user_id}'; `);

                console.log(timestamp + "=>> Auth TMM  Keep login for : " + req.dataToken.username);

            } else {

                res.status(401).send({
                    message: "invalid token",
                    success: false
                });

                console.log(timestamp + "=>> INVALID Auth TMM  Keep login for : " + req.dataToken.username);
            }

        } catch (error) {
            res.status(500).send({
                message: "invalid token",
                success: false
            });
            console.log(timestamp + "=>> ERROR 500 Auth TMM  Keep login for : " + error);
        }

    }
}