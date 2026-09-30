/* =========================================================
   Shehnai — Mughal arch corridor film (Three.js)
   Red-sandstone ogee arches with marble trim (after Lahore's Mughal
   arcades). The camera walks through them while fairy lights, runner and
   falling petals change: Mehndi (marigold) → Baraat (rose & gold) →
   Walima (jasmine) → Catering (warm embers).
   Scroll progress: window.__film.p (core.js).
   ========================================================= */
import * as THREE from 'three';

const canvas = document.getElementById('archCanvas');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl'); else init();

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const fogCol = new THREE.Color(0x1a0b10);
  scene.fog = new THREE.FogExp2(fogCol, 0.078);
  scene.background = fogCol;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);

  const hemi = new THREE.HemisphereLight(0xffe2c0, 0x1a0b10, 0.32); scene.add(hemi);
  const lamp = new THREE.PointLight(0xffb040, 22, 14, 1.7); scene.add(lamp);
  const lamp2 = new THREE.PointLight(0xff8a30, 10, 12, 1.7); scene.add(lamp2);

  const ss = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  /* ---------- Ogee arch ---------- */
  const HW = 1.45, SPRING = 2.7, APEX = 4.75;
  const outer = new THREE.Shape();
  outer.moveTo(-2.2, 0); outer.lineTo(-2.2, 5.6); outer.lineTo(2.2, 5.6); outer.lineTo(2.2, 0); outer.lineTo(HW, 0); outer.lineTo(HW, SPRING);
  outer.bezierCurveTo(HW, SPRING + 0.8, 0.95, 3.85, 0.48, 4.08);
  outer.bezierCurveTo(0.16, 4.24, 0.03, 4.46, 0, APEX);
  outer.bezierCurveTo(-0.03, 4.46, -0.16, 4.24, -0.48, 4.08);
  outer.bezierCurveTo(-0.95, 3.85, -HW, SPRING + 0.8, -HW, SPRING);
  outer.lineTo(-HW, 0); outer.lineTo(-2.2, 0);
  const archGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 24 });
  archGeo.translate(0, 0, -0.3);
  // marble trim following the opening
  const trimCurve = new THREE.CurvePath();
  trimCurve.add(new THREE.LineCurve3(new THREE.Vector3(HW + 0.12, 0, 0), new THREE.Vector3(HW + 0.12, SPRING, 0)));
  trimCurve.add(new THREE.CubicBezierCurve3(new THREE.Vector3(HW + 0.12, SPRING, 0), new THREE.Vector3(HW + 0.12, SPRING + 0.86, 0), new THREE.Vector3(1.02, 3.95, 0), new THREE.Vector3(0.52, 4.2, 0)));
  trimCurve.add(new THREE.CubicBezierCurve3(new THREE.Vector3(0.52, 4.2, 0), new THREE.Vector3(0.18, 4.36, 0), new THREE.Vector3(0.04, 4.6, 0), new THREE.Vector3(0, APEX + 0.14, 0)));
  const half = trimCurve.getSpacedPoints(60);
  const trimPts = [...half, ...half.slice(0, -1).reverse().map((v) => new THREE.Vector3(-v.x, v.y, v.z))];
  const trimGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trimPts), 180, 0.055, 8, false);

  // sandstone texture
  const stone = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#a9492f'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${120 + Math.random() * 80},${40 + Math.random() * 40},${25 + Math.random() * 20},${Math.random() * 0.25})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    x.strokeStyle = 'rgba(40,10,5,.25)'; for (let y = 0; y < 256; y += 32) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.2, 1.4); return t;
  })();
  const stoneMat = new THREE.MeshStandardMaterial({ map: stone, roughness: 0.85, color: 0xffffff });
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.35, emissive: 0x3a2a18, emissiveIntensity: 0.25 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a64a, metalness: 1, roughness: 0.3 });

  const ARCHES = 9, GAP = 4.2;
  const corridor = new THREE.Group();
  const archStarts = [];
  for (let i = 0; i < ARCHES; i++) {
    const z = -i * GAP; archStarts.push(z);
    const a = new THREE.Mesh(archGeo, stoneMat); a.position.z = z; corridor.add(a);
    const t = new THREE.Mesh(trimGeo, marbleMat); t.position.z = z + 0.34; corridor.add(t);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), goldMat); fin.position.set(0, APEX + 0.3, z + 0.34); corridor.add(fin);
  }
  // final stage arch (larger, glowing)
  const stageZ = -ARCHES * GAP - 2;
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffc36b, transparent: true, opacity: 0.42, fog: true });
  const stageGlow = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-HW, 0); s.lineTo(-HW, SPRING); s.bezierCurveTo(-HW, SPRING + 0.8, -0.95, 3.85, -0.48, 4.08); s.bezierCurveTo(-0.16, 4.24, -0.03, 4.46, 0, APEX); s.bezierCurveTo(0.03, 4.46, 0.16, 4.24, 0.48, 4.08); s.bezierCurveTo(0.95, 3.85, HW, SPRING + 0.8, HW, SPRING); s.lineTo(HW, 0); return s; })(), 32), glowMat);
  stageGlow.scale.setScalar(1.35); stageGlow.position.z = stageZ; corridor.add(stageGlow);
  scene.add(corridor);

  // floor & runner
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 70), new THREE.MeshStandardMaterial({ color: 0x241216, roughness: 0.22, metalness: 0.3 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -20; scene.add(floor);
  const runnerMat = new THREE.MeshStandardMaterial({ color: 0xc4581a, roughness: 0.8 });
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 70), runnerMat);
  runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.01, -20); scene.add(runner);

  /* ---------- Fairy lights (twinkling points) ---------- */
  const lightPos = [], lightRnd = [];
  for (const z of archStarts) {
    for (let i = 0; i < trimPts.length; i += 2) { const v = trimPts[i]; lightPos.push(v.x * 1.08, v.y + 0.12, z + 0.45); lightRnd.push(Math.random()); }
    [-1, 1].forEach((s) => {                                  // drooping strings to the next arch
      for (let k = 0; k <= 24; k++) { const t = k / 24; lightPos.push(s * 2.0, 5.1 - Math.sin(Math.PI * t) * 0.9, z - t * GAP); lightRnd.push(Math.random()); }
    });
    for (let k = 0; k <= 30; k++) { const t = k / 30; lightPos.push(-2 + 4 * t, 5.4 - Math.sin(Math.PI * t) * 0.5, z - GAP / 2); lightRnd.push(Math.random()); }
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lightPos, 3));
  lg.setAttribute('rnd', new THREE.Float32BufferAttribute(lightRnd, 1));
  const lightU = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffc34a) }, uColor2: { value: new THREE.Color(0x9bd05a) }, uSize: { value: mobile ? 26 : 34 }, uPR: { value: renderer.getPixelRatio() } };
  const lights = new THREE.Points(lg, new THREE.ShaderMaterial({
    uniforms: lightU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float rnd; uniform float uTime, uSize, uPR; uniform vec3 uColor, uColor2; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
        float tw = .55 + .45 * sin(uTime * (1.5 + rnd * 3.) + rnd * 40.);
        gl_PointSize = uSize * (.6 + .4 * tw) * uPR / -mv.z; vC = mix(uColor, uColor2, step(.72, rnd)); vA = tw; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); a = a * a; gl_FragColor = vec4(vC * (1. + a), a * vA); }`,
  }));
  scene.add(lights);

  /* ---------- Marigold laris (hanging strings) ---------- */
  const LARI_PER = 7, BEADS = 16;
  const lariCount = ARCHES * LARI_PER * BEADS;
  const lari = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), lariCount);
  const dm = new THREE.Object3D(); let li = 0; const lcol = new THREE.Color();
  for (const z of archStarts) for (let s = 0; s < LARI_PER; s++) {
    const x = -1.25 + (2.5 * s) / (LARI_PER - 1); const len = 1.1 + Math.abs(Math.sin(s * 1.3)) * 0.9;
    for (let b = 0; b < BEADS; b++) {
      dm.position.set(x, 5.5 - (b / BEADS) * len, z - 0.4); dm.scale.setScalar(1); dm.updateMatrix(); lari.setMatrixAt(li, dm.matrix);
      lari.setColorAt(li, lcol.set(b % 3 === 0 ? 0xffc23d : b % 3 === 1 ? 0xf29d1f : 0xe06a12)); li++;
    }
  }
  scene.add(lari);

  /* ---------- Petals ---------- */
  const petalShape = new THREE.Shape(); petalShape.ellipse(0, 0, 0.06, 0.09, 0, Math.PI * 2);
  const petalGeo = new THREE.ShapeGeometry(petalShape, 10);
  { const p = petalGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, x * x * 6); } petalGeo.computeVertexNormals(); }
  const NP = mobile ? 220 : 420;
  const petals = new THREE.InstancedMesh(petalGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide, emissive: 0x3a2410, emissiveIntensity: 0.6 }), NP);
  const P = []; for (let i = 0; i < NP; i++) P.push({ x: (Math.random() - 0.5) * 5, y: Math.random() * 6, z: -Math.random() * 14, s: 0.18 + Math.random() * 0.25, r: Math.random() * 6.28, sp: 0.8 + Math.random() * 1.8, ax: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize() });
  scene.add(petals);
  const THEMES = [
    { light: 0xffc34a, light2: 0x9bd05a, fog: 0x1c1208, runner: 0xc4581a, petals: [0xf29d1f, 0xffc23d, 0xe06a12], lamp: 0xffb040, lari: 1 },
    { light: 0xffcf70, light2: 0xff4a5e, fog: 0x1f070d, runner: 0x8e0f2a, petals: [0xb3122f, 0xd92745, 0x7c1128], lamp: 0xff7a50, lari: 0 },
    { light: 0xfff4e0, light2: 0xcfe0ff, fog: 0x14121a, runner: 0xe9e2d4, petals: [0xffffff, 0xf6f1e6, 0xfff8ea], lamp: 0xfff0d8, lari: 0 },
    { light: 0xffb34a, light2: 0xff7a2a, fog: 0x1d0e07, runner: 0x6e2a14, petals: [0xffb347, 0xff8a3d, 0xffd27a], lamp: 0xff9a40, lari: 0 },
  ];
  let themeIdx = -1;
  function applyPetalColors(i) { const c = new THREE.Color(); for (let k = 0; k < NP; k++) petals.setColorAt(k, c.set(THEMES[i].petals[k % 3])); petals.instanceColor.needsUpdate = true; }
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  function blend(key, w) { tmpA.set(0x000000); let sum = 0; THEMES.forEach((t, i) => { tmpB.set(t[key]); tmpA.r += tmpB.r * w[i]; tmpA.g += tmpB.g * w[i]; tmpA.b += tmpB.b * w[i]; sum += w[i]; }); return tmpA.multiplyScalar(1 / Math.max(sum, 1e-4)); }

  /* ---------- Layout ---------- */
  let W = 0, H = 0, narrow = false;
  function resize() { W = canvas.clientWidth; H = canvas.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); narrow = W < 860; }
  resize(); addEventListener('resize', resize);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    sp += (film.p - sp) * (1 - Math.exp(-dt * 5));
    const pk = 1 - Math.exp(-dt * 3); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;
    const p = sp, amb = reduce ? 0.25 : 1;

    // theme weights
    const b1 = ss(p, 0.27, 0.33), b2 = ss(p, 0.45, 0.51), b3 = ss(p, 0.63, 0.69);
    const w = [1 - b1, b1 * (1 - b2), b2 * (1 - b3), b3];
    const idx = w.indexOf(Math.max(...w));
    if (idx !== themeIdx) { themeIdx = idx; applyPetalColors(idx); }
    lightU.uColor.value.copy(blend('light', w)); lightU.uColor2.value.copy(blend('light2', w));
    fogCol.copy(blend('fog', w)); scene.fog.color.copy(fogCol);
    runnerMat.color.copy(blend('runner', w));
    lamp.color.copy(blend('lamp', w)); lamp2.color.copy(lamp.color);
    lightU.uTime.value = t * amb;
    // marigold laris only for Mehndi
    const lariScale = Math.max(0.0001, w[0]);
    lari.scale.set(1, lariScale, 1); lari.position.y = 5.5 * (1 - lariScale); lari.visible = w[0] > 0.02;
    glowMat.color.copy(lightU.uColor.value);

    // camera walks the corridor
    const z = lerp(8.5, stageZ + 11, ss(p, 0, 1));
    const sway = Math.sin(p * Math.PI * 5) * 0.35;
    camera.position.set(sway + pointer.x * 0.5, 1.75 + pointer.y * -0.3 + Math.sin(t * 0.8) * 0.03 * amb, z);
    camera.lookAt(sway * 0.4, 2.1, z - 8);
    camera.setViewOffset(W, H, narrow ? 0 : -W * 0.14, narrow ? H * 0.18 : 0, W, H);
    lamp.position.set(0, 3.8, z - 3.5); lamp2.position.set(0, 2.5, z - 9);

    // petals fall around the camera, recycled in a box ahead
    for (let i = 0; i < NP; i++) {
      const e = P[i];
      e.y -= dt * e.sp * 0.5 * amb; if (e.y < 0) e.y += 6;
      let pz = z - 1 + e.z; if (pz > z - 0.5) pz -= 14;
      pv.set(e.x + Math.sin(t * 0.8 + i) * 0.3, e.y, pz);
      q.setFromAxisAngle(e.ax, e.r + t * e.sp * amb);
      sv.setScalar(e.s * 1.15);
      m4.compose(pv, q, sv); petals.setMatrixAt(i, m4);
    }
    petals.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }
  frame();
}
