// =============================================================================
// PhonkCharts — song.js (Song detail page)
// =============================================================================

import {
  loadSongs,
  getSongById,
  isFavorite,
  toggleFavorite,
  playPreview,
  shareSong,
  formatDuration,
  el,
  wireInstallPrompt,
  registerServiceWorker,
  showToast,
} from './shared.js';

wireInstallPrompt();
registerServiceWorker();

document.getElementById('back-btn').addEventListener('click', () => {
  if (document.referrer && document.referrer.includes(location.origin)) {
    history.back();
  } else {
    location.href = 'index.html';
  }
});

const content = document.getElementById('song-content');

function externalLinkRow(label, url, icon) {
  if (!url) return null;
  return el(
    'a',
    { class: 'ext-link', href: url, target: '_blank', rel: 'noopener noreferrer' },
    [el('span', { class: 'material-symbols-outlined' }, icon), label]
  );
}

function render(song) {
  document.getElementById('doc-title').textContent = `${song.title} — ${song.artist} | PhonkCharts`;
  document.getElementById('meta-desc').setAttribute('content', `Listen to "${song.title}" by ${song.artist} — ${song.category} track trending on PhonkCharts.`);

  const fav = isFavorite(song.id);

  const favBtn = el(
    'button',
    {
      class: 'btn btn--icon' + (fav ? ' is-active' : ''),
      'aria-label': fav ? 'Remove from favorites' : 'Add to favorites',
      onclick: () => {
        const nowFav = toggleFavorite(song.id);
        favBtn.classList.toggle('is-active', nowFav);
        favBtn.querySelector('.material-symbols-outlined').textContent = nowFav ? 'favorite' : 'favorite_border';
        showToast(nowFav ? 'Added to favorites' : 'Removed from favorites');
      },
    },
    el('span', { class: 'material-symbols-outlined' }, fav ? 'favorite' : 'favorite_border')
  );

  const previewBtn = el(
    'button',
    {
      class: 'btn btn--primary',
      onclick: () => {
        if (!song.preview) return;
        playPreview(song, previewBtn);
      },
    },
    [el('span', { class: 'material-symbols-outlined' }, 'play_arrow'), song.preview ? 'Play Preview' : 'Preview Unavailable']
  );
  if (!song.preview) previewBtn.setAttribute('disabled', '');

  const shareBtn = el(
    'button',
    { class: 'btn btn--ghost', onclick: () => shareSong(song) },
    [el('span', { class: 'material-symbols-outlined' }, 'ios_share'), 'Share']
  );

  const fullSongBtn = el(
    'a',
    { class: 'btn btn--ghost', href: song.spotify || song.youtube || song.appleMusic, target: '_blank', rel: 'noopener noreferrer' },
    [el('span', { class: 'material-symbols-outlined' }, 'open_in_new'), 'Listen Full Song']
  );

  const links = [
    externalLinkRow('Spotify', song.spotify, 'graphic_eq'),
    externalLinkRow('YouTube', song.youtube, 'smart_display'),
    externalLinkRow('Apple Music', song.appleMusic, 'music_note'),
    externalLinkRow('Instagram Audio', song.instagramAudio, 'photo_camera'),
  ].filter(Boolean);

  content.innerHTML = '';
  content.append(
    el('div', { class: 'detail-hero' }, [
      el('div', { class: 'detail-hero__art' }, el('img', { src: song.cover, alt: `${song.title} cover art` })),
      el('h1', { class: 'detail-hero__title' }, song.title),
      el('p', { class: 'detail-hero__artist' }, song.artist),

      el('div', { class: 'detail-stats' }, [
        el('span', { class: 'stat-pill' }, [el('span', { class: 'material-symbols-outlined' }, 'category'), song.category]),
        el('span', { class: 'stat-pill' }, [el('span', { class: 'material-symbols-outlined' }, 'emoji_events'), `Rank #${song.overallRank}`]),
        el('span', { class: 'stat-pill' }, [el('span', { class: 'material-symbols-outlined' }, 'calendar_today'), String(song.releaseYear)]),
        el('span', { class: 'stat-pill' }, [el('span', { class: 'material-symbols-outlined' }, 'schedule'), formatDuration(song.duration)]),
      ]),

      el('div', { style: 'width:100%;max-width:320px;display:flex;flex-direction:column;gap:6px;align-items:center;' }, [
        el('div', { class: 'popularity-bar' }, el('div', { class: 'popularity-bar__fill', style: `width:${song.popularity}%` })),
        el('span', { style: 'font-size:11.5px;color:var(--ink-dim);' }, `Popularity score: ${song.popularity}/100`),
      ]),

      el('div', { class: 'detail-actions' }, [previewBtn, fullSongBtn, favBtn, shareBtn]),
    ]),
    el('div', { class: 'section' }, el('h2', { class: 'section__title' }, 'Listen Elsewhere')),
    el('div', { class: 'external-links' }, links.length ? links : el('p', { style: 'color:var(--ink-faint);grid-column:1/-1;text-align:center;' }, 'No external links available.'))
  );
}

function renderNotFound() {
  content.innerHTML = '';
  content.appendChild(
    el('div', { class: 'empty', style: 'padding-top:80px;' }, [
      el('span', { class: 'material-symbols-outlined' }, 'search_off'),
      el('h3', {}, 'Track not found'),
      el('p', {}, 'This song may have rotated out of the chart.'),
      el('a', { class: 'btn btn--primary', href: 'index.html', style: 'margin-top:16px;' }, 'Back to Home'),
    ])
  );
}

(async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const songs = await loadSongs();
  const song = id ? getSongById(songs, id) : null;
  if (!song) {
    renderNotFound();
    return;
  }
  render(song);
})();
