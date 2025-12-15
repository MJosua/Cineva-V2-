// BISMILAHIROHMANNIROHIM
const readline = require('readline');

/**
 * IOD INTEGRATED API
 * (Header kept unchanged)
 */

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const App = express();
const { Server } = require("socket.io");

const bearerToken = require("express-bearer-token");
const helmet = require("helmet");
const cookieParser = require('cookie-parser');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require("cors");
const session = require("express-session");
const os = require('os');
const { PORT, API_URL } = require("./config/env")

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { initAll } = require('./core/init-engines'); // path as placed above
/* ===================================================================
   🔥  UTILITY: GET LOCAL LAN IP
=================================================================== */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

/* ===================================================================
   🔥  ENV-BASED URL CONFIG
=================================================================== */
function production() {
  const ip = getLocalIP();
  return ip === "10.126.106.105"; // your logic preserved
}



/* ===================================================================
   🔥  SSL CONFIG
=================================================================== */
const SSL = {
  pfx: fs.readFileSync(path.join(__dirname, process.env.SSL_LOC, process.env.SSL_TYPE, process.env.SSL_FILE_PFX)),
  passphrase: process.env.SSL_FILE_PFX_PASSWORD
};

// Create server (SSL or HTTP)
let svr = production()
  ? https.createServer(SSL, App)
  : http.createServer(App);

console.log("Server status is Production?", production());

/* ===================================================================
   🔥  SOCKET.IO CONFIG
=================================================================== */
const io = new Server(svr, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins dynamically (works with credentials)
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

/* ===================================================================
   🔥  GLOBAL MIDDLEWARE ORDER FIXED (IMPORTANT)
=================================================================== */

// Session store using MySQL (production-safe)
const MySQLStore = require('express-mysql-session')(session);
const sessionStoreOptions = {
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_HT,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 min
  expiration: 86400000, // 24 hours
  createDatabaseTable: true,
  connectionLimit: 1,
  endConnectionOnClose: true,
  charset: 'utf8mb4_bin',
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
};
const sessionStore = new MySQLStore(sessionStoreOptions);

// 1️⃣ MUST come FIRST — session + security
App.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "SECRET",
    store: sessionStore,
    cookie: {
      maxAge: 86400000, // 24 hours
      secure: production(),
      httpOnly: true
    }
  })
);

// 2️⃣ CORS FIRST — allow headers before anything else
App.use(cors({
  origin: (origin, callback) => {
    // Allow all origins dynamically (required for credentials)
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}));

// Allow OPTIONS preflight — required for CMS admin POST
App.options('*', cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

// 3️⃣ JSON + Token before routers
App.use(express.json({ limit: '10mb' }));
App.use(bearerToken());
App.use(cookieParser());

// 4️⃣ Helmet AFTER cors
App.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 5️⃣ Public static AFTER CMS so CMS catches routes
App.use('/public', express.static(path.join(__dirname, 'public')));

/* ===================================================================
   🔥  SOCKET — LOG WRAPPER
=================================================================== */
const logs = [];
const originalLog = console.log;

if (!global.consoleOverridden) {
  global.consoleOverridden = true;

  console.log = function (...args) {
    originalLog.apply(console, args);
    const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
    logs.push(msg);
    io.emit("new_log", msg);
  };
}

global.io = io;

io.on("connection", socket => {
  socket.emit("logs", logs);

  // Relay messages for chat/updates
  socket.on("message", (data) => {
    io.emit("message", data);
  });
});


/* ===================================================================
   🔥  ROUTERS (ORDER FIXED)
=================================================================== */

// Load all routers
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
  hotsTps,
  srtsRouter,
  projectmngr,
  taskmngr,
  hotscustomfunction,
  kanbanmngr,
  ganttmngr,
  approvalmngr,
  departmentmngr,
  teammngr,
  taskstepsmngr,
  pmdashboard,
  usermngr,
  rolemngr,
  timetrackingmngr,
  notificationmngr,
  projecttemplatemngr,
  projectcommentmngr,
  mbbookings,
  mbdayColors,
  mbrooms,
  mbsettings,
  mbtimeslots,
  mbusers,
  hotsdashboard,
  hotspublic,
  hotsReporting,
  hotsPreferences,
  cmsRouter,
  engineModuleRouter,
  engineRouter,
  engineWorkDataRouter,
  engineAssignmentRouter,
  workflowadminRouter,
  triggerRouter,
  couponRouter
} = require("./routers");



/* ===================================================================
   🔥  DATABASE POOL CHECKS (kept unchanged)
=================================================================== */
const {
  dbConf,
  dbTM,
  dbIndomieku,
  dbHots,
  dbQueryHots,
  dbCardGenerator,
  dbClick
} = require("./config/db");

let totalConnections = 5;
let doneConnections = 0;

function checkDone() {
  doneConnections++;
  if (doneConnections === totalConnections) {
    console.log("✅ All database connections are established!");
    console.log("=============================================================");
  }
}

dbConf.getConnection((e, conn) => {
  if (e) console.log("Error DB e-Order Connection!", e.sqlMessage);
  else { console.log(`DB e-Order connected ${conn.threadId}`); checkDone(); }
});

dbTM.getConnection((e, conn) => {
  if (e) console.log("Error DB Trademark Connection!", e.sqlMessage);
  else { console.log(`DB TM connected ${conn.threadId}`); checkDone(); }
});

dbCardGenerator.getConnection((e, conn) => {
  if (e) console.log("Error DB CardGen Connection!", e.sqlMessage);
  else { console.log(`DB CardGen connected ${conn.threadId}`); checkDone(); }
});

dbHots.getConnection((e, conn) => {
  if (e) console.log("Error DB HOTS Connection!", e.sqlMessage);
  else { console.log(`DB HOTS connected ${conn.threadId}`); checkDone(); }
});

dbClick.getConnection((e, conn) => {
  if (e) console.log("Error DB Click Connection!", e.sqlMessage);
  else { console.log(`DB Click connected ${conn.threadId}`); checkDone(); }
});

/* -------------------------------------------------------------------
   🔥 async function start() { for engine }
------------------------------------------------------------------- */

(async () => {
  try {
    console.log("🔥 Initializing HOTS Engine...");
    await initAll(dbQueryHots, dbHots);
    console.log("✅ HOTS Engine Initialized!");
  } catch (e) {
    console.error("❌ Failed to initialize HOTS Engine:", e);
    process.exit(1);
  }
})();

/* -------------------------------------------------------------------
   🔥 IMPORTANT: CMS FIRST BEFORE STATIC + OTHER ROUTERS
------------------------------------------------------------------- */
console.log("[INIT] Mounting CMS router...");
App.use('/cms', cmsRouter);

/* -------------------------------------------------------------------
   🔥 ENGINE ROUTER
------------------------------------------------------------------- */
App.use("/engine", engineRouter);
App.use("/engine", engineWorkDataRouter);
App.use("/engine", engineAssignmentRouter);
App.use("/workflow-engine", workflowadminRouter);
App.use("/triggers", triggerRouter);
/* -------------------------------------------------------------------
   🔥 NORMAL ROUTERS (kept exact order as yours)
------------------------------------------------------------------- */
App.use("/auth", authRouter);
App.use("/pm/project", projectmngr);
App.use("/pm/kanban", kanbanmngr);
App.use("/pm/gantt", ganttmngr);
App.use("/pm/approval", approvalmngr);
App.use("/pm/department", departmentmngr);
App.use("/pm/team", teammngr);
App.use("/pm/task", taskmngr);
App.use("/pm/task-steps", taskstepsmngr);
App.use("/pm/dashboard", pmdashboard);
App.use("/pm/user", usermngr);
App.use("/pm/role", rolemngr);
App.use("/pm/time-tracking", timetrackingmngr);
App.use("/pm/notification", notificationmngr);
App.use("/pm/project-templates", projecttemplatemngr);
App.use("/pm/project-comments", projectcommentmngr);

App.use("/cart", cartRouter);
App.use("/user", userRouter);
App.use("/product", productRouter);
App.use("/order", orderRouter);

App.use("/searates", srtsRouter);
App.use("/event", eventRouter);

App.use("/admin", adminRouter);
App.use("/spectator", spectatorRouter);
App.use("/tm_card", trademarkRouter);
App.use("/card_generator", cardGenerator);

App.use("/hots_auth", hotsAuth);
App.use("/hots_admin", hotsAdmin);
App.use("/hots_ticket", hotsTicket);
App.use("/hots_settings", hotsSettings);
App.use("/hots_Tps", hotsTps);
App.use("/hots_customfunction", hotscustomfunction);
App.use("/hotsdashboard", hotsdashboard);
App.use("/hots/public", hotspublic);
App.use("/hotsreporting", hotsReporting);
App.use("/hotsprefs", hotsPreferences);

App.use("/shortener", shortener);

// Coupon System API
App.use("/api", couponRouter);

/* ===================================================================
   🔥 STATIC FILES (Placed AFTER routers)
=================================================================== */
App.use('/public/files/hots/it_support', express.static(path.join(__dirname, 'public', 'files', 'hots', 'it_support')));
App.use('/public/hots/generateddocuments', express.static(path.join(__dirname, 'public', 'hots', 'generateddocuments')));
App.use('/image', express.static(path.join(__dirname, 'public', 'image')));
App.use('/files', express.static(path.join(__dirname, 'public', 'files')));

/* ===================================================================
   🔥 404 HANDLER — MUST BE LAST
=================================================================== */
App.use('*', (req, res) => {
  res.status(404).send('Not Found');
});

/* ===================================================================
   🔥  START SERVER
=================================================================== */
svr.listen(PORT, () => {
  console.log(`INTEGRATED API SSL Server running on port ${PORT}`);
});



/* ===================================================================
   🔥 AUTOMATION (unchanged)
=================================================================== */
const {
  trademarkMgmtAuto,
  notification,
  cleanup,
  automatemb,
} = require('./service/automation');

trademarkMgmtAuto.runCheck();
notification.shippingMailNotification();
cleanup.cleanupOrphan();

/* ===================================================================
   🔥 Root Page
=================================================================== */
App.get("/", (req, res) => {
  res.status(200).send("<h1>CONNECTION BLOCKED!</h2><br><h2>YOU ARE NOT SUPPOSE TO ACCESS THIS SITE WITH PAGE!</h2>");
});
