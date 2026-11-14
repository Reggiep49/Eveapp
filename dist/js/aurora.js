// The living sky behind the app: a WebGL aurora with a still CSS fallback.

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer; uniform float uWarm;
float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y); float t = uTime * 0.045;
  vec3 col = mix(vec3(0.016,0.035,0.070), vec3(0.020,0.055,0.095), uv.y);
  col += vec3(0.02,0.05,0.07) * smoothstep(0.9, 0.0, distance(uv, vec2(0.5 + uPointer.x*0.08, 1.05)));
  for(int i=0;i<3;i++){
    float fi = float(i);
    float wave = fbm(vec2(p.x*1.5 + fi*3.7 + t*(1.0+fi*0.35), t*0.6 + fi));
    float center = 0.60 - fi*0.10 + (wave-0.5)*0.62 + uPointer.y*0.03;
    float d = uv.y - center;
    float curtain = exp(-pow(max(d,0.0)*3.0, 1.25)) * smoothstep(-0.16, 0.03, d);
    float rays = 0.45 + 0.55*noise(vec2(p.x*16.0 + fi*9.0 + wave*4.0, t*3.0));
    vec3 cool = mix(vec3(0.18,0.95,0.70), vec3(0.45,0.50,1.0), clamp(d*2.6 + fi*0.22, 0.0, 1.0));
    vec3 tint = mix(cool, vec3(0.86,0.52,1.0), uWarm * (0.25 + 0.3*fi));
    col += tint * curtain * rays * (0.21 - fi*0.035);
  }
  col += vec3(1.0,0.66,0.32) * uWarm * 0.13 * pow(1.0 - uv.y, 2.2) * (0.7 + 0.3*fbm(vec2(p.x*2.0 - t, t)));
  float s = hash(floor(gl_FragCoord.xy));
  float twinkle = 0.5 + 0.5*sin(uTime*1.3 + s*400.0);
  col += vec3(0.85,0.92,1.0) * step(0.9988, s) * twinkle * (0.15 + 0.5*uv.y);
  col *= 1.0 - 0.42*pow(distance(uv, vec2(0.5)), 2.0);
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

export function mountAurora(canvas, {reduced = false} = {}) {
  const gl = canvas.getContext('webgl', {antialias: false, alpha: false, powerPreference: 'low-power'});
  const state = {warm: 0, targetWarm: 0, paused: false, px: 0, py: 0, tx: 0, ty: 0};
  if (!gl) { canvas.classList.add('aurora-fallback'); return {setWarm() {}, pause() {}}; }
  const compile = (type, source) => { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); return s; };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.classList.add('aurora-fallback'); return {setWarm() {}, pause() {}}; }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = name => gl.getUniformLocation(program, name);
  const uRes = u('uRes'), uTime = u('uTime'), uPointer = u('uPointer'), uWarm = u('uWarm');

  const resize = () => {
    // Half resolution is plenty for soft light and keeps phones cool.
    const scale = Math.min(devicePixelRatio || 1, 2) * 0.5;
    canvas.width = Math.max(2, Math.round(innerWidth * scale));
    canvas.height = Math.max(2, Math.round(innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw(performance.now());
  };
  function draw(now) {
    state.px += (state.tx - state.px) * 0.04; state.py += (state.ty - state.py) * 0.04;
    state.warm += (state.targetWarm - state.warm) * 0.03;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced ? 40 : now / 1000);
    gl.uniform2f(uPointer, state.px, state.py);
    gl.uniform1f(uWarm, state.warm);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  let frame = 0;
  const loop = now => { frame = 0; if (state.paused || document.hidden) return; draw(now); if (!reduced) frame = requestAnimationFrame(loop); };
  const wake = () => { if (!frame && !state.paused) frame = requestAnimationFrame(loop); };
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', wake);
  addEventListener('pointermove', event => { state.tx = event.clientX / innerWidth - 0.5; state.ty = event.clientY / innerHeight - 0.5; }, {passive: true});
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); canvas.classList.add('aurora-fallback'); });
  resize(); wake();
  return {
    setWarm(value) { state.targetWarm = value; if (reduced) { state.warm = value; draw(0); } },
    pause(value) { state.paused = value; if (!value) wake(); },
  };
}
