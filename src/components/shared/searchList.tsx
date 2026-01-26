"use client"

// React
import { useCallback } from "react";

// Hooks
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

// App Components
import MediaCard from "@/components/shared/mediaCard";

// Types
import type { MediaItem } from "@/data/HandleRequests";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


export default function SearchList({ query }: { query: string }) {
  const fetchUrlBuilder = useCallback((page: number) => `/api/search?query=${query}&page=${page}`, [query])

  const { items, observerRef, loading } = useInfiniteScroll<MediaItem>(fetchUrlBuilder, [query])

  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      {loading && !items.length && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 md:gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-md overflow-hidden">
              <Skeleton height="100%" width="100%" />
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 md:gap-3">
        {items
          .filter(i => i.poster_path)
          .map(item => <MediaCard key={item.id} item={item} section />)}
        <div ref={observerRef} className="h-10" />
        {loading && items.length > 0 && Array.from({ length: 12 }).map((_, i) => (
          <div key={`loading-${i}`} className="aspect-[2/3] rounded-md overflow-hidden">
            <Skeleton height="100%" width="100%" />
          </div>
        ))}
      </div>
      {!loading && !items.length && <p className="text-white p-y-2 text-center">لا توجد بيانات لعرضها.</p>}
    </SkeletonTheme>
  )
}
