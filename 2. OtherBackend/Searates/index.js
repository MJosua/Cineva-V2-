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
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false // Important for PM2/system logs
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

let searatesInstance;

rl.on('line', async (line) => {
  const command = line.trim().toLowerCase();
  if (command === '/fetch') {
    if (searatesInstance) {
      await searatesInstance.manualTrackLimited();
    } else {
      console.log("Searates instance not initialized yet.");
    }
  } else if (command === '/limit') {
    if (searatesInstance) {
      await searatesInstance.getQuotaStatus();
    } else {
      console.log("Searates instance not initialized yet.");
    }
  } else if (command === '/range') {
    if (searatesInstance) {
      const startDate = await question("📅 Start Date (YYYY-MM-DD): ");
      const endDate = await question("📅 End Date (YYYY-MM-DD): ");
      if (startDate && endDate) {
        console.log(`🚀 Starting tracking for range: ${startDate} to ${endDate}...`);
        await searatesInstance.datetrack(startDate, endDate);
      } else {
        console.log("⚠️ Invalid date range provided.");
      }
    } else {
      console.log("Searates instance not initialized yet.");
    }
  } else if (command === '/range-count') {
    if (searatesInstance) {
      const startDate = await question("📅 Start Date (YYYY-MM-DD): ");
      const endDate = await question("📅 End Date (YYYY-MM-DD): ");
      if (startDate && endDate) {
        await searatesInstance.datetrackCount(startDate, endDate);
      } else {
        console.log("⚠️ Invalid date range provided.");
      }
    } else {
      console.log("Searates instance not initialized yet.");
    }
  } else if (command === '/force-range') {
    if (searatesInstance) {
      console.log("🛑 WARNING: This command BYPASSES daily API limits.");
      const confirmCode = await question("🔑 Enter confirmation code to proceed: ");
      if (confirmCode === 'Indofood01') {
        const startDate = await question("📅 Start Date (YYYY-MM-DD): ");
        const endDate = await question("📅 End Date (YYYY-MM-DD): ");
        if (startDate && endDate) {
          console.log(`🚀 FORCING tracking for range: ${startDate} to ${endDate} (Quota Bypass ACTIVE)...`);
          searatesInstance.toggleQuotaBypass(true);
          searatesInstance.setSilentMode(true);
          try {
            await searatesInstance.datetrack(startDate, endDate);
          } finally {
            searatesInstance.toggleQuotaBypass(false);
            searatesInstance.setSilentMode(false);
          }
        } else {
          console.log("⚠️ Invalid date range provided.");
        }
      } else {
        console.log("❌ Incorrect confirmation code. Operation cancelled.");
      }
    } else {
      console.log("Searates instance not initialized yet.");
    }
  } else if (command === '/help') {
    console.log("Available commands: \n - /fetch: Trigger manual SeaRates tracking (limit 2)\n - /limit: Check daily API quota usage\n - /range: Trigger tracking for a specific date range\n - /range-count: Count shipments in a date range without tracking\n - /force-range: Trigger tracking with QUOTA BYPASS (requires code)");
  }
});



const testingUtils = require('./testing-utils');


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
  console.log(`Searates Automation running on PORT ${PORT}`);
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



//================================ ROUTERS ================================

// CONFIGURE ROUTERS
const {
  adminRouter,
} = require("./routers");

//admin: 
App.use("/admin", adminRouter);


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

//TEST and DISPLAY APP
App.get("/", (req, res) => {
  res
    .status(200)
    .send(

      "<h1>CONNECTION BLOCKED!</h2> <br> <h2> YOU ARE NOT SUPPOSE TO ACCESS THIS SITE WITH PAGE! JANGAN LUPA TAMBAHKAN VERSIONING DI SETIAP ROUTER </h2>"
    );
});
//

//DB CONNECTION CHECK
const {
  dbConf,
} = require("./config/db");

//FOR POOLING CONNECTION
dbConf.getConnection((error, connection) => {
  if (error) {
    console.log("Error DB e-Order Connection!", error.sqlMessage);
  } else {
    console.log(`DB e-Order has been connected ${connection.threadId}`);
  }
});


// ============================ Automation job =========================
/*
  TULIS function yang akan dijalankan secara otomatis di sini.
  Jangan lupa dideklarasikan
*/
const {
  Searates
} = require('./automation');
const { error } = require("console");

searatesInstance = Searates.runCheck();
// notification.callInsertSO();
