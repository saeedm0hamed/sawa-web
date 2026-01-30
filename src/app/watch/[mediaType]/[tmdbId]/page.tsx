/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
// import FetchUrl from '@/data/single_requests/fetch_url';
import FetchDetails, { FullDetailsType } from '@/data/single_requests/fetch_details';
import WatchPlayer from '@/components/watch/WatchPlayer';
import PartyControls from '@/components/watch/PartyControls';
import Image from 'next/image';

export default async function WatchPage({ params }: { params: Promise<{ mediaType: string; tmdbId: string }> }) {
  const { mediaType, tmdbId } = await params;

  if (mediaType !== 'movie' && mediaType !== 'tv') return notFound();
  if (!/^\d+$/.test(tmdbId)) return notFound();

  // const url = await FetchUrl(mediaType, tmdbId);
  const data: FullDetailsType | null = await FetchDetails(tmdbId, mediaType);

  if (!data) {
    notFound();
  }

  const { main, media } = data;

  return (
    <main className='min-h-screen pt-24 md:pt-24 px-4 md:px-8 py-6'>
      <div className='absolute inset-0 -z-10'>
        {(media.images?.[0]?.file_path || main.backdrop_blur_path) && (
          <Image
            src={`https://image.tmdb.org/t/p/w500${media.images?.[0]?.file_path || main.backdrop_blur_path}`}
            alt={main.name || main.title || 'صورة'}
            fill
            sizes='100vw'
            priority
            className='object-cover saturate-400'
          />
        )}
        <div className='absolute inset-0 bg-black/60 backdrop-blur-3xl' />
      </div>

      {/* <div className='w-full flex flex-col items-center gap-6'>
        <WatchPlayer url={url} controls autoplay />

        <div className='w-full max-w-4xl pt-6'>
          <div className='w-full h-0.5 bg-primary/50 rounded-full mb-2'></div>
          <Suspense fallback={<div className='h-20 w-full animate-pulse bg-gray-800/50 rounded-lg' />}>
            <PartyControls mediaType={mediaType} tmdbId={tmdbId} />
          </Suspense>
        </div>
      </div> */}
    </main>
  );
}
