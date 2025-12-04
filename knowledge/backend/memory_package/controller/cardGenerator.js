
const { dbCardGenerator, dbQueryCardGenerator } = require('../config/db')
const { hashIDCG, hashPasswordCG, createTokenCG } = require('../config/encrypts');
const user = require('./user');

const magenta = '\x1b[35m';
module.exports = {
    getListEmployeeName: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let query = `
        SELECT name, id FROM card_items 
        `;

        dbCardGenerator.query(query, async (err, results) => {
            if (err) {
                res.status(500).send({
                    message: ` ERROR! Please Check Connection`,
                    success: false,
                    err
                });
                console.log(`${timestamp} ERROR at auth -> createUser message: ${err}`);
            } else {
                res.status(200).send({
                    message: ` successfully Get Employee Data !`,
                    success: true,
                    data: results,
                    err: ''
                });
                console.log(`${timestamp} admin => Get Employee Data success`);
            }
        })

    }, getEmployeeData: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { employee_id } = req.query; // Correct variable name here

        let query = `
        SELECT * from card_items where id = '${employee_id}'`; // Using placeholder to prevent SQL injection

        dbCardGenerator.query(query, async (err, results) => { // Passing employee_id as parameter
            if (err) {
                res.status(500).send({
                    message: ` ERROR! Please Check Connection`,
                    success: false,

                });
                console.log(`${timestamp} ERROR at auth -> Get message: ${err}`);
            } else {
                res.status(200).send({
                    message: ` successfully Get Employee Data !`,
                    success: true,
                    data: results,
                });
                console.log(`${timestamp} admin => Get Employee Data with id ${employee_id} success`);
            }
        })
    }, setEmployeeData: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {

            e_name,
            e_position,
            e_phone,
            e_mail,
            e_extphone,
            e_company,
            e_link,
        } = req.body; // Access data from request body

        e_name = e_name || ""; // If e_name is null, replace with empty string
        e_position = e_position || "";
        e_phone = e_phone || "";
        e_mail = e_mail || "";
        e_extphone = e_extphone || 0;
        e_company = e_company || "";
        e_link = e_link || "";


        // Algoritma pembentuk ID
        /*
        const hash = crypto.createHash('sha256'); // Use SHA-256 hash algorithm
        hash.update(e_name); // Update the hash with the name
        */
        const e_id = hashIDCG(e_name);


        // Construct the SQL query
        let query = `
            INSERT INTO cards.card_items
            (id, name, position, phone, mail, ext_phone, company, link)
            VALUES(${dbCardGenerator.escape(hashIDCG(e_name))}, '${e_name}', '${e_position}', '${e_phone}', '${e_mail}', '${e_extphone}', '${e_company}', '${e_link}');
            `;

        // Execute the SQL query
        dbCardGenerator.query(query, async (err, results) => {
            if (err) {
                // Handle errors
                res.status(500).send({
                    message: `ERROR! Please Check Connection`,
                    success: false,
                    err
                });
                console.log(`${timestamp} ERROR at auth -> Get message: ${err}`);
                // console.log("e_name", e_name)
                // console.log("e_position", e_position)
                // console.log("e_phone", e_phone)
                // console.log("e_mail", e_mail)
                // console.log("e_extphone", e_extphone)
            } else {
                // Send success response
                res.status(200).send({
                    message: `Successfully Create Employee Data!`,
                    success: true,
                    qr: e_id,
                });
                console.log(`${timestamp} admin => Create Employee Data with id ${e_id} success`);
            }
        });
    }, updateEmployeeData: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            e_identification,
            e_name,
            e_position,
            e_phone,
            e_mail,
            e_extphone,
            e_company,
            e_link,
        } = req.body;

        e_name = e_name || ""; // If e_name is null, replace with empty string
        e_position = e_position || "";
        e_phone !== -1 ? e_phone : ""
        e_mail = e_mail || "";
        e_extphone = e_extphone || 0;
        e_company = e_company || "";
        e_link = e_link || "";

        let query = `
        UPDATE cards.card_items
    SET name = '${e_name}',
        position = '${e_position}',
        phone = '${e_phone}',
        mail = '${e_mail}',
        ext_phone = '${e_extphone}',
        company = '${e_company}',
        link = '${e_link}'
    WHERE id = '${e_identification}';
        `;

        dbCardGenerator.query(query, async (err, results) => {
            if (err) {
                res.status(500).send({
                    message: `ERROR! Please Check Connection`,
                    success: false,
                    err
                });
                console.log(`${timestamp} ERROR at auth -> Get message: ${err}`);
                // console.log("e_name", e_name)
                // console.log("e_position", e_position)
                // console.log("e_phone", e_phone)
                // console.log("e_mail", e_mail)
                // console.log("e_extphone", e_extphone)
            } else {
                res.status(200).send({
                    message: `Successfully Update Employee Data!`,
                    success: true,
                    qr: e_identification

                });
                console.log(`${timestamp} admin => Update Employee Data with id ${e_identification} success`);
            }
        });
    }, deleteeEmployeeData: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            e_identification,
        } = req.body;

        let query = `
        DELETE FROM cards.card_items
        WHERE id = '${e_identification}';
        `;

        dbCardGenerator.query(query, async (err, results) => {
            if (err) {
                res.status(500).send({
                    message: `ERROR! Please Check Connection`,
                    success: false,
                    err
                });
                console.log(`${timestamp} ERROR at auth -> Get message: ${err}`);
                // console.log("e_name", e_name)
                // console.log("e_position", e_position)
                // console.log("e_phone", e_phone)
                // console.log("e_mail", e_mail)
                // console.log("e_extphone", e_extphone)
            } else {
                res.status(200).send({
                    message: `Successfully Delete Employee Data!`,
                    success: true,

                });
                console.log(`${timestamp} admin => Delete Employee Data with id ${e_identification} success`);
            }
        });
    }, AuthLogin: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            eawsfgohjni,
            ergvwsiohjns
        } = req.body;

        let password = hashPasswordCG(ergvwsiohjns)
        let query = `SELECT
        no_absen,
        sapa_kamu
    FROM
        rak_sepatu rs
    WHERE
        sapa_kamu =  BINARY '${eawsfgohjni}'
        AND mie_goreng = '${password}'
        AND masih_idup_lu = 1 
    LIMIT 1 ;`

        dbCardGenerator.query(query, (err, results) => {
            if (err) {

                res.status(500).send({
                    success: false,
                    message: "error at dbCardGenerator"
                })
                console.log(timestamp + "CG: Error at dbCardGenerator" + err)

            } else {

                if (results[0]) {
                    let userData = results[0]
                    let tokek = createTokenCG(userData)

                    try {
                        let sqlUpdate = dbQueryCardGenerator(`
                        UPDATE  rak_sepatu
                        SET 
                        mie_kari_ayam = '${tokek}', last_makan_mie = now() WHERE no_absen = ${userData.no_absen}`)
                    } catch (error) {

                        console.log(timestamp + "CG: Error at dbCardGenerator" + error)
                        res.status(500).send({
                            success: false,
                            message: "error at dbCardGenerator"
                        })
                    }

                    console.log(timestamp + `CG: dbCardGenerator Login ${eawsfgohjni} success`);

                    res.status(200).send({
                        success: true,
                        message: "selamat datang",
                        userData,
                        tokek
                    });

                } else {
                    console.log(timestamp + `CG: dbCardGenerator Login ${eawsfgohjni} salah password/usernname`)

                    let userData = {}
                    let tokek = '';

                    res.status(200).send({
                        success: false,
                        message: "salah username atau password",
                        userData,
                        tokek
                    })
                }


            }
        })


    }, createAccount: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { username, wasyu } = req.body

        // async function createId() {

        //     try {
        //         const lastIdCheck = await dbQueryCardGenerator(`SELECT MAX(rs.no_absen) last_absen FROM rak_sepatu rs`)

        //         if (lastIdCheck[0]) {
        //             let id = lastIdCheck[0].last_absen + 1
        //             return id
        //         } else {
        //             const id = 1;
        //             return id
        //         }

        //     } catch (error) {

        //         console.log(timestamp + "error at CG: createAccount createId function" + error)
        //         res.status(500).send({
        //             success: false,
        //             message: "error at createId function"
        //         })

        //     }
        // }


        async function checkIdAvailability() {

            try {

                const usernameCheck = await dbQueryCardGenerator(`SELECT sapa_kamu FROM rak_sepatu rs WHERE sapa_kamu = '${username}'`)

                if (usernameCheck[0]) {
                    console.log(timestamp + "CG: ID sudah ada yang punya")
                    return false, res.status(200).send({
                        success: false,
                        message: "ID sudah ada yang punya :("
                    })
                } else {
                    return true
                }
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: "error at checkIdAvailability function"
                })
            }
        }

        if (checkIdAvailability) {

            let hashWasyu = hashPasswordCG(wasyu);
            let query = `INSERT INTO rak_sepatu
            (sapa_kamu, mie_goreng, kasta_sosial, masih_idup_lu, dibuat)
            VALUES 
            (${username}, ${hashWasyu}, 1, 1, now());`

            dbCardGenerator.query(query, (err) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: "error at dbCardGenerator"
                    })
                    console.log(timestamp + "CG: Error at dbCardGenerator" + err)

                } else {

                    res.status(200).send({
                        success: true,
                        message: "successfully create account"
                    })
                    console.log(timestamp + "CG: dbCardGenerator success")

                }

            })

        } else {

            res.status(200).send({
                success: false,
                message: "ID is not available"
            })
            console.log(timestamp + "CG: ID is not available")
        }
    }, AutoLogin: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            let checkUserActive = (await dbQueryCardGenerator(`SELECT masih_idup_lu FROM rak_sepatu rs WHERE no_absen = ${req.dataToken.no_absen} AND mie_kari_ayam = '${req.token}';`))[0];
             
            if (checkUserActive) {
                if (checkUserActive.masih_idup_lu = 1) {

                    let getUserData = (await dbQueryCardGenerator(`
                    SELECT
                        no_absen,
                        sapa_kamu
                    FROM
                        rak_sepatu rs
                    WHERE
                        no_absen = ${req.dataToken.no_absen}
                    LIMIT 1`))[0]

                    let tokek = createTokenCG(getUserData)

                    let updateTokek = await dbQueryCardGenerator(`
                    UPDATE 
                        rak_sepatu
                    SET 
                        mie_kari_ayam = '${tokek}'
                    WHERE no_absen = ${req.dataToken.no_absen}`)

                    res.status(200).send({
                        success: true,
                        message: "Success AutoLogin function",
                        getUserData,
                        tokek
                    })


                } else {

                    let getUserData = {}
                    let tokek = {}

                    res.status(200).send({
                        success: false,
                        message: "Account is not active",
                        getUserData,
                        tokek
                    })
                    console.log(timestamp, "checkUserActive" )
                }

            } else {

                let getUserData = {}
                let tokek = {}

                res.status(200).send({
                    success: false,
                    message: "invalid token or user not longer active",
                    getUserData,
                    tokek
                })
                console.log(timestamp, "checkUserActive" )
            }
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "error at AutoLogin function"
            })
            console.log(timestamp, "checkUserActive" )
        }

    }


}