# PhonkCharts

A premium dark-theme PWA for browsing trending Instagram edit audio — Phonk, Brazilian Phonk, Drift, Sigma, Luxury, Car Edit, Anime, Funk, and Slowed + Reverb. Built with plain HTML, CSS, and vanilla JavaScript (ES modules) — no frameworks, no backend, no database. Deploys as-is to GitHub Pages.

## File layout — intentionally flat

Every file lives at the repo root (except `.github/workflows/`, which GitHub Actions requires). This is deliberate: GitHub's "Add file → Upload files" web UI drops folder structure when you drag individual files in, so a flat layout is the version that survives that workflow. If you push via `git` instead, folders would work fine too, but flat avoids the issue entirely.

```
index.html, search.html, categories.html, favorites.html, song.html   Pages
style.css                                                              Design system
shared.js, cards.js                                                    Shared logic (data, favorites, audio player, card/row renderers)
app.js, search.js, categories.js, favorites.js, song.js                Per-page logic
songs.json                                                             Song catalog (75 real tracks — see below)
update-songs.js                                                        Node script that regenerates songs.json
.github/workflows/update-songs.yml                                     Scheduled job (every 24h) that runs the script and commits
manifest.json, service-worker.js, icon-192.png, icon-512.png, icon-512-maskable.png   PWA install + offline support
preview-01.mp3 … preview-06.mp3                                        Placeholder preview audio (see below)
robots.txt, sitemap.xml                                                Basic SEO
```

## Running locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Service workers require `localhost` or HTTPS — `http.server` on localhost satisfies that.

## Deploying to GitHub Pages

1. Push every file at the repo root (keep it flat, per above) to your repository.
2. **Settings → Pages** → Source: your branch, folder `/ (root)`.
3. Visit `https://<username>.github.io/<repo>/`.
4. If your path differs from `kon41.github.io/phonkcharts/`, search-and-replace that URL across `index.html`, `search.html`, `categories.html`, `favorites.html`, `song.html`, `robots.txt`, and `sitemap.xml`.
5. Already have the app installed from an older version? The service worker version was bumped (`v1.1.0`) specifically so devices pick up this fix automatically on next load — no manual uninstall needed.

## About the song data

The catalog (`songs.json`) uses **75 real phonk / drift phonk / Brazilian phonk / funk track and artist names** (Kordhell, DVRST, Ghostface Playa, INTERWORLD, and others), gathered from public chart and playlist sources, rather than invented placeholders — so what you see is genuinely reflective of the scene.

Two things are still placeholders by necessity, since there's no licensed audio/API wired in:

- **Cover art** uses neutral `picsum.photos` placeholder images (no rights to real album art without a licensing deal).
- **Preview playback** plays one of 6 short original placeholder beats (`preview-01.mp3` … `preview-06.mp3`, synthesized locally, not the licensed track) — cycled across songs so "Play Preview" always produces real, audible sound instead of a dead button. The song page notes this under the preview button.
- **"Find Full Song" / external links** open a **search** on Spotify, YouTube, or Apple Music for that title + artist (guaranteed to work), rather than a direct deep link — direct links would need each platform's real catalog ID, which requires API credentials (see below).

### Wiring in the real thing

To move from "search links + placeholder previews" to actual streaming:

1. **Spotify Web API** — get a client ID/secret, look up each track, and you'll have real `preview_url` (30s clips Spotify licenses for exactly this) and direct track links.
2. **YouTube Data API** — search each title+artist to get a real video ID for direct links.
3. Store credentials as GitHub Actions secrets (never commit them) and wire them into `update-songs.js`'s `fetchLatestSongs()` — see the comments in that file for where to plug in real HTTP calls.

### Scheduled data refresh

`.github/workflows/update-songs.yml` runs daily (`workflow_dispatch` also lets you trigger it manually from the Actions tab) and commits a regenerated `songs.json` — currently it rotates popularity/rank on the existing 75 tracks so charts visibly shift. Swap in real API calls as above when you're ready for it to pull genuinely new tracks.

## Data model (`songs.json`)

```jsonc
{
  "id": "pc-0001",
  "title": "Murder in My Mind",
  "artist": "Kordhell",
  "category": "Phonk",
  "cover": "https://picsum.photos/seed/phonk1/500/500",
  "preview": "preview-01.mp3",           // relative filename — same-origin, always resolves
  "spotify": "https://open.spotify.com/search/…",
  "youtube": "https://www.youtube.com/results?search_query=…",
  "appleMusic": "https://music.apple.com/us/search?term=…",
  "instagramAudio": null,               // no reliable public search endpoint for this
  "rank": 16,             // rank within its trendingType group
  "overallRank": 46,      // rank across the whole catalog — powers Top 10/25/50/100
  "popularity": 60,
  "releaseYear": 2022,
  "duration": 145,        // seconds
  "trendingType": "daily" // "daily" | "weekly" | "monthly"
}
```

## Notes on scope

- **Icons**: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` are simple generated placeholders — replace with real branded icons before you care about home-screen polish.
- **Lighthouse**: the shell is built for a high score (minimal JS, lazy images, cache-first service worker, semantic HTML, ARIA labels) — run Lighthouse in Chrome DevTools once deployed to confirm and tune for your actual asset sizes.
