const puppeteer = require('puppeteer');

async function analyze() {
  const browser = await puppeteer.launch({
    headless: true, // Headless for server environment
    defaultViewport: null,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  // Enable request interception
  await page.setRequestInterception(true);

  // Listen for all requests
  page.on('request', request => {
     const url = request.url();
     if (url.includes('disable-devtool')) {
         console.log('Blocking disable-devtool:', url);
         request.abort();
         return;
     }

     if (url.includes('.m3u8') || url.includes('master') || url.includes('playlist')) {
       console.log('POTENTIAL STREAM Request:', url);
     }
     
     request.continue();
  });
  
  page.on('response', async response => {
      const url = response.url();
      if (url.includes('.m3u8') || url.includes('master') || url.includes('playlist')) {
          console.log('POTENTIAL STREAM Response:', url);
          try {
              const text = await response.text();
              if (text.includes('#EXTM3U')) {
                  console.log('VERIFIED M3U8 Content!');
                  console.log(text.substring(0, 500));
              }
          } catch (e) {}
      }
  });

  try {
    const url = 'https://vidsrc-embed.ru/embed/movie?tmdb=1306368';
    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    console.log('Page loaded (domcontentloaded).');
    const content = await page.content();
    console.log('Page content length:', content.length);
    require('fs').writeFileSync('debug_page.html', content);

    console.log('Waiting for iframe...');
    await page.waitForSelector('iframe');
    
    // Wait for potential Turnstile reload
    console.log('Waiting 5s for stability...');
    await new Promise(r => setTimeout(r, 5000));

    // Re-query iframe
    const iframeElement = await page.waitForSelector('iframe', { timeout: 10000 });
    const iframe = await iframeElement.contentFrame();

    console.log('Iframe found.');
    
    // Wait for pl_but in the iframe
    try {
        console.log('Waiting for #pl_but...');
        await iframe.waitForSelector('#pl_but', { timeout: 10000 });
        console.log('#pl_but found. Clicking...');
        await iframe.click('#pl_but');
        console.log('Clicked #pl_but.');
    } catch (e) {
        console.log('Could not find or click #pl_but:', e.message);
        // Maybe it's hidden or we need to wait for Turnstile?
        // Let's take a screenshot
        await page.screenshot({ path: 'screenshot.png' });
        console.log('Screenshot saved to screenshot.png');
    }

    // Keep open for a bit to capture requests
    await new Promise(r => setTimeout(r, 20000));

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error_screenshot.png' });
    const content = await page.content();
    require('fs').writeFileSync('error_page.html', content);
  } finally {
    await browser.close();
  }
}

analyze();
