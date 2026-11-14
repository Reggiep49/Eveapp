/* Family records are scoped to the signed-in account by the Sites worker. */
const familyKey = 'eve-family-v1';
const newId = () => crypto.randomUUID();
const activities = ['Build a railroad together', 'Build a blanket fort', 'Put on a puppet show', 'Make Christmas pancakes'];
const firstProfile = {id: newId(), name: state.name, wishes: state.wishes, note: state.note, favorite: null};
let family;
try { family = JSON.parse(localStorage.getItem(familyKey)); } catch {}
family ||= {profiles: [firstProfile], letters: state.letter ? [{...state.letter, profile: firstProfile.id}] : [], stores: state.stores, excluded: state.excluded, activity: '', budget: 0, plans: {}};
let profileId = localStorage.getItem('eve-active-profile') || family.profiles[0].id;
let revision = 0;
let online = false;
let pending = Promise.resolve();
let writes = 0;
let seenLetter = family.letters[0]?.id;
let morningId = null;
const profile = () => family.profiles.find(child => child.id === profileId) || family.profiles[0];
const activeLetter = () => family.letters.find(letter => letter.profile === profile().id);
const planFor = id => family.plans[id] || {};
const parentFamily = () => parentPages.has(page);
const yearOf = letter => new Date(letter.date).getFullYear();
const familyRender = render;
const familyGo = go;
const baseGift = showGift;
const baseChrome = chrome;
const baseSave = save;

function remember() {
  localStorage.setItem(familyKey, JSON.stringify(family));
}
function loadProfile() {
  const child = profile();
  profileId = child.id;
  localStorage.setItem('eve-active-profile', child.id);
  Object.assign(state, {name: child.name, wishes: [...child.wishes], note: child.note,
    stores: [...family.stores], excluded: [...family.excluded], letter: activeLetter() || null});
}
async function familyRequest(method = 'GET', data) {
  const response = await fetch('/api/family', {
    method, cache: 'no-store', ...(data ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)} : {})
  });
  if (!response.ok && response.status !== 409) throw Error('Family sync unavailable');
  return {conflict: response.status === 409, ...await response.json()};
}
async function refreshFamily(initial = false) {
  if (writes) return;
  try {
    const remote = await familyRequest();
    if (writes || remote.revision < revision) return;
    const changed = remote.revision !== revision || !online;
    revision = remote.revision;
    online = true;
    if (!remote.data || !changed) return;
    const incoming = remote.data.letters[0];
    family = remote.data;
    remember();
    if (page === 'morning' && changed && !morningId) render();
    if (parentFamily()) {
      if (changed && !dialog.open && !document.activeElement?.matches('input,textarea,select')) {
        loadProfile();
        render();
      }
      if (!initial && incoming && incoming.id !== seenLetter) {
        announce('A new Santa letter arrived.');
        if (globalThis.Notification?.permission === 'granted') {
          try { new Notification('Eve · Santa mail', {body: 'A new wish list is ready to open.'}); } catch {}
        }
        showFamilyNotice('A new letter arrived. Open Santa mail to read it.');
      }
      seenLetter = incoming?.id;
    }
  } catch { online = false; }
}
function showFamilyNotice(message) {
  document.querySelector('.family-notice')?.remove();
  const notice = document.createElement('aside');
  notice.className = 'family-notice';
  notice.setAttribute('role','status');
  notice.textContent = message;
  document.body.append(notice);
  setTimeout(() => notice.remove(), 6500);
}
function updateFamily(change) {
  const local = structuredClone(family);
  change(local);
  family = local;
  remember();
  writes++;
  const operation = pending.then(async () => {
    const fresh = await familyRequest();
    let remote = fresh;
    for (let attempt = 0; attempt < 4; attempt++) {
      const document = structuredClone(remote.data || local);
      if (remote.data) change(document);
      const result = await familyRequest('PUT', {revision: remote.revision, data: document});
      if (!result.conflict) {
        online = true;
        revision = result.revision;
        if (writes === 1) { family = document; remember(); }
        return true;
      }
      remote = result;
    }
    throw Error('Concurrent family update');
  }).catch(() => {
    online = false;
    showFamilyNotice('Saved on this device. Family sync is unavailable.');
    return false;
  }).finally(() => { writes--; });
  pending = operation;
  return operation;
}

save = function () {
  baseSave();
  if (page === 'letter' || page === 'catalog' || page === 'wishes') {
    const child = profile();
    Object.assign(child, {wishes: [...state.wishes], note: state.note});
    if (!child.wishes.includes(child.favorite)) child.favorite = null;
    remember();
  } else if (page === 'setup') {
    const snapshot = {id: profile().id, name: state.name, stores: [...state.stores], excluded: [...state.excluded]};
    clearTimeout(save.timer);
    save.timer = setTimeout(() => saveSetup(snapshot), 300);
  }
};
function saveSetup(snapshot = {id: profile().id, name: state.name, stores: [...state.stores], excluded: [...state.excluded]}) {
  clearTimeout(save.timer);
  return updateFamily(doc => {
    const child = doc.profiles.find(item => item.id === snapshot.id);
    if (child) child.name = snapshot.name.trim() || 'Christmas explorer';
    doc.stores = snapshot.stores;
    doc.excluded = snapshot.excluded;
  });
}

sealLetter = async function () {
  if (!wished().length || sealLetter.busy) return;
  sealLetter.busy = true;
  storeNote();
  const child = {...profile(), name: state.name.trim() || 'Christmas explorer',
    wishes: wished().map(gift => gift.id), note: state.note};
  const letter = {id: newId(), profile: child.id, name: child.name, gifts: child.wishes,
    favorite: child.wishes.includes(child.favorite) ? child.favorite : null, activity: family.activity,
    note: child.note, date: new Date().toISOString()};
  const sync = updateFamily(doc => {
    const index = doc.profiles.findIndex(entry => entry.id === child.id);
    if (index >= 0) doc.profiles[index] = child;
    else if (doc.profiles.length < 8) doc.profiles.push(child);
    doc.activity = letter.activity;
    if (!doc.letters.some(entry => entry.id === letter.id)) doc.letters = [letter, ...doc.letters].slice(0, 80);
  });
  state.letter = letter;
  seenLetter = letter.id;
  baseSave();
  familyGo('sending');
  sealLetter.busy = false;
  if (!await sync) showFamilyNotice('Letter saved here. Use Santa mail to retry sending it to the family.');
};

function profileButtons() {
  return family.profiles.map(child => `<button type="button" class="family-chip" data-family="profile" data-id="${safe(child.id)}" aria-pressed="${child.id === profile().id}">${safe(child.name)}</button>`).join('');
}
function activityOptions(value) {
  return '<option value="">Choose an activity</option>' + activities.map(activity => `<option ${activity === value ? 'selected' : ''}>${activity}</option>`).join('');
}
function familySetup() {
  return `<section class="family-panel"><h2>Family bookshelf</h2>
    <div class="family-actions">${profileButtons()}<button class="family-chip" data-family="add">Add a sibling</button></div>
    <label>Christmas gift budget <input id="family-budget" type="number" min="0" max="100000" step=".01" value="${family.budget ? family.budget/100 : ''}" placeholder="0.00"></label>
    <button class="family-chip" data-family="budget">Save budget</button>
    <p>Choose a profile to personalize their book. Their wishes and letters stay with their profile.</p>
    <button class="family-chip" data-family="notifications">Enable letter notifications</button>
    <span class="family-sync">${online ? 'Family sync connected' : 'On-device preview'}</span>
  </section>`;
}
function familyWishes() {
  const child = profile();
  return `<section class="family-panel family-dark"><h2>One very special wish</h2>
    <label>Mark your favorite <select id="family-favorite"><option value="">Choose a favorite</option>${wished().map(gift => `<option value="${gift.id}" ${child.favorite === gift.id ? 'selected' : ''}>${gift.name}</option>`).join('')}</select></label>
    <label>Something we can do together <select id="family-activity">${activityOptions(family.activity)}</select></label>
    ${family.profiles.length > 1 ? `<div class="family-actions">${profileButtons()}</div>` : ''}
  </section>`;
}
function finaleCards(letter) {
  return (letter?.gifts || []).map(id => findGift(id)).filter(Boolean).map((gift, index) =>
    `<figure style="--wish-index:${index}">${thumbnail(gift)}<figcaption>${gift.name}</figcaption></figure>`).join('');
}
function familyInbox() {
  const letter = activeLetter();
  const links = `<div class="family-actions">${profileButtons()}<button class="family-chip" data-family="archive">Christmas keepsakes</button></div>`;
  if (!letter) return `<section class="family-panel"><h2>Family Santa mail</h2>${links}<p>When ${name()} sends a letter, it will appear here.</p></section>`;
  const plan = planFor(letter.id);
  const items = getItems(letter);
  const selected = items.filter(gift => !(plan.removed || []).includes(gift.id));
  const favorite = findGift(letter.favorite);
  const budget = family.budget;
  const selectedTotal = totalCents(selected);
  const revealOptions = [
    ...items.map(gift => ({id: gift.id, name: gift.name})),
    ...(letter.activity ? [{id: 'together', name: letter.activity}] : [])
  ];
  return `<section class="family-panel family-inbox"><h2>Family Santa mail</h2>${links}
    <div class="family-summary"><strong>${dollars(totalCents(items))} for all wishes</strong>
      <strong>${dollars(selectedTotal)} selected</strong>
      <span>${budget ? dollars(Math.abs(budget-selectedTotal)) + (budget >= selectedTotal ? ' under budget' : ' over budget') : 'Set a budget in The book'}</span></div>
    ${favorite ? `<p>★ ${safe(letter.name)}’s favorite is ${favorite.name}.</p>` : ''}
    ${letter.activity ? `<p>Together wish · ${safe(letter.activity)}</p>` : ''}
    <div class="family-gifts">${items.map(gift => `<div class="family-gift">${thumbnail(gift)}
      <label><input type="checkbox" data-family-cart="${gift.id}" ${selected.includes(gift)?'checked':''}> ${gift.name} · ${money.format(gift.price)}</label>
      <label>Claimed by <input data-family-claim="${gift.id}" maxlength="28" placeholder="Parent’s name" value="${safe(plan.claims?.[gift.id] || '')}"></label></div>`).join('')}</div>
    <section class="family-reveal-plan"><h3>Plan the Christmas morning surprise</h3>
      <label>Reveal <select id="family-reveal"><option value="">Choose a wish</option>${revealOptions.map(option => `<option value="${option.id}" ${plan.reveal === option.id ? 'selected' : ''}>${safe(option.name)}</option>`).join('')}</select></label>
      <label>Who’s joining them? <input id="family-partner" maxlength="40" placeholder="Dad" value="${safe(plan.partner || '')}"></label>
      <div class="family-actions"><button class="family-chip" data-family="save-surprise">Save surprise</button><button class="family-chip" data-family="ticket" ${plan.reveal?'':'disabled'}>Print North Pole ticket</button>
      <button class="family-chip" data-family="reveal-preview" ${plan.reveal?'':'disabled'}>Preview morning reveal</button>
      <button class="family-chip" data-family="retry">Sync this letter</button></div>
    </section>
  </section>`;
}

function morningView() {
  const ready = family.letters.filter(letter => planFor(letter.id).reveal);
  const letter = ready.find(entry => entry.id === morningId);
  if (!letter) return `<section class="morning"><h1 tabindex="-1">Christmas morning</h1>
    <p>${ready.length ? 'Choose your North Pole ticket.' : 'Your surprise will appear here once a grown-up has prepared it.'}</p>
    <div class="family-actions">${ready.map(entry => `<button class="story-button" data-family="open-ticket" data-id="${safe(entry.id)}">Open ${safe(entry.name)}’s ticket</button>`).join('')}</div>
    <button class="family-chip" data-family="home">Back to Eve</button></section>`;
  const plan = planFor(letter.id);
  const gift = findGift(plan.reveal);
  return `<section class="morning morning-reveal">
    <div class="morning-star" aria-hidden="true">✦</div>
    <span class="eyebrow">A LETTER FROM THE NORTH POLE</span>
    <h1 tabindex="-1">${safe(letter.name)}, your surprise is here.</h1>
    ${gift ? `<div class="morning-gift">${thumbnail(gift)}</div><h2>${gift.name}</h2>` : `<h2>${safe(letter.activity)}</h2>`}
    <p>${plan.partner ? (gift?.id === 'train' ? 'Your first passenger is ' : 'Sharing the surprise with you is ') + safe(plan.partner) + '.' : 'Find someone you love and share the surprise together.'}</p>
    <button class="family-chip" data-family="home">Back to Eve</button>
  </section>`;
}
function archiveView() {
  return `<section class="sheet family-archive">${sheetHead('CHRISTMAS KEEPSAKES','Letters through the years','Reopen a letter and remember what you did together.')}
    ${family.letters.length ? family.letters.map(letter => `<article class="family-panel">
    <h2>${yearOf(letter)} · ${safe(letter.name)}’s letter</h2>
    <p>${safe(letter.note || 'A Christmas full of wishes.')}</p>
    <div class="family-stars">${finaleCards(letter)}</div>
    ${letter.activity ? `<p>${safe(letter.activity)}</p>` : ''}
    <label>Christmas memory <textarea maxlength="700" data-family-memory="${safe(letter.id)}" placeholder="What did you do together?">${safe(planFor(letter.id).memory || '')}</textarea></label>
    </article>`).join('') : '<p>Your first letter will start the archive.</p>'}</section>`;
}
function printTicket() {
  const letter = activeLetter();
  if (!letter || !planFor(letter.id).reveal) return;
  const ticket = document.createElement('section');
  ticket.className = 'print-ticket';
  ticket.innerHTML = `<span>NORTH POLE EXPRESS</span><h1>Christmas Morning Ticket</h1>
    <p>Reserved for ${safe(letter.name)} · Christmas ${yearOf(letter)}</p>
    <img src="assets/morning-qr.svg" alt="Scan to open the private Christmas morning reveal">
    <p>Scan with a grown-up and choose your name.</p>
    <small>${safe(location.origin)}/?morning=1</small>`;
  document.body.append(ticket);
  window.addEventListener('afterprint', () => ticket.remove(), {once:true});
  ticket.querySelector('img').decode().then(() => print()).catch(() => {
    ticket.remove();
    showFamilyNotice('The ticket image could not load. Try printing again.');
  });
}
function updatePlan(id, transform) {
  return updateFamily(doc => {
    const plan = doc.plans[id] ||= {};
    transform(plan);
  });
}
function switchProfile(id) {
  if (!family.profiles.some(child => child.id === id)) return;
  if (page === 'setup') saveSetup();
  if (page === 'letter') storeNote();
  profileId = id;
  loadProfile();
  bookIndex = 0;
  go(parentFamily() ? page : 'cover');
}

parentPages.add('archive');
chrome = function () {
  baseChrome();
  if (page === 'morning') document.getElementById('chrome').hidden = true;
  else document.getElementById('chrome').hidden = false;
};
go = function (next) {
  if (page === 'setup' && next !== 'setup' && save.timer) saveSetup();
  familyGo(next);
};
render = function (options) {
  familyRender(options);
  if (page === 'setup') app.querySelector('.setup-layout')?.insertAdjacentHTML('beforebegin',familySetup());
  if (page === 'wishes') app.querySelector('.wish-actions')?.insertAdjacentHTML('beforebegin',familyWishes());
  if (page === 'catalog' && family.profiles.length > 1) {
    app.querySelector('.reader-controls')?.insertAdjacentHTML('beforebegin',`<div class="family-actions family-bookmarks" aria-label="Sibling books">${profileButtons()}</div>`);
  }
  if (page === 'inbox') {
    app.querySelector('.sheet-head')?.insertAdjacentHTML('afterend',familyInbox());
    if (activeLetter()) {
      const letter = activeLetter();
      commerce.carts[letterKey(letter)] = planFor(letter.id).removed || [];
      const picks = selectedItems(letter);
      const checkout = app.querySelector('.checkout');
      if (checkout && !getOrder(letter)) {
        const total = checkout.querySelector('.total-block strong');
        if (total) total.textContent = dollars(totalCents(picks));
        const button = checkout.querySelector('[data-action="demo-order"]');
        if (button) {
          button.disabled = !commerce.payment || !picks.length;
          button.textContent = 'Buy selected gifts · ' + dollars(totalCents(picks));
        }
      }
      app.querySelectorAll('[data-cart]').forEach(input => {input.checked = picks.some(gift => gift.id === input.dataset.cart);});
    }
  }
  if (page === 'sent') app.querySelector('.northstar-message')?.insertAdjacentHTML('beforeend',`<div class="family-stars family-finale">${finaleCards(state.letter)}</div>`);
  if (page === 'archive') app.innerHTML = archiveView();
  if (page === 'morning') app.innerHTML = morningView();
};
showGift = function (id) {
  baseGift(id);
  const showroom = dialog.querySelector('.toy-canvas-wrap');
  const gift = findGift(id);
  if (!showroom || !gift) return;
  showroom.insertAdjacentHTML('beforeend','<div class="toy-activation" aria-live="polite"></div>');
  dialog.querySelector('.toy-detail .play-prompt')?.insertAdjacentHTML('afterend',
    `<button class="family-chip" data-family="animate-toy" data-id="${id}">Bring it to life</button>`);
};
const toyActions = {
  tiles: ['The castle windows light up.', 'castle'],
  train: ['All aboard! The train pulls out of the station.', 'train'],
  truck: ['The truck revs and climbs a snowbank.', 'truck'],
  robot: ['Pip wakes up and does a little dance.', 'robot'],
  dinosaur: ['Rex stomps and lets out a roar.', 'dinosaur'],
  fireengine: ['The fire truck flashes its lights and rolls out.', 'fireengine']
};
function activateToy(id) {
  const showroom = dialog.querySelector('.toy-canvas-wrap');
  if (!showroom) return;
  const [line, motion] = toyActions[id] || ['A little North Pole magic wakes it up.', 'robot'];
  showroom.removeAttribute('data-motion');
  void showroom.offsetWidth;
  showroom.dataset.motion = motion;
  showroom.querySelector('.toy-activation').textContent = line;
  if (id === 'train' && soundEnabled) {
    try {
      audioContext ||= new AudioContext();
      audioContext.resume();
      for (const frequency of [310, 420, 605]) {
        const tone = audioContext.createOscillator(), volume = audioContext.createGain(), start = audioContext.currentTime;
        tone.frequency.value = frequency;
        volume.gain.setValueAtTime(.001,start);
        volume.gain.exponentialRampToValueAtTime(.055,start+.12);
        volume.gain.exponentialRampToValueAtTime(.001,start+1);
        tone.connect(volume); volume.connect(audioContext.destination);
        tone.start(); tone.stop(start+1.1);
      }
    } catch {}
  } else playChime();
}
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-family]');
  if (!button || button.disabled) return;
  const {family: action, id} = button.dataset;
  switch (action) {
    case 'profile': switchProfile(id); break;
    case 'add':
      modalShell('<form id="sibling-form" class="family-panel"><h2 id="dialog-title">Add a sibling</h2><label>First name or nickname <input name="nickname" maxlength="28" required></label><button class="button primary">Add to the bookshelf</button></form>');
      break;
    case 'notifications':
      if (!globalThis.Notification) return showFamilyNotice('Santa mail alerts appear while Eve is open.');
      await Notification.requestPermission();
      showFamilyNotice(Notification.permission === 'granted' ? 'Letter notifications are enabled while Eve is open.' : 'Santa mail alerts appear inside Eve.');
      break;
    case 'budget': {
      const amount = Number(document.getElementById('family-budget').value);
      const value = Math.max(0, Math.min(10000000, Math.round(amount * 100) || 0));
      if (await updateFamily(doc => {doc.budget = value;})) showFamilyNotice('Family budget saved.');
      break;
    }
    case 'archive': go('archive'); break;
    case 'save-surprise': {
      const letter = activeLetter();
      const reveal = document.getElementById('family-reveal').value;
      const partner = document.getElementById('family-partner').value.trim();
      const claims = Object.fromEntries([...app.querySelectorAll('[data-family-claim]')].map(field => [field.dataset.familyClaim, field.value.trim()]));
      await updatePlan(letter.id, plan => Object.assign(plan, {reveal, partner, claims}));
      showFamilyNotice('Surprise saved.');
      render();
      break;
    }
    case 'ticket': printTicket(); break;
    case 'open-ticket': morningId = id; go('morning'); break;
    case 'reveal-preview': {
      const letter = activeLetter();
      const partner = document.getElementById('family-partner').value.trim();
      updatePlan(letter.id, plan => {plan.partner = partner;});
      morningId = letter.id;
      go('morning');
      break;
    }
    case 'home':
      history.replaceState(null, '', location.pathname);
      go('parent');
      break;
    case 'animate-toy': activateToy(id); break;
    case 'retry': {
      const letter = activeLetter();
      if (!letter) break;
      const child = structuredClone(profile());
      const success = await updateFamily(doc => {
        if (!doc.profiles.some(entry => entry.id === child.id)) doc.profiles.push(child);
        if (!doc.letters.some(entry => entry.id === letter.id)) doc.letters = [letter,...doc.letters].slice(0,80);
      });
      if (success) showFamilyNotice('Letter synced to the family.');
      break;
    }
  }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'sibling-form') return;
  event.preventDefault();
  const nickname = new FormData(event.target).get('nickname').trim();
  if (!nickname || family.profiles.length >= 8) return;
  const child = {id: newId(), name: nickname, wishes: [], note: '', favorite: null};
  updateFamily(doc => {if (doc.profiles.length < 8) doc.profiles.push(child);});
  closeModal();
  profileId = child.id;
  loadProfile();
  render();
});
document.addEventListener('change', event => {
  const input = event.target;
  const letter = activeLetter();
  if (input.id === 'family-favorite') {
    profile().favorite = input.value || null;
    remember();
  }
  if (input.id === 'family-activity') {
    family.activity = input.value;
    remember();
  }
  if (input.dataset.familyMemory) {
    const value = input.value;
    updatePlan(input.dataset.familyMemory, plan => {plan.memory = value;});
  }
  if (!letter || page !== 'inbox') return;
  const giftId = input.dataset.familyCart || input.dataset.cart;
  if (giftId) {
    const checked = input.checked;
    updatePlan(letter.id, plan => {
      plan.removed = (plan.removed || []).filter(id => id !== giftId);
      if (!checked) plan.removed.push(giftId);
    });
    render();
  }
  if (input.dataset.familyClaim) {
    const id = input.dataset.familyClaim, value = input.value.trim();
    updatePlan(letter.id, plan => {(plan.claims ||= {})[id] = value;});
  }
  if (input.id === 'family-reveal') {
    const value = input.value;
    const partner = document.getElementById('family-partner').value.trim();
    updatePlan(letter.id, plan => Object.assign(plan, {reveal: value, partner}));
    for (const button of app.querySelectorAll('[data-family="ticket"],[data-family="reveal-preview"]')) button.disabled = !value;
  }
  if (input.id === 'family-partner') {
    const value = input.value.trim();
    updatePlan(letter.id, plan => {plan.partner = value;});
  }
});
loadProfile();
refreshFamily(true).then(() => {
  if (new URLSearchParams(location.search).has('morning')) go('morning');
});
render();
setInterval(() => {
  if (parentFamily() || page === 'morning') refreshFamily();
}, 4000);
window.addEventListener('focus', () => {if (parentFamily()) refreshFamily();});
