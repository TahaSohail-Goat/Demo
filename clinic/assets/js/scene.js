/* =========================================================
   Aldena — particle film (Three.js)
   One point cloud morphs DNA → heart → cell → clinic cross → dispersal.
   Scroll progress comes from window.__film.p (0..1), set by main.js.
   ========================================================= */
import * as THREE from 'three';

const canvas = document.getElementById('particles');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl');
else init();

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const lowPower = mobile || (navigator.hardwareConcurrency || 8) <= 4;
  const COUNT = lowPower ? 9000 : 16000;
  const hudCount = document.getElementById('hudCount');
  if (hudCount) hudCount.textContent = COUNT.toLocaleString('en-US');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.5 : 2));
  renderer.setClearColor(0x050b18, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  /* ---------- Shape samplers (all return [x,y,z]) ---------- */
  const R = Math.random;
  const gauss = () => (R() + R() + R() - 1.5) / 1.5;

  function dna(i) {
    const turns = 3.2, h = 7.2, r = 1.25;
    const k = R();
    if (k < 0.72) {                                   // two backbones
      const strand = k < 0.36 ? 0 : Math.PI;
      const t = R();
      const a = t * turns * Math.PI * 2 + strand;
      const y = (t - 0.5) * h;
      return [Math.cos(a) * r + gauss() * 0.07, y + gauss() * 0.05, Math.sin(a) * r + gauss() * 0.07];
    }
    const rungs = 44, n = Math.floor(R() * rungs);   // base pairs
    const t = (n + 0.5) / rungs, a = t * turns * Math.PI * 2;
    const s = R() * 2 - 1;
    return [Math.cos(a) * r * s + gauss() * 0.03, (t - 0.5) * h + gauss() * 0.03, Math.sin(a) * r * s + gauss() * 0.03];
  }

  // Taubin's implicit heart, sampled near its surface
  const heartPts = [];
  (function buildHeart() {
    const F = (x, y, z) => { const a = x * x + 2.25 * y * y + z * z - 1; return a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z; };
    let guard = 0;
    while (heartPts.length < COUNT && guard++ < 4e6) {
      const x = (R() * 2 - 1) * 1.3, y = (R() * 2 - 1) * 0.9, z = (R() * 2 - 1) * 1.4;
      const f = F(x, y, z);
      if (f <= 0 && (f > -0.035 || R() < 0.04)) heartPts.push([x * 2.1, z * 2.1 + 0.3, y * 2.1]);
    }
  })();
  const heart = (i) => heartPts[i % heartPts.length];

  function cell(i) {
    const k = R();
    // membrane with organic ripples, a nucleus, and scattered organelles
    const u = R() * 2 - 1, th = R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    const d = [s * Math.cos(th), u, s * Math.sin(th)];
    if (k < 0.62) {
      const rr = 2.3 + 0.18 * Math.sin(d[0] * 5 + d[1] * 3) + 0.12 * Math.sin(d[2] * 7) + gauss() * 0.04;
      return d.map((c) => c * rr);
    }
    if (k < 0.86) { const rr = 0.8 + gauss() * 0.06; return [d[0] * rr + 0.35, d[1] * rr + 0.2, d[2] * rr]; }
    const rr = 1.1 + R() * 1.0; return d.map((c) => c * rr);
  }

  function cross(i) {
    // 3D plus sign, particles biased to faces
    const arm = R() < 0.5;
    const L = 3.4, T = 1.1;
    let x = (R() - 0.5) * (arm ? L : T), y = (R() - 0.5) * (arm ? T : L), z = (R() - 0.5) * T;
    const face = Math.floor(R() * 3);
    if (R() < 0.7) { if (face === 0) z = Math.sign(z || 1) * T / 2; else if (face === 1) (arm ? (y = Math.sign(y || 1) * T / 2) : (x = Math.sign(x || 1) * T / 2)); }
    return [x, y, z];
  }

  function field(i) {
    const u = R() * 2 - 1, th = R() * Math.PI * 2, s = Math.sqrt(1 - u * u), rr = 6 + R() * 14;
    return [s * Math.cos(th) * rr, u * rr * 0.6, s * Math.sin(th) * rr - 4];
  }

  const shapes = [dna, heart, cell, cross, field];
  const geo = new THREE.BufferGeometry();
  shapes.forEach((fn, si) => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) { const p = fn(i); arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2]; }
    geo.setAttribute(si === 0 ? 'position' : 'p' + si, new THREE.BufferAttribute(arr, 3));
  });
  const rnd = new Float32Array(COUNT); for (let i = 0; i < COUNT; i++) rnd[i] = R();
  geo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));

  const uniforms = {
    uMorph: { value: 0 }, uTime: { value: 0 }, uSize: { value: lowPower ? 34 : 30 },
    uPR: { value: renderer.getPixelRatio() },
    uC0: { value: new THREE.Color('#9fbcff') }, uC1: { value: new THREE.Color('#ff7b8a') },
    uC2: { value: new THREE.Color('#7fe3d4') }, uC3: { value: new THREE.Color('#ffffff') },
    uC4: { value: new THREE.Color('#5a78c8') }, uAccent: { value: new THREE.Color('#2448ff') },
    uBeat: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 p1; attribute vec3 p2; attribute vec3 p3; attribute vec3 p4; attribute float rnd;
      uniform float uMorph, uTime, uSize, uPR, uBeat;
      uniform vec3 uC0, uC1, uC2, uC3, uC4, uAccent;
      varying vec3 vColor; varying float vAlpha;
      float ease(float t){ return t < .5 ? 4.*t*t*t : 1. - pow(-2.*t + 2., 3.) / 2.; }
      float seg(float m, float i){ return ease(clamp((m - i) * 1.35 - rnd * .35, 0., 1.)); }
      void main(){
        float m = uMorph;
        vec3 p = position;
        p = mix(p, p1, seg(m, 0.));
        p = mix(p, p2, seg(m, 1.));
        p = mix(p, p3, seg(m, 2.));
        p = mix(p, p4, seg(m, 3.));
        vec3 c = uC0;
        c = mix(c, uC1, seg(m, 0.)); c = mix(c, uC2, seg(m, 1.)); c = mix(c, uC3, seg(m, 2.)); c = mix(c, uC4, seg(m, 3.));
        c = mix(c, uAccent, step(.93, rnd) * .8);
        // heartbeat pulse while the heart is formed
        float heartW = seg(m, 0.) * (1. - seg(m, 1.));
        p *= 1. + heartW * uBeat * .06;
        // gentle drift so the cloud always breathes
        p += vec3(sin(uTime * .7 + rnd * 40.), cos(uTime * .6 + rnd * 25.), sin(uTime * .5 + rnd * 12.)) * .025;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (.35 + rnd * .9) * uPR / -mv.z;
        vColor = c;
        vAlpha = .55 + .45 * sin(uTime * 1.5 + rnd * 30.) * .5 + .25;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor; varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - .5);
        float a = smoothstep(.5, 0., d);
        a = pow(a, 1.8);
        gl_FragColor = vec4(vColor * (1. + a * .6), a * vAlpha);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  const group = new THREE.Group(); group.add(points); scene.add(group);

  /* ---------- Layout ---------- */
  let W = 0, H = 0, offX = 0, narrow = false;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    narrow = W < 860;
    offX = narrow ? 0 : Math.min(3.2, 1 + (W / H) * 1.1);
    group.scale.setScalar(narrow ? 0.44 : 1);
  }
  resize(); addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const names = ['DNA · double helix', 'Heart · four chambers', 'Cell · nucleus & membrane', 'Aldena · one clinic', 'Dispersal'];
  const hudName = document.getElementById('hudName');
  let lastName = -1;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    sp += (film.p - sp) * (1 - Math.exp(-dt * 6));
    const pk = 1 - Math.exp(-dt * 3);
    pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;

    // scroll → morph index with holds: DNA (intro + prevention), heart, cell, cross, dispersal
    const ss = THREE.MathUtils.smoothstep;
    const m = ss(sp, 0.32, 0.42) + ss(sp, 0.55, 0.65) + ss(sp, 0.76, 0.86) + ss(sp, 0.94, 1.0);
    uniforms.uMorph.value = m;
    uniforms.uTime.value = reduce ? 0 : t;
    // lub-dub heartbeat at ~72 bpm
    const ph = (t * 1.2) % 1;
    uniforms.uBeat.value = reduce ? 0 : Math.exp(-((ph - 0.05) ** 2) / 0.002) + 0.6 * Math.exp(-((ph - 0.22) ** 2) / 0.002);

    const idx = Math.min(4, Math.round(m));
    if (idx !== lastName && hudName) { hudName.textContent = names[idx]; lastName = idx; }

    const heartW = Math.min(1, Math.max(0, m)) * (1 - Math.min(1, Math.max(0, m - 1)));
    group.position.x = offX * (1 - 0.45 * heartW);             // centre the heart between copy and vitals
    group.position.y = narrow ? 2.3 : 0;
    group.rotation.y = (reduce ? 0 : t * 0.12) + sp * Math.PI * 3 + pointer.x * 0.4;
    group.rotation.x = pointer.y * 0.25 + Math.sin(sp * Math.PI) * 0.2;
    camera.position.z = 11 - Math.sin(sp * Math.PI * 4) * 0.6;
    camera.lookAt(offX * 0.3, narrow ? 0.4 : 0, 0);
    renderer.render(scene, camera);
  }
  frame();
}
