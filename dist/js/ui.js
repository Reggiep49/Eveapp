// Small shared pieces: icons, formatting, toasts, the dialog shell, sound and touch feedback.

const paths = {
  spark: '<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z"/>',
  home: '<path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7.5 8 6 8-6"/>',
  box: '<path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4Z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/>',
  heart: '<path d="M20.8 8.6c0 4.3-8.8 9.8-8.8 9.8S3.2 12.9 3.2 8.6a4.4 4.4 0 0 1 8.8-.2 4.4 4.4 0 0 1 8.8.2Z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8Z"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  brick: '<path d="M4 9h16v11H4zM7 9V5h4v4m2 0V5h4v4"/>',
  book: '<path d="M12 6v14m0-14c-3-3-7-2-9-2v14c4-1 7 0 9 2 2-2 5-3 9-2V4c-2 0-6-1-9 2Z"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1m-7 8v4m-3 0h6"/>',
  sound: '<path d="M3 9h4l5-4v14l-5-4H3Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  mute: '<path d="M3 9h4l5-4v14l-5-4H3Zm13 0 5 6m0-6-5 6"/>',
  rotate: '<path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
  bell: '<path d="M4 17h16l-2-3V9a6 6 0 0 0-12 0v5ZM10 21h4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  play: '<path d="M7 4.5v15l12-7.5Z"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="9" r="1.5"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9c-5 0-6-6-2.5-6 2 0 2.5 3 2.5 6Zm0 0c5 0 6-6 2.5-6-2 0-2.5 3-2.5 6Z"/>',
  ticket: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.800a3.5 3.5 0 0 1 0 6.400M18 14.500a6.5 6.5 0 0 1 3.5 5.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wand: '<path d="m4 20 11-11m2-5 .8 2.200L20 7l-2.2.8L17 10l-.8-2.200L14 7l2.2-.8ZM6 4l.5 1.500L8 6l-1.5.5L6 8l-.5-1.500L4 6l1.5-.5Z"/>',
  hand: '<path d="M8 12V5.500a1.5 1.5 0 0 1 3 0V11m0-1V4.500a1.5 1.5 0 0 1 3 0V11m0-4.500a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7c-2.5 0-4-1-5.5-3L4 14.500a1.5 1.5 0 0 1 2.5-1.600L8 15"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9m-9 4h4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.500a3.8 3.8 0 0 1-.5 7.500Z"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.500S22 12 22 12s-3.6 6.5-10 6.500S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
};
export const icon = (key, size = 20) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key] || paths.spark}</svg>`;

export const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const irregular = {wish: 'wishes', discovery: 'discoveries', delivery: 'deliveries'};
export const plural = (n, word) => `${n} ${n === 1 ? word : irregular[word] || word + 's'}`;
export const toyImage = (gift, size = 96) => `<img class="toy-img" src="assets/toys/${gift.id}.webp" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`;
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
export const compact = matchMedia('(max-width: 820px)');
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const announce = text => { const live = $('#status'); live.textContent = ''; requestAnimationFrame(() => { live.textContent = text; }); };

let toastTimer;
export function toast(message, tone = '') {
  const el = $('#toast');
  el.innerHTML = `<i class="toast-dot ${tone}"></i><span>${safe(message)}</span>`;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4200);
}
export const dismissToast = () => { clearTimeout(toastTimer); $('#toast').classList.remove('visible'); };

/* ---------- Dialog shell ---------- */

let trigger = null, cleanup = null;
const dialog = () => $('#dialog');
export function openDialog(html, {variant = 'card', onClose} = {}) {
  closeDialog({restore: false});
  const el = dialog();
  trigger = document.activeElement;
  cleanup = onClose || null;
  el.className = `dialog dialog-${variant}`;
  el.innerHTML = html;
  el.tabIndex = -1;
  el.showModal();
  el.focus({preventScroll: true});
  return el;
}
export function closeDialog({restore = true} = {}) {
  const el = dialog();
  if (!el.open) return;
  const done = cleanup; cleanup = null;
  el.close();
  el.innerHTML = '';
  done?.();
  if (restore && trigger?.isConnected) trigger.focus({preventScroll: true});
  trigger = null;
}
export const dialogOpen = () => dialog().open;
export function initDialog() {
  const el = dialog();
  el.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  el.addEventListener('click', event => { if (event.target === el) closeDialog(); });
}

/* ---------- Sound ---------- */

// Sound is part of how the book feels, so it is on unless someone has turned it off.
const savedSound = (() => { try { return localStorage.getItem('eve-sound'); } catch { return null; } })();
export const sound = {
  on: savedSound !== 'off',
  toggle() { this.on = !this.on; try { localStorage.setItem('eve-sound', this.on ? 'on' : 'off'); } catch {} if (this.on) chime(0.7); else friction.stop(); return this.on; },
};
/** The shared audio clock (created on first use). */
export const audio = () => context();
function context() {
  // The page-level `audioContext` is shared so every sound uses one clock.
  const ac = (window.audioContext ||= new (window.AudioContext || window.webkitAudioContext)());
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
// Browsers only let audio start from a touch or click, so wake it on the first one.
addEventListener('pointerdown', () => { if (sound.on) { try { context(); } catch {} } }, {capture: true, passive: true});

function tone(ac, freq, at, length, volume, type = 'sine', glideTo) {
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + length);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(volume, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + length + 0.05);
}
let noiseBuffer = null;
function noise(ac) {
  if (!noiseBuffer) { noiseBuffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuffer.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(); s.buffer = noiseBuffer; s.loop = true; return s;
}
function burst(ac, {freq = 1500, q = 0.7, length = 0.3, volume = 0.2, to, type = 'bandpass', at = 0}) {
  const s = noise(ac), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime + at;
  f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + length);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(volume, t + length * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t, Math.random()); s.stop(t + length + 0.05);
}
const play = fn => { if (!sound.on) return; try { fn(context()); } catch {} };

export const chime = (level = 1) => play(ac => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, i * 0.09, 1.6, 0.03 * level)));
export const blip = (freq = 880) => play(ac => { tone(ac, freq, 0, 0.16, 0.022, 'triangle'); tone(ac, freq * 1.5, 0.04, 0.2, 0.012); });
export const whoosh = () => play(ac => burst(ac, {freq: 300, to: 2600, length: 0.7, volume: 0.2, q: 0.8}));
export const horn = () => play(ac => [310, 420, 605].forEach(f => tone(ac, f, 0, 1, 0.05, 'triangle')));
/** Sleigh bells at the door: a delivery has arrived. */
export const sleigh = () => play(ac => { for (let i = 0; i < 7; i++) for (const f of [5200, 6900, 8300]) tone(ac, f * (0.98 + Math.random() * 0.04), i * 0.13 + Math.random() * 0.01, 0.12, 0.012, 'square'); tone(ac, 196, 1.0, 0.25, 0.1, 'sine', 120); tone(ac, 196, 1.22, 0.25, 0.1, 'sine', 120); });
/** A sheet lifting off the stack. */
export const paper = () => play(ac => burst(ac, {freq: 2400, to: 1200, length: 0.22, volume: 0.1, q: 0.5}));
/** A page coming to rest: soft air, then the pat of paper on paper. */
export const pageLand = () => play(ac => { burst(ac, {freq: 900, to: 300, length: 0.16, volume: 0.16, q: 0.4}); tone(ac, 150, 0.02, 0.14, 0.11, 'sine', 70); });
/** Something heavy settling: the book on the desk, the wax seal, the postmark. */
export const thud = (level = 1) => play(ac => { tone(ac, 110, 0, 0.32, 0.26 * level, 'sine', 42); burst(ac, {freq: 320, length: 0.12, volume: 0.12 * level, q: 0.3, type: 'lowpass'}); });
/** The cover swinging open. */
export const coverOpen = () => play(ac => { burst(ac, {freq: 240, to: 900, length: 1.1, volume: 0.16, q: 0.6}); [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(ac, f, 0.25 + i * 0.13, 2.4, 0.03)); });
/** A wish becoming a star. */
export const starBorn = () => play(ac => { [523.25, 783.99, 1046.5, 1567.98].forEach((f, i) => tone(ac, f, i * 0.07, 3.2, 0.036)); tone(ac, 130.81, 0, 3, 0.05); });
export const rise = () => play(ac => { burst(ac, {freq: 260, to: 5200, length: 1.5, volume: 0.2, q: 1.1}); tone(ac, 196, 0, 1.5, 0.035, 'sine', 1174); });

/** The quiet before: a low, slow pad under the closed book. Returns a function that fades it out. */
export function drone() {
  if (!sound.on) return () => {};
  try {
    const ac = context(), g = ac.createGain(), f = ac.createBiquadFilter(), t = ac.currentTime, nodes = [];
    f.type = 'lowpass'; f.frequency.value = 520; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.085, t + 3.5);
    for (const [freq, detune] of [[65.41, 0], [98, 4], [130.81, -5], [196, 3]]) {
      const o = ac.createOscillator(), lfo = ac.createOscillator(), depth = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = detune;
      lfo.frequency.value = 0.08 + Math.random() * 0.12; depth.gain.value = 6; lfo.connect(depth); depth.connect(o.detune);
      o.connect(f); o.start(); lfo.start(); nodes.push(o, lfo);
    }
    f.connect(g); g.connect(ac.destination);
    return (fade = 0.5) => { try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(0.0001, ac.currentTime, fade / 4); nodes.forEach(n => n.stop(ac.currentTime + fade + 0.2)); } catch {} };
  } catch { return () => {}; }
}
/** The book bursting open: a held breath, then everything at once. */
export const crescendo = () => play(ac => {
  tone(ac, 82, 0, 1.4, 0.32, 'sine', 36);
  burst(ac, {freq: 180, to: 7000, length: 1.6, volume: 0.24, q: 0.5});
  burst(ac, {freq: 6000, to: 9000, length: 2.6, volume: 0.05, q: 1.5, type: 'highpass'});
  [130.81, 196, 261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, 0.02 + i * 0.012, 4.2 - i * 0.2, 0.05 - i * 0.003, i < 3 ? 'triangle' : 'sine'));
  [1318.5, 1567.98, 2093, 2637, 3136].forEach((f, i) => tone(ac, f, 0.5 + i * 0.11, 2.2, 0.018));
});

/** A tone that climbs while something is held, and stops the moment it is let go. */
export function charge() {
  if (!sound.on) return () => {};
  try {
    const ac = context(), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    const n = noise(ac), nf = ac.createBiquadFilter(), ng = ac.createGain(), span = 2.1;
    o.type = 'sine'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(98, t); o.frequency.exponentialRampToValueAtTime(392, t + span); o2.frequency.setValueAtTime(49, t); o2.frequency.exponentialRampToValueAtTime(196, t + span);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(4200, t + span);
    nf.type = 'bandpass'; nf.Q.value = 1.2; nf.frequency.setValueAtTime(300, t); nf.frequency.exponentialRampToValueAtTime(6000, t + span); ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.16, t + span);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.3); g.gain.linearRampToValueAtTime(0.13, t + span);
    o.connect(g); o2.connect(lp); lp.connect(g); n.connect(nf); nf.connect(ng); ng.connect(g); g.connect(ac.destination); o.start(); o2.start(); n.start();
    return () => { try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.03); for (const x of [o, o2, n]) x.stop(ac.currentTime + 0.2); } catch {} };
  } catch { return () => {}; }
}
/** Paper dragging against paper: a hiss whose loudness follows how fast the page is moving. */
export const friction = {
  node: null,
  set(amount) {
    if (!sound.on || (!this.node && amount <= 0)) return;
    try {
      const ac = context();
      if (!this.node) {
        const s = noise(ac), f = ac.createBiquadFilter(), g = ac.createGain();
        f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.45; g.gain.value = 0;
        s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
        this.node = {s, f, g};
      }
      this.node.g.gain.setTargetAtTime(Math.min(0.09, amount * 0.09), ac.currentTime, 0.04);
      this.node.f.frequency.setTargetAtTime(1800 + amount * 2200, ac.currentTime, 0.05);
    } catch {}
  },
  stop() { try { this.node?.s.stop(); } catch {} this.node = null; },
};

/* ---------- Touch feedback ---------- */

// Three routes, best first:
//  1. A native shell (Capacitor) exposes real haptics, including on iPhone.
//  2. Android browsers can vibrate directly.
//  3. iPhone Safari has no vibration call. Toggling a switch-style checkbox makes the system tick,
//     so a throwaway one is clicked. It is faint, and some in-app browsers ignore it.
const nativeHaptics = () => window.Capacitor?.Plugins?.Haptics;
const coarse = matchMedia('(pointer: coarse)');
function switchTick() {
  const label = document.createElement('label'), input = document.createElement('input');
  label.setAttribute('aria-hidden', 'true'); label.style.display = 'none';
  input.type = 'checkbox'; input.setAttribute('switch', '');
  label.append(input); document.head.append(label);
  label.click(); label.remove();
}
const strengths = {tick: [6, 'Light'], soft: [10, 'Light'], firm: [22, 'Medium'], heavy: [38, 'Heavy']};
/** kind: 'tick' | 'soft' | 'firm' | 'heavy', or a vibration pattern in milliseconds. */
export function buzz(kind = 'tick') {
  try {
    const native = nativeHaptics(), [ms, style] = strengths[kind] || [0, 'Medium'];
    if (native) { native.impact({style: typeof kind === 'string' ? style : 'Medium'}); return; }
    if (navigator.vibrate) { navigator.vibrate(typeof kind === 'string' ? ms : kind); return; }
    if (!coarse.matches) return;
    const beats = Array.isArray(kind) ? Math.ceil(kind.length / 2) : 1;
    for (let i = 0; i < beats; i++) i ? setTimeout(switchTick, i * 70) : switchTick();
  } catch {}
}

/* ---------- Press-and-hold controls ---------- */

/**
 * Turns [data-hold] buttons into press-and-hold controls with a filling ring.
 * Keyboard and switch users activate them with a normal click (Enter / Space).
 */
export function initHold(onComplete) {
  let active = null;
  const cancel = done => {
    if (!active) return;
    cancelAnimationFrame(active.frame);
    if (done !== true) active.el.dispatchEvent(new CustomEvent('holdprogress', {bubbles: true, detail: 0}));
    active.el.dispatchEvent(new CustomEvent('holdend', {bubbles: true, detail: done === true}));
    active.el.classList.remove('holding');
    active.el.style.removeProperty('--hold');
    active = null;
  };
  document.addEventListener('pointerdown', event => {
    const el = event.target.closest('[data-hold]');
    if (!el || el.disabled || event.button > 0) return;
    cancel();
    const length = Number(el.dataset.holdMs) || 1100, start = performance.now();
    active = {el, frame: 0};
    el.classList.add('holding');
    el.dispatchEvent(new CustomEvent('holdstart', {bubbles: true}));
    const step = now => {
      if (!active || active.el !== el) return;
      const p = Math.min(1, (now - start) / length);
      el.style.setProperty('--hold', p);
      el.dispatchEvent(new CustomEvent('holdprogress', {bubbles: true, detail: p}));
      if (p >= 1) { el.dataset.held = '1'; cancel(true); buzz('firm'); onComplete(el); return; }
      active.frame = requestAnimationFrame(step);
    };
    active.frame = requestAnimationFrame(step);
  });
  addEventListener('pointerup', cancel, true);
  addEventListener('pointercancel', cancel, true);
  addEventListener('pointerleave', event => { if (active && event.target === active.el) cancel(); }, true);
  addEventListener('blur', event => { if (event.target === window) cancel(); });
  document.addEventListener('contextmenu', event => { if (event.target.closest('[data-hold]')) event.preventDefault(); });
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-hold]');
    if (!el) return;
    if (el.dataset.held) { delete el.dataset.held; return; }
    // A click that did not come from a pointer (detail 0) is the keyboard path.
    if (event.detail === 0) onComplete(el);
    else el.classList.add('hold-nudge'), setTimeout(() => el.classList.remove('hold-nudge'), 600);
  });
}

/** Sparks that fly from one element toward another (used when a wish is made). */
export function sparkFlight(from, to, color = '#ffd58a') {
  if (reducedMotion.matches || !from || !to) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const sx = a.left + a.width / 2, sy = a.top + a.height / 2, ex = b.left + b.width / 2, ey = b.top + b.height / 2;
  for (let i = 0; i < 9; i++) {
    const dot = document.createElement('i');
    dot.className = 'spark-fly';
    dot.style.cssText = `left:${sx}px;top:${sy}px;background:${color};box-shadow:0 0 12px 2px ${color}`;
    (document.querySelector('dialog[open]') || document.body).append(dot);
    const bend = (Math.random() - 0.5) * 220;
    dot.animate([
      {transform: 'translate(-50%,-50%) scale(.4)', opacity: 0},
      {transform: `translate(calc(-50% + ${(ex - sx) * 0.45 + bend}px), calc(-50% + ${(ey - sy) * 0.45 - 90 - Math.random() * 60}px)) scale(1.5)`, opacity: 1, offset: 0.45},
      {transform: `translate(calc(-50% + ${ex - sx}px), calc(-50% + ${ey - sy}px)) scale(.3)`, opacity: 0.2},
    ], {duration: 720 + i * 45, delay: i * 28, easing: 'cubic-bezier(.3,.1,.2,1)', fill: 'both'}).onfinish = () => dot.remove();
  }
}
