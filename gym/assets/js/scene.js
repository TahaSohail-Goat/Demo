/* =========================================================
   KILO — barbell loading film (Three.js)
   A 20 kg Olympic bar is loaded with IWF-coloured bumper plates on scroll
   (red 25, blue 20, yellow 15, green 10), then lifted off the platform.
   Real proportions in metres. Scroll progress: window.__film.p (core.js).
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('barCanvas');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl'); else init();

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x121212, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x121212, 6, 14);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);

  const spot = new THREE.SpotLight(0xffffff, 55, 12, Math.PI / 5.5, 0.55, 1.2);
  spot.position.set(0.4, 4.2, 1.2); spot.target.position.set(0, 0, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048); spot.shadow.bias = -0.0003;
  scene.add(spot, spot.target);
  const rim = new THREE.DirectionalLight(0xff4a4a, 0.9); rim.position.set(-3, 1.5, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.08));

  const ss = THREE.MathUtils.smoothstep, clamp01 = (x) => Math.min(1, Math.max(0, x));

  /* ---------- Platform: plywood centre, rubber sides ---------- */
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const platTex = tex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#161616'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    const x0 = w * 0.25, x1 = w * 0.75;
    for (let p = 0; p < 6; p++) {                                     // plywood strips
      const y0 = (h / 6) * p; const g = x.createLinearGradient(x0, 0, x1, 0);
      const base = 150 + Math.random() * 25; g.addColorStop(0, `rgb(${base},${base * 0.72},${base * 0.45})`); g.addColorStop(1, `rgb(${base - 20},${(base - 20) * 0.72},${(base - 20) * 0.45})`);
      x.fillStyle = g; x.fillRect(x0, y0, x1 - x0, h / 6 - 3);
      for (let k = 0; k < 40; k++) { x.strokeStyle = `rgba(90,55,25,${0.08 + Math.random() * 0.1})`; x.beginPath(); const yy = y0 + Math.random() * (h / 6); x.moveTo(x0, yy); x.bezierCurveTo(x0 + 120, yy + 6, x1 - 160, yy - 6, x1, yy + Math.random() * 4); x.stroke(); }
    }
    x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(x0 - 4, 0, 4, h); x.fillRect(x1, 0, 4, h);
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`; x.beginPath(); x.arc(w * 0.5 + (Math.random() - 0.5) * 260, h * 0.5 + (Math.random() - 0.5) * 300, 10 + Math.random() * 40, 0, 7); x.fill(); } // chalk marks
  });
  const platform = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshStandardMaterial({ map: platTex, roughness: 0.85 }));
  platform.rotation.x = -Math.PI / 2; platform.rotation.z = Math.PI / 2; platform.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.002; floor.receiveShadow = true;
  scene.add(floor, platform);

  /* ---------- Bar ---------- */
  const knurl = tex(512, 64, (x, w, h) => { x.fillStyle = '#9b9b9b'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(40,40,40,.55)'; x.lineWidth = 1; for (let i = -h; i < w; i += 6) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke(); } x.fillStyle = '#b7b7b7'; x.fillRect(w * 0.47, 0, w * 0.06, h); });
  knurl.wrapS = THREE.RepeatWrapping; knurl.repeat.set(3, 1);
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.22, clearcoat: 0.4 });
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.45, map: knurl, bumpMap: knurl, bumpScale: 0.6 });
  const bar = new THREE.Group();
  const cyl = (r, len, mat, seg = 40) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat); m.rotation.z = Math.PI / 2; m.castShadow = true; return m; };
  const shaft = cyl(0.014, 1.31, shaftMat); bar.add(shaft);
  [-1, 1].forEach((s) => {
    const flange = cyl(0.036, 0.03, steel); flange.position.x = s * 0.67; bar.add(flange);
    const sleeve = cyl(0.025, 0.415, steel); sleeve.position.x = s * (0.685 + 0.2075); bar.add(sleeve);
    const cap = cyl(0.027, 0.012, steel); cap.position.x = s * 1.1; bar.add(cap);
  });

  /* ---------- Bumper plates (IWF colours) ---------- */
  const PLATES = [{ kg: 25, c: 0xd7262e, t: 0.066, win: [0.15, 0.25] }, { kg: 20, c: 0x1f5fbf, t: 0.054, win: [0.33, 0.43] }, { kg: 15, c: 0xf2c230, t: 0.043, win: [0.51, 0.61] }, { kg: 10, c: 0x2e9b4f, t: 0.034, win: [0.69, 0.79] }];
  function plateGeo(t) {
    const h = t / 2;
    const prof = [[0.0255, -h], [0.19, -h], [0.212, -h + 0.004], [0.2245, -h + 0.012], [0.2245, h - 0.012], [0.212, h - 0.004], [0.19, h], [0.0255, h], [0.0255, -h]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(prof, mobile ? 64 : 96); g.rotateZ(Math.PI / 2); return g;
  }
  function decalTex(kg, color) {
    return tex(512, 512, (x, w, h) => {
      x.clearRect(0, 0, w, h); x.translate(256, 256);
      x.fillStyle = '#fff'; x.font = '700 64px "Big Shoulders Display", Impact, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(`${kg} KG`, 0, -150); x.save(); x.rotate(Math.PI); x.fillText(`${kg} KG`, 0, -150); x.restore();
      x.font = '600 26px "JetBrains Mono", monospace'; x.fillText('KILO · IWF SPEC', 0, 150);
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 196, 0, Math.PI * 2); x.stroke();
    });
  }
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 1, roughness: 0.3 });
  const pairs = PLATES.map((P) => {
    const mat = new THREE.MeshStandardMaterial({ color: P.c, roughness: 0.62, metalness: 0 });
    const dmat = new THREE.MeshBasicMaterial({ map: decalTex(P.kg, P.c), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.9 });
    const make = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(plateGeo(P.t), mat); body.castShadow = true; body.receiveShadow = true; g.add(body);
      [-1, 1].forEach((s) => {
        const hub = new THREE.Mesh(new THREE.RingGeometry(0.0255, 0.062, 48), hubMat); hub.rotation.y = s * Math.PI / 2; hub.position.x = s * (P.t / 2 + 0.0015); g.add(hub);
        const dec = new THREE.Mesh(new THREE.CircleGeometry(0.2, 64), dmat); dec.rotation.y = s * Math.PI / 2; dec.position.x = s * (P.t / 2 + 0.001); g.add(dec);
      });
      return g;
    };
    return { P, L: make(), R: make() };
  });
  // seat positions: stack outward from the flange
  let offset = 0.685 + 0.004;
  pairs.forEach((pr) => { pr.seat = offset + pr.P.t / 2; offset += pr.P.t + 0.002; bar.add(pr.L, pr.R); });
  // spring collars
  const collarMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.4 });
  const collars = [-1, 1].map((s) => { const c = cyl(0.04, 0.035, collarMat); bar.add(c); return c; });
  const collarSeat = offset + 0.02;

  const stage = new THREE.Group(); stage.add(bar); scene.add(stage);

  /* ---------- Chalk dust in the light ---------- */
  const N = mobile ? 160 : 320;
  const dust = new THREE.BufferGeometry(); const dp = new Float32Array(N * 3), seeds = [];
  for (let i = 0; i < N; i++) seeds.push([(Math.random() - 0.5) * 3, Math.random() * 2.6, (Math.random() - 0.5) * 2, Math.random() * 6.28, 0.02 + Math.random() * 0.05]);
  dust.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dsprite = tex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const dustPts = new THREE.Points(dust, new THREE.PointsMaterial({ map: dsprite, size: 0.022, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dustPts);

  /* ---------- Layout ---------- */
  let W = 0, H = 0, narrow = false;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight; renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix(); narrow = W < 860;
  }
  resize(); addEventListener('resize', resize);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0, visible = true, intro = reduce ? 1 : 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const easeOutBack = (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const look = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    sp += (film.p - sp) * (1 - Math.exp(-dt * 6));
    const pk = 1 - Math.exp(-dt * 3); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;
    const p = sp, amb = reduce ? 0 : 1;
    intro = Math.min(1, intro + dt / 1.6); const ie = 1 - Math.pow(1 - intro, 3);

    // Plates slide on along the sleeves with a spin, then seat
    let loaded = 0;
    pairs.forEach((pr, i) => {
      const [a, b] = pr.P.win; const k = clamp01((p - a) / (b - a));
      const e = k <= 0 ? 0 : easeOutBack(k);
      const x = THREE.MathUtils.lerp(1.9 + i * 0.1, pr.seat, Math.min(1.05, e));
      pr.L.position.x = -x; pr.R.position.x = x;
      pr.L.rotation.x = pr.R.rotation.x = (1 - k) * 6;
      pr.L.visible = pr.R.visible = k > 0;
      if (k > 0.7) loaded = i + 1;
    });
    const ck = clamp01((p - 0.8) / 0.04);
    collars.forEach((c, i) => { c.position.x = (i ? 1 : -1) * THREE.MathUtils.lerp(1.6, collarSeat, ck); c.visible = ck > 0; });

    // Bar height: hovers empty, settles on the plates, then is lifted
    const settle = ss(p, 0.18, 0.26);
    const lift = ss(p, 0.86, 0.96);
    const hover = (1 - settle) * (0.12 + Math.sin(t * 1.3) * 0.02 * amb);
    bar.position.y = 0.2245 + hover + lift * 0.95 + (1 - ie) * 0.8;
    bar.rotation.x = (1 - settle) * Math.sin(t * 0.6) * 0.15 * amb;
    // subtle whip on the lift
    bar.rotation.z = lift * Math.sin(t * 9) * 0.004 * amb;

    // Camera: wide 3/4 → close on the plates → back out for the lift
    const orbit = 0.62 + p * 0.38 + pointer.x * 0.1;
    const dist = (narrow ? 6.2 : 3.3) - ss(p, 0.12, 0.6) * (narrow ? 1.2 : 0.8) + lift * 0.9;
    const camY = 0.9 + lift * 0.6 - pointer.y * 0.2 + (1 - ie) * 0.4;
    camera.position.set(Math.sin(orbit) * dist, camY, Math.cos(orbit) * dist);
    look.set(0, 0.3 + lift * 0.7, 0);
    camera.lookAt(look);
    // shift the framing so the bar sits right of the copy on desktop
    camera.setViewOffset(W, H, narrow ? 0 : -W * 0.12, narrow ? H * 0.24 : 0, W, H);

    // dust drifts in the light cone
    const pos = dust.attributes.position;
    for (let i = 0; i < N; i++) { const s = seeds[i]; pos.setXYZ(i, s[0] + Math.sin(t * 0.3 + s[3]) * 0.15, (s[1] + t * s[4] * amb) % 2.6, s[2] + Math.cos(t * 0.25 + s[3]) * 0.15); }
    pos.needsUpdate = true;
    spot.intensity = 55 * (0.85 + 0.15 * ie);

    renderer.render(scene, camera);
  }
  frame();
}
