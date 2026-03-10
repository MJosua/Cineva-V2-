const cors = require('cors');
const helmet = require('helmet');

function parseAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createCorsOptions({ isProduction }) {
  const allowedOrigins = parseAllowedOrigins();

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (!isProduction && allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin is not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200,
  };
}

function applySecurity(App, { isProduction }) {
  const corsOptions = createCorsOptions({ isProduction });

  App.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  App.use(cors(corsOptions));
  App.options('*', cors(corsOptions));
}

module.exports = {
  applySecurity,
};
