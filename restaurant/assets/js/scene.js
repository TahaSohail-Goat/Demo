/* =========================================================
   Verdell — 3D plating film (Three.js)
   plate spins in → saffron sauce swoosh draws → scallops drop →
   garnish falls → camera rises to a top-down "served" view.
   Scroll progress comes from window.__film.p (0..1), set by main.js.
   Everything is procedural: no models, no photos.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.getElementById('plateCanvas');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl');
else init();

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Warm pass-lamp from above, cool fill from the room
  const key = new THREE.SpotLight(0xffd8a8, 60, 30, Math.PI / 6, 0.6, 1.4);
  key.position.set(2, 9, 3); key.target.position.set(0, 0, 0);
  key.castShadow = !mobile; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; key.shadow.radius = 6;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xe0a79a, 0.7); fill.position.set(-5, 3, -2); scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  const ss = THREE.MathUtils.smoothstep;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const weld = (g) => { g.deleteAttribute('normal'); g.deleteAttribute('uv'); const m = mergeVertices(g, 1e-4); m.computeVertexNormals(); return m; };

  /* ---------- Plate: speckled stoneware with raw rim ---------- */
  const speck = document.createElement('canvas'); speck.width = speck.height = 512;
  const sx = speck.getContext('2d');
  sx.fillStyle = '#ece5d6'; sx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { sx.fillStyle = `rgba(${60 + Math.random() * 40},${50 + Math.random() * 30},${40},${Math.random() * 0.5})`; const r = Math.random() * 1.6 + 0.3; sx.beginPath(); sx.arc(Math.random() * 512, Math.random() * 512, r, 0, 7); sx.fill(); }
  const speckTex = new THREE.CanvasTexture(speck); speckTex.colorSpace = THREE.SRGBColorSpace; speckTex.wrapS = speckTex.wrapT = THREE.RepeatWrapping; speckTex.repeat.set(3, 1);

  // Lathe expects the outline; we trace underside → rim → top surface
  const plateOutline = [[0.001, -0.14], [1.35, -0.14], [1.4, -0.1], [1.95, -0.06], [2.4, 0.04], [2.66, 0.17], [2.71, 0.21], [2.66, 0.225], [2.4, 0.1], [1.9, 0.02], [1.4, 0.0], [0.001, 0.0]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  let plateGeo = new THREE.LatheGeometry(plateOutline, mobile ? 96 : 160);
  { // hand-thrown wobble on the rim
    const p = plateGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z), a = Math.atan2(z, x);
      const w = ss(r, 1.9, 2.7) * (0.018 * Math.sin(a * 3 + 1) + 0.01 * Math.sin(a * 7));
      p.setY(i, p.getY(i) + w);
    }
    plateGeo.computeVertexNormals();
  }
  const plateMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: speckTex, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.receiveShadow = true;

  /* ---------- Sauce swoosh: tapered, flattened tube with draw-on ---------- */
  const swooshCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.45, 0.02, 0.75), new THREE.Vector3(-0.8, 0.02, 1.05), new THREE.Vector3(0.1, 0.02, 0.95),
    new THREE.Vector3(0.9, 0.02, 0.45), new THREE.Vector3(1.3, 0.02, -0.25), new THREE.Vector3(1.05, 0.02, -0.95),
  ]);
  const TUB = 240, RAD = 16;
  const sauceGeo = new THREE.TubeGeometry(swooshCurve, TUB, 0.2, RAD, false);
  {
    const p = sauceGeo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= TUB; i++) {
      const u = i / TUB; swooshCurve.getPointAt(u, c);
      const taper = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.55) * (1 - 0.35 * u);
      for (let j = 0; j <= RAD; j++) {
        const k = i * (RAD + 1) + j; v.fromBufferAttribute(p, k).sub(c);
        v.x *= taper; v.z *= taper; v.y *= taper * 0.22;
        p.setXYZ(k, c.x + v.x, c.y + v.y + 0.02, c.z + v.z);
      }
    }
    sauceGeo.computeVertexNormals();
  }
  const sauceMat = new THREE.MeshPhysicalMaterial({ color: 0xe8a236, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.3 });
  const sauce = new THREE.Mesh(sauceGeo, sauceMat);
  const sauceIndexCount = sauceGeo.index.count;
  sauce.receiveShadow = true;

  // Parsley-oil dots along the swoosh
  const dots = [];
  const dotMat = new THREE.MeshPhysicalMaterial({ color: 0x3f6b24, roughness: 0.1, clearcoat: 1 });
  [0.12, 0.3, 0.52, 0.7, 0.86].forEach((u, i) => {
    const pos = swooshCurve.getPointAt(u); const off = new THREE.Vector3(i % 2 ? 0.28 : -0.26, 0, i % 2 ? -0.1 : 0.14);
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (i % 3) * 0.015, 20, 12), dotMat);
    d.scale.y = 0.35; d.position.copy(pos).add(off); d.position.y = 0.035; dots.push(d);
  });

  /* ---------- Scallops: seared tops via vertex colour ---------- */
  function scallopGeo() {
    const prof = [[0.001, 0], [0.4, 0], [0.45, 0.03], [0.47, 0.12], [0.46, 0.25], [0.42, 0.3], [0.3, 0.325], [0.001, 0.33]].map(([x, y]) => new THREE.Vector2(x, y));
    let g = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(40), 48);
    g = weld(g);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    const cream = new THREE.Color(0xf3e6d3), sear = new THREE.Color(0x9a5a22), deep = new THREE.Color(0x5e3312), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = 0.5 + 0.5 * Math.sin(x * 23 + z * 17) * Math.cos(z * 11 - x * 7);
      const t = ss(y, 0.22, 0.33);
      c.copy(cream).lerp(sear, t).lerp(deep, t * n * 0.6);
      // subtle fibre striping on the sides
      if (t < 0.5) c.offsetHSL(0, 0, 0.03 * Math.sin(Math.atan2(z, x) * 40));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  const scMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color(0xffe2c0) });
  const scGeo = scallopGeo();
  const scallopSpots = [[-0.62, 0.3], [0.42, 0.52], [-0.05, -0.55]];
  const scallops = scallopSpots.map(([x, z], i) => {
    const m = new THREE.Mesh(scGeo, scMat); m.castShadow = true; m.userData.home = new THREE.Vector3(x, 0.0, z); m.rotation.y = i * 1.3; return m;
  });

  /* ---------- Garnish: instanced pea shoots, viola petals, salt ---------- */
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.bezierCurveTo(0.06, 0.03, 0.08, 0.1, 0, 0.16); leafShape.bezierCurveTo(-0.08, 0.1, -0.06, 0.03, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 8); leafGeo.rotateX(-Math.PI / 2);
  const petalShape = new THREE.Shape(); petalShape.absarc(0, 0, 0.06, 0, Math.PI * 2);
  const petalGeo = new THREE.ShapeGeometry(petalShape, 16); petalGeo.rotateX(-Math.PI / 2);
  const saltGeo = new THREE.BoxGeometry(0.03, 0.006, 0.03);

  const N_LEAF = 34, N_PETAL = 10, N_SALT = mobile ? 40 : 70;
  const leafMesh = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x6e9e3a, roughness: 0.55, side: THREE.DoubleSide }), N_LEAF);
  const petalMesh = new THREE.InstancedMesh(petalGeo, new THREE.MeshStandardMaterial({ color: 0x7b4fb8, roughness: 0.5, side: THREE.DoubleSide }), N_PETAL);
  const saltMesh = new THREE.InstancedMesh(saltGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transmission: 0, clearcoat: 1 }), N_SALT);
  const petalCols = [0x7b4fb8, 0xe9c23f, 0x7b4fb8, 0xf2efe6, 0x6a3fa5];
  for (let i = 0; i < N_PETAL; i++) petalMesh.setColorAt(i, new THREE.Color(petalCols[i % petalCols.length]));

  function garnishTargets(n, onScallopRatio, spread) {
    const out = [];
    for (let i = 0; i < n; i++) {
      let x, y, z;
      if (Math.random() < onScallopRatio) {
        const s = scallopSpots[i % 3]; const r = Math.random() * 0.28, a = Math.random() * Math.PI * 2;
        x = s[0] + Math.cos(a) * r; z = s[1] + Math.sin(a) * r; y = 0.34 + Math.random() * 0.03;
      } else {
        const u = Math.random(); const p = swooshCurve.getPointAt(u);
        x = p.x + (Math.random() - 0.5) * spread; z = p.z + (Math.random() - 0.5) * spread; y = 0.05;
      }
      out.push({ to: new THREE.Vector3(x, y, z), from: new THREE.Vector3(x * 1.4 + (Math.random() - 0.5), 3 + Math.random() * 2.5, z * 1.4 + (Math.random() - 0.5)), rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 8, tilt: (Math.random() - 0.5) * 0.9, delay: Math.random() * 0.5, s: 0.7 + Math.random() * 0.6 });
    }
    return out;
  }
  const leafT = garnishTargets(N_LEAF, 0.75, 0.4), petalT = garnishTargets(N_PETAL, 0.6, 0.5), saltT = garnishTargets(N_SALT, 0.6, 0.6);
  const dummy = new THREE.Object3D();
  function placeGarnish(mesh, list, g) {
    list.forEach((it, i) => {
      const t = clamp01((g - it.delay * 0.6) / 0.5);
      const e = 1 - Math.pow(1 - t, 3);
      dummy.position.lerpVectors(it.from, it.to, e);
      dummy.rotation.set(it.tilt * e + (1 - e) * it.spin, it.rot + (1 - e) * it.spin, (1 - e) * it.spin * 0.5);
      dummy.scale.setScalar(it.s * (t > 0 ? 1 : 0.0001));
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------- Table surface & assembly ---------- */
  const dish = new THREE.Group();
  dish.add(plate, sauce, ...dots, ...scallops, leafMesh, petalMesh, saltMesh);
  const table = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.ShadowMaterial({ opacity: 0.45, color: 0x12050a }));
  table.rotation.x = -Math.PI / 2; table.position.y = -0.15; table.receiveShadow = true;
  const stage = new THREE.Group(); stage.add(dish, table); scene.add(stage);

  /* ---------- Ambient: rising steam + warm dust in the lamp light ---------- */
  function softSprite(r, g, b) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.4, `rgba(${r},${g},${b},.35)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const STEAM = mobile ? 18 : 28;
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(STEAM * 3), steamSeed = [];
  for (let i = 0; i < STEAM; i++) steamSeed.push({ x: (Math.random() - 0.5) * 1.6, z: (Math.random() - 0.5) * 1.2, off: Math.random(), sway: Math.random() * 6.28, sp: 0.18 + Math.random() * 0.12 });
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamMat = new THREE.PointsMaterial({ map: softSprite(255, 240, 225), size: mobile ? 1.8 : 2.6, sizeAttenuation: true, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending });
  const steam = new THREE.Points(steamGeo, steamMat);
  const MOTES = mobile ? 40 : 90;
  const moteGeo = new THREE.BufferGeometry(), motePos = new Float32Array(MOTES * 3), moteSeed = [];
  for (let i = 0; i < MOTES; i++) moteSeed.push({ x: (Math.random() - 0.5) * 8, y: Math.random() * 6, z: (Math.random() - 0.5) * 6, sp: 0.05 + Math.random() * 0.1, ph: Math.random() * 6.28 });
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ map: softSprite(230, 190, 120), size: 0.09, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  stage.add(steam, motes);

  /* ---------- Layout ---------- */
  let W = 0, H = 0, offX = 0, narrow = false;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    narrow = W < 860;
    // place the plate's centre at ~68% of the screen width on desktop
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 11 * camera.aspect;
    offX = narrow ? 0 : halfW * 0.4;
    stage.scale.setScalar(narrow ? 0.46 : Math.min(0.72, halfW * 0.17));
  }
  resize(); addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0, visible = true, intro = reduce ? 1 : 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const tag = document.getElementById('courseTag');
  const tags = ['An empty plate', 'The plate', 'Saffron beurre blanc', 'Scallops, seared', 'Pea shoots & viola', 'Scallop, saffron, pea'];
  let lastTag = -1;
  const camA = new THREE.Vector3(), camB = new THREE.Vector3(), look = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    sp += (film.p - sp) * (1 - Math.exp(-dt * 6));
    const pk = 1 - Math.exp(-dt * 3); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;
    const p = sp;

    // Phases (match chapter timings in main.js)
    const spinIn = ss(p, 0.1, 0.3);
    const sauceP = ss(p, 0.3, 0.46);
    const scP = clamp01((p - 0.48) / 0.18);
    const garnP = clamp01((p - 0.66) / 0.18);
    const served = ss(p, 0.84, 0.97);

    // Intro: the plate glides down and settles, even before anyone scrolls
    intro = Math.min(1, intro + dt / 1.8);
    const ie = 1 - Math.pow(1 - intro, 3);
    const amb = reduce ? 0 : 1;

    // Plate: idle turn, gentle float and tilt so it never looks frozen
    dish.rotation.y = (1 - ie) * -1.4 + t * 0.12 * amb + spinIn * Math.PI * 1.2 - served * 0.4;
    dish.rotation.x = (1 - ie) * 0.5 + Math.sin(t * 0.7) * 0.035 * amb * (1 - served);
    dish.rotation.z = Math.cos(t * 0.55) * 0.03 * amb * (1 - served);
    dish.position.y = (1 - ie) * 2.2 + Math.sin(t * 0.9) * 0.06 * amb * (1 - served);

    // Candle-like flicker on the pass lamp
    key.intensity = 60 * (0.92 + 0.08 * ie) * (1 + amb * (0.04 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 13.1)));

    // Steam rises off the plate; dust drifts through the light
    const sp_ = steamGeo.attributes.position;
    for (let i = 0; i < STEAM; i++) {
      const s0 = steamSeed[i]; const life = ((t * s0.sp * (amb || 0.3)) + s0.off) % 1;
      sp_.setXYZ(i, s0.x * (0.6 + life) + Math.sin(life * 4 + s0.sway) * 0.3, 0.25 + life * 2.0, s0.z + Math.cos(life * 3 + s0.sway) * 0.2);
    }
    sp_.needsUpdate = true;
    steamMat.opacity = 0.07 * ie * (0.6 + 0.4 * ss(p, 0.45, 0.7)) * (1 - served * 0.6);
    const mp = moteGeo.attributes.position;
    for (let i = 0; i < MOTES; i++) { const m = moteSeed[i]; mp.setXYZ(i, m.x + Math.sin(t * 0.3 + m.ph) * 0.3, ((m.y + t * m.sp * amb) % 6) - 0.5, m.z); }
    mp.needsUpdate = true;

    // Sauce draws along its length
    const segs = Math.floor(sauceP * TUB);
    sauce.geometry.setDrawRange(0, segs * RAD * 6);
    sauce.visible = segs > 0;
    dots.forEach((d, i) => { const k = clamp01((sauceP - 0.55 - i * 0.08) / 0.12); d.scale.set(k, k * 0.35, k); d.visible = k > 0.01; });

    // Scallops drop one by one with a soft bounce
    scallops.forEach((m, i) => {
      const k = clamp01((scP - i * 0.22) / 0.45);
      const bounce = k < 1 ? 1 - Math.abs(Math.cos(k * Math.PI * 1.5)) * (1 - k) : 1;
      m.position.set(m.userData.home.x, THREE.MathUtils.lerp(4, 0, 1 - (1 - k) * (1 - k)) + (k > 0.6 ? (1 - bounce) * 0.08 : 0), m.userData.home.z);
      m.visible = k > 0;
      m.rotation.x = (1 - k) * 0.8; m.rotation.z = (1 - k) * -0.5;
    });

    // Garnish falls
    placeGarnish(leafMesh, leafT, garnP * 1.25);
    placeGarnish(petalMesh, petalT, Math.max(0, garnP * 1.25 - 0.15));
    placeGarnish(saltMesh, saltT, Math.max(0, garnP * 1.25 - 0.3));
    leafMesh.visible = petalMesh.visible = saltMesh.visible = garnP > 0;

    // Camera: 3/4 view that tightens, then rises to top-down when served
    const dist = narrow ? 13 : 10.5;
    camA.set(0, 4.2 + (1 - spinIn) * 0.8, dist * 0.92 - scP * 1.2);
    camB.set(0, dist * (narrow ? 1.12 : 1.6), 0.4);
    camera.position.lerpVectors(camA, camB, served);
    const plateX = offX * (1 - 0.62 * served);
    // camera stays centred so the plate reads as a true circle from above
    camera.position.x += pointer.x * 0.6 * (1 - served);
    camera.position.y += pointer.y * -0.4;
    stage.position.x = plateX;
    // phones: keep the plate in the top ~40% of the screen, above the copy
    stage.position.y = 0;
    stage.position.z = narrow ? -2.4 * served : 0;
    look.set(0, narrow ? -1.7 * (1 - served) : 0, 0);
    camera.lookAt(look);

    const idx = p < 0.12 ? 0 : p < 0.3 ? 1 : p < 0.48 ? 2 : p < 0.66 ? 3 : p < 0.84 ? 4 : 5;
    if (idx !== lastTag && tag) { tag.textContent = tags[idx]; lastTag = idx; }

    renderer.render(scene, camera);
  }
  frame();
}
