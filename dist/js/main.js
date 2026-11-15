// Boot: wire events, start the sky, connect family sync.

import * as store from './store.js';
import {nav, views, actions, aurora, sky, go, render} from './app.js';
import {$, icon, sound, toast, announce, reducedMotion, compact, initDialog, initHold, closeDialog, dialogOpen} from './ui.js';
import {mountAurora} from './aurora.js';
import {mountAtmosphere} from './atmosphere.js';
import {seal, openBook, flightSoundChanged} from './kid.js';
import {initParentInputs} from './parent.js';

actions.go = el => go(el.dataset.page);
actions.close = () => closeDialog();
actions.sound = () => { sound.toggle(); flightSoundChanged(); if (!views[nav.page]?.bare && nav.page !== 'world') render(); else document.querySelectorAll('#chrome [data-action="sound"]').forEach(b => { b.setAttribute('aria-pressed', sound.on); b.innerHTML = icon(sound.on ? 'sound' : 'mute', 19); }); announce(sound.on ? 'Sound on.' : 'Sound off.'); };

document.addEventListener('click', event => {
  const el = event.target.closest('[data-action]');
  if (!el || el.disabled) return;
  actions[el.dataset.action]?.(el, event);
});

// Press-and-hold: sending the letter, and the way back to the grown-ups' side.
initHold(el => {
  if (el.dataset.holdAction === 'seal') seal();
  if (el.dataset.holdAction === 'open-book') openBook();
  if (el.dataset.holdAction === 'grown-ups') go(store.currentLetter() && !store.getOrder(store.currentLetter()) ? 'mail' : 'home');
});
document.addEventListener('click', event => {
  const el = event.target.closest('.hold-nudge[data-hold-action]');
  if (el) toast({seal: 'Press and hold to send your letter.', 'open-book': 'Press and hold the star to open your book.'}[el.dataset.holdAction] || 'Grown-ups: press and hold the lock.');
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || dialogOpen() || event.target.matches('input, textarea, select')) return;
  if (nav.page === 'keepsakes') go('mail');
});
compact.addEventListener('change', () => { if (nav.page === 'world') nav.realm = 0; if (nav.page === 'wishes' || nav.page === 'world') render(); });

initDialog();
initParentInputs();
Object.assign(aurora, mountAurora($('#aurora'), {reduced: reducedMotion.matches}));
Object.assign(sky, mountAtmosphere($('#atmosphere'), {reduced: reducedMotion.matches}));

store.subscribe(event => {
  const parent = views[nav.page]?.mode === 'parent';
  if (event.type === 'offline-save') toast('Saved on this device. Family sync will catch up when it can.', 'warn');
  if (event.type === 'status' && parent && !dialogOpen()) render();
  if (event.type === 'remote') {
    const typing = document.activeElement?.matches('input, textarea, select');
    if ((parent || nav.page === 'morning') && !dialogOpen() && !typing) render();
    if (event.newLetter && parent) {
      toast(`A letter from ${event.newLetter.name} just arrived.`, 'good');
      if (globalThis.Notification?.permission === 'granted') { try { new Notification('Eve · Santa mail', {body: 'A new wish list is ready to open.'}); } catch {} }
    }
  }
});

const wantsMorning = new URLSearchParams(location.search).has('morning');
nav.page = wantsMorning ? 'morning' : 'home';
render({enter: true});
store.refreshFamily({initial: true});
setInterval(() => { if (!document.hidden && (views[nav.page]?.mode === 'parent' || nav.page === 'morning')) store.refreshFamily(); }, 4000);
addEventListener('focus', () => store.refreshFamily());
addEventListener('pagehide', () => { store.flushSetup(); store.flushChild(); });
