/* =========================================================
   Anbar — bottle & scent-pyramid film (Three.js)
   A faceted-cap glass bottle on a stone plinth. On scroll the cap lifts and
   three rings of particles rise out of the neck — top notes high and narrow,
   heart in the middle, base wide and low — forming the fragrance pyramid.
   Listens for window 'scent' events to re-tint liquid, glass and notes.
   Scroll progress: window.__film.p (core.js).
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('bottleCanvas');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl'); else init();

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = mobile ? 0.5 : 1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.9;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const key = new THREE.SpotLight(0xfff0e6, 40, 14, Math.PI / 6, 0.5, 1.2); key.position.set(2.5, 6, 3.5); key.target.position.set(0, 0.8, 0); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xd9a48f, 2.2); rim.position.set(-4, 3, -3); scene.add(rim);

  const ss = THREE.MathUtils.smoothstep, clamp01 = (x) => Math.min(1, Math.max(0, x));
  const SC = () => (window.__scents || [])[window.__scent || 0] || { color: '#c8741f', tiers: ['#e7b36a', '#b3542f', '#5b2a14'], name: 'Saffron Oud' };

  /* ---------- Plinth ---------- */
  const stoneTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#2b2230'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.05})`; x.lineWidth = Math.random() * 2; x.beginPath(); let px = Math.random() * 512, py = Math.random() * 512; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (Math.random() - 0.5) * 140; py += (Math.random() - 0.3) * 90; x.lineTo(px, py); } x.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.4, 0.5, 96), new THREE.MeshPhysicalMaterial({ map: stoneTex, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
  plinth.position.y = -0.25; scene.add(plinth);

  /* ---------- Bottle ---------- */
  const bottle = new THREE.Group();
  // Clear glass without transmission: predictable on every GPU, still reflective
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, ior: 1.52, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, envMapIntensity: 2.2, depthWrite: false, attenuationColor: new THREE.Color(0xffffff) });
  const glass = new THREE.Mesh(new RoundedBoxGeometry(1.25, 1.55, 0.72, 6, 0.14), glassMat);
  glass.position.y = 0.78; glass.renderOrder = 2; bottle.add(glass);
  const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0xc8741f, roughness: 0.18, clearcoat: 0.8, emissive: 0x3a1a05, emissiveIntensity: 0.5, sheen: 0.3 });
  const liquid = new THREE.Mesh(new RoundedBoxGeometry(1.06, 1.06, 0.54, 4, 0.1), liquidMat);
  liquid.position.y = 0.62; bottle.add(liquid);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd8b07a, metalness: 1, roughness: 0.22, clearcoat: 0.5 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.16, 48), gold); collar.position.y = 1.63; bottle.add(collar);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 12), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.6, roughness: 0.1, transparent: true, opacity: 0.6 })); tube.position.y = 0.88; bottle.add(tube);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.52, 8), new THREE.MeshPhysicalMaterial({ color: 0xd8b07a, metalness: 1, roughness: 0.18, flatShading: true, clearcoat: 0.6 }));
  cap.position.y = 1.97; bottle.add(cap);
  // label
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 512; labelCanvas.height = 280;
  const labelTex = new THREE.CanvasTexture(labelCanvas); labelTex.colorSpace = THREE.SRGBColorSpace; labelTex.anisotropy = 8;
  function drawLabel(name) {
    const x = labelCanvas.getContext('2d');
    x.fillStyle = '#f4eee6'; x.fillRect(0, 0, 512, 280);
    x.strokeStyle = '#b8977a'; x.lineWidth = 3; x.strokeRect(14, 14, 484, 252);
    x.fillStyle = '#17111a'; x.textAlign = 'center';
    x.font = '400 58px Marcellus, Georgia, serif'; x.fillText('A N B A R', 256, 110);
    x.font = '500 26px Jost, sans-serif'; x.fillText(name.toUpperCase().split('').join(' '), 256, 170);
    x.font = '400 18px Jost, sans-serif'; x.fillStyle = '#6f6268'; x.fillText('EAU DE PARFUM  ·  100 ML  ·  20%', 256, 222);
    labelTex.needsUpdate = true;
  }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.4), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.7 }));
  label.position.set(0, 0.7, 0.362); bottle.add(label);
  scene.add(bottle);

  /* ---------- Scent pyramid particles ---------- */
  const PER = mobile ? 380 : 700;
  const RINGS = [{ y: 2.75, r: 1.05 }, { y: 1.55, r: 1.65 }, { y: 0.35, r: 2.25 }];
  const pos = [], ring = [], seed = [];
  RINGS.forEach((R, ri) => { for (let i = 0; i < PER; i++) { pos.push(0, 0, 0); ring.push(ri); seed.push(Math.random()); } });
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  pg.setAttribute('ring', new THREE.Float32BufferAttribute(ring, 1));
  pg.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 1));
  const U = {
    uTime: { value: 0 }, uShow: { value: new THREE.Vector3() }, uPR: { value: renderer.getPixelRatio() },
    uC0: { value: new THREE.Color() }, uC1: { value: new THREE.Color() }, uC2: { value: new THREE.Color() },
    uRY: { value: new THREE.Vector3(RINGS[0].y, RINGS[1].y, RINGS[2].y) }, uRR: { value: new THREE.Vector3(RINGS[0].r, RINGS[1].r, RINGS[2].r) },
  };
  const pts = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float ring; attribute float seed; uniform float uTime, uPR; uniform vec3 uShow, uRY, uRR, uC0, uC1, uC2; varying vec3 vC; varying float vA;
      void main(){
        int ri = int(ring + .5);
        float show = ri == 0 ? uShow.x : (ri == 1 ? uShow.y : uShow.z);
        float ry = ri == 0 ? uRY.x : (ri == 1 ? uRY.y : uRY.z);
        float rr = ri == 0 ? uRR.x : (ri == 1 ? uRR.y : uRR.z);
        vec3 col = ri == 0 ? uC0 : (ri == 1 ? uC1 : uC2);
        float k = clamp(show * 1.4 - seed * .4, 0., 1.);
        float e = 1. - pow(1. - k, 3.);
        float ang = seed * 6.2831 * 7. + uTime * (.15 + seed * .12) * (ri == 0 ? 1. : (ri == 1 ? -.8 : .6));
        float r = rr * (.78 + .44 * fract(seed * 13.7));
        vec3 ringP = vec3(cos(ang) * r, ry + sin(uTime * .9 + seed * 20.) * .09 + (fract(seed * 7.3) - .5) * .35, sin(ang) * r);
        vec3 neck = vec3(0., 1.95, 0.);
        vec3 p = mix(neck, ringP, e);
        p.y += sin(e * 3.1416) * .5;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (34. + 46. * fract(seed * 3.1)) * uPR / -mv.z;
        vC = col; vA = e * (.75 + .25 * sin(uTime * 2. + seed * 30.));
      }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vC * (1.2 + a), a * vA); }`,
  }));
  scene.add(pts);

  /* ---------- Scent colours (lerped) ---------- */
  const target = { liquid: new THREE.Color(), c0: new THREE.Color(), c1: new THREE.Color(), c2: new THREE.Color() };
  function applyScent(immediate) {
    const s = SC();
    target.liquid.set(s.color); target.c0.set(s.tiers[0]); target.c1.set(s.tiers[1]); target.c2.set(s.tiers[2]);
    drawLabel(s.name);
    if (immediate) { liquidMat.color.copy(target.liquid); U.uC0.value.copy(target.c0); U.uC1.value.copy(target.c1); U.uC2.value.copy(target.c2); }
  }
  applyScent(true);
  document.fonts?.ready.then(() => drawLabel(SC().name));
  addEventListener('scent', () => applyScent(false));

  /* ---------- Layout ---------- */
  let W = 0, H = 0, narrow = false;
  function resize() { W = canvas.clientWidth; H = canvas.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); narrow = W < 860; }
  resize(); addEventListener('resize', resize);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0, visible = true, intro = reduce ? 1 : 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    sp += (film.p - sp) * (1 - Math.exp(-dt * 6));
    const pk = 1 - Math.exp(-dt * 3); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;
    const p = sp, amb = reduce ? 0 : 1;
    intro = Math.min(1, intro + dt / 1.8); const ie = 1 - Math.pow(1 - intro, 3);

    // colour lerp
    const ck = 1 - Math.exp(-dt * 4);
    liquidMat.color.lerp(target.liquid, ck); liquidMat.emissive.copy(liquidMat.color).multiplyScalar(0.25);
    
    U.uC0.value.lerp(target.c0, ck); U.uC1.value.lerp(target.c1, ck); U.uC2.value.lerp(target.c2, ck);

    // cap lifts, notes rise ring by ring
    const capUp = ss(p, 0.1, 0.2) * (1 - ss(p, 0.9, 1));
    cap.position.y = 1.97 + capUp * 0.8; cap.rotation.y = capUp * Math.PI * 1.5 + t * 0.2 * capUp * amb;
    cap.position.x = capUp * 0.75; cap.rotation.z = -capUp * 0.35;
    U.uShow.value.set(ss(p, 0.12, 0.26), ss(p, 0.33, 0.47), ss(p, 0.53, 0.67));
    const settle = ss(p, 0.9, 1);
    U.uShow.value.multiplyScalar(1 - settle * 0.6);
    U.uTime.value = t * (reduce ? 0.15 : 1);

    // bottle idle + turn with scroll
    bottle.rotation.y = -0.45 + p * Math.PI * 1.1 + (reduce ? 0 : Math.sin(t * 0.4) * 0.12) + pointer.x * 0.3;
    bottle.position.y = (1 - ie) * 1.2 + Math.sin(t * 0.8) * 0.025 * amb;
    plinth.rotation.y = bottle.rotation.y * 0.3;

    // camera: pulls back as the pyramid grows so all three rings fit
    const grow = ss(p, 0.1, 0.7);
    const dist = (narrow ? 13 : 7.2) + grow * (narrow ? 3.5 : 3.2) - ss(p, 0.74, 0.86) * 2.2 + ss(p, 0.9, 1) * 1.2;
    const camY = 1.6 + grow * 1.1 - pointer.y * 0.3;
    camera.position.set(Math.sin(0.25 + pointer.x * 0.15) * dist, camY, Math.cos(0.25) * dist);
    camera.lookAt(0, 1.0 + grow * 0.5, 0);
    camera.setViewOffset(W, H, narrow ? 0 : -W * 0.15, narrow ? H * 0.25 : 0, W, H);

    renderer.render(scene, camera);
  }
  frame();
}
