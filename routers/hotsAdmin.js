const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../config/encrypts')
const { hotsAdmin } = require('../controller')

//get data
route.get("/account", decodeTokenHT, hotsAdmin.getAccount);
route.get("/role", decodeTokenHT, hotsAdmin.getRole);
route.get("/department", decodeTokenHT, hotsAdmin.getDepartment);
route.get("/team", decodeTokenHT, hotsAdmin.getTeam);
route.get("/tickets", decodeTokenHT, hotsAdmin.getAllTicket);
//Get Workflow
route.get("/allworkflow", decodeTokenHT, hotsAdmin.getAllWorkFlow);

//buat akun
route.post("/account", decodeTokenHT, hotsAdmin.createAccount);

//edit akun
route.patch("/account/:user_id", decodeTokenHT, hotsAdmin.editAccount);

//toggle aktif-nonaktif
route.put("/active/:user_id", decodeTokenHT, hotsAdmin.changeActive);

//delete account
route.delete("/account/:user_id", decodeTokenHT, hotsAdmin.deleteAccount);







module.exports = route;