require('dotenv').config();
const { getProductCatalog } = require('../controller/OnlineOrder/product');
const { dbConf } = require('../config/db');

// Mock req and res
const req = {
    dataToken: {
        user_id: 1,
        company_id: 105
    }
};

const res = {
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    send: function (data) {
        console.log('Status Code:', this.statusCode);
        console.log('Result:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        if (data.products && data.containers) {
            console.log('SUCCESS: Both products and containers found.');
            console.log('Products count:', data.products.length);
            console.log('Containers count:', data.containers.length);
        } else {
            console.log('FAILURE: Missing products or containers.');
        }
        process.exit(0);
    }
};

console.log('Testing consolidated getProductCatalog for Company 105...');
getProductCatalog(req, res).catch(err => {
    console.error('Test Error:', err);
    process.exit(1);
});
