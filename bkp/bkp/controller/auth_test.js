
const { dbIndomieku, dbQueryIndomieku } = require("../config/db");
const { hashPassword, createToken } = require("../config/encrypts"); 

let yellowTerminal = "\x1b[33m";

module.exports = {
  login_test: async (req, res) => {
    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let { user_id, pswd } = req.body;

    //let kepitingrebus = hashPassword(pswd)

    //console.log("kepitingrebus", kepitingrebus)

    dbIndomieku.query(
      ` 
            SELECT u.id, u.user_id, u.username, u.role FROM user u WHERE u.user_id = BINARY '${user_id}' AND u.pswd=${dbIndomieku.escape(hashPassword(pswd))};
       `,
      async (err, results) => {
         
        if (err) {
        
          res.status(500).send(err);
          console.log(timestamp + "Error query SQL :", err);
        
        } else {
        
          let token = createToken({ ...results[0] });
          let userData = results;

          if (userData[0]) {

            res.status(200).send({
              success: true,
              userData,
              token,
              message: `Login Success, Welcome ${user_id}!`
            });

          } else {

            let userData = []
            let token = []
            res.status(200).send({
              success: false,
              userData,
              token,
              message: "Invalid username or password!"
            });

          }

          // console.log(`token from ${userID} => ${token}`)
          console.log(timestamp + `==> Auth Login ${user_id}`);

        }
      }
    );
  },
  keepLogin_test: async (req, res) => {

    let date = new Date();
    let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    try {
      if (req.dataToken.id) {
        let userID = await dbQueryIndomieku(
          `SELECT  u.id, u.user_id, u.username, u.role FROM user u  WHERE u.id= ${dbIndomieku.escape(req.dataToken.id)};`);

        let token = createToken(...userID);
        res.status(200).send(
          {
            ...userID,
            token,
            message: "Keep login success"
          }
        );
      } else {
        res.status(401).send(
          {
            ...userID,
            token,
            message: "Unauthorized"
          }
        );

      }



    } catch (error) {
      console.log(timestamp + "! Error query SQL :", error);
      res.status(500).send(error);
    }
  },
};
