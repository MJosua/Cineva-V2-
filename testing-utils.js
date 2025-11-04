const readline = require('readline');
const { hotsSubmitMailer, hotsApproveRequest } = require('./mailer/hots/hots_mailer');
const { dbConf, dbQuery, dbTMQuery, dbHots } = require('./config/db');
const express = require('express');
const { API_URL, PORT } = require('./index');
const { shippingMailNotificationManual } = require('./automation/notification');
const { stuffingWeek } = require('./controller/order');
const { orderController, hotsSettingsController, hotsDashboardController } = require('./controller');

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

    else if (cmd === "dashboardtest") {

        await hotsDashboardController.getDashboardFunctions(req, res);

    }

    else {
        console.log(`Unknown command: ${cmd}`);
    }

    rl.prompt();
});
