const express = require('express');
const bearerToken = require('express-bearer-token');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');

const { applySecurity } = require('./security');

const authController = require('../controller/OnlineOrder/auth');
const sseManager = require('../core/sse-manager');

function configureSessions(App, dbHots, useSecureCookies) {
  const MySQLStore = require('express-mysql-session')(session);
  const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
    charset: 'utf8mb4_bin',
    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data'
      }
    }
  }, dbHots);

  App.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'SECRET',
      store: sessionStore,
      cookie: {
        maxAge: 86400000,
        secure: useSecureCookies,
        httpOnly: true,
      },
    })
  );
}

function attachCoreMiddlewares(App, { isProduction, dbHots, useSecureCookies }) {
  applySecurity(App, { isProduction });

  App.use(express.json({ limit: '50mb' }));
  App.use(bearerToken());
  App.use(cookieParser());

  App.use((req, res, next) => {
    if (req.url.includes('battery-status')) {
      console.log(`🔍 [TRAFFIC] Battery sync hitting: ${req.method} ${req.url}`);
      if (req.url === '/api/rooms/battery-status' && req.method === 'POST') {
        console.log('🎯 [TRAFFIC-DEBUG] Direct hit on target path detected at root level.');
      }
    }
    next();
  });

  App.get('/api/health-check', (req, res) => {
    res.json({ success: true, message: 'API is reachable', time: new Date().toISOString() });
  });

  const mbrooms = require('../routers/meetingbook/rooms');
  const mbbookings = require('../routers/meetingbook/bookings');
  App.use('/api/rooms', mbrooms);
  App.use('/api/bookings', mbbookings);

  App.get('/auth/ping', authController.isOpenLoginPage);

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

  configureSessions(App, dbHots, useSecureCookies);
}

function setupConsoleSseBridge() {
  const logs = [];
  const originalLog = console.log;

  if (!global.consoleOverridden) {
    global.consoleOverridden = true;

    console.log = function (...args) {
      originalLog.apply(console, args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
      logs.push(msg);
      if (logs.length > 1000) logs.shift();

      if (sseManager) {
        sseManager.broadcastLog(msg);
      }
    };
  }

  global.sseManager = sseManager;
}

function createApp({ isProduction, dbHots, useSecureCookies }) {
  const App = express();
  attachCoreMiddlewares(App, { isProduction, dbHots, useSecureCookies });
  setupConsoleSseBridge();
  return App;
}

module.exports = {
  createApp,
};
