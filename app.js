// =============================================================================
// PhonkCharts — app.js (Home page)
// =============================================================================

import { loadSongs, highlightNav, wireInstallPrompt, registerServiceWorker, categorySlug } from './shared.js';
import { renderSongCard, renderSongRow, renderCardSkeletons, renderRowSkeletons } from './cards.js';

const CATEGORIES = ['Phonk', 'Brazilian Phonk', 'Drift', 'Luxury', 'Car Edit', 'Sigma', 'Anime', 'Funk', 'Slowed + Reverb'];

highlightNav('home');
wireInstallPrompt();
registerServiceWorker();

const trendingRail = document.getElementById('trending-rail');
const newestRail = document.getElementById('newest-rail');
const topList = document.getElementById('top-list');
const chipsWrap = document.getElementById('category-chips');
const trendingTabs = document.getElementById('trending-tabs');

trendingRail.append(...renderCardSkeletons(6));
newestRail.append(...renderCardSkeletons(6));
topList.append(...renderRowSkeletons(6));

let allSongs = [];
let currentTrendingType = 'daily';

function renderTrendingRail() {
  const items = allSongs
    .filter((s) => s.trendingType === currentTrendingType)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 20);
  trendingRail.innerHTML = '';
  if (!items.length) {
    trendingRail.appendChild(emptyRail());
    return;
  }
  trendingRail.append(...items.map((s) => renderSongCard(s)));
}

function emptyRail() {
  const d = document.createElement('div');
  d.className = 'empty';
  d.style.width = '100%';
  d.innerHTML = '<span class="material-symbols-outlined">graphic_eq</span><h3>Nothing here yet</h3><p>Check back after the next chart update.</p>';
  return d;
}

function renderChips() {
  chipsWrap.innerHTML = '';
  CATEGORIES.forEach((cat) => {
    const a = document.createElement('a');
    a.className = 'chip';
    a.textContent = cat;
    a.href = `categories.html?cat=${encodeURIComponent(categorySlug(cat))}`;
    chipsWrap.appendChild(a);
  });
}

function renderNewest() {
  const items = [...allSongs].sort((a, b) => b.releaseYear - a.releaseYear || b.popularity - a.popularity).slice(0, 20);
  newestRail.innerHTML = '';
  newestRail.append(...items.map((s) => renderSongCard(s, { showBadge: false })));
}

function renderTopOverall() {
  const items = [...allSongs].sort((a, b) => a.overallRank - b.overallRank).slice(0, 10);
  topList.innerHTML = '';
  items.forEach((s) => topList.appendChild(renderSongRow(s, { rankOverride: s.overallRank })));
}

trendingTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-type]');
  if (!btn) return;
  currentTrendingType = btn.dataset.type;
  [...trendingTabs.children].forEach((b) => {
    b.classList.toggle('active', b === btn);
    b.setAttribute('aria-selected', String(b === btn));
  });
  renderTrendingRail();
});

(async function init() {
  try {
    allSongs = await loadSongs();
    renderTrendingRail();
    renderChips();
    renderNewest();
    renderTopOverall();
  } catch (err) {
    console.error(err);
    trendingRail.innerHTML = '<div class="empty"><span class="material-symbols-outlined">error</span><h3>Could not load charts</h3><p>Check your connection and try again.</p></div>';
  }
})();
