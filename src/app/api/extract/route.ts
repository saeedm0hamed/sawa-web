import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

export const maxDuration = 60; // Set timeout to 60 seconds for Vercel

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tmdb = searchParams.get('tmdb');
    const type = searchParams.get('type');
    
    if (!type) {
        return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
    }
    if (!tmdb) {
        return NextResponse.json({ error: 'Missing tmdb parameter' }, { status: 400 });
    }

    const targetUrl = `https://player.autoembed.cc/embed/${type}/${tmdb}`;
    let browser: any = null;

    try {
        const isLocal = process.env.NODE_ENV === 'development';
        
        if (isLocal) {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            });
        } else {
            browser = await puppeteerCore.launch({
                args: [...chromium.args, '--disable-blink-features=AutomationControlled'],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
        }

        const page = await browser.newPage();
        
        // Stealth mode: Hide webdriver
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

        // Enable request interception
        await page.setRequestInterception(true);

        let m3u8Url = null;
        let m3u8Content = null;

        page.on('request', request => {
            const url = request.url();
            // Block anti-debugging scripts
            if (url.includes('disable-devtool')) {
                console.log('Blocking disable-devtool:', url);
                request.abort();
                return;
            }

            // Prefer the concrete .quibblezoomfable.com index.m3u8 URL if it appears
            if (url.includes('quibblezoomfable.com') && url.includes('/index.m3u8')) {
                console.log('Found preferred index.m3u8 request:', url);
                m3u8Url = url;
            } 
            
            request.continue();
        });

        // Capture response content for m3u8
        page.on('response', async response => {
             const url = response.url();
             if (url === m3u8Url || (url.includes('.m3u8') && !m3u8Content)) {
                 try {
                     const text = await response.text();
                     if (text.includes('#EXTM3U')) {
                         m3u8Content = text;
                         m3u8Url = url; // Ensure we have the correct URL
                     }
                 } catch (e) {}
             }
        });

        console.log('Navigating to:', targetUrl);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // Wait for iframe
        try {
            console.log('Waiting for iframe...');
            const iframeElement = await page.waitForSelector('iframe', { timeout: 15000 });
            if (iframeElement) {
                // Wait a bit for stability
                await new Promise(r => setTimeout(r, 2000));
                
                // Re-query iframe handle as it might have changed
                const iframeElement2 = await page.$('iframe');
                if (iframeElement2) {
                    const iframe = await iframeElement2.contentFrame();
                    if (iframe) {
                        console.log('Iframe found, looking for #pl_but...');
                        try {
                            await iframe.waitForSelector('#pl_but', { timeout: 5000 });
                            console.log('Clicking #pl_but...');
                            await iframe.click('#pl_but');
                        } catch (e) {
                            console.log('Could not click #pl_but (might be hidden or already playing):', e.message);
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Iframe wait failed:', e.message);
        }

        // Wait for m3u8 to be captured
        const startTime = Date.now();
        while (!m3u8Url && Date.now() - startTime < 17000) {
            await new Promise(r => setTimeout(r, 500));
        }

        if (m3u8Url) {
            return NextResponse.json({
                success: true,
                url: m3u8Url,
                content: m3u8Content
            });
        } else {
            return NextResponse.json({ error: 'Failed to extract m3u8' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Extraction error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
