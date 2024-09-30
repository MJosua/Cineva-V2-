const {
    dbHots,
    dbQueryHots,
    // addSqlLogger
} = require("../config/db");
// const cookieParser = require('cookie-parser');

let yellowTerminal = "\x1b[33m";

module.exports = {
    getmenu: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT u.role_id
        FROM USER u
        WHERE u.user_id = ? AND u.active = 1
        LIMIT 1`;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Auth Role Error: ", err1);
                return;
            }

            if (!results1.length) {
                res.status(501).send({
                    success: false,
                    message: 'Role is not set!'
                });
                return;
            }

            const role_id = results1[0].role_id;

            // Query to get the menu based on the role
            const queryGetMenu = `
            SELECT *
            FROM menu
            `;

            if (role_id !== 4) {
                queryGetMenu += ` WHERE role_id = ${role_id} AND active = 1`;
            }

            dbHots.execute(queryGetMenu, [role_id], (err2, results2) => {
                if (err2) {
                    res.status(502).send({
                        success: false,
                        message: err2
                    });
                    console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                    return;
                }

                if (!results2.length) {
                    res.status(404).send({
                        success: false,
                        message: 'Menu not found!'
                    });
                    return;
                }
                res.status(200).send({
                    success: true,
                    message: "GET MENU SUCCESS",
                    data: results2 // include menu data in the response
                });
            });
        });
    },
    getservice: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT u.role_id
        FROM USER u
        WHERE u.user_id = ? AND u.active = 1
        LIMIT 1`;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Auth Role Error: ", err1);
                return;
            }

            if (!results1.length) {
                res.status(501).send({
                    success: false,
                    message: 'Role is not set!'
                });
                return;
            }

            const role_id = results1[0].role_id;

            // Query to get the menu based on the role
            const queryGetMenu = `
            SELECT *
            FROM service
            `;

            if (role_id !== 4) {
                queryGetMenu += ` WHERE active = 1`;
            }

            dbHots.execute(queryGetMenu, [role_id], (err2, results2) => {
                if (err2) {
                    res.status(502).send({
                        success: false,
                        message: err2
                    });
                    console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                    return;
                }

                if (!results2.length) {
                    res.status(404).send({
                        success: false,
                        message: 'Menu not found!'
                    });
                    return;
                }
                res.status(200).send({
                    success: true,
                    message: "GET MENU SUCCESS",
                    data: results2 // include menu data in the response
                });
                console.log(timestamp, "GET MENU SUCCESS");
            });
        });
    },
    getcategory: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT *
        FROM 
        service
        `;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Get  service category Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "GET  service category   SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "GET  service category   SUCCESS");
            }
        });
    },
    getcompletionstatus: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT *
        FROM 
        ticket_status
        `;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Get Completion Status Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "GET Completion Status  SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "GET Completion Status  SUCCESS");
            }
        });

    }


    /* 
     
    */

}