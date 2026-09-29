/* =========================================================
   Morrow — bean-to-cup film (Three.js)
   roasted beans swirl → turn green (origin) → roast back through the
   colour curve → spiral into a glass as espresso → milk + latte art.
   Scroll progress comes from window.__film.p (0..1), set by main.js.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.getElementById('cupCanvas');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl');
else init();

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xfff1e0, 2.4); key.position.set(3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9e4ff, 1.4); rim.position.set(-5, 2, -4); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const ss = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  /* ---------- Coffee bean geometry (flat face + S-curve crease) ---------- */
  let beanGeo = new THREE.SphereGeometry(1, 40, 28);
  {
    const p = beanGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) * 0.62, y = p.getY(i) * 0.44, z = p.getZ(i) * 0.86;
      if (y > 0) {
        y *= 0.5;
        const cx = 0.07 * Math.sin(z * 3.2);
        const crease = Math.exp(-((x - cx) ** 2) / 0.005) * ss(Math.abs(z), 0.86, 0.45);
        y -= 0.2 * crease;
      }
      p.setXYZ(i, x, y, z);
    }
    beanGeo.deleteAttribute('normal'); beanGeo.deleteAttribute('uv');
    beanGeo = mergeVertices(beanGeo, 1e-4); beanGeo.computeVertexNormals();
    beanGeo.scale(0.17, 0.17, 0.17);
  }
  const ROAST = [new THREE.Color('#5f8a2e'), new THREE.Color('#c9b36a'), new THREE.Color('#b07a3f'), new THREE.Color('#6b3f22'), new THREE.Color('#3a2214')];
  const roastColor = (r, out) => { const f = clamp01(r) * (ROAST.length - 1); const i = Math.min(ROAST.length - 2, Math.floor(f)); return out.copy(ROAST[i]).lerp(ROAST[i + 1], f - i); };
  const beanMat = new THREE.MeshPhysicalMaterial({ color: 0x6b3f22, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.35 });

  const N = mobile ? 80 : 120;
  const beans = new THREE.InstancedMesh(beanGeo, beanMat, N);
  const B = [];
  for (let i = 0; i < N; i++) {
    B.push({
      a0: Math.random() * Math.PI * 2, r: 1.1 + Math.random() * 1.7, h: (Math.random() - 0.5) * 2.8, sp: 0.15 + Math.random() * 0.25,
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), spin: 0.4 + Math.random() * 1.2,
      delay: Math.random(), s: 0.8 + Math.random() * 0.5,
    });
  }

  /* ---------- Glass, liquid, crema/latte art, streams ---------- */
  const glassProfile = [[0.001, -1.0], [0.9, -1.0], [0.97, -0.94], [1.06, 0.92], [1.09, 1.0], [1.03, 1.0], [1.0, 0.9], [0.91, -0.86], [0.001, -0.86]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(glassProfile, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6 }));
  const radiusAt = (y) => lerp(0.91, 1.0, clamp01((y + 0.86) / 1.76));
  const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x2a150b, roughness: 0.25, clearcoat: 0.6 });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 64, 1, true), liquidMat);
  const bottomDisc = new THREE.Mesh(new THREE.CircleGeometry(0.905, 64), liquidMat); bottomDisc.rotation.x = -Math.PI / 2; bottomDisc.position.y = -0.859;

  // Latte-art texture (rosetta) drawn on a canvas
  function artTexture(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    const g = x.createRadialGradient(256, 256, 60, 256, 256, 256);
    if (kind === 'crema') { g.addColorStop(0, '#c98a4b'); g.addColorStop(0.7, '#a8632c'); g.addColorStop(1, '#6d3b17'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${90 + Math.random() * 60},${45 + Math.random() * 25},15,.35)`; x.beginPath(); x.arc(Math.random() * 512, Math.random() * 512, Math.random() * 3, 0, 7); x.fill(); }
    } else {
      g.addColorStop(0, '#b4773f'); g.addColorStop(0.75, '#9b5f2c'); g.addColorStop(1, '#6d3b17'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
      x.fillStyle = '#f6eee2';
      for (let i = 0; i < 8; i++) { // stacked rosetta leaves
        const y = 150 + i * 30, w = 150 - i * 14;
        x.beginPath(); x.ellipse(256, y, w, 22 - i, 0, Math.PI, 0); x.bezierCurveTo(256 + w, y + 30, 256 - w, y + 30, 256 - w, y); x.fill();
      }
      x.beginPath(); x.arc(256, 132, 34, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#a8632c'; x.lineWidth = 7; x.beginPath(); x.moveTo(256, 110); x.lineTo(256, 420); x.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const cremaMat = new THREE.MeshPhysicalMaterial({ map: artTexture('crema'), roughness: 0.35, clearcoat: 0.4, transparent: true });
  const artMat = new THREE.MeshPhysicalMaterial({ map: artTexture('art'), roughness: 0.4, clearcoat: 0.3, transparent: true, opacity: 0 });
  const topCrema = new THREE.Mesh(new THREE.CircleGeometry(1, 64), cremaMat); topCrema.rotation.x = -Math.PI / 2;
  const topArt = new THREE.Mesh(new THREE.CircleGeometry(1, 64), artMat); topArt.rotation.x = -Math.PI / 2; topArt.rotation.z = Math.PI / 2;
  const streamMat = new THREE.MeshPhysicalMaterial({ color: 0x3a1d0c, roughness: 0.2, clearcoat: 1, transparent: true });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1, true), streamMat);

  const cup = new THREE.Group();
  cup.add(liquid, bottomDisc, topCrema, topArt, stream, glass);
  const stage = new THREE.Group(); stage.add(beans, cup); scene.add(stage);

  // soft shadow under glass
  const shc = document.createElement('canvas'); shc.width = shc.height = 128; const sx = shc.getContext('2d');
  const sg = sx.createRadialGradient(64, 64, 0, 64, 64, 64); sg.addColorStop(0, 'rgba(34,21,13,.35)'); sg.addColorStop(1, 'rgba(34,21,13,0)'); sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.02; cup.add(shadow);

  /* ---------- Layout ---------- */
  let W = 0, H = 0, narrow = false, offX = 0;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    narrow = W < 860;
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10 * camera.aspect;
    offX = narrow ? 0 : halfW * 0.3;
    stage.scale.setScalar(narrow ? 0.62 : 1);
  }
  resize(); addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  /* ---------- Readout DOM ---------- */
  const rd = { stage: document.getElementById('rdStage'), temp: document.getElementById('rdTemp'), dose: document.getElementById('rdDose'), yld: document.getElementById('rdYield'), time: document.getElementById('rdTime'), bar: document.getElementById('rdBar') };
  const setText = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0, visible = true, orbitT = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    sp += (film.p - sp) * (1 - Math.exp(-dt * 6));
    const pk = 1 - Math.exp(-dt * 3); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;
    const p = sp;

    // Phase weights
    const toGreen = ss(p, 0.07, 0.17);
    const roast = ss(p, 0.32, 0.5);
    const into = clamp01((p - 0.5) / 0.14);     // beans spiral into the glass
    const shot = ss(p, 0.56, 0.7);               // espresso fill
    const milk = ss(p, 0.72, 0.86);              // milk fill + art
    const served = ss(p, 0.86, 0.98);

    // Roast value: roasted (0.8) → green (0) → roasted again (0.8)
    const r = 0.8 * (1 - toGreen) + 0.8 * roast * toGreen;
    beanMat.color.copy(roastColor(r, col));
    beanMat.clearcoat = 0.2 + r * 0.6;

    // Beans: orbiting cloud, faster in the drum, then spiral into the cup
    orbitT += dt * (reduce ? 0.2 : 1) * (1 + 3 * roast * (1 - into));
    for (let i = 0; i < N; i++) {
      const b = B[i];
      const a = b.a0 + orbitT * b.sp;
      const rr = b.r * (1 - 0.25 * roast * (1 - into));
      pos.set(Math.cos(a) * rr, b.h + Math.sin(a * 2 + i) * 0.15, Math.sin(a) * rr);
      const k = clamp01((into - b.delay * 0.5) / 0.5);
      if (k > 0) {
        const ang = a + k * 6, rad = lerp(rr, 0.15, k);
        pos.set(Math.cos(ang) * rad, lerp(b.h, 0.9 - k * 1.4, k), Math.sin(ang) * rad);
      }
      const s = b.s * (1 - ss(k, 0.55, 1));
      q.setFromAxisAngle(b.axis, t * b.spin * (reduce ? 0 : 1) + i);
      scl.setScalar(Math.max(s, 0.0001));
      m4.compose(pos, q, scl); beans.setMatrixAt(i, m4);
    }
    beans.instanceMatrix.needsUpdate = true;
    beans.visible = into < 0.999;

    // Glass appears as the beans fall in
    const glassIn = ss(p, 0.48, 0.58);
    cup.visible = glassIn > 0.001;
    cup.scale.setScalar(lerp(0.85, 1, glassIn));
    glass.material.opacity = 0.22 * glassIn;
    cup.position.y = lerp(-0.4, -0.1, glassIn);

    // Fill level: shot to 36% height, milk to 92%
    const level = -0.86 + 1.72 * (0.36 * shot + 0.56 * milk);
    const h = Math.max(0.001, level + 0.86);
    liquid.scale.set(radiusAt(level * 0.5 - 0.43), h, radiusAt(level * 0.5 - 0.43));
    liquid.position.y = -0.86 + h / 2;
    liquid.visible = bottomDisc.visible = shot > 0.01;
    liquidMat.color.set(0x2a150b).lerp(new THREE.Color(0xb88455), milk * 0.85);
    const topR = radiusAt(level) - 0.005;
    topCrema.position.y = topArt.position.y = level + 0.002;
    topCrema.scale.setScalar(topR); topArt.scale.setScalar(topR);
    topCrema.visible = shot > 0.05; cremaMat.opacity = 1 - ss(milk, 0.5, 0.9);
    artMat.opacity = ss(milk, 0.55, 0.95); topArt.visible = artMat.opacity > 0.01;
    topArt.position.y += 0.001;

    // Pour stream (espresso, then milk)
    const pouringShot = shot > 0.02 && shot < 0.98, pouringMilk = milk > 0.02 && milk < 0.96;
    stream.visible = pouringShot || pouringMilk;
    if (stream.visible) {
      const top = 3.2, len = top - level;
      const rad = pouringMilk ? 0.07 : 0.03 + 0.01 * Math.sin(t * 20);
      stream.scale.set(rad, len, rad); stream.position.set(pouringMilk ? 0.2 : 0, level + len / 2, 0);
      streamMat.color.set(pouringMilk ? 0xf4ece0 : 0x3a1d0c);
    }

    // Stage & camera
    cup.rotation.y = served * Math.PI * 0.5 + (reduce ? 0 : t * 0.1) * served;
    stage.position.x = offX * (1 - 0.4 * served);
    stage.position.y = narrow ? 1.2 : 0;
    const camY = lerp(0.9, 5.2, served), camZ = lerp(10, 6.4, served);
    camera.position.set(pointer.x * 0.8 * (1 - served), camY - pointer.y * 0.5, camZ);
    camera.lookAt(0, narrow ? 0.45 + served * 0.5 : served * 0.2, 0);
    stage.rotation.y = (1 - into) * pointer.x * 0.3;

    // Readout
    const temp = toGreen < 1 || roast === 0 ? (roast > 0 ? 20 + roast * 185 : null) : 20 + roast * 185;
    let stageName = 'Roasted Tuesday';
    if (p > 0.12) stageName = 'Green · Guji, 2,100 m';
    if (p > 0.3) stageName = roast > 0.82 ? 'First crack · 196 °C' : 'In the drum';
    if (p > 0.52) stageName = 'Extracting';
    if (p > 0.72) stageName = 'Steaming milk';
    if (p > 0.88) stageName = 'Ready · Flat white';
    setText(rd.stage, stageName);
    setText(rd.temp, p > 0.28 && p < 0.52 && temp !== null ? `${Math.round(temp)} °C` : p >= 0.52 ? '205 °C' : '—');
    setText(rd.yld, p > 0.54 ? `${(36 * shot).toFixed(1)} g` : '—');
    setText(rd.time, p > 0.54 ? `${Math.round(28 * shot)} s` : '—');
    if (rd.bar) rd.bar.style.left = `calc(${(r / 1) * 100}% - 2px)`;

    renderer.render(scene, camera);
  }
  frame();
}
