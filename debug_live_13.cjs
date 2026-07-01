const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './apps/web/.env.test' });

function timestamp() {
    return `[${new Date().toISOString()}]`;
}

function log(msg) {
    console.log(`${timestamp()} ${msg}`);
}

async function withTimeout(page, name, actionPromise, maxSeconds = 30) {
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`TIMEOUT: ${name} exceeded ${maxSeconds}s`)), maxSeconds * 1000)
    );
    try {
        log(`START: ${name}`);
        const promiseToRun = typeof actionPromise === 'function' ? actionPromise() : actionPromise;
        const result = await Promise.race([promiseToRun, timeoutPromise]);
        log(`END: ${name}`);
        return result;
    } catch (e) {
        log(`FAIL: ${name} - ${e.message}`);
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const screenshotPath = path.join(process.cwd(), `fail_${safeName}.png`);
        const htmlPath = path.join(process.cwd(), `fail_${safeName}.html`);
        
        await page.screenshot({ path: screenshotPath });
        const html = await page.content();
        fs.writeFileSync(htmlPath, html);
        
        log(`Captured screenshot to ${screenshotPath}`);
        log(`Captured HTML to ${htmlPath}`);
        log(`Current URL: ${page.url()}`);
        
        // Print recorded console errors (we will setup a listener)
        log(`Console Errors recorded during session:`);
        global.recordedErrors.forEach(err => log(err));
        
        process.exit(1);
    }
}

(async () => {
    // 5. Hard timeout for the entire script of 120s
    setTimeout(() => {
        log('HARD TIMEOUT: 120s reached. Exiting.');
        process.exit(1);
    }, 120000);

    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) {
        log('TEST_EMAIL or TEST_PASSWORD not found in .env');
        process.exit(1);
    }

    log('Launching browser');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    global.recordedErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            global.recordedErrors.push(msg.text());
        }
    });

    const baseUrl = 'https://deeprastore-order-os.vercel.app';
    
    await withTimeout(page, 'Open login page', page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' }));
    
    await withTimeout(page, 'Enter email', page.type('input[type="email"]', email));
    
    await withTimeout(page, 'Enter password', page.type('input[type="password"]', password));
    
    await withTimeout(page, 'Click Login', page.click('button[type="submit"]'));
    
    await withTimeout(page, 'Wait for navigation', async () => {
        await page.waitForFunction('!window.location.pathname.includes("/login")', { timeout: 30000 });
    });
    
    await withTimeout(page, 'Detect dashboard', async () => {
        await page.waitForSelector('body', { timeout: 30000 });
        const url = page.url();
        log(`Detected URL: ${url}`);
    });
    
    await withTimeout(page, 'Open Intake', page.goto(`${baseUrl}/pilot/order-desk`, { waitUntil: 'networkidle0' }));
    
    await withTimeout(page, 'Open latest enquiry', async () => {
        const divs = await page.$$('div');
        let found = false;
        for (const div of divs) {
            const text = await page.evaluate(el => el.textContent, div);
            if (text && text.includes('Test Live Validation 12')) {
                log('Found latest enquiry card, clicking...');
                await div.click();
                found = true;
                break;
            }
        }
        if (!found) throw new Error('Could not find latest enquiry card (Test Live Validation 12)');
    });

    log('SUCCESS! Reached latest enquiry.');
    await browser.close();
    process.exit(0);
})();
