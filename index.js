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
// const { Server } = require("socket.io");
const jwt = require('jsonwebtoken'); // Added for Early Auth Check
const authController = require("./controller/OnlineOrder/auth"); // Direct import to avoid circular dependency

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

// 🔥 Database Imports (Moved to top for Session Store)
const {
  dbConf,
  // dbTM, // Decommissioned
  dbIndomieku,
  dbHots,
  dbQueryHots,
  dbCardGenerator,
  dbClick
} = require("./config/db");

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
   🔥  SOCKET.IO REMOVED - MIGRATED TO SSE
   =================================================================== */
// const io = new Server(svr, { ... }); // REMOVED

/* ===================================================================
   🔥  GLOBAL MIDDLEWARE ORDER FIXED (IMPORTANT)
   =================================================================== */

// Session store using MySQL (production-safe)
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 min
  expiration: 86400000, // 24 hours
  createDatabaseTable: true,
  // connectionLimit: 1, // Handled by pool
  // endConnectionOnClose: true, // Handled by pool
  charset: 'utf8mb4_bin',
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, dbHots); // Reuse existing robust connection pool!

// 1️⃣  Security & Core Headers (MUST BE FIRST)
App.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

App.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Allow OPTIONS preflight
App.options('*', cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

// 2️⃣ Basic Parsing
App.use(express.json({ limit: '50mb' }));
App.use(bearerToken());
App.use(cookieParser());

// 🚀 PERFORMANCE BUMP: High-Speed Ping 
// Must be after CORS but BEFORE Session (Database lookup)
App.get("/auth/ping", authController.isOpenLoginPage);

// 🚀 PERFORMANCE BUMP: Early Auth Check (Prevent Ghost Delay)
// Reject expired tokens before they trigger expensive MySQL session lookups
App.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp && Date.now() >= decoded.exp * 1000) {
          return res.status(401).send({ success: false, message: 'TOKEN_EXPIRED' });
        }
      } catch (e) { }
    }
  }
  next();
});

// 3️⃣ Session Store (Heavy - ONLY reached if Token is valid or empty)
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


// 5️⃣ Public static moved to bottom block for better control


/* ===================================================================
   🔥  LOG WRAPPER (Updated for SSE)
   =================================================================== */
const logs = [];
const originalLog = console.log;

// Import sseManager early for logging
const sseManager = require('./core/sse-manager');

if (!global.consoleOverridden) {
  global.consoleOverridden = true;

  console.log = function (...args) {
    originalLog.apply(console, args);
    const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
    logs.push(msg);
    // 🔥 FIX MEMORY LEAK: Limit logs in memory to last 1000 lines
    if (logs.length > 1000) logs.shift();

    // 🚀 NEW: Broadcast via SSE to Admins only
    if (sseManager) {
      sseManager.broadcastLog(msg);
    }
  };
}

// global.io = io; // REMOVED

// io.on("connection", socket => { ... }); // REMOVED


/* ===================================================================
   🔥  ROUTERS (ORDER FIXED)
=================================================================== */

// Load all routers
const {
  authRouter,
  // authTmRouter, // Decommissioned
  cartRouter,
  userRouter,
  productRouter,
  orderRouter,
  adminRouter,
  spectatorRouter,
  // trademarkRouter, // Decommissioned
  authRouterTest,
  productRouterTest,
  cardGenerator,
  hotsAuth,
  hotsAdmin,
  hotsTicket,
  hotsSettings,
  eventRouter,
  shortener,
  debugRouter,

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
  hotsProfile,
  hotsNotification,
  cmsRouter,
  engineModuleRouter,
  engineRouter,
  engineWorkDataRouter,
  engineAssignmentRouter,
  engineReportRouter,
  workflowadminRouter,
  triggerRouter,
  couponRouter,
  sseRouter,
  eventEnginePublicRouter,
  eventEnginePrivateRouter
} = require("./routers");



/* ===================================================================
   🔥  DATABASE POOL CHECKS (kept unchanged)
=================================================================== */
// DB Imports moved to top
// const { dbConf, dbTM, dbIndomieku, dbHots, dbQueryHots, dbCardGenerator, dbClick } = require("./config/db");

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

// dbTM.getConnection((e, conn) => {
//   if (e) console.log("Error DB Trademark Connection!", e.sqlMessage);
//   else { console.log(`DB TM connected ${conn.threadId}`); checkDone(); }
// });

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
App.use("/engine", engineReportRouter);  // 🆕 Report endpoints (suggest, card-reports)
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
// App.use("/tm_card", trademarkRouter); // Decommissioned
App.use("/card_generator", cardGenerator);

App.use("/hots_auth", hotsAuth);
App.use("/hots_admin", hotsAdmin);
App.use("/hots_ticket", hotsTicket);
App.use("/hots_settings", hotsSettings);

App.use("/hots_customfunction", hotscustomfunction);
App.use("/hotsdashboard", hotsdashboard);
App.use("/hots/public", hotspublic);
App.use("/hotsreporting", hotsReporting);
App.use("/hotsprefs", hotsPreferences);
App.use("/hots_profile", hotsProfile);
App.use("/hots_notifications", hotsNotification);

App.use("/shortener", shortener);

// Debug Router
App.use("/debugRouter", debugRouter);


// Coupon System API
App.use("/api", couponRouter);

// Meeting Room Generic System
App.use("/api/rooms", mbrooms);
App.use("/api/bookings", mbbookings);

// SSE (Server-Sent Events) for real-time updates
App.use("/sse", sseRouter);

// Event Engine API (Secured)
const engineAuth = require('./middleware/engineAuth'); // Import Auth Middleware

// 1. PUBLIC (Storefront) - No Auth, but Rate Limited (TODO: Add Rate Limit)
App.use("/api/event-engine/public", eventEnginePublicRouter);

// 2. PRIVATE (Admin) - Strict Auth
App.use("/api/event-engine/admin",
  engineAuth.normalizeUser,
  engineAuth.requireUser,
  eventEnginePrivateRouter
);




// Expose SSE Manager globally for use in controllers
// Expose SSE Manager globally for use in controllers
// const sseManager = require('./core/sse-manager'); // Already required at top
global.sseManager = sseManager;

/* ===================================================================
   🔥 STATIC FILES & ASSETS
   These allow both absolute paths (/public/...) and shortcut aliases.
=================================================================== */

// 1. Primary Static Folder (Handles /public/hots/..., /public/image/..., etc.)
App.use('/public', express.static(path.join(__dirname, 'public')));

// 2. Shortcut Aliases for cleaner URLs in documents/CSS
App.use('/image', express.static(path.join(__dirname, 'public', 'image')));
App.use('/files', express.static(path.join(__dirname, 'public', 'files')));
App.use('/aset', express.static(path.join(__dirname, 'public', 'aset')));
App.use('/ttd', express.static(path.join(__dirname, 'public', 'ttd')));

// 3. System Specific Shortcuts
App.use('/hots/profile', express.static(path.join(__dirname, 'public', 'hots', 'profile')));
App.use('/public/files/hots/it_support', express.static(path.join(__dirname, 'public', 'files', 'hots', 'it_support')));
App.use('/public/hots/generateddocuments', express.static(path.join(__dirname, 'public', 'hots', 'generateddocuments')));


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

  // 🔥 Start Testing CLI
  try {
    const { startCLI } = require('./script/testing-utils');
    startCLI(App);
  } catch (e) {
    console.log('Testing CLI not loaded:', e.message);
  }
});



/* ===================================================================
   🔥 AUTOMATION (unchanged)
=================================================================== */
const {
  // trademarkMgmtAuto, // Decommissioned
  notification,
  cleanup,
  automatemb,
} = require('./service/automation');

// trademarkMgmtAuto.runCheck(); // Decommissioned
notification.shippingMailNotification();
cleanup.cleanupOrphan();

/* ===================================================================
   🔥 Root Page
=================================================================== */
App.get("/", (req, res) => {
  res.status(200).send("<h1>CONNECTION BLOCKED!</h2><br><h2>YOU ARE NOT SUPPOSE TO ACCESS THIS SITE WITH PAGE!</h2>");
});
