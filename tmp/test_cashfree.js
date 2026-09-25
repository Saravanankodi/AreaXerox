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

async function testVendorCreation(verifyAccount) {
    const baseUrl = 'https://sandbox.cashfree.com/pg';
    const body = {
        vendor_id: 'test_vendor_' + Date.now().toString().slice(-6),
        name: 'Test Xerox Shop',
        email: 'shopkeeper@example.com',
        phone: '9876543210',
        verify_account: verifyAccount,
        dashboard_access: false,
        bank_details: {
            account_number: '123456789012',
            account_holder: 'Test Shopkeeper',
            ifsc: 'HDFC0001234'
        },
        kyc_details: {
            account_type: 'INDIVIDUAL',
            business_type: 'PROPRIETORSHIP'
        }
    };

    try {
        console.log(`\nTesting POST ${baseUrl}/vendors with verify_account=${verifyAccount}...`);
        const res = await fetch(`${baseUrl}/vendors`, {
            method: 'POST',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(`Response:`, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error:`, err.message);
    }
}

async function run() {
    await testVendorCreation(false);
    await testVendorCreation(true);
}

run();
