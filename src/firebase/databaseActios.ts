/* eslint-disable @typescript-eslint/no-unused-vars */
// Firebase has been removed - this file is kept for compatibility
// Replace with Clerk/MongoDB/Prisma later

import { MediaItem } from "@/data/HandleRequests";

export const addToFavorites = async (userId: string, item: MediaItem) => {
  // No-op - will be replaced with MongoDB/Prisma
};

export const removeFromFavorites = async (userId: string, itemId: number) => {
  // No-op - will be replaced with MongoDB/Prisma
};

export const checkIsFavorite = async (uid: string, movieId: number): Promise<boolean> => {
  return false;
};

export const addToRecentViews = async (userId: string, item: MediaItem) => {
  // No-op - will be replaced with MongoDB/Prisma
};
