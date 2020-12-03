const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';
const randomUseragent = require('random-useragent');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());



const PORT = 3000;
const HOST = '0.0.0.0';

const DEBUG = true;

app.post('/', async function (request, response) {
    
    const target_url = request.body.url;
    // Collect options or set default values
    const load_images = request.body.load_images || false;
    const custom_js = request.body.custom_js || false;
    const wait_until = request.body.wait_until || 'networkidle2';
    const viewport = request.body.viewport || '1920x3000';
    const viewport_width = parseInt(viewport.split('x')[0]);
    const viewport_height = parseInt(viewport.split('x')[1]);
    const headless = request.body.headless || true;
    const language = request.body.language || 'en';
    const language_country = request.body.language || 'en-US';
    const user_agent = request.body.user_agent || USER_AGENT;
    
    // TODO: check if file exists
    console.log("target url: " + target_url);
    if ( DEBUG ) {
        console.log("custom_js: " + custom_js);
        console.log("load_images: " + load_images);
        console.log("wait_until: " + wait_until);
        console.log("viewport_width: " + viewport_width);
        console.log("viewport_height: " + viewport_height);
        console.log("headless: " + headless);
        console.log("language: " + language);
        console.log("language_country: " + language_country);
    }
    

	try {
		
	    const browser = await puppeteer.launch({
	    	ignoreHTTPSErrors: true,
	    	headless: true,
            devtools: false,
            slowMo: 0,
	        args: ['--no-sandbox', 
                    '--lang='+language_country+','+language,  // '--lang=it-IT,it'
                    '--disable-gpu',
                    '--no-sandbox',
                    '--no-zygote',
                    '--disable-setuid-sandbox',
                    '--disable-accelerated-2d-canvas',
                    '--disable-dev-shm-usage', 
                    "--proxy-server='direct://'", 
                    "--proxy-bypass-list=*"
                ]
	    });
	    //browser.on('disconnected', async () => {
        //    console.log("");
        //});

	    /* start options */

        const page = await browser.newPage();
        await page.setViewport({
            width: viewport_width + Math.floor(Math.random() * 100),
            height: viewport_height + Math.floor(Math.random() * 100),
            deviceScaleFactor: 1,
            hasTouch: false,
            isLandscape: false,
            isMobile: false,
        });
        await page.setUserAgent(user_agent);
        await page.setJavaScriptEnabled(true);
        await page.setDefaultNavigationTimeout(0);
        if (!load_images) {
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
                    req.abort();
                } else {
                    req.continue();
                }
            });
        }

        await page.evaluateOnNewDocument(() => {
            //pass webdriver check
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });

        await page.evaluateOnNewDocument(() => {
            //pass chrome check
            window.chrome = {
                runtime: {},
                // etc.
            };
        });

        await page.evaluateOnNewDocument(() => {
            //pass plugins check
            const originalQuery = window.navigator.permissions.query;
            return window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        });

        await page.evaluateOnNewDocument(() => {
            // Overwrite the `plugins` property to use a custom getter.
            Object.defineProperty(navigator, 'plugins', {
                // This just needs to have `length > 0` for the current test,
                // but we could mock the plugins too if necessary.
                get: () => [1, 2, 3, 4, 5],
            });
        });

        await page.evaluateOnNewDocument(() => {
            // Overwrite the `plugins` property to use a custom getter.
            Object.defineProperty(navigator, 'languages', {
                // TODO: some post suggest that this is not an array, it is a string. 
                get: () => [language_country, language],
            });
        });

	    /* end options */

	    const req =  await page.goto(target_url,  { waitUntil: wait_until, timeout: 0 }).then(() => {
	         console.log('success')
		}).catch((res) => {
		    console.log('fails', res)
		});

        if ( custom_js ) {
            await page.addScriptTag({ path: './js/'+custom_js+'.js' });
        }

        const data = await page.evaluate(() => document.querySelector('*').outerHTML);
	    await page.close();
	    await browser.close();
	    response.set('Content-Type', 'text/plain');
	    response.send(data);
		
	} catch (error) {
	    console.log(error);
	    response.set('Content-Type', 'text/plain');
	    response.send('error');
    }

});


var listener = app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
