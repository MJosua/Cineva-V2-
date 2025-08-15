const readline = require('readline');
const { hotsSubmitMailer, hotsApproveRequest } = require('./mailer/hots/hots_mailer');
const { dbConf, dbQuery, dbTMQuery, dbHots } = require('./config/db');
const express = require('express');
const { API_URL, PORT } = require('.');

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

rl.on('line', async (input) => {
    const cmd = input.trim();

    console.clear();
    if (cmd === '/mail') {
        console.log('📧 Sending mail...');
        await hotsSubmitMailer( true, 2025012310098300, 'yosuaXG', 'service_name', 'josua.prima@gmail.com');
    }
    else if (cmd === '/port') {
        console.log('✅ Server is running on port', App.get('port'));
    }
    else if (cmd === '/mail1') {
        console.log('📧 Sending approval mail...');
        await hotsApproveRequest( true, 2025012310098300,);
    }
    else if (cmd === '/exit') {
        console.log('👋 Exiting...');
        process.exit(0);
    }
    else {
        console.log(`Unknown command: ${cmd}`);
    }

    rl.prompt();
});
