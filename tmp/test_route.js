const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('d:/projects/WebApps/AreaXerox/.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (match) {
        let key = match[1];
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
    }
});

console.log('FIREBASE_SERVICE_ACCOUNT present:', !!process.env.FIREBASE_SERVICE_ACCOUNT);

let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('Service Account Project ID:', serviceAccount.project_id);
    console.log('Client Email:', serviceAccount.client_email);
    console.log('Private Key present:', !!serviceAccount.private_key);
} catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
}
