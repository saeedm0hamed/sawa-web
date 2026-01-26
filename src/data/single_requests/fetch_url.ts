"use server";

export default async function FetchUrl(mediaType: string, tmdb: string) {
    try {
        const baseUrl = (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const url = `${baseUrl}/api/extract?tmdb=${tmdb}&type=${mediaType}`;
        
        const res = await fetch(url, { cache: 'no-store' });
        
        if (!res.ok) {
            console.error(`FetchUrl failed: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();
        return data.url || null;
    } catch (error) {
        console.error("FetchUrl error:", error);
        return null;
    }
} 

