const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

function isProduction() {
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'production';
  }
  const ip = getLocalIP();
  return ip === '10.126.106.105';
}

module.exports = {
  getLocalIP,
  isProduction,
};
