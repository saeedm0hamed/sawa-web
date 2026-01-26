"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <div className="w-full min-h-screen bg-black pt-24 px-4 md:px-8">
         <div className="max-w-7xl mx-auto space-y-8">
            <Skeleton width={200} height={40} className="mb-8" />

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                  <div key={i}>
                     <Skeleton height={300} className="rounded-xl" />
                     <Skeleton width="80%" className="mt-2" />
                     <Skeleton width="40%" height={12} />
                  </div>
               ))}
            </div>
         </div>
      </div>
    </SkeletonTheme>
  );
}
