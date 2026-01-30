/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
// import FetchUrl from '@/data/single_requests/fetch_url';
import PartyRoom from '@/components/watch/PartyRoom';
import FetchDetails, { FullDetailsType } from '@/data/single_requests/fetch_details';
import Image from 'next/image';

export default async function PartyPage({
  params,
}: {
  params: Promise<{ mediaType: string; tmdbId: string; partyId: string }>;
}) {
  const { mediaType, tmdbId, partyId } = await params;

  if (mediaType !== 'movie' && mediaType !== 'tv') return notFound();
  if (!/^\d+$/.test(tmdbId)) return notFound();

  // let url = null;
  // try {
  //   url = await FetchUrl(mediaType, tmdbId);
  // } catch (error) {
  //   console.error('Failed to fetch video URL:', error);
  // }

  const data: FullDetailsType | null = await FetchDetails(tmdbId, mediaType);

  if (!data) {
    notFound();
  }

  const { main, media } = data;

  return (
    <main className='min-h-screen pt-16 md:pt-24 px-4 md:px-8 py-6'>
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
      {/* <div className='w-full flex justify-center'>
        <Suspense fallback={<div className='w-full h-[60vh] animate-pulse bg-gray-800/50 rounded-lg' />}>
          <PartyRoom partyId={partyId} url={url} mediaType={mediaType} tmdbId={tmdbId} />
        </Suspense>
      </div> */}
    </main>
  );
}
