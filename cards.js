// =============================================================================
// PhonkCharts — cards.js
// Renders song "cards" (rail/grid) and "rows" (list) — the two reusable
// presentation units used across Home, Search, Categories, and Favorites.
// =============================================================================

import { el, formatDuration, isFavorite, toggleFavorite, playPreview, shareSong, showToast } from './shared.js';

function badgeLabel(song) {
  if (song.rank <= 3) return '#' + song.rank;
  if (song.overallRank && song.overallRank <= 10) return 'Top 10';
  return null;
}

/** Card used in horizontal rails / grid layouts. */
export function renderSongCard(song, { showBadge = true } = {}) {
  const fav = isFavorite(song.id);
  const badge = showBadge ? badgeLabel(song) : null;

  const playBtn = el(
    'button',
    {
      class: 'song-card__play',
      'aria-label': song.preview ? `Play preview of ${song.title}` : `Preview unavailable for ${song.title}`,
      onclick: (e) => {
        e.stopPropagation();
        if (!song.preview) {
          showToast('No preview available for this track');
          return;
        }
        playPreview(song, playBtn);
      },
    },
    el('span', { class: 'material-symbols-outlined', 'aria-hidden': 'true' }, 'play_arrow')
  );
  if (!song.preview) playBtn.setAttribute('disabled', '');

  const card = el(
    'article',
    { class: 'song-card', tabindex: '0', role: 'link', 'aria-label': `${song.title} by ${song.artist}` },
    [
      el('div', { class: 'song-card__art' }, [
        el('img', { src: song.cover, alt: '', loading: 'lazy', width: '168', height: '168' }),
        el('span', { class: 'song-card__rank' }, '#' + song.rank),
        badge ? el('span', { class: 'song-card__badge' }, badge) : null,
        playBtn,
      ]),
      el('div', { class: 'song-card__body' }, [
        el('p', { class: 'song-card__title' }, song.title),
        el('p', { class: 'song-card__artist' }, song.artist),
        el('span', { class: 'song-card__cat' }, song.category),
      ]),
    ]
  );

  const goToDetail = () => {
    window.location.href = `song.html?id=${encodeURIComponent(song.id)}`;
  };
  card.addEventListener('click', goToDetail);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetail();
    }
  });

  return card;
}

/** Compact list row used on chart / favorites / search pages. */
export function renderSongRow(song, { rankOverride = null, topThreshold = 3 } = {}) {
  const fav = isFavorite(song.id);
  const rankVal = rankOverride ?? song.rank;

  const favBtn = el(
    'button',
    {
      class: 'btn btn--icon btn--sm' + (fav ? ' is-active' : ''),
      'aria-label': fav ? `Remove ${song.title} from favorites` : `Add ${song.title} to favorites`,
      onclick: (e) => {
        e.stopPropagation();
        const nowFav = toggleFavorite(song.id);
        favBtn.classList.toggle('is-active', nowFav);
        favBtn.querySelector('.material-symbols-outlined').textContent = nowFav ? 'favorite' : 'favorite_border';
        showToast(nowFav ? 'Added to favorites' : 'Removed from favorites');
        document.dispatchEvent(new CustomEvent('favorites:changed'));
      },
      style: 'width:34px;height:34px;',
    },
    el('span', { class: 'material-symbols-outlined', style: 'font-size:17px;' }, fav ? 'favorite' : 'favorite_border')
  );

  const shareBtn = el(
    'button',
    {
      class: 'btn btn--icon btn--sm',
      style: 'width:34px;height:34px;',
      'aria-label': `Share ${song.title}`,
      onclick: (e) => {
        e.stopPropagation();
        shareSong(song);
      },
    },
    el('span', { class: 'material-symbols-outlined', style: 'font-size:17px;' }, 'ios_share')
  );

  const row = el(
    'div',
    { class: 'song-row', tabindex: '0', role: 'link', 'aria-label': `${song.title} by ${song.artist}` },
    [
      el('span', { class: 'song-row__rank' + (rankVal <= topThreshold ? ' song-row__rank--top' : '') }, String(rankVal)),
      el('div', { class: 'song-row__art' }, el('img', { src: song.cover, alt: '', loading: 'lazy', width: '46', height: '46' })),
      el('div', { class: 'song-row__meta' }, [
        el('p', { class: 'song-row__title' }, song.title),
        el('p', { class: 'song-row__sub' }, `${song.artist} · ${song.category}`),
      ]),
      el('span', { class: 'song-row__dur' }, formatDuration(song.duration)),
      el('div', { class: 'song-row__actions' }, [favBtn, shareBtn]),
    ]
  );

  const goToDetail = () => {
    window.location.href = `song.html?id=${encodeURIComponent(song.id)}`;
  };
  row.addEventListener('click', goToDetail);
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetail();
    }
  });

  return row;
}

export function renderCardSkeletons(count = 6) {
  return Array.from({ length: count }, () => {
    const wrap = el('div', { class: 'song-card skel skel-card' });
    return wrap;
  });
}

export function renderRowSkeletons(count = 6) {
  return Array.from({ length: count }, () => el('div', { class: 'skel skel-row' }));
}
