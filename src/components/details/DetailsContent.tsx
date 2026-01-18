/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MediaItem } from "@/data/HandleRequests";
import { FullDetailsType } from "@/data/single_requests/fetch_details";

// UI Components
import { toast } from "sonner";
import InfoSection from "@/components/details/InfoSection";
import CastSection from "@/components/details/CastSection";
import SeasonsSection from "@/components/details/SeasonsSection";
import MediaSection from "@/components/details/MediaSection";
import ReviewsSection from "@/components/details/ReviewsSection";
import RecommendationSection from "@/components/details/RecommendationSection";

// Icons
import { CheckCircle, XCircle } from "lucide-react";

// Firebase removed - will be replaced with MongoDB/Prisma
import { addToFavorites, removeFromFavorites, checkIsFavorite, addToRecentViews } from "@/firebase/databaseActios";
import Footer from "../shared/footer";

export default function DetailsContent({ item }: { item: FullDetailsType }) {
  const { main, media, recommendation, reviews } = item;
  const [isMobile, setIsMobile] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Detect if device is mobile based on window width
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  // Auth state check - Firebase removed, will be replaced with Clerk
  useEffect(() => {
    // No user for now - will be replaced with Clerk
    setUser(null);
    setIsFavorite(false);
    setIsLoading(false);
    
    // TODO: When Clerk is integrated, check favorites here
    // const userId = clerkUser?.id;
    // if (userId) {
    //   const isFav = await checkIsFavorite(userId, main.id);
    //   setIsFavorite(isFav);
    //   await addToRecentViews(userId, mediaItem);
    // }
  }, [main]);

  // Toggle favorite status on click
  const toggleFavorite = async () => {
    // TODO: Replace with Clerk auth check
    // if (!clerkUser) return router.push(`/auth/login`);
    
    // For now, redirect to login if no user
    router.push(`/auth/login`);
    return;

    // TODO: When Clerk is integrated, uncomment this:
    // setIsLoading(true);
    // const userId = clerkUser.id;
    // const favoriteItem: MediaItem = { ... };
    // if (isFavorite) {
    //   await removeFromFavorites(userId, favoriteItem.id);
    //   setIsFavorite(false);
    //   toast.success("تمت الإزالة من المفضلة", { ... });
    // } else {
    //   await addToFavorites(userId, favoriteItem);
    //   setIsFavorite(true);
    //   toast.success("تمت الإضافة إلى المفضلة", { ... });
    // }
    // setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative z-0">

      <div className="absolute inset-0 -z-10">
        {(media.images?.[0]?.file_path || main.backdrop_blur_path) && (
          <Image
            src={`https://image.tmdb.org/t/p/w500${media.images?.[0]?.file_path || main.backdrop_blur_path
              }`}
            alt={main.name || main.title || "صورة"}
            fill
            sizes="100vw"
            priority
            className="object-cover saturate-400"
          />
        )}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
      </div>

      <main className="flex-1 w-full relative z-10">
        <InfoSection
          main={main}
          isLoading={isLoading}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          isMobile={isMobile}
        />

        <div className="mx-4 md:mx-8 flex flex-col gap-3 md:gap-5">
          <CastSection cast={media.cast} />
          <SeasonsSection seasons={main.seasons} />
          <MediaSection images={media.images} videos={media.videos} isMobile={isMobile} />
          <ReviewsSection reviews={reviews} isMobile={isMobile} />
          <RecommendationSection recommendation={recommendation} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
