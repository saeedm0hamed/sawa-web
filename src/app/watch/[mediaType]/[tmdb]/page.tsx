import WatchPlayer from '@/components/details/WatchPlayer';
import FetchUrl from '@/data/single_requests/fetch_url';

type Params = {
  tmdb: string;
  mediaType: string;
};

export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const { mediaType, tmdb } = await params;
  const data = await FetchUrl(mediaType, tmdb);

  return <WatchPlayer url={data} autoplay controls />;
}
