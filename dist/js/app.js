// The app shell: navigation state, the render loop, and the frame around every screen.

import * as store from './store.js';
import {icon, safe, sound, $, reducedMotion, closeDialog, dismissToast, plural} from './ui.js';

export const nav = {page: 'home', realm: 0, bookOpen: false, star: null, filter: 'all', deliveryFilter: 'all', morning: null};
export const views = {};    // page -> {mode: 'parent' | 'kid', html(), mount?(root), unmount?(), bare?}
export const actions = {};  // data-action name -> handler(element, event)
export const aurora = {setWarm() {}, pause() {}};

const parentNav = [
  ['home', 'Tonight', 'home'], ['curate', 'Wishbook', 'grid'], ['mail', 'Santa mail', 'mail'], ['deliveries', 'Deliveries', 'box'],
];
let mounted = null;

function frame(view) {
  const body = document.body, top = $('#chrome'), dock = $('#dock');
  body.dataset.page = nav.page;
  body.dataset.mode = view.mode;
  top.hidden = dock.hidden = !!view.bare;
  const soundButton = `<button class="hud-btn" data-action="sound" aria-pressed="${sound.on}" aria-label="${sound.on ? 'Turn sound off' : 'Turn sound on'}">${icon(sound.on ? 'sound' : 'mute', 19)}</button>`;
  if (view.mode === 'kid') {
    const count = store.wished().length;
    top.innerHTML = `<button class="wordmark" data-action="go" data-page="portal" aria-label="Eve, back to the start">eve<i>✦</i></button>
      <div class="hud-right">
        ${view.hud === false ? '' : `<button class="wish-orb" id="wish-orb" data-action="go" data-page="wishes" aria-label="My wishes: ${count}">${icon('star', 18)}<b>${count}</b></button>`}
        ${soundButton}
        <button class="hud-btn hold" data-hold data-hold-action="grown-ups" aria-label="Grown-ups: press and hold">${icon('lock', 18)}<span class="hold-ring" aria-hidden="true"></span></button>
      </div>`;
    dock.hidden = true;
    return;
  }
  const letter = store.currentLetter(), unread = letter && !store.getOrder(letter);
  top.innerHTML = `<button class="wordmark" data-action="go" data-page="home" aria-label="Eve home">eve<i>✦</i></button>
    <div class="hud-right">
      <span class="sync-pill ${store.sync.online ? 'on' : ''}" title="${store.sync.online ? 'Changes sync across your family’s devices' : 'Saved on this device. Sync will resume when the connection returns.'}"><i></i>${store.sync.online ? 'Family sync on' : 'On this device'}</span>
      ${soundButton}
    </div>`;
  dock.innerHTML = parentNav.map(([page, label, key]) => `<button data-action="go" data-page="${page}" ${nav.page === page || (page === 'mail' && nav.page === 'keepsakes') ? 'aria-current="page"' : ''}>
      <span class="dock-icon">${icon(key, 21)}${page === 'mail' && unread ? '<i class="dot" aria-label="New letter"></i>' : ''}</span><span>${label}</span></button>`).join('');
}

/** Redraw the current screen. Focus and scroll survive a redraw of the same page. */
export function render({enter = false} = {}) {
  const view = views[nav.page] || views.home;
  const root = $('#app');
  const focusKey = !enter && document.activeElement?.closest?.('[data-key]')?.dataset.key;
  const scroll = scrollY;
  mounted?.unmount?.();
  frame(view);
  root.className = `view view-${nav.page}${enter ? ' entering' : ''}`;
  root.innerHTML = view.html();
  mounted = view;
  view.mount?.(root);
  aurora.setWarm(view.warm ?? (view.mode === 'kid' ? 0.55 : 0));
  aurora.pause(!!view.opaque);
  if (enter) {
    scrollTo({top: 0, behavior: 'instant'});
    requestAnimationFrame(() => root.querySelector('h1')?.focus({preventScroll: true}));
  } else {
    scrollTo({top: scroll, behavior: 'instant'});
    if (focusKey) root.querySelector(`[data-key="${CSS.escape(focusKey)}"]`)?.focus({preventScroll: true});
  }
}

export function go(page, {instant = false} = {}) {
  // 'portal' means: start at the closed book.
  if (page === 'portal') { nav.bookOpen = false; page = 'world'; }
  if (!views[page]) return;
  store.flushSetup();
  if (views[nav.page]?.mode === 'kid') store.flushChild();
  closeDialog({restore: false});
  dismissToast();
  const swap = () => { nav.page = page; render({enter: true}); };
  if (instant || reducedMotion.matches || !document.startViewTransition) swap();
  else { const t = document.startViewTransition(swap); for (const p of [t.ready, t.finished, t.updateCallbackDone]) p?.catch(() => {}); }
}

export const kidTitle = () => `${safe(store.childName())}’s`;
export const wishLine = () => plural(store.wished().length, 'wish');
