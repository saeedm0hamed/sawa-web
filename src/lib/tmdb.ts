import { notFound } from "next/navigation";

export async function fetchFromTMDB(endpoint: string, query = "") {
  const API_KEY = process.env.TMDB_API_KEY;
  const BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

  // Guard against missing configuration to avoid invalid URL errors
  if (!API_KEY) {
    throw new Error("TMDB_API_KEY is not set. Please add it to your environment.");
  }

  const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}${query ? `${query}` : ""}`;

  const res = await fetch(url, { next: { revalidate: 84000 } });

  if (!res.ok) notFound();

  return res.json();
}
