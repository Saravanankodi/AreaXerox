const fs = require('fs');

const envContent = fs.readFileSync('d:/projects/WebApps/AreaXerox/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (match) {
        let key = match[1];
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
    }
});

const appId = env.CASHFREE_APP_ID;
const secretKey = env.CASHFREE_SECRET_KEY;

async function testOrders() {
    const url = 'https://sandbox.cashfree.com/pg/orders';
    const body = {
        order_id: 'order_' + Date.now(),
        order_amount: 10,
        order_currency: 'INR',
        customer_details: {
            customer_id: 'cust_1',
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            customer_phone: '9876543210'
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-version': '2023-08-01',
            'x-client-id': appId,
            'x-client-secret': secretKey
        },
        body: JSON.stringify(body)
    });

    const data = await res.text();
    console.log(`[${res.status}] POST ${url}`);
    console.log(`Response:`, data);
}

testOrders();
