/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

export default async function FetchUrl(mediaType: string, tmdb: string) {
    // try {
    //     const baseUrl = (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    //     const url = `${baseUrl}/api/extract?tmdb=${tmdb}&type=${mediaType}`;
        
    //     const res = await fetch(url, { cache: 'no-store' });
        
    //     if (!res.ok) {
    //         console.error(`FetchUrl failed: ${res.status} ${res.statusText}`);
    //         return null;
    //     }

    //     const data = await res.json();
    //     return data.url || null;
    // } catch (error) {
    //     console.error("FetchUrl error:", error);
    //     return null;
    // }
    return "https://cdn30092.vekna402las.com/stream2/i-arch-400/c4a924b3e8d15fed6861f9f5af6505c2/MJTMsp1RshGTygnMNRUR2N2MSlnWXZEdMNDZzQWe5MDZzMmdZJTO1R2RWVHZDljekhkSsl1VwYnWtx2cihVT21kaOtmTXlVeNdUSxo1RKxWTEd2dNdlVr1UbGtWWtZ1aPREaop1VNBTTykVP:1769604436:104.164.55.17:36fb5dba8e0dc41a45a96c75cbececb83b18e3cfe9565c994b7eee5b5ec25c25:=0EVBBDTqVkMONENx40U0gnT31TP/1080/index.m3u8";
} 

