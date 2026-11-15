// The score: public-domain carols played on a music box, arranged in the browser. No audio files.

import {sound, audio} from './ui.js';

const SEMI = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
const freq = note => { const m = /^([A-G])([#b]?)(\d)$/.exec(note); return 440 * Math.pow(2, (SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12 - 9) / 12); };
// "G4:1.5" is a G for a beat and a half; "R" is a rest.
const parse = text => text.trim().split(/\s+/).map(tok => { const [n, d] = tok.split(':'); return {f: n === 'R' ? 0 : freq(n), d: Number(d)}; });

const TUNES = {
  // Silent Night (Gruber, 1818)
  silent: {bpm: 80, meter: 3, pedal: 'C3', notes: parse('G4:1.5 A4:.5 G4:1 E4:3 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 B4:3 C5:2 C5:1 G4:3 A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3 A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 F5:1.5 D5:.5 B4:1 C5:3 E5:3 C5:1 G4:1 E4:1 G4:1.5 F4:.5 D4:1 C4:3 R:3')},
  // Deck the Halls (Welsh, traditional)
  deck: {bpm: 126, pedal: 'C3', bells: true, notes: parse('G4:1.5 F4:.5 E4:1 D4:1 C4:1 D4:1 E4:1 C4:1 D4:.5 E4:.5 F4:.5 D4:.5 E4:1.5 D4:.5 C4:1 B3:1 C4:2 G4:1.5 F4:.5 E4:1 D4:1 C4:1 D4:1 E4:1 C4:1 D4:.5 E4:.5 F4:.5 D4:.5 E4:1.5 D4:.5 C4:1 B3:1 C4:2 D4:1.5 E4:.5 F4:1 D4:1 E4:1.5 F4:.5 G4:1 D4:1 E4:.5 F#4:.5 G4:1 A4:.5 B4:.5 C5:1 B4:1 A4:1 G4:2 G4:1.5 F4:.5 E4:1 D4:1 C4:1 D4:1 E4:1 C4:1 A4:.5 A4:.5 A4:.5 A4:.5 G4:1.5 F4:.5 E4:1 D4:1 C4:2 R:2')},
  // Jingle Bells (Pierpont, 1857)
  jingle: {bpm: 144, pedal: 'C3', bells: true, notes: parse('E4:1 E4:1 E4:2 E4:1 E4:1 E4:2 E4:1 G4:1 C4:1.5 D4:.5 E4:4 F4:1 F4:1 F4:1.5 F4:.5 F4:1 E4:1 E4:1 E4:.5 E4:.5 E4:1 D4:1 D4:1 E4:1 D4:2 G4:2 E4:1 E4:1 E4:2 E4:1 E4:1 E4:2 E4:1 G4:1 C4:1.5 D4:.5 E4:4 F4:1 F4:1 F4:1.5 F4:.5 F4:1 E4:1 E4:1 E4:.5 E4:.5 G4:1 G4:1 F4:1 D4:1 C4:4 R:2')},
  // We Wish You a Merry Christmas (English, traditional)
  wish: {bpm: 120, meter: 3, pedal: 'C3', notes: parse('G4:1 C5:1 C5:.5 D5:.5 C5:.5 B4:.5 A4:1 A4:1 A4:1 D5:1 D5:.5 E5:.5 D5:.5 C5:.5 B4:1 G4:1 G4:1 E5:1 E5:.5 F5:.5 E5:.5 D5:.5 C5:1 A4:1 G4:.5 G4:.5 A4:1 D5:1 B4:1 C5:2 R:2')},
  // Carol of the Bells (Leontovych, 1914): the four-note figure, over and over
  bells: {bpm: 160, meter: 3, pedal: 'G2', notes: parse('Bb4:1 A4:.5 Bb4:.5 G4:1 Bb4:1 A4:.5 Bb4:.5 G4:1 Bb4:1 A4:.5 Bb4:.5 G4:1 Bb4:1 A4:.5 Bb4:.5 G4:1 D5:1 C5:.5 D5:.5 Bb4:1 D5:1 C5:.5 D5:.5 Bb4:1 G5:1 F5:.5 G5:.5 Eb5:1 D5:1 C5:.5 D5:.5 Bb4:1')},
};
const SCENES = {
  hearth: {tunes: ['silent'], gain: 0.3, stretch: 1.12},                  // the grown-ups' side: slow and far away
  anticipation: {tunes: ['bells'], gain: 0.42, stretch: 1},               // a box that has not been opened yet
  book: {tunes: ['deck', 'wish', 'jingle'], gain: 0.46, stretch: 1},      // turning pages
  dream: {tunes: ['silent', 'wish'], gain: 0.44, stretch: 1.05},          // wishes, the letter, the star
};

const m = {scene: null, bus: null, master: null, tune: 0, note: 0, next: 0, bar: 0, timer: 0, unlocked: false};

function chain(ac) {
  if (m.master) return;
  m.master = ac.createGain(); m.master.gain.value = 1;
  // A soft echo stands in for a room.
  const delay = ac.createDelay(0.6), feedback = ac.createGain(), wet = ac.createGain();
  delay.delayTime.value = 0.29; feedback.gain.value = 0.3; wet.gain.value = 0.24;
  m.master.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(wet); wet.connect(ac.destination);
  m.master.connect(ac.destination);
}
/** One note of a music box: a clear tone, its octave, and the bright ping of the comb. */
function pluck(ac, out, f, t, length, volume) {
  for (const [mult, level, decay, type] of [[1, 1, length, 'sine'], [2, 0.34, length * 0.7, 'triangle'], [4.2, 0.1, 0.22, 'sine']]) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f * mult;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(volume * level, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + decay + 0.05);
  }
}
function jingle(ac, out, t, volume) {
  for (const f of [5200, 6900, 8300]) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = f * (0.98 + Math.random() * 0.04);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(volume, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.14);
  }
}
function schedule() {
  if (!m.scene || !sound.on || !m.unlocked) return;
  let ac; try { ac = audio(); } catch { return; }
  chain(ac);
  if (!m.bus) { m.bus = ac.createGain(); m.bus.gain.setValueAtTime(0.0001, ac.currentTime); m.bus.gain.linearRampToValueAtTime(SCENES[m.scene].gain, ac.currentTime + 1.6); m.bus.connect(m.master); m.next = ac.currentTime + 0.25; }
  const scene = SCENES[m.scene];
  while (m.next < ac.currentTime + 0.5) {
    const tune = TUNES[scene.tunes[m.tune % scene.tunes.length]], beat = 60 / tune.bpm * scene.stretch, n = tune.notes[m.note];
    if (n.f) {
      pluck(ac, m.bus, n.f * 2, m.next, Math.max(0.9, n.d * beat * 1.5), 0.085);
      if (n.d >= 1) pluck(ac, m.bus, n.f, m.next, n.d * beat * 1.2, 0.03);
    }
    // A low note under each bar, and sleigh bells on the brighter tunes.
    if (Math.floor(m.bar) !== Math.floor(m.bar - 0.001) || m.bar === 0) pluck(ac, m.bus, freq(tune.pedal), m.next, beat * 3.2, 0.05);
    if (tune.bells && Math.abs(m.bar * 2 - Math.round(m.bar * 2)) < 0.01) jingle(ac, m.bus, m.next, 0.0035);
    m.next += n.d * beat; m.bar += n.d / (tune.meter || 4);
    if (++m.note >= tune.notes.length) { m.note = 0; m.bar = 0; m.tune++; m.next += beat * 2; }
  }
}
function fadeOut(time = 0.9) {
  const bus = m.bus; m.bus = null;
  if (!bus) return;
  try { const ac = audio(); bus.gain.cancelScheduledValues(ac.currentTime); bus.gain.setTargetAtTime(0.0001, ac.currentTime, time / 4); setTimeout(() => bus.disconnect(), time * 1000 + 600); } catch {}
}

export const music = {
  /** Change what is playing. Asking for the scene already playing does nothing. */
  scene(name) {
    if (name === m.scene) return;
    fadeOut(); m.scene = SCENES[name] ? name : null; m.tune = Math.floor(Math.random() * 3); m.note = 0; m.bar = 0;
    schedule();
  },
  /** Pull the music down (0) or bring it back (1), for moments that need the room. */
  duck(level, time = 0.4) { if (!m.master) return; try { const ac = audio(); m.master.gain.cancelScheduledValues(ac.currentTime); m.master.gain.setTargetAtTime(Math.max(0.0001, level), ac.currentTime, time / 3); } catch {} },
  /** Call after the sound switch changes. */
  refresh() { if (sound.on) schedule(); else fadeOut(0.3); },
};
// Browsers only allow sound after a touch or a key press.
for (const type of ['pointerdown', 'keydown']) addEventListener(type, () => { if (!m.unlocked) { m.unlocked = true; schedule(); } }, {capture: true, passive: true});
m.timer = setInterval(schedule, 140);
