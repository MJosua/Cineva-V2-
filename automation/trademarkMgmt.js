
// Cron dependency
const cron = require('node-cron');

// ini harusnya db cronjob
const { dbTMQuery } = require("../config/db");

// ini ambil script email
const { NotifyTMGmailBulkMailSender1, NotifyTMGmailBulkMailSender6 } = require("../config/mailer");

//???
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    grey: "\x1b[90m",
};

function runCheck() {
    // Schedule a task to run every minute

    //for testing
    cron.schedule('0 0 * * SUN', () => {

        // cron.schedule('* * * * *', () => {
        (async () => {
            let date = new Date();
            let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
            console.log(`${timestamp} CronJob => Running task success`);

            try {
                const querygetExp_date = `
          SELECT 
            TIMESTAMPDIFF(MONTH , NOW(), tm_exp_date) AS month_left,
            TIMESTAMPDIFF(DAY, NOW(), tm_exp_date) AS days_left,
            tm_brand, 
            tm_id,
            tm_label,
            tm_status
          FROM 
            mst_trademark
        `;
                const getExp_date = await dbTMQuery(querygetExp_date);


                const querygetExp_dateunder6 = `
        SELECT 
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) AS month_left,
        TIMESTAMPDIFF(DAY, NOW(), tm_exp_date) AS days_left,
        tm_brand, 
        tm_id,
        tm_label,
        tm_status
    FROM 
        mst_trademark
    WHERE
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) <= 6 AND TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) > 1;
        `;
                const getUnder6 = await dbTMQuery(querygetExp_dateunder6);


                const querygetExp_dateunder1 = `
        SELECT 
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) AS month_left,
        TIMESTAMPDIFF(DAY, NOW(), tm_exp_date) AS days_left,
        tm_brand, 
        tm_id,
        tm_label,
        tm_status
    FROM 
        mst_trademark
    WHERE
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) = 1 ;
        `;
                const getUnder1 = await dbTMQuery(querygetExp_dateunder1);



                for (const {
                    month_left, days_left, tm_brand, tm_id, tm_label
                } of getUnder6) {

                    if (month_left <= 6 && month_left > 1) {
                        NotifyTMGmailBulkMailSender6();
                        break;
                    }
                }

                for (const {
                    month_left, days_left, tm_brand, tm_id, tm_label
                } of getUnder1) {

                    if (month_left = 1) {
                        NotifyTMGmailBulkMailSender1();
                        break;
                    }
                }

            } catch (error) {
                console.error('Error in database operation:', error);
            }
        })();
    });

    // Other cron jobs can be scheduled here
}

module.exports = { runCheck };
