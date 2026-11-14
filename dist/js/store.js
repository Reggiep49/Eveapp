// Family state, sync with the Sites worker, and the simulated commerce flow.
// Storage keys and document shapes match earlier editions, so saved families keep working.

import {gifts, stores, findGift, getStore, routeByStore, shipmentStates} from './data.js';

const FAMILY_KEY = 'eve-family-v1';
const PROFILE_KEY = 'eve-active-profile';
const COMMERCE_KEY = 'santas-lookbook-parents-v2';
const LEGACY_KEY = 'santas-lookbook-v1';
const FALLBACK_NAME = 'Christmas explorer';

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); return true; } catch { return false; } };

/* ---------- Family document ---------- */

function freshFamily() {
  const legacy = read(LEGACY_KEY) || {};
  const first = {id: newId(), name: legacy.name || 'Charlie', wishes: legacy.wishes || [], note: legacy.note || '', favorite: null};
  return {
    profiles: [first],
    letters: legacy.letter ? [{...legacy.letter, profile: first.id}] : [],
    stores: legacy.stores || stores.map(s => s.id),
    excluded: legacy.excluded || [],
    activity: '', budget: 0, plans: {},
  };
}
function normalize(doc) {
  doc.profiles = Array.isArray(doc.profiles) && doc.profiles.length ? doc.profiles : freshFamily().profiles;
  doc.letters = Array.isArray(doc.letters) ? doc.letters : [];
  doc.stores = Array.isArray(doc.stores) ? doc.stores : stores.map(s => s.id);
  doc.excluded = Array.isArray(doc.excluded) ? doc.excluded : [];
  doc.plans = doc.plans && typeof doc.plans === 'object' ? doc.plans : {};
  doc.activity ||= '';
  doc.budget ||= 0;
  for (const child of doc.profiles) { child.wishes ||= []; child.note ||= ''; child.favorite ??= null; }
  return doc;
}

export let family = normalize(read(FAMILY_KEY) || freshFamily());
let profileId = localStorage.getItem(PROFILE_KEY) || family.profiles[0].id;

export const sync = {online: false, revision: 0, writes: 0, lastLetterId: family.letters[0]?.id};
const listeners = new Set();
/** Subscribe to remote changes and sync notices: fn({type, message}). */
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = event => listeners.forEach(fn => fn(event));

const remember = () => write(FAMILY_KEY, family);

export const profile = () => family.profiles.find(c => c.id === profileId) || family.profiles[0];
export const childName = () => (profile().name || '').trim() || FALLBACK_NAME;
export const lettersFor = id => family.letters.filter(l => l.profile === id);
export const activeLetter = () => family.letters.find(l => l.profile === profile().id) || null;
export const planFor = id => family.plans[id] || {};

export const eligible = () => gifts.filter(g => family.stores.includes(g.store));
export const curated = () => eligible().filter(g => !family.excluded.includes(g.id));
export const isCurated = id => curated().some(g => g.id === id);
export const wished = () => { const ok = curated(); return profile().wishes.map(findGift).filter(g => g && ok.includes(g)); };

async function request(method = 'GET', data) {
  const response = await fetch('/api/family', {
    method, cache: 'no-store',
    ...(data ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)} : {}),
  });
  if (!response.ok && response.status !== 409) throw Error('Family sync unavailable');
  return {conflict: response.status === 409, ...await response.json()};
}

/** Pull the family document. Skipped while local writes are in flight. */
export async function refreshFamily({initial = false, quiet = false} = {}) {
  if (sync.writes || childDirty || setupDirty) return;
  try {
    const remote = await request();
    if (sync.writes || remote.revision < sync.revision) return;
    const wasOnline = sync.online;
    const changed = remote.revision !== sync.revision;
    sync.revision = remote.revision;
    sync.online = true;
    if (!wasOnline) emit({type: 'status'});
    if (!remote.data) {
      // First visit on this account: publish what this device already has.
      if (initial) updateFamily(() => {});
      return;
    }
    if (!changed) return;
    const incoming = remote.data.letters?.[0];
    family = normalize(remote.data);
    remember();
    const fresh = !initial && incoming && incoming.id !== sync.lastLetterId;
    sync.lastLetterId = incoming?.id;
    if (!quiet) emit({type: 'remote', newLetter: fresh ? incoming : null});
  } catch {
    if (sync.online) { sync.online = false; emit({type: 'status'}); }
  }
}

let pending = Promise.resolve();
/** Apply a change locally right away, then replay it on the server copy (with conflict retries). */
export function updateFamily(change) {
  const local = structuredClone(family);
  change(local);
  family = local;
  remember();
  sync.writes++;
  const operation = pending.then(async () => {
    let remote = await request();
    for (let attempt = 0; attempt < 4; attempt++) {
      const doc = normalize(structuredClone(remote.data || local));
      if (remote.data) change(doc);
      const result = await request('PUT', {revision: remote.revision, data: doc});
      if (!result.conflict) {
        sync.revision = result.revision;
        if (!sync.online) { sync.online = true; emit({type: 'status'}); }
        if (sync.writes === 1) { family = doc; remember(); }
        return true;
      }
      remote = result;
    }
    throw Error('Concurrent family update');
  }).catch(() => {
    if (sync.online) { sync.online = false; emit({type: 'status'}); }
    emit({type: 'offline-save'});
    return false;
  }).finally(() => { sync.writes--; });
  pending = operation;
  return operation;
}

/* ---------- Profiles and curation (parent) ---------- */

export function switchProfile(id) {
  if (!family.profiles.some(c => c.id === id)) return false;
  flushChild();
  profileId = id;
  write(PROFILE_KEY, id);
  return true;
}
export function addProfile(name) {
  const clean = name.trim().slice(0, 28);
  if (!clean || family.profiles.length >= 8) return null;
  const child = {id: newId(), name: clean, wishes: [], note: '', favorite: null};
  updateFamily(doc => { if (doc.profiles.length < 8 && !doc.profiles.some(c => c.id === child.id)) doc.profiles.push(child); });
  profileId = child.id;
  write(PROFILE_KEY, child.id);
  return child;
}

let setupTimer = null, setupDirty = false;
const pushSetup = () => {
  clearTimeout(setupTimer);
  if (!setupDirty) return;
  setupDirty = false;
  const snapshot = {id: profile().id, name: profile().name, stores: [...family.stores], excluded: [...family.excluded]};
  updateFamily(doc => {
    const child = doc.profiles.find(c => c.id === snapshot.id);
    if (child) child.name = snapshot.name.trim() || FALLBACK_NAME;
    doc.stores = snapshot.stores;
    doc.excluded = snapshot.excluded;
  });
};
const touchSetup = () => { setupDirty = true; remember(); clearTimeout(setupTimer); setupTimer = setTimeout(pushSetup, 500); };
export const flushSetup = pushSetup;

export function setName(value) { profile().name = value.slice(0, 28); touchSetup(); }
export function setStore(id, on) {
  family.stores = on ? [...new Set([...family.stores, id])] : family.stores.filter(s => s !== id);
  touchSetup();
}
export function setIncluded(id, on) {
  family.excluded = on ? family.excluded.filter(g => g !== id) : [...new Set([...family.excluded, id])];
  touchSetup();
}
export function setBudget(amount) {
  const value = Math.max(0, Math.min(10000000, Math.round(Number(amount) * 100) || 0));
  return updateFamily(doc => { doc.budget = value; });
}

/* ---------- The child's wishes ---------- */

let childTimer = null, childDirty = false;
function pushChild() {
  clearTimeout(childTimer);
  if (!childDirty) return;
  childDirty = false;
  const snap = structuredClone(profile()), activity = family.activity;
  updateFamily(doc => {
    const child = doc.profiles.find(c => c.id === snap.id);
    if (child) Object.assign(child, {wishes: snap.wishes, note: snap.note, favorite: snap.favorite});
    doc.activity = activity;
  });
}
export const flushChild = pushChild;
const touchChild = () => { childDirty = true; remember(); clearTimeout(childTimer); childTimer = setTimeout(pushChild, 1200); };

export function toggleWish(id) {
  if (!isCurated(id)) return null;
  const child = profile();
  const adding = !child.wishes.includes(id);
  child.wishes = adding ? [...child.wishes, id] : child.wishes.filter(w => w !== id);
  if (!child.wishes.includes(child.favorite)) child.favorite = null;
  touchChild();
  return adding;
}
export function setFavorite(id) {
  const child = profile();
  child.favorite = child.favorite === id || !child.wishes.includes(id) ? null : id;
  touchChild();
  return child.favorite;
}
export function setActivity(value) { family.activity = family.activity === value ? '' : value; touchChild(); }
export function setNote(value) { profile().note = value.slice(0, 700); touchChild(); }

/** Seal the letter: saved here first, then delivered to the family document. */
export function sealLetter() {
  const picks = wished();
  if (!picks.length) return null;
  clearTimeout(childTimer); childDirty = false;
  const child = {...profile(), name: childName(), wishes: picks.map(g => g.id)};
  const letter = {
    id: newId(), profile: child.id, name: child.name, gifts: child.wishes,
    favorite: child.wishes.includes(child.favorite) ? child.favorite : null,
    activity: family.activity, note: child.note, date: new Date().toISOString(),
  };
  sync.lastLetterId = letter.id;
  const delivered = updateFamily(doc => {
    const index = doc.profiles.findIndex(c => c.id === child.id);
    if (index >= 0) doc.profiles[index] = child;
    else if (doc.profiles.length < 8) doc.profiles.push(child);
    doc.activity = letter.activity;
    if (!doc.letters.some(l => l.id === letter.id)) doc.letters = [letter, ...doc.letters].slice(0, 80);
  });
  return {letter, delivered};
}
export function resendLetter(letter) {
  const child = structuredClone(profile());
  return updateFamily(doc => {
    if (!doc.profiles.some(c => c.id === child.id) && doc.profiles.length < 8) doc.profiles.push(child);
    if (!doc.letters.some(l => l.id === letter.id)) doc.letters = [letter, ...doc.letters].slice(0, 80);
  });
}
export const updatePlan = (id, transform) => updateFamily(doc => { transform(doc.plans[id] ||= {}); });

/* ---------- Simulated commerce (this browser only) ---------- */

const commerceDefaults = {sample: null, carts: {}, payment: false, orders: [], notices: true, activity: []};
export const commerce = {...structuredClone(commerceDefaults), ...(read(COMMERCE_KEY) || {})};
export const saveCommerce = () => write(COMMERCE_KEY, commerce);

export const money = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
export const cents = price => Math.round(price * 100);
export const dollars = amount => money.format(amount / 100);
export const totalCents = items => items.reduce((sum, item) => sum + cents(item.price), 0);

/** The letter the parent is looking at: the child's latest, or the sample once it has been opened. */
export const currentLetter = () => activeLetter() || commerce.sample;
export const letterItems = letter => (letter?.gifts || []).map(findGift).filter(Boolean);
export const removedFor = letter => planFor(letter.id).removed || [];
export const selectedItems = letter => letterItems(letter).filter(g => !removedFor(letter).includes(g.id));
export const getOrder = letter => (letter && commerce.orders.find(o => o.letterId === String(letter.id))) || null;
export const allPackages = () => commerce.orders.flatMap(o => o.packages);

export function openSampleLetter() {
  commerce.sample ||= {id: 'sample', name: childName(), note: 'I’d love a toy we can all play with on Christmas morning!',
    gifts: ['tiles', 'bunny', 'telescope', 'art'], favorite: 'telescope', activity: 'Build a blanket fort', date: new Date().toISOString()};
  saveCommerce();
}
export function setPicked(letter, giftId, on) {
  if (getOrder(letter)) return;
  return updatePlan(letter.id, plan => {
    plan.removed = (plan.removed || []).filter(id => id !== giftId);
    if (!on) plan.removed.push(giftId);
  });
}

export function offsetDate(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('-');
}
const noon = iso => new Date(iso + 'T12:00:00');
export const prettyDate = iso => noon(iso.slice(0, 10)).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});

export function placeOrder(letter) {
  if (!letter || !commerce.payment || getOrder(letter)) return null;
  const picks = selectedItems(letter);
  if (!picks.length) return null;
  const id = `NP-${String(commerce.orders.length + 1).padStart(4, '0')}`;
  const now = new Date();
  const packages = stores.filter(s => picks.some(g => g.store === s.id)).map((store, index) => {
    const items = picks.filter(g => g.store === store.id), route = routeByStore[store.id];
    return {id: `${id}-${index + 1}`, order: id, store: store.id, items: items.map(g => g.id), total: totalCents(items),
      originalEta: offsetDate(now, route.days), eta: offsetDate(now, route.days), carrier: route.carrier, stage: 0,
      tracking: '', receipt: '', history: [{stage: 0, date: offsetDate(now, 0)}]};
  });
  const order = {id, letterId: String(letter.id), date: offsetDate(now, 0), items: picks.map(g => g.id), total: totalCents(picks), packages};
  commerce.orders.push(order);
  saveCommerce();
  return order;
}

function sampleEmails() {
  return commerce.orders.flatMap(order => order.packages.flatMap(pkg => [
    `Subject: Receipt from ${getStore(pkg.store).name}\nPackage: ${pkg.id}\nReceipt: R-${pkg.id}\nAmount: ${(pkg.total / 100).toFixed(2)}\nDate: ${order.date}`,
    ...(pkg.stage > 0 ? [`Subject: Shipping confirmation\nPackage: ${pkg.id}\nCarrier: ${pkg.carrier}\nTracking: DEMO-${pkg.id}\nEstimated delivery: ${pkg.eta}`] : []),
  ]));
}
function extractMail(messages) {
  const packages = new Map(allPackages().map(pkg => [pkg.id, pkg]));
  let imported = 0;
  for (const message of messages) {
    const fields = Object.fromEntries(message.split('\n').map(line => {
      const split = line.indexOf(': ');
      return [line.slice(0, split), line.slice(split + 2)];
    }));
    const pkg = packages.get(fields.Package);
    if (!pkg) continue;
    if (fields.Receipt && pkg.receipt !== fields.Receipt) {
      Object.assign(pkg, {receipt: fields.Receipt, receiptDate: fields.Date, receiptTotal: cents(Number(fields.Amount))});
      imported++;
    }
    if (fields.Tracking && pkg.tracking !== fields.Tracking) {
      Object.assign(pkg, {tracking: fields.Tracking, carrier: fields.Carrier});
      imported++;
    }
    if (fields['Estimated delivery']) pkg.eta = fields['Estimated delivery'];
  }
  return imported;
}
export function scanSampleInbox() {
  const imported = extractMail(sampleEmails());
  saveCommerce();
  return imported;
}
/** Move every open package one step along its simulated route. */
export function advanceDeliveries() {
  const last = shipmentStates.length - 1;
  const moving = allPackages().filter(pkg => pkg.stage < last);
  for (const pkg of moving) {
    const special = pkg.store === 'lego' || pkg.store === 'books' || allPackages().length === 1;
    pkg.stage += pkg.stage === 1 && !special ? 2 : 1;
    if (pkg.stage === 2) pkg.eta = offsetDate(noon(pkg.eta), 2);
    const eventDate = pkg.stage === 1
      ? offsetDate(noon(pkg.history[0].date), 1)
      : offsetDate(noon(pkg.eta), pkg.stage === 2 ? -3 : pkg.stage === 3 ? -1 : 0);
    pkg.history.push({stage: pkg.stage, date: eventDate});
    if (commerce.notices) commerce.activity.unshift({store: pkg.store, stage: pkg.stage, id: pkg.id, date: eventDate});
  }
  commerce.activity = commerce.activity.slice(0, 40);
  extractMail(sampleEmails());
  saveCommerce();
  return moving;
}
export function receiptsCsv() {
  const packages = allPackages().filter(pkg => pkg.receipt).sort((a, b) => getStore(a.store).name.localeCompare(getStore(b.store).name));
  if (!packages.length) return null;
  const rows = [['Store', 'Order', 'Receipt', 'Order date', 'Gifts', 'Total USD', 'Carrier', 'Tracking'],
    ...packages.map(pkg => [getStore(pkg.store).name, pkg.order, pkg.receipt, pkg.receiptDate,
      pkg.items.map(id => findGift(id).name).join(' / '), (pkg.receiptTotal / 100).toFixed(2), pkg.carrier, pkg.tracking])];
  return '﻿' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}

/* ---------- Derived: where the family is in its Christmas ---------- */

export function daysToChristmas(now = new Date()) {
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
  const target = new Date(year, 11, 25);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {days: Math.round((target - today) / 864e5), year};
}
export function journey() {
  const letter = currentLetter(), order = getOrder(letter), packages = allPackages();
  const home = packages.filter(p => p.stage === 5).length;
  const steps = [
    {id: 'curate', label: 'Curate', done: curated().length > 0},
    {id: 'explore', label: 'Explore', done: wished().length > 0 || !!letter},
    {id: 'letter', label: 'Letter', done: !!letter},
    {id: 'order', label: 'Gifts', done: !!order},
    {id: 'deliver', label: 'Delivery', done: packages.length > 0 && home === packages.length},
    {id: 'morning', label: 'Morning', done: !!(letter && planFor(letter.id).reveal)},
  ];
  return {steps, next: steps.find(s => !s.done)?.id || 'ready', letter, order, packages, home};
}
