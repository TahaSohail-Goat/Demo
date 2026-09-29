/* =========================================================
   Ivora — 3D molar → implant scroll film (Three.js)
   Reads scroll progress from window.__story.p (0..1), set by main.js.
   All geometry is procedural: no model files to host or license.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.getElementById('toothCanvas');
const root = document.documentElement;

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

if (!canvas || !hasWebGL()) {
  root.classList.add('no-webgl');
} else {
  init();
}

function init() {
  const isMobile = matchMedia('(max-width: 860px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.2, 9);

  // Lights: a warm key, cool rim and soft fill (on top of the env map)
  const key = new THREE.DirectionalLight(0xfff4ea, 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe3ff, 2.4); rim.position.set(-4, 2, -5); scene.add(rim);
  const gum = new THREE.PointLight(0xd64f67, 6, 8, 2); gum.position.set(-1.5, -2.2, 1.5); scene.add(gum);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  /* ---------- Materials ---------- */
  const enamel = new THREE.MeshPhysicalMaterial({
    color: 0xf6f3ec, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08,
    sheen: 0.6, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.4, ior: 1.6, specularIntensity: 0.8,
  });
  const cementum = new THREE.MeshPhysicalMaterial({
    color: 0xeadcc3, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3, transparent: true, opacity: 1,
  });
  const titanium = new THREE.MeshPhysicalMaterial({
    color: 0xbcc3c7, metalness: 1, roughness: 0.26, transparent: true, opacity: 0, clearcoat: 0.3,
  });
  const anodised = new THREE.MeshPhysicalMaterial({
    color: 0xd2b77a, metalness: 1, roughness: 0.22, transparent: true, opacity: 0,
  });

  /* ---------- Geometry helpers ---------- */
  const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function lathe(points, segs = 96) {
    const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.LatheGeometry(curve.getPoints(80), segs);
  }
  function weld(geo) {
    geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
    const g = mergeVertices(geo, 1e-4); g.computeVertexNormals(); return g;
  }

  /* Crown: lathe body, squared-off footprint, four cusps and a central fissure */
  let crownGeo = lathe([[0, -0.45], [0.5, -0.45], [0.6, -0.3], [0.68, -0.16], [0.82, 0.04], [0.93, 0.3], [0.95, 0.52], [0.88, 0.72], [0.74, 0.86], [0.5, 0.94], [0.25, 0.92], [0.0, 0.86]], isMobile ? 72 : 128);
  {
    const p = crownGeo.attributes.position; const v = new THREE.Vector3();
    const cusps = [[0.4, 0.34, 0.2], [-0.4, 0.34, 0.17], [0.42, -0.32, 0.18], [-0.38, -0.34, 0.16]];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const ang = Math.atan2(v.z, v.x);
      const sq = 1 + 0.07 * Math.cos(4 * ang);            // boxier molar footprint
      v.x *= 1.06 * sq; v.z *= 0.9 * sq;
      const w = smoothstep(0.45, 0.9, v.y);
      let h = 0;
      for (const [cx, cz, a] of cusps) h += a * Math.exp(-((v.x - cx) ** 2 + (v.z - cz) ** 2) / 0.07);
      h -= 0.09 * Math.exp(-(v.z * v.z) / 0.01) * smoothstep(0.7, 0.2, Math.abs(v.x)); // mesio-distal groove
      h -= 0.06 * Math.exp(-(v.x * v.x) / 0.008) * smoothstep(0.7, 0.2, Math.abs(v.z)); // bucco-lingual groove
      v.y += w * (h - 0.04);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    crownGeo = weld(crownGeo);
  }

  /* Roots: two tapered, slightly curved lathes, splayed apart */
  function rootGeo(side) {
    let g = lathe([[0, -2.05], [0.07, -2.0], [0.17, -1.7], [0.26, -1.1], [0.32, -0.5], [0.35, 0.05], [0.2, 0.15], [0, 0.15]], isMobile ? 40 : 64);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setX(i, p.getX(i) + side * 0.05 * y * y);
      p.setZ(i, p.getZ(i) * 0.78);
    }
    return weld(g);
  }

  /* Implant fixture: one lathe with real screw threads cut into it */
  function fixtureGeometry() {
    const pts = [new THREE.Vector2(0, -2.0)];
    const N = isMobile ? 260 : 420;
    for (let i = 0; i <= N; i++) {
      const y = THREE.MathUtils.lerp(-2.0, -0.25, i / N);
      let r;
      if (y < -1.86) r = 0.22 * Math.sqrt(Math.max(0, (y + 2.0) / 0.14));   // rounded apex
      else if (y < -0.46) r = THREE.MathUtils.lerp(0.22, 0.3, smoothstep(-1.86, -0.46, y));
      else r = 0.37;                                                         // polished collar
      pts.push(new THREE.Vector2(Math.max(r, 0.001), y));
    }
    pts.push(new THREE.Vector2(0, -0.25));
    let g = new THREE.LatheGeometry(pts, isMobile ? 64 : 110);
    const p = g.attributes.position; const pitch = 0.12, depth = 0.075;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (y < -1.84 || y > -0.5) continue;
      const a = Math.atan2(z, x) / (Math.PI * 2);
      let f = ((y + 2) / pitch - a) % 1; if (f < 0) f += 1;
      const tri = 1 - Math.abs(2 * f - 1);                                   // triangular thread profile
      const fade = smoothstep(-1.84, -1.7, y) * (1 - smoothstep(-0.62, -0.5, y));
      const k = 1 + (depth * Math.pow(tri, 1.6) * fade) / Math.max(0.05, Math.hypot(x, z));
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    return weld(g);
  }
  const fixtureGeo = fixtureGeometry();
  const abutGeo = lathe([[0, -0.62], [0.2, -0.62], [0.28, -0.5], [0.31, -0.3], [0.29, 0.1], [0.23, 0.36], [0.14, 0.46], [0, 0.48]], 64);

  /* ---------- Assemble ---------- */
  const tooth = new THREE.Group();
  const crown = new THREE.Mesh(crownGeo, enamel);
  const rootL = new THREE.Mesh(rootGeo(-1), cementum); rootL.position.set(-0.27, -0.1, 0); rootL.rotation.z = -0.15;
  const rootR = new THREE.Mesh(rootGeo(1), cementum);  rootR.position.set(0.27, -0.1, 0);  rootR.rotation.z = 0.15;
  const roots = new THREE.Group(); roots.add(rootL, rootR);

  const fixture = new THREE.Group();
  fixture.add(new THREE.Mesh(fixtureGeo, titanium));
  const abutment = new THREE.Mesh(abutGeo, anodised);

  tooth.add(roots, fixture, abutment, crown);
  tooth.position.y = 0.45;
  const stage = new THREE.Group(); stage.add(tooth); scene.add(stage);

  // Soft contact shadow
  const shCanvas = document.createElement('canvas'); shCanvas.width = shCanvas.height = 128;
  const sctx = shCanvas.getContext('2d');
  const grd = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(18,24,25,0.28)'); grd.addColorStop(1, 'rgba(18,24,25,0)');
  sctx.fillStyle = grd; sctx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCanvas), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.25; stage.add(shadow);

  // Label anchors (children of parts so they follow the explode)
  const mk = (x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); return o; };
  const anchors = {
    fdi: mk(0.75, 0.75, 0.2),
    crown: mk(0.85, 0.55, 0.2),
    abutment: mk(0.28, 0.05, 0.1),
    fixture: mk(0.36, -1.1, 0.1),
  };
  crown.add(anchors.fdi, anchors.crown); abutment.add(anchors.abutment); fixture.add(anchors.fixture);
  const labelEls = {};
  document.querySelectorAll('[data-anchor]').forEach((el) => { labelEls[el.dataset.anchor] = el; });

  /* ---------- Sizing ---------- */
  let W = 0, H = 0, layoutX = 0, isNarrow = false;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const narrow = W < 860;
    isNarrow = narrow;
    layoutX = narrow ? 0 : Math.min(2.0, 0.6 + (W / H) * 0.7);
    // On phones the model lives in the top ~40% of the screen, above the copy
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 9;
    stage.position.y = narrow ? visH * 0.24 : 0;
    stage.scale.setScalar(narrow ? Math.min(0.62, (visH * 0.34) / 3.2 * (W / H < 0.6 ? 1 : 1.2)) : 1);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- Pointer parallax ---------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => { pointer.tx = (e.clientX / innerWidth - 0.5); pointer.ty = (e.clientY / innerHeight - 0.5); }, { passive: true });

  /* ---------- Animation ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const story = (window.__story = window.__story || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0; // smoothed progress
  const v3 = new THREE.Vector3();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const t = timer.getElapsed(), dt = Math.min(timer.getDelta(), 0.1);
    sp += (story.p - sp) * (1 - Math.exp(-dt * 7));
    const p = sp;
    const pk = 1 - Math.exp(-dt * 3); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;

    // Phase weights
    const swap = smoothstep(0.34, 0.5, p);                                   // roots → implant
    const explode = smoothstep(0.55, 0.7, p) * (1 - smoothstep(0.84, 0.95, p));
    const finale = smoothstep(0.84, 1, p);

    // Placement: right of text on desktop, centred top on mobile
    stage.position.x = THREE.MathUtils.lerp(layoutX, layoutX * 0.92, finale);

    // Rotation: slow idle + scroll-driven turn + pointer tilt
    const idle = reduce ? 0 : t * 0.18;
    tooth.rotation.y = idle * (1 - smoothstep(0.1, 0.2, p)) + p * Math.PI * 2.25 + pointer.x * 0.35;
    tooth.rotation.x = 0.12 - 0.22 * explode + pointer.y * 0.2;
    tooth.rotation.z = -0.06 + Math.sin(t * 0.6) * (reduce ? 0 : 0.02);
    tooth.position.y = 0.45 - explode * 0.38 + (reduce ? 0 : Math.sin(t * 0.9) * 0.05);

    // Roots dissolve, implant appears
    cementum.opacity = 1 - swap;
    roots.visible = cementum.opacity > 0.01;
    roots.scale.set(1, 1 - swap * 0.15, 1);
    titanium.opacity = swap; anodised.opacity = swap;
    fixture.visible = abutment.visible = swap > 0.01;
    const s = 0.7 + 0.3 * swap; fixture.scale.set(s, s, s);
    fixture.rotation.y = -swap * Math.PI * 1.5;                             // "screws in"

    // Explode vertically
    crown.position.y = explode * 0.95;
    abutment.position.y = explode * 0.32;
    fixture.position.y = -explode * 0.38 + (1 - swap) * -0.25;
    shadow.material.opacity = 1 - explode * 0.5;

    // Camera dolly
    camera.position.z = 9 + explode * 0.7 + finale * 0.3;
    camera.position.y = 0.2 + explode * 0.1;
    camera.lookAt(stage.position.x * 0.35, 0, 0);

    renderer.render(scene, camera);

    // Project label anchors to screen
    for (const k in anchors) {
      const el = labelEls[k]; if (!el) continue;
      anchors[k].getWorldPosition(v3); v3.project(camera);
      const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const tw = el._tw || (el._tw = el.firstElementChild.offsetWidth);
      el.classList.toggle('flip', x + 34 + tw > W && x - 34 - tw > 0);
    }
  }
  frame();
  window.dispatchEvent(new Event('scene:ready'));
}
