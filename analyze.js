const axios = require('axios');
const cheerio = require('cheerio');

async function analyze() {
  const url = 'https://vidsrc-embed.ru/embed/movie?tmdb=1306368';
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log('Status:', response.status);
    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log('Title:', $('title').text());
    console.log('Has #pl_but:', $('#pl_but').length > 0);
    console.log('Body length:', html.length);
    // Check for iframes
     $('iframe').each((i, el) => {
         const src = $(el).attr('src');
         console.log('Iframe src:', src);
         if (src && src.startsWith('//')) {
             const iframeUrl = 'https:' + src;
             console.log('Fetching iframe:', iframeUrl);
             axios.get(iframeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Referer': url,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'iframe',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'cross-site',
                    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"'
                }
             }).then(res => {
                 console.log('Iframe Status:', res.status);
                const iframeHtml = res.data;
                require('fs').writeFileSync('iframe.html', iframeHtml);
                console.log('Saved iframe.html');
                const $iframe = cheerio.load(iframeHtml);
                 console.log('Iframe Title:', $iframe('title').text());
                 console.log('Iframe has #pl_but:', $iframe('#pl_but').length > 0);
                 $iframe('script').each((j, s) => {
                     const sSrc = $iframe(s).attr('src');
                     if (sSrc) {
                         console.log('Iframe Script src:', sSrc);
                     } else {
                        const content = $iframe(s).html();
                         if (content && content.includes('pl_but')) {
                             console.log('--- Inline Script with pl_but ---');
                             const idx = content.indexOf('pl_but');
                             const start = Math.max(0, idx - 500);
                             const end = Math.min(content.length, idx + 2000);
                             console.log(content.substring(start, end));
                             console.log('--- End Inline Script ---');

                              // Extract /prorcp/ URL
                              const match = content.match(/src:\s*'(\/prorcp\/[^']+)'/);
                              if (match) {
                                  const prorcpPath = match[1];
                                  const prorcpUrl = 'https://cloudnestra.com' + prorcpPath;
                                  console.log('Found prorcp URL:', prorcpUrl);
                                  
                                  axios.get(prorcpUrl, {
                                      headers: {
                                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                          'Referer': iframeUrl
                                      }
                                  }).then(res2 => {
                                      console.log('Prorcp Status:', res2.status);
                                      const html2 = res2.data;
                console.log('Prorcp HTML Length:', html2.length);
                // console.log('Prorcp HTML:', html2); 
                
                // Check for variable definitions like var v1 = ... or window.v1 = ...
                const varMatch = html2.match(/(?:var|const|let|window\.)\s*(v\d+)\s*=\s*['"]([^'"]+)['"]/g);
                if (varMatch) {
                    console.log('Found variable definitions:', varMatch);
                }

                const $2 = cheerio.load(html2);
                                      // Search for m3u8 in the final page
                                       if (html2.includes('.m3u8')) {
                                            console.log('FOUND M3U8 in Prorcp response!');
                                            const idx = html2.indexOf('.m3u8');
                                            const start = Math.max(0, idx - 500);
                                            const end = Math.min(html2.length, idx + 500);
                                            console.log('Context:', html2.substring(start, end));
                                        }

                                        // Search for document.write script
                                         const docWriteMatch = html2.match(/document\.write\("<script[^>]+src='([^']+)'/);
                                         if (docWriteMatch) {
                                             const configScriptPath = docWriteMatch[1];
                                             const configScriptUrl = 'https://cloudnestra.com' + configScriptPath;
                                             console.log('Found config script:', configScriptUrl);
                                             
                                             axios.get(configScriptUrl, {
                                                headers: {
                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                                    'Referer': prorcpUrl
                                                }
                                             }).then(res3 => {
                                                 console.log('Config Script Status:', res3.status);
                                                 // console.log('Config Script Content:', res3.data);
                                                 const content3 = res3.data;
                                                 const matches = content3.match(/'([a-zA-Z0-9+/=]+)'/g);
                                                 if (matches) {
                                                     matches.forEach(m => {
                                                         const b64 = m.replace(/'/g, '');
                                                         try {
                                                             const decoded = Buffer.from(b64, 'base64').toString('utf-8');
                                                             if (decoded.includes('quibblezoomfable') || decoded.includes('tmstr')) {
                                                                 console.log('Decoded match:', decoded);
                                                             }
                                                         } catch (e) {}
                                                     });
                                                 }
                                             }).catch(err => console.error('Error fetching config script:', err.message));
                                         }


                                         // Fetch pjs_main_drv_cast script
                                         const pjsScriptUrl = 'https://cloudnestra.com/pjs/pjs_main_drv_cast.261225.js?_=1766737926';
                                         console.log('Fetching pjs script:', pjsScriptUrl);
                                         axios.get(pjsScriptUrl, {
                                             headers: {
                                                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                                 'Referer': prorcpUrl
                                             }
                                         }).then(res4 => {
                                             console.log('PJS Script Status:', res4.status);
                                             const pjsContent = res4.data;
                                             // Search for {v1} replacement logic
                                             if (pjsContent.includes('{v1}')) {
                                                 console.log('Found {v1} in PJS script.');
                                             }
                                             // Look for domain lists
                                             const potentialDomains = pjsContent.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g);
                                             if (potentialDomains) {
                                                // console.log('Potential domains in PJS:', potentialDomains.slice(0, 20));
                                             }
                                             
                                             // Print snippets around "replace" or "{v"
                                             const replaceIdx = pjsContent.indexOf('replace');
                                             if (replaceIdx !== -1) {
                                                 // console.log('Context around replace:', pjsContent.substring(replaceIdx - 100, replaceIdx + 100));
                                             }
                                             
                                         }).catch(err => console.error('Error fetching PJS script:', err.message));
                                         
                                         // Search for definitions of v1, v2, etc.
                                        if (html2.includes('{v1}')) {
                                            console.log('Found {v1} placeholder.');
                                        }
                                        
                                        // Print all scripts to find the mapping
                                        $2('script').each((k, s2) => {
                                            const s2Src = $2(s2).attr('src');
                                            if (s2Src) {
                                                // console.log('Prorcp Script src:', s2Src);
                                            } else {
                                                const content2 = $2(s2).html();
                                                console.log('--- Inline Script Prorcp ---');
                                                console.log(content2.substring(0, 1000));
                                                console.log('--- End Inline Script Prorcp ---');
                                            }
                                        });
                                      
                                      // Check scripts in prorcp
                                       $2('script').each((k, s2) => {
                                            const s2Src = $2(s2).attr('src');
                                            if (s2Src) console.log('Prorcp Script src:', s2Src);
                                            const content2 = $2(s2).html();
                                            if (content2 && content2.includes('player.source')) {
                                                console.log('Found player.source:', content2);
                                            }
                                       });

                                  }).catch(err => console.error('Error fetching prorcp:', err.message));
                              }
                          }
                      }
                  });
             }).catch(err => {
                 console.error('Error fetching iframe:', err.message);
             });
         }
     });
    
    // Look for any scripts that might handle the click
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      if (src) console.log('Script src:', src);
      // const content = $(el).html();
      // if (content && content.includes('pl_but')) {
      //   console.log('Script with pl_but logic:', content.substring(0, 200));
      // }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyze();
