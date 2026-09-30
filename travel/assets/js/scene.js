/* =========================================================
   Safarnama — dotted globe & flight-arc film (Three.js)
   Land dots come from a 1.5° land mask (Natural Earth 110m via world-atlas,
   public domain), packed below as base64. The globe turns to each
   destination while arcs draw from Lahore, Karachi and Islamabad.
   Scroll progress: window.__film.p (core.js).
   ========================================================= */
import * as THREE from 'three';

const LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPj/z////3EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/++f///wcAAPADgAEAAOADAAAAAAAAAAAAAAAg3N4f/v///wcAAB8AAAAAAAA4AAAAAAAAAAAAAAADAOAH/P///wcAAA4AAAAAAAAwAAAAAAAAAAAAAAC8cQwBAP///wcAAAAAAIAHAMD/DwDwAAAAAAAAAOAAAAAAAPz//wMAAAAAAGAAAPz/AQAAAAAAAAAAAOBdc/MDAPj//wEAAAAAABjAwP///z9gAAAAA4AAAED8A/P/AOD//wEAAAAAADjg/v///z//HwCAAPj/A0/8X4PwB/D//wAAAOA/AADh/v///////wM+A/7///8Pw56BB+D/DwAAAPz/Y+zf/f//////////N/D///////+Bf/D/AQAAAP7/x////v//////////GP7//////7/wJ+AfAH4AAD9++P//////////////AOD//////88GH8AfAAwAwJ////////////////9/APz//////wNxDIAPAAAA8M///////////////98/APzf/////wHwAwAGAAAA+M///////////////+ADAPAB+P///wHwMwAAAAAA8A//////////////ZBgAAIACgP///wPgfwAAAAAQAAf///////////8fAA4AACAAAP///z/gfwAAAAAwYMf///////////8PAB8AAAQAAP7////5/wMAAABoQOj///////////8DAA8AAAAAgPz////5/wcAAADs+P////////////9/AAcAAAAAAPj////7/wMAAADg+f////////////9/AAEAAAAAAPj/////zwAAAAAw/v////////////+/AAAAAAAAAPD/////Gw4AAACg//////////////8fAAAAAAAAAOD/////HxAAAADA//////////////8fAAAAAAAAAOD//////wAAAACA//9P/vj///////8PAAAAAAAAAOD/////EwAAAACA//wHfPz////////HAAAAAAAAAOD/////AQAAAAD8g/EH8Pj////////gAAAAAAAAAOD/////AAAAAAD8Aebn+fH//////z8AAAAAAAAAAOD///9/AAAAAAD8AGT8//H//////xpgAAAAAAAAAMD///8/AAAAAAD8AMT8//H/////fzggAAAAAAAAAID///8fAAAAAABwdAD8/////////zE4AAAAAAAAAID///8fAAAAAACwfwBD/////////zA/AAAAAAAAAAD+//8PAAAAAAD4fwAA/////////wAHAAAAAAAAAAD8//8DAAAAAAD8/2OA/////////4EAAAAAAAAAAADo//8DAAAAAAD8/+///////////wEAAAAAAAAAAADo/wkCAAAAAAD+//////z//////wEAAAAAAAAAAADYfwACAAAAAID///8///n//////wEAAAAAAAAAAACgfwAWAAAAAMD///9//+H//////wAAAAAAAAAAAAAgfwAAAAAAAMD///9//jPg////fwAAAAAAAAAAAAAAfgAAAAAAAOD//////H/A////PwEAAAAAAAAAAAAAfAAIAAAAAOD//////f/A/+f/BwAAAAAAAAAAAAAAfDBwAAAAAOD/////+X8A/sN/AAAAAAAAAAAAAAAA+DgAAwAAAOD/////+T8A/oB/AwAAAAAAAAAAAAAA4B8AAAAAAOD/////8x8AfoB/AAMAAAAAAAAAAAAAgPwAAAAAAOD/////8wcAPoD+AAEAAAAAAAAAAAAAAPgBAAAAAOD/////7wEAHAD+AQEAAAAAAAAAAAAAAMAAAAAAAOD/////PwAAHAD8AQQAAAAAAAAAAAAAAICAAgAAAMD/////HwMAGADgAAoAAAAAAAAAAAAAAADBfgAAAID//////wMAGABAAAAAAAAAAAAAAAAAAADy/wAAAID//////wEAIAAGAAwAAAAAAAAAAAAAAADw/wEAAAD//////wEAIAAIAAgAAAAAAAAAAAAAAADw/x8AAAD8+P///wAAAAAZYAAAAAAAAAAAAAAAAADg/z8AAAAAwP///wAAAAAbMAAAAAAAAAAAAAAAAADw/z8AAAAAwP//fwAAAAAWfAAAAAAAAAAAAAAAAAD4/38AAAAAwP//HwAAAAAcficAAAAAAAAAAAAAAAD8//8BAAAAwP//DwAAAAAYPiABAAAAAAAAAAAAAAD8//8DAAAAwP//BwAAAAA4vgEaAAAAAAAAAAAAAAD8//8/AAAAgP//BwAAAABwEBL+AAAAAAAAAAAAAAD8////AAAAAP//AwAAAABgAADwAQAAAAAAAAAAAAD8////AQAAAP//AwAAAADABADyAwEAAAAAAAAAAAD4////AQAAAP7/AwAAAAAAHADwBgQAAAAAAAAAAADw////AAAAAP7/BwAAAAAAAAQADAAAAAAAAAAAAADw//9/AAAAAP7/BwAAAAAAAAAAAAAAAAAAAAAAAADg//9/AAAAAP7/BwAAAAAAAICHAAAAAAAAAAAAAADg//8/AAAAAP//BwEAAAAAANDHAAAAAAAAAAAAAADA//8/AAAAAP//hwMAAAAAAPjHAQAAAAAAAAAAAAAA//8/AAAAAP//4QEAAAAAAPzfAQAAAAAAAAAAAAAA/v8/AAAAAP//4AEAAAAAAP7/AwAAAAAAAAAAAAAA/v8fAAAAAP5/wAAAAAAAgP//ByAAAAAAAAAAAAAA/v8fAAAAAP7/4AAAAAAA4P//D0AAAAAAAAAAAAAA/v8HAAAAAPz/4AAAAAAA8P//HwAAAAAAAAAAAAAA/v8AAAAAAPx/YAAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/38AAAAAAPgfAAAAAAAA4P//PwAAAAAAAAAAAAAA/z8AAAAAAPAPAAAAAAAA4P//PwAAAAAAAAAAAAAA/x8AAAAAAPAHAAAAAAAA4B/+PwAAAAAAAAAAAAAA/w8AAAAAAPABAAAAAAAA4Af0HwAAAAAAAAAAAAAA/wMAAAAAAAAAAAAAAAAAAADwDwAIAAAAAAAAAACA/wMAAAAAAAAAAAAAAAAAAADgDwAQAAAAAAAAAACA/wEAAAAAAAAAAAAAAAAAAADAAgBwAAAAAAAAAACAfwAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAACAHwAAAAAAAAAAAAAAAAAAAAAABgAQAAAAAAAAAACAHwAAAAAAAAAAAAAAAAAAAAAABgAMAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAIADAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAgwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAADwAAAR4Pv4HAAAAAAAAAAAAAAAACAAAAAAAAAAA4P8/4P//////BwAAAAAAAAAAAAAAPwAAAAAAAADg//8//P///////wMAAAAAAAAAAACAewAAAADI/v////8///////////8BAAAAAAAAABAAeAAAAID///////////////////8DAAAAAAAe4P//fwAAAMD//////////////////38AAADA////////BwAAAPz//////////////////x8AAEDz//////8/AAAA8P///////////////////x8AABj///////8PAIAH/////////////////////38AAADA//////8/gPAD4P///////////////////wcAAAD+////////P4Dx/////////////////////w8AAAD8//////////////////////////////////8A/wMA/v//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////';
const MW = 240, MH = 120;

const canvas = document.getElementById('globeCanvas');
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canvas || !hasGL) document.documentElement.classList.add('no-webgl'); else init();

function init() {
  const mobile = matchMedia('(max-width: 860px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const ss = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp, D2R = Math.PI / 180;
  const R = 2;
  const ll = (lat, lon, r = R) => { const phi = (90 - lat) * D2R, th = (lon + 180) * D2R; return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)); };

  const globe = new THREE.Group(); scene.add(globe);

  /* ---------- Ocean sphere with fresnel rim ---------- */
  const ocean = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uA: { value: new THREE.Color(0x0e2350) }, uB: { value: new THREE.Color(0x2c5bb0) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uA, uB; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - max(dot(vN, vV), 0.), 2.5); gl_FragColor = vec4(mix(uA, uB, f), 1.); }',
  }));
  globe.add(ocean);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 64, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(max(dot(vN, vV), 0.), 3.5); gl_FragColor = vec4(.35,.6,1., f * .9); }',
  }));
  scene.add(atmo);

  /* ---------- Land dots ---------- */
  const bin = atob(LAND); const bits = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bits[i] = bin.charCodeAt(i);
  const land = (i, j) => { const k = j * MW + i; return (bits[k >> 3] >> (k & 7)) & 1; };
  const dotPos = [], dotRnd = [];
  for (let j = 0; j < MH; j++) {
    const lat = 90 - (j + 0.5) * 180 / MH; const step = Math.max(1, Math.round(1 / Math.max(0.15, Math.cos(lat * D2R))));
    for (let i = 0; i < MW; i += step) {
      if (!land(i, j)) continue;
      const lon = -180 + (i + 0.5) * 360 / MW; const v = ll(lat, lon, R * 1.002);
      dotPos.push(v.x, v.y, v.z); dotRnd.push(Math.random());
    }
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dotPos, 3));
  dg.setAttribute('rnd', new THREE.Float32BufferAttribute(dotRnd, 1));
  const dotU = { uPR: { value: renderer.getPixelRatio() }, uSize: { value: mobile ? 11 : 13 }, uFocus: { value: ll(30, 70, 1).normalize() } };
  const dots = new THREE.Points(dg, new THREE.ShaderMaterial({
    uniforms: dotU, transparent: true, depthWrite: false,
    vertexShader: `attribute float rnd; uniform float uPR, uSize; uniform vec3 uFocus; varying float vA; varying float vHot;
      void main(){ vec3 n = normalize(position); vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
        vec3 vn = normalize(normalMatrix * n); float facing = dot(vn, normalize(-mv.xyz));
        vA = smoothstep(-.05, .35, facing); vHot = smoothstep(.985, 1., dot(n, uFocus));
        gl_PointSize = uSize * (.8 + .4 * rnd) * uPR / -mv.z * (1. + vHot * .25); }`,
    fragmentShader: `varying float vA; varying float vHot; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; vec3 c = mix(vec3(.56,.69,1.), vec3(1.,.55,.32), vHot); gl_FragColor = vec4(c, vA * (.75 + vHot * .25)); }`,
  }));
  globe.add(dots);

  /* ---------- Cities, markers, arcs ---------- */
  const CITIES = {
    LHE: [31.52, 74.4, 'Lahore', 1], KHI: [24.9, 67.1, 'Karachi', 1], ISB: [33.6, 73.1, 'Islamabad', 1],
    JED: [21.5, 39.2, 'Jeddah'], MED: [24.5, 39.6, 'Madinah'], GIL: [35.9, 74.3, 'Gilgit'], KDU: [35.3, 75.5, 'Skardu'],
    IST: [41.0, 28.9, 'Istanbul'], GYD: [40.4, 49.9, 'Baku'], DXB: [25.2, 55.3, 'Dubai'], KUL: [3.1, 101.7, 'Kuala Lumpur'],
  };
  const labelsEl = document.getElementById('cityLabels');
  const cityObjs = {};
  const hubMat = new THREE.MeshBasicMaterial({ color: 0xff6d2e }), destMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ringGeo = new THREE.RingGeometry(0.03, 0.038, 32);
  for (const [code, [lat, lon, name, hub]] of Object.entries(CITIES)) {
    const v = ll(lat, lon, R * 1.004);
    const m = new THREE.Mesh(new THREE.CircleGeometry(hub ? 0.028 : 0.022, 20), hub ? hubMat : destMat);
    m.position.copy(v); m.lookAt(v.clone().multiplyScalar(2)); globe.add(m);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: hub ? 0xff6d2e : 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.copy(v); ring.lookAt(v.clone().multiplyScalar(2)); globe.add(ring);
    const el = document.createElement('div'); el.className = 'city' + (hub ? ' hub' : ''); el.textContent = `${code} · ${name}`; labelsEl.appendChild(el);
    cityObjs[code] = { v, ring, el, hub: !!hub };
  }
  const ROUTES = [
    { a: 'KHI', b: 'JED', ch: 1 }, { a: 'LHE', b: 'JED', ch: 1 }, { a: 'ISB', b: 'MED', ch: 1 },
    { a: 'ISB', b: 'GIL', ch: 2 }, { a: 'ISB', b: 'KDU', ch: 2 },
    { a: 'LHE', b: 'IST', ch: 3 }, { a: 'ISB', b: 'GYD', ch: 3 },
    { a: 'KHI', b: 'DXB', ch: 4 }, { a: 'LHE', b: 'KUL', ch: 4 },
  ];
  const TUB = 120, RAD = 6;
  const arcMat = new THREE.MeshBasicMaterial({ color: 0xff8a50, transparent: true, opacity: 0.95, depthWrite: false });
  const planeGeo = new THREE.SphereGeometry(0.03, 12, 8);
  ROUTES.forEach((rt) => {
    const A = cityObjs[rt.a].v, B = cityObjs[rt.b].v;
    const dist = A.distanceTo(B);
    const mid = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(R * (1 + Math.max(0.06, dist * 0.22)));
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, TUB, dist < 0.2 ? 0.006 : 0.009, RAD, false), arcMat);
    const plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    globe.add(tube, plane);
    Object.assign(rt, { curve, tube, plane, draw: 0 });
  });

  /* ---------- Chapter views: [lat, lon, distance] ---------- */
  const VIEWS = [[26, 62, 7.4], [25, 52, 6.6], [33, 73, 5.6], [38, 50, 6.4], [20, 78, 7.0], [28, 66, 7.8]];
  const WIN = [[-1, 0.1], [0.13, 0.3], [0.31, 0.48], [0.49, 0.66], [0.67, 0.84], [0.86, 2]];
  function view(p) {
    const w = VIEWS.map((_, i) => { const [a, b] = WIN[i]; return i === 0 ? 1 - ss(p, 0.08, 0.16) : ss(p, a - 0.03, a + 0.06) * (1 - ss(p, b - 0.02, b + 0.07)); });
    const sum = w.reduce((s, x) => s + x, 0) || 1;
    return VIEWS.reduce((acc, v, i) => [acc[0] + v[0] * w[i] / sum, acc[1] + v[1] * w[i] / sum, acc[2] + v[2] * w[i] / sum], [0, 0, 0]);
  }
  const chapterAt = (p) => (p < 0.12 ? 0 : p < 0.305 ? 1 : p < 0.485 ? 2 : p < 0.665 ? 3 : p < 0.85 ? 4 : 5);

  /* ---------- Layout ---------- */
  let W = 0, H = 0, narrow = false;
  function resize() { W = canvas.clientWidth; H = canvas.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); narrow = W < 860; }
  resize(); addEventListener('resize', resize);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const film = (window.__film = window.__film || { p: 0 });
  const timer = new THREE.Timer();
  let sp = 0, visible = true, intro = reduce ? 1 : 0;
  const cur = { lat: 26, lon: 40, d: 9 };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const tmp = new THREE.Vector3(), camDir = new THREE.Vector3(), nrm = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed();
    sp += (film.p - sp) * (1 - Math.exp(-dt * 5));
    const pk = 1 - Math.exp(-dt * 2.5); pointer.x += (pointer.tx - pointer.x) * pk; pointer.y += (pointer.ty - pointer.y) * pk;
    const p = sp, amb = reduce ? 0 : 1;
    intro = Math.min(1, intro + dt / 2.2); const ie = 1 - Math.pow(1 - intro, 3);

    const [vlat, vlon, vd] = view(p);
    const k = 1 - Math.exp(-dt * 3.5);
    cur.lat += (vlat - cur.lat) * k; cur.lon += (vlon - cur.lon) * k; cur.d += ((vd + (narrow ? 2.6 : 0)) - cur.d) * k;
    const idleSpin = (1 - ss(p, 0.02, 0.1)) * Math.sin(t * 0.15) * 6 * amb;
    globe.rotation.set((cur.lat + pointer.y * 6) * D2R, (-90 - (cur.lon + idleSpin + pointer.x * 10 + (1 - ie) * 40)) * D2R, 0);
    camera.position.set(0, 0, cur.d + (1 - ie) * 3);
    camera.lookAt(0, 0, 0);
    camera.setViewOffset(W, H, narrow ? 0 : -W * 0.16, narrow ? H * 0.2 : 0, W, H);
    dotU.uFocus.value.copy(ll(vlat, vlon, 1)).normalize();

    // arcs draw for their chapter; all visible at the end
    const ch = chapterAt(p);
    ROUTES.forEach((rt, i) => {
      const on = rt.ch === ch || ch === 5 || (ch === 0 && false);
      rt.draw += ((on ? 1 : 0) - rt.draw) * (1 - Math.exp(-dt * (on ? 1.6 : 4)));
      const segs = Math.floor(rt.draw * TUB);
      rt.tube.geometry.setDrawRange(0, segs * RAD * 6); rt.tube.visible = segs > 0;
      const u = rt.draw > 0.98 ? ((t * 0.18 + i * 0.13) % 1) : rt.draw;
      rt.curve.getPointAt(Math.min(0.999, u), rt.plane.position); rt.plane.visible = rt.draw > 0.02;
    });

    // markers pulse; labels follow projected positions
    globe.updateMatrixWorld(); camera.updateMatrixWorld(); camera.getWorldDirection(camDir);
    const active = new Set(ch === 0 ? ['LHE', 'KHI', 'ISB'] : ROUTES.filter((r) => r.ch === ch || ch === 5).flatMap((r) => [r.a, r.b]));
    for (const [code, o] of Object.entries(cityObjs)) {
      const s = 1 + ((t * 0.8 + o.v.x) % 1) * 1.1 * amb; o.ring.scale.setScalar(s); o.ring.material.opacity = (1 - (s - 1) / 1.1) * (o.hub ? 0.7 : 0.45);
      tmp.copy(o.v).applyMatrix4(globe.matrixWorld); nrm.copy(tmp).normalize();
      const facing = -nrm.dot(camDir);
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
      o.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -150%)`;
      o.el.style.opacity = active.has(code) && facing > 0.25 && (!narrow || ch !== 2 || o.hub || code === 'GIL' || code === 'KDU') ? 1 : 0;
    }
    renderer.render(scene, camera);
  }
  frame();
}
