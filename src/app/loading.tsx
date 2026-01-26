"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <div className="w-full min-h-screen bg-black p-4 md:p-8 space-y-8">
        {/* Hero Section Skeleton */}
        <div className="w-full h-[60vh] md:h-[80vh] rounded-2xl overflow-hidden relative">
          <Skeleton height="100%" className="absolute inset-0" />
        </div>

        {/* Sliders Skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton width={200} height={30} />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="min-w-[150px] md:min-w-[200px]">
                  <Skeleton height={300} className="rounded-xl" />
                  <Skeleton width="80%" className="mt-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}
