import { notFound } from 'next/navigation';
import FetchUrl from '@/data/single_requests/fetch_url';
import PartyRoom from '@/components/watch/PartyRoom';

export default async function PartyPage({
  params,
}: {
  params: Promise<{ mediaType: string; tmdbId: string; partyId: string }>;
}) {
  const { mediaType, tmdbId, partyId } = await params;

  if (mediaType !== 'movie' && mediaType !== 'tv') return notFound();
  if (!/^\d+$/.test(tmdbId)) return notFound();

  let url = null;
  try {
    url = await FetchUrl(mediaType, tmdbId);
  } catch (error) {
    console.error('Failed to fetch video URL:', error);
  }

  return (
    <main className='min-h-screen pt-16 md:pt-24 px-4 md:px-8 py-6'>
      <div className='w-full flex justify-center'>
        <PartyRoom partyId={partyId} url={url} mediaType={mediaType} tmdbId={tmdbId} />
      </div>
    </main>
  );
}
