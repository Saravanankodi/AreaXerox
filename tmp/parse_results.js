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

async function test(version, url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-version': version,
            'x-client-id': appId,
            'x-client-secret': secretKey
        },
        body: JSON.stringify(body)
    });
    const data = await res.text();
    console.log(`[${res.status}] Version: ${version} | URL: ${url}`);
    console.log(`Response: ${data}\n`);
}

async function run() {
    const body = {
        vendor_id: 'v_' + Date.now().toString().slice(-6),
        name: 'Test Vendor',
        email: 'vendor@example.com',
        phone: '9876543210',
        bank_details: {
            account_number: '123456789012',
            account_holder: 'Test Holder',
            ifsc: 'HDFC0001234'
        }
    };

    await test('2023-08-01', 'https://sandbox.cashfree.com/pg/easy-split/vendors', body);
    await test('2022-09-01', 'https://sandbox.cashfree.com/pg/easy-split/vendors', body);
    await test('2023-08-01', 'https://sandbox.cashfree.com/pg/vendors', body);
    await test('2022-09-01', 'https://sandbox.cashfree.com/pg/vendors', body);
}

run();
