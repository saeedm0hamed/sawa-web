/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

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

  const targetUrl = (type == 'movie' ? `https://multiembed.mov/?video_id=${tmdb}&tmdb=1` : `https://multiembed.mov/directstream.php?video_id=${tmdb}&tmdb=1&s=1&e=1`)
    let browser: any = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

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

        page.on('request', request => {
            const url = request.url();
            // Block anti-debugging scripts
            if (url.includes('disable-devtool')) {
                // console.log('Blocking disable-devtool:', url);
                request.abort();
                return;
            }

            if (url.includes('.m3u8')) {
                console.log('Detected .m3u8 request:', url);
                if (!m3u8Url) {
                    m3u8Url = url;
                }
            } else {
                // Log other requests to see what's happening
                if (!url.match(/\.(png|jpg|jpeg|gif|css|js|woff|woff2)$/)) {
                     console.log('Request:', url);
                }
            }

            // Prefer the concrete .quibblezoomfable.com index.m3u8 URL if it appears
            if (url.includes('quibblezoomfable.com') && url.includes('/index.m3u8')) {
                console.log('Found preferred index.m3u8 request:', url);
                m3u8Url = url;
            } 
            
            request.continue();
        });

        console.log('Navigating to:', targetUrl);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // Wait for loader and play button
        try {
            console.log('Waiting for .main-loader-inner...');
            await page.waitForSelector('.main-loader-inner', { timeout: 10000 });
            
            console.log('Waiting for .play-button...');
            const playButton = await page.waitForSelector('.play-button', { timeout: 5000 });
            
            if (playButton) {
                console.log('Found play button, waiting 5s just in case...');
                await new Promise(r => setTimeout(r, 5000));
                
                console.log('Clicking .play-button...');
                await playButton.click();
                
                console.log('Clicked. Waiting 10s...');
                await new Promise(r => setTimeout(r, 10000));
                
                // Check if a new tab was opened (likely an ad or the actual video player)
                const pages = await browser.pages();
                console.log(`Open pages: ${pages.length}`);
                
                let mainPage = page;
                let bestScore = -1;

                // Find the best page
                for (let i = 0; i < pages.length; i++) {
                    const p = pages[i];
                    const url = p.url();
                    let score = 0;
                    
                    if (url.includes('streamingnow') || url.includes('autoembed')) score += 10;
                    if (url === 'about:blank') score -= 10;
                    
                    // Check for video element
                    try {
                        const hasVideo = await p.evaluate(() => !!document.querySelector('video'));
                        if (hasVideo) score += 20;
                    } catch (e) {}

                    console.log(`Page ${i}: ${url} (Score: ${score})`);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        mainPage = p;
                    }
                }

                // Close other pages
                for (const p of pages) {
                    if (p !== mainPage) {
                        console.log(`Closing other tab: ${p.url()}`);
                        try {
                            await p.close();
                        } catch (e) {
                            console.log('Error closing tab:', e.message);
                        }
                    }
                }

                await mainPage.bringToFront();
                console.log('Refocused on main page:', mainPage.url());

                // Attach interceptor to the chosen main page if not already attached
                if (mainPage !== page) {
                     try {
                         await mainPage.setRequestInterception(true);
                         mainPage.on('request', request => {
                             if (request.isInterceptResolutionHandled()) return;
                             const url = request.url();
                             if (url.includes('.m3u8')) {
                                 console.log(`Detected .m3u8 request in main page:`, url);
                                 m3u8Url = url;
                             }
                             request.continue();
                         });
                     } catch (e) {
                          console.log('Failed to attach interceptor to new main page:', e.message);
                     }
                }

                // Check for video element in main page
                let videoSrc = await mainPage.evaluate(() => {
                    const v = document.querySelector('video');
                    return v ? v.src : null;
                });
                console.log('Video src on main page:', videoSrc);

                if (videoSrc && (videoSrc.includes('.m3u8') || videoSrc.includes('blob:'))) {
                     console.log('Found video src in main frame:', videoSrc);
                     if (videoSrc.includes('.m3u8')) {
                         m3u8Url = videoSrc;
                     }
                }

                if (!m3u8Url) {
                    // Try clicking again if no video found (sometimes first click opens ad, second plays video)
                    console.log('No video found, trying to click play button again...');
                    try {
                        const playButton = await mainPage.$('.play-button, .jw-display-icon-container, video, .captcha-button, .play');
                        if (playButton) {
                            console.log('Clicking play/captcha button again...');
                            await playButton.click();
                            await new Promise(r => setTimeout(r, 5000));
                        } else {
                             // Try clicking center of screen
                             console.log('No play button found, clicking center of screen...');
                             const viewport = await mainPage.viewport();
                             if (viewport) {
                                 await mainPage.mouse.click(viewport.width / 2, viewport.height / 2);
                                 await new Promise(r => setTimeout(r, 5000));
                             }
                        }
                    } catch (e) {
                        console.log('Error clicking again:', e.message);
                    }
                    
                    // Check video src again
                    videoSrc = await mainPage.evaluate(() => {
                        const v = document.querySelector('video');
                        return v ? v.src : null;
                    });
                    console.log('Video src after second click:', videoSrc);
                    if (videoSrc && videoSrc.includes('.m3u8')) {
                        m3u8Url = videoSrc;
                    }
                }

                if (!m3u8Url) {
                    console.log('Checking frames for video...');
                    const frames = mainPage.frames();
                    console.log(`Found ${frames.length} frames`);
                    
                    for (const frame of frames) {
                        console.log(`Checking frame: ${frame.url()}`);
                        try {
                            const frameVideoSrc = await frame.evaluate(() => {
                                const v = document.querySelector('video');
                                return v ? v.src : null;
                            });
                            
                            if (frameVideoSrc) {
                                console.log(`Found video in frame ${frame.url()}: ${frameVideoSrc}`);
                                if (frameVideoSrc.includes('.m3u8')) {
                                    m3u8Url = frameVideoSrc;
                                    break;
                                }
                            }
                        } catch (e) {
                            console.log(`Error checking frame ${frame.url()}: ${e.message}`);
                        }
                    }
                }

                if (!m3u8Url) {
                    // Dump HTML for debugging
                    const html = await mainPage.content();
                    console.log('Main Page HTML (first 2000 chars):', html.substring(0, 2000));
                    
                    // Also dump frames HTML
                    /*
                    const frames = mainPage.frames();
                    for (const frame of frames) {
                        try {
                            const frameHtml = await frame.content();
                            console.log(`Frame ${frame.url()} HTML (first 500 chars):`, frameHtml.substring(0, 500));
                        } catch (e) {}
                    }
                    */
                }
            }
        } catch (e) {
            console.log('Play button interaction failed:', e.message);
        }

        // Wait for m3u8 to be captured
        const startTime = Date.now();
        while (!m3u8Url && Date.now() - startTime < 15000) {
            await new Promise(r => setTimeout(r, 500));
        }

        if (m3u8Url) {
            return NextResponse.json({
                success: true,
                url: m3u8Url
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