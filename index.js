// BISMILAHIROHMANNIROHIM

/**
 * IOD INTEGRATED API:
 * ADALAH API YANG MENGAKOMODASIKAN BERBAGAI WEBAPPP IOD UNTUK DIGUNAKAN SECARA BERSAMA-SAMA DAN TERINTEGRASI
 * API INI DIBAGUN BERDASARKAN API ONLINE ORDER YANG DIKEMBANGKAN UNTUK MENYEDIAKAN BERBAGAI 
 * APLIKASI YANG TERINTEGRASI DAN TIDAK TERINTEGRASI DENGAN BEBERAPA DATABASE MAUPUN BERDIRI SENDIRI
 * 
 * APLIKASI INI TIDAK DIPERKENANKAN UNTUK DIBAGIKAN MAUPUN DIGUNAKAN DALAM KEPERLUAN PENGEMBANGAN 
 * JIKA MEMERLUKAN API MAKA GUNAKAN STAND ALONE API SEBAGAI BAHAN PENGEMBANGAN. 
 * 
 * API INI DIHARAPKANN DAPAT MENJALANKAN:
 * + SATU ATAU BEBERAPA DATABASE CONNECTION
 * + MENJALANKAN BEBERAPA ENKRIPSI SEKALIGUS. 
 */

// SEBELUM KITA MEMULAI KODINGAN INI, 
// MARILAH KITA JALANI HIDUP SAMBIL MISHUH-MISUH

const express = require("express");
const App = express();
const bearerToken = require("express-bearer-token");
const helmet = require("helmet");

// API CONFIG FOR SERVER 104 (i2i join)
const https = require('https');
const fs = require('fs');
const path = require('path');

const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const session = require("express-session");

const SSL = {
  key: fs.readFileSync(path.join(__dirname, process.env.SSL_LOC, process.env.SSL_TYPE, process.env.SSL_FILE_KEY)),
  cert: fs.readFileSync(path.join(__dirname, process.env.SSL_LOC, process.env.SSL_TYPE, process.env.SSL_FILE_CERT))
};

const svr = https.createServer(SSL, App);
const PORT = process.env.PORT_SSL; // or any other port number you prefer


App.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);
App.use(cors());
App.use(helmet());
App.use(express.json());
App.use(express.static("./public"));
App.use(bearerToken());



// API CONFIG FOR SERVER 104 (i2i join deploy)

svr.listen(PORT, () => {
  console.log(`INTEGRATED API SSL Server running on port ${PORT}`);
});

// END OF API CONFIG FOR SERVER 104 (i2i join deploy)

// ==> MYSQL 1
// var connection = mysql.createConnection({ multipleStatements: true });



//================================ ROUTERS =============================

// CONFIGURE ROUTERS
const {
  authRouter,
  authTmRouter,
  cartRouter,
  userRouter,
  productRouter,
  orderRouter,
  adminRouter,
  spectatorRouter,
  trademarkRouter,
  authRouterTest,
  productRouterTest,
  cardGenerator
} = require("./routers");

// Auth: 
App.use("/auth", authRouter);

// Auth TM: 
//App.use("/auth_tm", authTmRouter);

// Cart: 
App.use("/cart", cartRouter);

// User: 
App.use("/user", userRouter);

//Product: 
App.use("/product", productRouter);

//Order: 
App.use("/order", orderRouter);

//admin: 
App.use("/admin", adminRouter);

//spectator:
App.use("/spectator", spectatorRouter);

//trademark:
App.use("/tm_card", trademarkRouter);

//Card Generator:
App.use("/card_generator", cardGenerator);

// ========= for test program ============

// Auth_test: 
//App.use("/bdrtny", authRouterTest);

//Product_test: 
//App.use("/vgerbhyy", productRouterTest);


//======================================================================

//LISTEN TO THE PORT
App.listen(process.env.PORT);
console.log(`INTEGRATED API running at Port: ${process.env.PORT}`);

//TEST and DISPLAY APP
App.get("/", (req, res) => {
  res
    .status(200)
    .send(
      "<h1>CONNECTION BLOCKED!</h2> <br> <h2> YOU ARE NOT SUPPOSE TO ACCESS THIS SITE WITH PAGE!  </h2>"
    );
});
//DB CONNECTION CHECK
const {
  dbConf,
  dbTM, 
  dbIndomieku,
  dbCardGeneratorCardGenerator,
  dbCardGenerator
} = require("./config/db");

//FOR POOLING CONNECTION
dbConf.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB e-Order Connection!", error.sqlMessage);
  }
  console.log(`DB e-Order has been connected ${connection.threadId}`);
});

dbTM.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB Trademark Management Connection!", error.sqlMessage);
  }
  console.log(`DB Trademark Management has been connected ${connection.threadId}`);
});

dbCardGenerator.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB Card Generator Connection!", error.sqlMessage);
  }
  console.log(`DB Card Generator has been connected ${connection.threadId}`);
});

/*
dbIndomieku.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB Trademark Management Connection!", error.sqlMessage);
  }
  console.log(`DB Indomieku_test Management has been connected ${connection.threadId}`);
});
*/


// ============================ Automation job =========================
/*
  TULIS function yang akan dijalankan secara otomatis di sini.
  Jangan lupa dideklarasikan
*/
const {
  trademarkMgmtAuto,
  notification
  
} = require('./automation');

trademarkMgmtAuto.runCheck(); 
notification.shippingMailNotification();
notification.callInsertSO();
 

//============================= UPDATE REGISTER =============================
/**
 * 2024-02-22 12.07:V 2.1.1- add   : menambah fitur special treatment: complete data ship to party
 * 2024-05-10 1907 :V 2.2.0- MAJOR : Integrasi dengan card genereator  
 * 2024-05-10 1907 :V 2.2.1- patch : ubah posisi otomation ke bawah index.js
 * 2024-05-10 1907 :V 2.2.2- patch : Improvement timestamp minor di cronjob
 * 2024-05-10 1907 :V 2.2.3- add   : Menambah cron job untuk call insert_so
 * 2024-05-17 1907 :V 2.2.4- add   : Menambah getOrderAllIn untuk query data
 * 2024-05-20 1334 :V 2.3.1- MAJOR : Security update menambahkan escape() dan SQL Parametering
 * 2024-05-21 1040 :V 2.3.2- patch : ganti quewry getOrderAllIn
 * 2024-05-21 1040 :V 2.3.3- add   : nambah getRealizationAllIn di contrller dan router
 * 2024-05-21 1040 :V 2.4.0- add   : menambah table event_logger di e-Order_iod* 
 * 
 * 
 * 
 * 
 * 
 */