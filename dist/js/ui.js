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

/* ---------- Sound and haptics ---------- */

export const sound = {
  on: (() => { try { return localStorage.getItem('eve-sound') === 'on'; } catch { return false; } })(),
  toggle() { this.on = !this.on; try { localStorage.setItem('eve-sound', this.on ? 'on' : 'off'); } catch {} if (this.on) chime(); return this.on; },
};
function context() {
  // The letter-flight score shares this context through the page-level `audioContext`.
  const ac = (window.audioContext ||= new (window.AudioContext || window.webkitAudioContext)());
  ac.resume();
  return ac;
}
function tone(ac, freq, at, length, volume, type = 'sine') {
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(volume, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + length + 0.05);
}
export function chime(level = 1) {
  if (!sound.on) return;
  try { const ac = context(); [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(ac, f, i * 0.1, 1.4, 0.035 * level)); } catch {}
}
export function blip(freq = 880) {
  if (!sound.on) return;
  try { const ac = context(); tone(ac, freq, 0, 0.18, 0.03, 'triangle'); tone(ac, freq * 1.5, 0.05, 0.22, 0.018); } catch {}
}
export function whoosh() {
  if (!sound.on) return;
  try {
    const ac = context(), length = Math.floor(ac.sampleRate * 0.7), buffer = ac.createBuffer(1, length, ac.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(i / length * Math.PI) * 0.2;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buffer; f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(300, ac.currentTime); f.frequency.exponentialRampToValueAtTime(2600, ac.currentTime + 0.6);
    g.gain.value = 0.22; s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
  } catch {}
}
export function horn() {
  if (!sound.on) return;
  try { const ac = context(); [310, 420, 605].forEach(f => tone(ac, f, 0, 1, 0.05, 'triangle')); } catch {}
}
/** A page being lifted: a short breath of filtered noise. */
export function paper() {
  if (!sound.on) return;
  try {
    const ac = context(), length = Math.floor(ac.sampleRate * 0.48), buffer = ac.createBuffer(1, length, ac.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(i / length * Math.PI) * 0.13;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buffer; f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.6; g.gain.value = 0.24;
    s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
  } catch {}
}

// Touch feedback. Android browsers vibrate directly. iPhones have no vibration API, but Safari 17.4+
// gives a system tick whenever a switch-style checkbox is toggled, so we keep a hidden one to nudge.
let tickSwitch = null;
function switchTick() {
  if (!tickSwitch) {
    tickSwitch = document.createElement('label');
    tickSwitch.setAttribute('aria-hidden', 'true');
    tickSwitch.style.cssText = 'position:fixed;left:-99px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.setAttribute('switch', ''); input.tabIndex = -1;
    tickSwitch.append(input);
    document.body.append(tickSwitch);
  }
  tickSwitch.click();
}
const touchScreen = matchMedia('(pointer: coarse)');
export const buzz = pattern => {
  try {
    if (navigator.vibrate) { navigator.vibrate(pattern); return; }
    if (!touchScreen.matches) return;
    // A pattern is [buzz, pause, buzz, ...]: play one tick for each buzz.
    const steps = Array.isArray(pattern) ? pattern : [pattern];
    let at = 0;
    steps.forEach((ms, i) => { if (i % 2 === 0) at ? setTimeout(switchTick, at) : switchTick(); at += ms; });
  } catch {}
};

/* ---------- Press-and-hold controls ---------- */

/**
 * Turns [data-hold] buttons into press-and-hold controls with a filling ring.
 * Keyboard and switch users activate them with a normal click (Enter / Space).
 */
export function initHold(onComplete) {
  let active = null;
  const cancel = () => {
    if (!active) return;
    cancelAnimationFrame(active.frame);
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
    const step = now => {
      if (!active || active.el !== el) return;
      const p = Math.min(1, (now - start) / length);
      el.style.setProperty('--hold', p);
      if (p >= 1) { el.dataset.held = '1'; cancel(); buzz(18); onComplete(el); return; }
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
