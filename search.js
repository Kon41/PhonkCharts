// =============================================================================
// PhonkCharts — search.js
// Live search by title / artist / category, plus quick category chips.
// =============================================================================

import { loadSongs, highlightNav, wireInstallPrompt, registerServiceWorker, debounce } from './shared.js';
import { renderSongCard, renderCardSkeletons } from './cards.js';

highlightNav('search');
wireInstallPrompt();
registerServiceWorker();

const input = document.getElementById('search-input');
const resultsEl = document.getElementById('results');
const countEl = document.getElementById('result-count');
const chips = document.getElementById('quick-filters');

resultsEl.append(...renderCardSkeletons(8));

let allSongs = [];
let activeFilter = 'all';

function runSearch() {
  const q = input.value.trim().toLowerCase();

  let items = allSongs;
  if (activeFilter !== 'all') {
    items = items.filter((s) => s.category === activeFilter);
  }
  if (q) {
    items = items.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }
  items = items.slice().sort((a, b) => a.overallRank - b.overallRank);

  resultsEl.innerHTML = '';

  if (!q && activeFilter === 'all') {
    countEl.textContent = 'Start typing to find a track.';
    resultsEl.appendChild(promptState());
    return;
  }

  if (!items.length) {
    countEl.textContent = 'No results found.';
    resultsEl.appendChild(emptyState());
    return;
  }

  countEl.textContent = `${items.length} result${items.length === 1 ? '' : 's'}`;
  resultsEl.append(...items.map((s) => renderSongCard(s, { showBadge: false })));
}

function emptyState() {
  const d = document.createElement('div');
  d.className = 'empty';
  d.style.gridColumn = '1/-1';
  d.innerHTML = '<span class="material-symbols-outlined">search_off</span><h3>No matches</h3><p>Try a different song, artist, or category.</p>';
  return d;
}

function promptState() {
  const d = document.createElement('div');
  d.className = 'empty';
  d.style.gridColumn = '1/-1';
  d.innerHTML = '<span class="material-symbols-outlined">graphic_eq</span><h3>Find your next drop</h3><p>Search by song title, artist, or pick a category below.</p>';
  return d;
}

input.addEventListener('input', debounce(runSearch, 150));

chips.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  [...chips.children].forEach((c) => c.classList.toggle('active', c === btn));
  runSearch();
});

(async function init() {
  allSongs = await loadSongs();

  // Support ?q= and ?cat= deep links (e.g. from category chips elsewhere)
  const params = new URLSearchParams(location.search);
  const catParam = params.get('cat');
  const qParam = params.get('q');
  if (qParam) input.value = qParam;
  if (catParam) {
    const match = [...chips.children].find((c) => c.dataset.filter.toLowerCase().replace(/\s+/g, '-') === catParam);
    if (match) {
      activeFilter = match.dataset.filter;
      [...chips.children].forEach((c) => c.classList.toggle('active', c === match));
    }
  }

  runSearch();
  if (qParam || catParam) input.focus();
})();
