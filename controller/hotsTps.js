const {
    // untuk hots
    dbHots,
    dbQueryHots,

    //untuk koneksi ke database i2i
    dbConf,
    dbQuery
} = require("../config/db");

const { uploadFile } = require("./order");
const { hotsMailer } = require('../config/mailer')


let green = "\x1b[32m"


/*
untuk utilitas pricing structure



*/


module.exports = {


    getRegion: async (req, res) => {


        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

            let query = `SELECT region_id, region_desc FROM mst_region mr`

            dbConf.execute(query, (err, results) => {

                if (err) {
                    res.status(500).send({
                        success: false,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error at getRegion, message:", err);
                } else {
                    res.status(500).send({
                        success: true,
                        message: `successfully get data region`,
                        results
                    });
                    console.log(timestamp, "Error at getRegion, message:", err);
                }

            })

        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getRegion is Unauthorized");
        }

    },
    getCountry: async (req, res) => {


        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.user_id) {

        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getCountry is Unauthorized");
        }

    },
    getAnaliyst: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {

        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getAnaliyst is Unauthorized");
        }


    },
    getSKU: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {

        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getSKU is Unauthorized");
        }


    }


}