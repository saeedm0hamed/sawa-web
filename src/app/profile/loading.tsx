"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <div className="w-full min-h-screen bg-black pt-24 px-4 md:px-8 max-w-4xl mx-auto">
         <div className="flex flex-col items-center gap-6">
            <Skeleton circle width={120} height={120} />
            <Skeleton width={200} height={32} />
            
            <div className="w-full max-w-md space-y-4 mt-8">
               <Skeleton height={50} className="rounded-lg" />
               <Skeleton height={50} className="rounded-lg" />
               <Skeleton height={50} className="rounded-lg" />
               <Skeleton height={50} className="rounded-lg" />
            </div>
         </div>
      </div>
    </SkeletonTheme>
  );
}
