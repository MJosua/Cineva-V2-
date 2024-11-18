const { dbConf, dbQuery, addSqlLogger } = require("../config/db");
const fs = require('fs')
const { orderRecievedMailSender } = require('../config/mailer')
const ejs = require('ejs');
// const puppeteer = require('puppeteer');
const axios = require('axios');
// const { time } = require("console");
// const { json } = require("body-parser");
// const { parse } = require("path");

let green = "\x1b[32m"

const queryCheckTicketRow = `
    SELECT COUNT(*) as row_number
    FROM 
    cstm_form c 
    WHERE 
    c.country_id = ? 
    AND 
    c.event_id = ?
    `

const generateID = (country, event_id, row_number) => {
    // Ensure service_id is a two-digit string
    const formattedEventID = String(event_id).padStart(2, '0');
    return parseInt(`${country}${formattedEventID}${row_number + 1}`);

}

module.exports = {
    setDoorprize: async (req, res) => {
        let {
            Event_id, Country,
            column_1, column_2, column_3, column_4, column_5, column_6, column_7, column_8, column_9, column_10, column_11, column_12,
            queryUnique
        } = req.body;


        console.log("Form Fields:", req.body);
        console.log("filename Fields:", req.files[0].filename);


        if (queryUnique) {
            let valueToCheck;

            // Dynamically select the column based on queryUnique
            switch (Number(queryUnique)) {
                case 1:
                    valueToCheck = column_1;
                    break;
                case 2:
                    valueToCheck = column_2;
                    break;
                case 3:
                    valueToCheck = column_3;
                    break;
                case 4:
                    valueToCheck = column_4;
                    break;
                case 5:
                    valueToCheck = column_5;
                    break;
                case 6:
                    valueToCheck = column_6;
                    break;
                case 7:
                    valueToCheck = column_7;
                    break;
                case 8:
                    valueToCheck = column_8;
                    break;
                case 9:
                    valueToCheck = column_9;
                    break;
                case 10:
                    valueToCheck = column_10;
                    break;
                case 11:
                    valueToCheck = column_11;
                    break;
                case 12:
                    valueToCheck = column_12;
                    break;
                // Continue for other cases up to 12 as per your logic
                default:
                    return res.status(400).send({
                        success: false,
                        message: "Invalid queryUnique value",
                    });
            }




            try {
                // Query the database to check if the value is unique
                const uniqueQueryResult = await dbQuery(
                    `SELECT COUNT(*) as count FROM cstm_form WHERE column_${queryUnique} = ? AND event_id = ?`,
                    [valueToCheck, Event_id]
                );

                if (uniqueQueryResult[0].count > 0) {
                    return res.status(409).send({
                        success: false,
                        message: "The invoice already registered in the system",
                    });
                }
            } catch (error) {
                console.error("Database query failed:", error);
                return res.status(500).send({
                    success: false,
                    message: "Database error while checking for unique value",
                });
            }
        }

        const paramTicketCheck = [Country, Event_id];
        const queryCheckTicketRow = `
            SELECT COUNT(*) AS row_number FROM cstm_form WHERE country_id = ? AND event_id = ?
        `;

        dbConf.query(queryCheckTicketRow, paramTicketCheck, async (err, results) => {
            if (err) {
                console.error("Error executing queryCheckTicketRow:", err);
                return res.status(500).send({
                    success: false,
                    message: "Ticket not created",
                });
            }

            const rowNumber = results[0].row_number + 1; // Increment row number
            const formID = generateID(Country, Event_id, rowNumber); // Generate unique form ID

            let file_url = `/public/files/DoorPrize/event_taiwan_1/${req.files[0].filename}`;
            // Insert the form data into the database
            const queryForm = `
                INSERT INTO cstm_form
                    (
                        column_1, column_2, column_3, column_4, column_5,
                        country_id, attachment_id, event_id, file_path,  submit_date
                    )
                VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?,? , NOW());
            `;

            const parameterForm = [
                column_1, column_2, column_3, column_4, column_5,
                Country, formID, Event_id, file_url
            ];

            dbConf.query(queryForm, parameterForm, (err, results) => {
                if (err) {
                    console.error("Error inserting form data:", err);
                    return res.status(501).send({
                        success: false,
                        message: "Ticket not created",
                    });
                }
                // if (req.file) {

                // }
                // else {
                // Successful insert
                res.status(200).send({
                    success: true,
                    message: "Ticket has been created",
                });
                // }
            });
        });
    }
};