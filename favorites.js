// =============================================================================
// PhonkCharts — favorites.js
// =============================================================================

import { loadSongs, getFavoriteIds, highlightNav, wireInstallPrompt, registerServiceWorker } from './shared.js';
import { renderSongRow, renderRowSkeletons } from './cards.js';

highlightNav('favorites');
wireInstallPrompt();
registerServiceWorker();

const listEl = document.getElementById('favorites-list');
const countEl = document.getElementById('fav-count');

listEl.append(...renderRowSkeletons(4));

let allSongs = [];

function render() {
  const favIds = getFavoriteIds();
  const items = favIds.map((id) => allSongs.find((s) => s.id === id)).filter(Boolean);

  listEl.innerHTML = '';
  countEl.textContent = items.length ? `${items.length} saved track${items.length === 1 ? '' : 's'}` : 'Saved locally on this device.';

  if (!items.length) {
    listEl.innerHTML =
      '<div class="empty"><span class="material-symbols-outlined">favorite_border</span><h3>No favorites yet</h3><p>Tap the heart on any track to save it here.</p></div>';
    return;
  }

  items
    .sort((a, b) => a.overallRank - b.overallRank)
    .forEach((s) => listEl.appendChild(renderSongRow(s, { rankOverride: s.overallRank })));
}

document.addEventListener('favorites:changed', render);

(async function init() {
  allSongs = await loadSongs();
  render();
})();
