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

        if (queryUnique) {
            let valueToCheck;

            // Dynamically select the column based on queryUnique
            switch (queryUnique) {
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
                let uniqueQueryResult = await dbQuery(
                    `SELECT COUNT(*) as count FROM cstm_form WHERE column_${queryUnique} = ? AND event_id = ?`,
                    [valueToCheck, Event_id]
                );

                // Check if the value already exists
                if (uniqueQueryResult[0].count > 0) {
                    return res.status(409).send({
                        success: false,
                        message: "The value already exists in the system",
                    });
                }
            } catch (error) {
                console.error("Database query failed", error);
                return res.status(500).send({
                    success: false,
                    message: "Database error while checking for unique value",
                });
            }
        }

        let paramTicketCheck = [Country, Event_id];

        dbConf.query(queryCheckTicketRow, paramTicketCheck, async (err, results) => {
            if (err) {
                console.error("Error executing queryCheckTicketRow", err);
                return res.status(500).send({
                    success: false,
                    message: "Ticket not created",
                });
            }

            let formID = generateID(Country, Event_id, results[0].row_number);

            let queryForm = `
                INSERT INTO cstm_form
                    (
                        column_1, column_2, column_3, column_4, column_5, 
                        country_id, attachment_id, event_id, submit_date
                    )
                    VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?, Now());
            `;

            let parameterForm = [
                column_1, column_2, column_3, column_4, column_5,
                Country, formID, Event_id
            ];

            dbConf.query(queryForm, parameterForm, (err, results) => {
                if (err) {
                    console.error("Error inserting form data", err);
                    return res.status(501).send({
                        success: false,
                        message: "Ticket not created",
                    });
                }

                // Successful insert
                res.status(200).send({
                    success: true,
                    message: "Ticket has been created",
                });
            });
        });
    }
};