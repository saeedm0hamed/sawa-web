const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting extraction test...');
  const browser = await puppeteer.launch({
    headless: false, // Non-headless to see what happens
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Mask webdriver
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  // Enable request interception to block ads (Disabled for now)
  // await page.setRequestInterception(true);
  // page.on('request', (req) => { ... });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const targetUrl = 'https://player.autoembed.cc/embed/movie/1306368';
  console.log(`Navigating to ${targetUrl}`);
  
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Page loaded. Waiting for ad/video...');

    // Wait logic
    const findM3u8 = async () => {
      const src = await page.evaluate(() => {
          const playerContainer = document.querySelector('.player-container');
          if (!playerContainer) return null;
          const video = playerContainer.querySelector('video');
          if (!video) return null;
          const source = video.querySelector('source');
          if (!source) return null;
          return source.getAttribute('src');
      });
      return src;
    };

    // Poll for 60s
    for (let i = 0; i < 60; i++) {
        const src = await findM3u8();
        console.log(`[${i}s] Found src:`, src);
        
        // Core memory says real video often has 'xenna400goa' or 'stream2'
        // And phim1280 is definitely an ad.
        if (src && src.includes('.m3u8') && !src.includes('phim1280') && !src.includes('google') && (src.includes('xenna') || src.includes('stream') || src.includes('index'))) {
            // Check if it's the ad domain
             if (src.includes('phim1280')) {
                 console.log('Skipping ad source:', src);
             } else {
                 console.log('SUCCESS: Found POTENTIAL REAL m3u8:', src);
                 // break; 
             }
        }
        
        // Check for skip button by text content
        const skipBtn = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('div, button, span, a'));
            // Find button with "Skip" but NOT "after"
            const skip = buttons.find(b => {
                const text = b.innerText?.toLowerCase() || '';
                return text.includes('skip') && !text.includes('after') && (text.includes('ad') || text.includes('intro'));
            });
            if (skip) {
                skip.click();
                return skip.innerText;
            }
            return null;
        });

        if (skipBtn) {
            console.log(`Found skip button with text "${skipBtn}", clicking...`);
            await new Promise(r => setTimeout(r, 2000)); // wait for transition
        }

        await new Promise(r => setTimeout(r, 1000));
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    // await browser.close(); // Keep open to inspect if needed
    console.log('Done.');
    process.exit(0);
  }
})();
