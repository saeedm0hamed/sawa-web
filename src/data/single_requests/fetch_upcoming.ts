"use server";
import HandleRequests, { MediaItem } from "@/data/HandleRequests";

export default async function FetchUpcoming(): Promise<MediaItem[]> {
  return await HandleRequests(
    "/movie/upcoming",
    `&language=en`);
}