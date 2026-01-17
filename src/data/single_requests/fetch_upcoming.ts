"use server";
import HandleRequests, { MediaItem } from "@/data/HandleRequests";

export default async function FetchUpcoming(): Promise<MediaItem[]> {
  return await HandleRequests(
    "/movie/upcoming",
    `&region=EG&language=en-EG&sort_by=popularity.desc`);
}
