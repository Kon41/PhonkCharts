#!/usr/bin/env node
// =============================================================================
// scripts/update-songs.js
//
// Regenerates songs.json. Run manually with `node update-songs.js`
// or on a schedule via .github/workflows/update-songs.yml.
//
// -----------------------------------------------------------------------------
// WIRING UP A REAL DATA SOURCE
// -----------------------------------------------------------------------------
// `fetchLatestSongs()` below is a PLACEHOLDER. There is no single public API
// that indexes "trending Instagram edit audio" — in practice you'd combine
// something like:
//   - Spotify Web API (audio features + playlist tracks for phonk/drift
//     playlists) — https://developer.spotify.com/documentation/web-api
//   - YouTube Data API (search + trending) for preview/cover metadata
//   - Your own manual curation feed (a simple JSON/CSV you maintain)
//
// To wire in a real source:
//   1. Add your API credentials as GitHub Actions secrets (never commit keys).
//   2. Replace the body of fetchLatestSongs() with real HTTP calls
//      (this repo has no runtime deps installed by default — `fetch` is
//      available natively in Node 18+, which the workflow below uses).
//   3. Map the response into the song shape used by the app (see
//      SONG_SHAPE_EXAMPLE below) and return an array of those objects.
//
// Until then, this script re-shuffles rank/popularity on the existing
// catalog so the "daily/weekly/monthly" charts visibly rotate — useful for
// demonstrating the automation without a live API key.
// =============================================================================

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_PATH = path.join(__dirname, 'songs.json');

/**
 * Fetches live track data from the Spotify Web API.
 */
async function fetchLatestSongs(existingSongs) {
  const clientId = '1ee2006efb53461986d8b055ce7f355c';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET; // Keep your secret secure in environment variables

  if (!clientId || !clientSecret) {
    console.warn("⚠️ API credentials not found. Using fallback mock data.");
    return existingSongs.map((song) => {
      const delta = Math.round((Math.random() - 0.5) * 8);
      return { ...song, popularity: Math.min(100, Math.max(30, song.popularity + delta)) };
    });
  }

  try {
    // 1. Get OAuth Access Token from Spotify
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch tracks from a specific playlist (Replace with your actual Spotify Playlist ID)
    const playlistId = 'YOUR_SPOTIFY_PLAYLIST_ID_HERE';
    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const playlistData = await playlistRes.json();

    // 3. Map Spotify's response into your app's song shape
    const updatedSongs = playlistData.items.map((item, index) => {
      const track = item.track;
      return {
        id: `sp-${track.id}`,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        category: 'Phonk',
        cover: track.album.images[0]?.url || null,
        preview: track.preview_url,
        spotify: track.external_urls.spotify,
        youtube: null,
        appleMusic: null,
        instagramAudio: null,
        rank: index + 1,
        overallRank: index + 1,
        popularity: track.popularity,
        releaseYear: new Date(track.album.release_date).getFullYear(),
        duration: Math.round(track.duration_ms / 1000),
        trendingType: 'daily',
      };
    });

    return updatedSongs;

  } catch (error) {
    console.error('Error fetching from Spotify API:', error);
    return existingSongs; 
  }
}

function recomputeRanks(songs) {
  for (const type of ['daily', 'weekly', 'monthly']) {
    const group = songs.filter((s) => s.trendingType === type).sort((a, b) => b.popularity - a.popularity);
    group.forEach((s, idx) => {
      s.rank = idx + 1;
    });
  }
  const overall = [...songs].sort((a, b) => b.popularity - a.popularity);
  overall.forEach((s, idx) => {
    s.overallRank = idx + 1;
  });
  return songs;
}

async function main() {
  const raw = await readFile(SONGS_PATH, 'utf-8');
  const existing = JSON.parse(raw);

  const updated = recomputeRanks(await fetchLatestSongs(existing));

  await writeFile(SONGS_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
  console.log(`Updated ${updated.length} songs in ${SONGS_PATH}`);
}

main().catch((err) => {
  console.error('update-songs failed:', err);
  process.exit(1);
});

