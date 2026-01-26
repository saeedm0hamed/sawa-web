"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
         <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
               <Skeleton width={200} height={30} />
               <Skeleton width={300} />
            </div>
            
            <div className="space-y-4">
               <Skeleton height={50} className="rounded-lg" />
               <Skeleton height={50} className="rounded-lg" />
            </div>
         </div>
      </div>
    </SkeletonTheme>
  );
}
