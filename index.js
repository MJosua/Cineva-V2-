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

// const greenColor = '\x1b[32m'; // Green
// const blueColor = '\x1b[34m'; // Blue
// const redColor = '\x1b[31m'; // Red
// const yellowColor = '\x1b[33m'; // Yellow
// const purpleColor = '\x1b[35m'; // Purple
// const reset = '\\x1b[0m';

const express = require("express");
const App = express();

const { Server } = require("socket.io")


const bearerToken = require("express-bearer-token");
const helmet = require("helmet");
const cookieParser = require('cookie-parser');
// API CONFIG FOR SERVER 104 (i2i join)
const https = require('https');

const http = require('http');

const fs = require('fs');
const path = require('path');

const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");

const session = require("express-session");

const os = require('os');

//for production

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Indofood API',
      version: '1.0.0',
      description: 'A simple API to manage resources',
    },
  },
  // Path to the API docs
  apis: ['./controllers/*.js', './routers/*.js'], // Points to your route files where API is defined
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/*




let svr;

if (process.env.PORT === '9999') {
  try {
    // Load SSL credentials
    const SSL_LOC = path.join(__dirname, process.env.SSL_LOC, process.env.SSL_TYPE);
    const SSL = {
      key: fs.readFileSync(path.join(SSL_LOC, process.env.SSL_FILE_KEY)),
      cert: fs.readFileSync(path.join(SSL_LOC, process.env.SSL_FILE_CERT))
    };

    svr = https.createServer(SSL, App);
    console.log('Production server running with HTTPS');
  } catch (err) {
    console.error('Error loading SSL credentials:', err.message);
    process.exit(1); // Exit if SSL files are missing or invalid
  }
} else {
  svr = http.createServer(App);
  console.log('Development server running with HTTP');
}
//production
// const svr = https.createServer(SSL, App);  

//development
// const svr = createServer(App);

// const PORT = process.env.PORT_SSL; // or any other port number you prefer
*/


//auto config


//reading SSL certification directory
const SSL = {
  key: fs.readFileSync(path.join(__dirname, process.env.SSL_LOC, process.env.SSL_TYPE, process.env.SSL_FILE_KEY)),
  cert: fs.readFileSync(path.join(__dirname, process.env.SSL_LOC, process.env.SSL_TYPE, process.env.SSL_FILE_CERT))
};

function production() {

  function getLocalIp() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address; // Return the local IP address
        }
      }
    }
  }

  if (getLocalIp() == "10.126.106.105") {
    // return "production"
    return true;
  } else {
    // return "development"
    return false;
  }


}
let svr = production() ? https.createServer(SSL, App) : http.createServer(App);
let PORT = production() ? process.env.PORT_SSL : process.env.DEV_PORT;
console.log("Server status is Production?", production())




const io = new Server(
  svr,
  {
    cors: {
      origin: "*"
    },
    connectionStateRecovery: {
      // the backup duration of the sessions and the packets
      maxDisconnectionDuration: 2 * 60 * 1000,
      // whether to skip middlewares upon successful recovery
      skipMiddlewares: true,
    }

  },


);

App.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);

App.use(cors({
  origin: '*', // Specify Ionic app's origin
  credentials: true
}));

App.use((req, res, next) => {
  res.set({
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cross-Origin-Opener-Policy': 'cross-origin', // if needed
  });
  next();
});

App.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },  // Override default policy
}));


// App.use(cors({
//   origin: 'https://www.indofoodinternational.com/', // Sesuaikan dengan URL frontend Anda
//   credentials: true // Izinkan pengiriman kredensial
// }));
// App.use(helmet());
App.use(express.json());
App.use(express.static("./public"));
App.use(bearerToken());
App.use(cookieParser());


// API CONFIG FOR SERVER 104 (i2i join deploy)

svr.listen(PORT, () => {
  console.log(`INTEGRATED API SSL Server running on port ${PORT}`);
});


io.on('connection', (socket) => {


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('message', (msg) => {
    io.emit('message', msg);
  });

  if (socket.recovered) {
    console.log("Recovery was successful: socket.id, socket.rooms, and socket.data were restored");
  } else {
  }

  socket.on('error', (err) => {
    console.error(`Socket error on ${socket.id}: ${err.message}`);
  });

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
  cardGenerator,
  hotsAuth,
  hotsAdmin,
  hotsTicket,
  hotsSettings,
  eventRouter,
  shortener,
  hotsTps
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

//additional  Indofood international
App.use("/event", eventRouter);

//admin: 
App.use("/admin", adminRouter);

//spectator:
App.use("/spectator", spectatorRouter);

//trademark:
App.use("/tm_card", trademarkRouter);

//Card Generator:
App.use("/card_generator", cardGenerator);

//hots_auth
App.use("/hots_auth", hotsAuth);

//hots_admin
App.use("/hots_admin", hotsAdmin);

//hots_ticket
App.use("/hots_ticket", hotsTicket);

//hots_settings
App.use("/hots_settings", hotsSettings);

//Shortener
App.use("/shortener", shortener);

//hots pricing structure
App.use("/hots_Tps", hotsTps);

App.use('/public', express.static(path.join(__dirname, 'public')));
App.use(express.static(path.join(__dirname, 'public')));


App.use('/public/files/hots/it_support', express.static(path.join(__dirname, 'public', 'files', 'hots', 'it_support')));

App.get('/public/files/hots/it_support/:imageId', (req, res) => {
  const imageId = req.params.imageId;
  const imagePath = path.join(__dirname, 'public', 'files', 'hots', 'it_support', imageId);

  // Set the required headers
  res.set({
    'Content-Type': 'image/jpeg',  // Adjust based on image type (png, gif, etc.)
    'Cross-Origin-Resource-Policy': 'cross-origin',  // Allow sharing across origins
  });

  // Send the image file
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error('Error serving image:', err);
      res.status(404).send('Image not found');
    }
  });
});

// ========= for Documentation ============

// App.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
//   customCss: `
//         .response-control-media-type {
//             display: none !important;
//         }
//     `,  // Inline CSS
// }));


// ========= for test program ============

// Auth_test: 
//App.use("/bdrtny", authRouterTest);

//Product_test: 
//App.use("/vgerbhyy", productRouterTest);


//======================================================================

//LISTEN TO THE PORT
// App.listen(PORT);
// console.log(`INTEGRATED API running at Port: ${PORT}`);

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
  dbHots,
  dbCardGenerator,
  dbClick
} = require("./config/db");

//FOR POOLING CONNECTION
dbConf.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB e-Order Connection!", error.sqlMessage);
  } else {
    console.log(`DB e-Order has been connected ${connection.threadId}`);
  }
});

dbTM.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB Trademark Management Connection!", error.sqlMessage);
  } else {
    console.log(`DB Trademark Management has been connected ${connection.threadId}`);
  }
});

dbCardGenerator.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB Card Generator Connection!", error.sqlMessage);
  } else {
    console.log(`DB Card Generator has been connected ${connection.threadId}`);
  }
});

dbHots.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB HOTS Connection!", error.sqlMessage);
  }else {
    console.log(`DB HOTS has been connected ${connection.threadId}`);
  }
 
});


dbClick.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB Click Connection!", error.sqlMessage);
  }else {
    console.log(`DB Click has been connected ${connection.threadId}`);
  }
  
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
const { error } = require("console");

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