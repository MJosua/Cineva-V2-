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


// for default online order
const dbConf = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
const dbQuery = util.promisify(dbConf.query).bind(dbConf);

// for trade mark management
const dbTM = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TM
});
const dbTMQuery = util.promisify(dbTM.query).bind(dbTM);

const dbIndomieku = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_INDOMIEKU
});

const dbQueryIndomieku = util.promisify(dbIndomieku.query).bind(dbIndomieku);

const dbCardGenerator = mysql.createPool({
    // connectionLimit : 20, 
    multipleStatements: true,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_CARD_GENERATOR
});

const dbQueryCardGenerator = util.promisify(dbCardGenerator.query).bind(dbCardGenerator);


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
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME_DEV
    });

    let parameter = [user_id, sql_parameter, message, function_name]
    let query = `INSERT INTO action_logger (time_event, user_id, sql_code, message, function_name) VALUES (now(), ?, ?, ?, ?)`
    dbLog.query(query, parameter)


}

// dbConf.connect()
module.exports = {
    dbConf, dbQuery,
    dbTM, dbTMQuery,
    dbIndomieku, dbQueryIndomieku,
    dbCardGenerator, dbQueryCardGenerator,
    addSqlLogger

}
