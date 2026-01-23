import { NextResponse } from 'next/server';
import { fetchFromTMDB } from '@/lib/tmdb';

// @ts-ignore
const createApi = require('torrent-search-api/createApi');
// @ts-ignore
const ThePirateBay = require('torrent-search-api/lib/providers/thepiratebay');

// Create API instance without auto-loading providers to avoid filesystem scanning issues in bundled environments
const TorrentSearchApi = createApi();
TorrentSearchApi.loadProvider(ThePirateBay);
TorrentSearchApi.enableProvider('ThePirateBay');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdbId');
  let name = '';
  const type = searchParams.get('type'); // 'movie' or 'tv'

  try {
    if (tmdbId && type) {
      try {
        const data = await fetchFromTMDB(`/${type}/${tmdbId}`);
        // For movies it's 'original_title' or 'title', for TV it's 'original_name' or 'name'
        // Prefer original_title/name for better torrent matching, but fallback to title/name
        if (type === 'movie') {
          name = data.original_title || data.title;
        } else {
          name = data.original_name || data.name;
        }
      } catch (err) {
        console.error('Failed to fetch from TMDB:', err);
        // Fallback to existing name if available, otherwise fail
      }
    }

    if (!name) {
      return NextResponse.json({ error: 'Name or TMDB ID is required' }, { status: 400 });
    }

    // Map type to category if possible, defaulting to 'Video'
    // Common categories in torrent-search-api for TPB: 'Video', 'Movies', 'TV'
    // However, to ensure broad coverage, 'Video' is often best.
    let category = 'Video';
    if (type === 'movie') {
      // Try to target movies if the library supports it, or stick to Video
      // TPB typically separates Movies and TV Shows.
      // We'll stick to 'Video' to avoid missing results if mapping is off,
      // but we could try 'Movies' if we wanted to be specific.
      // For now, let's use 'Video' and let the query do the work.
      category = 'Video';
    } else if (type === 'tv') {
      category = 'Video';
    }

    const torrents = await TorrentSearchApi.search(name, category, 100);

    const results = torrents.map((t: any) => ({
      title: t.title,
      size: t.size,
      seeds: t.seeds,
      peers: t.peers,
      magnet: t.magnet,
      quality: determineQuality(t.title),
      provider: t.provider
    }));

    // Sort by seeds descending
    results.sort((a: any, b: any) => b.seeds - a.seeds);

    // Filter to keep only one result per quality (the one with most seeds)
    const uniqueResults: any[] = [];
    const seenQualities = new Set();

    for (const result of results) {

        if (result.quality != 'Unknown' && !seenQualities.has(result.quality)) {
          uniqueResults.push(result);
          seenQualities.add(result.quality);
        }
    }

    return NextResponse.json({ results: uniqueResults });
  } catch (error: any) {
    console.error('Torrent search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search torrents' }, { status: 500 });
  }
}

function determineQuality(title: string): string {
    const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('2160p')) return '2160p';
  if (lowerTitle.includes('1080p')) return '1080p';
  if (lowerTitle.includes('720p')) return '720p';
  if (lowerTitle.includes('480p')) return '480p';
  if (lowerTitle.includes('cam')) return 'CAM';
  return 'Unknown';
}
