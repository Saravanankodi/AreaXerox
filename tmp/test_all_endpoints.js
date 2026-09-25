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

async function probe(url, headers, body) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(body)
        });
        const text = await res.text();
        console.log(`URL: ${url}`);
        console.log(`Headers:`, JSON.stringify(headers));
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${text.slice(0, 300)}\n---`);
    } catch (err) {
        console.log(`URL: ${url} -> Error: ${err.message}\n---`);
    }
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

    const versions = ['2023-08-01', '2022-09-01'];
    const baseUrls = [
        'https://sandbox.cashfree.com/pg',
        'https://sandbox.cashfree.com/pg/easy-split',
        'https://payout-api.cashfree.com/payout/v1'
    ];
    const paths = ['/vendors', '/easy-split/vendors', '/addVendor'];

    for (const ver of versions) {
        for (const base of baseUrls) {
            for (const p of paths) {
                await probe(`${base}${p}`, {
                    'x-api-version': ver,
                    'x-client-id': appId,
                    'x-client-secret': secretKey
                }, body);
            }
        }
    }
}

run();
