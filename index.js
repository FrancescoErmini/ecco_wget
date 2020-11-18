const express = require('express');
const randomUseragent = require('random-useragent');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')


const app = express();
puppeteer.use(StealthPlugin())

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';


app.get("/", async (request, response) => {
	try {
		const load_images = request.query.image;
		if ( load_images == 'true'){
			loadImages = true
		}
		else {
			loadImages = fal
		}

	    const browser = await puppeteer.launch({
	    	ignoreHTTPSErrors: true,
	    	headless: true,
            devtools: false,
            slowMo: 0,
	        args: ['--no-sandbox', '--lang=it-IT,it', '--disable-gpu','--no-sandbox','--no-zygote','--disable-setuid-sandbox','--disable-accelerated-2d-canvas','--disable-dev-shm-usage', "--proxy-server='direct://'", "--proxy-bypass-list=*"]

	    });
	    browser.on('disconnected', async () => {
            console.log("BROWSER CRASH");
        });


	    /* start options */

	    const userAgent = randomUseragent.getRandom();
        const UA = userAgent || USER_AGENT;
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920 + Math.floor(Math.random() * 100),
            height: 3000 + Math.floor(Math.random() * 100),
            deviceScaleFactor: 1,
            hasTouch: false,
            isLandscape: false,
            isMobile: false,
        });
        await page.setUserAgent(UA);
        await page.setJavaScriptEnabled(true);
        await page.setDefaultNavigationTimeout(0);
        if (!loadImages) {
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
                get: () => ['en-US', 'en'],
            });
        });

	    /* end options */

	    const req =  await page.goto(request.query.url,  { waitUntil: 'networkidle2', timeout: 0 }).then(() => {
	         console.log('success')
		}).catch((res) => {
		    console.log('fails', res)
		});
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


var listener = app.listen(4000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
