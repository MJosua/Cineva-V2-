

const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const { hashPassword } = require("../config/encrypts");

let blue = "\x1b[31m";

module.exports = {

  getContainer: async (req, res) => {

    let date = new Date();
    let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    if (req.dataToken.type_id = 9) {

      // Function to track a single B/L number
      async function trackBL(blNumber) {

        if (!type) {
          type = "CT"
        }
        const url = `https://tracking.searates.com/tracking?api_key=${apiKey}&number=${blNumber}&sealine=auto&type=${type}&force_update=false&route=true&ais=false`;

        try {
          const response = await axios.get(url);
          console.log(`🟢 [${new Date().toLocaleString()}] Tracking ${blNumber} :`, response.data.status);
          console.log("Query", url)

          return { blNumber, status: response.data.status, details: response.data }; // Store response
        } catch (error) {
          console.error(`🔴 Error tracking ${blNumber} :`, error.response ? error.response.data : error.message);
          console.log("Query", url)

          return { blNumber, status: "error", error: error.message };
        }
      }


    } else {

      res.status(401).send({
        message: 'Unauthorized',
        success: false,
        results
      });
      console.log(timestamp + "!!!_Unauthorized_!!! Admin Get getTOP by : " + req.dataToken.uid)
    }
  }
};
