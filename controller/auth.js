const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const { hashPassword, createToken } = require("../config/encrypts");
const { forgotPasswordMailSender } = require('../service/mailer/eorder/eorder_mailer');

let yellowTerminal = "\x1b[33m";

module.exports = {
  login: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
    let { userID, pswd } = req.body;

    let cekUsername = await dbQuery(`
    SELECT
    su.uid,
    su.user_id,
    su.company_id,
    COALESCE(el.login_attempt, 0) login_attempt,
    el.login_trial_time
  FROM
    sys_user su
  LEFT JOIN event_logger el ON
    su.user_id = el.user_id AND el.event_type = 1
  WHERE
    su.uid = ${dbConf.escape(userID)}
  LIMIT 1`)

    if (cekUsername[0]) {
      let dataLogin = cekUsername[0]


      if (dataLogin.login_attempt > 5 || dataLogin.login_attempt == 5) {
        res.status(200).send({
          message: ` Too many login attempt! Please reset password by "forgot password" to login!`,
          success: false,
          // userData,
          // token,
          err: ''
        });

      } else if (dataLogin.login_attempt < 5 || !dataLogin) {

        let query = `
        SELECT
        su.uid,
        su.user_id,
        su.lang_id,
        su.employee_id,
        mc.country_id,
        mc.company_name,
        mc.company_id,
        mct.country_desc,
        su.active,
        su.type_id,
        mut.user_type,
        CAST(COALESCE(flav.value, 2) AS UNSIGNED) max_sku,
        CAST(COALESCE(pal.value, 0) AS UNSIGNED) pallet,
        CAST(COALESCE(tr.value, 1) AS UNSIGNED) transport,
        COALESCE(p.firstname, '') firstname,
        CAST(COALESCE(maxtrck.value, 0) AS UNSIGNED) max_truck,
        CAST(COALESCE(maxflvrtrck.value, 0) AS UNSIGNED) max_flavour_truck,
        COALESCE(p.midname, '') midname,
        COALESCE(p.lastname, '') lastname,
        COALESCE(
          JSON_ARRAYAGG(mcn.conditions),
          JSON_ARRAY()
        ) AS spc_condition
      FROM
        sys_user su
      JOIN mst_company mc ON
        su.company_id = mc.company_id
      JOIN mst_country mct ON
        mct.country_id = mc.country_id
      JOIN m_user_type mut ON
        su.type_id = mut.type_id
      LEFT JOIN m_config_new flav ON
        su.company_id = flav.company_id
        AND flav.conditions = 1
      LEFT JOIN m_config_new pal ON
        su.company_id = pal.company_id
        AND pal.conditions = 2
      LEFT JOIN m_config_new maxtrck ON
          su.company_id = maxtrck.company_id
          AND maxtrck.conditions = 15
        LEFT JOIN m_config_new maxflvrtrck ON
          su.company_id = maxflvrtrck.company_id
          AND maxflvrtrck.conditions = 16
      LEFT JOIN m_config_new top ON
        su.company_id = top.company_id
        AND top.conditions = 3
      LEFT JOIN m_config_new tr ON
        tr.company_id = su.company_id
        AND tr.active = 1
        AND tr.conditions = 7
      LEFT JOIN mst_employee me ON
        me.employee_id = su.employee_id
      LEFT JOIN person p ON
        p.person_id = me.employee_id
      LEFT JOIN m_config_new mcn 
        ON mcn.company_id = su.company_id  
      WHERE
        su.uid = ?
      AND 
        su.asin = ?
      LIMIT 1
        `
        dbConf.query(query, [userID, hashPassword(pswd)]
          ,
          async (err, results) => {

            if (err) {
              res.status(200).send({
                message: ` Something Error but its not your fault :(`,
                success: false,
                // userData,
                // token: [],
                err
              });
              console.log(`${timestamp} ERROR at auth -> login message: ${err}`);

            } else {




              let userData = results;

              //berhasil login
              if (results[0]) {

                console.log("results[0]",results[0])

                if (results[0].type_id === 1 || results[0].type_id === 2 || results[0].type_id === 4  ) {

                  console.log("results[0]",results[0])
                  res.status(200).send({
                    message: ` Wrong username`,
                    success: false,
                    // userData,
                    // token,
                    err: ''
                  });
                }

                let rawDataToken = results[0];
                let dataToken = {
                  uid: rawDataToken.uid,
                  user_id: rawDataToken.user_id,
                  employee_id: rawDataToken.employee_id,
                  company_id: rawDataToken.company_id,
                  active: rawDataToken.active,
                  type_id: rawDataToken.type_id
                }

                //old token
                // let token = createToken({ ...results[0] });

                //new token
                let token = createToken(dataToken);

                //console.log(timestamp, "userData[0] @login", userData[0])
                //console.log(timestamp, "dataToken @login", dataToken)


                // UPDATE TOKEN yang disimpan di sys_user untuk proses kalibrasi validasi token existing
                const sqlUpdateToken = await dbQuery(
                  `UPDATE sys_user 
                   SET registration_nr = ?, last_login_date = now()
                   WHERE uid = ?`,
                  [token, userID]
                );

                //reset percobaan login 
                let sqlInject = await dbQuery(
                  `
                    UPDATE event_logger 
                    SET 
                    login_attempt = 0
                    WHERE user_id = ${dbConf.escape(dataLogin.user_id)}; 
                    `);

                if (userData[0].active === 2) {

                  let userData = []
                  let token = []

                  res.status(401).send({
                    success: false,
                    userData,
                    token,
                    message: `Your Account is Not Authorized to log in!`
                  });
                  console.log(timestamp + `==> Auth Login ${userID} UNAUTHORIZED TO LOGIN`);

                } else if( userData[0].active === null || userData[0].active === undefined ){

                  //login berhasil
                  res.status(200).send({
                    success: true,
                    userData,
                    token,
                    message: `Wrong combination of Username or Password!`
                  });
                  console.log(timestamp + `==> Auth Login ${userID} False`);
                } else {

                  //login berhasil
                  res.status(200).send({
                    success: true,
                    userData,
                    token,
                    message: `Welcome ${userID}!`
                  });
                  addSqlLogger((userData[0].user_id), query, 'success: true', 'login')
                  console.log(timestamp + `==> Auth Login ${userID} SUCCESS`);
                }

                //salah password
              } else {

                if (!dataLogin.login_trial_time) {
                  let sqlInject = await dbQuery(`
                  INSERT INTO
                  event_logger
                  (user_id, uid , login_attempt , login_trial_time, event_type)
                  VALUES
                  (${dataLogin.user_id}, '${dataLogin.uid}', 1, now(), 1)
                  `)

                  // JIKA sudah pernah login tapi ternyata salah password maka tambahkan nilai    
                } else {

                  //menambah nilailogin attempt
                  let incrementAttempt = dataLogin.login_attempt + 1
                  let sqlInject = await dbQuery(`
                  UPDATE event_logger 
                  SET 
                  login_attempt = ${incrementAttempt},
                  login_trial_time = now()
                  WHERE user_id = ${dataLogin.user_id};
                  `)
                }

                res.status(200).send({
                  message: ` Wrong Password! ${5 - dataLogin.login_attempt} attempt left!`,
                  success: false,
                  // userData,
                  // token,

                });
                console.log(timestamp + `==> Auth Login ${userID} success: false`);

              }

              // console.log(`token from ${userID} => ${token}`)

            }
          }
        );
      }


    } else {
      res.status(200).send({
        message: ` username ${userID} is not exist! please enter the correct one`,
        success: false,
        // userData,
        // token,
        err: ''
      });
      console.log(timestamp + `==> Auth Login E-Order ${userID}: Username is not exist`);
    }


  },
  hashPassword: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let { userID, pswd } = req.body;

    let rev_userID = "'" + userID + "'";
    let rev_pswd = "'" + pswd + "'";

    let checkPass = await dbQuery(
      `SELECT asin FROM sys_user WHERE uid= ${rev_userID} AND pswd= ${rev_pswd} `
    );
    try {
      console.log(timestamp + "Auth checkPass", checkPass[0].asin);

      if (!checkPass[0].asin) {
        dbConf.query(
          `UPDATE sys_user
                     SET asin = ${dbConf.escape(hashPassword(pswd))}
                     WHERE uid = ${rev_userID} AND pswd = ${rev_pswd};
            `
        ),
          (err, results) => {
            console.log(timestamp + err);
            if (err) {
              res.status(500).send(err);
              console.log(timestamp + "error hash password :", err);
            }
            res.status(200).send(results);
            console.log(timestamp + `Successfully hash for ${userID}`);
          };
      }
      res.status(200).send({
        success: true,
        message: " hash pass success!",
      });
    } catch (error) {
      console.log(timestamp + "Error query SQL hash password :", error);
      res.status(500).send({
        success: false,
        message: "Failed on HASH ❌",
        error,
      });
    }
  },
  keepLogin: async (req, res) => {

    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    try {
      const MAX_RETRIES = 3; // Retry up to 3 times
      let attempt = 0;
      let validateToken;

      while (attempt < MAX_RETRIES) {
        validateToken = await dbQuery(
          `SELECT su.user_id FROM sys_user su WHERE su.user_id = ? AND registration_nr = ?`,
          [req.dataToken.user_id, req.token]
        );

        if (validateToken.length > 0 && validateToken[0]) break; // Success, exit loop

        console.log(`Retry attempt ${attempt + 1} failed. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before retrying
        attempt++;
      }
      if (validateToken[0]) {
        console.log(timestamp + "=>> Auth Keep login for : " + req.dataToken.uid);
        console.log("--------------------------")
        console.log("Auth Keep login for : " + req.dataToken.user_id)
        console.log("--------------------------")
        console.log("Token : ", req.token);
        console.log("--------------------------")

        let userID = await dbQuery(
          `
         SELECT
            su.uid,
            su.user_id,
            su.lang_id,
            su.employee_id,
            mc.country_id,
            mc.company_name,
            mc.company_id,
            mct.country_desc,
            su.active,
            su.type_id,
            mut.user_type,
            CAST(COALESCE(flav.value, 2) AS UNSIGNED) max_sku,
            CAST(COALESCE(pal.value, 0) AS UNSIGNED) pallet,
            CAST(COALESCE(maxtrck.value, 0) AS UNSIGNED) max_truck,
            CAST(COALESCE(maxflvrtrck.value, 0) AS UNSIGNED) max_flavour_truck,
            CAST(COALESCE(tr.value, 1) AS UNSIGNED) transport,
            COALESCE(p.firstname, '') firstname,
            COALESCE(p.midname, '') midname,
            COALESCE(p.lastname, '') lastname,
            COALESCE(
                JSON_ARRAYAGG(mcn.conditions),
                JSON_ARRAY()
            ) AS spc_condition
        FROM sys_user su
        JOIN mst_company mc 
            ON su.company_id = mc.company_id
        JOIN mst_country mct 
            ON mct.country_id = mc.country_id
        JOIN m_user_type mut 
            ON su.type_id = mut.type_id
        LEFT JOIN m_config_new flav 
            ON su.company_id = flav.company_id AND flav.conditions = 1
        LEFT JOIN m_config_new pal 
            ON su.company_id = pal.company_id AND pal.conditions = 2
        LEFT JOIN m_config_new maxtrck 
            ON su.company_id = maxtrck.company_id AND maxtrck.conditions = 15
        LEFT JOIN m_config_new maxflvrtrck 
            ON su.company_id = maxflvrtrck.company_id AND maxflvrtrck.conditions = 16
        LEFT JOIN m_config_new top 
            ON su.company_id = top.company_id AND top.conditions = 3
        LEFT JOIN m_config_new tr 
            ON tr.company_id = su.company_id AND tr.active = 1 AND tr.conditions = 7
        LEFT JOIN mst_employee me 
            ON me.employee_id = su.employee_id
        LEFT JOIN person p 
            ON p.person_id = me.employee_id
        LEFT JOIN m_config_new mcn  -- 👈 generic join for collecting ids
            ON mcn.company_id = su.company_id
        WHERE su.user_id = ${dbConf.escape(req.dataToken.user_id)}
        GROUP BY su.uid
        LIMIT 1

                   
              `
        );

        if (userID[0].active === 2) {
          let userID = []
          let token = []
          res.status(200).send([...userID, token]);
        } else {

          // optimized dengan mengirim data token lebih sedikiiiiit
          let rawDataToken = userID[0];
          let dataToken = {
            uid: rawDataToken.uid,
            user_id: rawDataToken.user_id,
            employee_id: rawDataToken.employee_id,
            company_id: rawDataToken.company_id,
            active: rawDataToken.active,
            type_id: rawDataToken.type_id
          }

          //console.log(timestamp,"dataToken @keepLogin", dataToken)
          //console.log(timestamp, "userID[0] @keepLogin", userID[0])


          //pisahkan data yang diencrypt dan dikirim 
          let token = createToken(dataToken, '30m');

          //old token
          // let token = createToken(...userID);


          res.status(200).send([...userID, token]);

          let sqlUpdateToken = await dbQuery(`UPDATE sys_user 
          SET registration_nr = '${token}'
          WHERE user_id = ${dbConf.escape(req.dataToken.user_id)};`);


          // UPDATE data kapan kali terakhir aktif login. 
          let sqlUpdateLoginLog = await dbQuery(`
          UPDATE sys_user SET last_login_date = now() WHERE uid = '${req.dataToken.uid}'; `);


        }

      } else {

        res.status(401).send([]);
        console.log(timestamp + "! Error query SQL keeplogin 401 can't login :", res.data);

      }

    } catch (error) {
      console.log(timestamp + "! Error query SQL  keeplogin catch:", error.message);
      res.status(500).send(error.message);
    }
  },
  changePassword: async (req, res) => {

    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    try {
      let { pswd, newPswd } = req.body;
      let userCheck = await dbQuery(
        `SELECT su.uid uid  from sys_user su 
           JOIN mst_company mc on su.company_id = mc.company_id
           WHERE uid = '${req.dataToken.uid}' and asin= ${dbConf.escape(
          hashPassword(pswd)
        )};
          `
      );

      if (req.dataToken.uid) {
        // console.log(Date.now() + "req.dataToken.uid",req.dataToken.uid)
        // console.log(Date.now() + "hash prev password", hashPassword(pswd));
        // console.log(Date.now() + "hash new password", hashPassword(newPswd));

        if (userCheck[0]) {

          let query = `
          UPDATE sys_user 
          SET asin = ${dbConf.escape(hashPassword(newPswd))}
          WHERE uid = '${req.dataToken.uid}';
          `
          let sqlInject = await dbQuery(query);

          let sqlUpdateChangePassLog = await dbQuery(`
            UPDATE sys_user 
            SET last_pswd_changed = now() 
            WHERE uid = '${req.dataToken.uid}';
                `);

          res.status(200).send({
            success: true,
            message: " Your Password has Changed!",
          });
          // }
        } else {
          res.status(200).send({
            success: false,
            message: "Wrong Previous Password!",
          });
        }
      } else {
        res.status(401).send({
          success: false,
          message: "unauthorized",
        });
      }
      console.log(timestamp + "Auth password change userCheck", userCheck[0].uid);

    } catch (error) {

      res.status(500).send({
        success: false,
        message: "ERROR 500",
      });
      console.log(timestamp + error);
    }
  },
  forgotPassword: async (req, res) => {

    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    try {
      let getUid = (await dbQuery(`
      SELECT
        me.email,
        me.employee_id
      FROM
        mst_employee me
      LEFT JOIN sys_user su ON
        su.employee_id = me.employee_id
      WHERE
        su.uid =  ${dbConf.escape(req.body.uid)}
        AND su.type_id IN (3, 9)
         limit 1
        ;`))[0];

      //buat token
      let token = createToken({ ...getUid }, '5m')

      if (getUid) {



        //Trigger send mail
        forgotPasswordMailSender(getUid.email, token);

        //ganti tempatnya bukan di registration_nr supaya user existing bisa
        let query = `UPDATE sys_user  SET registration_nr = '${token}' WHERE uid = ${dbConf.escape(req.body.uid)};`
        let sqlUpdateToken = await dbQuery(query);

        res.status(200).send({
          success: true,
          message: "Reset Password Link has been sent into your email",
        });

        console.log(timestamp + '##### FORGOT PASSWORD =>' + req.body.uid + "=> uid valid")

      } else {

        console.log(timestamp + '##### FORGOT PASSWORD =>' + req.body.uid + "uid tidak ditemukan")

        res.status(200).send({
          success: false,
          message: "User ID is invalid or not exist!",
        });

      }

    } catch (error) {

      console.log(timestamp + error);

      res.status(500).send({
        success: false,
        message: "ERROR 500",
      });

    }

  },
  verifyTokenForgotPassword: async (req, res) => {


    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


    try {

      let query = `SELECT su.employee_id FROM sys_user su WHERE su.registration_nr = '${req.token}'`

      //MEMERIKA APAKAH TOKENN MASIH ADA DI DATABASE ATAU TIDAK. 
      let validateToken = (await dbQuery(query))[0];

      if (!validateToken) {

        res.status(500).send({
          success: false,
          message: "OOPS! Looks like you tried to change password more than once!",
        });

      } else {

        if (req.dataToken.employee_id) {

          res.status(200).send({
            success: true,
            message: "token is valid, keep going",
          });

          console.log(timestamp + `auth token verification for ${req.dataToken.email}`)
          addSqlLogger(0, query, (JSON.stringify(validateToken)), 'verifyTokenForgotPassword');

        } else {

          res.status(500).send({
            success: false,
            message: "The RESET Password link has already EXPIRED. Please try to input email again",
          });

          console.log(timestamp + `auth token verification Failed. `)
        }

      }



    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "error 500",
      });
    }

  },
  changePasswordForgotPassword: async (req, res) => {


    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    try {
      let { pswd } = req.body;

      //MENNGHAPUS DATA TOKEN DARI DATABASE UNTUK MENCEGAH USER MENGANTI KEMBALI PASSWORD
      let sqlUpdateToken = await dbQuery(`UPDATE sys_user SET registration_nr = ' password reseted ' WHERE employee_id = ${req.dataToken.employee_id};`);

      if (req.dataToken.employee_id) {

        let query = `
        UPDATE sys_user 
        SET asin = ${dbConf.escape(hashPassword(pswd))}
        WHERE employee_id = ${req.dataToken.employee_id};
        `
        let sqlInject = await dbQuery(query);

        let sqlUpdateChangePassLog = await dbQuery(`
            UPDATE sys_user 
            SET last_pswd_changed = now() 
            WHERE employee_id = ${req.dataToken.employee_id};`);

        let sqlResetEventLogger = await dbQuery(
          ` UPDATE event_logger 
            SET 
            login_attempt = 0
            WHERE user_id = ${req.dataToken.employee_id}; 
            `);

        res.status(200).send({
          success: true,
          message: "Your Password has Changed!",
        });
        addSqlLogger(req.dataToken.employee_id, query, (JSON.stringify(sqlInject)), 'changePasswordForgotPassword');
        console.log(timestamp + "Auth forgot password change for email:", req.dataToken.email);

      } else {
        res.status(401).send({
          success: false,
          message: "unauthorized",
        });
        console.log(timestamp + "Auth forgot password change for email UNANUNUNUN bodo ah");
      }


    } catch (error) {

      console.log(timestamp + error);
      res.status(500).send({
        success: false,
        message: "something wrong",
      });

    }


  },
  isOpenLoginPage: async (req, res) => {

    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    // ganti status ini untuk mencegah user login atau menampilkan status tidak bisa login
    const open = true;
    //const open = false;



    if (open) {

      res.status(200).send({
        status: true,
        message: "Server are Ready	",
      });
      console.log(timestamp + "Server status: Server are Ready");

    } else {

      res.status(200).send({
        status: false,
        message: "Sorry We are sleeping now",
      });
      console.log(timestamp + "Server status: Sorry We are sleeping now");
    }


  },
};
