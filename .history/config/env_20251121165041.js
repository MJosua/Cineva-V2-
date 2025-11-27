// Helper: detect production mode
function isProduction() {
    return process.env.NODE_ENV === 'production';
}

// Helper: get local machine IP
function getLocalIP() {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (let dev in interfaces) {
        for (let details of interfaces[dev]) {
            if (details.family === "IPv4" && !details.internal) {
                return details.address;
            }
        }
    }
    return "127.0.0.1";
}

// Compute PORT
const PORT = isProduction()
    ? process.env.PORT_SSL || 443
    : process.env.DEV_PORT || 3000;

// Compute API_URL
const API_URL = isProduction()
    ? "backend.indofoodinternational.com"
    : getLocalIP();

// Export config safely (no circular dependency possible)
module.exports = {
    PORT,
    API_URL,
};
