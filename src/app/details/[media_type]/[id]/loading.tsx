"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <div className="w-full min-h-screen bg-black pt-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8">
          {/* Poster Skeleton */}
          <div className="w-full">
            <Skeleton height={500} className="rounded-xl" />
          </div>

          {/* Info Skeleton */}
          <div className="space-y-6">
            <Skeleton width="60%" height={40} />
            <div className="flex gap-4">
              <Skeleton width={60} height={24} />
              <Skeleton width={60} height={24} />
              <Skeleton width={60} height={24} />
            </div>
            <Skeleton count={4} />
            
            <div className="pt-8">
              <Skeleton width={150} height={30} className="mb-4" />
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="min-w-[120px]">
                     <Skeleton circle width={80} height={80} />
                     <Skeleton width={100} className="mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
