const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function buildSslConfig(rootDir) {
  const { SSL_LOC, SSL_TYPE, SSL_FILE_PFX, SSL_FILE_PFX_PASSWORD } = process.env;

  if (!SSL_LOC || !SSL_TYPE || !SSL_FILE_PFX) {
    return null;
  }

  const pfxPath = path.join(rootDir, SSL_LOC, SSL_TYPE, SSL_FILE_PFX);
  if (!fs.existsSync(pfxPath)) {
    return null;
  }

  return {
    pfx: fs.readFileSync(pfxPath),
    passphrase: SSL_FILE_PFX_PASSWORD,
  };
}

function createServer(app, isProduction, rootDir) {
  const sslConfig = buildSslConfig(rootDir);
  if (isProduction && sslConfig) {
    return https.createServer(sslConfig, app);
  }
  return http.createServer(app);
}

function isHttpsServerEnabled(isProduction, rootDir) {
  return Boolean(isProduction && buildSslConfig(rootDir));
}

module.exports = {
  createServer,
  isHttpsServerEnabled,
};
