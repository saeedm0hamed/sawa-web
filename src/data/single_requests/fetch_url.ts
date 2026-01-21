"use server";

export default async function FetchUrl(mediaType: string, tmdb: string) {
    const baseUrl = (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');   
    const url = `${baseUrl}/api/extract?tmdb=${tmdb}&type=${mediaType}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.url);
} 

