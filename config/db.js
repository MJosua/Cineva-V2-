// //========================= LEGACY API ===============================//
// const mysql = require('mysql');

// //THE CONNECTION (API and MySQL) WILL ALWAYS OPEN
// //THIS ONLY FOR LAPTOP OR DEVELOPMENT USE
// //const dbConf = mysql.createConnection()


// //THE CONNECTION (API and MySQL) WILL OPEN WHEN THERE IS A REQUEST
// //THIS CAN BE USED ON LAPTOP OR DEVELOPMENT USE EITHER ON SERVER USE
// const dbConf = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
//     //noneedport cause its default
// })

// module.exports = { dbConf } 
//========================= API FOR IOD E-ORDER =========================//


const mysql = require('mysql2');
const util = require('util');
const os = require('os');

//server status
function production() {
    function getLocalIp() {
        const networkInterfaces = os.networkInterfaces();
        // console.log("networkInterfaces", networkInterfaces)
        for (const interfaceName in networkInterfaces) {
            const addresses = networkInterfaces[interfaceName];
            for (const address of addresses) {
                if (address.family === 'IPv4' && !address.internal) {
                    // console.log("address.address sss", address.address)
                    return address.address; // Return the local IP address
                }
            }
        }
        return '127.0.0.1'; // Fallback to localhost
    }
    if (getLocalIp() == "10.126.106.105") {
        // return "production"
        return true;
    } else {
        // return "development"
        return false;
    }
}

const host_config = production() ? process.env.DB_HOST : process.env.DEV_DB_HOST;
const user_config = production() ? process.env.DB_USER : process.env.DEV_DB_USER;
const password_config = production() ? process.env.DEV_DB_PASSWORD : process.env.DEV_DB_PASSWORD;
const db_trademark = production() ? process.env.DB_NAME_TM : process.env.DEV_DB_NAME_TM;

console.log("@db - host_config", host_config)
console.log("@db - user_config", user_config)
console.log("@db - password_config", password_config) 


// for default online order
const dbConf = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: host_config,
    user: user_config,
    password: password_config,
    database: process.env.DB_NAME
});
const dbQuery = util.promisify(dbConf.query).bind(dbConf);

// for trade mark management
const dbTM = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: host_config,
    user: user_config,
    password: password_config,
    database: process.env.db_trademark
});
const dbTMQuery = util.promisify(dbTM.query).bind(dbTM);

// for tester or test
const dbIndomieku = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: host_config,
    user: user_config,
    password: password_config,
    database: process.env.DB_NAME_INDOMIEKU
});
const dbQueryIndomieku = util.promisify(dbIndomieku.query).bind(dbIndomieku);

//card generator
const dbCardGenerator = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: host_config,
    user: user_config,
    password: password_config,
    database: process.env.DB_NAME_CARD_GENERATOR
});
const dbQueryCardGenerator = util.promisify(dbCardGenerator.query).bind(dbCardGenerator);

//for HOTS
const dbHots = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: host_config,
    user: user_config,
    password: password_config,
    database: process.env.DB_NAME_HT
});
const dbQueryHots = util.promisify(dbHots.query).bind(dbHots);

//for click shorten
const dbClick = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: host_config,
    user: user_config,
    password: password_config,
    database: process.env.DB_NAME_Click
});
const dbQueryClick = util.promisify(dbClick.query).bind(dbClick);

// for event logger
/**
 * 
 * @param {number} user_id -  berkaitan dengan user_id aatau yg bertanggungjawab
 * @param {string} sql_parameter - sql code yang dijalankan atau final. atau bisa berupa deskripsi dari code
 * @param {string} message - bisa berupa message, data yang dihasilkan, atau tujuan dari function, atau data dari parameter.
 * @param {string} function_name - Nama function yang dijalankan
 */
const addSqlLogger = (user_id, sql_parameter, message, function_name) => {
    //user_id = number, user ID yang melakukan perubahan pada SQL
    //sql_code = SQL yang melakukan perubahan. PASTIKAN HANYA menggunakan ""

    const dbLog = mysql.createPool({
        // connectionLimit : 20, 
        multipleStatements: true,
        host: host_config,
        user: user_config,
        password: password_config,
        database: process.env.DB_NAME
    });

    let parameter = [user_id, sql_parameter, message, function_name]
    let query = `INSERT INTO action_logger (time_event, user_id, sql_code, message, function_name) VALUES (now(), ?, ?, ?, ?)`
    dbLog.query(query, parameter)


}

// dbConf.connect()


//export
module.exports = {
    dbConf, dbQuery,
    dbTM, dbTMQuery,
    dbIndomieku, dbQueryIndomieku,
    dbCardGenerator, dbQueryCardGenerator,
    dbHots, dbClick, dbQueryHots, dbQueryClick,
    addSqlLogger

}
