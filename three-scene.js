/* Pengu hero 3D scene — procedural low-poly penguin built from Three.js
   primitives (no external model files needed, so it always loads).
   Features: snow particles, floating code cubes, ice shards, drag-to-rotate,
   mouse parallax, click-the-penguin interaction. */
import * as THREE from "three";

const canvas = document.getElementById("scene");
const wrap = document.getElementById("scene-wrap");
if (!canvas || !wrap) throw new Error("scene canvas missing");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 2.2, 9);

const world = new THREE.Group();
scene.add(world);

/* ---------- lights ---------- */
scene.add(new THREE.AmbientLight(0xbfd9ff, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(4, 8, 6);
scene.add(key);
const rim = new THREE.PointLight(0x22d3ee, 30, 30);
rim.position.set(-5, 3, -3);
scene.add(rim);
const warm = new THREE.PointLight(0xffb347, 12, 20);
warm.position.set(3, 1, 4);
scene.add(warm);

/* ---------- materials ---------- */
const M = {
  black: new THREE.MeshStandardMaterial({ color: 0x16202b, roughness: 0.55, flatShading: true }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4fbff, roughness: 0.7, flatShading: true }),
  orange: new THREE.MeshStandardMaterial({ color: 0xff9f43, roughness: 0.5, flatShading: true }),
  ice: new THREE.MeshStandardMaterial({ color: 0x9be8ff, roughness: 0.25, metalness: 0.1, flatShading: true, transparent: true, opacity: 0.92 }),
  iceDark: new THREE.MeshStandardMaterial({ color: 0x3ec6e8, roughness: 0.35, flatShading: true }),
  glass: new THREE.MeshStandardMaterial({ color: 0x6ee7ff, roughness: 0.15, metalness: 0.35, flatShading: true, emissive: 0x0e4a5c, emissiveIntensity: 0.5 })
};

/* ---------- penguin ---------- */
const penguin = new THREE.Group();
world.add(penguin);

function ball(r, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  return m;
}

const body = ball(1.15, M.black, 0, 1.35, 0, 1, 1.25, 0.95);
penguin.add(body);
const belly = ball(0.92, M.white, 0, 1.15, 0.38, 0.82, 1.05, 0.62);
penguin.add(belly);
const head = ball(0.78, M.black, 0, 2.75, 0.08);
penguin.add(head);
const face = ball(0.62, M.white, 0, 2.62, 0.3, 0.95, 0.85, 0.6);
penguin.add(face);

/* beak — two cones */
const beakTop = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 12), M.orange);
beakTop.rotation.x = Math.PI / 2; beakTop.position.set(0, 2.62, 0.95);
const beakBot = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 12), M.orange);
beakBot.rotation.x = Math.PI / 2 + 0.35; beakBot.position.set(0, 2.48, 0.9);
penguin.add(beakTop, beakBot);

/* eyes */
const eyeGeo = new THREE.SphereGeometry(0.09, 12, 10);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.2 });
const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.24, 2.86, 0.72);
const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.24, 2.86, 0.72);
const glintGeo = new THREE.SphereGeometry(0.03, 8, 8);
const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const glintL = new THREE.Mesh(glintGeo, glintMat); glintL.position.set(-0.21, 2.9, 0.79);
const glintR = new THREE.Mesh(glintGeo, glintMat); glintR.position.set(0.27, 2.9, 0.79);
penguin.add(eyeL, eyeR, glintL, glintR);

/* flippers */
function flipper(side) {
  const g = new THREE.Group();
  const f = ball(0.32, M.black, 0, -0.55, 0, 0.55, 1.5, 0.35);
  g.add(f);
  g.position.set(side * 1.05, 1.9, 0);
  g.rotation.z = side * 0.5;
  return g;
}
const flipL = flipper(-1), flipR = flipper(1);
penguin.add(flipL, flipR);

/* feet */
const footGeo = new THREE.BoxGeometry(0.42, 0.14, 0.62);
const footL = new THREE.Mesh(footGeo, M.orange); footL.position.set(-0.42, 0.07, 0.25);
const footR = new THREE.Mesh(footGeo, M.orange); footR.position.set(0.42, 0.07, 0.25);
penguin.add(footL, footR);

/* scarf — torus + tail, Pengu teal */
const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.16, 10, 24), M.iceDark);
scarf.rotation.x = Math.PI / 2 - 0.25; scarf.position.set(0, 2.18, 0.05);
const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.08), M.iceDark);
scarfTail.position.set(0.45, 1.75, 0.55); scarfTail.rotation.z = 0.15;
penguin.add(scarf, scarfTail);

/* ---------- ice platform ---------- */
const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.9, 0.5, 7), M.ice);
platform.position.y = -0.25;
world.add(platform);
const platformTop = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.08, 7), M.white);
platformTop.position.y = 0.02;
world.add(platformTop);

/* ice shards around */
const shards = [];
for (let i = 0; i < 14; i++) {
  const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.18 + Math.random() * 0.35), Math.random() > 0.5 ? M.ice : M.iceDark);
  const a = Math.random() * Math.PI * 2, r = 3.4 + Math.random() * 2.6;
  s.position.set(Math.cos(a) * r, -0.6 + Math.random() * 1.6, Math.sin(a) * r);
  s.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  s.userData = { baseY: s.position.y, speed: 0.4 + Math.random() * 0.8, phase: Math.random() * 6.28 };
  shards.push(s); world.add(s);
}

/* ---------- floating code cubes ---------- */
function textTexture(ch) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(10,25,38,0.92)";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#6ee7ff"; ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 116, 116);
  ctx.fillStyle = "#a5f3fc";
  ctx.font = "bold 72px 'JetBrains Mono', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(ch, 64, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const glyphs = ["{", "}", ";", "<", ">", "/", "\\", "=", "+", "#", "λ", "π", "∑", "0", "1", "🐧"];
const cubes = [];
glyphs.forEach((ch, i) => {
  const mat = new THREE.MeshStandardMaterial({ map: textTexture(ch), roughness: 0.4, emissive: 0xffffff, emissiveMap: textTexture(ch), emissiveIntensity: 0.25 });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), mat);
  const a = (i / glyphs.length) * Math.PI * 2;
  const r = 3.6 + (i % 3) * 0.9;
  cube.position.set(Math.cos(a) * r, 0.8 + Math.random() * 3.4, Math.sin(a) * r - 0.5);
  cube.userData = { baseY: cube.position.y, speed: 0.5 + Math.random() * 0.9, phase: Math.random() * 6.28, spin: 0.3 + Math.random() * 0.7 };
  cubes.push(cube); world.add(cube);
});

/* ---------- snow ---------- */
const SNOW = 900;
const snowPos = new Float32Array(SNOW * 3);
const snowVel = new Float32Array(SNOW);
for (let i = 0; i < SNOW; i++) {
  snowPos[i * 3] = (Math.random() - 0.5) * 22;
  snowPos[i * 3 + 1] = Math.random() * 10;
  snowPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
  snowVel[i] = 0.4 + Math.random() * 1.1;
}
const snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xdff6ff, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false }));
scene.add(snow);

/* ---------- interaction ---------- */
let targetRotY = 0, targetRotX = 0.04, dragging = false, lastX = 0, lastY = 0;
let mouseX = 0, mouseY = 0, jumpT = -1;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

wrap.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; wrap.setPointerCapture(e.pointerId); });
wrap.addEventListener("pointermove", e => {
  const rect = wrap.getBoundingClientRect();
  mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  if (dragging) {
    targetRotY += (e.clientX - lastX) * 0.008;
    targetRotX = THREE.MathUtils.clamp(targetRotX + (e.clientY - lastY) * 0.005, -0.25, 0.45);
    lastX = e.clientX; lastY = e.clientY;
  }
});
wrap.addEventListener("pointerup", e => {
  dragging = false;
  /* click (not drag) on penguin -> jump + speech */
  const rect = wrap.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObject(penguin, true).length) {
    jumpT = 0;
    window.dispatchEvent(new CustomEvent("pengu:boop"));
  }
});
wrap.addEventListener("pointerleave", () => { dragging = false; mouseX = 0; mouseY = 0; });

/* ---------- resize ---------- */
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap);
resize();

/* ---------- animate ---------- */
const clock = new THREE.Clock();
let t = 0;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;

  /* penguin idle: bob + waddle */
  penguin.position.y = Math.abs(Math.sin(t * 1.6)) * 0.12;
  penguin.rotation.z = Math.sin(t * 1.6) * 0.05;
  penguin.rotation.y = Math.sin(t * 0.5) * 0.12;
  flipL.rotation.z = -0.5 + Math.sin(t * 2.2) * 0.18;
  flipR.rotation.z = 0.5 - Math.sin(t * 2.2) * 0.18;
  head.rotation.y = mouseX * 0.35;
  head.rotation.x = mouseY * 0.18;
  scarfTail.rotation.x = Math.sin(t * 3) * 0.15;

  /* jump */
  if (jumpT >= 0) {
    jumpT += dt * 1.6;
    if (jumpT >= 1) { jumpT = -1; penguin.position.y = 0; penguin.rotation.x = 0; }
    else {
      penguin.position.y += Math.sin(jumpT * Math.PI) * 1.1;
      penguin.rotation.x = -Math.sin(jumpT * Math.PI) * 0.35;
    }
  }

  /* world rotation: ease toward target + idle drift */
  world.rotation.y += ((targetRotY + Math.sin(t * 0.15) * 0.08) - world.rotation.y) * 0.06;
  world.rotation.x += (targetRotX - world.rotation.x) * 0.06;
  world.position.y = Math.sin(t * 0.6) * 0.08;

  /* shards + cubes float */
  shards.forEach(s => { s.position.y = s.userData.baseY + Math.sin(t * s.userData.speed + s.userData.phase) * 0.25; s.rotation.y += 0.005; });
  cubes.forEach(c => {
    c.position.y = c.userData.baseY + Math.sin(t * c.userData.speed + c.userData.phase) * 0.3;
    c.rotation.x += 0.004 * c.userData.spin; c.rotation.y += 0.006 * c.userData.spin;
  });

  /* snow fall */
  const pos = snowGeo.attributes.position.array;
  for (let i = 0; i < SNOW; i++) {
    pos[i * 3 + 1] -= snowVel[i] * dt;
    pos[i * 3] += Math.sin(t + i) * 0.0015;
    if (pos[i * 3 + 1] < -1) pos[i * 3 + 1] = 9;
  }
  snowGeo.attributes.position.needsUpdate = true;

  /* camera parallax */
  camera.position.x += (mouseX * 0.9 - camera.position.x) * 0.04;
  camera.position.y += (2.2 - mouseY * 0.5 - camera.position.y) * 0.04;
  camera.lookAt(0, 1.6, 0);

  renderer.render(scene, camera);
}
tick();
