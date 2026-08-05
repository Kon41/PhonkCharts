// =============================================================================
// PhonkCharts — categories.js
// =============================================================================

import { loadSongs, highlightNav, wireInstallPrompt, registerServiceWorker, categorySlug } from './shared.js';
import { renderSongRow, renderRowSkeletons } from './cards.js';

const CATEGORIES = ['Phonk', 'Brazilian Phonk', 'Drift', 'Luxury', 'Car Edit', 'Sigma', 'Anime', 'Funk', 'Slowed + Reverb'];

highlightNav('categories');
wireInstallPrompt();
registerServiceWorker();

const chipsWrap = document.getElementById('category-chips');
const chartList = document.getElementById('chart-list');
const chartHeading = document.getElementById('chart-heading');
const chartTabs = document.getElementById('chart-tabs');
const sortSelect = document.getElementById('sort-select');
const clearCatBtn = document.getElementById('clear-category');

chartList.append(...renderRowSkeletons(8));

let allSongs = [];
let chartSize = 25;
let activeCategory = null; // null = all
let sortMode = 'rank';

function renderChips() {
  chipsWrap.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = 'chip' + (activeCategory === null ? ' active' : '');
  allChip.textContent = 'All Categories';
  allChip.addEventListener('click', () => {
    activeCategory = null;
    render();
  });
  chipsWrap.appendChild(allChip);

  CATEGORIES.forEach((cat) => {
    const b = document.createElement('button');
    b.className = 'chip' + (activeCategory === cat ? ' active' : '');
    b.textContent = cat;
    b.addEventListener('click', () => {
      activeCategory = cat;
      render();
    });
    chipsWrap.appendChild(b);
  });
}

function render() {
  renderChips();
  clearCatBtn.style.display = activeCategory ? 'inline-flex' : 'none';
  chartHeading.textContent = activeCategory ? `${activeCategory} · Top ${chartSize}` : `Top ${chartSize} Overall`;

  let items = activeCategory ? allSongs.filter((s) => s.category === activeCategory) : allSongs.slice();

  if (sortMode === 'popularity') {
    items.sort((a, b) => b.popularity - a.popularity);
  } else if (sortMode === 'newest') {
    items.sort((a, b) => b.releaseYear - a.releaseYear || b.popularity - a.popularity);
  } else {
    items.sort((a, b) => a.overallRank - b.overallRank);
  }

  items = items.slice(0, chartSize);

  chartList.innerHTML = '';
  if (!items.length) {
    chartList.innerHTML = '<div class="empty"><span class="material-symbols-outlined">graphic_eq</span><h3>Nothing charted yet</h3><p>Try a different category.</p></div>';
    return;
  }
  items.forEach((s, idx) => {
    chartList.appendChild(renderSongRow(s, { rankOverride: sortMode === 'rank' ? s.overallRank : idx + 1 }));
  });
}

chartTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-size]');
  if (!btn) return;
  chartSize = Number(btn.dataset.size);
  [...chartTabs.children].forEach((b) => {
    b.classList.toggle('active', b === btn);
    b.setAttribute('aria-selected', String(b === btn));
  });
  render();
});

sortSelect.addEventListener('change', () => {
  sortMode = sortSelect.value;
  render();
});

clearCatBtn.addEventListener('click', () => {
  activeCategory = null;
  render();
});

(async function init() {
  allSongs = await loadSongs();

  const params = new URLSearchParams(location.search);
  const catParam = params.get('cat');
  const chartParam = params.get('chart'); // e.g. top50
  if (catParam) {
    const match = CATEGORIES.find((c) => categorySlug(c) === catParam);
    if (match) activeCategory = match;
  }
  if (chartParam && /^top\d+$/.test(chartParam)) {
    const size = Number(chartParam.replace('top', ''));
    if ([10, 25, 50, 100].includes(size)) {
      chartSize = size;
      [...chartTabs.children].forEach((b) => {
        const on = Number(b.dataset.size) === size;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
    }
  }

  render();
})();
