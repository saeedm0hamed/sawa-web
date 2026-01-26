import { notFound } from 'next/navigation';
import FetchUrl from '@/data/single_requests/fetch_url';
import WatchPlayer from '@/components/watch/WatchPlayer';
import PartyControls from '@/components/watch/PartyControls';

export default async function WatchPage({ params }: { params: Promise<{ mediaType: string; tmdbId: string }> }) {
  const { mediaType, tmdbId } = await params;

  if (mediaType !== 'movie' && mediaType !== 'tv') return notFound();
  if (!/^\d+$/.test(tmdbId)) return notFound();

  const url = await FetchUrl(mediaType, tmdbId);

  if (!url) {
    notFound();
  }

  return (
    <main className='min-h-screen pt-16 md:pt-24 px-4 md:px-8 py-6'>
      <div className='w-full flex flex-col items-center gap-6'>
        <WatchPlayer url={url} controls autoplay />
        
        <div className="w-full max-w-4xl border-t border-gray-800 pt-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                Watch Together
            </h2>
            <PartyControls mediaType={mediaType} tmdbId={tmdbId} />
        </div>
      </div>
    </main>
  );
}