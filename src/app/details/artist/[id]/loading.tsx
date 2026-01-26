"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <div className="w-full min-h-screen bg-black pt-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          {/* Profile Skeleton */}
          <div className="space-y-4 text-center md:text-left">
            <Skeleton circle width={200} height={200} className="mx-auto md:mx-0" />
            <Skeleton width={200} height={30} className="mx-auto md:mx-0" />
            <Skeleton width={150} className="mx-auto md:mx-0" />
            <div className="flex gap-4 justify-center md:justify-start pt-4">
               <Skeleton circle width={40} height={40} />
               <Skeleton circle width={40} height={40} />
               <Skeleton circle width={40} height={40} />
            </div>
          </div>

          {/* Filmography Skeleton */}
          <div className="space-y-8">
             {[1, 2].map((section) => (
                <div key={section}>
                   <Skeleton width={200} height={30} className="mb-4" />
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {[1, 2, 3, 4, 5].map((item) => (
                         <div key={item}>
                            <Skeleton height={250} className="rounded-xl" />
                            <Skeleton width="90%" className="mt-2" />
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
