const axios = require('axios');

async function fetchConfig() {
    const url = 'https://cloudnestra.com/f59d610a61063c7ef3ccdc1fd40d2ae6.js?_=1768651834';
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://cloudnestra.com/' // Approximate referer
            }
        });
        const content = response.data;
        console.log('Content length:', content.length);
        
        const matches = content.match(/'([a-zA-Z0-9+/=]+)'/g);
        if (matches) {
            console.log('Found matches:', matches.length);
            matches.forEach(m => {
                const b64 = m.replace(/'/g, '');
                try {
                    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
                    // Print if it looks like a domain or contains v1/tmstr
                    if (decoded.includes('.') && !decoded.includes(' ') && decoded.length > 5) {
                         console.log('Potential Domain:', decoded);
                    }
                    if (decoded.includes('tmstr')) {
                        console.log('TMSTR Match:', decoded);
                    }
                } catch (e) {}
            });
        }
    } catch (e) {
        console.error(e.message);
    }
}

fetchConfig();
