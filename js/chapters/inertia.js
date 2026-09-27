// Chapter 2: inertia and impulse. Two everyday cases, both shown in slow motion.
// Seat belt: a car hits a rigid barrier at v. Its front crumples by about 0.6 m (a typical crush
// depth at 50–60 km/h), so the cabin stops with a constant deceleration v²/(2 × 0.6). A belted
// 78 kg Hybrid III dummy (the 50th-percentile adult male test dummy) moves about 0.3 m more on the
// stretching belt, so it stops over 0.9 m: average force F = m·v²/(2d). Unbelted, nothing slows the
// dummy (Newton's first law) until its chest reaches the steering wheel, 0.55 m ahead, at nearly the
// crash speed; it then stops in roughly 5 cm. These are round, illustrative figures, not a test.
// Piano hammer: the jack throws the hammer and lets go (escapement) about 2 mm before the string,
// so the hammer reaches the string in free flight. Masses and contact times are typical values
// from Askenfelt & Jansson, "From touch to string vibrations" (JASA 1990–91): about 11 g and 4 ms
// in the bass, 8 g and 2 ms at middle C, 5 g and under 1 ms in the treble. The hammer rebounds at
// roughly half its speed. Average force = Δp ÷ Δt; for a half-sine pulse the peak is π/2 times that.
import { THREE, M, box, beam, clamp, smooth } from '../kit.js';
import { G, KMH, board, panelBg, axes, title, line, force, makeCar, makeDummy, fitNarrow, fmt } from '../newton.js';

const BX = 3.0;                 // barrier face, m
const CRUSH = 0.6, STRETCH = 0.3, GAP = 0.55, DASH = 0.05, MD = 78;
const SLOW_CAR = 15;            // shown 15× slower
const SLOW_H = 100;             // hammer shown 100× slower
const HAMMERS = {
  bass: { name: 'bass', m: 0.011, dt: 0.004 },
  mid: { name: 'middle C', m: 0.008, dt: 0.002 },
  treble: { name: 'treble', m: 0.005, dt: 0.0008 },
};
const REB = 0.5;                // rebound speed ÷ strike speed (roughly)
const VIEWS = {
  belt: { pos: [1.6, 3.0, 7.9], target: [1.6, 1.75, 0] },
  hammer: { pos: [0.6, 3.5, 7.2], target: [0.6, 2.55, 0] },
};

// Crash physics, all in real seconds from the moment of impact.
export function crash(vKmh, belted) {
  const v = vKmh / KMH, aCar = (v * v) / (2 * CRUSH), tCar = v / aCar;
  if (belted) {
    const d = CRUSH + STRETCH, a = (v * v) / (2 * d);
    return { v, aCar, tCar, aD: a, tD: v / a, stopD: d, F: MD * a, hit: 0, vHit: 0 };
  }
  const tHit = Math.sqrt((2 * GAP) / aCar), vHit = aCar * tHit;        // relative speed at the wheel
  const a = (vHit * vHit) / (2 * DASH);
  return { v, aCar, tCar, aD: a, tD: tHit + vHit / a, stopD: GAP + DASH, F: MD * a, hit: tHit, vHit };
}
// Car and dummy positions (m, relative to the impact point) and speeds at real time t ≥ 0.
function crashAt(c, t, belted) {
  const tc = Math.min(t, c.tCar), xCar = c.v * tc - 0.5 * c.aCar * tc * tc, vCar = Math.max(0, c.v - c.aCar * t);
  let xD, vD;
  if (belted) { const td = Math.min(t, c.tD); xD = c.v * td - 0.5 * c.aD * td * td; vD = Math.max(0, c.v - c.aD * t); }
  else if (t < c.hit) { xD = c.v * t; vD = c.v; }
  else { const t2 = Math.min(t - c.hit, c.vHit / c.aD), vr = Math.max(0, c.vHit - c.aD * (t - c.hit)); xD = xCar + GAP + c.vHit * t2 - 0.5 * c.aD * t2 * t2; vD = vCar + vr; }
  return { xCar, vCar, xD, vD, rel: xD - xCar };
}

export default {
  id: 'inertia',
  short: 'Keep on going',
  title: 'Seat belts and piano hammers',
  subtitle: 'Moving things want to keep moving. Stopping them takes a force, and time.',
  view: VIEWS.belt,
  learn: `<p>When a car stops suddenly, <b>you don't</b>. Nothing has pushed on you yet, so by Newton's first law you carry on at the car's old speed. That's why passengers lurch forward when a bus brakes hard. See CarClear.</p>
    <p>In a crash at 50 km/h the car's front crumples by about 60 cm, so the cabin stops in under a tenth of a second. A <b>seat belt</b> catches you early and stretches a little, so you stop over about <b>90 cm</b>, together with the car.</p>
    <p>Without a belt you keep going at almost the full crash speed until you hit the steering wheel or windscreen, which stops you in a few centimetres. The same change of momentum squeezed into a much shorter time means a much bigger force: <b>F = Δp ÷ Δt</b>. Stopping in 5 cm instead of 90 cm takes more than <b>ten times</b> the force.</p>
    <p>A <b>piano hammer</b> uses inertia on purpose. The key's jack throws the hammer and then <b>lets go</b> about 2 mm before the string, so the hammer flies the last bit on its own and can bounce straight off. It touches the string for only a thousandth of a second or so, and the string pushes it back just as hard as it hits. See PianoClear.</p>
    <p class="tip"><b>Try it:</b> crash at 50 km/h with and without the belt and compare the forces. Then strike the piano softly and hard, and watch the hammer fly free.</p>`,
  terms: [
    { t: 'Inertia', d: 'The tendency of a moving body to keep moving, and a still body to stay still.' },
    { t: 'Impulse', d: 'Force × time. It equals the change in momentum, so a longer stop needs a smaller force.' },
    { t: 'Crumple zone', d: 'The front and back of a car, built to squash and make the stop last longer.' },
    { t: 'g-force', d: 'An acceleration counted in multiples of gravity, 9.81 m/s².' },
    { t: 'Escapement', d: 'In a piano, the jack slipping out from under the hammer just before it reaches the string.' },
  ],
  defaults: { focus: 'belt', kmh: 50, belt: true, hammer: 'mid', hv: 3 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'belt', label: 'Crash test' }, { v: 'hammer', label: 'Piano hammer' }] },
    { key: 'kmh', type: 'range', label: 'Crash speed', min: 20, max: 80, step: 1, ends: ['20 km/h', '80 km/h'], fmt: (v) => Math.round(v) + ' km/h' },
    { key: 'belt', type: 'toggle', label: 'Seat belt on', hint: 'The dummy is a 78 kg Hybrid III, the standard adult test dummy.' },
    { key: 'hammer', type: 'seg', label: 'Which hammer', options: [{ v: 'bass', label: 'Bass' }, { v: 'mid', label: 'Middle C' }, { v: 'treble', label: 'Treble' }] },
    { key: 'hv', type: 'range', label: 'How hard you play', min: 0.5, max: 6, step: 0.1, ends: ['softly', 'very loud'], fmt: (v) => `hammer at ${v.toFixed(1)} m/s` },
    { key: 'go', type: 'buttons', label: 'Run it again', items: [{ label: 'Crash', act: (s, inst) => { s.focus = 'belt'; inst.restart(); } }, { label: 'Play the note', act: (s, inst) => { s.focus = 'hammer'; inst.restart(); } }] },
  ],
  quiz: [
    { q: 'A bus brakes hard and standing passengers lurch forward. What pushed them forward?', options: ['A forward force from the brakes', 'Nothing: they simply kept moving while the bus slowed', 'The air in the bus', 'Gravity'], answer: 1, why: 'Newton’s first law. The brakes slow the bus; until the floor or a handrail pushes on the passengers, they carry on at the old speed.' },
    { q: 'Why does a seat belt that stretches a little reduce the force on you?', options: ['It makes you lighter', 'It spreads your stop over a longer time and distance, so F = Δp ÷ Δt is smaller', 'It stops the car sooner', 'It doesn’t'], answer: 1, why: 'You must lose the same momentum either way. Taking longer to do it needs a smaller force.' },
    { q: 'A piano hammer is let go by the jack just before it reaches the string. What carries it the rest of the way?', options: ['A spring', 'Its own inertia', 'Magnetism', 'Air pressure'], answer: 1, why: 'Once the jack lets go, no force pushes it forward: it flies on by inertia, which lets it bounce straight back off the string.' },
  ],
  reel: [
    { ms: 5600, caption: 'First law: in a 50 km/h crash the car stops, but the unbelted dummy keeps going.', set: { focus: 'belt', kmh: 50, belt: false }, act: (s, inst) => inst.restart(), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gBelt = new THREE.Group(), gHam = new THREE.Group(); root.add(gBelt, gHam);

    // ---------------------------------------------------------------- crash test
    const road = box(16, 0.04, 4, M.matte(0x2a2e37)); road.position.set(-2, 0.02, 0); gBelt.add(road);
    for (let x = -9; x < 3; x += 1.5) { const d = box(0.7, 0.005, 0.1, M.glow(0xcfd6e2, { transparent: true, opacity: 0.5 })); d.position.set(x, 0.045, 1.4); gBelt.add(d); }
    const wall = box(0.9, 1.6, 3.4, M.matte(0x8a9099)); wall.position.set(BX + 0.45, 0.8, 0); gBelt.add(wall);
    for (let i = 0; i < 6; i++) { const st = box(0.02, 0.28, 3.4, M.plastic(i % 2 ? 0x16181d : 0xf2c230)); st.position.set(BX - 0.005, 0.2 + i * 0.28, 0); gBelt.add(st); }
    const car = makeCar(0xd8332f); gBelt.add(car);
    car.paint.opacity = 0.32; car.paint.depthWrite = false;
    const seat = new THREE.Group(); gBelt.add(seat);
    const cushion = box(0.5, 0.12, 0.5, M.matte(0x2b3242)); cushion.position.set(0, -0.06, 0); seat.add(cushion);
    const back = box(0.12, 0.7, 0.5, M.matte(0x2b3242)); back.position.set(-0.28, 0.3, 0); back.rotation.z = 0.2; seat.add(back);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 32), M.matte(0x16181d)); wheel.rotation.y = Math.PI / 2; wheel.position.set(0.75, 0.55, 0); seat.add(wheel);
    const column = beam([1.0, 0.3, 0], [0.76, 0.55, 0], 0.03, M.matte(0x16181d)); seat.add(column);
    const dashB = box(0.35, 0.3, 1.5, M.matte(0x22252c)); dashB.position.set(1.05, 0.3, 0); seat.add(dashB);
    const dummy = makeDummy(); gBelt.add(dummy);
    const beltMat = M.plastic(0x9aa3b2, { roughness: 0.6 });
    const strap = beam([0, 0, 0], [0, 1, 0], 0.03, beltMat); gBelt.add(strap);
    const lap = box(0.06, 0.05, 0.5, beltMat); gBelt.add(lap);
    const vCarA = force(0x5ce1a9), vDumA = force(0xffb547); gBelt.add(vCarA, vDumA);
    const lCar = stage.label('', [0, 0, 0], gBelt), lDum = stage.label('', [0, 0, 0], gBelt, 'hot'), lSlow = stage.label(`shown ${SLOW_CAR}× slower`, [-0.8, 0.1, 2.0], gBelt);
    const trace = { car: [], dum: [] };
    const chB = board(gBelt, 2.8, 1.75, 640, 400, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Speed during the crash');
      const { X, Y } = axes(g, w, h, { y1: 62, xMax: 150, yMax: 80, xTicks: [0, 50, 100, 150], yTicks: [0, 40, 80], xFmt: (v) => v + ' ms', yFmt: (v) => v + ' km/h' });
      line(g, trace.car, X, Y, '#5ce1a9', 5); line(g, trace.dum, X, Y, '#ffb547', 5);
      g.font = 'bold 18px sans-serif'; g.fillStyle = '#5ce1a9'; g.fillText('car', w - 170, 34); g.fillStyle = '#ffb547'; g.fillText('dummy', w - 110, 34);
    }, [4.55, 2.75, -1.4]);
    chB.mesh.rotation.y = -0.2;

    // ---------------------------------------------------------------- piano hammer (1 unit = 5 cm)
    const PV = new THREE.Vector3(-1.4, 1.0, 0), R = 2.3, TH0 = -0.12, THS = 0.36, BLOW = 0.047;
    const cs = { t: -0.25, wait: 0 };
    const hs = { t: 0, th: TH0, w: 0, phase: 'rest', v: 3, tRel: 0, tHit: 0, tEnd: 0.04, ring: 0, wait: 0 };
    const frame = box(4.6, 0.12, 1.2, M.matte(0x3a2a1e)); frame.position.set(0.4, 0.06, 0); gHam.add(frame);
    const rail = box(0.2, 0.9, 1.0, M.matte(0x4a3524)); rail.position.set(PV.x, 0.55, 0); gHam.add(rail);
    const hamG = new THREE.Group(); hamG.position.copy(PV); gHam.add(hamG);
    hamG.add(beam([0, 0, 0], [R - 0.2, 0, 0], 0.045, M.matte(0xd9c7a2)));
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 16), M.metal(0xc9ced8)); pin.rotation.x = Math.PI / 2; hamG.add(pin);
    const wood = box(0.26, 0.5, 0.22, M.matte(0xc9a77a)); wood.position.set(R, 0.02, 0); hamG.add(wood);
    const felt = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.22, 6, 16), M.matte(0xf1ece0, { roughness: 0.95 })); felt.position.set(R, 0.33, 0); felt.scale.z = 0.6; hamG.add(felt);
    const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16), M.matte(0xe6dccb)); knuckle.rotation.x = Math.PI / 2; knuckle.position.set(0.55, -0.12, 0); hamG.add(knuckle);
    const key = box(3.4, 0.16, 0.5, M.plastic(0xf5f3ee, { roughness: 0.3 })); key.geometry.translate(0.1, 0, 0); gHam.add(key);
    key.position.set(0.6, 0.45, 0);
    const balance = box(0.14, 0.3, 0.6, M.matte(0x4a3524)); balance.position.set(0.6, 0.22, 0); gHam.add(balance);
    const jack = box(0.1, 0.26, 0.16, M.matte(0x8a6a4a)); gHam.add(jack);
    const sY = PV.y + R * Math.sin(THS) + 0.5 * Math.cos(THS) + 0.03, sX = PV.x + R * Math.cos(THS) - 0.5 * Math.sin(THS);
    const strings = [];
    for (const z of [-0.1, 0, 0.1]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.2, 8), M.metal(0xe4e8ee, { roughness: 0.2 })); st.rotation.z = Math.PI / 2; st.position.set(sX - 1.0, sY, z); gHam.add(st); strings.push(st); }
    const fHam = force(0xff7a59, 0.04, 0.2), fStr = force(0xffb547, 0.04, 0.2), vHam = force(0x5ce1a9); gHam.add(fHam, fStr, vHam);
    const lHam = stage.label('', [0, 0, 0], gHam, 'hot'), lJack = stage.label('', [0, 0, 0], gHam), lSlowH = stage.label(`shown ${SLOW_H}× slower`, [0.6, 0.1, 1.0], gHam);
    const traceH = [];
    const chH = board(gHam, 2.9, 2.0, 600, 414, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Hammer speed');
      const tMax = hs.tEnd * 1000 || 40, vM = 6;
      const { X, Y } = axes(g, w, h, { y1: 62, xMax: tMax, yMin: -3.5, yMax: vM, xTicks: [0, Math.round(tMax / 2), Math.round(tMax)], yTicks: [-3, 0, 3, 6], xFmt: (v) => v + ' ms', yFmt: (v) => v + ' m/s' });
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(tMax), Y(0)); g.stroke();
      line(g, traceH, X, Y, '#5ce1a9', 5);
      g.font = '16px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)';
      if (hs.tRel) g.fillText('jack lets go', X(hs.tRel * 1000) - 40, Y(hs.v) - 16);
      if (hs.tHit) g.fillText('bounces', X(hs.tHit * 1000) + 6, Y(-hs.v * REB) + 22);
    }, [3.75, 1.2, -0.8]);
    chH.mesh.rotation.y = -0.25;

    // ---------------------------------------------------------------- state
    let S = null, focus = '';
    const restart = () => {
      cs.t = -3.0 / Math.max(1, (S?.kmh ?? 50) / KMH); cs.wait = 0; trace.car.length = 0; trace.dum.length = 0;
      Object.assign(hs, { t: 0, th: TH0, w: 0, phase: 'drive', tRel: 0, tHit: 0, wait: 0 }); traceH.length = 0;
    };
    let kB = '', kH = '';

    return {
      restart,
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        fitNarrow(stage, [lSlow, lSlowH, lJack]);
        if (s.focus !== focus) { focus = s.focus; gBelt.visible = focus === 'belt'; gHam.visible = focus === 'hammer'; const v = VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); restart(); }

        if (focus === 'belt') {
          const c = crash(s.kmh, s.belt);
          if (cs.wait > 0) { cs.wait -= dt; if (cs.wait <= 0) restart(); }
          else { cs.t += dt / SLOW_CAR; if (cs.t > Math.max(c.tCar, c.tD) + 0.05) cs.wait = 2.2; }
          const t = cs.t;
          let xFront, rel, vCar, vD;
          if (t < 0) { xFront = BX + c.v * t; rel = 0; vCar = vD = c.v; }
          else { const p = crashAt(c, t, s.belt); xFront = BX; rel = p.rel; vCar = p.vCar; vD = p.vD; }
          const crushed = t < 0 ? 0 : Math.min(CRUSH, crashAt(c, t, s.belt).xCar);
          const rear = xFront - 4.2 + crushed;             // rear bumper keeps moving until the cabin stops
          const len = 4.2 - crushed;
          car.scale.x = len / 4.2; car.position.set(rear + len / 2, 0, 0);
          const cabin = rear + 2.1 + (t < 0 ? 0 : 0);      // cabin reference (undamaged middle)
          seat.position.set(cabin - 0.45, 0.62, 0.38);
          const lean = s.belt ? clamp(rel / STRETCH, 0, 1) * 0.55 : clamp(rel / GAP, 0, 1) * 0.35;
          dummy.position.set(cabin - 0.4 + (s.belt ? rel * 0.3 : Math.min(rel, GAP + DASH)), 0.68, 0.38);
          dummy.tilt(lean);
          strap.visible = lap.visible = s.belt;
          if (s.belt) {
            const a = new THREE.Vector3(cabin - 0.72, 1.28, 0.7), b = new THREE.Vector3(dummy.position.x + 0.1, 0.74, 0.14);
            strap.position.copy(a).add(b).multiplyScalar(0.5); strap.scale.y = a.distanceTo(b); strap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
            lap.position.set(dummy.position.x + 0.12, 0.74, 0.38);
          }
          vCarA.aim([rear + len / 2 - 0.3, 1.85, 0], [1, 0, 0], vCar * 0.1);
          vDumA.aim([dummy.position.x - 0.1, 1.55, 0.6], [1, 0, 0], vD * 0.1);
          lCar.position.set(rear + len / 2 - 0.9, 1.85, 0); lCar.element.innerHTML = `car <b>${Math.round(vCar * KMH)} km/h</b>`;
          lDum.position.set(dummy.position.x - 0.7, 1.55, 0.6); lDum.element.innerHTML = `dummy <b>${Math.round(vD * KMH)} km/h</b>`;
          if (t >= 0 && t < 0.16) { const ms = t * 1000; if (!trace.car.length || ms - trace.car[trace.car.length - 1][0] > 1.5) { trace.car.push([ms, vCar * KMH]); trace.dum.push([ms, vD * KMH]); } }
          const kk = `${trace.car.length}|${s.kmh}|${s.belt}`; if (kk !== kB) { kB = kk; chB.redraw(); }
        }

        if (focus === 'hammer') {
          const H = HAMMERS[s.hammer] || HAMMERS.mid, v = s.hv;
          hs.v = v;
          // Real geometry: the head travels BLOW = 47 mm to the string along an arc of radius R.
          const U = (THS - TH0) / BLOW;                     // radians per metre of head travel
          const REL = THS - 0.002 * U;                     // jack lets go 2 mm before the string
          const aDrive = (v * v) / (2 * (BLOW - 0.002));   // steady push that reaches v at let-off
          const tRel = v / aDrive, tFree = 0.002 / v, tHit = tRel + tFree;
          hs.tRel = tRel; hs.tHit = tHit; hs.tEnd = tHit + H.dt + 0.012;
          if (hs.wait > 0) { hs.wait -= dt; if (hs.wait <= 0) restart(); }
          else if (hs.phase !== 'rest') {
            hs.t += dt / SLOW_H;
            if (hs.t > hs.tEnd + 0.002) { hs.wait = 1.6; }
          }
          const t = hs.t;
          let x, vel, ph;
          if (hs.phase === 'rest') { x = 0; vel = 0; ph = 'rest'; }
          else if (t < tRel) { x = 0.5 * aDrive * t * t; vel = aDrive * t; ph = 'drive'; }
          else if (t < tHit) { x = BLOW - 0.002 + v * (t - tRel); vel = v; ph = 'free'; }
          else if (t < tHit + H.dt) { const k = (t - tHit) / H.dt; vel = v - (1 + REB) * v * (1 - Math.cos(Math.PI * k)) / 2; x = BLOW + 0.0015 * Math.sin(Math.PI * k) * v / 3; ph = 'contact'; }
          else { const tt = t - tHit - H.dt; vel = -REB * v + G * 0 * tt; x = Math.max(0.004, BLOW - REB * v * tt); ph = 'back'; }
          hs.th = TH0 + Math.min(x, BLOW + 0.003) * U;
          hamG.rotation.z = hs.th;
          if (ph !== 'rest' && (!traceH.length || t * 1000 - traceH[traceH.length - 1][0] > 0.15)) traceH.push([t * 1000, vel]);
          if (ph === 'contact' && hs.ring < 0.2) hs.ring = 1;
          hs.ring = Math.max(0, hs.ring - dt * 0.35);
          strings.forEach((st, i) => { st.position.y = sY + Math.sin(t * 2 * Math.PI * 262 * (1 + i * 0.002)) * 0.03 * hs.ring * Math.min(1, v / 3); });
          // Key and jack: the key tips about its balance point; the jack rides on it under the knuckle.
          const keyTip = ph === 'rest' ? 0 : Math.min(1, x / (BLOW - 0.002));
          key.rotation.z = -0.05 * keyTip;
          const kn = new THREE.Vector3(0.55, -0.12, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), hs.th).add(PV);
          const released = ph === 'free' || ph === 'contact' || ph === 'back';
          jack.position.set(kn.x - (released ? 0.16 : 0), kn.y - 0.23 - (released ? 0.04 : 0), 0); jack.rotation.z = released ? 0.3 : 0;
          const head = new THREE.Vector3(R, 0.5, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), hs.th).add(PV);
          const pk = (H.m * v * (1 + REB)) / H.dt * (Math.PI / 2);
          const fk = ph === 'contact' ? Math.sin(Math.PI * (t - tHit) / H.dt) : 0;
          fHam.aim([head.x + 0.35, head.y + 0.05, 0.3], [0, -1, 0], fk * 1.1);
          fStr.aim([sX + 0.35, sY - 0.02, 0.3], [0, 1, 0], fk * 1.1);
          vHam.aim([head.x - 0.45, head.y - 0.3, 0.3], [Math.cos(hs.th + Math.PI / 2) * Math.sign(vel || 1), Math.sin(hs.th + Math.PI / 2) * Math.sign(vel || 1), 0], Math.abs(vel) * 0.18);
          lHam.position.set(head.x - 1.3, head.y + 0.25, 0.4);
          lHam.element.innerHTML = { rest: 'ready', drive: 'pushed by the jack', free: '<b>flying free</b>: nothing pushes it', contact: `on the string: <b>${Math.round(pk)} N</b> peak`, back: 'bounced off' }[ph];
          lJack.position.set(jack.position.x - 0.5, jack.position.y - 0.1, 0.4); lJack.element.innerHTML = released ? 'jack has let go' : 'jack';
          const kk = `${traceH.length}|${s.hammer}|${s.hv}`; if (kk !== kH) { kH = kk; chH.redraw(); }
          if (hs.phase === 'rest') hs.phase = 'drive';
        }
      },
      readout: (s) => {
        if (s.focus === 'hammer') {
          const H = HAMMERS[s.hammer] || HAMMERS.mid, v = s.hv, p = H.m * v, dp = p * (1 + REB), F = dp / H.dt;
          return `<div class="big">About ${Math.round(F * Math.PI / 2)} N at the peak, for ${(H.dt * 1000).toFixed(1)} ms</div>
            <div class="row"><span>Hammer (${H.name})</span><b>${Math.round(H.m * 1000)} g at ${v.toFixed(1)} m/s</b></div>
            <div class="row"><span>Momentum, p = m × v</span><b>${(p * 1000).toFixed(1)} g·m/s</b></div>
            <div class="row"><span>Change, hitting and bouncing back</span><b>${(dp * 1000).toFixed(1)} g·m/s</b></div>
            <div class="row"><span>Average force, Δp ÷ Δt</span><b>${F.toFixed(0)} N</b></div>
            <small>The string pushes the hammer back exactly as hard as the hammer hits it.</small>`;
        }
        const c = crash(s.kmh, s.belt), cb = crash(s.kmh, true), cu = crash(s.kmh, false);
        const kN = (F) => (F / 1000).toFixed(F < 20000 ? 1 : 0);
        return `<div class="big">${s.belt ? `Belted: stops over ${Math.round(c.stopD * 100)} cm` : `No belt: hits the wheel at ${Math.round(c.vHit * KMH)} km/h`}</div>
          <div class="row"><span>Car stops over 60 cm, in</span><b>${Math.round(c.tCar * 1000)} ms</b></div>
          <div class="row"><span>Dummy's average force, F = m·v² ÷ 2d</span><b>${kN(c.F)} kN, ${Math.round(c.aD / G)} g</b></div>
          <div class="row"><span>${s.belt ? 'Without a belt it would be' : 'With a belt it would be'}</span><b>${s.belt ? kN(cu.F) : kN(cb.F)} kN</b></div>
          <small>${s.belt ? 'The belt lets the dummy slow down with the car.' : `The dummy kept going until it hit something: ${Math.round(cu.F / cb.F)} times the force of a belted stop.`} Rough, illustrative figures for a 78 kg dummy.</small>`;
      },
    };
  },
};
