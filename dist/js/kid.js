// The child's side: a portal, three explorable worlds, a wish constellation, and the letter to Santa.

import * as store from './store.js';
import {realms, ART, findGift, activities} from './data.js';
import {nav, views, actions, go, render} from './app.js';
import {icon, safe, plural, toyImage, $, $$, reducedMotion, compact, announce, toast, openDialog, closeDialog,
  sound, chime, blip, whoosh, horn, paper, buzz, sparkFlight} from './ui.js';
import {mountHologram, hasModel} from './hologram.js';

const name = () => safe(store.childName());
const openRealms = () => { const ok = store.curated(); return realms.filter(r => r.toys.some(t => ok.some(g => g.id === t.id))); };
const siblings = () => store.family.profiles.length > 1
  ? `<div class="chips who" role="group" aria-label="Who is exploring?">${store.family.profiles.map(c => `<button class="chip" data-action="profile" data-id="${safe(c.id)}" aria-pressed="${c.id === store.profile().id}">${safe(c.name)}</button>`).join('')}</div>` : '';

/* ---------- Portal ---------- */

views.portal = {
  mode: 'kid', warm: 0.25,
  html() {
    const open = openRealms(), count = store.curated().length;
    if (!open.length) return `<section class="kid-empty"><span class="eyebrow">ALMOST READY</span><h1 tabindex="-1">The elves are still setting up.</h1><p>Ask a grown-up to add a few discoveries to your world.</p></section>`;
    return `<section class="portal">
      <div class="portal-copy">
        <span class="eyebrow">A LOOKBOOK FROM THE NORTH POLE</span>
        <h1 tabindex="-1">${name()},<br><em>it’s open.</em></h1>
        <p>${plural(open.length, 'world')} inside one book. ${plural(count, 'discovery')} to find.<br>Turn the pages. Make a wish.</p>
        ${siblings()}
        <button class="btn glow xl" data-action="enter-world">Open the lookbook ${icon('arrow', 20)}</button>
        <span class="hint">${icon(sound.on ? 'sound' : 'mute', 15)} ${sound.on ? 'Sound is on' : 'Even more magical with sound on'}</span>
      </div>
      <button class="portal-door" data-action="enter-world" aria-label="Open the lookbook">
        <span class="door-ring r1"></span><span class="door-ring r2"></span><span class="door-ring r3"></span>
        <span class="door-glass"><img src="assets/realm-${open[0].id}.webp" alt="" draggable="false"></span>
        <span class="door-label">${open[0].title}</span>
      </button>
    </section>`;
  },
};
actions['enter-world'] = () => {
  const door = $('.portal-door');
  nav.realm = 0;
  whoosh();
  if (!door || reducedMotion.matches) return go('world');
  door.classList.add('diving');
  setTimeout(() => go('world', {instant: true}), 620);
};
actions.profile = el => {
  if (!store.switchProfile(el.dataset.id)) return;
  nav.realm = 0; nav.star = null;
  views[nav.page].mode === 'kid' ? go('portal') : render();
};

/* ---------- The lookbook: real pages you turn by hand ---------- */

let book = null;
const leafOf = t => (t.x < 50 ? 'left' : 'right');
/** A desktop page is a whole spread; a phone page is one leaf of it. */
function bookPages() {
  const ok = store.curated().map(g => g.id);
  return openRealms().flatMap(r => compact.matches
    ? ['left', 'right'].map(leaf => ({...r, leaf, toys: r.toys.filter(t => leafOf(t) === leaf)})).filter(p => p.toys.some(t => ok.includes(t.id)))
    : [{...r, leaf: null}]);
}
function pageTextures(page) {
  const ok = store.curated().map(g => g.id);
  return (page.leaf ? [page.leaf] : ['left', 'right']).map(half => ({src: `assets/realm-${page.id}.webp`, half,
    hidden: page.toys.filter(t => leafOf(t) === half && !ok.includes(t.id))}));
}

views.world = {
  mode: 'kid', opaque: true,
  html() {
    const pages = bookPages();
    if (!pages.length) return views.portal.html();
    nav.realm = Math.max(0, Math.min(nav.realm, pages.length - 1));
    const page = pages[nav.realm], ok = store.curated().map(g => g.id), wishes = store.profile().wishes;
    const found = page.toys.filter(t => ok.includes(t.id)), last = nav.realm === pages.length - 1;
    const box = t => { const k = page.leaf ? 2 : 1, x = page.leaf ? (t.x % 50) * 2 : t.x; return `left:${x - t.w * k / 2}%;top:${t.y - t.h / 2}%;width:${t.w * k}%;height:${t.h}%`; };
    return `<section class="lookbook" style="--glow:${page.color}">
      <div class="book-backdrop" aria-hidden="true"><img src="assets/realm-${page.id}-sm.webp" alt=""></div>
      <header class="world-title">
        <span class="eyebrow">PAGE ${nav.realm + 1} OF ${pages.length} <i>✦</i> ${plural(found.length, 'discovery')}</span>
        <h1 tabindex="-1">${page.title}</h1>
        <p>${page.line}</p>
      </header>
      <div class="book-table ${page.leaf ? 'portrait-book' : ''}" id="book-table">
        <div class="desk-shadow"></div><div class="book-cover-base"></div><div class="gilded-page-stack"></div>
        <div class="folio-volume" id="folio-volume">
          <div class="page-fallback" data-leaf="${page.leaf || 'both'}"><img src="assets/realm-${page.id}.webp" alt="${page.title}: an illustrated page with ${found.length} toys to discover" draggable="false">
            ${page.toys.filter(t => !ok.includes(t.id)).map(t => `<span class="veil" style="${box(t)}"><i>${icon('gift', 22)}</i><b>Still wrapped</b></span>`).join('')}</div>
          <canvas id="paper-engine" class="paper-engine" aria-label="A storybook. Drag a page across to turn it."></canvas>
          <div class="book-spine" aria-hidden="true"></div>
          <div class="discovery-layer">${found.map((t, i) => { const gift = findGift(t.id), on = wishes.includes(t.id);
            return `<button class="beacon ${on ? 'wished' : ''} ${t.y > 60 ? 'low' : ''}" data-action="toy" data-id="${t.id}" data-key="toy-${t.id}" style="${box(t)};--i:${i}" aria-label="${gift.name}${on ? ', on your wish list' : ''}">
              <span class="reticle" aria-hidden="true"></span><span class="tag"><i class="pulse">${on ? icon('star', 13) : ''}</i><span>${gift.name}</span></span></button>`; }).join('')}</div>
          ${nav.realm > 0 ? '<span class="paper-corner left" aria-hidden="true"></span>' : ''}${last ? '' : '<span class="paper-corner right" aria-hidden="true"></span>'}
        </div>
      </div>
      <nav class="realm-rail" aria-label="Pages">
        <button class="rail-arrow" data-action="turn" data-index="${nav.realm - 1}" data-key="turn-back" aria-label="Turn back a page" ${nav.realm === 0 ? 'disabled' : ''}>${icon('back', 20)}</button>
        <div class="rail-middle"><span class="turn-hint">${icon('hand', 16)} Drag a page to turn it</span>
          <span class="page-dots">${pages.map((p, i) => `<button data-action="turn" data-index="${i}" data-key="dot-${i}" style="--glow:${p.color}" aria-label="Page ${i + 1}: ${p.title}" ${i === nav.realm ? 'aria-current="true"' : ''}></button>`).join('')}</span></div>
        ${last ? `<button class="rail-arrow go" data-action="go" data-page="wishes" data-key="turn-on" aria-label="See my wishes">${icon('star', 20)}</button>`
          : `<button class="rail-arrow" data-action="turn" data-index="${nav.realm + 1}" data-key="turn-on" aria-label="Turn the page">${icon('arrow', 20)}</button>`}
      </nav>
    </section>`;
  },
  mount(root) { book = mountBook(root); },
  unmount() { book?.destroy(); book = null; },
};

function mountBook(root) {
  const canvas = $('#paper-engine', root), host = $('#folio-volume', root);
  if (!canvas || typeof EveBookEngine === 'undefined') return null;
  const single = compact.matches, abort = new AbortController(), opts = {signal: abort.signal};
  const engine = new EveBookEngine(canvas, {single, reduced: reducedMotion.matches});
  const usable = () => engine.ready && !engine.failed;
  let gesture = null, turning = false, alive = true, suppress = false;

  engine.setPages(pageTextures(bookPages()[nav.realm])).then(loaded => {
    if (!alive) return;
    host.classList.toggle('engine-ready', loaded);
    // Warm the neighbouring pages so the first turn is as smooth as the rest.
    if (loaded) for (const p of bookPages()) for (const tex of pageTextures(p)) engine.texture(tex).catch(() => {});
  });

  const arrive = index => { nav.realm = index; turning = false; render(); $('#app').classList.add('warp-in'); const p = bookPages()[index]; if (p) announce(`Page ${index + 1}. ${p.title}.`); };
  const land = () => { buzz([16, 34, 26]); blip(420); };

  host.addEventListener('pointerdown', event => {
    if (turning || event.button > 0) return;
    gesture = {x: event.clientX, y: event.clientY, id: event.pointerId, rect: host.getBoundingClientRect(), progress: 0, notch: 0, active: false, lastX: event.clientX, lastT: performance.now(), speed: 0};
  }, opts);
  host.addEventListener('pointermove', event => {
    const g = gesture; if (!g) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (!g.active && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      const direction = dx < 0 ? 1 : -1, target = nav.realm + direction;
      if (target < 0 || target >= bookPages().length) { gesture = null; host.classList.remove('nope'); void host.offsetWidth; host.classList.add('nope'); buzz(30); return; }
      Object.assign(g, {active: true, direction, target});
      turning = suppress = true;
      host.setPointerCapture(g.id); host.classList.add('turning');
      if (usable()) engine.prepare(direction, pageTextures(bookPages()[target])).then(() => { if (gesture === g && alive) engine.setProgress(g.progress); });
      paper(); buzz(10); // the page lifts off the stack
    }
    if (!g.active) return;
    event.preventDefault();
    g.progress = Math.max(0, Math.min(0.98, -dx * g.direction / (g.rect.width * (single ? 0.9 : 0.58))));
    if (usable()) engine.setProgress(g.progress);
    // Paper has grain: a fine tick each time the page bends a little further.
    const notch = Math.floor(g.progress / 0.11);
    if (notch !== g.notch) { g.notch = notch; buzz(4); }
    const now = performance.now();
    if (now - g.lastT > 16) { g.speed = (event.clientX - g.lastX) / (now - g.lastT); g.lastX = event.clientX; g.lastT = now; }
  }, opts);
  const release = () => {
    const g = gesture; gesture = null;
    if (!g?.active) return;
    const flick = -g.speed * g.direction > 0.45 && g.progress > 0.06;
    const complete = g.progress > 0.3 || flick;
    const done = () => { if (!alive) return; if (complete) { land(); arrive(g.target); } else { turning = false; host.classList.remove('turning'); buzz(6); } };
    if (usable()) engine.animate(complete ? 1 : 0, done); else done();
    setTimeout(() => { suppress = false; }, 80);
  };
  host.addEventListener('pointerup', release, opts);
  host.addEventListener('pointercancel', () => { const g = gesture; gesture = null; if (!g?.active) return; turning = false; host.classList.remove('turning'); if (usable()) engine.setProgress(0); suppress = false; }, opts);
  // Dragging a page must not open the toy the finger started on.
  host.addEventListener('click', event => { if (suppress) { event.preventDefault(); event.stopPropagation(); suppress = false; } }, {...opts, capture: true});
  document.addEventListener('keydown', event => {
    if ($('#dialog').open || event.target.matches('input, textarea, select')) return;
    if (event.key === 'ArrowRight') turnTo(nav.realm + 1);
    if (event.key === 'ArrowLeft') turnTo(nav.realm - 1);
  }, opts);

  async function turnTo(index) {
    const pages = bookPages();
    if (turning || index === nav.realm || index < 0 || index >= pages.length) return;
    const direction = index > nav.realm ? 1 : -1;
    turning = true; host.classList.add('turning');
    paper(); buzz(10);
    if (!usable()) { host.classList.add(direction > 0 ? 'fallback-forward' : 'fallback-back'); return setTimeout(() => { if (alive) { land(); arrive(index); } }, reducedMotion.matches ? 1 : 520); }
    try {
      await engine.prepare(direction, pageTextures(pages[index]));
      if (!alive) return;
      // One soft tick mid-air, then the page lands.
      setTimeout(() => { if (alive && turning) buzz(4); }, 380);
      engine.animate(1, () => { if (alive) { land(); arrive(index); } });
    } catch { arrive(index); }
  }
  return {turnTo, destroy() { alive = false; abort.abort(); engine.destroy(); }};
}
actions.turn = el => book?.turnTo(Number(el.dataset.index));

/** After a toy is closed, update its marker in place so the book is not redrawn. */
function refreshBeacons() {
  const wishes = store.profile().wishes;
  $$('.discovery-layer .beacon').forEach(b => {
    const on = wishes.includes(b.dataset.id);
    b.classList.toggle('wished', on);
    b.querySelector('.pulse').innerHTML = on ? icon('star', 13) : '';
  });
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

/* ---------- The journey ---------- */

let flight = null;
views.sending = {
  mode: 'kid', bare: true, opaque: true,
  html() {
    return `<section class="northstar-cinema" id="northstar-cinema" data-act="gather">
      <div class="cinema-worlds" aria-hidden="true"><img class="film-workshop" src="assets/realm-workshop.webp" alt=""><img class="film-village" src="assets/village.webp" alt=""><img class="film-sky" src="assets/aurora-sky.webp" alt=""></div>
      <div class="cinema-shade"></div><canvas aria-hidden="true"></canvas><div class="aurora-curtain" aria-hidden="true"></div>
      <div class="cinematic-letter" id="cinematic-letter"><div class="letter-radiance"></div><div class="envelope-body"><span class="envelope-address">To Santa</span><small>THE NORTH POLE</small><span class="envelope-from">With love, ${name()}</span><div class="envelope-left"></div><div class="envelope-right"></div><div class="envelope-bottom"></div><div class="envelope-flap"></div><span class="envelope-wax">✦</span></div><div class="letter-wings wing-left"></div><div class="letter-wings wing-right"></div></div>
      <div class="portal-halo" id="portal-halo" aria-hidden="true"><i></i><i></i><i></i></div><div class="cinema-bloom" aria-hidden="true"></div>
      <div class="cinema-caption"><span class="eyebrow" id="flight-kicker">EVERY WISH BEGINS WITH YOU</span><h1 id="flight-title" tabindex="-1">A little belief.<br>An extraordinary journey.</h1><p id="flight-subtitle">Your wishes are waking up the magic.</p></div>
      <div class="flight-progress" aria-hidden="true"><i></i><span>YOUR WISHES</span><span>THE NORTH POLE</span></div>
      <div class="cinema-controls"><button class="hud-btn" data-action="sound" aria-pressed="${sound.on}" aria-label="${sound.on ? 'Turn sound off' : 'Turn sound on'}">${icon(sound.on ? 'sound' : 'mute', 18)}</button>
        <button class="btn ghost sm" data-action="go" data-page="sent">Skip ${icon('arrow', 15)}</button></div>
    </section>`;
  },
  mount(root) {
    const letter = store.activeLetter();
    flight = new NorthstarFlight($('#northstar-cinema', root), {
      name: store.childName(), wishes: (letter?.gifts || []).map(findGift).filter(Boolean).map(g => g.name),
      sound: () => sound.on, reduced: reducedMotion.matches, onDone: () => go('sent'),
    });
  },
  unmount() { flight?.destroy(); flight = null; },
};
export const flightSoundChanged = () => {
  flight?.soundChanged();
  const b = $('.cinema-controls [data-action="sound"]');
  if (b) { b.innerHTML = icon(sound.on ? 'sound' : 'mute', 18); b.setAttribute('aria-pressed', sound.on); }
};

views.sent = {
  mode: 'kid', hud: false, warm: 0.8,
  html() {
    const letter = store.activeLetter(), items = (letter?.gifts || []).map(findGift).filter(Boolean);
    return `<section class="sent">
      <div class="sent-seal" aria-hidden="true"><i></i><i></i><span>✦</span></div>
      <span class="eyebrow">NORTH POLE <i>✦</i> SPECIAL DELIVERY</span>
      <h1 tabindex="-1">${name()}, you made the sky<br>a little <em>brighter.</em></h1>
      <p>Santa has your letter. Every wish. Every word.</p>
      <div class="sent-wishes">${items.map((g, i) => `<figure style="--i:${i}" class="${letter.favorite === g.id ? 'north' : ''}">${toyImage(g, 84)}<figcaption>${g.name}</figcaption></figure>`).join('')}</div>
      <blockquote>“Leave the rest to me.”<cite>With love, Santa</cite></blockquote>
      <div class="sent-actions">
        <button class="btn ghost" data-action="go" data-page="sending">${icon('play', 16)} Watch it fly again</button>
        <button class="btn glow" data-action="go" data-page="world">Keep exploring ${icon('arrow', 18)}</button>
      </div>
      <span class="hint">${icon('lock', 14)} Grown-ups: press and hold the lock to come back.</span>
    </section>`;
  },
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
