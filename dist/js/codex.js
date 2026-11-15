// The book itself: a small WebGL scene with a leather cover, a paper block, and sheets that
// curl around a cylinder under the reader's finger. No libraries.

const H = 941 / 836;            // page height when page width is 1
const PI = Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

/* ---------- Tiny matrix kit (column-major 4x4) ---------- */
const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
const ident = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const translate = (x, y, z) => { const m = ident(); m[12] = x; m[13] = y; m[14] = z; return m; };
const rotX = a => { const m = ident(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; };
const rotZ = a => { const m = ident(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; };
const perspective = (fov, aspect, near, far) => { const f = 1 / Math.tan(fov / 2), m = new Float32Array(16); m[0] = f / aspect; m[5] = f; m[10] = (far + near) / (near - far); m[11] = -1; m[14] = 2 * far * near / (near - far); return m; };
function lookAt(eye, at) {
  const z = norm([eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]]), x = norm(cross([0, 1, 0], z)), y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const apply = (m, p) => { const [x, y, z] = p, w = m[3] * x + m[7] * y + m[11] * z + m[15]; return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w]; };
function invert(m) {
  const a = Array.from(m), inv = new Float32Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  inv[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; inv[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det; inv[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; inv[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  inv[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; inv[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det; inv[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; inv[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  inv[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; inv[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det; inv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; inv[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  inv[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; inv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det; inv[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; inv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return inv;
}

/* ---------- Shaders ---------- */
const VERT = `
attribute vec2 aPos;
uniform mat4 uMVP; uniform vec4 uRect; uniform float uZ;
uniform vec3 uFold; uniform float uFoldY; uniform float uHinge;
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main(){
  vec2 p = vec2(mix(uRect.x, uRect.z, aPos.x), mix(uRect.y, uRect.w, aPos.y));
  vec3 pos = vec3(p, uZ); vec3 n = vec3(0., 0., 1.);
  if (uFold.z > 0.) {
    vec2 ln = vec2(cos(uFold.y), sin(uFold.y));
    float d = dot(p - vec2(uFold.x, uFoldY), ln);
    if (d > 0.) {
      float r = uFold.z, th = d / r; vec2 foot = p - ln * d;
      if (th < 3.14159265) { pos.xy = foot + ln * (r * sin(th)); pos.z = uZ + r * (1. - cos(th)); n = vec3(ln * sin(th), cos(th)); }
      else { pos.xy = foot - ln * (d - 3.14159265 * r); pos.z = uZ + 2. * r; n = vec3(0., 0., -1.); }
    }
  }
  if (uHinge > 0.) { float c = cos(uHinge), s = sin(uHinge); pos = vec3(p.x * c, p.y, uZ + p.x * s); n = vec3(-s, 0., c); }
  vUv = aPos; vN = n; vP = pos;
  gl_Position = uMVP * vec4(pos, 1.);
}`;
const FRAG = `
precision mediump float;
uniform sampler2D uFront; uniform sampler2D uBack;
uniform vec3 uLight; uniform vec3 uTint; uniform float uGutter; uniform float uFoil; uniform float uSheen; uniform float uAlpha;
uniform vec4 uShadow; uniform float uShadowY; uniform float uShadowK;
uniform vec3 uHot[6]; uniform float uHotK; uniform float uTime; uniform float uFlat; uniform float uLife;
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main(){
  bool front = gl_FrontFacing;
  vec4 base = front ? texture2D(uFront, vUv) : texture2D(uBack, vec2(1. - vUv.x, vUv.y));
  vec3 n = normalize(vN); if (!front) n = -n;
  vec3 L = normalize(uLight);
  float diff = max(dot(n, L), 0.);
  vec3 col = base.rgb * mix(0.46 + 0.66 * diff, 1.0, uFlat);
  float bend = 1. - abs(normalize(vN).z);
  col += vec3(1., .96, .86) * pow(max(reflect(-L, n).z, 0.), 14.) * (0.05 + 0.22 * bend) * (1. - uFlat);
  if (uGutter != 0.) {
    float gu = uGutter > 0. ? vUv.x : 1. - vUv.x;
    col *= 1. - 0.46 * exp(-gu * 24.);
    col *= 1. + 0.06 * exp(-pow((gu - 0.11) * 13., 2.));
    col *= 1. - 0.12 * smoothstep(.94, 1., gu);
  }
  if (uShadowK > 0.) {
    vec2 ln = vec2(cos(uShadow.y), sin(uShadow.y));
    float d = dot(vP.xy - vec2(uShadow.x, uShadowY), ln);
    float a = d > 0. ? exp(-d / (uShadow.z * 2.4 + .035)) * .55 : exp(-max(-d - uShadow.w, 0.) / .08) * .42 * step(.002, uShadow.w);
    col *= 1. - a * uShadowK;
  }
  if (uHotK > 0.) {
    for (int i = 0; i < 6; i++) {
      vec3 h = uHot[i];
      if (h.z > 0.) { vec2 dv = (vUv - h.xy) * vec2(1., 1.1256); float dd = dot(dv, dv);
        col += base.rgb * uHotK * h.z * exp(-dd * 46.) * (0.30 + 0.22 * sin(uTime * 2.1 + float(i) * 1.7)); }
    }
  }
  if (uLife > 0.) {
    // Lanterns, fairy lights and firelight: the bright warm parts of the painting breathe and flicker.
    float lum = max(base.r, max(base.g, base.b)), warm = smoothstep(.02, .28, base.r - base.b);
    float m = smoothstep(.66, .97, lum) * warm;
    vec2 q = front ? vUv : vec2(1. - vUv.x, vUv.y);
    float n = sin(uTime * 2.7 + q.x * 61. + q.y * 47.) * sin(uTime * 1.9 + q.x * 23. - q.y * 71.);
    col += base.rgb * m * (.24 * n + .09 * sin(uTime * 8.3 + q.y * 130. + q.x * 40.)) * uLife;
    col += base.rgb * .035 * sin(uTime * .8 + q.x * 3. + q.y * 2.) * uLife;
  }
  if (uFoil > 0.) {
    float foil = smoothstep(.10, .34, base.r - base.b);
    float s = pow(1. - abs(sin((vUv.x + vUv.y) * 2.2 + uSheen)), 9.);
    col += foil * (s * 1.1 + pow(diff, 5.) * .3) * vec3(1., .86, .5) * uFoil;
  }
  gl_FragColor = vec4(col * uTint, base.a * uAlpha);
}`;

/* ---------- Textures drawn on 2D canvases ---------- */
const PW = 1024, PH = 1152;
const sheetCanvas = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
function grain(c, amount, tone = 0) {
  const ctx = c.getContext('2d'), img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * amount + tone; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
}
function paperCanvas() {
  const c = sheetCanvas(), x = c.getContext('2d');
  const g = x.createRadialGradient(PW / 2, PH / 2, 100, PW / 2, PH / 2, 900); g.addColorStop(0, '#f7eeda'); g.addColorStop(1, '#e6d6b4');
  x.fillStyle = g; x.fillRect(0, 0, PW, PH); grain(c, 14);
  return c;
}
const gold = (x, y0, y1) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#ffe6a3'); g.addColorStop(.5, '#e9c067'); g.addColorStop(1, '#c8963a'); return g; };
function star(x, cx, cy, R, r, points = 8) {
  x.beginPath();
  for (let i = 0; i < points * 2; i++) { const a = i * PI / points - PI / 2, k = i % 2 ? r : R; x.lineTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k); }
  x.closePath();
}
function coverCanvas(name, year) {
  const c = sheetCanvas(), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, PW, PH); g.addColorStop(0, '#12303a'); g.addColorStop(.5, '#0b1f2b'); g.addColorStop(1, '#081620');
  x.fillStyle = g; x.fillRect(0, 0, PW, PH);
  // Leather: soft mottling under fine grain.
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '40,90,100'},${Math.random() * .05})`; x.beginPath(); x.arc(Math.random() * PW, Math.random() * PH, 2 + Math.random() * 9, 0, 7); x.fill(); }
  grain(c, 10);
  x.strokeStyle = gold(x, 0, PH); x.fillStyle = gold(x, 0, PH); x.textAlign = 'center';
  x.lineWidth = 5; x.strokeRect(58, 58, PW - 116, PH - 116);
  x.lineWidth = 1.6; x.strokeRect(76, 76, PW - 152, PH - 152);
  for (const [cx, cy] of [[58, 58], [PW - 58, 58], [58, PH - 58], [PW - 58, PH - 58]]) { star(x, cx, cy, 20, 7, 4); x.fill(); }
  x.font = '500 25px "Geist Mono", ui-monospace, monospace'; spaced(x, 'A NORTH POLE LOOKBOOK', PW / 2, 190, 9);
  // The emblem: the reader presses here to open the book.
  x.lineWidth = 2.5; x.beginPath(); x.arc(PW / 2, 420, 128, 0, 7); x.stroke();
  x.lineWidth = 1.2; x.setLineDash([3, 9]); x.beginPath(); x.arc(PW / 2, 420, 146, 0, 7); x.stroke(); x.setLineDash([]);
  star(x, PW / 2, 420, 96, 24, 4); x.fill(); star(x, PW / 2, 420, 54, 16, 8); x.fillStyle = '#fff3cf'; x.fill();
  x.fillStyle = gold(x, 640, 900);
  x.font = '400 104px "Instrument Serif", Georgia, serif'; x.fillText('The Book of', PW / 2, 700);
  x.font = 'italic 400 116px "Instrument Serif", Georgia, serif'; x.fillText('Christmas Wishes', PW / 2, 812, PW - 190);
  x.lineWidth = 1.6; x.beginPath(); x.moveTo(PW / 2 - 150, 868); x.lineTo(PW / 2 - 26, 868); x.moveTo(PW / 2 + 26, 868); x.lineTo(PW / 2 + 150, 868); x.stroke();
  star(x, PW / 2, 868, 12, 4, 4); x.fill();
  x.font = 'italic 400 70px "Instrument Serif", Georgia, serif'; x.fillText(`for ${name}`, PW / 2, 962, PW - 220);
  x.font = '500 22px "Geist Mono", ui-monospace, monospace'; spaced(x, `CHRISTMAS ${year}`, PW / 2, 1052, 8);
  return c;
}
function spaced(x, text, cx, y, gap) {
  const widths = [...text].map(ch => x.measureText(ch).width + gap), total = widths.reduce((a, b) => a + b, 0) - gap;
  let at = cx - total / 2; x.textAlign = 'left';
  [...text].forEach((ch, i) => { x.fillText(ch, at, y); at += widths[i]; });
  x.textAlign = 'center';
}
function endpaperCanvas() {
  const c = sheetCanvas(), x = c.getContext('2d');
  x.fillStyle = '#0c2330'; x.fillRect(0, 0, PW, PH);
  x.fillStyle = '#d9b662';
  for (let row = 0; row < 15; row++) for (let col = 0; col < 12; col++) {
    const cx = col * 92 + (row % 2 ? 46 : 0) + 8, cy = row * 82 + 20, big = (row * 7 + col * 3) % 5 === 0;
    x.globalAlpha = big ? .75 : .38; star(x, cx, cy, big ? 11 : 5, big ? 3.5 : 2, 4); x.fill();
  }
  x.globalAlpha = 1; grain(c, 8);
  return c;
}
function titleCanvas(name, line) {
  const c = paperCanvas(), x = c.getContext('2d');
  x.strokeStyle = '#b89a5a'; x.lineWidth = 2; x.strokeRect(70, 70, PW - 140, PH - 140);
  x.lineWidth = 1; x.strokeRect(84, 84, PW - 168, PH - 168);
  x.textAlign = 'center'; x.fillStyle = '#8a744a';
  x.font = '500 24px "Geist Mono", ui-monospace, monospace'; spaced(x, 'THIS BOOK BELONGS TO', PW / 2, 400, 8);
  x.fillStyle = '#2f2616'; x.font = 'italic 400 168px "Instrument Serif", Georgia, serif'; x.fillText(name, PW / 2, 580, PW - 220);
  x.fillStyle = '#c29a44'; star(x, PW / 2, 680, 26, 8, 4); x.fill();
  x.fillStyle = '#6b5a3a'; x.font = 'italic 400 46px "Instrument Serif", Georgia, serif'; x.fillText(line, PW / 2, 790, PW - 240);
  x.fillStyle = '#8a744a'; x.font = '500 20px "Geist Mono", ui-monospace, monospace'; spaced(x, 'TURN THE PAGE', PW / 2, 990, 8);
  return c;
}
function pageCanvas(img, half, hidden) {
  const c = sheetCanvas(), x = c.getContext('2d');
  x.drawImage(img, half === 'right' ? img.width / 2 : 0, 0, img.width / 2, img.height, 0, 0, PW, PH);
  // A toy a parent has left out becomes a wrapped present sitting in the scene.
  for (const t of hidden || []) {
    const cx = (t.x % 50) / 50 * PW, cy = t.y / 100 * PH, w = t.w / 50 * PW, h = t.h / 100 * PH;
    x.save(); x.translate(cx, cy); x.scale(w / 2, h / 2);
    const mist = x.createRadialGradient(0, 0, .25, 0, 0, 1.3); mist.addColorStop(0, '#2a2118'); mist.addColorStop(.68, '#2a2118'); mist.addColorStop(.86, '#2a2118f0'); mist.addColorStop(1, '#2a211800');
    x.fillStyle = mist; x.fillRect(-1.3, -1.3, 2.6, 2.6); x.restore();
    const bw = w * .64, bh = h * .72, left = cx - bw * .5, top = cy - bh * .42;
    x.save(); x.shadowColor = '#0009'; x.shadowBlur = 25; x.shadowOffsetY = 15;
    const wrap = x.createLinearGradient(left, top, left + bw, top + bh); wrap.addColorStop(0, '#963c30'); wrap.addColorStop(.45, '#6c241d'); wrap.addColorStop(1, '#3e1915');
    x.fillStyle = wrap; x.fillRect(left, top, bw, bh); x.shadowColor = 'transparent';
    x.fillStyle = '#d1a451'; x.fillRect(cx - bw * .06, top, bw * .12, bh); x.fillRect(left, top + bh * .36, bw, bh * .11);
    x.strokeStyle = '#e8bf6f'; x.lineWidth = 6; x.beginPath(); x.ellipse(cx - bw * .12, top - 18, bw * .15, 18, .4, 0, 7); x.ellipse(cx + bw * .12, top - 18, bw * .15, 18, -.4, 0, 7); x.stroke();
    x.restore();
  }
  // Paper, not a screen: a faint warm wash and darker deckle edges.
  x.fillStyle = 'rgba(255,236,200,.05)'; x.fillRect(0, 0, PW, PH);
  const v = x.createRadialGradient(PW / 2, PH / 2, PH * .42, PW / 2, PH / 2, PH * .78); v.addColorStop(0, 'rgba(30,18,6,0)'); v.addColorStop(1, 'rgba(30,18,6,.34)');
  x.fillStyle = v; x.fillRect(0, 0, PW, PH);
  return c;
}
function smallCanvas(draw, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), c); return c; }
const loadImage = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });

/**
 * @param canvas  full-bleed canvas
 * @param stage   element whose box the book should fit inside
 * @param options {spread, openings:[{src, leftHidden, rightHidden, half, hidden}], name, line, year, reduced, start, opened, hot(index, side), on:{...}}
 */
export async function createCodex(canvas, stage, options) {
  const gl = canvas.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: false});
  if (!gl) return null;
  const {spread, reduced} = options, on = options.on || {};
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s)); return s; };
  const program = gl.createProgram();
  try { gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(program); } catch { return null; }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const U = {}; for (const n of ['uMVP', 'uRect', 'uZ', 'uFold', 'uFoldY', 'uHinge', 'uFront', 'uBack', 'uLight', 'uTint', 'uGutter', 'uFoil', 'uSheen', 'uAlpha', 'uShadow', 'uShadowY', 'uShadowK', 'uHot', 'uHotK', 'uTime', 'uFlat', 'uLife']) U[n] = gl.getUniformLocation(program, n);

  // One grid, reused for every sheet. Counter-clockwise from above, so gl_FrontFacing means "printed side".
  const NX = 72, NY = 40, verts = [], idx = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) verts.push(i / NX, j / NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  // Flat things only need their four corners; the full grid is kept for paper that bends.
  const c0 = 0, c1 = NX, c2 = (NX + 1) * NY, c3 = c2 + NX, full = idx.length;
  idx.push(c0, c1, c2, c1, c3, c2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);

  const tex = source => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  try { await Promise.all([document.fonts.load('400 100px "Instrument Serif"'), document.fonts.load('italic 400 100px "Instrument Serif"'), document.fonts.load('500 24px "Geist Mono"')]); } catch {}
  const images = {};
  await Promise.all([...new Set(options.openings.map(o => o.src))].map(async src => { images[src] = await loadImage(src); }));
  const T = {
    paper: tex(paperCanvas()), cover: tex(coverCanvas(options.name, options.year)), endpaper: tex(endpaperCanvas()), title: tex(titleCanvas(options.name, options.line)),
    leather: tex(smallCanvas((x, c) => { x.fillStyle = '#0a1c26'; x.fillRect(0, 0, 256, 256); grain(c, 12); })),
    edge: tex(smallCanvas((x, c) => { x.fillStyle = '#e4d3ac'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 256; i += 3) { x.fillStyle = i % 2 ? '#cdb98c' : '#f1e3c2'; x.fillRect(0, i, 256, 1.5); x.fillRect(i, 0, 1.5, 256); } grain(c, 10); })),
    shadow: tex(smallCanvas(x => { const g = x.createRadialGradient(128, 128, 30, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(.55, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); })),
  };
  const right = [], left = [];
  options.openings.forEach((o, i) => {
    const img = images[o.src];
    left[i] = tex(pageCanvas(img, 'left', o.leftHidden)); right[i] = tex(pageCanvas(img, 'right', o.rightHidden));
  });
  const count = right.length;

  /* ----- State ----- */
  // A narrow screen looks at one page of the spread at a time; the camera crosses the gutter and follows turning sheets.
  const start = clamp(options.start || 0, 0, (spread ? count : count * 2) - 1);
  const s = {
    cur: spread ? start : Math.floor(start / 2), side: spread || start % 2 ? 'right' : 'left', panning: false, goalPage: null, mode: options.opened ? 'open' : 'closed', alive: true, time: 0, last: performance.now(),
    w: 0, h: 0, mvp: ident(), inv: ident(), baseVP: ident(), camX: 0.5,
    arrive: options.opened || reduced ? 1 : 0, hinge: 0, held: 0, sheen: 0, hotK: options.opened ? 1 : 0, tilt: [0, 0], tiltTarget: [0, 0],
    waiting: !!options.wait, hingeTarget: null, turn: null, riffle: null, leftTex: null, rightTex: null, glow: 0,
  };
  const follow = u => { const t = clamp((u - 0.18) / 0.7, 0, 1); return t * t * (3 - 2 * t); };
  function camTarget() {
    if (spread) return s.mode === 'closed' ? 0.5 : 0;
    if (s.mode === 'closed') return 0.5;
    if (s.riffle) return s.riffle.last && s.side === 'left' ? 0.5 - follow((1 - s.riffle.x) / 2) : 0.5;
    if (s.mode === 'opening') return 0.5;
    if (s.turn) return 0.5 - follow((1 - s.turn.x) / 2);
    return s.side === 'left' ? -0.5 : 0.5;
  }
  const pageIndex = () => (spread ? s.cur : s.cur * 2 + (s.side === 'right' ? 1 : 0));
  const pageCount = spread ? count : count * 2;
  if (options.opened) s.camX = camTarget();

  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    s.w = canvas.clientWidth; s.h = canvas.clientHeight;
    if (canvas.width !== Math.round(s.w * d)) canvas.width = Math.round(s.w * d);
    if (canvas.height !== Math.round(s.h * d)) canvas.height = Math.round(s.h * d);
    gl.viewport(0, 0, canvas.width, canvas.height);
    on.layout?.();
  }
  function camera() {
    const cr = canvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const sw = Math.max(40, sr.width), sh = Math.max(40, sr.height), fov = 21 * PI / 180, t = Math.tan(fov / 2);
    const needW = spread ? 2.2 : 1.16, needH = H * 1.12;
    const D = Math.max(needH / 2 / t, needW / 2 / (t * sw / sh));
    const tilt = 0.14 + (s.mode === 'closed' ? s.tilt[1] * 0.05 : 0);
    const eye = [s.camX + (s.mode === 'closed' ? s.tilt[0] * 0.10 : 0), -Math.sin(tilt) * D, Math.cos(tilt) * D];
    const view = lookAt(eye, [s.camX, 0, 0]), proj = perspective(fov, sw / sh, 0.1, 50);
    // Fit the picture to the stage box inside the full-bleed canvas.
    const post = ident(); post[0] = sw / cr.width; post[5] = sh / cr.height;
    post[12] = ((sr.left + sw / 2) - (cr.left + cr.width / 2)) / (cr.width / 2); post[13] = -((sr.top + sh / 2) - (cr.top + cr.height / 2)) / (cr.height / 2);
    s.baseVP = mul(post, mul(proj, view));
    // The closed book drifts in and settles; once open it sits still so fingers land where they aim.
    const a = easeInOut(s.arrive), closed = s.mode === 'closed', bob = closed && !reduced ? Math.sin(s.time * 0.9) * 0.012 : 0;
    const pivot = [0.5, 0, 0], k = 1 - a, shake = reduced ? 0 : s.held * s.held * 0.007;
    let model = ident();
    if (k > 0.001 || s.mode !== 'open') {
      // It comes in from far off, turning as it falls, and trembles while the star is held.
      model = mul(translate(pivot[0] + Math.sin(s.time * 71) * shake, 0.75 * k + bob + Math.cos(s.time * 83) * shake, -16 * k * k),
        mul(rotX(-0.75 * k + (closed ? s.tilt[1] * 0.04 : 0)), mul(rotZ(1.5 * k + (closed ? -0.035 + s.tilt[0] * 0.03 + Math.sin(s.time * 97) * shake * 2 : 0) * (1 - ease(s.hinge / PI))), translate(-pivot[0], 0, 0))));
    }
    s.mvp = mul(s.baseVP, model);
    s.inv = invert(s.baseVP);
  }
  /** Screen point (CSS px, canvas-relative) to the page plane z = 0. */
  function toPage(px, py) {
    const nx = px / s.w * 2 - 1, ny = 1 - py / s.h * 2;
    const a = apply(s.inv, [nx, ny, -1]), b = apply(s.inv, [nx, ny, 1]), t = a[2] / (a[2] - b[2]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  /** A point on a page (u, v from the top-left of that page) to canvas-relative CSS px. */
  function project(side, u, v) {
    const p = apply(s.mode === 'closed' ? s.mvp : s.baseVP, [side === 'left' ? -1 + u : u, H / 2 - v * H, s.mode === 'closed' ? 0.014 : 0]);
    return [(p[0] + 1) / 2 * s.w, (1 - p[1]) / 2 * s.h];
  }

  /* ----- Drawing ----- */
  const light = () => [-0.32 + s.tilt[0] * 0.25, 0.42 + s.tilt[1] * 0.2, 0.86];
  function draw(o) {
    gl.uniform4f(U.uRect, ...o.rect); gl.uniform1f(U.uZ, o.z || 0);
    gl.uniform3f(U.uFold, ...(o.fold || [0, 0, 0])); gl.uniform1f(U.uFoldY, o.foldY || 0); gl.uniform1f(U.uHinge, o.hinge || 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, o.front); gl.uniform1i(U.uFront, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, o.back || o.front); gl.uniform1i(U.uBack, 1);
    const tint = o.tint || [1, 1, 1]; gl.uniform3f(U.uTint, tint[0], tint[1], tint[2]);
    gl.uniform1f(U.uGutter, o.gutter || 0); gl.uniform1f(U.uFoil, o.foil || 0); gl.uniform1f(U.uAlpha, o.alpha ?? 1); gl.uniform1f(U.uFlat, o.flat || 0); gl.uniform1f(U.uLife, o.life || 0);
    gl.uniform1f(U.uShadowK, o.shadow ? 1 : 0);
    if (o.shadow) { gl.uniform4f(U.uShadow, ...o.shadow.slice(0, 4)); gl.uniform1f(U.uShadowY, o.shadow[4]); }
    const hot = new Float32Array(18); (o.hot || []).slice(0, 6).forEach((h, i) => hot.set(h, i * 3));
    gl.uniform3fv(U.uHot, hot); gl.uniform1f(U.uHotK, o.hot?.length ? s.hotK : 0);
    if (o.fold) gl.drawElements(gl.TRIANGLES, full, gl.UNSIGNED_SHORT, 0); else gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, full * 2);
  }
  const PAGE_R = [0, -H / 2, 1, H / 2], PAGE_L = [-1, -H / 2, 0, H / 2];

  /** Where the fold sits so that the sheet's outer edge lands at xF. */
  function solveFold(xF, phi, r) {
    const c = Math.cos(phi); let lo = -0.3, hi = 1.0001;
    const landed = lx => { const d = (1 - lx) * c; if (d <= 0) return 1; const th = d / r, foot = 1 - c * d; return th < PI ? foot + c * r * Math.sin(th) : foot - c * (d - PI * r); };
    for (let i = 0; i < 26; i++) { const mid = (lo + hi) / 2; landed(mid) < xF ? lo = mid : hi = mid; }
    return (lo + hi) / 2;
  }
  function foldOf(turn) {
    const u = clamp((1 - turn.x) / 2, 0, 1), r = 0.004 + 0.105 * Math.pow(Math.sin(PI * u), 0.8);
    let lx = solveFold(turn.x, turn.phi, r);
    const maxPhi = Math.min(0.5, Math.atan2(Math.max(lx, 0), H / 2 + Math.abs(turn.gy)) * 0.92);
    const phi = clamp(turn.phi, -maxPhi, maxPhi);
    if (phi !== turn.phi) lx = solveFold(turn.x, phi, r);
    const flap = Math.max(0, (1 - lx) * Math.cos(phi) - PI * r);
    return {fold: [lx, phi, r], foldY: turn.gy, shadow: [lx, phi, r, flap, turn.gy], u};
  }

  function render() {
    camera();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (s.waiting) return;   // still inside its box
    gl.uniformMatrix4fv(U.uMVP, false, s.mvp); gl.uniform3f(U.uLight, ...light()); gl.uniform1f(U.uTime, s.time); gl.uniform1f(U.uSheen, s.sheen);
    const opening = s.mode !== 'closed' || s.hinge > 0, opened = ease(s.hinge / PI), isOpen = s.mode === 'open';
    const progress = count > 1 ? s.cur / (count - 1) : 0;
    const glow = 1 + s.glow * 0.5;

    // Shadow on the desk.
    gl.depthMask(false);
    const sx0 = isOpen || opened > 0.5 ? -1.45 : -0.42;
    draw({rect: [sx0, -H / 2 - 0.42, 1.45, H / 2 + 0.3], z: -0.07, front: T.shadow, flat: 1, alpha: 0.9 * ease(s.arrive)});
    gl.depthMask(true);
    // Boards.
    draw({rect: [0, -H / 2 - 0.035, 1.04, H / 2 + 0.035], z: -0.05, front: T.leather, tint: [1.5, 1.5, 1.5]});
    if (isOpen || s.riffle) draw({rect: [-1.04, -H / 2 - 0.035, 0, H / 2 + 0.035], z: -0.05, front: T.leather, tint: [1.5, 1.5, 1.5]});
    // The paper block, thicker on whichever side holds more pages.
    const nR = isOpen ? 1 + Math.round(3 * (1 - progress)) : 4, nL = isOpen ? 1 + Math.round(3 * progress) : 0;
    for (let i = nR; i >= 1; i--) draw({rect: [0, -H / 2 - i * 0.007, 1 + i * 0.006, H / 2 + i * 0.0026], z: -i * 0.01, front: T.edge, tint: i % 2 ? [.86, .84, .8] : [1, .98, .94]});
    for (let i = nL; i >= 1; i--) draw({rect: [-1 - i * 0.006, -H / 2 - i * 0.007, 0, H / 2 + i * 0.0026], z: -i * 0.01, front: T.edge, tint: i % 2 ? [.86, .84, .8] : [1, .98, .94]});

    // What lies flat.
    const active = s.turn || s.riffle;
    let leftTex = s.leftTex || left[s.cur], rightTex = s.rightTex || right[s.cur], sheet = null;
    if (s.turn) {
      const lower = Math.min(s.turn.from, s.turn.to), upper = lower + 1;
      leftTex = left[lower]; rightTex = right[upper]; sheet = {front: right[lower], back: left[upper], ...foldOf(s.turn)};
    } else if (s.riffle) {
      leftTex = s.riffle.left; rightTex = s.riffle.under; sheet = {front: s.riffle.front, back: s.riffle.back, ...foldOf(s.riffle)};
    }
    const hotOn = isOpen && !active;
    if ((opening && s.mode !== 'closed') || isOpen) {
      if (isOpen || s.riffle) draw({rect: PAGE_L, front: leftTex, gutter: -1, shadow: sheet?.shadow, tint: [glow, glow, glow], life: isOpen ? 1 : 0, hot: hotOn ? options.hot?.(s.cur, 'left') : null});
      draw({rect: PAGE_R, front: rightTex, gutter: 1, shadow: sheet?.shadow, tint: [glow, glow, glow], life: isOpen ? 1 : 0, hot: hotOn ? options.hot?.(s.cur, 'right') : null});
    } else { const lit = 1 + s.held * 2.2; draw({rect: PAGE_R, front: T.title, gutter: 1, tint: [lit, lit * 0.96, lit * 0.82]}); }
    if (sheet) draw({rect: PAGE_R, z: 0.0015, front: sheet.front, back: sheet.back, fold: sheet.fold, foldY: sheet.foldY, life: isOpen ? 1 : 0});
    // The cover, hinged at the spine.
    if (!isOpen && !s.riffle) draw({rect: [0, -H / 2 - 0.035, 1.04, H / 2 + 0.035], z: 0.014, hinge: Math.max(s.hinge, 0.0001 + s.held * s.held * 0.11), front: T.cover, back: T.endpaper, foil: 0.55 + s.held * 2.4});
  }

  /* ----- Motion ----- */
  function step(turn, dt) {
    // A damped spring keeps the paper a breath behind the finger, which is what gives it weight.
    const k = turn.dragging ? 520 : turn.auto ? 60 : 130, c = turn.dragging ? 44 : turn.auto ? 13.5 : 20;
    // Small fixed steps keep the spring steady even when a frame runs long.
    const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
    for (let i = 0; i < n; i++) { turn.v += (k * (turn.target - turn.x) - c * turn.v) * h; turn.x += turn.v * h; }
    turn.phi += (turn.phiTarget - turn.phi) * (1 - Math.exp(-dt * (turn.dragging ? 16 : 7)));
    turn.x = clamp(turn.x, -1.02, 1.05);
  }
  function tick(now) {
    if (!s.alive) return;
    const dt = Math.min(0.05, (now - s.last) / 1000); s.last = now; s.time += dt;
    if (!document.hidden) {
      for (const i of [0, 1]) s.tilt[i] += (s.tiltTarget[i] - s.tilt[i]) * (1 - Math.exp(-dt * 5));
      const goal = camTarget();
      s.camX += (goal - s.camX) * (1 - Math.exp(-dt * (s.turn || s.riffle ? 16 : s.panning ? 7 : 3.2)));
      if (s.panning && Math.abs(goal - s.camX) < 0.006) { s.camX = goal; s.panning = false; camera(); arrived(); }
      if (s.mode === 'closed' && s.hingeTarget !== null) {
        // The cover follows the finger, and settles back if it is let go too soon.
        s.hinge += (s.hingeTarget - s.hinge) * (1 - Math.exp(-dt * 14));
        if (s.hingeTarget === 0 && s.hinge < 0.012) { s.hinge = 0; s.hingeTarget = null; }
      }
      if (s.arrive < 1 && !s.waiting) { s.arrive = Math.min(1, s.arrive + dt / (options.wait ? 1.9 : 2.6)); if (s.arrive >= 1) on.settle?.(); }
      if (s.mode === 'closed' && (s.frame = (s.frame || 0) + 1) % 6 === 0) on.track?.();
      s.sheen += dt * (0.5 + s.held * 3);
      s.glow = Math.max(0, s.glow - dt * 1.4);
      s.hotK += ((s.mode === 'open' && !s.turn && !s.riffle ? 1 : 0) - s.hotK) * (1 - Math.exp(-dt * 4));
      if (s.mode === 'opening' && !s.riffle) {
        s.hinge = Math.min(PI, s.hinge + dt * PI / (reduced ? 0.01 : 0.95) * (0.35 + 1.3 * Math.sin(Math.min(1, s.hinge / PI + 0.06) * PI)));
        if (s.hinge >= PI) startRiffle();
      }
      const t = s.turn;
      if (t) {
        step(t, dt);
        const notch = Math.floor((1 - t.x) / 0.16);
        if (t.dragging && notch !== t.notch) { t.notch = notch; on.grain?.(); }
        on.drag?.(t.dragging ? Math.min(1, Math.abs(t.v) / 3) : 0);
        if (!t.dragging) {
          const done = Math.abs(t.x - t.target) < 0.012 && Math.abs(t.v) < 0.25;
          if (!t.landed && Math.abs(t.x - t.target) < 0.09 && t.completes) { t.landed = true; on.land?.(); s.glow = 1; }
          if (done) finishTurn(t);
        }
      }
      const r = s.riffle;
      if (r) { r.t += dt / r.dur; r.x = 1 - 2 * easeInOut(r.t); r.phi = -0.3 * Math.sin(PI * clamp(r.t, 0, 1)); if (r.t >= 1) r.done(); }
      render();
    }
    requestAnimationFrame(tick);
  }
  function finishTurn(t) {
    s.turn = null; on.drag?.(0);
    if (t.completes) { s.cur = t.to; if (!spread) { s.side = t.dir > 0 ? 'left' : 'right'; s.camX = camTarget(); camera(); } arrived(); }
    else { s.goalPage = null; on.rest?.(); }
  }
  /** A new page is in front of the reader: tell the screen, then keep going if a further page was asked for. */
  function arrived() {
    on.page?.(pageIndex());
    if (s.goalPage === null || s.goalPage === pageIndex()) { s.goalPage = null; return; }
    stepToward(s.goalPage, true);
  }
  function pan(to) { s.side = to; s.panning = true; on.pan?.(to); }
  function stepToward(target, chained) {
    const dir = target > pageIndex() ? 1 : -1;
    if (!spread && dir > 0 && s.side === 'left') return pan('right');
    if (!spread && dir < 0 && s.side === 'right') return pan('left');
    autoTurn(dir, chained);
  }
  function beginTurn(dir, auto) {
    const to = s.cur + dir;
    if (to < 0 || to >= count) return null;
    const start = dir > 0 ? 1 : -1;
    s.turn = {from: s.cur, to, dir, x: start, v: 0, target: start, phi: 0, phiTarget: 0, gy: -H * 0.28, dragging: false, auto, completes: false, notch: 0, landed: false};
    on.lift?.();
    return s.turn;
  }
  function turnTo(index) {
    if (s.mode !== 'open' || index < 0 || index >= pageCount) return;
    if (s.turn?.dragging) return;
    s.goalPage = index;
    if (s.turn || s.riffle || s.panning || index === pageIndex()) { if (index === pageIndex()) s.goalPage = null; return; }
    stepToward(index, false);
  }
  function autoTurn(dir, chained) {
    const t = beginTurn(dir, true);
    if (!t) { s.goalPage = null; return; }
    t.target = -dir; t.completes = true; t.phiTarget = -0.26 * dir; t.v = -dir * (chained ? 3 : 1.2);
    setTimeout(() => { if (s.turn === t) t.phiTarget = 0; }, 260);
    if (reduced) { t.x = t.target; }
  }
  // Opening: the cover swings over, then a few leaves riffle past to the first picture.
  function startRiffle() {
    s.leftTex = T.endpaper; s.rightTex = T.title;
    const sheets = reduced ? [] : [[T.title, T.paper, T.paper], [T.paper, T.paper, T.paper], [T.paper, left[s.cur], right[s.cur]]];
    let leftNow = T.endpaper;
    const next = () => {
      const sh = sheets.shift();
      if (!sh) { s.riffle = null; s.leftTex = s.rightTex = null; s.mode = 'open'; s.camX = camTarget(); s.glow = 1; camera(); on.open?.(); on.page?.(pageIndex()); return; }
      on.riffle?.();
      s.riffle = {front: sh[0], back: sh[1], under: sh[2], left: leftNow, t: 0, dur: sheets.length ? 0.3 : 0.62, last: !sheets.length, x: 1, phi: 0, gy: -H * 0.2, done: () => { leftNow = sh[1]; next(); }};
    };
    s.mode = 'opening'; next();
  }

  function openCover() {
    if (s.mode !== 'closed') return;
    s.mode = 'opening'; s.held = 0; s.hingeTarget = null; s.rightTex = T.title; s.leftTex = T.endpaper;
    if (reduced) s.hinge = PI - 0.001;
    on.coverOpen?.();
  }

  /* ----- Touch ----- */
  const abort = new AbortController(), opts = {signal: abort.signal};
  let g = null, moved = false;
  const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const [px, py] = local(e), p = toPage(px, py);
    if (s.mode === 'closed' && !s.waiting && s.arrive >= 1) {
      // The cover opens the same way a page turns: take hold and sweep it across.
      g = {cover: true, id: e.pointerId, sx: e.clientX, wpp: Math.abs(toPage(px + 1, py)[0] - p[0]), lastX: e.clientX, lastT: performance.now(), vx: 0, progress: 0, active: false};
      return;
    }
    if (s.mode !== 'open' || s.riffle || (s.turn && !s.turn.auto)) return;
    if (s.panning) return;
    g = {id: e.pointerId, sx: e.clientX, sy: e.clientY, p, wpp: toPage(px + 1, py)[0] - p[0], lastX: e.clientX, lastT: performance.now(), vx: 0, turn: null};
    moved = false;
  }, opts);
  stage.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && !g) { s.tiltTarget = [(e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * -2]; return; }
    if (!g || e.pointerId !== g.id) return;
    if (g.cover) {
      const travel = Math.abs(e.clientX - g.sx), now = performance.now();
      if (!g.active) { if (travel < 7) return; g.active = true; moved = true; try { stage.setPointerCapture(g.id); } catch {} on.coverGrab?.(); }
      e.preventDefault();
      g.progress = clamp(travel * g.wpp / 0.85, 0, 1);
      s.hingeTarget = g.progress * PI * 0.94;
      on.coverDrag?.(g.progress);
      if (now - g.lastT > 12) { g.vx = Math.abs(e.clientX - g.lastX) / (now - g.lastT); g.lastX = e.clientX; g.lastT = now; }
      return;
    }
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (!g.turn) {
      if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(dy) * 0.8) return;
      const dir = dx < 0 ? 1 : -1;
      // A sheet already turning on its own can be caught mid-air.
      if (!spread && !s.turn) {
        // On a narrow screen, the other page of the same spread is a glance across, not a turn.
        const across = dir > 0 && s.side === 'left' ? 'right' : dir < 0 && s.side === 'right' ? 'left' : null;
        if (across) { g = null; s.goalPage = null; pan(across); return; }
      }
      if (s.turn?.auto && s.turn.dir === dir) { g.turn = s.turn; s.goalPage = null; }
      else if (s.turn) return;
      else g.turn = beginTurn(dir, false);
      if (!g.turn) { g = null; on.refuse?.(); return; }
      g.turn.dragging = true; g.turn.auto = false; g.turn.completes = false; g.turn.landed = false;
      g.turn.gy = clamp(g.p[1], -H * 0.46, H * 0.46); g.base = g.turn.x; g.px = g.p[0];
      moved = true; try { stage.setPointerCapture(g.id); } catch {}
      on.grab?.();
    }
    e.preventDefault();
    const t = g.turn, gain = spread ? 1.3 : 2.3;
    t.target = clamp(g.base + dx * g.wpp * gain, -1, 1.02);
    t.phiTarget = clamp(0.42 * (t.gy / (H / 2)) + dy * g.wpp * 0.55, -0.5, 0.5);
    const now = performance.now();
    if (now - g.lastT > 12) { g.vx = (e.clientX - g.lastX) / (now - g.lastT); g.lastX = e.clientX; g.lastT = now; }
  }, opts);
  const release = e => {
    if (!g || (e && e.pointerId !== g.id)) return;
    if (g.cover) {
      const {progress, vx, active} = g; g = null;
      if (!active) return;
      setTimeout(() => { moved = false; }, 60);
      if (progress > 0.3 || (progress > 0.08 && vx > 0.5)) { s.hingeTarget = null; openCover(); } else { s.hingeTarget = 0; on.coverRest?.(); }
      return;
    }
    const t = g.turn, flick = g.vx * -1; g = null;
    if (!t) return;
    t.dragging = false; t.phiTarget = 0;
    // Past the middle, or flicked hard enough: the page carries over. Otherwise it settles back.
    const forward = t.dir > 0, past = forward ? t.x < 0.38 : t.x > -0.38, fast = forward ? flick > 0.45 : flick < -0.45, back = forward ? flick < -0.5 : flick > 0.5;
    t.completes = (past || fast) && !back;
    t.target = t.completes ? -t.dir : t.dir;
    t.v += clamp(-flick * 2.4, -7, 7) * (e?.type === 'pointercancel' ? 0 : 1);
    on.release?.(t.completes);
    setTimeout(() => { moved = false; }, 60);
  };
  stage.addEventListener('pointerup', release, opts);
  stage.addEventListener('pointercancel', release, opts);
  stage.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, {...opts, capture: true});
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; s.tiltTarget = [clamp(e.gamma / 28, -1, 1), clamp((e.beta - 45) / 32, -1, 1)]; }, opts);
  const observer = new ResizeObserver(resize); observer.observe(canvas); observer.observe(stage);
  resize(); camera();
  requestAnimationFrame(tick);

  return {
    get index() { return pageIndex(); }, get count() { return pageCount; }, get mode() { return s.mode; }, get spreadIndex() { return s.cur; }, get side() { return s.side; },
    project, turnTo,
    hold(v) { s.held = v; },
    open: openCover,
    /** Let the book out of its box: it begins its fall into place. */
    release() { s.waiting = false; },
    destroy() { s.alive = false; abort.abort(); observer.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}
