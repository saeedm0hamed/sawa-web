import { notFound } from "next/navigation";
import FetchDetails from "@/data/single_requests/fetch_details";
import WatchPlayer from "@/components/details/WatchPlayer";

type Params = {
  id: string;
  media_type: string;
};

type SearchParams = {
  room?: string;
};

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id, media_type } = await params;
  const { room } = await searchParams;

  if (media_type !== "movie" && media_type !== "tv") return notFound();

  const data = await FetchDetails(id, media_type);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white pt-16 md:pt-24 px-4 md:px-8">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-4">
        <h1 className="text-xl md:text-2xl font-bold">
          {data.main.title || data.main.name}
        </h1>
        <WatchPlayer
          tmdbId={data.main.id}
          mediaType={media_type === "movie" ? "movie" : "tv"}
          initialRoomId={room}
        />
      </div>
    </div>
  );
}

