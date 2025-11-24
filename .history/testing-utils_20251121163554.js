const readline = require('readline');
const { dbConf, dbQuery, dbTMQuery, dbHots } = require('./config/db');
const express = require('express');
const { API_URL, PORT } = require('./index');
const { shippingMailNotificationManual } = require('./service/automation/notification');
const { stuffingWeek } = require('./controller/order');
const { orderController, hotsSettingsController, hotsDashboardController, hotsAuth } = require('./controller');
const { hotsSubmitMailer, hotsApproveRequest } = require('./service/mailer/hots/hots_mailer');
const App = express();
App.listen(App.get('port'), () => {
    console.log(`🚀 Server running at http://${API_URL}:${PORT}`);
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.setPrompt('> ');
rl.prompt();

const req = {
    dataToken: { company_id: 999 }, // fake token for testing
    query: {},
    body: {},
    user: {
        id: 1,
        username: "yosuaXG",
        role_name: "admin",
        department_name: "IT",      // 👈 optional: adjust to 'HR', 'Finance', etc.
        email: "yosua.prima@gmail.com",
    },
};


const res = {
    status(code) {
        this.statusCode = code;
        return this; // allow chaining like res.status(200).send()
    },
    send(data) {
        console.log(`Response ${this.statusCode || 200}:`, data);
    },
    json(data) {
        console.log(`Response ${this.statusCode || 200}:`, JSON.stringify(data, null, 2));
    },
};



rl.on('line', async (input) => {
    const cmd = input.trim();

    console.clear();
    if (cmd === '/mail') {
        console.log('📧 Sending mail...');
        await hotsSubmitMailer(true, 2025012310098300, 'yosuaXG', 'service_name', 'josua.prima@gmail.com');
    }
    else if (cmd === '/port') {
        console.log('✅ Server is running on port', App.get('port'));
    }
    else if (cmd === '/mail1') {
        console.log('📧 Sending approval mail...');
        await hotsApproveRequest(true, 2025012310098300,);
    }
    else if (cmd === '/exit') {
        console.log('👋 Exiting...');
        process.exit(0);
    }
    else if (cmd === '/cekso') {

        let result = await dbQuery(`CALL insert_so()`);

        // result[0] = rows (if your SP does SELECT)
        // result[1] = metadata (OkPacket)
        let affected = result?.[0]?.affectedRows || result?.[1]?.affectedRows || 0;

        console.log(
            `call insert_so [WAS DONE]: affectedRows=${affected}`
        );
    }
    else if (cmd === 'cekmail') {

        shippingMailNotificationManual()

    }

    else if (cmd === 'cekweekada') {

        await orderController.stuffingWeek(req, res, true);
    }

    else if (cmd === 'cekweek') {

        await hotsSettingsController.todaysweek(req, res);

    }


    else if (cmd === 'ceklmailapprovehots') {

        await hotsApproveRequest(false, 2025012310098379);

    }

    else if (cmd === 'ceklmailprivatehots') {

        await hotsSubmitMailer(false, 2025012310098379, "yosua", "service.service_name", "josua.prima@gmail.com");

    }

    else if (cmd === "dashboardtest") {

        await hotsDashboardController.getDashboardFunctions(req, res);

    }


    else if (cmd.startsWith("/verifyuser")) {
        const username = cmd.split(" ")[1];
        if (!username) {
            console.log("⚠️ Usage: /verifyuser <username>");
        } else {
            console.log(`🔍 Manually verifying user '${username}'...`);
            await hotsAuth.manualVerifyAndPromoteUserByUID(username);
        }
    }


    else if (cmd === '/listhotsuserdraft') {
        console.log('📋 Listing all HOTS user drafts...\n');

        try {
            const [rows] = await dbHots.promise().query(`
                SELECT 
                    draft_id,
                    uid AS username,
                    CONCAT(firstname, ' ', lastname) AS fullname,
                    email,
                    department_id,
                    leader_id,
                    approval_status,
                    DATE_FORMAT(approval_date, '%Y-%m-%d %H:%i:%s') AS approval_date
                FROM user_draft
                ORDER BY draft_id DESC
            `);

            if (rows.length === 0) {
                console.log('⚠️ No user drafts found.');
            } else {
                // Format approval_status with color
                const coloredRows = rows.map(row => {
                    let statusColored;
                    switch (row.approval_status) {
                        case 'pending':
                            statusColored = '\x1b[33mPENDING\x1b[0m'; // yellow
                            break;
                        case 'verified':
                            statusColored = '\x1b[36mVERIFIED\x1b[0m'; // cyan
                            break;
                        case 'approved':
                            statusColored = '\x1b[32mAPPROVED\x1b[0m'; // green
                            break;
                        case 'rejected':
                            statusColored = '\x1b[31mREJECTED\x1b[0m'; // red
                            break;
                        default:
                            statusColored = row.approval_status;
                    }
                    return {
                        ...row,
                        approval_status: statusColored
                    };
                });

                console.table(coloredRows);
            }

        } catch (err) {
            console.error('❌ Error listing HOTS user drafts:', err.message);
        }
    }


    else {
        console.log(`Unknown command: ${cmd}`);
    }

    rl.prompt();
});
