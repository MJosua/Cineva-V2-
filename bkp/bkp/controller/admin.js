const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const { hashPassword } = require("../config/encrypts");

let blue = "\x1b[31m";

module.exports = {
  addAccount: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let {
      userID,
      company_id,
      type_id,
      employee_id,
      firstname,
      lastname,
      uid,
      pswd,
      email,
      telp
    } = req.body;


    if (req.dataToken.type_id = 9) {



      let query = ` 
                 INSERT INTO sys_user
                (user_id, company_id, employee_id, 
                    firstname, lastname, type_id, 
                    uid, pswd, asin, 
                    lang_id, registration_date, active )
                VALUES
                (${userID}, ${company_id}, ${employee_id}, 
                    '${firstname}','${lastname}', ${type_id}, 
                    '${uid}', 'cuma Allah dan usernya yang boleh tau', ${dbConf.escape(hashPassword(pswd))},
                     1, now(), 0 );


                INSERT INTO mst_employee 
                (employee_id, company_id, person_id, 
                  department_id, join_date, email, 
                  appl_phone_nr, appl_language)
                VALUES
                (${employee_id}, ${company_id}, ${employee_id},
                  99, now(),'${email}',
                  '${telp}', 1 );


                INSERT INTO person  
                  (person_id, firstname, 
                    lastname, creation_date)
                VALUES 
                  (${employee_id}, '${firstname}',
                    '${lastname}', now());

                `
      let uidAlreadyExist = (await dbQuery(`SELECT user_id FROM sys_user su WHERE uid = '${uid}';`)).length
      let user_idAlreadyExist = (await dbQuery(`SELECT user_id FROM sys_user su WHERE user_id = ${userID} ;`)).length

      if (uidAlreadyExist == 0 && user_idAlreadyExist == 0) {

        dbConf.query(
          query,
          (err, results) => {

            if (err) {

              res.status(500).send({
                success: false,
                message: 'Gagal membuat akun :('
              });
              console.log(timestamp, "Error query SQL :" + err);

            } else {

              res.status(200).send({
                success: true,
                message: 'Berhasil membuat akun :)',
                results
              });

              addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'addAccount')
              console.log(timestamp + `Admin create account ${userID} success`);
            }
          }
        );

      } else
        if (user_idAlreadyExist > 0 && uidAlreadyExist > 0) {
          res.status(200).send({
            success: false,
            message: `user_id ${userID} and uid '${uid}' already exist. Please try another user_id and uid`,

          });
          console.log(`user_id ${userID} and uid '${uid}' already exist. Please try another user_id and uid`)


        } else
          if (uidAlreadyExist > 0) {
            res.status(200).send({
              success: false,
              message: `uid ${uid} already exist. Please try another user_id `,

            });
            console.log(`uid ${uid} already exist. Please try another user_id `)


          } else
            if (user_idAlreadyExist > 0) {
              res.status(200).send({
                success: false,
                message: `user_id ${userID} already exist. Please try another user_id`,

              });
              console.log(`user_id ${userID} already exist. Please try another user_id`)


            }


    } else {
      res.status(401).send({
        message: 'Unauthorized',
        success: false
      });
      console.log(timestamp + "!!!_UNAUTHORIZED_!!! Admin Create Account by : " + req.dataToken.uid);
    }

  }
  , editAccount: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {


      let {
        userID,
        type_id,
        employee_id,
        firstname,
        lastname,
        uid,
        email,
        telp
      } = req.body;

      let query = ` 
      UPDATE 
        sys_user 
      SET 
        firstname = '${firstname}', 
        lastname ='${lastname}', 
        uid = '${uid}', 
        type_id = ${type_id}
      WHERE user_id = ${userID};

      UPDATE 
        mst_employee 
      SET 
        email = '${email}', 
        appl_phone_nr = '${telp}'
      WHERE employee_id = ${employee_id};

      UPDATE 
        person 
      SET 
        firstname = '${firstname}', 
        lastname = '${lastname}' 
      WHERE person_id = ${employee_id};

              `
      dbConf.query(query, (err, results) => {

        if (err) {

          res.status(500).send({
            success: false,
            message: 'Gagal edit akun :( gatau kenapa'
          });
          console.log(timestamp, "Error query SQL :" + err);

        } else {

          res.status(200).send({
            success: true,
            message: 'Berhasil edit akun :)',
            results
          });
          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'editAccount')
          console.log(timestamp + `Admin Edit Account Data ${userID} success`);
        }
      }
      );




    } else {
      res.status(401).send({
        message: 'Unauthorized',
        success: false
      });
      console.log(timestamp + "!!!_UNAUTHORIZED_!!! Admin Create Account by : " + req.dataToken.uid);
    }

  }
  , findAccount: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
    // timestamp + 

    let { company_id } = req.body;

    dbConf.query(
      `SELECT su.user_id, su.uid, su.pswd, su.asin FROM sys_user su WHERE su.company_id = ${company_id};`
    ),
      (err, results) => {
        if (err) {
          res.status(500).send(err);
        }
        res.status(200).send(results);
      };
  }
  , getAccount: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    try {
      if (req.dataToken.type_id = 9) {



        dbConf.query(
          `SELECT 
          su.user_id, 
          su.uid, 
          mco.country_desc ,
          su.active
          FROM sys_user su 
          LEFT JOIN mst_company mc ON mc.company_id = su.company_id  
          LEFT JOIN mst_country mco ON mco.country_id = mc.country_id 
          WHERE su.type_id BETWEEN 3 AND 4 
          ORDER BY su.company_id ;`
          ,
          (err, results) => {
            if (err) {
              res.status(500).send(err);
              console.log(timestamp + "XXX Failed => Admin Get User Account by : " + req.dataToken.uid)
            } else {
              res.status(200).send({
                message: 'berhasil query data',
                results
              });
              console.log(timestamp + "Admin Get User Account by : " + req.dataToken.uid + " success")
            }
          })

      } else {
        res.status(401).send({
          message: 'Unauthorized',
          results
        });
        console.log(timestamp + "!!!_UNAUTHORIZED_!!! Admin Get User Account by : " + req.dataToken.uid + " success");
      }
    } catch (error) {
      res.status(200).send({
        message: 'berhasil query data',
        results
      });
      console.log(timestamp + "Admin Get User Account by : " + req.dataToken.uid + " success")
    }


  }
  , getAccountDetail: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      dbConf.query(
        `SELECT
	su.user_id,
	su.company_id,
	mc.company_name,
	mco.country_desc ,
	su.firstname,
	su.lastname,
	su.uid,
	su.type_id,
	mut.user_desc,
	su.active,
	me.email,
	me.appl_phone_nr ,
	p.person_notice,
	DATE_FORMAT(su.registration_date , '%Y-%m-%d  %T') registration_date,
	DATE_FORMAT(su.creation_date, '%Y-%m-%d  %T') creation_date,
	DATE_FORMAT(su.last_login_date, '%Y-%m-%d  %T') last_login_date,
	DATE_FORMAT(su.last_pswd_changed , '%Y-%m-%d  %T') last_pswd_changed
FROM
	sys_user su
LEFT JOIN mst_company mc ON
	mc.company_id = su.company_id
LEFT JOIN mst_country mco ON
	mco.country_id = mc.country_id
LEFT JOIN m_user_type mut ON
	mut.type_id = su.type_id
LEFT JOIN mst_employee me ON
	su.user_id = me.employee_id
LEFT JOIN person p ON
	su.employee_id = p.person_id
WHERE
	su.type_id BETWEEN 3 AND 4
	AND su.user_id = ${req.body.user_id};`
        ,
        (err, results) => {
          if (err) {
            res.status(500).send({
              message: 'gatal query data',
              success: false,
              err
            });
            console.log(timestamp + "XXX Failed => Admin Get Account Detail by : " + req.dataToken.uid + '->' + err)
          } else {
            res.status(200).send({
              message: 'berhasil query data',
              success: true,
              results
            });
            console.log(timestamp + "Admin Get Account Detail by : " + req.dataToken.uid + " success")
          }
        })

    } else {
      res.status(401).send({
        message: 'Unauthorized',
        success: false
      });
      console.log(timestamp + "!!!_UNAUTHORIZED_!!! Admin Get User Account by : " + req.dataToken.uid + " success");
    }


  }
  , changeActive: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      let username = (await dbQuery(`SELECT uid FROM sys_user WHERE user_id =  ${req.body.user_id};`))[0].uid

      let query = `UPDATE sys_user SET active = ${req.body.changed_active} WHERE user_id = ${req.body.user_id};`
      dbConf.query(
        query
        ,
        (err, results) => {
          if (err) {

            res.status(500).send({
              message: 'berhasil ubah status akun',
              success: false,
              results
            });

            console.log(timestamp + "XXX Failed => Admin Patch Active by : " + req.dataToken.uid + err)

          } else {

            res.status(200).send({
              message: `berhasil ubah status akun "${username}" menjadi ${req.body.changed_active == 2 ? 'suspended' : req.body.changed_active == 0 ? 'tidak aktif' : 'aktif'}`,
              success: true,
              results,
            });

            addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'changeActive')
            console.log(`${timestamp}Admin Active for ${username} by: ${req.dataToken.uid} success`)
          }
        })

    } else {
      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_UNAUTHORIZED_!!! Admin Patch Active by : " + req.dataToken.uid);
    }

  }
  , getConfig: async (req, res) => {

    //20240222: ganti query 

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      dbConf.query(
        `
	  SELECT
        mconf.id config_id,
        mconf.company_id,
        mc2.company_name,
        mc.id condition_id,
        mconf.value,
        mc.condition_name,
        mc.description	
      FROM
        m_config_new mconf
      LEFT JOIN mst_condition mc ON
        mconf.conditions = mc.id
      LEFT JOIN mst_company mc2 ON 
        mconf.company_id = mc2.company_id  
      ORDER BY
        mconf.id  `, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE Admin Get Config by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil get datastatus',
            success: true,
            results
          });
          console.log(timestamp + "Admin Get Config by : " + req.dataToken.uid)
        }
      }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Config by : " + req.dataToken.uid + 'success')
    }
  }
  , addConfig: async (req, res) => {

    //20240223: ganti query

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      let { company_id, user_id, conditions, value } = req.body

      let query = `INSERT INTO m_config_new
      (company_id, user_id, conditions, value, active)
      VALUES
      (${company_id},${user_id}, ${conditions}, '${value}', 1)`;

      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE Admin add Config by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil menambah data config!',
            success: true,
            results
          });

          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'addConfig')
          console.log(timestamp + "Admin addConfig by : " + req.dataToken.uid + 'success')
        }
      }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin add Config by : " + req.dataToken.uid)
    }
  }
  , editConfig: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    //20240222: ganti query

    let {
      config_id, conditions, value, active
    } = req.body

    if (req.dataToken.type_id = 9) {

      let query = `
      UPDATE 
        m_config_new 
      SET 
        conditions = ${conditions},
        value = '${value}',
        active = ${active}
      WHERE id = ${config_id}; 
      `;

      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE edit Get Config by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil get data status',
            success: true,
            results
          });
          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'editConfig')
          console.log(timestamp + "Admin edit Config by : " + req.dataToken.uid + 'success')
        }
      })
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });

      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Config by : " + req.dataToken.uid + 'success')
    }
  }
  , deleteConfig: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    //20240222: ganti query
    let config_id = req.params.id;


    if (req.dataToken.type_id = 9) {

      let query = ` DELETE FROM m_config_new WHERE id = ${config_id} `

      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE edit Get Config by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil get data status',
            success: true,
            results
          });
          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'deleteConfig')
          console.log(timestamp + "Admin edit Config by : " + req.dataToken.uid + 'success')
        }
      }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Config by : " + req.dataToken.uid + 'success')
    }
  }
  , editConfigUser_id: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let {
      max_sku,
      pallet,
      user_id,
    } = req.body

    if (req.dataToken.type_id = 9) {

      let query = `UPDATE m_config 
      SET 
      max_sku = ${max_sku},
      pallet = ${pallet}
      WHERE user_id = ${user_id} ; `

      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE edit Get Config by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil get data status',
            success: true,
            results
          });

          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'editConfigUser_id')
          console.log(timestamp + "Admin edit Config by : " + req.dataToken.uid + 'success')
        }
      }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Config by : " + req.dataToken.uid + 'success')
    }
  }
  , editConfigCompany_id: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let {
      max_sku,
      pallet,
      company_id,
    } = req.body

    if (req.dataToken.type_id = 9) {

      let query = `UPDATE m_config 
      SET 
      max_sku = ${max_sku},
      pallet = ${pallet}
      WHERE company_id = ${company_id} ; `

      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE edit Get Config by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil get data status',
            success: true,
            results
          });

          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'editConfigCompany_id')
          console.log(timestamp + "Admin edit Config by : " + req.dataToken.uid + 'success')
        }
      }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Config by : " + req.dataToken.uid + 'success')
    }
  }
  , addBanner: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      let img_url = !req.files[0] ? '' : `/banner/${req.files[0].filename}`;
      // let { company_id, starting_date, ending_date, caption_remarks, admin_remarks } = req.body;
      let form = JSON.parse(req.body.data)

      // company_id adalah company_id dari target promosi . 
      let query = `INSERT INTO m_banner
      (company_id, created_by, created_date, starting_date, ending_date, 
        img_url, caption_remarks, admin_remarks
      )
      VALUES
      (${form.company_id}, ${req.dataToken.user_id}, now(), '${form.starting_date}', '${form.ending_date}', 
      '${img_url}', '${form.caption_remarks}', '${form.admin_remarks}' )`;


      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + "XXXX FAILURE Admin add banner by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil menambah banner !',
            success: true,
            results
          });

          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'addBanner');
          console.log(timestamp + "Admin add banner by : " + req.dataToken.uid + 'success');
        }
      }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin add Config by : " + req.dataToken.uid)
    }
  }
  , getBanner: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      let query = `
    SELECT
      mc.company_name,
      su.uid,
      mb.id,
      mb.company_id,
      DATE_FORMAT(mb.created_date , '%Y-%m-%d  %T') created_date,
      DATE_FORMAT(mb.starting_date , '%Y-%m-%d  %T') starting_date,
      DATE_FORMAT(mb.ending_date  , '%Y-%m-%d  %T') ending_date,
      mb.img_url,
      mb.caption_remarks,
      mb.admin_remarks
    FROM
      m_banner mb
    LEFT JOIN mst_company mc ON
      mc.company_id = mb.company_id
    LEFT JOIN sys_user su ON
      su.user_id = mb.created_by
    ORDER BY
      mb.created_date ;`

      dbConf.query(query
        , (err, results) => {

          if (err) {
            res.status(500).send({
              message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
              success: false,
              results
            });
            console.log(timestamp + " XXXX FAILURE Admin Get Banner by : " + req.dataToken.uid + ' fail:' + err)

          } else {
            //success
            res.status(200).send({
              message: 'berhasil get data status',
              success: true,
              results
            });
            console.log(timestamp + "Admin Get Banner by : " + req.dataToken.uid + ' success')
          }
        }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get banner by : " + req.dataToken.uid)
    }
  }
  , editBanner: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let { banner_id, company_id, starting_date, ending_date, img_url, caption_remarks, admin_remarks } = req.body

    if (req.dataToken.type_id = 9) {

      let query = `
    UPDATE
      m_banner  
    SET
      company_id  = ${company_id}, 
      starting_date = ${starting_date},
      ending_date = ${ending_date},
      img_url = ${img_url},
      caption_remarks = ${caption_remarks},
      admin_remarks = ${admin_remarks}
    WHERE
      id = ${banner_id}`

      dbConf.query(query
        , (err, results) => {

          if (err) {
            res.status(500).send({
              message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
              success: false,
              results
            });
            console.log(timestamp + " XXXX FAILURE Admin Get Banner by : " + req.dataToken.uid + ' fail:' + err)

          } else {
            //success
            res.status(200).send({
              message: 'berhasil get data status',
              success: true,
              results
            });
            addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'editBanner');
            console.log(timestamp + "Admin Get Banner by : " + req.dataToken.uid + ' success')
          }
        }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get banner by : " + req.dataToken.uid)
    }
  }
  , deleteBanner: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {


      let query = `DELETE FROM m_banner WHERE id =${req.body.id} `;

      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE Admin Delete Banner by : " + req.dataToken.uid + ' Message:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil get data status',
            success: true,
            results
          });
          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'addBanner');
          console.log(timestamp + "Admin Delete Banner by : " + req.dataToken.uid + ' success')
        }
      })

    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Delete Banner by : " + req.dataToken.uid)
    }
  }
  , getFeedback: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      dbConf.query(
        // `SELECT 
        // mf.*, su.uid, mc.company_name
        // FROM m_feedback mf 
        // LEFT JOIN sys_user su ON su.user_id = mf.user_id 
        // LEFT JOIN mst_company mc ON mc.company_id = mf.company_id 
        // `
        `
        SELECT 
        mf.id, mf.company_id, mf.user_id , mf.title , mf.feedback, DATE_FORMAT(mf.created_date,'%Y-%m-%d  %T') creted_date , mf.img_url, su.uid, mc.company_name
        FROM m_feedback mf 
        LEFT JOIN sys_user su ON su.user_id = mf.user_id 
        LEFT JOIN mst_company mc ON mc.company_id = mf.company_id;
        `
        , (err, results) => {

          if (err) {
            res.status(500).send({
              message: 'Terjadi kesalahan, tapi bukan salah kamu :( ',
              success: false,
              results
            });

            console.log(timestamp + " XXXX FAILURE Admin Get Feedback by : " + req.dataToken.uid + 'fail:' + err)

          } else {
            //success
            res.status(200).send({
              message: 'berhasil get data status',
              success: true,
              results
            });
            console.log(timestamp + "Admin Get Feedback by : " + req.dataToken.uid + 'success')
          }
        }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Feedback by : " + req.dataToken.uid + 'success')
    }
  }
  , getRequestDataChange: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      dbConf.query(
        `SELECT 
        mrdc.*, su.uid, mc.company_name, mos.status_order, mos.notes
        FROM m_request_data_change mrdc 
        LEFT JOIN sys_user su ON su.user_id = mrdc.user_id 
        LEFT JOIN mst_company mc ON mc.company_id = mrdc.company_id
        LEFT JOIN m_order_status mos ON mrdc.is_approved = mos.id   `
        , (err, results) => {

          if (err) {
            res.status(500).send({
              message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
              success: false,
              results
            });
            console.log(timestamp + " XXXX FAILURE Admin Get Request Data Change by : " + req.dataToken.uid + 'fail:' + err)

          } else {
            //success
            res.status(200).send({
              message: 'berhasil get data status',
              success: true,
              results
            });
            console.log(timestamp + "Admin Get Request Data Change by : " + req.dataToken.uid + ' success')
          }
        }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Request Data Change by : " + req.dataToken.uid)
    }
  }
  , updateStatusRequestDataChange: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.uid) {

      let request_id = req.data.request_id
      let is_approved = req.data.is_approved

      let query = `UPDATE m_request_data_change SET is_approved = ${is_approved} WHERE id = ${request_id};  `


      dbConf.query(query, (err, results) => {

        if (err) {
          res.status(500).send({
            message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
            success: false,
            results
          });
          console.log(timestamp + " XXXX FAILURE Admin updateStatusRequestDataChange by : " + req.dataToken.uid + 'fail:' + err)

        } else {
          //success
          res.status(200).send({
            message: 'berhasil get data status',
            success: true,
            results
          });


          addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'updateStatusRequestDataChange');
          console.log(timestamp + "Admin updateStatusRequestDataChange by : " + req.dataToken.uid + ' success')
        }
      }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get Request Data Change by : " + req.dataToken.uid)
    }
  }
  , getCondition: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      dbConf.query(
        `
        SELECT * FROM mst_condition mc2 ; 
        `
        , (err, results) => {

          if (err) {
            res.status(500).send({
              message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
              success: false,
              results
            });
            console.log(timestamp + " XXXX FAILURE Admin getCondition by : " + req.dataToken.uid + 'fail:' + err)

          } else {
            //success
            res.status(200).send({
              message: 'berhasil get data status',
              success: true,
              results
            });
            console.log(timestamp + "Admin getCondition by : " + req.dataToken.uid + ' success')
          }
        }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get getCondition by : " + req.dataToken.uid)
    }
  }
  , getCompany: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      dbConf.query(
        `
        SELECT mc.company_id, mc.company_name  FROM mst_company mc WHERE company_type_id = 2 ORDER BY mc.company_name ;
        `
        , (err, results) => {

          if (err) {
            res.status(500).send({
              message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
              success: false,
              results
            });
            console.log(timestamp + " XXXX FAILURE Admin getCompany by : " + req.dataToken.uid + 'fail:' + err)

          } else {
            //success
            res.status(200).send({
              message: 'berhasil get data status',
              success: true,
              results
            });
            console.log(timestamp + "Admin getCompany by : " + req.dataToken.uid + ' success')
          }
        }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get getCompany by : " + req.dataToken.uid)
    }
  }
  , getTOP: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      dbConf.query(

        'SELECT 0 id , "" `DESC` union SELECT id, `DESC` FROM mst_top_foreign_code mtfc WHERE company_id = 100 AND active = 1;', (err, results) => {

          if (err) {
            res.status(500).send({
              message: 'Terjadi kesalahan, tapi bukan salah kamu :(',
              success: false,
              results
            });
            console.log(timestamp + " XXXX FAILURE Admin getTOP by : " + req.dataToken.uid + 'fail:' + err)

          } else {
            //success
            res.status(200).send({
              message: 'berhasil get data status',
              success: true,
              results
            });
            console.log(timestamp + "Admin getTOP by : " + req.dataToken.uid + ' success')
          }

        }
      )
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get getTOP by : " + req.dataToken.uid)
    }
  }
  , getAudit: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      let query = 'SELECT DATE_FORMAT(al.time_event , "%Y-%m-%d  %T") time_event, su.uid, al.user_id, al.function_name, al.message, al.sql_code FROM `e-order_iod`.action_logger al LEFT JOIN `iod`.sys_user su ON al.user_id = su.user_id ORDER BY al.time_event DESC;'

      let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
      let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      dbConf.query(query, (err, results) => {

        if (err) {

          let packet = []
          let totalDataLength = 0
          let totalPage = 0

          res.status(500).send({ packet, totalPage, totalDataLength, page });
          console.log(timestamp + " XXXX FAILURE Admin getAudit by : " + req.dataToken.uid + 'fail:' + err)

        } else {

          let packet = results.slice(startIndex, endIndex)
          let totalDataLength = results.length
          let totalPage = Math.round(results.length / limit)
 
          res.status(200).send({ packet, totalPage, totalDataLength, page });
          console.log(timestamp + "Admin getAudit by : " + req.dataToken.uid + ' success')
        }

      })
    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get getAudit by : " + req.dataToken.uid)
    }
  }
};
