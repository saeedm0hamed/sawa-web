"use server";
import { fetchFromTMDB } from "@/lib/tmdb";
import getGenreNames from "@/data/local_functions/genres";

export interface MediaItem {
  id: number;
  title_ar: string;
  title_en: string;
  original_language: string;
  overview: string;
  genre_ids: string[];
  backdrop_path: string;
  poster_path: string;
  release_date: string;
  type: string;
  vote_average: number;
  [key: string]: any;
}

// Helper function to check if media has any female cast members
async function hasFemaleCast(mediaId: number, mediaType: "movie" | "tv"): Promise<boolean> {
  try {
    const credits = await fetchFromTMDB(`/${mediaType}/${mediaId}/credits`, "&language=en");
    return credits.cast?.some((c: any) => c.gender === 1) || false;
  } catch (e) {
    return false; // If fetch fails, assume no female cast to avoid excluding valid items
  }
}

export default async function HandleRequests(path: string, query: string): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(path, query);
  let data = res.results || res.cast;
  
  // First filter: remove items without poster or with romance genre
  data = data.filter((i: { poster_path: string; genre_ids?: number[] }) => 
    i.poster_path && !i.genre_ids?.includes(10749)
  );
  
  // Second filter: remove items with female cast
  const filteredItems = [];
  for (const item of data) {
    const mediaType = item.media_type === "movie" || item.release_date ? "movie" : "tv";
    const hasFemale = await hasFemaleCast(item.id, mediaType);
    if (!hasFemale) {
      filteredItems.push(item);
    }
  }

  return filteredItems.map((item: any) => ({
    id: item.id,
    title_ar: item.title || item.name, // movie or series ar name
    title_en: item.original_title || item.original_name, // movie or series en name
    original_language: item.original_language,
    overview: item.overview,
    genre_ids: getGenreNames(item.genre_ids || []),
    backdrop_path: item.backdrop_path || item.poster_path,
    poster_path: item.poster_path || item.backdrop_path,
    release_date: item.release_date || item.first_air_date,
    type: item.media_type === "movie" || item.release_date ? "فيلم" : "مسلسل",
    vote_average: item.vote_average,
  }));
}
