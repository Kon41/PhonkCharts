# PhonkCharts

A premium dark-theme PWA for browsing trending Instagram edit audio — Phonk, Brazilian Phonk, Drift, Sigma, Luxury, Car Edit, Anime, Funk, and Slowed + Reverb. Built with plain HTML, CSS, and vanilla JavaScript (ES modules) — no frameworks, no backend, no database. Deploys as-is to GitHub Pages.

## What's inside

```
index.html          Home — Trending Today/Weekly/Monthly, categories, fresh drops, top overall
search.html          Live search by title / artist / category
categories.html      Category browser + Top 10/25/50/100 charts with sorting
favorites.html       Locally saved songs (localStorage)
song.html            Song detail — preview, full-song links, popularity, share

css/style.css        Full design system (dark neon "phonk/car-culture" theme)
js/shared.js         Data loading, favorites, shared audio-preview player, toasts, PWA install wiring
js/cards.js          Reusable song card / row renderers
js/app.js            Home page logic
js/search.js         Search page logic
js/categories.js     Categories + charts logic
js/favorites.js      Favorites page logic
js/song.js           Song detail logic

data/songs.json      Sample catalog (110 songs). Auto-refreshed by the GitHub Action.
scripts/update-songs.js   Node script that regenerates data/songs.json
.github/workflows/update-songs.yml   Scheduled job (every 24h) that runs the script and commits

manifest.json, service-worker.js, assets/icons/   PWA install + offline support
robots.txt, sitemap.xml                            Basic SEO
```

## Running locally

Any static file server works — the app uses `fetch()` for `data/songs.json`, so it won't load correctly from a `file://` URL.

```bash
# from the project folder
python3 -m http.server 8080
# then open http://localhost:8080
```

Service workers also require either `localhost` or HTTPS, which `http.server` on localhost satisfies.

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `phonkcharts`) or a folder inside your existing `kon41.github.io` repo.
2. Push this project's contents to the repository root (or to `/phonkcharts` if nesting inside `kon41.github.io`).
3. In the repo, go to **Settings → Pages**, set **Source** to the branch you pushed (usually `main`) and folder `/ (root)`.
4. Wait a minute for the first deploy, then visit:
   - `https://<username>.github.io/<repo>/` if it's its own repo, or
   - `https://kon41.github.io/phonkcharts/` if nested as in this README's default URLs.
5. **Update the URLs** in `index.html`, `search.html`, `categories.html`, `favorites.html`, `song.html`, `robots.txt`, and `sitemap.xml` — they currently assume `https://kon41.github.io/phonkcharts/`. Search-and-replace if your path differs.

### Enabling the scheduled data refresh

The workflow in `.github/workflows/update-songs.yml` runs daily and commits an updated `data/songs.json` using `permissions: contents: write` (no extra secrets needed for the placeholder version). It works out of the box, rotating popularity/rank so charts visibly change daily.

To wire in a **real** data source (Spotify/YouTube APIs, or your own curated feed):

1. Open `scripts/update-songs.js` and replace the body of `fetchLatestSongs()` with real HTTP calls (Node 18+ has native `fetch`).
2. Store any API keys as **repository secrets** (Settings → Secrets and variables → Actions) — never commit them.
3. Pass secrets into the workflow step via `env:` and read them with `process.env.YOUR_SECRET` in the script.

You can also trigger the workflow manually anytime from the **Actions** tab via "Run workflow" (`workflow_dispatch`).

## Data model (`data/songs.json`)

Each song object:

```jsonc
{
  "id": "pc-0001",
  "title": "Ghost Engine",
  "artist": "Ninebeats",
  "category": "Phonk",
  "cover": "https://…",
  "preview": "https://…mp3", // or null — Play Preview button disables itself
  "spotify": "https://open.spotify.com/track/…",
  "youtube": "https://www.youtube.com/watch?v=…",
  "appleMusic": "https://music.apple.com/…",
  "instagramAudio": "https://www.instagram.com/reels/audio/…", // or null
  "rank": 3,              // rank within its trendingType group
  "overallRank": 12,      // rank across the whole catalog — powers Top 10/25/50/100
  "popularity": 87,
  "releaseYear": 2026,
  "duration": 142,        // seconds
  "trendingType": "daily" // "daily" | "weekly" | "monthly"
}
```

Note: the sample catalog uses **fictional** song titles and artist names (e.g. "Ghost Engine" by "Ninebeats") rather than real chart data, since this is placeholder content for a demo. Swap in your real catalog whenever you're ready — the app makes no assumptions about the specific titles/artists, only the shape above.

## Notes on scope / what you'll likely want to adjust

- **Preview audio**: sample `preview` URLs are placeholders and won't actually play a 30-second phonk clip. Point them at real hosted MP3s (or `null` them out) before shipping.
- **Cover art**: uses `picsum.photos` placeholder images. Swap `cover` for your real artwork URLs.
- **Icons**: `assets/icons/*.png` are simple generated placeholders — replace with real branded icons (192×192, 512×512, and a 512×512 maskable version) before you care about home-screen polish.
- **Lighthouse**: the shell is built for a high score (minimal JS, lazy images, cache-first service worker, semantic HTML, ARIA labels) — run Lighthouse in Chrome DevTools once deployed to confirm and tune for your actual asset sizes (fonts/images are the usual culprits).
