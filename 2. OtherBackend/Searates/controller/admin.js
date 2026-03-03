const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const { hashPassword } = require("../config/encrypts");
const { getEOrderEmailHtml } = require('../mailer/eorder/eorder_mailer');
const { getNotifMailDeliverHtml } = require('../Utility/Notificationmailer');

let blue = "\x1b[31m";

module.exports = {

  
  previewEOrderEmail: async (req, res) => {
    try {
      const { so_id, type } = req.params;

      if (type === 'delivery') {
        const emailData = await getNotifMailDeliverHtml(so_id);
        if (emailData.error) return res.status(404).send(emailData.error);
        return res.send(emailData.html);
      }

      // type: 'distributor' or 'analyst'
      const emailData = await getEOrderEmailHtml(so_id, type);

      if (emailData.error) {
        return res.status(404).send(emailData.error);
      }

      res.send(emailData.html);

    } catch (err) {
      console.error(err);
      res.status(500).send("Error generating preview: " + err.message);
    }
  },

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

