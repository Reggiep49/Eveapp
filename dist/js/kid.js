// The child's side: a book opened and turned by hand, a wish constellation, and the letter to Santa.

import * as store from './store.js';
import {realms, ART, findGift, activities} from './data.js';
import {nav, views, actions, sky, go, render} from './app.js';
import {icon, safe, plural, toyImage, $, $$, reducedMotion, compact, announce, toast, openDialog, closeDialog,
  sound, chime, blip, whoosh, horn, paper, pageLand, thud, starBorn, rise, charge, drone, crescendo, friction, buzz, sparkFlight} from './ui.js';
import {createCodex} from './codex.js';
import {mountHologram, hasModel} from './hologram.js';

const name = () => safe(store.childName());
const openRealms = () => { const ok = store.curated(); return realms.filter(r => r.toys.some(t => ok.some(g => g.id === t.id))); };
const siblings = () => store.family.profiles.length > 1
  ? `<div class="chips who" role="group" aria-label="Who is exploring?">${store.family.profiles.map(c => `<button class="chip" data-action="profile" data-id="${safe(c.id)}" aria-pressed="${c.id === store.profile().id}">${safe(c.name)}</button>`).join('')}</div>` : '';

/* ---------- The lookbook: a real book, opened and turned by hand ---------- */

actions.profile = el => {
  if (!store.switchProfile(el.dataset.id)) return;
  nav.realm = 0; nav.star = null; nav.bookOpen = false;
  views[nav.page].mode === 'kid' ? go('world') : render();
};

let book = null, bookToken = null, stopCharge = null, stopDrone = null;
const leafOf = t => (t.x < 50 ? 'left' : 'right');
const wideBook = () => !compact.matches;
/** What the reader is looking at: a whole spread on a wide screen, one side of it on a phone. */
function bookView(index) {
  const spreads = openRealms(), wide = wideBook();
  const spread = spreads[wide ? index : Math.floor(index / 2)];
  return {spread, side: wide ? null : (index % 2 ? 'right' : 'left'), total: wide ? spreads.length : spreads.length * 2};
}

views.world = {
  mode: 'kid', opaque: true, snow: 1,
  html() {
    const spreads = openRealms();
    if (!spreads.length) return `<section class="kid-empty"><span class="eyebrow">ALMOST READY</span><h1 tabindex="-1">The elves are still setting up.</h1><p>Ask a grown-up to add a few discoveries to your book.</p></section>`;
    const total = wideBook() ? spreads.length : spreads.length * 2;
    nav.realm = Math.max(0, Math.min(nav.realm, total - 1));
    const first = bookView(nav.realm).spread;
    return `<section class="lookbook" id="lookbook" data-state="${nav.bookOpen ? 'open' : 'closed'}" style="--glow:${first.color}">
      <div class="book-backdrop" aria-hidden="true"><img id="book-glow" src="assets/realm-${first.id}-sm.webp" alt=""><i class="firelight"></i></div>
      <div class="book-halo" aria-hidden="true"></div>
      <canvas id="codex" class="codex" aria-hidden="true"></canvas>
      <div class="book-rays" aria-hidden="true"></div>
      <div class="book-flash" aria-hidden="true"></div>
      <header class="book-head">
        <div class="cover-head"><p class="overture">Far to the north, a book has been waiting.</p><h1 tabindex="-1">${name()}, this one <em>is yours.</em></h1></div>
        <div class="world-title" id="book-title"></div>
      </header>
      <div class="book-stage" id="book-stage">
        <div class="marker-layer" id="markers"></div>
        <button class="seal" id="seal" data-hold data-hold-ms="1900" data-hold-action="open-book" aria-label="Press and hold the star to open the book"><span class="hold-ring" aria-hidden="true"></span></button>
      </div>
      <footer class="book-foot">
        <div class="cover-foot"><p class="cover-hint">${icon('hand', 18)} Press and hold the star</p>${siblings()}</div>
        <nav class="realm-rail" id="book-rail" aria-label="Pages">
          <button class="rail-arrow" id="turn-back" data-action="turn" data-step="-1" aria-label="Turn back a page">${icon('back', 20)}</button>
          <div class="rail-middle"><span class="turn-hint">${icon('hand', 16)} Drag the page to turn it</span><span class="page-dots" id="page-dots"></span></div>
          <button class="rail-arrow" id="turn-on" data-action="turn" data-step="1" aria-label="Turn the page">${icon('arrow', 20)}</button>
        </nav>
      </footer>
    </section>`;
  },
  mount(root) { mountBook(root); },
  unmount() { bookToken = null; book?.destroy(); book = null; stopCharge?.(); stopDrone?.(); stopDrone = null; friction.stop(); sky.pull(); },
};

async function mountBook(root) {
  const spreads = openRealms(), shell = $('#lookbook', root);
  if (!shell) return;
  const stage = $('#book-stage', root), wide = wideBook(), ok = store.curated().map(g => g.id);
  const token = bookToken = {};
  const hidden = (p, half) => p.toys.filter(t => leafOf(t) === half && !ok.includes(t.id));
  // Where each toy sits on its page: across, down, and how big.
  const spots = (p, side) => p.toys.filter(t => ok.includes(t.id) && leafOf(t) === side)
    .map(t => ({t, u: (t.x % 50) / 50, v: t.y / 100, w: t.w / 50, h: t.h / 100}));
  const abort = new AbortController();
  const centre = () => { const r = $('#seal').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  function paint() {
    if (token !== bookToken || !book || book.mode !== 'open') return;
    const {spread: page, side, total} = bookView(book.index), wishes = store.profile().wishes, box = stage.getBoundingClientRect(), cv = $('#codex').getBoundingClientRect();
    const sides = side ? [side] : ['left', 'right'], found = sides.flatMap(sd => spots(page, sd)), last = book.index === total - 1;
    shell.style.setProperty('--glow', page.color);
    $('#book-glow').src = `assets/realm-${page.id}-sm.webp`;
    $('#book-title').innerHTML = `<span class="eyebrow">PAGE ${book.index + 1} OF ${total} <i>✦</i> ${plural(found.length, 'discovery')}</span><h2>${page.title}</h2><p>${page.line}</p>`;
    $('#markers').innerHTML = sides.flatMap(sd => spots(page, sd).map(({t, u, v, w, h}, i) => {
      const [x0, y0] = book.project(sd, u - w / 2, v - h / 2), [x1, y1] = book.project(sd, u + w / 2, v + h / 2);
      const gift = findGift(t.id), on = wishes.includes(t.id);
      return `<button class="beacon ${on ? 'wished' : ''}" data-action="toy" data-id="${t.id}" style="left:${x0 - (box.left - cv.left)}px;top:${y0 - (box.top - cv.top)}px;width:${x1 - x0}px;height:${y1 - y0}px;--i:${i}" aria-label="${gift.name}${on ? ', on your wish list' : ''}">
        <span class="reticle" aria-hidden="true"></span><i class="spark">${icon('star', 12)}</i><span class="tag">${gift.name}</span></button>`;
    })).join('');
    $('#page-dots').innerHTML = Array.from({length: total}, (_, i) => { const v = bookView(i);
      return `<button data-action="turn" data-index="${i}" style="--glow:${v.spread.color}" aria-label="Page ${i + 1}: ${v.spread.title}" ${i === book.index ? 'aria-current="true"' : ''}></button>`; }).join('');
    $('#turn-back').disabled = book.index === 0;
    const forward = $('#turn-on');
    forward.classList.toggle('go', last);
    forward.innerHTML = icon(last ? 'star' : 'arrow', 20);
    forward.setAttribute('aria-label', last ? 'See my wishes' : 'Turn the page');
    Object.assign(forward.dataset, last ? {action: 'go', page: 'wishes'} : {action: 'turn', step: '1'});
  }
  const placeSeal = () => {
    if (!book) return;
    const box = stage.getBoundingClientRect(), cv = $('#codex').getBoundingClientRect(), [cx, cy] = book.project('right', 0.5, 420 / 1152), [ex] = book.project('right', 0.5 + 150 / 1024, 420 / 1152);
    Object.assign($('#seal').style, {left: `${cx - (box.left - cv.left)}px`, top: `${cy - (box.top - cv.top)}px`, width: `${Math.abs(ex - cx) * 2}px`});
    shell.style.setProperty('--bx', `${cx}px`); shell.style.setProperty('--by', `${cy}px`);
  };
  const arrive = (i, quiet) => {
    nav.realm = i; shell.classList.remove('arrived', 'turning'); void shell.offsetWidth; shell.classList.add('arrived'); paint();
    const v = bookView(i); if (!quiet) announce(`Page ${i + 1} of ${v.total}. ${v.spread.title}.`);
  };

  const made = await createCodex($('#codex', root), stage, {
    spread: wide, reduced: reducedMotion.matches, start: nav.realm, opened: !!nav.bookOpen,
    name: store.childName(), year: new Date().getFullYear(),
    line: `${plural(spreads.length, 'world')} · ${plural(store.curated().length, 'discovery')}`,
    openings: spreads.map(p => ({src: `assets/realm-${p.id}.webp`, leftHidden: hidden(p, 'left'), rightHidden: hidden(p, 'right')})),
    hot: (i, side) => spots(spreads[i], side).map(({u, v}) => [u, 1 - v, 0.9]),
    on: {
      layout() { placeSeal(); paint(); },
      track() { placeSeal(); },
      settle() { thud(1); buzz('heavy'); shell.classList.add('landed'); const [x, y] = centre(); sky.burst(x, y + 60, 46, {speed: 190, life: 1.5, gravity: 50, size: 1.8}); sky.gust(0.5); },
      riffle() { paper(); buzz('tick'); sky.gust(-0.7); },
      open() { shell.dataset.state = 'open'; chime(0.7); buzz('firm'); announce(`The book is open. ${bookView(book.index).spread.title}.`); },
      page(i) { arrive(i); },
      pan() { shell.classList.add('turning'); paper(); buzz('soft'); },
      lift() { shell.classList.add('turning'); paper(); buzz('soft'); },
      grain() { buzz('tick'); },
      drag(speed) { friction.set(speed); if (speed > 0.25) sky.gust(-0.05 * speed); },
      land() { pageLand(); buzz('firm'); sky.gust(-0.9); },
      release(completes) { if (!completes) shell.classList.remove('turning'); },
      rest() { shell.classList.remove('turning'); buzz('tick'); },
      refuse() { buzz('heavy'); shell.classList.remove('nope'); void shell.offsetWidth; shell.classList.add('nope'); },
    },
  });
  if (token !== bookToken) { made?.destroy(); return; }
  if (!made) { shell.dataset.state = 'flat'; return flatBook(shell, spreads, spots); }
  book = made;
  shell.classList.add('ready');
  placeSeal(); paint();
  if (book.mode === 'closed') { stopDrone?.(); stopDrone = drone(); whoosh(); }

  // Holding the star: the book trembles, light leaks out, snow is drawn in, and the ticks come faster.
  const seal = $('#seal'); let lastTick = 0;
  seal.addEventListener('holdstart', () => { stopCharge?.(); stopCharge = charge(); buzz('soft'); shell.classList.add('charging'); }, {signal: abort.signal});
  seal.addEventListener('holdprogress', e => {
    const p = e.detail, now = performance.now(), [x, y] = centre();
    book?.hold(p); shell.style.setProperty('--charge', p);
    sky.pull(x, y, p ? 0.25 + p * 1.6 : 0);
    if (p && now - lastTick > 300 - 240 * p) { lastTick = now; buzz(p > 0.7 ? 'firm' : 'tick'); sky.burst(x, y, 3 + Math.round(p * 7), {inward: 120 + p * 200, life: 0.5, size: 1.6 + p}); }
  }, {signal: abort.signal});
  seal.addEventListener('holdend', () => { stopCharge?.(); stopCharge = null; sky.pull(); shell.classList.remove('charging'); shell.style.setProperty('--charge', 0); }, {signal: abort.signal});
  document.addEventListener('keydown', e => {
    if (token !== bookToken) return abort.abort();
    if ($('#dialog').open || e.target.matches('input, textarea, select') || book?.mode !== 'open') return;
    if (e.key === 'ArrowRight') book.turnTo(book.index + 1);
    if (e.key === 'ArrowLeft') book.turnTo(book.index - 1);
  }, {signal: abort.signal});
}
/** The crescendo: one held breath of silence, then the book bursts open. */
export function openBook() {
  if (!book || book.mode !== 'closed') return;
  const shell = $('#lookbook'), r = $('#seal').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  nav.bookOpen = true;
  shell.dataset.state = 'opening';
  stopCharge?.(); stopCharge = null; stopDrone?.(0.05); stopDrone = null; sky.pull();
  book.hold(1);
  setTimeout(() => {
    if (!book || $('#lookbook') !== shell) return;
    book.open(); crescendo(); buzz([70, 40, 30, 40, 30, 60, 110]);
    shell.classList.add('flash', 'burst');
    sky.burst(x, y, 150, {speed: 620, up: 260, life: 2, size: 2.6, gravity: 240, drag: 1.1});
    sky.burst(x, y, 70, {speed: 240, up: 80, life: 2.8, size: 1.6, gravity: 30, drag: 0.6});
    sky.gust(2.2);
  }, reducedMotion.matches ? 0 : 170);
}
actions.turn = el => {
  if (!book) return;
  book.turnTo(el.dataset.index !== undefined ? Number(el.dataset.index) : book.index + Number(el.dataset.step));
};

/** Without WebGL the book still works: flat pictures and the same buttons, just no paper. */
function flatBook(shell, spreads, spots) {
  nav.bookOpen = true;
  const show = () => {
    const {spread: page, side, total} = bookView(nav.realm), wishes = store.profile().wishes, sides = side ? [side] : ['left', 'right'];
    $('#book-title').innerHTML = `<span class="eyebrow">PAGE ${nav.realm + 1} OF ${total}</span><h2>${page.title}</h2><p>${page.line}</p>`;
    $('#markers').innerHTML = `<div class="flat-page ${side || 'both'}"><img src="assets/realm-${page.id}.webp" alt="">${sides.flatMap(sd => spots(page, sd).map(({t, u, v, w, h}) => {
      const k = side ? 1 : 0.5, x = side ? u : (sd === 'left' ? u : 1 + u) * 0.5;
      return `<button class="beacon ${wishes.includes(t.id) ? 'wished' : ''}" data-action="toy" data-id="${t.id}" style="left:${(x - w * k / 2) * 100}%;top:${(v - h / 2) * 100}%;width:${w * k * 100}%;height:${h * 100}%" aria-label="${findGift(t.id).name}"><i class="spark">${icon('star', 12)}</i><span class="tag">${findGift(t.id).name}</span></button>`;
    })).join('')}</div>`;
    $('#page-dots').innerHTML = Array.from({length: total}, (_, i) => `<button data-action="turn" data-index="${i}" aria-label="Page ${i + 1}" ${i === nav.realm ? 'aria-current="true"' : ''}></button>`).join('');
    $('#turn-back').disabled = nav.realm === 0; $('#turn-on').disabled = nav.realm === total - 1;
  };
  book = {mode: 'open', get index() { return nav.realm; }, turnTo(i) { if (i < 0 || i >= bookView(0).total) return; nav.realm = i; show(); }, hold() {}, open() {}, destroy() {}, project: () => [0, 0]};
  show();
}

/** After a toy is closed, update its marker in place so the book is not disturbed. */
function refreshBeacons() {
  const wishes = store.profile().wishes;
  $$('#markers .beacon').forEach(b => b.classList.toggle('wished', wishes.includes(b.dataset.id)));
}

/* ---------- A toy, up close ---------- */

let holo = null;
actions.toy = el => showToy(el.dataset.id);

function showToy(id) {
  const gift = findGift(id);
  if (!gift || !store.isCurated(id)) return;
  const realm = realms.find(r => r.id === gift.realm), on = store.profile().wishes.includes(id), spin = hasModel(id);
  blip(660);
  openDialog(`<div class="toy-sheet" style="--glow:${realm.color}" data-toy="${id}">
    <button class="hud-btn sheet-close" data-action="close" aria-label="Back to the world">${icon('close', 20)}</button>
    <div class="toy-stage" id="toy-stage" data-view="look">
      <div class="stage-floor" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="stage-beam" aria-hidden="true"></div>
      <div class="stage-subject"><img class="toy-photo" src="assets/toys/${id}.webp" alt="${gift.name}" draggable="false">
        ${spin ? `<canvas id="holo" role="img" aria-label="A model of ${gift.name} you can spin. Drag it, or use the turn buttons."></canvas>` : ''}</div>
      <p class="alive-line" id="alive-line" aria-live="polite"></p>
      <div class="stage-tools">
        ${spin ? `<div class="segmented" role="group" aria-label="How to look at it">
          <button data-action="toy-view" data-view="look" aria-pressed="true">${icon('image', 16)} Look</button>
          <button data-action="toy-view" data-view="spin" aria-pressed="false">${icon('cube', 16)} Spin it</button></div>
        <div class="spin-tools">
          <button class="hud-btn" data-action="holo" data-do="left" aria-label="Turn left">${icon('back', 17)}</button>
          <button class="hud-btn" data-action="holo" data-do="zoom" aria-pressed="false" aria-label="Closer">${icon('plus', 17)}</button>
          <button class="hud-btn" data-action="holo" data-do="reset" aria-label="Reset the view">${icon('rotate', 17)}</button>
          <button class="hud-btn" data-action="holo" data-do="right" aria-label="Turn right">${icon('arrow', 17)}</button>
        </div>` : ''}
      </div>
    </div>
    <div class="toy-info">
      <span class="eyebrow">${gift.category} <i>✦</i> Ages ${gift.age}</span>
      <h2 id="dialog-title">${gift.name}</h2>
      <p class="tagline">${gift.short}</p>
      <p>${gift.detail}</p>
      <dl class="facts"><div><dt>In the box</dt><dd>${gift.inside}</dd></div></dl>
      <div class="prompt">${icon('wand', 18)}<p>${gift.play}</p></div>
      <div class="toy-actions">
        <button class="btn ghost" data-action="alive" data-id="${id}">${icon('play', 16)} Bring it to life</button>
        <button class="btn glow wish-btn" data-action="wish" data-id="${id}" aria-pressed="${on}">${wishLabel(on)}</button>
      </div>
    </div>
  </div>`, {variant: 'toy', onClose() { holo?.destroy(); holo = null; if (nav.page === 'world') refreshBeacons(); else if (nav.page === 'wishes') render(); }});
}
const wishLabel = on => on ? `${icon('check', 19)} <span>On my wish list</span>` : `${icon('star', 19)} <span>Make it a wish</span>`;

actions['toy-view'] = el => {
  const stage = $('#toy-stage'), view = el.dataset.view;
  stage.dataset.view = view;
  $$('[data-action="toy-view"]', stage).forEach(b => b.setAttribute('aria-pressed', b === el));
  if (view === 'spin' && !holo) holo = mountHologram($('#holo'), stage.closest('[data-toy]').dataset.toy, {reduced: reducedMotion.matches});
  blip(view === 'spin' ? 990 : 740);
};
actions.holo = el => {
  if (!holo) return;
  const what = el.dataset.do;
  if (what === 'left') holo.turn(-1);
  if (what === 'right') holo.turn(1);
  if (what === 'reset') { holo.reset(); $('[data-do="zoom"]').setAttribute('aria-pressed', 'false'); }
  if (what === 'zoom') { const on = el.getAttribute('aria-pressed') !== 'true'; el.setAttribute('aria-pressed', on); holo.zoom(on); }
};
actions.alive = el => {
  const gift = findGift(el.dataset.id), stage = $('#toy-stage');
  stage.removeAttribute('data-motion'); void stage.offsetWidth;
  stage.dataset.motion = gift.id;
  $('#alive-line').textContent = gift.alive;
  gift.id === 'train' ? horn() : chime(0.8);
  buzz([12, 40, 12]);
};
actions.wish = el => {
  const adding = store.toggleWish(el.dataset.id);
  if (adding === null) return;
  el.innerHTML = wishLabel(adding);
  el.setAttribute('aria-pressed', adding);
  const orb = $('#wish-orb'), count = store.wished().length;
  if (orb) { orb.querySelector('b').textContent = count; orb.setAttribute('aria-label', `My wishes: ${count}`); }
  if (adding) {
    chime(); buzz(24);
    sparkFlight(el, orb);
    orb?.classList.remove('bump'); void orb?.offsetWidth; orb?.classList.add('bump');
  }
  announce(adding ? `Wish made. You have ${plural(count, 'wish')}.` : 'Wish taken back.');
};

/* ---------- Wish constellation ---------- */

const hash = (text, salt) => { let h = 2166136261 ^ salt; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
function constellation(items) {
  const cols = Math.min(items.length, compact.matches ? 3 : 6), rowH = compact.matches ? 150 : 190;
  const rows = Math.ceil(items.length / cols);
  const points = items.map((g, i) => {
    const row = Math.floor(i / cols), inRow = Math.min(cols, items.length - row * cols);
    let col = i % cols; if (row % 2) col = inRow - 1 - col;
    return {g, x: (col + 0.5) / inRow * 100 + (hash(g.id, 1) - 0.5) * (compact.matches ? 5 : 7), y: row * rowH + rowH / 2 + (hash(g.id, 2) - 0.5) * 54};
  });
  return {points, height: rows * rowH};
}

views.wishes = {
  mode: 'kid', warm: 0.5,
  html() {
    const items = store.wished(), child = store.profile();
    if (!items.some(g => g.id === nav.star)) nav.star = null;
    const picked = findGift(nav.star), {points, height} = constellation(items);
    return `<section class="sky">
      <header class="sky-head">
        <span class="eyebrow">YOUR WISH CONSTELLATION</span>
        <h1 tabindex="-1">${items.length ? `${plural(items.length, 'wish')}, <em>shining.</em>` : 'A sky waiting <em>for stars.</em>'}</h1>
        <p>${items.length ? 'Tap a star to look closer. Choose one North Star: the wish you wish for most.' : 'Every wish you make becomes a star up here.'}</p>
      </header>
      ${items.length ? `<div class="constellation" style="height:${height}px">
        <svg aria-hidden="true">${points.slice(1).map((p, i) => `<line x1="${points[i].x}%" y1="${points[i].y}" x2="${p.x}%" y2="${p.y}" style="--i:${i}" pathLength="1"/>`).join('')}</svg>
        ${points.map(({g, x, y}, i) => `<button class="star ${child.favorite === g.id ? 'north' : ''}" data-action="star" data-id="${g.id}" data-key="star-${g.id}" style="left:${x}%;top:${y}px;--i:${i}" aria-pressed="${nav.star === g.id}" aria-label="${g.name}${child.favorite === g.id ? ', your North Star' : ''}">
          <span class="star-orb">${toyImage(g, 120)}</span>${child.favorite === g.id ? `<i class="crown">${icon('star', 14)}</i>` : ''}<span class="star-name">${g.name}</span></button>`).join('')}
      </div>
      <div class="star-panel ${picked ? 'open' : ''}" aria-live="polite">${picked ? `
        <span class="star-panel-name">${picked.name}</span>
        <button class="btn ${child.favorite === picked.id ? 'glow' : 'ghost'} sm" data-action="north" data-id="${picked.id}" data-key="north" aria-pressed="${child.favorite === picked.id}">${icon('star', 16)} ${child.favorite === picked.id ? 'My North Star' : 'Make it my North Star'}</button>
        <button class="btn ghost sm" data-action="toy" data-id="${picked.id}" data-key="again">${icon('eye', 16)} Look again</button>
        <button class="btn ghost sm" data-action="unwish" data-id="${picked.id}">${icon('close', 16)} Let it go</button>` : '<span class="star-panel-hint">Tap a star</span>'}</div>
      <section class="together">
        <h2>${icon('users', 18)} One thing to do together</h2>
        <div class="chips">${activities.map(a => `<button class="chip" data-action="activity" data-value="${a}" data-key="act-${a}" aria-pressed="${store.family.activity === a}">${a}</button>`).join('')}</div>
      </section>` : `<div class="sky-empty"><span class="lone-star">✦</span></div>`}
      ${siblings()}
      <footer class="sky-actions">
        <button class="btn ghost" data-action="go" data-page="world">${icon('back', 18)} Keep exploring</button>
        ${items.length ? `<button class="btn glow" data-action="go" data-page="letter">Write to Santa ${icon('arrow', 18)}</button>` : ''}
      </footer>
    </section>`;
  },
};
actions.star = el => { nav.star = nav.star === el.dataset.id ? null : el.dataset.id; blip(820); render(); };
actions.north = el => { const now = store.setFavorite(el.dataset.id); if (now) { chime(0.7); buzz(20); } render(); announce(now ? 'This is your North Star.' : 'North Star cleared.'); };
actions.unwish = el => { store.toggleWish(el.dataset.id); nav.star = null; render(); announce('Wish taken back.'); };
actions.activity = el => { store.setActivity(el.dataset.value); blip(700); render(); };

/* ---------- Letter ---------- */

views.letter = {
  mode: 'kid', warm: 0.7,
  html() {
    const items = store.wished(), child = store.profile();
    return `<section class="letter">
      <div class="letter-side">
        <span class="eyebrow">ONE LAST THING</span>
        <h1 tabindex="-1">The best part<br>is <em>you.</em></h1>
        <p>Tell Santa what you’re dreaming about, or something you’re proud of. He loves those stories too.</p>
        <div class="letter-cargo" aria-label="${plural(items.length, 'wish')} travelling with your letter">${items.map(g => `<span class="${child.favorite === g.id ? 'north' : ''}" title="${g.name}">${toyImage(g, 56)}</span>`).join('')}</div>
        <span class="hint">${plural(items.length, 'wish')} travelling with your letter${store.family.activity ? ` · ${safe(store.family.activity)}` : ''}</span>
        <button class="btn text" data-action="go" data-page="wishes">${icon('back', 16)} Back to my wishes</button>
      </div>
      <div class="letter-card">
        <div class="letter-stamp" aria-hidden="true"><span>NORTH POLE</span><b>✦</b><span>STARLIGHT POST</span></div>
        <label for="santa-note">Dear Santa,</label>
        <textarea id="santa-note" maxlength="700" placeholder="This Christmas, I’ve been dreaming about…">${safe(child.note)}</textarea>
        <div class="letter-tools">
          <button class="btn ghost sm" data-action="voice">${icon('mic', 16)} Say it out loud</button>
          <span class="count" id="note-count">${child.note.length} / 700</span>
        </div>
        <p class="signature">With love, <strong>${name()}</strong></p>
        <button class="send-btn" data-hold data-hold-ms="1400" data-hold-action="seal" ${items.length ? '' : 'disabled'}>
          <span class="send-core">${icon('spark', 22)}</span>
          <span class="send-text"><b>Hold to send</b><small>to the North Pole</small></span>
          <span class="hold-ring" aria-hidden="true"></span>
        </button>
      </div>
    </section>`;
  },
  mount(root) {
    $('#santa-note', root)?.addEventListener('input', event => {
      store.setNote(event.target.value);
      $('#note-count').textContent = `${event.target.value.length} / 700`;
    });
  },
};
actions.voice = () => openDialog(`<div class="card-body center">
  <div class="voice-orb">${icon('mic', 30)}</div>
  <span class="eyebrow">A LITTLE VOICE. A BIG WISH.</span>
  <h2 id="dialog-title">Say it your way.</h2>
  <div class="voice-wave" aria-hidden="true">${Array.from({length: 21}, (_, i) => `<i style="--h:${10 + (i * 17 % 34)}px;--d:${i * 0.05}s"></i>`).join('')}</div>
  <p class="quote">“I’d love something to build and a little adventure. I’ll leave a carrot for the reindeer!”</p>
  <button class="btn glow wide" data-action="use-voice">Use this sample ${icon('check', 18)}</button>
  <button class="btn text" data-action="close">Not now</button>
  <small class="fine">A preview of voice notes. It uses a sample and never turns on your microphone.</small></div>`);
actions['use-voice'] = () => {
  store.setNote('I’d love something to build and a little adventure. I’ll leave a carrot for the reindeer!');
  closeDialog({restore: false}); render(); $('#santa-note')?.focus();
};

let sealing = false;
export async function seal() {
  if (sealing) return;
  const note = $('#santa-note'); if (note) store.setNote(note.value);
  const sealed = store.sealLetter();
  if (!sealed) return;
  sealing = true;
  chime(1.2); buzz([20, 60, 30]);
  go('sending', {instant: true});
  sealing = false;
  if (!await sealed.delivered) toast('Your letter is safe on this device. A grown-up can send it again from Santa mail.', 'warn');
}

/* ---------- Sending: fold it, seal it, flick it into the sky ---------- */

let sendoff = null;
function sendoffHtml(done) {
  const letter = store.activeLetter(), items = (letter?.gifts || []).map(findGift).filter(Boolean);
  const note = (letter?.note || '').replace(/^Dear Santa,?\s*/i, '') || 'Here are a few things I have been dreaming about.';
  const when = letter ? new Date(letter.date).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) : '';
  return `<section class="sendoff" id="sendoff" data-step="${done ? 'done' : 'gather'}">
    <canvas id="send-sky" aria-hidden="true"></canvas>
    <div class="send-top">
      ${done ? '' : `<button class="btn ghost sm" data-action="skip-send">Skip ${icon('arrow', 15)}</button>`}
      <button class="hud-btn" data-action="sound" aria-pressed="${sound.on}" aria-label="${sound.on ? 'Turn sound off' : 'Turn sound on'}">${icon(sound.on ? 'sound' : 'mute', 18)}</button>
      <button class="hud-btn hold" data-hold data-hold-action="grown-ups" aria-label="Grown-ups: press and hold">${icon('lock', 18)}<span class="hold-ring" aria-hidden="true"></span></button>
    </div>
    <div class="send-stage" aria-hidden="${done}">
      <div class="fold-letter" id="fold-letter">
        <div class="fl-panel fl-top"><div class="fl-face"><span class="fl-dear">Dear Santa,</span></div></div>
        <div class="fl-panel fl-mid"><div class="fl-face"><p>${safe(note.length > 150 ? note.slice(0, 147) + '…' : note)}</p></div></div>
        <div class="fl-panel fl-bot"><div class="fl-face"><span class="fl-sign">With love, <em>${name()}</em></span><span class="fl-wishes">${items.slice(0, 6).map(g => toyImage(g, 40)).join('')}</span></div></div>
        <span class="fl-seal" aria-hidden="true">✦</span>
        <span class="fl-to" aria-hidden="true">To Santa<small>THE NORTH POLE</small></span>
      </div>
    </div>
    <div class="send-prompt" id="send-prompt"><span class="chevrons" aria-hidden="true"><i></i><i></i><i></i></span><b>Flick it up to the North Pole</b>
      <button class="btn ghost sm" data-action="launch">or tap to send</button></div>
    <div class="new-star" aria-hidden="true"><i></i><i></i><b></b></div>
    <div class="send-final" aria-live="polite">
      <span class="eyebrow">RECEIVED <i>✦</i> THE NORTH POLE${when ? ` <i>✦</i> ${when}` : ''}</span>
      <h1 tabindex="-1">It’s there, <em>${name()}.</em></h1>
      <p>There is a new star over the North Pole tonight. Santa has every wish and every word.</p>
      <div class="sent-wishes">${items.map((g, i) => `<figure style="--i:${i}" class="${letter.favorite === g.id ? 'north' : ''}">${toyImage(g, 84)}<figcaption>${g.name}</figcaption></figure>`).join('')}</div>
      <div class="postmark-stamp" aria-hidden="true"><span>NORTH POLE</span><b>RECEIVED</b><span>${letter ? new Date(letter.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}).toUpperCase() : ''}</span></div>
      <div class="sent-actions">
        <button class="btn ghost" data-action="go" data-page="sending">${icon('play', 16)} Watch it again</button>
        <button class="btn glow" data-action="go" data-page="world">Back to my book ${icon('arrow', 18)}</button>
      </div>
      <span class="hint">${icon('lock', 14)} Grown-ups: press and hold the lock.</span>
    </div>
  </section>`;
}

function runSendoff(root, done) {
  const el = $('#sendoff', root), canvas = $('#send-sky', root), letter = $('#fold-letter', root), ctx = canvas.getContext('2d');
  const s = {alive: true, w: 0, h: 0, speed: 0.03, speedTarget: 0.03, bloom: 0, last: performance.now(), trail: [], timers: [], launched: done};
  const stars = Array.from({length: compact.matches ? 110 : 190}, () => ({x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 1.2, p: Math.random() * 6.28}));
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); s.w = canvas.clientWidth; s.h = canvas.clientHeight; canvas.width = s.w * d; canvas.height = s.h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const observer = new ResizeObserver(size); observer.observe(canvas); size();
  const at = (ms, fn) => s.timers.push(setTimeout(() => { if (s.alive) fn(); }, ms));
  const step = name => { el.dataset.step = name; };

  function frame(now) {
    if (!s.alive) return;
    const dt = Math.min(0.04, (now - s.last) / 1000); s.last = now;
    s.speed += (s.speedTarget - s.speed) * (1 - Math.exp(-dt * 3));
    s.bloom = Math.max(0, s.bloom - dt * 0.9);
    ctx.clearRect(0, 0, s.w, s.h);
    ctx.lineCap = 'round';
    for (const st of stars) {
      const before = st.y; st.y = (st.y + s.speed * st.z * dt) % 1;
      const x = st.x * s.w, y = st.y * s.h, tw = 0.45 + 0.4 * Math.sin(now * 0.002 + st.p);
      ctx.strokeStyle = `rgba(255,${236 - st.z * 20 | 0},${200 - st.z * 30 | 0},${tw * Math.min(1, 0.5 + st.z * 0.4)})`;
      ctx.lineWidth = 0.8 + st.z;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, st.y < before ? y : y - Math.max(0.5, s.speed * st.z * s.h * 0.05)); ctx.stroke();
    }
    if (el.dataset.step === 'fly') {
      const r = letter.getBoundingClientRect();
      for (let i = 0; i < 5; i++) s.trail.push({x: r.left + r.width / 2 + (Math.random() - 0.5) * r.width * 0.5, y: r.bottom - 6, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 160, life: 1});
    }
    ctx.globalCompositeOperation = 'lighter';
    s.trail = s.trail.filter(p => p.life > 0);
    for (const p of s.trail) {
      p.life -= dt * 1.1; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.fillStyle = `rgba(255,${200 + 40 * p.life | 0},${120 + 80 * p.life | 0},${Math.max(0, p.life) * 0.8})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.life * 2.6, 0, 6.283); ctx.fill();
    }
    if (s.bloom > 0) {
      const cx = s.w / 2, cy = s.h * 0.24, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(s.w, s.h) * 0.75);
      g.addColorStop(0, `rgba(255,244,214,${s.bloom})`); g.addColorStop(0.25, `rgba(255,214,140,${s.bloom * 0.45})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, s.w, s.h);
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function launch(from = 0) {
    if (s.launched) return;
    s.launched = true;
    letter.style.setProperty('--from', `${from}px`);
    step('fly'); s.speedTarget = 2.6; rise(); buzz('heavy');
    at(1150, () => { step('star'); s.bloom = 1; s.speedTarget = 0.03; starBorn(); buzz([30, 60, 50]); });
    at(2500, () => { step('done'); $('.send-final h1', el)?.focus({preventScroll: true}); });
    at(3500, () => { thud(0.7); buzz('firm'); });
  }
  if (!done) {
    if (reducedMotion.matches) { s.launched = true; step('done'); }
    else {
      whoosh();
      at(1000, () => { step('fold'); paper(); buzz('soft'); });
      at(1450, () => { paper(); buzz('soft'); });
      at(2150, () => { step('seal'); thud(0.9); buzz('heavy'); });
      at(2900, () => { if (!s.launched) step('ready'); });
      at(11000, () => launch());
      // The letter follows the finger; let go with an upward flick and it is away.
      let drag = null;
      letter.addEventListener('pointerdown', e => { if (el.dataset.step !== 'ready') return; drag = {y: e.clientY, dy: 0, t: performance.now(), lastY: e.clientY, v: 0}; letter.setPointerCapture(e.pointerId); letter.classList.add('held'); buzz('soft'); });
      letter.addEventListener('pointermove', e => {
        if (!drag) return;
        const now = performance.now(); drag.dy = e.clientY - drag.y;
        if (now - drag.t > 10) { drag.v = (e.clientY - drag.lastY) / (now - drag.t); drag.lastY = e.clientY; drag.t = now; }
        letter.style.setProperty('--drag', `${drag.dy < 0 ? drag.dy : drag.dy * 0.25}px`);
      });
      const drop = () => {
        if (!drag) return;
        const {dy, v} = drag; drag = null; letter.classList.remove('held');
        if (dy < -90 || v < -0.55) launch(dy); else letter.style.setProperty('--drag', '0px');
      };
      letter.addEventListener('pointerup', drop); letter.addEventListener('pointercancel', drop);
    }
  }
  return {launch, skip() { s.timers.forEach(clearTimeout); s.launched = true; step('done'); }, destroy() { s.alive = false; s.timers.forEach(clearTimeout); observer.disconnect(); }};
}
views.sending = {
  mode: 'kid', bare: true, warm: 1,
  html: () => sendoffHtml(false),
  mount(root) { sendoff = runSendoff(root, false); },
  unmount() { sendoff?.destroy(); sendoff = null; },
};
views.sent = {
  mode: 'kid', bare: true, warm: 1,
  html: () => sendoffHtml(true),
  mount(root) { sendoff = runSendoff(root, true); },
  unmount() { sendoff?.destroy(); sendoff = null; },
};
actions.launch = () => sendoff?.launch();
actions['skip-send'] = () => sendoff?.skip();
export const flightSoundChanged = () => {
  const b = $('.send-top [data-action="sound"]');
  if (b) { b.innerHTML = icon(sound.on ? 'sound' : 'mute', 18); b.setAttribute('aria-pressed', sound.on); }
};

/* ---------- Christmas morning ---------- */

views.morning = {
  mode: 'kid', bare: true, warm: 1,
  html() {
    const ready = store.family.letters.filter(l => store.planFor(l.id).reveal);
    if (store.commerce.sample && store.planFor('sample').reveal) ready.push(store.commerce.sample);
    const letter = ready.find(l => String(l.id) === String(nav.morning));
    if (!letter) return `<section class="morning"><span class="eyebrow">CHRISTMAS MORNING</span>
      <h1 tabindex="-1">${ready.length ? 'Whose ticket is this?' : 'Not quite yet.'}</h1>
      <p>${ready.length ? 'Choose your name to open your surprise.' : 'Your surprise will appear here once a grown-up has prepared it.'}</p>
      <div class="morning-tickets">${ready.map(l => `<button class="btn glow xl" data-action="open-ticket" data-id="${safe(l.id)}">${icon('ticket', 20)} ${safe(l.name)}</button>`).join('')}</div>
      <button class="btn text" data-action="leave-morning">Back to Eve</button></section>`;
    const plan = store.planFor(letter.id), gift = findGift(plan.reveal);
    const partner = plan.partner ? `${gift?.id === 'train' ? 'Your first passenger is' : 'Sharing the surprise with you is'} ${safe(plan.partner)}.` : 'Find someone you love and share the surprise together.';
    return `<section class="morning reveal" id="reveal" data-open="false">
      <span class="eyebrow">A MESSAGE FROM THE NORTH POLE</span>
      <h1 tabindex="-1">${safe(letter.name)}, your surprise<br>is <em>here.</em></h1>
      <button class="present" data-action="unwrap" aria-label="Open your surprise"><i></i><i></i><span>${icon('gift', 54)}</span><b>Tap to open</b></button>
      <div class="revealed" aria-live="polite">
        ${gift ? `<div class="revealed-toy">${toyImage(gift, 220)}</div><h2>${gift.name}</h2>` : `<div class="revealed-toy together-wish">${icon('users', 60)}</div><h2>${safe(letter.activity || 'A day together')}</h2>`}
        <p>${partner}</p>
      </div>
      <button class="btn text" data-action="leave-morning">Back to Eve</button>
    </section>`;
  },
};
actions['open-ticket'] = el => { nav.morning = el.dataset.id; go('morning'); };
actions.unwrap = () => { const r = $('#reveal'); if (r.dataset.open === 'true') return; r.dataset.open = 'true'; chime(1.4); buzz([30, 50, 30, 50, 60]); };
actions['leave-morning'] = () => { history.replaceState(null, '', location.pathname); nav.morning = null; go('home'); };
