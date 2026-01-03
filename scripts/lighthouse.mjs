
import fs from 'fs';
import https from 'https';
import path from 'path';

// Load Config
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set this in your environment or .env
const GIST_ID = process.env.GIST_ID; // Set this in your environment or .env

if (!GITHUB_TOKEN || !GIST_ID) {
    console.error('❌ [Lighthouse] Missing Credentials!');
    console.error('Please set GITHUB_TOKEN and GIST_ID in your environment variables.');
    process.exit(1);
}

const statusPath = path.resolve('AURA_STATUS.md');
if (!fs.existsSync(statusPath)) {
    console.error('❌ [Lighthouse] AURA_STATUS.md not found!');
    process.exit(1);
}

const content = fs.readFileSync(statusPath, 'utf8');
const timestamp = new Date().toISOString();
const payload = {
    description: `AURA Status Update: ${timestamp}`,
    files: {
        'AURA_STATUS.md': {
            content: `**Last Updated:** ${timestamp}\n\n${content}`
        }
    }
};

const data = JSON.stringify(payload);

const options = {
    hostname: 'api.github.com',
    port: 443,
    path: `/gists/${GIST_ID}`,
    method: 'PATCH',
    headers: {
        'User-Agent': 'AURA-Lighthouse/1.0',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log('📡 [Lighthouse] Transmitting status to Gist...');

const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ [Lighthouse] Transmission Successful!');
            console.log(`🔗 Gist URL: https://gist.github.com/${GIST_ID}`);
        } else {
            console.error(`❌ [Lighthouse] Transmission Failed (Status: ${res.statusCode})`);
            console.error(responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ [Lighthouse] Connection Error:', error);
});

req.write(data);
req.end();
