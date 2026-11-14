// The grown-ups' side: tonight's overview, the wishbook, Santa mail, deliveries and keepsakes.

import * as store from './store.js';
import {gifts, stores, realms, findGift, getStore, shipmentStates} from './data.js';
import {nav, views, actions, go, render} from './app.js';
import {icon, safe, plural, toyImage, $, $$, announce, toast, openDialog, closeDialog, chime, blip, buzz} from './ui.js';

const {dollars, money, totalCents} = store;
const name = () => safe(store.childName());
const ring = (value, label, sub) => `<div class="ring" style="--p:${Math.max(0, Math.min(1, value))}" role="img" aria-label="${label} ${sub}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle class="arc" cx="60" cy="60" r="52" pathLength="1"/></svg><div><b>${label}</b><small>${sub}</small></div></div>`;
const switchUi = (attrs, on, label) => `<label class="switch"><input type="checkbox" ${attrs} ${on ? 'checked' : ''} aria-label="${label}"><span aria-hidden="true"></span></label>`;
const profileChips = () => `<div class="chips profiles" role="group" aria-label="Children">
  ${store.family.profiles.map(c => `<button class="chip" data-action="profile" data-id="${safe(c.id)}" data-key="profile-${safe(c.id)}" aria-pressed="${c.id === store.profile().id}">${safe(c.name || 'Explorer')}</button>`).join('')}
  ${store.family.profiles.length < 8 ? `<button class="chip add" data-action="add-child" data-key="add-child">${icon('plus', 15)} Add a child</button>` : ''}</div>`;
const pageHead = (eyebrow, title, sub, extra = '') => `<header class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1 tabindex="-1">${title}</h1><p>${sub}</p></div>${extra}</header>`;

/* ---------- Tonight ---------- */

const nextStep = j => {
  const n = name(), w = store.wished().length;
  switch (j.next) {
    case 'curate': return ['Choose what’s possible.', `Turn on at least one store so ${n} has something to discover.`, 'Open the wishbook', 'go', 'curate'];
    case 'explore': return [`Hand it to ${n}.`, `${plural(store.curated().length, 'discovery')} are waiting across ${plural(realms.filter(r => store.curated().some(g => g.realm === r.id)).length, 'world')}. This part is theirs.`, `Open ${n}’s world`, 'go', 'portal'];
    case 'letter': return [`${n} has ${plural(w, 'wish')} so far.`, 'The letter hasn’t been sent yet. When it is, it lands in Santa mail.', `Back to ${n}’s world`, 'go', 'portal'];
    case 'order': return [`${safe(j.letter.name)}’s letter is here.`, `${plural(j.letter.gifts.length, 'wish')}, ${dollars(totalCents(store.letterItems(j.letter)))} in all. Choose what makes it under the tree.`, 'Read the letter', 'go', 'mail'];
    case 'deliver': { const late = j.packages.filter(p => p.stage === 2).length;
      return [late ? `${late === 1 ? 'One package is' : `${late} packages are`} running late.` : 'The gifts are on their way.', `${j.home} of ${plural(j.packages.length, 'package')} home. Receipts and tracking are in one place.`, 'Track deliveries', 'go', 'deliveries']; }
    case 'morning': return ['Plan the morning.', 'Everything has arrived. Choose the wish to reveal first and print a North Pole ticket.', 'Plan the surprise', 'go', 'mail'];
    default: return ['Everything is ready.', 'The gifts are home and the surprise is planned. The rest is just being there.', 'Preview the morning', 'preview-morning', ''];
  }
};

views.home = {
  mode: 'parent',
  html() {
    const j = store.journey(), {days, year} = store.daysToChristmas(), [title, text, cta, action, page] = nextStep(j);
    const hour = new Date().getHours(), hello = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const wishes = store.wished(), letter = j.letter, budget = store.family.budget;
    const chosen = letter ? totalCents(store.selectedItems(letter)) : totalCents(wishes);
    const current = j.steps.findIndex(s => !s.done);
    return `<div class="page">
      ${pageHead(new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'}).toUpperCase(), `${hello}.`, days > 0 ? `${plural(days, 'sleep')} until Christmas ${year}.` : days === 0 ? 'It’s Christmas morning.' : 'Merry Christmas.', profileChips())}
      <div class="bento">
        <article class="tile next">
          <div class="next-copy">
            <span class="eyebrow">NEXT</span>
            <h2>${title}</h2><p>${text}</p>
            <button class="btn glow" data-action="${action}" data-page="${page}" data-key="next">${cta} ${icon('arrow', 18)}</button>
          </div>
          <button class="globe" data-action="shake" aria-label="Shake the snow globe"><span class="globe-orbit o1"></span><span class="globe-orbit o2"></span><img src="assets/eve-snowglobe.webp" alt="" draggable="false"><canvas id="globe-snow" aria-hidden="true"></canvas></button>
          <ol class="steps" aria-label="Your Christmas so far">${j.steps.map((s, i) => `<li class="${s.done ? 'done' : i === current ? 'now' : ''}"><i>${s.done ? icon('check', 12) : ''}</i><span>${s.label}</span></li>`).join('')}</ol>
        </article>
        <article class="tile countdown">
          <span class="eyebrow">COUNTDOWN</span>
          ${ring(1 - Math.min(days, 60) / 60, String(Math.max(days, 0)), days === 1 ? 'sleep' : 'sleeps')}
        </article>
        <button class="tile stat" data-action="go" data-page="${letter ? 'mail' : 'portal'}" data-key="t-wishes">
          <span class="eyebrow">${letter ? 'IN THE LETTER' : 'WISHES SO FAR'}</span>
          <b class="big">${letter ? letter.gifts.length : wishes.length}</b>
          <span class="stack">${(letter ? store.letterItems(letter) : wishes).slice(0, 5).map(g => toyImage(g, 44)).join('') || '<small>No wishes yet</small>'}</span>
          <span class="tile-link">${letter ? 'Open Santa mail' : `Open ${name()}’s world`} ${icon('arrow', 15)}</span>
        </button>
        <article class="tile stat budget">
          <span class="eyebrow">BUDGET</span>
          ${budget ? `<b class="big">${dollars(chosen)}</b><div class="meter ${chosen > budget ? 'over' : ''}"><i style="width:${Math.min(100, chosen / budget * 100)}%"></i></div>
            <small>${dollars(Math.abs(budget - chosen))} ${chosen > budget ? 'over' : 'left of'} ${chosen > budget ? '' : dollars(budget)}</small>`
            : `<b class="big muted">${dollars(chosen)}</b><small>${letter ? 'selected' : 'wished for'} so far. No budget set.</small>`}
          <form class="inline-form" data-form="budget"><label class="sr-only" for="budget">Gift budget in dollars</label><span class="prefix">$</span><input id="budget" name="budget" type="number" inputmode="decimal" min="0" max="100000" step="1" placeholder="Set a budget" value="${budget ? budget / 100 : ''}" data-key="budget"><button class="btn ghost sm">Save</button></form>
        </article>
        <button class="tile stat" data-action="go" data-page="deliveries" data-key="t-deliveries">
          <span class="eyebrow">DELIVERIES</span>
          <b class="big">${j.packages.length ? `${j.home}<span>/${j.packages.length}</span>` : '—'}</b>
          <span class="mini-tracks">${j.packages.map(p => `<i class="${shipmentStates[p.stage].tone}" style="--p:${p.stage / 5}"></i>`).join('') || '<small>No orders yet</small>'}</span>
          <span class="tile-link">${j.packages.length ? 'Track packages' : 'How it works'} ${icon('arrow', 15)}</span>
        </button>
        <article class="tile handoff">
          <div><span class="eyebrow">THEIR SIDE</span><h2>${name()}’s world</h2><p>Full screen, no prices, no checkout. Hold the lock to come back.</p></div>
          <div class="handoff-worlds">${realms.map(r => `<img src="assets/realm-${r.id}-sm.webp" alt="" style="--glow:${r.color}">`).join('')}</div>
          <button class="btn ghost" data-action="go" data-page="portal" data-key="handoff">Open ${name()}’s world ${icon('arrow', 17)}</button>
        </article>
      </div>
      <p class="fine center">Private prototype. Prices, checkout, email scanning and delivery updates are simulated.</p>
    </div>`;
  },
  mount(root) { globe = mountGlobe($('#globe-snow', root)); },
  unmount() { globe?.destroy(); globe = null; },
};

let globe = null;
function mountGlobe(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, burst = 0, alive = true, frame = 0, last = 0;
  const flakes = Array.from({length: 70}, () => ({x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.6, s: 0.02 + Math.random() * 0.05, p: Math.random() * 6.28}));
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const observer = new ResizeObserver(size); observer.observe(canvas); size();
  const tick = now => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; burst = Math.max(0, burst - dt * 0.5);
    ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      if (!still) { f.y = (f.y + (f.s + burst * 0.5) * dt + 1) % 1; f.x = (f.x + (Math.sin(now * 0.0006 + f.p) * 0.012 + Math.cos(f.p) * burst * 0.6) * dt + 1) % 1; }
      ctx.globalAlpha = 0.35 + 0.4 * Math.sin(f.p + now * 0.001) ** 2;
      ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(f.x * w, f.y * h, f.r, 0, 6.283); ctx.fill();
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return {shake() { burst = 1.6; }, destroy() { alive = false; cancelAnimationFrame(frame); observer.disconnect(); }};
}
actions.shake = el => { globe?.shake(); el.classList.remove('shaken'); void el.offsetWidth; el.classList.add('shaken'); chime(); buzz([10, 30, 10]); };
actions['preview-morning'] = () => { const letter = store.currentLetter(); if (letter) { nav.morning = letter.id; go('morning'); } };

actions['add-child'] = () => openDialog(`<form class="card-body" data-form="child">
  <span class="eyebrow">ANOTHER EXPLORER</span><h2 id="dialog-title">Add a child</h2>
  <p>Each child gets their own wishes, letter and keepsakes. They share the same wishbook.</p>
  <label class="field"><span>First name or nickname</span><input name="nickname" maxlength="28" required autocomplete="off"></label>
  <div class="row end"><button type="button" class="btn text" data-action="close">Cancel</button><button class="btn glow">Add ${icon('arrow', 17)}</button></div></form>`);

/* ---------- Wishbook ---------- */

views.curate = {
  mode: 'parent',
  html() {
    const included = store.curated(), f = nav.filter;
    const shown = gifts.filter(g => f === 'all' || g.realm === f);
    const worlds = realms.filter(r => included.some(g => g.realm === r.id)).length;
    return `<div class="page has-bar">
      ${pageHead('THE WISHBOOK', 'You choose what’s possible.', `${name()} only ever sees what you leave switched on. No prices, no stores.`, profileChips())}
      <section class="panel setup">
        <label class="field name-field"><span>This world is for</span><input id="child-name" maxlength="28" value="${safe(store.profile().name)}" autocomplete="off" data-key="child-name"></label>
        <div class="store-toggles"><span class="label">Stores</span>${stores.map(s => `<div class="store-toggle ${store.family.stores.includes(s.id) ? 'on' : ''}"><span class="store-mark ${s.id}">${icon(s.mark, 18)}</span><span><b>${s.name}</b><small>${plural(gifts.filter(g => g.store === s.id).length, 'gift')}</small></span>${switchUi(`data-store="${s.id}" data-key="store-${s.id}"`, store.family.stores.includes(s.id), `Include ${s.name}`)}</div>`).join('')}</div>
      </section>
      <div class="toolbar">
        <div class="segmented" role="group" aria-label="Filter by world">${[['all', 'All worlds'], ...realms.map(r => [r.id, r.short])].map(([id, label]) => `<button data-action="filter" data-filter="${id}" data-key="filter-${id}" aria-pressed="${f === id}">${label}</button>`).join('')}</div>
        <span class="count"><b>${included.length}</b> of ${gifts.length} included</span>
      </div>
      <div class="gift-grid">${shown.map(g => {
        const storeOn = store.family.stores.includes(g.store), on = storeOn && !store.family.excluded.includes(g.id);
        return `<label class="gift-card ${on ? 'on' : ''} ${storeOn ? '' : 'locked'}">
          <span class="gift-art">${toyImage(g, 240)}<i class="gift-state">${on ? `${icon('eye', 13)} Visible` : storeOn ? 'Hidden' : 'Store is off'}</i></span>
          <span class="gift-body"><small>${getStore(g.store).name} · Ages ${g.age}</small><b>${g.name}</b><span>${g.short}</span></span>
          <span class="gift-foot"><span class="price">${money.format(g.price)}</span>${switchUi(`data-curate="${g.id}" data-key="gift-${g.id}" ${storeOn ? '' : 'disabled'}`, on, `Show ${g.name} to ${name()}`)}</span>
        </label>`;
      }).join('')}</div>
      <div class="action-bar"><span>${included.length ? `<b>${plural(included.length, 'discovery')}</b> across ${plural(worlds, 'world')}` : 'Switch on at least one gift to open their world.'}</span>
        <button class="btn glow" data-action="go" data-page="portal" data-key="preview" ${included.length ? '' : 'disabled'}>Open ${name()}’s world ${icon('arrow', 18)}</button></div>
    </div>`;
  },
};
actions.filter = el => { nav.filter = el.dataset.filter; render(); };

/* ---------- Santa mail ---------- */

views.mail = {
  mode: 'parent', warm: 0.2,
  html() {
    const letter = store.currentLetter();
    const head = extra => pageHead('SANTA MAIL', letter ? `${safe(letter.name)} dreamed a little.` : 'Nothing yet. That’s the fun part.', letter ? `${plural(letter.gifts.length, 'wish')}, sent ${store.prettyDate(letter.date)}${letter.id === 'sample' ? ' · sample letter' : ''}.` : `When ${name()} sends a letter, it lands here.`, extra);
    if (!letter) return `<div class="page">${head(profileChips())}
      <section class="panel empty"><div class="empty-orb">${icon('mail', 34)}</div><h2>The letter is still being written.</h2>
        <p>Open ${name()}’s world and let them explore. Their wishes arrive here the moment they send them.</p>
        <div class="row center"><button class="btn glow" data-action="go" data-page="portal">Open ${name()}’s world ${icon('arrow', 18)}</button><button class="btn ghost" data-action="sample-letter">Try a sample letter</button></div>
        <div class="row center"><button class="btn text" data-action="go" data-page="keepsakes">${icon('archive', 16)} Letters from other years</button><button class="btn text" data-action="alerts">${icon('bell', 16)} Tell me when it arrives</button></div></section></div>`;
    const items = store.letterItems(letter), picks = store.selectedItems(letter), order = store.getOrder(letter), plan = store.planFor(letter.id);
    const total = order ? order.total : totalCents(picks), budget = store.family.budget, favorite = findGift(letter.favorite);
    const reveals = [...items.map(g => [g.id, g.name]), ...(letter.activity ? [['together', letter.activity]] : [])];
    return `<div class="page">${head(profileChips())}
      <div class="mail-grid">
        <div class="mail-main">
          <article class="letter-paper">
            <span class="postmark" aria-hidden="true">NORTH POLE<b>✦</b>STARLIGHT POST</span>
            <small>Dear Santa,</small>
            <p>${safe((letter.note || '').replace(/^Dear Santa,?\s*/i, '') || 'Here are a few things I have been dreaming about. Thank you for a little Christmas magic!')}</p>
            <span class="sign">With love, <em>${safe(letter.name)}</em></span>
            ${favorite || letter.activity ? `<div class="letter-notes">${favorite ? `<span>${icon('star', 15)} Wished for most: <b>${favorite.name}</b></span>` : ''}${letter.activity ? `<span>${icon('users', 15)} Together: <b>${safe(letter.activity)}</b></span>` : ''}</div>` : ''}
          </article>
          <section class="panel">
            <div class="panel-head"><h2>What they wished for</h2><span class="count">All wishes ${dollars(totalCents(items))}</span></div>
            <ul class="wish-rows">${items.map(g => { const on = picks.includes(g); return `<li class="${on ? '' : 'off'}">
              ${toyImage(g, 64)}
              <div class="wish-row-main"><b>${g.name}${letter.favorite === g.id ? ` <i class="fav" title="Wished for most">${icon('star', 13)}</i>` : ''}</b><small>${getStore(g.store).name} · ${money.format(g.price)}</small></div>
              <label class="claim"><span class="sr-only">Who is getting ${g.name}?</span><input data-claim="${g.id}" data-key="claim-${g.id}" maxlength="28" placeholder="Who’s getting it?" value="${safe(plan.claims?.[g.id] || '')}"></label>
              ${switchUi(`data-pick="${g.id}" data-key="pick-${g.id}" ${order ? 'disabled' : ''}`, on, `Buy ${g.name}`)}</li>`; }).join('')}</ul>
            <p class="fine">Switch a gift off to leave it out of the order. The letter itself never changes.</p>
          </section>
          <section class="panel surprise">
            <div class="panel-head"><h2>${icon('ticket', 19)} Christmas morning</h2></div>
            <p>Pick the wish to reveal first, then print a ticket they can scan on the day.</p>
            <div class="form-row">
              <label class="field"><span>Reveal first</span><select id="reveal" data-key="reveal"><option value="">Choose a wish</option>${reveals.map(([id, label]) => `<option value="${id}" ${plan.reveal === id ? 'selected' : ''}>${safe(label)}</option>`).join('')}</select></label>
              <label class="field"><span>Who’s joining them?</span><input id="partner" data-key="partner" maxlength="40" placeholder="Dad" value="${safe(plan.partner || '')}"></label>
            </div>
            <div class="row"><button class="btn ghost sm" data-action="print-ticket" ${plan.reveal ? '' : 'disabled'}>${icon('ticket', 16)} Print the ticket</button>
              <button class="btn ghost sm" data-action="preview-morning" ${plan.reveal ? '' : 'disabled'}>${icon('play', 16)} Preview the reveal</button></div>
          </section>
        </div>
        <aside class="mail-side">
          <section class="panel checkout">
            <span class="eyebrow">${order ? 'ORDER ' + order.id : 'YOUR ORDER'}</span>
            <b class="total">${dollars(total)}</b>
            <small>${plural(order ? order.items.length : picks.length, 'gift')} · ${order ? 'demo order placed' : 'estimated subtotal'}</small>
            ${budget ? `<div class="meter ${total > budget ? 'over' : ''}"><i style="width:${Math.min(100, total / budget * 100)}%"></i></div><small class="${total > budget ? 'warn' : ''}">${dollars(Math.abs(budget - total))} ${total > budget ? 'over' : 'under'} your ${dollars(budget)} budget</small>` : '<small>Set a budget on Tonight to see how this compares.</small>'}
            <button class="pay ${store.commerce.payment ? 'ready' : ''}" data-action="payment" data-key="payment"><span>${icon('card', 22)}</span><span><b>${store.commerce.payment ? 'Eve sample card' : 'Add a payment method'}</b><small>${store.commerce.payment ? '•••• 4242 · ready' : 'A sample card for this preview'}</small></span>${icon(store.commerce.payment ? 'check' : 'plus', 17)}</button>
            ${order ? `<button class="btn glow wide" data-action="go" data-page="deliveries" data-key="order">Track the packages ${icon('arrow', 18)}</button>`
              : `<button class="btn glow wide" data-action="order" data-key="order" ${store.commerce.payment && picks.length ? '' : 'disabled'}>Buy ${plural(picks.length, 'gift')} · ${dollars(total)}</button>`}
            <p class="fine">Demo checkout. Nothing is purchased or charged. Tax and shipping are not included.</p>
          </section>
          <section class="panel links">
            <button class="link-row" data-action="go" data-page="keepsakes">${icon('archive', 18)}<span><b>Keepsakes</b><small>Letters through the years</small></span>${icon('arrow', 15)}</button>
            <button class="link-row" data-action="alerts">${icon('bell', 18)}<span><b>Letter alerts</b><small>A nudge when a new letter arrives</small></span>${icon('arrow', 15)}</button>
            ${letter.id !== 'sample' ? `<button class="link-row" data-action="resend">${icon('cloud', 18)}<span><b>Sync this letter</b><small>${store.sync.online ? 'Send it to the family again' : 'Retry when you’re back online'}</small></span>${icon('arrow', 15)}</button>` : ''}
          </section>
        </aside>
      </div></div>`;
  },
};
actions.alerts = async () => {
  if (!globalThis.Notification) return toast('Letter alerts appear inside Eve while it is open.');
  const answer = await Notification.requestPermission();
  toast(answer === 'granted' ? 'Letter alerts are on while Eve is open.' : 'Letter alerts will appear inside Eve.', answer === 'granted' ? 'good' : '');
};
actions['sample-letter'] = () => { store.openSampleLetter(); render(); announce('Sample letter opened.'); };
actions.payment = () => openDialog(`<div class="card-body center">
  <span class="eyebrow">READY WHEN YOU ARE</span><h2 id="dialog-title">One small step.</h2>
  <div class="bank-card"><span>eve <i>✦</i></span><b>•••• •••• •••• 4242</b><small>SAMPLE CARD · DEMO ONLY</small></div>
  <p>This card stands in for a saved payment method. No payment details are collected.</p>
  <button class="btn glow wide" data-action="confirm-payment">${store.commerce.payment ? 'Keep the sample card' : 'Use the sample card'} ${icon('check', 18)}</button></div>`);
actions['confirm-payment'] = () => { store.commerce.payment = true; store.saveCommerce(); closeDialog({restore: false}); render(); $('[data-key="order"]')?.focus(); toast('Sample card ready.', 'good'); };
actions.order = () => {
  const order = store.placeOrder(store.currentLetter());
  if (!order) return;
  chime(); nav.deliveryFilter = 'all';
  go('deliveries');
  toast(`${order.id} placed. ${plural(order.packages.length, 'package')} on the way.`, 'good');
};
actions.resend = async () => { if (await store.resendLetter(store.currentLetter())) toast('Letter synced to the family.', 'good'); };
actions['print-ticket'] = () => {
  const letter = store.currentLetter();
  if (!letter || !store.planFor(letter.id).reveal) return;
  const ticket = document.createElement('section');
  ticket.className = 'print-ticket';
  ticket.innerHTML = `<span>NORTH POLE STARLIGHT POST</span><h1>Christmas Morning Ticket</h1>
    <p>Reserved for ${safe(letter.name)} · Christmas ${new Date(letter.date).getFullYear()}</p>
    <img src="assets/morning-qr.svg" alt="Scan to open the private Christmas morning reveal">
    <p>Scan with a grown-up and choose your name.</p><small>${safe(location.origin)}/?morning=1</small>`;
  document.body.append(ticket);
  addEventListener('afterprint', () => ticket.remove(), {once: true});
  ticket.querySelector('img').decode().then(() => print()).catch(() => { ticket.remove(); toast('The ticket image could not load. Try again.', 'warn'); });
};

/* ---------- Deliveries ---------- */

const packageCard = p => {
  const s = shipmentStates[p.stage], shop = getStore(p.store), late = p.eta !== p.originalEta && p.stage < 5;
  return `<button class="package ${s.tone}" data-action="package" data-id="${p.id}" data-key="pkg-${p.id}" aria-label="${shop.name} package, ${s.name}. Open tracking.">
    <span class="package-top"><span class="store-mark ${shop.id}">${icon(shop.mark, 18)}</span><span><b>${shop.name}</b><small>${p.items.map(id => findGift(id).name).join(' · ')}</small></span><span class="badge ${s.tone}">${s.name}</span></span>
    <span class="route" style="--p:${p.stage / 5}" aria-hidden="true"><i class="route-fill"></i>${[0, 1, 3, 4, 5].map(n => `<i class="node ${p.stage >= n ? 'on' : ''}" style="--at:${n / 5}"></i>`).join('')}<i class="craft">${icon('gift', 14)}</i></span>
    <span class="package-foot"><span>${p.stage === 5 ? 'Arrived' : 'Arriving'} <b>${store.prettyDate(p.eta)}</b>${late ? ` <s>${store.prettyDate(p.originalEta)}</s>` : ''}</span><span>${p.carrier}${p.tracking ? ` · ${safe(p.tracking)}` : ''}</span></span>
  </button>`;
};

views.deliveries = {
  mode: 'parent',
  html() {
    const packages = store.allPackages(), home = packages.filter(p => p.stage === 5).length, late = packages.filter(p => p.stage === 2).length;
    const receipts = packages.filter(p => p.receipt).length, f = nav.deliveryFilter, c = store.commerce;
    const visible = packages.filter(p => f === 'all' || (f === 'active' && p.stage < 5) || (f === 'delayed' && p.stage === 2) || (f === 'delivered' && p.stage === 5));
    if (!packages.length) return `<div class="page">${pageHead('DELIVERIES', 'A place for every present.', 'Every receipt and every delivery, so there’s less to remember.')}
      <section class="panel empty"><div class="empty-orb">${icon('box', 34)}</div><h2>First a wish. Then a package.</h2>
        <p>Choose gifts from the letter in Santa mail to start a demo order. Tracking and receipts collect here.</p>
        <button class="btn glow" data-action="go" data-page="mail">Open Santa mail ${icon('arrow', 18)}</button></section></div>`;
    return `<div class="page">${pageHead('DELIVERIES', home === packages.length ? 'All home for the holidays.' : 'The gifts are on their way.', `${home} of ${plural(packages.length, 'package')} home${late ? ` · ${plural(late, 'delay')} to keep an eye on` : ''}.`)}
      <div class="metrics">
        ${[['Packages', packages.length, ''], ['On the way', packages.length - home, 'info'], ['Delayed', late, late ? 'warn' : ''], ['Home', home, 'good']].map(([label, n, tone]) => `<div class="metric ${tone}"><small>${label}</small><b>${n}</b></div>`).join('')}
      </div>
      <div class="delivery-grid">
        <section class="panel">
          <div class="panel-head"><div class="segmented" role="group" aria-label="Filter packages">${[['all', 'All'], ['active', 'On the way'], ['delayed', 'Delayed'], ['delivered', 'Home']].map(([id, label]) => `<button data-action="delivery-filter" data-filter="${id}" data-key="df-${id}" aria-pressed="${f === id}">${label}</button>`).join('')}</div>
            <button class="btn ghost sm" data-action="advance" data-key="advance" ${home === packages.length ? 'disabled' : ''}>${icon('clock', 16)} Advance a day</button></div>
          <div class="packages">${visible.length ? visible.map(packageCard).join('') : '<p class="fine center">No packages here.</p>'}</div>
          <p class="fine">Simulated shipments. “Advance a day” previews each delivery update.</p>
        </section>
        <aside class="panel helpers">
          <span class="eyebrow">QUIET HELPERS</span>
          <h2>We’ll remember the details.</h2>
          <button class="link-row" data-action="scan" data-key="scan">${icon('mail', 18)}<span><b>Scan the sample inbox</b><small>Pull receipts and tracking into one place</small></span>${icon('arrow', 15)}</button>
          <button class="link-row" data-action="receipts" data-key="receipts" ${receipts ? '' : 'disabled'}>${icon('download', 18)}<span><b>${receipts ? `Download ${plural(receipts, 'receipt')}` : 'Receipts'}</b><small>${receipts ? 'One spreadsheet, sorted by store' : 'They appear after a scan'}</small></span>${icon('arrow', 15)}</button>
          <div class="link-row static">${icon('bell', 18)}<span><b>Delivery nudges</b><small>Shipped, one day away, at your door</small></span>${switchUi('data-notices data-key="notices"', c.notices, 'Delivery nudges')}</div>
          <ul class="feed">${c.activity.length ? c.activity.slice(0, 4).map(a => `<li><i class="${shipmentStates[a.stage].tone}"></i><span><b>${shipmentStates[a.stage].name}</b><small>${getStore(a.store).name} · ${store.prettyDate(a.date)}</small></span></li>`).join('') : '<li class="fine">Delivery moments will appear here.</li>'}</ul>
          <p class="fine">Sample emails and in-app alerts only. No inbox, retailer or push service is connected.</p>
        </aside>
      </div></div>`;
  },
};
actions['delivery-filter'] = el => { nav.deliveryFilter = el.dataset.filter; render(); };
actions.advance = () => {
  const moved = store.advanceDeliveries();
  if (!moved.length) return;
  blip(700); render();
  toast(`${plural(moved.length, 'delivery')} updated · ${shipmentStates[moved[0].stage].name}`, shipmentStates[moved[0].stage].tone);
};
actions.scan = () => { const n = store.scanSampleInbox(); render(); toast(n ? `${n} sample ${n === 1 ? 'email' : 'emails'} processed.` : 'The sample inbox is up to date.', 'good'); };
actions.receipts = () => {
  const csv = store.receiptsCsv(); if (!csv) return;
  const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  Object.assign(document.createElement('a'), {href: url, download: 'eve-receipts-by-store.csv'}).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Receipt download started.', 'good');
};
actions.package = el => {
  const p = store.allPackages().find(x => x.id === el.dataset.id); if (!p) return;
  openDialog(`<div class="card-body">
    <span class="eyebrow">${p.carrier} <i>✦</i> ${safe(p.tracking || 'TRACKING PENDING')}</span>
    <h2 id="dialog-title">${getStore(p.store).name}</h2>
    <p>${p.items.map(id => findGift(id).name).join(' · ')}</p>
    <ol class="timeline">${[...p.history].reverse().map((h, i) => `<li class="${shipmentStates[h.stage].tone} ${i ? '' : 'latest'}"><b>${shipmentStates[h.stage].name}</b><small>${store.prettyDate(h.date)}</small><p>${shipmentStates[h.stage].description}</p></li>`).join('')}</ol>
    <button class="btn glow wide" data-action="close">Done</button></div>`);
};

/* ---------- Keepsakes ---------- */

views.keepsakes = {
  mode: 'parent', warm: 0.3,
  html() {
    const letters = store.family.letters;
    return `<div class="page narrow">${pageHead('KEEPSAKES', 'Letters through the years.', 'Reopen a letter and write down what you did together.', `<button class="btn ghost sm" data-action="go" data-page="mail">${icon('back', 16)} Santa mail</button>`)}
      ${letters.length ? letters.map(l => `<article class="panel keepsake">
        <div class="panel-head"><h2>${new Date(l.date).getFullYear()} · ${safe(l.name)}</h2><span class="count">${store.prettyDate(l.date)}</span></div>
        <p class="quote">${safe(l.note || 'A Christmas full of wishes.')}</p>
        <div class="stack wide">${(l.gifts || []).map(findGift).filter(Boolean).map(g => `<figure>${toyImage(g, 72)}<figcaption>${g.name}</figcaption></figure>`).join('')}</div>
        ${l.activity ? `<p class="fine">${icon('users', 14)} Together: ${safe(l.activity)}</p>` : ''}
        <label class="field"><span>A Christmas memory</span><textarea maxlength="700" data-memory="${safe(l.id)}" data-key="memory-${safe(l.id)}" placeholder="What did you do together?">${safe(store.planFor(l.id).memory || '')}</textarea></label>
      </article>`).join('') : `<section class="panel empty"><div class="empty-orb">${icon('archive', 34)}</div><h2>Your first letter starts the archive.</h2><p>Every letter ${name()} sends is kept here, year after year.</p></section>`}
    </div>`;
  },
};

/* ---------- Form and field wiring ---------- */

export function initParentInputs() {
  document.addEventListener('submit', async event => {
    const form = event.target.closest('[data-form]'); if (!form) return;
    event.preventDefault();
    if (form.dataset.form === 'budget') {
      if (await store.setBudget(form.budget.value)) toast(store.family.budget ? 'Budget saved.' : 'Budget cleared.', 'good');
      render();
    }
    if (form.dataset.form === 'child') {
      const child = store.addProfile(new FormData(form).get('nickname'));
      if (!child) return;
      closeDialog({restore: false}); render(); toast(`${child.name} has joined the family.`, 'good');
    }
  });
  document.addEventListener('input', event => {
    const el = event.target;
    if (el.id === 'child-name') {
      store.setName(el.value);
      $$('.action-bar .btn, .page-head .chip[aria-pressed="true"]').forEach(node => {
        if (node.matches('.chip')) node.textContent = el.value.trim() || 'Explorer';
        else node.innerHTML = `Open ${name()}’s world ${icon('arrow', 18)}`;
      });
    }
  });
  document.addEventListener('change', event => {
    const el = event.target, letter = store.currentLetter();
    if (el.dataset.store) { store.setStore(el.dataset.store, el.checked); blip(el.checked ? 880 : 520); render(); }
    else if (el.dataset.curate) { store.setIncluded(el.dataset.curate, el.checked); blip(el.checked ? 880 : 520); render(); }
    else if (el.dataset.pick && letter) { store.setPicked(letter, el.dataset.pick, el.checked); render(); announce(`Order total ${dollars(totalCents(store.selectedItems(letter)))}.`); }
    else if (el.dataset.claim && letter) { const id = el.dataset.claim, value = el.value.trim(); store.updatePlan(letter.id, plan => { (plan.claims ||= {})[id] = value; }); }
    else if (el.id === 'reveal' && letter) { const value = el.value; store.updatePlan(letter.id, plan => { plan.reveal = value; }); render(); toast(value ? 'Surprise saved.' : 'Surprise cleared.', 'good'); }
    else if (el.id === 'partner' && letter) { const value = el.value.trim(); store.updatePlan(letter.id, plan => { plan.partner = value; }); }
    else if (el.dataset.memory) { const value = el.value; store.updatePlan(el.dataset.memory, plan => { plan.memory = value; }); toast('Memory saved.', 'good'); }
    else if ('notices' in el.dataset) { store.commerce.notices = el.checked; store.saveCommerce(); render(); announce(el.checked ? 'Delivery nudges on.' : 'Delivery nudges paused.'); }
  });
}
