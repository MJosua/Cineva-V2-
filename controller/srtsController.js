const { query } = require("express");
const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const fs = require('fs')

let blue = "\x1b[36m";

module.exports = {


    GetSeaRatesTrack: async (req, res) => {
        let date = new Date();
        let timestamp = blue + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const id = req.params.id;
        const type = req.params.type || "BL";

        if (!id) {
            res.status(500).send(err);
            console.log(timestamp + " No order number provided!", err);
            return;
        } else {
            try {
                let query = `
            SELECT * FROM update_event WHERE update_status = 1;
        `;

                dbConf.query(query, (err, results) => {
                    if (err) {
                        console.log(timestamp + "Error GetLatestUpdate ", err);
                        return res.status(500).send(err);
                    }
                    console.log(timestamp + `GetLatestUpdate success`);
                    res.status(200).send(results);
                });

            } catch (error) {
                console.log(timestamp + "Error at User => GetLatestUpdate", error);
                res.status(500).send(error);
            }
        }


    },


}