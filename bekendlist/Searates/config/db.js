// db.js
const mysql = require("mysql2/promise");
const os = require("os");

function production() {
  function getLocalIp() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const address of addresses) {
        if (address.family === "IPv4" && !address.internal) {
          return address.address;
        }
      }
    }
    return "127.0.0.1";
  }
  return getLocalIp() === "10.126.106.105";
}

const host_config = production() ? process.env.DB_HOST : process.env.DEV_DB_HOST;
const user_config = production() ? process.env.DB_USER : process.env.DEV_DB_USER;
const password_config = production() ? process.env.DB_PASSWORD : process.env.DEV_DB_PASSWORD;

// for default online order
const dbConf = mysql.createPool({
  multipleStatements: true,
  host: host_config,
  user: user_config,
  password: password_config,
  database: "sea_rates",
});

// for E-Order mark management
const dbEOrder = mysql.createPool({
  multipleStatements: true,
  host: host_config,
  user: user_config,
  password: password_config,
  database: process.env.DB_NAME,
});

// ✅ Correct dbQuery wrapper
async function dbQuery(sql, params) {
  const [rows] = await dbConf.query(sql, params);
  return rows;
}

async function dbQueryEOrder(sql, params) {
  const [rows] = await dbEOrder.query(sql, params);
  return rows;
}

module.exports = { dbConf, dbEOrder, dbQuery, dbQueryEOrder };
