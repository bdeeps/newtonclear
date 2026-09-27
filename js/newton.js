// Shared parts for NewtonClear: constants, chart boards, arrows that point anywhere, and simple
// models (cart, puck, people, a car, a motorcycle, a bicycle, a desk fan). Scenes are built in
// metres unless a chapter says otherwise: +x forward, +y up.
import { THREE, M, box, beam, sphere, torus, arrow, clamp } from './kit.js';

// ---------------------------------------------------------------- constants
export const G = 9.81;                 // m/s², standard gravity
export const G_MOON = 1.62;            // m/s², lunar surface gravity (NASA Moon fact sheet)
export const C = 299792458;            // m/s, speed of light (exact, SI definition)
export const RHO_AIR = 1.2;            // kg/m³, air at about 20 °C, sea level
export const RHO_W = 1000;             // kg/m³, water
export const KMH = 3.6;
export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;

export const fmt = (v, d = 1) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-IN') : v.toFixed(d));
export const sgn = (v, d = 1) => (v < -0.0005 ? '−' + fmt(-v, d) : fmt(Math.abs(v), d));

// ---------------------------------------------------------------- boards
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
// Axes with a grid. Returns X(x) and Y(y) for the plot area.
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '' }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function title(g, text, sub = '') {
  g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
// A polyline of [x, y] data points in chart coordinates.
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}

// On a phone-width stage: hide the minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Deterministic pseudo-random numbers so every run (and every video frame) looks the same.
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- arrows
// A kit arrow that can point any way: aim(from, dir, len). dir is a unit-ish [x, y, z].
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function force(color, r = 0.035, head = 0.2) {
  const a = arrow(color, 1, head, r);
  a.renderOrder = 10;
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.03) a.visible = false;
  };
  return a;
}

// ---------------------------------------------------------------- simple models
// A lab cart with four wheels. setLoad(n) stacks n brass 1 kg blocks on it.
export function makeCart(color = 0x3b82f6) {
  const g = new THREE.Group();
  const body = box(0.8, 0.14, 0.44, M.plastic(color, { roughness: 0.35 })); body.position.y = 0.2; g.add(body);
  const deck = box(0.74, 0.02, 0.38, M.matte(0x1d222b)); deck.position.y = 0.28; g.add(deck);
  const wheels = [];
  for (const x of [-0.28, 0.28]) for (const z of [-0.24, 0.24]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24), M.matte(0x1b1d22)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.075, z); w.castShadow = true; g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), M.metal(0xc9ced8)); hub.rotation.x = Math.PI / 2; hub.position.copy(w.position); g.add(hub);
    wheels.push(w);
  }
  const blocks = [];
  const brass = M.metal(0xc9a24a, { roughness: 0.35 });
  for (let i = 0; i < 10; i++) { const b = box(0.22, 0.07, 0.16, brass); b.position.set(-0.24 + (i % 3) * 0.24, 0.325 + Math.floor(i / 3) * 0.075, 0); b.visible = false; g.add(b); blocks.push(b); }
  g.setLoad = (n) => blocks.forEach((b, i) => { b.visible = i < n; });
  g.roll = (dx) => wheels.forEach((w) => { w.rotation.y -= dx / 0.075; });
  return g;
}

// A person standing with feet at the origin, facing +x. pose({ arm, lean, crouch, stride }).
export function makePerson({ shirt = 0x3b6fd8, pants = 0x2b3242, skin = 0xc68b64, hair = 0x1b1410, s = 1 } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const cloth = M.matte(shirt), jeans = M.matte(pants), sk = M.matte(skin);
  const hipY = 0.92 * s;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * s, 0.38 * s, 6, 14), cloth); torso.position.y = 0.3 * s; torso.scale.z = 1.25; torso.castShadow = true; body.add(torso);
  const head = sphere(0.11 * s, sk, 24); head.position.y = 0.74 * s; body.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.115 * s, 20, 10, 0, Math.PI * 2, 0, 1.3), M.matte(hair)); hairM.position.copy(head.position); hairM.rotation.z = 0.35; body.add(hairM);
  const limb = (len, r, mat) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 4, 10), mat); m.position.y = -len / 2; m.castShadow = true; p.add(m); return p; };
  const arms = [-1, 1].map((z) => { const a = limb(0.62 * s, 0.05 * s, cloth); a.position.set(0, 0.52 * s, z * 0.22 * s); body.add(a); const hand = sphere(0.05 * s, sk, 12); hand.position.y = -0.62 * s; a.add(hand); return a; });
  const legs = [-1, 1].map((z) => { const l = limb(0.88 * s, 0.065 * s, jeans); l.position.set(0, hipY, z * 0.1 * s); g.add(l); const shoe = box(0.22 * s, 0.07 * s, 0.1 * s, M.matte(0x1b1d22)); shoe.position.set(0.05 * s, -0.88 * s, 0); l.add(shoe); return l; });
  body.position.y = hipY;
  g.pose = ({ arm = 0, lean = 0, stride = 0 } = {}) => {
    arms.forEach((a) => { a.rotation.z = arm; });           // arm: 0 = down, π/2 = straight forward
    body.rotation.z = -lean;          // lean forward (+) or back (−) about the hips
    legs[0].rotation.z = stride; legs[1].rotation.z = -stride;
  };
  g.arms = arms; g.legs = legs; g.body = body;
  return g;
}

// A seated crash-test dummy, hips at the origin, facing +x. tilt(a) bends it forward at the hips.
export function makeDummy() {
  const g = new THREE.Group(), upper = new THREE.Group(); g.add(upper);
  const yel = M.plastic(0xf2c230, { roughness: 0.5 }), blk = M.matte(0x22252c);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.36, 6, 14), yel); torso.position.y = 0.33; torso.scale.z = 1.25; torso.castShadow = true; upper.add(torso);
  const head = sphere(0.11, yel, 24); head.position.y = 0.76; upper.add(head);
  for (const z of [-1, 1]) {
    const mark = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), blk); mark.position.set(0.02, 0.77, z * 0.105); mark.rotation.y = z > 0 ? 0 : Math.PI; upper.add(mark);
    const arm = new THREE.Group(); arm.position.set(0.02, 0.56, z * 0.22); arm.rotation.z = 1.0; upper.add(arm);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.48, 4, 10), yel); a.position.y = -0.27; a.castShadow = true; arm.add(a);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.36, 4, 10), yel); thigh.rotation.z = -Math.PI / 2; thigh.position.set(0.24, 0.02, z * 0.1); thigh.castShadow = true; g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.34, 4, 10), yel); shin.position.set(0.48, -0.2, z * 0.1); shin.rotation.z = -0.25; shin.castShadow = true; g.add(shin);
  }
  g.tilt = (a) => { upper.rotation.z = -a; };
  g.upper = upper;
  return g;
}

// A family hatchback, 4.2 m long, from an extruded side profile. body.paint lets a chapter fade it.
export function makeCar(color = 0xd8332f) {
  const g = new THREE.Group();
  const prof = [[-2.1, 0.3], [2.08, 0.3], [2.12, 0.62], [2.02, 0.82], [1.1, 0.96], [0.35, 1.42], [-1.35, 1.44], [-2.0, 1.05], [-2.12, 0.85]];
  const sh = new THREE.Shape(); prof.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
  const W = 1.72;
  const geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 4 });
  geo.translate(0, 0, -W / 2);
  const paint = M.plastic(color, { roughness: 0.3, metalness: 0.3, transparent: true, opacity: 1 });
  const shell = new THREE.Mesh(geo, paint); shell.castShadow = true; g.add(shell);
  const glass = M.plastic(0x0e1420, { roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const side = [[1.02, 1.0], [0.4, 1.36], [-1.28, 1.38], [-1.85, 1.04]];
  const gs = new THREE.Shape(); side.forEach(([x, y], i) => (i ? gs.lineTo(x, y) : gs.moveTo(x, y))); gs.closePath();
  for (const z of [-1, 1]) { const w = new THREE.Mesh(new THREE.ShapeGeometry(gs), glass); w.position.z = z * (W / 2 + 0.07); g.add(w); }
  const wind = box(0.02, 0.86, W - 0.12, glass); wind.rotation.z = 1.02; wind.position.set(0.725 + 0.035, 1.19 + 0.055, 0); g.add(wind);
  const rearW = box(0.02, 0.5, W - 0.2, glass); rearW.rotation.z = -0.99; rearW.position.set(-1.7 - 0.04, 1.26 + 0.03, 0); g.add(rearW);
  for (const z of [-1, 1]) { const arch = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 6, 20, Math.PI), M.matte(0x16181d)); for (const x of [-1.3, 1.32]) { const a2 = arch.clone(); a2.position.set(x, 0.32, z * (W / 2 + 0.06)); g.add(a2); } }
  const wheels = [];
  for (const x of [-1.3, 1.32]) for (const z of [-1, 1]) {
    const t = torus(0.24, 0.085, M.matte(0x16181d), 32); t.position.set(x, 0.32, z * (W / 2 - 0.05)); g.add(t);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 20), M.metal(0xb7bfcc)); rim.rotation.x = Math.PI / 2; t.add(rim); rim.position.z = 0;
    const spoke = box(0.36, 0.05, 0.13, M.metal(0x8c95a3)); t.add(spoke);
    wheels.push(t);
  }
  const lamp = box(0.04, 0.1, 0.34, M.glow(0xfff2c8)); for (const z of [-0.6, 0.6]) { const l = lamp.clone(); l.position.set(2.1, 0.74, z); g.add(l); }
  const tail = box(0.04, 0.12, 0.3, M.glow(0xff3b30)); for (const z of [-0.62, 0.62]) { const l = tail.clone(); l.position.set(-2.14, 0.92, z); g.add(l); }
  g.paint = paint; g.shell = shell; g.wheels = wheels; g.W = W;
  g.roll = (dx) => wheels.forEach((w) => { w.rotation.z -= dx / 0.33; });
  return g;
}

// A 150 cc commuter motorcycle (about 2 m long), wheels on the ground, facing +x, with its rider.
export function makeMoto(color = 0x2f6fd8) {
  const g = new THREE.Group();
  const paint = M.plastic(color, { roughness: 0.3, metalness: 0.25 }), frame = M.metal(0x2a2e37, { roughness: 0.45 }), steel = M.metal(0xc9ced8), black = M.matte(0x16181d);
  const wheels = [];
  for (const x of [-0.66, 0.66]) {
    const w = new THREE.Group(); w.position.set(x, 0.3, 0); g.add(w);
    w.add(torus(0.25, 0.05, black, 36));
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24, 1, true), steel); rim.rotation.x = Math.PI / 2; w.add(rim);
    for (let i = 0; i < 5; i++) { const sp = box(0.4, 0.03, 0.02, M.metal(0x8c95a3)); sp.rotation.z = (i / 5) * Math.PI; w.add(sp); }
    wheels.push(w);
  }
  g.add(beam([0.62, 0.3, 0], [0.42, 0.95, 0], 0.025, steel));                   // forks
  g.add(beam([0.42, 0.95, 0], [0.34, 1.05, 0], 0.03, frame));
  g.add(beam([-0.66, 0.3, 0], [-0.05, 0.42, 0], 0.025, frame));                   // swingarm
  g.add(beam([0.38, 0.9, 0], [-0.55, 0.78, 0], 0.03, frame));                      // backbone
  const bars = beam([0.3, 1.08, -0.36], [0.3, 1.08, 0.36], 0.015, steel); g.add(bars);
  const tank = sphere(0.22, paint, 24); tank.scale.set(1.25, 0.6, 0.8); tank.position.set(0.12, 0.88, 0); g.add(tank);
  const seat = box(0.62, 0.08, 0.26, M.matte(0x1b1d22)); seat.position.set(-0.36, 0.84, 0); g.add(seat);
  const tailP = box(0.4, 0.12, 0.2, paint); tailP.position.set(-0.72, 0.78, 0); tailP.rotation.z = 0.15; g.add(tailP);
  const eng = box(0.34, 0.3, 0.22, M.metal(0x8c95a3, { roughness: 0.4 })); eng.position.set(0.02, 0.48, 0); g.add(eng);
  const pipe = beam([0.05, 0.36, 0.14], [-0.8, 0.45, 0.16], 0.04, M.metal(0xd8dde6, { roughness: 0.2 })); g.add(pipe);
  const lamp = sphere(0.09, M.glow(0xfff2c8), 16); lamp.position.set(0.5, 0.98, 0); g.add(lamp);
  // Rider
  const r = new THREE.Group(); g.add(r);
  const jacket = M.matte(0x3a3f4b), jeans = M.matte(0x2b3242);
  const torso = beam([-0.38, 0.92, 0], [-0.18, 1.42, 0], 0.14, jacket, 16); torso.scale.z = 1.2; r.add(torso);
  const helmet = sphere(0.14, M.plastic(0xf2f4f7, { roughness: 0.2 }), 24); helmet.position.set(-0.12, 1.62, 0); r.add(helmet);
  for (const z of [-1, 1]) {
    r.add(beam([-0.36, 0.94, z * 0.12], [0.05, 0.78, z * 0.18], 0.065, jeans));
    r.add(beam([0.05, 0.78, z * 0.18], [-0.1, 0.4, z * 0.2], 0.055, jeans));
    r.add(beam([-0.2, 1.36, z * 0.2], [0.05, 1.18, z * 0.3], 0.05, jacket));
    r.add(beam([0.05, 1.18, z * 0.3], [0.28, 1.1, z * 0.33], 0.045, jacket));
  }
  g.wheels = wheels;
  g.roll = (dx) => wheels.forEach((w) => { w.rotation.z -= dx / 0.3; });
  return g;
}

// A road bicycle with its rider, facing +x.
export function makeBicycle(color = 0x5ce1a9) {
  const g = new THREE.Group();
  const paint = M.plastic(color, { roughness: 0.3 }), black = M.matte(0x16181d), steel = M.metal(0xc9ced8);
  const wheels = [];
  for (const x of [-0.5, 0.52]) {
    const w = new THREE.Group(); w.position.set(x, 0.34, 0); g.add(w);
    w.add(torus(0.33, 0.016, black, 40));
    for (let i = 0; i < 8; i++) { const sp = box(0.64, 0.006, 0.006, steel); sp.rotation.z = (i / 8) * Math.PI; w.add(sp); }
    wheels.push(w);
  }
  const P = { bb: [0, 0.3, 0], seat: [-0.14, 0.85, 0], head: [0.4, 0.82, 0], rear: [-0.5, 0.34, 0], front: [0.52, 0.34, 0] };
  for (const [a, b] of [[P.bb, P.seat], [P.seat, P.head], [P.bb, P.head], [P.bb, P.rear], [P.seat, P.rear], [P.head, P.front]]) g.add(beam(a, b, 0.018, paint));
  g.add(beam([0.4, 0.82, 0], [0.37, 0.98, 0], 0.016, steel)); g.add(beam([0.37, 0.98, -0.22], [0.37, 0.98, 0.22], 0.014, steel));
  const sad = box(0.24, 0.04, 0.1, black); sad.position.set(-0.16, 0.92, 0); g.add(sad);
  const r = new THREE.Group(); g.add(r);
  const shirt = M.matte(0xe0663a), shorts = M.matte(0x2b3242);
  const torso = beam([-0.16, 0.98, 0], [0.18, 1.4, 0], 0.13, shirt, 16); torso.scale.z = 1.2; r.add(torso);
  const head = sphere(0.12, M.plastic(0xf2f4f7, { roughness: 0.3 }), 20); head.position.set(0.28, 1.58, 0); r.add(head);
  for (const z of [-1, 1]) {
    r.add(beam([-0.14, 0.98, z * 0.1], [0.14, 0.72, z * 0.12], 0.06, shorts));
    r.add(beam([0.14, 0.72, z * 0.12], [0.02, 0.32, z * 0.12], 0.05, shorts));
    r.add(beam([0.14, 1.36, z * 0.18], [0.37, 1.0, z * 0.2], 0.045, shirt));
  }
  g.wheels = wheels;
  g.roll = (dx) => wheels.forEach((w) => { w.rotation.z -= dx / 0.34; });
  return g;
}

// A 400 mm desk fan facing +x, blades spinning about X. spin(dAngle).
export function makeDeskFan() {
  const g = new THREE.Group();
  const white = M.plastic(0xeef1f5, { roughness: 0.4 }), grey = M.plastic(0x9aa3b2), wire = M.metal(0xd8dde6, { roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.06, 32), white); base.position.y = 0.03; base.castShadow = true; g.add(base);
  g.add(beam([0, 0.05, 0], [0, 0.72, 0], 0.03, grey));
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.24, 24), white); motor.rotation.z = Math.PI / 2; motor.position.set(-0.08, 0.8, 0); g.add(motor);
  const rotor = new THREE.Group(); rotor.position.set(0.1, 0.8, 0); g.add(rotor);
  const hub = sphere(0.06, grey, 16); hub.scale.x = 0.6; rotor.add(hub);
  const bladeMat = M.plastic(0x7aa2ff, { transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), bladeMat); b.scale.set(1, 2.1, 1);
    const holder = new THREE.Group(); holder.rotation.x = (i / 3) * TAU; rotor.add(holder);
    b.position.y = 0.11; b.rotation.y = Math.PI / 2 - 0.35; holder.add(b);
  }
  for (const x of [0.02, 0.2]) { const ring = torus(0.21, 0.006, wire, 48); ring.rotation.y = Math.PI / 2; ring.position.set(x, 0.8, 0); g.add(ring); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.add(beam([0.02, 0.8 + 0.21 * Math.cos(a), 0.21 * Math.sin(a)], [0.2, 0.8 + 0.21 * Math.cos(a), 0.21 * Math.sin(a)], 0.004, wire, 6)); }
  g.spin = (da) => { rotor.rotation.x += da; };
  return g;
}

// Many small glowing dots with their own colours. place(i, x, y, z, s) then done().
export function dots(n, r, color = 0xffffff, seg = 8) {
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) mesh.setColorAt(i, col);
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}

// A flat strip with a 1 m ruler along its near edge, from x0 to x1.
export function ruler(x0, x1, z, y = 0.005, every = 1) {
  const g = new THREE.Group(), mat = M.glow(0xc8d2e4, { transparent: true, opacity: 0.55 });
  for (let x = x0, i = 0; x <= x1 + 1e-6; x += every, i++) { const t = box(0.02, 0.004, i % 5 === 0 ? 0.22 : 0.12, mat); t.castShadow = false; t.position.set(x, y, z); g.add(t); }
  return g;
}
export { clamp };
