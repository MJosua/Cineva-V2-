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

let date = new Date();
let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


const now = new Date();
const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes()
            .toString()
            .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

const queryCheckTicketRow = `
    SELECT COUNT(*) as rownumber
    FROM 
    cstm_form c 
    WHERE 
    c.country_id = ? 
    AND 
    c.event_id = ?
    `

const generateID = (country, event_id, rownumber) => {
    // Ensure service_id is a two-digit string
    const formattedEventID = String(event_id).padStart(2, '0');
    return parseInt(`${country}${formattedEventID}${rownumber + 1}`);

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
            SELECT COUNT(*) AS rownumber FROM cstm_form WHERE country_id = ? AND event_id = ?
        `;

        dbConf.query(queryCheckTicketRow, paramTicketCheck, async (err, results) => {
            if (err) {
                console.error("Error executing queryCheckTicketRow:", err);
                return res.status(500).send({
                    success: false,
                    message: "Ticket not created",
                });
            }

            const rowNumber = results[0].rownumber + 1; // Increment row number
            const formID = generateID(Country, Event_id, rowNumber); // Generate unique form ID

            let file_url = `/public/files/DoorPrize/event_taiwan_1/${req.files[0].filename}`;
            // Insert the form data into the database
            let columns = ["column_1"];
            let values = ["?"]; // Placeholder for prepared statements

            // Dynamically add columns and placeholders
            if (column_2) {
                columns.push("column_2");
                values.push("?");
            }
            if (column_3) {
                columns.push("column_3");
                values.push("?");
            }
            if (column_4) {
                columns.push("column_4");
                values.push("?");
            }
            if (column_5) {
                columns.push("column_5");
                values.push("?");
            }
            if (column_6) {
                columns.push("column_6");
                values.push("?");
            }
            if (column_7) {
                columns.push("column_7");
                values.push("?");
            }
            if (column_8) {
                columns.push("column_8");
                values.push("?");
            }
            if (column_9) {
                columns.push("column_9");
                values.push("?");
            }
            if (column_10) {
                columns.push("column_10");
                values.push("?");
            }
            if (column_11) {
                columns.push("column_11");
                values.push("?");
            }
            if (column_12) {
                columns.push("column_12");
                values.push("?");
            }
            // Add more columns as needed...

            // Mandatory columns
            columns.push("country_id", "attachment_id", "event_id", "file_path", "submit_date");
            values.push("?", "?", "?", "?", "?");

            let queryForm = `
                INSERT INTO cstm_form (${columns.join(", ")})
                VALUES (${values.join(", ")})
            `;
            const submitDate = formattedDate;
            const parameterForm = [
                column_1,
                ...(column_2 ? [column_2] : []),
                ...(column_3 ? [column_3] : []),
                ...(column_4 ? [column_4] : []),
                ...(column_5 ? [column_5] : []),
                ...(column_6 ? [column_6] : []),
                ...(column_7 ? [column_7] : []),
                ...(column_8 ? [column_8] : []),
                ...(column_9 ? [column_9] : []),
                ...(column_10 ? [column_10] : []),
                ...(column_11 ? [column_11] : []),
                ...(column_12 ? [column_12] : []),

                Country, formID, Event_id, file_url, submitDate
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
    },

    showticket: async (req, res) => {

        const queryGetTicket = `SELECT * FROM cstm_form WHERE event_id = ?;`;
        const queryGetCount = `SELECT COUNT(*) AS total FROM cstm_form WHERE event_id = ?;`;

        try {
            // Use dbQuery to execute both queries
            const tickets = await dbQuery(queryGetTicket, [1]);
            const count = await dbQuery(queryGetCount, [1]);

            if (tickets.length > 0) {
                console.log(new Date().toISOString(), "getTicketDetail case Event TW");
                return res.status(200).send({
                    success: true,
                    data: tickets,
                    total: count[0]?.total, // Safely access count
                });
            } else {
                return res.status(404).send({
                    success: false,
                    message: "No data found",
                });
            }
        } catch (error) {
            console.error(new Date().toISOString(), "Error fetching tickets:", error.message);
            return res.status(500).send({
                success: false,
                message: "Internal server error",
            });
        }

    }

};