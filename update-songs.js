#!/usr/bin/env node
// =============================================================================
// scripts/update-songs.js
//
// Regenerates data/songs.json. Run manually with `node scripts/update-songs.js`
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
const SONGS_PATH = path.join(__dirname, '..', 'data', 'songs.json');

// eslint-disable-next-line no-unused-vars
const SONG_SHAPE_EXAMPLE = {
  id: 'pc-0001',
  title: 'Song Title',
  artist: 'Artist Name',
  category: 'Phonk',
  cover: 'https://example.com/cover.jpg',
  preview: 'https://example.com/preview.mp3', // or null if unavailable
  spotify: 'https://open.spotify.com/track/…',
  youtube: 'https://www.youtube.com/watch?v=…',
  appleMusic: 'https://music.apple.com/…',
  instagramAudio: 'https://www.instagram.com/reels/audio/…', // or null
  rank: 1,
  overallRank: 1,
  popularity: 87,
  releaseYear: 2026,
  duration: 142,
  trendingType: 'daily', // 'daily' | 'weekly' | 'monthly'
};

/**
 * PLACEHOLDER — swap this out for real API calls (see notes above).
 * Currently: loads the existing catalog and nudges popularity scores with
 * a small random walk, then re-derives rank/overallRank, so a scheduled
 * run produces a visibly "fresh" chart without needing external credentials.
 */
async function fetchLatestSongs(existingSongs) {
  const nudged = existingSongs.map((song) => {
    const delta = Math.round((Math.random() - 0.5) * 8); // ±4 popularity drift
    const popularity = Math.min(100, Math.max(30, song.popularity + delta));
    return { ...song, popularity };
  });
  return nudged;
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
