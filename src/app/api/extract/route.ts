/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium-min';
import puppeteerCore from 'puppeteer-core';

// Helper to validate TMDB ID
const isValidTmdb = (id: string) => /^\d+$/.test(id);

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type');
  const tmdb = searchParams.get('tmdb');

  // 1. Validate parameters
  if (!type || !['movie', 'tv'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type. Must be "movie" or "tv"' }, { status: 400 });
  }
  if (!tmdb || !isValidTmdb(tmdb)) {
    return NextResponse.json({ error: 'Invalid tmdb. Must be a numeric ID' }, { status: 400 });
  }
// https://multiembed.mov/?video_id=385687&tmdb=1
  const targetUrl = `https://player.autoembed.cc/embed/${type}/${tmdb}`;
  let browser;

  try {
    // 5. Setup Browser (Vercel vs Local)
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Dynamic import for local dev to avoid bundling puppeteer in production if not needed
      // although it's in dependencies, keeping it clean is good.
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } else {
      // Production (Vercel)
      // Configure sparticuz/chromium
      chromium.setGraphicsMode = false;
      
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      });
    }

    const page = await browser.newPage();

    // 6. Handle disable-devtool & Anti-bot
    // Mask webdriver
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Set User Agent to look like a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Go to the page
    // Using networkidle0 to ensure initial assets are loaded
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Remove vidsrc-player element as requested
    await page.evaluate(() => {
      const el = document.getElementById('vidsrc-player');
      if (el) el.remove();
    });

    // 3. Handle page interaction sequence
    // Wait for the ad / main player logic
    // The prompt says "Wait for the 15-second ad to complete"
    // We can poll for the video source.
    
    // Define a function to find the correct m3u8
    const findM3u8 = async () => {
      // Wait up to 60 seconds for the real video source to appear
      const maxRetries = 20; 
      const interval = 1000; // 1 second

      for (let i = 0; i < maxRetries; i++) {
        // Check for player container and video source
        const src = await page.evaluate(() => {
            const playerContainer = document.querySelector('.player-container');
            if (!playerContainer) return null;

            const video = playerContainer.querySelector('video');
            if (!video) return null;

            const source = video.querySelector('source');
            if (!source) return null;
            
            return source.getAttribute('src');
        });

        if (src && src.includes('.m3u8')) {
           // 4. Extract and Filter
           // Filter out known ad domains
          //  if (!src.includes('phim1280') && !src.includes('google') && !src.includes('promo')) {
          //    // Optional: Check for known content patterns if possible, but exclusion is safer
             return src;
          //  }
        }
        
        // Try to click skip button if present
        // try {
        //     const clicked = await page.evaluate(() => {
        //         const buttons = Array.from(document.querySelectorAll('div, button, span, a'));
        //         // Find button with "Skip" but NOT "after" (to avoid "Skip after 5s")
        //         const skip = buttons.find(b => {
        //             const text = b.innerHTML?.toLowerCase() || '';
        //             return text.includes('skip') && !text.includes('after') && (text.includes('ad') || text.includes('intro'));
        //         });
        //         if (skip) {
        //             skip.click();
        //             return true;
        //         }
        //         return false;
        //     });
            
        //     if (clicked) {
        //         // Wait a bit for transition
        //         await new Promise(r => setTimeout(r, 2000));
        //     }
        // } catch (e) {
        //     // ignore
        // }
        
        // Wait 1s
        await new Promise(r => setTimeout(r, interval));
      }
      return null;
    };

    // Wait for a bit initially to let the page load fully
    await new Promise(r => setTimeout(r, 2000));
    
    // Try to find the m3u8
    const m3u8Url = await findM3u8();
    
    if (m3u8Url) {
      return NextResponse.json({ url: m3u8Url }, { status: 200 });
    } else {
      // 7. Error handling - Timeout/Content not found
      // Take a screenshot for debugging (optional, can't return image easily here but could log base64)
      // console.log('Failed to extract. Page content:', await page.content());
      return NextResponse.json({ error: 'Content not found or timeout' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Processing error', details: error.message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}