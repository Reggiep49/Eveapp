// Weather for the whole app: snow that drifts in depth, and sparks for the big moments.

export function mountAtmosphere(canvas, {reduced = false} = {}) {
  const ctx = canvas.getContext('2d');
  const s = {w: 0, h: 0, density: 0, target: 0.4, gust: 0, pull: null, sparks: [], last: performance.now(), alive: true};
  if (!ctx) return {density() {}, gust() {}, pull() {}, burst() {}, destroy() {}};
  let flakes = [];
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2); s.w = innerWidth; s.h = innerHeight;
    canvas.width = s.w * d; canvas.height = s.h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.round(Math.min(170, 46 + s.w * s.h / 9000));
    // z is depth: near flakes are large, soft and quick; far ones are pinpricks.
    flakes = Array.from({length: n}, () => ({x: Math.random(), y: Math.random(), z: Math.pow(Math.random(), 2.2) * 1.5 + 0.25, p: Math.random() * 6.28, vx: 0, vy: 0}));
  };
  addEventListener('resize', size); size();

  function frame(now) {
    if (!s.alive) return;
    const dt = Math.min(0.05, (now - s.last) / 1000); s.last = now;
    if (!document.hidden) {
      s.density += (s.target - s.density) * (1 - Math.exp(-dt * 1.5));
      s.gust *= Math.exp(-dt * 1.3);
      ctx.clearRect(0, 0, s.w, s.h);
      const live = Math.round(flakes.length * Math.min(1, s.density)), t = now * 0.001;
      for (let i = 0; i < live; i++) {
        const f = flakes[i];
        if (!reduced) {
          let ax = 0, ay = 0;
          if (s.pull) {
            const dx = s.pull.x / s.w - f.x, dy = s.pull.y / s.h - f.y, dist = Math.hypot(dx, dy) + 0.05;
            // Drawn toward the star, and swept around it.
            ax = (dx / dist - dy / dist * 0.9) * s.pull.k * 0.5 / dist; ay = (dy / dist + dx / dist * 0.9) * s.pull.k * 0.5 / dist;
          }
          f.vx += (ax - f.vx * 2.2) * dt; f.vy += (ay - f.vy * 2.2) * dt;
          f.x += (Math.sin(t * 0.5 + f.p) * 0.012 + s.gust * f.z * 0.22 + f.vx) * dt;
          f.y += ((0.016 + 0.034 * f.z) + f.vy) * dt;
          if (f.y > 1.03) { f.y = -0.03; f.x = Math.random(); } if (f.y < -0.05) f.y = 1.02;
          f.x = (f.x + 1) % 1;
        }
        const r = 0.5 + f.z * f.z * 1.7, a = (f.z > 1.2 ? 0.16 : 0.26 + 0.3 * f.z) * (0.7 + 0.3 * Math.sin(t * 1.3 + f.p));
        ctx.globalAlpha = a * Math.min(1, s.density * 1.4);
        ctx.fillStyle = '#f6f9ff';
        ctx.beginPath(); ctx.arc(f.x * s.w, f.y * s.h, r, 0, 6.283); ctx.fill();
      }
      if (s.sparks.length) {
        ctx.globalCompositeOperation = 'lighter';
        s.sparks = s.sparks.filter(p => p.life > 0);
        for (const p of s.sparks) {
          p.life -= dt / p.span; p.vy += p.g * dt; p.vx *= 1 - dt * p.drag; p.vy *= 1 - dt * p.drag;
          p.x += p.vx * dt; p.y += p.vy * dt;
          const l = Math.max(0, p.life);
          ctx.globalAlpha = Math.min(1, l * 1.6);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + l * 0.8), 0, 6.283); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    /** How much snow: 0 none, 1 a steady fall. */
    density(v) { s.target = reduced ? Math.min(v, 0.3) : v; },
    /** A sideways push, as when a page sweeps past. */
    gust(v) { if (!reduced) s.gust += v; },
    /** Draw the snow toward a point (pass nothing to let go). */
    pull(x, y, k) { s.pull = k ? {x, y, k} : null; },
    /** Sparks from a point. `inward` gathers them from a ring instead of throwing them out. */
    burst(x, y, count, {speed = 260, up = 0, life = 1.1, size = 2.2, gravity = 120, drag = 0.9, inward = 0, colors = ['#ffe6a8', '#ffd58a', '#fff6dc', '#ffb86b']} = {}) {
      if (reduced) return;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * 6.283, v = speed * (0.25 + Math.random() * 0.9);
        const p = {x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * (0.4 + Math.random() * 0.8), life: 1, span: life * (0.5 + Math.random() * 0.8), size: size * (0.5 + Math.random()), g: gravity, drag, color: colors[i % colors.length]};
        if (inward) { p.x = x + Math.cos(a) * inward; p.y = y + Math.sin(a) * inward; p.vx = -Math.cos(a) * inward / (p.span * 0.9); p.vy = -Math.sin(a) * inward / (p.span * 0.9); p.g = 0; p.drag = 0; }
        s.sparks.push(p);
      }
      if (s.sparks.length > 900) s.sparks.splice(0, s.sparks.length - 900);
    },
    destroy() { s.alive = false; removeEventListener('resize', size); },
  };
}
