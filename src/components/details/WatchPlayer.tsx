"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

type WatchPlayerProps = {
  url: string;
  autoplay?: boolean;
  controls?: boolean;
  poster?: string;
};

export default function WatchPlayer({ url, autoplay = false, controls = true, poster }: WatchPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: Hls | null = null;
    let canPlayListenerAttached = false;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
    }

    const handleCanPlay = () => {
      video.play().catch(() => undefined);
    };

    if (autoplay) {
      if (video.readyState >= 2) {
        video.play().catch(() => undefined);
      } else {
        video.addEventListener("canplay", handleCanPlay);
        canPlayListenerAttached = true;
      }
    }

    return () => {
      if (canPlayListenerAttached && video) {
        video.removeEventListener("canplay", handleCanPlay);
      }
      if (hls) {
        hls.destroy();
      }
    };
  }, [url, autoplay]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <video
        ref={videoRef}
        className="w-full rounded-lg bg-black"
        controls={controls}
        poster={poster}
        playsInline
      />
    </div>
  );
}
