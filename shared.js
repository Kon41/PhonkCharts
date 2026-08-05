// =============================================================================
// PhonkCharts — shared.js
// Common utilities used across every page: data loading/caching, favorites
// storage, the single shared audio-preview player, toast notifications,
// small DOM helpers, and nav/install-prompt wiring.
// Loaded as an ES module by every page.
// =============================================================================

const DATA_URL = new URL('./songs.json', import.meta.url).href;
const FAVORITES_KEY = 'phonkcharts:favorites';

let songsCache = null;

/** Fetch (and cache in-memory) the full song catalog. */
export async function loadSongs() {
  if (songsCache) return songsCache;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Failed to load songs.json (${res.status})`);
  songsCache = await res.json();
  return songsCache;
}

export function getSongById(songs, id) {
  return songs.find((s) => s.id === id) || null;
}

// ---------------------------------------------------------------------------
// Favorites (localStorage)
// ---------------------------------------------------------------------------

export function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavoriteIds().includes(id);
}

export function toggleFavorite(id) {
  const ids = getFavoriteIds();
  const idx = ids.indexOf(id);
  if (idx === -1) {
    ids.push(id);
  } else {
    ids.splice(idx, 1);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  return ids.includes(id);
}

// ---------------------------------------------------------------------------
// Shared audio preview player — only one preview plays at a time, anywhere
// in the app. Buttons call playPreview(song, buttonEl) and this module
// handles swapping the active <audio>, updating icons, and stopping after
// 30s (or the source's natural end, whichever comes first).
// ---------------------------------------------------------------------------

const audioEl = new Audio();
let activeBtn = null;
let stopTimer = null;

function resetActiveButton() {
  if (activeBtn) {
    activeBtn.classList.remove('is-playing');
    const icon = activeBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = 'play_arrow';
  }
  activeBtn = null;
}

audioEl.addEventListener('ended', resetActiveButton);
audioEl.addEventListener('pause', () => {
  if (audioEl.currentTime === 0 || audioEl.ended) resetActiveButton();
});

export function playPreview(song, btnEl) {
  if (!song.preview) return;

  const isSameAndPlaying = activeBtn === btnEl && !audioEl.paused;
  clearTimeout(stopTimer);

  if (isSameAndPlaying) {
    audioEl.pause();
    resetActiveButton();
    return;
  }

  resetActiveButton();
  audioEl.src = song.preview;
  audioEl.currentTime = 0;
  audioEl.play().catch(() => {
    showToast('Preview unavailable right now');
  });

  activeBtn = btnEl;
  btnEl.classList.add('is-playing');
  const icon = btnEl.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = 'pause';

  // Hard-stop at 30s to respect the "30-second preview" requirement even
  // if the underlying audio file is longer.
  stopTimer = setTimeout(() => {
    audioEl.pause();
    resetActiveButton();
  }, 30000);
}

export function stopPreview() {
  clearTimeout(stopTimer);
  audioEl.pause();
  resetActiveButton();
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

export function showToast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = message;
  clearTimeout(toastTimer);
  requestAnimationFrame(() => el.classList.add('show'));
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------

export async function shareSong(song) {
  const url = `${location.origin}${location.pathname.replace(/[^/]+$/, '')}song.html?id=${encodeURIComponent(song.id)}`;
  const shareData = {
    title: `${song.title} — ${song.artist}`,
    text: `Check out "${song.title}" by ${song.artist} on PhonkCharts`,
    url,
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      /* user cancelled — no-op */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard');
  } catch {
    showToast(url);
  }
}

// ---------------------------------------------------------------------------
// Small DOM helpers
// ---------------------------------------------------------------------------

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export function categorySlug(cat) {
  return cat.toLowerCase().replace(/\s*\+\s*/g, '-').replace(/\s+/g, '-');
}

export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ---------------------------------------------------------------------------
// Nav highlighting — call once per page with the current page's key.
// ---------------------------------------------------------------------------

export function highlightNav(pageKey) {
  document.querySelectorAll(`[data-nav]`).forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === pageKey);
  });
}

// ---------------------------------------------------------------------------
// PWA install prompt
// ---------------------------------------------------------------------------

let deferredPrompt = null;

export function wireInstallPrompt() {
  const banner = document.querySelector('.install-banner');
  const btn = document.querySelector('.install-banner__btn');
  const dismiss = document.querySelector('.install-banner__dismiss');
  if (!banner) return;

  if (localStorage.getItem('phonkcharts:install-dismissed') === '1') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.classList.add('show');
  });

  btn?.addEventListener('click', async () => {
    banner.classList.remove('show');
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });

  dismiss?.addEventListener('click', () => {
    banner.classList.remove('show');
    localStorage.setItem('phonkcharts:install-dismissed', '1');
  });

  window.addEventListener('appinstalled', () => {
    banner.classList.remove('show');
  });
}

// ---------------------------------------------------------------------------
// Service worker registration
// ---------------------------------------------------------------------------

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    const swUrl = new URL('./service-worker.js', import.meta.url).href;
    navigator.serviceWorker.register(swUrl).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
