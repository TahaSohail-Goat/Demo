/* =========================================================
   Kestrel House — valley day-to-night film (Three.js)
   A procedural low-poly Karakoram valley: ridged mountains, a snow-capped
   peak at the head of the valley, a turquoise river, apricot orchards and
   the lodge on its terrace. Scrolling flies down the valley while the day
   passes: dawn → noon → golden hour → night with stars.
   Scroll progress: window.__film.p (core.js).
   ========================================================= */
import * as THREE from 'three';

const canvas = document.getElementById('valleyCanvas');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl'); else init();

/* ---------- 2D simplex noise (Gustavson, public domain) ---------- */
function makeNoise(seed = 1) {
  const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const g = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  return (x, y) => {
    const s2 = (x + y) * F2, i = Math.floor(x + s2), j = Math.floor(y + s2), t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t), i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const c = (gx, gy, tx, ty) => { let q = 0.5 - tx * tx - ty * ty; if (q < 0) return 0; q *= q; const gr = g[gx]; return q * q * (gr[0] * tx + gr[1] * ty); };
    return 70 * (c(perm[ii + perm[jj]] & 7, 0, x0, y0) + c(perm[ii + i1 + perm[jj + j1]] & 7, 0, x1, y1) + c(perm[ii + 1 + perm[jj + 1]] & 7, 0, x2, y2));
  };
}

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd99a82, 40, 190);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 900);
  const ss = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp;

  /* ---------- Terrain ---------- */
  const noise = makeNoise(7), noise2 = makeNoise(21);
  const fbm = (x, y) => { let a = 0, amp = 1, f = 1; for (let o = 0; o < 4; o++) { a += amp * noise(x * f, y * f); amp *= 0.5; f *= 2; } return a; };
  const riverX = (z) => Math.sin(z * 0.035) * 6 + Math.sin(z * 0.011) * 4;
  const PEAK = { x: -10, z: -125 };
  function height(x, z) {
    const dx = Math.abs(x - riverX(z));
    const walls = Math.pow(ss(dx, 5, 46), 1.35) * 30;
    const ridged = Math.pow(1 - Math.abs(noise(x * 0.03, z * 0.03)), 2.2) * 16 * ss(dx, 8, 34);
    const detail = fbm(x * 0.09, z * 0.09) * 1.6 * ss(dx, 3, 14);
    const pd = Math.hypot(x - PEAK.x, (z - PEAK.z) * 0.8);
    const peak = 62 * Math.exp(-(pd * pd) / (2 * 22 * 22)) * (0.85 + 0.25 * Math.abs(noise2(x * 0.05, z * 0.05)));
    const terraces = dx < 22 ? Math.round((walls + ridged) / 1.6) * 1.6 * 0.25 + (walls + ridged) * 0.75 : walls + ridged;
    return Math.max(0, terraces + detail + peak);
  }
  const SX = mobile ? 110 : 170, SZ = mobile ? 150 : 230;
  const geo = new THREE.PlaneGeometry(150, 220, SX, SZ);
  geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -70);
  { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i))); }
  const tg = geo.toNonIndexed(); tg.computeVertexNormals();
  {
    const p = tg.attributes.position, n = tg.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const SNOW = new THREE.Color(0xf3f6f9), ROCK = new THREE.Color(0x6e6055), ROCK2 = new THREE.Color(0x584c44), SCRUB = new THREE.Color(0x8d7c5e), ORCH = new THREE.Color(0x5f8036), ORCH2 = new THREE.Color(0x86a040);
    for (let i = 0; i < p.count; i += 3) {             // colour per face for a crisp low-poly look
      const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, ny = (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3;
      const x = p.getX(i), z = p.getZ(i);
      const snowLine = 30 + noise2(x * 0.08, z * 0.08) * 5;
      if (y > snowLine && ny > 0.45) c.copy(SNOW);
      else if (ny < 0.74) c.copy(ROCK).lerp(ROCK2, Math.abs(noise(x * 0.2, z * 0.2)));
      else if (y < 9) c.copy(ORCH).lerp(ORCH2, Math.abs(noise2(x * 0.3, z * 0.3)));
      else c.copy(SCRUB).lerp(ROCK, ss(y, 12, 26));
      for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
    }
    tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  scene.add(terrain);

  // River / lake
  const water = new THREE.Mesh(new THREE.PlaneGeometry(150, 220), new THREE.MeshStandardMaterial({ color: 0x2aa9b3, roughness: 0.18, metalness: 0.2, transparent: true, opacity: 0.92 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.9, -70); scene.add(water);

  // Orchards (instanced trees on the low terraces)
  const TREES = mobile ? 380 : 800;
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.9, 0), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), TREES);
  { const d = new THREE.Object3D(), c = new THREE.Color(); let k = 0, guard = 0;
    while (k < TREES && guard++ < 20000) {
      const z = -5 - Math.random() * 110, x = riverX(z) + (Math.random() - 0.5) * 50, h = height(x, z);
      if (h < 1.6 || h > 9) continue;
      d.position.set(x, h + 0.7, z); const s = 0.7 + Math.random() * 0.8; d.scale.set(s, s * 1.3, s); d.rotation.y = Math.random() * 6; d.updateMatrix();
      trees.setMatrixAt(k, d.matrix); trees.setColorAt(k, c.set(Math.random() < 0.22 ? 0xe9a0a8 : Math.random() < 0.3 ? 0xd9a441 : 0x4f7a30)); k++;
    }
    trees.count = k; }
  scene.add(trees);

  /* ---------- The lodge ---------- */
  const LODGE = { x: 13, z: -34 }; const ly = height(LODGE.x, LODGE.z);
  const lodge = new THREE.Group(); lodge.position.set(LODGE.x, ly, LODGE.z);
  const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a3c, roughness: 0.8, flatShading: true });
  const stone = new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: 0.9, flatShading: true });
  const winMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffb45a, emissiveIntensity: 0 });
  [[0, 0, 0, 7, 2.6, 4], [-4, 2.6, -1, 5, 2.4, 3.5], [3.5, -0.4, 3.5, 5, 2.2, 3]].forEach(([x, y, z, w, h, dd], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), i === 1 ? wood : stone); b.position.set(x, y + h / 2, z); lodge.add(b);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.35, dd + 0.6), wood); roof.position.set(x, y + h + 0.17, z); lodge.add(roof);
    for (let k = 0; k < 3; k++) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), winMat); wdw.position.set(x - w / 3 + k * (w / 3), y + h * 0.55, z + dd / 2 + 0.02); lodge.add(wdw); }
  });
  lodge.rotation.y = -0.7; scene.add(lodge);
  const lodgeLight = new THREE.PointLight(0xffb45a, 0, 30, 1.5); lodgeLight.position.set(LODGE.x, ly + 4, LODGE.z + 3); scene.add(lodgeLight);

  /* ---------- Sky, sun, stars ---------- */
  const skyU = { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 uTop, uHorizon, uSun, uSunCol; varying vec3 vD;
      void main(){ float h = clamp(vD.y * 1.6, 0., 1.); vec3 c = mix(uHorizon, uTop, pow(h, .7));
        float s = max(dot(normalize(vD), normalize(uSun)), 0.); c += uSunCol * (pow(s, 600.) * 2. + pow(s, 12.) * .35);
        gl_FragColor = vec4(c, 1.); }`,
  }));
  scene.add(sky);
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 1400; i++) { const u = Math.random(), th = Math.random() * Math.PI * 2, phi = Math.acos(1 - u * 0.95); sp.push(Math.sin(phi) * Math.cos(th) * 500, Math.cos(phi) * 500, Math.sin(phi) * Math.sin(th) * 500); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(stars);
  const sun = new THREE.DirectionalLight(0xffffff, 2); scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x3b3024, 0.6); scene.add(hemi);

  // time-of-day keyframes: [p, top, horizon, sunElevDeg, sunAzimDeg, sunColor, sunInt, hemiSky, hemiInt, fog, stars, windows]
  const K = [
    [0.0, 0x3a5686, 0xf3a57b, 3, -30, 0xffb07a, 1.6, 0xa9b7d8, 0.45, 0xd9a088, 0, 0.2],
    [0.3, 0x3d7cc2, 0xbfdcf2, 55, 10, 0xfff8ee, 3.0, 0xd6e8ff, 0.8, 0xbcd4e4, 0, 0],
    [0.5, 0x496aa2, 0xffbf78, 9, 60, 0xffa95a, 2.4, 0xffd9b0, 0.55, 0xe6b48a, 0, 0.1],
    [0.68, 0x0d1633, 0x33406a, -6, 80, 0x9fb3ff, 0.8, 0x6a7ab8, 0.45, 0x1b2440, 0.8, 1],
    [1.0, 0x050a1a, 0x141c36, -12, 90, 0x9fb3ff, 0.65, 0x55659c, 0.38, 0x0e1428, 1, 1],
  ];
  const cA = new THREE.Color(), cB = new THREE.Color();
  const lerpC = (a, b, t, out) => out.copy(cA.set(a)).lerp(cB.set(b), t);
  function applyTime(p) {
    let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1], t = ss(p, a[0], b[0]);
    lerpC(a[1], b[1], t, skyU.uTop.value); lerpC(a[2], b[2], t, skyU.uHorizon.value);
    const el = THREE.MathUtils.degToRad(lerp(a[3], b[3], t)), az = THREE.MathUtils.degToRad(lerp(a[4], b[4], t));
    const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az));
    skyU.uSun.value.copy(dir); lerpC(a[5], b[5], t, skyU.uSunCol.value);
    sun.position.copy(dir).multiplyScalar(200); sun.color.copy(skyU.uSunCol.value); sun.intensity = lerp(a[6], b[6], t);
    lerpC(a[7], b[7], t, hemi.color); hemi.intensity = lerp(a[8], b[8], t);
    lerpC(a[9], b[9], t, scene.fog.color);
    stars.material.opacity = lerp(a[10], b[10], t);
    const win = lerp(a[11], b[11], t); winMat.emissiveIntensity = win * 2.2; lodgeLight.intensity = win * 60;
  }

  /* ---------- Camera path ---------- */
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2, 26, 30), new THREE.Vector3(-3, 20, 6), new THREE.Vector3(3, 15, -12), new THREE.Vector3(8, ly + 9, -14), new THREE.Vector3(LODGE.x - 5, ly + 8, LODGE.z + 22),
  ]);
  const look = new THREE.Vector3(), peakLook = new THREE.Vector3(PEAK.x, 38, PEAK.z);

  let W = 0, H = 0, narrow = false;
  function resize() { W = canvas.clientWidth; H = canvas.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); narrow = W < 860; }
  resize(); addEventListener('resize', resize);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let smooth = 0, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    smooth += (film.p - smooth) * (1 - Math.exp(-dt * 4));
    const pk = 1 - Math.exp(-dt * 2.5); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;
    const p = smooth, amb = reduce ? 0 : 1;
    applyTime(p);
    path.getPointAt(Math.min(1, p * 1.02), camera.position);
    camera.position.x += pointer.x * 1.5 + Math.sin(t * 0.25) * 0.4 * amb;
    camera.position.y += -pointer.y * 1 + Math.sin(t * 0.4) * 0.25 * amb;
    look.copy(peakLook); look.x += pointer.x * 6;
    look.y = lerp(38, 30, ss(p, 0.6, 1));
    camera.lookAt(look);
    camera.setViewOffset(W, H, narrow ? 0 : -W * 0.1, narrow ? H * 0.12 : 0, W, H);
    water.material.color.setHSL(0.51, 0.62, lerp(0.44, 0.22, ss(p, 0.6, 0.8)));
    renderer.render(scene, camera);
  }
  frame();
}
