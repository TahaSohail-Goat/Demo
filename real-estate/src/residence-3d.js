/*
 * Linea Residences: a procedurally modelled six-level building rendered with Three.js.
 * Scroll progress orbits the camera and separates the floors; the active level group
 * glows warm. Loaded on demand by main.js and bundled separately (see README).
 */
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const W = 22;
const D = 14;
const SLAB = 0.45;
// Level heights, bottom to top. Groups map to the four items in the page's level list.
const LEVELS = [
  { h: 4.4, group: 0, lobby: true },
  { h: 3.5, group: 1, balcony: -1, planters: true },
  { h: 3.5, group: 1, balcony: 1, planters: true },
  { h: 3.5, group: 2, balcony: -1 },
  { h: 3.5, group: 2, balcony: 1 },
  { h: 3.8, group: 3, penthouse: true }
];

const smoothstep = (edge0, edge1, x) => {
  const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function box(w, h, d, material, { cast = true, receive = true } = {}) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

// Deterministic pseudo-random so the landscaping is identical on every load.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createResidence(canvas, { reduceMotion = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const camera = new PerspectiveCamera(30, 1, 1, 500);

  // Lighting: warm low sun, cool sky fill.
  scene.add(new HemisphereLight(0xfff1dc, 0x2a241e, 0.85));
  const sun = new DirectionalLight(0xffdcb2, 2.7);
  sun.position.set(-30, 44, 32);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  // Wide enough to hold the long shadow of the fully separated floors.
  Object.assign(sun.shadow.camera, { left: -52, right: 52, top: 58, bottom: -52, near: 1, far: 180 });
  sun.shadow.radius = 3;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const rim = new DirectionalLight(0x9db5cc, 0.7);
  rim.position.set(34, 22, -30);
  scene.add(rim);

  // Materials.
  const concrete = new MeshStandardMaterial({ color: 0xf1ece3, roughness: 0.8 });
  const plinthStone = new MeshStandardMaterial({ color: 0xb4a894, roughness: 0.9 });
  const ground = new ShadowMaterial({ opacity: 0.38 });
  const bronze = new MeshStandardMaterial({ color: 0x9a7048, roughness: 0.4, metalness: 0.6 });
  const wood = new MeshStandardMaterial({ color: 0xa8784c, roughness: 0.7 });
  const foliage = new MeshStandardMaterial({ color: 0x74845c, roughness: 0.95, flatShading: true });
  const trunk = new MeshStandardMaterial({ color: 0x5a4636, roughness: 1 });
  const water = new MeshPhysicalMaterial({ color: 0x4fa6b8, roughness: 0.08, metalness: 0.1, emissive: 0x1d5563, emissiveIntensity: 0.35, clearcoat: 1 });
  const railGlass = new MeshPhysicalMaterial({ color: 0xb8ccd6, roughness: 0.05, transparent: true, opacity: 0.35, envMapIntensity: 1.5 });

  const building = new Group();
  scene.add(building);

  // Site: a shadow-only ground (the page gradient shows through), stone plinth, hedge and trees.
  const shadowCatcher = new Mesh(new PlaneGeometry(260, 260), ground);
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -1.2;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);
  const plinth = box(34, 1.2, 25, plinthStone, { cast: false });
  plinth.position.y = -0.6;
  scene.add(plinth);
  const pool = box(8, 0.1, 2.4, water, { cast: false });
  pool.position.set(-9, 0.02, 10.8);
  scene.add(pool);

  const random = seeded(7);
  const treeGeometry = new IcosahedronGeometry(1.7, 0);
  const trunkGeometry = new CylinderGeometry(0.14, 0.2, 2.4, 6);
  const treeSpots = [[-15, -9], [-15.5, 1], [-15.2, 8.5], [14.5, 10.5], [15.5, -1], [14, -10], [3, 11.3], [-3, -11], [7, -11.2]];
  treeSpots.forEach(([x, z]) => {
    const tree = new Group();
    const stem = new Mesh(trunkGeometry, trunk);
    stem.position.y = 1.2;
    stem.castShadow = true;
    const crown = new Mesh(treeGeometry, foliage);
    const s = 0.8 + random() * 0.7;
    crown.scale.set(s, s * (1.1 + random() * 0.4), s);
    crown.position.y = 2.4 + s;
    crown.rotation.y = random() * Math.PI;
    crown.castShadow = true;
    tree.add(stem, crown);
    tree.position.set(x, 0, z);
    scene.add(tree);
  });
  const hedge = box(8, 1, 1.1, foliage);
  hedge.position.set(-9, 0.5, -11.6);
  scene.add(hedge);

  // Levels.
  const levels = [];
  let baseY = 0;
  LEVELS.forEach((spec, index) => {
    const level = new Group();
    const w = spec.penthouse ? 15 : W;
    const d = spec.penthouse ? 10.5 : D;
    const offsetX = spec.penthouse ? -2.5 : 0;
    const innerH = spec.h - SLAB;

    const glass = new MeshPhysicalMaterial({ color: 0x7f98a6, roughness: 0.06, metalness: 0.05, transparent: true, opacity: 0.38, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.05 });
    // Dark interiors with a warm lamp-lit glow read as dusk and let the active floors stand out.
    const interior = new MeshStandardMaterial({ color: 0x1c1713, emissive: 0xffbd70, emissiveIntensity: spec.lobby ? 0.3 : 0.1, roughness: 1 });

    const slab = box(W + 0.6, SLAB, D + 0.6, concrete);
    slab.position.y = SLAB / 2;
    level.add(slab);

    const core = box(w - 1.4, innerH - 0.4, d - 1.4, interior, { cast: false });
    core.position.set(offsetX, SLAB + innerH / 2, 0);
    const skin = box(w - 0.5, innerH, d - 0.5, glass, { cast: false });
    skin.position.copy(core.position);
    level.add(core, skin);

    // Bronze mullions on the long façades.
    for (let x = -w / 2 + 1.4; x <= w / 2 - 1.2; x += 2.2) {
      [d / 2 - 0.22, -d / 2 + 0.22].forEach(z => {
        const fin = box(0.09, innerH, 0.16, bronze, { receive: false });
        fin.position.set(offsetX + x, SLAB + innerH / 2, z);
        level.add(fin);
      });
    }
    // Vertical blades on the east end.
    for (let z = -d / 2 + 1; z <= d / 2 - 1; z += 1.25) {
      const blade = box(0.9, innerH, 0.1, bronze, { receive: false });
      blade.position.set(offsetX + w / 2 + 0.2, SLAB + innerH / 2, z);
      level.add(blade);
    }

    if (spec.balcony) {
      const bw = W * 0.6;
      const bx = spec.balcony * W * 0.2;
      const deck = box(bw, 0.32, 2.8, concrete);
      deck.position.set(bx, 0.16, D / 2 + 1.7);
      const soffit = box(bw - 0.3, 0.05, 2.5, wood, { cast: false });
      soffit.position.set(bx, -0.03, D / 2 + 1.7);
      const rail = box(bw, 1.05, 0.06, railGlass, { cast: false });
      rail.position.set(bx, 0.85, D / 2 + 3.05);
      level.add(deck, soffit, rail);
      if (spec.planters) {
        const planter = box(bw - 1, 0.7, 0.6, foliage);
        planter.position.set(bx, 0.67, D / 2 + 2.6);
        level.add(planter);
      }
    }

    if (spec.penthouse) {
      const roof = box(w + 0.8, SLAB, d + 0.8, concrete);
      roof.position.set(offsetX, spec.h + SLAB / 2, 0);
      // The penthouse is set back to the west; its pool and pergola occupy the east terrace.
      const terraceX = offsetX + w / 2 + 0.6;
      const roofPool = box(4.6, 0.28, 6.2, water, { cast: false });
      roofPool.position.set(terraceX + 2.9, SLAB + 0.14, 2.3);
      const pergolaTop = new Group();
      for (let i = 0; i < 8; i += 1) {
        const beam = box(5.2, 0.18, 0.14, bronze);
        beam.position.set(terraceX + 2.9, SLAB + 3, -D / 2 + 1.2 + i * 0.6);
        pergolaTop.add(beam);
      }
      [[terraceX + 0.5, -D / 2 + 1], [terraceX + 5.3, -D / 2 + 1], [terraceX + 0.5, -D / 2 + 5.4], [terraceX + 5.3, -D / 2 + 5.4]].forEach(([x, z]) => {
        const post = box(0.16, 3, 0.16, bronze);
        post.position.set(x, SLAB + 1.5, z);
        pergolaTop.add(post);
      });
      const parapet = box(W + 0.6, 1, 0.08, railGlass, { cast: false });
      parapet.position.set(0, SLAB + 0.5, D / 2 + 0.26);
      level.add(roof, roofPool, pergolaTop, parapet);
    }

    level.position.y = baseY;
    building.add(level);
    levels.push({ group: level, baseY, index, spec, glass, interior, glow: 0 });
    baseY += spec.h;
  });

  const topY = baseY;
  const baseGlass = new Color(0x7f98a6);
  const warmGlass = new Color(0xe0b384);

  // State.
  let width = 1;
  let height = 1;
  let target = reduceMotion ? 0.5 : 0;
  let progress = target;
  let activeGroup = -1;
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
  let running = false;
  let rafId = 0;
  const lookTarget = new Vector3();

  const resize = () => {
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // On wide screens shift the model right so it sits beside the copy.
    if (width >= 1024) camera.setViewOffset(width, height, -width * 0.2, -height * 0.02, width, height);
    // Below the headline and above the level list on phones and tablets.
    else camera.setViewOffset(width, height, 0, -height * 0.1, width, height);
    camera.updateProjectionMatrix();
    if (!running) render();
  };

  const update = () => {
    progress += (target - progress) * (reduceMotion ? 1 : 0.075);
    pointer.cx += (pointer.x - pointer.cx) * 0.05;
    pointer.cy += (pointer.y - pointer.cy) * 0.05;

    // Portrait screens have a narrow horizontal field of view and little vertical room between
    // the copy blocks, so the camera backs off further and the floors separate less.
    const aspect = width / height;
    const portrait = aspect < 0.8;
    const explode = smoothstep(0.14, 0.34, progress) * (1 - smoothstep(0.86, 0.98, progress));
    levels.forEach(level => {
      level.group.position.y = level.baseY + explode * level.index * (portrait ? 1.9 : 2.9);
      const wantGlow = level.spec.group === activeGroup ? 1 : 0;
      level.glow += (wantGlow - level.glow) * 0.08;
      level.glass.color.lerpColors(baseGlass, warmGlass, level.glow * 0.8);
      level.glass.opacity = 0.38 + level.glow * 0.2;
      level.interior.emissiveIntensity = (level.spec.lobby ? 0.3 : 0.1) + level.glow * 1.4;
    });

    let distance = 94;
    if (portrait) distance = aspect < 0.6 ? 205 : 172;
    else if (aspect < 1.3) distance = 120;
    const theta = MathUtils.lerp(-0.85, 0.6, progress) + pointer.cx * 0.12;
    const radius = distance + explode * distance * 0.2;
    const elevation = MathUtils.lerp(22, 30, progress) + pointer.cy * 3;
    const centerY = topY * 0.42 + explode * 7;
    camera.position.set(Math.sin(theta) * radius, centerY + elevation, Math.cos(theta) * radius);
    lookTarget.set(0, centerY, 0);
    camera.lookAt(lookTarget);
  };

  const render = () => {
    update();
    renderer.render(scene, camera);
  };

  const loop = () => {
    render();
    rafId = running ? requestAnimationFrame(loop) : 0;
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  return {
    setProgress(value) {
      target = reduceMotion ? 0.5 : MathUtils.clamp(value, 0, 1);
      if (!running) render();
    },
    setActive(group) {
      activeGroup = group;
      if (!running) render();
    },
    setPointer(x, y) {
      if (reduceMotion) return;
      pointer.x = x;
      pointer.y = y;
    },
    start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
    },
    dispose() {
      this.stop();
      observer.disconnect();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    }
  };
}
