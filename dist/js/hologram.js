// A light-projected, spinnable toy. Geometry comes from engines/toy-engine.js (global `toyModels`).

const shade = (hex, amount) => {
  const target = amount > 0 ? 255 : 0, k = Math.abs(amount);
  return [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16); return Math.round(v + (target - v) * k); });
};

export function hasModel(id) { return typeof toyModels !== 'undefined' && !!toyModels[id]; }

export function mountHologram(canvas, id, {reduced = false} = {}) {
  const model = typeof toyModels !== 'undefined' ? toyModels[id] : null;
  const ctx = canvas.getContext('2d');
  if (!model || !ctx) return null;
  const home = {angle: model.view, pitch: model.pitch || 0.34};
  let angle = home.angle, pitch = home.pitch, zoom = 1, zoomTarget = 1, spin = reduced ? 0 : 0.35;
  let drag = null, velocity = 0, frame = 0, last = performance.now(), alive = true, idle = 0;

  function paint() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const density = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * density) || canvas.height !== Math.round(height * density)) {
      canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
    }
    ctx.setTransform(density, 0, 0, density, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width * 0.74, height * 0.8) / model.size * zoom;
    const cy = height * 0.5, ca = Math.cos(angle), sa = Math.sin(angle), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const project = ([x, y, z]) => {
      const nx = x * ca - z * sa, nz = x * sa + z * ca;
      const v = (y - model.aim) * cp - nz * sp, depth = nz * cp + (y - model.aim) * sp, k = 8 / (8 - depth);
      return [width / 2 + nx * scale * k, cy - v * scale * k, depth];
    };
    const faces = model.faces.map(face => {
      const pts = face.points.map(project);
      return {face, pts, depth: pts.reduce((s, p) => s + p[2], 0) / pts.length};
    }).sort((a, b) => a.depth - b.depth);
    for (const {face, pts} of faces) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      const [r, g, b] = shade(face.color, face.light * 0.3 - 0.12);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
      ctx.fillStyle = `rgba(4,16,30,${(1 - face.light) * 0.5})`;
      ctx.fill();
      ctx.strokeStyle = face.curved ? `rgba(${r},${g},${b},.9)` : 'rgba(190,255,240,.42)';
      ctx.lineWidth = face.curved ? 0.4 : 0.8;
      ctx.stroke();
    }
  }
  function loop(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag) {
      idle += dt;
      angle += velocity * dt + (idle > 1.2 ? spin * dt : 0);
      velocity *= Math.pow(0.04, dt);
    }
    zoom += (zoomTarget - zoom) * Math.min(1, dt * 8);
    paint();
    frame = requestAnimationFrame(loop);
  }
  const down = event => { drag = {x: event.clientX, y: event.clientY, t: performance.now()}; idle = 0; velocity = 0; canvas.setPointerCapture(event.pointerId); };
  const move = event => {
    if (!drag) return;
    const now = performance.now(), dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    angle += dx * 0.014;
    pitch = Math.max(-0.17, Math.min(0.91, pitch + dy * 0.008));
    velocity = dx * 0.014 / Math.max(0.008, (now - drag.t) / 1000);
    drag = {x: event.clientX, y: event.clientY, t: now};
  };
  const up = () => { drag = null; velocity = Math.max(-6, Math.min(6, velocity)); };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  frame = requestAnimationFrame(loop);
  return {
    turn(direction) { velocity = direction * 2.4; idle = 0; },
    zoom(on) { zoomTarget = on ? 1.3 : 1; },
    reset() { angle = home.angle; pitch = home.pitch; zoomTarget = 1; velocity = 0; idle = 0; },
    destroy() { alive = false; cancelAnimationFrame(frame); },
  };
}
