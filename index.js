const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';
const randomUseragent = require('random-useragent');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { assert } = require('puppeteer/lib/cjs/puppeteer/common/assert');
puppeteer.use(StealthPlugin());



const PORT = 3000;
const HOST = '0.0.0.0';

const DEBUG = true;


app.get('/', function(req, res) {
  res.send('OK');
});


function query2bool(value) {
  return ((value+'').toLowerCase() === 'true')
}

const myWaitFor = function(timeToWait) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, timeToWait);
    });
  };


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
    const language_country = request.body.language_country || 'en-US';
    const user_agent = request.body.user_agent || USER_AGENT;
    const pagination = request.body.pagination || null;
    
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
        await page.setCacheEnabled( false );
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
	    /*
		Page.goto in case of redirects it will return the last redirected url.
	    */
	    await page.goto(target_url,  { waitUntil: wait_until, timeout: 0 }).then(() => {
	         console.log('success')
		}).catch((res) => {
			/**
			page.goto fails if:
				there's an SSL error (e.g. in case of self-signed certificates).
				target URL is invalid.
				timeout is exceeded during navigation.
				the remote server does not respond or is unreachable. the main resource failed to load.
			**/
		    console.log('failed request');
            console.log(res);
		    return response.status(600).send('error');
		});

		// if ( 400 <= resp.status() < 600 ) {
		// 	console.log('failed response');
		//     return response.status(resp.status()).send('error');
		// }
        
        

        // PAGINATION NAV: CLICK ON LINK, THEN GET THAT PAGE IN RETURN
        if ( pagination ) {
            
            const myselector = pagination.value.trim();
            //const myselector = myselector2.trim();
            console.log(myselector);
            await page.waitFor(500);
            try {
                //const pageTarget = page.target();
                await Promise.all([
                    await page.waitForSelector(myselector),
                    await page.evaluate((selector) => document.querySelector(selector).click(), myselector), 
                    await page.waitFor(1000),
                    // await page.screenshot({path: 'example7.png'})

                ]);
                    //get list of open tabs (does not include new tab)
                const pages = await browser.pages();

                //prints 2 although there are 3 tabs
                console.log(pages.length); 

                // get the new page
                const page2 = pages[pages.length - 1]; 
                
                if ( custom_js ) {
                    await page2.addScriptTag({ path: './js/'+custom_js+'.js' });
                }
                const dat = await page2.evaluate(() => document.querySelector('*').outerHTML);
                response.set('Content-Type', 'text/plain');
                response.send(dat);

                //const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget); //check that you opened this page, rather than just checking the url
                //const newPage = await newTarget.page(); //get the page object
                //await newPage.waitForSelector("body"); //wait for page to be loaded

            } catch (error) {

                console.log("error clicking " + myselector + " : " + error );
                throw error;
            }
                    
            
        }

        else {
            var data = await page.evaluate(() => document.querySelector('*').outerHTML);
            response.set('Content-Type', 'text/plain');
	        response.send(data);
        } 
        await page.close();
	    await browser.close();
	    //response.set('Content-Type', 'text/plain');
	    //response.send(data);
		
	} catch (error) {
	    console.log(error);
	    response.set('Content-Type', 'text/plain');
	    response.status(520).send('error'+error);
    }

});


var listener = app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
