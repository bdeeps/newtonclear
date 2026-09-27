// Chapter 3: F = ma on the road. A drag race and a corner.
// Race: dv/dt = (F_drive − ½ρ·CdA·v² − Crr·m·g) ÷ m, with F_drive = min(F_max, P_wheel ÷ v).
//   Car: 1,300 kg with its driver, 110 kW peak (a 2.0 L family car, as in CarClear), front-wheel
//   drive with 60% of its weight on the front tyres and μ = 0.9, so F_max ≈ 6.9 kN; CdA 0.66 m²,
//   Crr 0.012. Motorcycle: a Pulsar 150-like commuter (145 kg + 70 kg rider = 215 kg, 10.3 kW,
//   13.25 N·m through 3.47 × 2.92 × 2.8 gearing to a 0.306 m tyre, as in MotorcycleClear), so
//   F_max ≈ 1.1 kN; CdA 0.6, Crr 0.015. Bicycle: 85 kg rider and bike sprinting at 800 W, pushing
//   at most about 300 N at the tyre; CdA 0.45, Crr 0.005.
//   Gear changes and the engine working below its peak mean the average power at the wheels is
//   lower than the peak: P_wheel = 0.9 (drivetrain) × 0.72 (average share of peak) × P_peak.
//   With these the car does 0–100 km/h in about 9 s and the motorcycle 0–60 in about 6 s, close to
//   road tests of such vehicles.
// Corner: steady turn of radius r at speed v. The road must push the tyres towards the centre with
//   F = m·v²/r; the vehicle leans so gravity and the road's push line up: tan θ = v²/(g·r); the
//   grip needed is μ = v²/(g·r). Dry asphalt and good tyres give μ up to about 1.
import { THREE, M, box, clamp, approach } from '../kit.js';
import { G, KMH, RHO_AIR, TAU, board, panelBg, axes, dot, title, line, force, makeCar, makeMoto, makeBicycle, fitNarrow, fmt } from '../newton.js';

export const RACERS = {
  car: { name: 'Car', m: 1300, P: 110e3, F: 6890, cda: 0.66, crr: 0.012, col: '#ff7a59' },
  moto: { name: 'Motorcycle', m: 215, P: 10.3e3, F: 1106, cda: 0.6, crr: 0.015, col: '#7aa2ff' },
  bike: { name: 'Bicycle', m: 85, P: 800, F: 300, cda: 0.45, crr: 0.005, col: '#5ce1a9' },
};
const SHARE = 0.9 * 0.72;
const DIST = 100;                                  // the race is 100 m
export function drive(r, v, extra) {
  const m = r.m + extra, Fd = Math.min(r.F, (r.P * SHARE) / Math.max(v, 0.05));
  const drag = 0.5 * RHO_AIR * r.cda * v * v, roll = r.crr * m * G;
  return { m, Fd, drag, roll, net: Fd - drag - roll, a: (Fd - drag - roll) / m };
}
// Time to reach a speed (m/s), or Infinity.
export function timeTo(r, extra, vT) {
  let v = 0, t = 0; const dt = 0.005;
  while (t < 60) { v += drive(r, v, extra).a * dt; t += dt; if (v >= vT) return t; }
  return Infinity;
}
const MU = 1.0;
export function corner(v, r) { const a = (v * v) / r; return { a, th: Math.atan(a / G), mu: a / G }; }
const VIEWS = {
  race: { pos: [-0.6, 4.4, 10.8], target: [-0.6, 1.9, 0] },
  corner: { pos: [-5.6, 2.2, 0.3], target: [0.5, 1.25, -0.3] },
};
const KEYS = ['car', 'moto', 'bike'];

export default {
  id: 'accelerate',
  short: 'Speeding up and turning',
  title: 'F = ma on the road',
  subtitle: 'Speeding up takes a forward push. Turning takes a sideways one.',
  view: VIEWS.race,
  learn: `<p>Newton's second law tells you how fast anything can speed up: <b>a = F ÷ m</b>. The tyres push backwards on the road, and by the third law the road pushes the vehicle forwards. What's left after air drag and rolling resistance is the force that accelerates it.</p>
    <p>At the start, a family car's tyres can push about <b>6,900 N</b> on its <b>1,300 kg</b>, and a 150 cc motorcycle about <b>1,100 N</b> on its <b>215 kg</b> with rider. That's roughly the same acceleration, about 5 m/s². But once they are moving, force is limited by <b>power</b>: F = P ÷ v. The car has about <b>85 watts per kilogram</b>, the motorcycle about 48, so the car pulls away. See CarClear and MotorcycleClear.</p>
    <p><b>Turning is accelerating too</b>, because the direction of your velocity changes. To go round a circle of radius r at speed v you need a push towards the middle of <b>F = m × v² ÷ r</b>. On a road that push comes from the tyres' grip. A motorcycle or bicycle <b>leans</b> so that gravity and the road's push line up: <b>tan θ = v² ÷ (g × r)</b>. See MotorcycleClear and CycleClear.</p>
    <p class="tip"><b>Try it:</b> add 150 kg of load and see who suffers most. Then take the corner faster, or tighten it, until the tyres can't grip.</p>`,
  terms: [
    { t: 'Traction', d: 'The grip between tyre and road. It limits how hard a vehicle can push forwards, brake or turn.' },
    { t: 'Power-to-weight', d: 'Engine power divided by mass, in watts per kilogram. It decides acceleration once you are moving.' },
    { t: 'Drag', d: 'The air pushing back on a moving vehicle, growing with the square of its speed.' },
    { t: 'Centripetal force', d: 'The push towards the centre that makes anything move in a circle: F = m v² ÷ r.' },
    { t: 'Lean angle', d: 'How far a two-wheeler tilts in a turn: tan θ = v² ÷ (g r).' },
  ],
  defaults: { focus: 'race', extra: 0, rider: 'moto', kmh: 50, r: 40 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'race', label: 'Drag race' }, { v: 'corner', label: 'Cornering' }] },
    { key: 'extra', type: 'range', label: 'Race: extra load on each', min: 0, max: 150, step: 5, ends: ['none', '150 kg'], fmt: (v) => v + ' kg', hint: 'Passengers, a pillion rider, or shopping.' },
    { key: 'rider', type: 'seg', label: 'Corner: who is turning', options: [{ v: 'moto', label: 'Motorcycle' }, { v: 'bike', label: 'Bicycle' }] },
    { key: 'kmh', type: 'range', label: 'Corner: speed', min: 10, max: 110, step: 1, ends: ['10 km/h', '110 km/h'], fmt: (v) => Math.round(v) + ' km/h' },
    { key: 'r', type: 'range', label: 'Corner: radius of the bend', min: 10, max: 120, step: 1, ends: ['10 m, tight', '120 m, gentle'], fmt: (v) => Math.round(v) + ' m' },
    { key: 'go', type: 'buttons', label: 'Race', items: [{ label: 'Start the race', act: (s, inst) => { s.focus = 'race'; inst.restart(); } }] },
  ],
  quiz: [
    { q: 'A 1,000 kg car’s tyres push it with a net 3,000 N. What is its acceleration?', options: ['0.3 m/s²', '3 m/s²', '30 m/s²', '3,000 m/s²'], answer: 1, why: 'a = F ÷ m = 3,000 ÷ 1,000 = 3 m/s².' },
    { q: 'Why does adding 150 kg slow a motorcycle’s acceleration much more than a car’s?', options: ['Motorcycles have weaker brakes', 'It is a far bigger share of the motorcycle’s mass, so the same force gives much less acceleration', 'Cars don’t feel mass', 'It doesn’t'], answer: 1, why: '150 kg on 215 kg is a 70% rise in mass; on 1,300 kg it is about 12%. a = F ÷ m falls in proportion.' },
    { q: 'A rider goes round the same bend twice as fast. How much more sideways grip is needed?', options: ['The same', 'Twice as much', 'Four times as much', 'Half as much'], answer: 2, why: 'Centripetal force is m v² ÷ r, so doubling v needs four times the force.' },
  ],
  reel: [
    { ms: 5000, caption: 'Turning is accelerating too. The tyres must push towards the centre: F = mv² ÷ r.', set: { focus: 'corner', rider: 'moto', r: 40 }, anim: { kmh: [25, 72] }, spin: 0.12 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gRace = new THREE.Group(), gCorner = new THREE.Group(); root.add(gRace, gCorner);
    const rs = { t: 0, wait: 0, d: { car: 0, moto: 0, bike: 0 }, v: { car: 0, moto: 0, bike: 0 }, trace: { car: [], moto: [], bike: [] }, done: false };

    // ---------------------------------------------------------------- race
    const LANES = { car: -1.9, moto: 0.2, bike: 1.7 }, LEAD = 2.4, BACK = -4.6;
    const road = box(26, 0.04, 6.4, M.matte(0x2a2e37)); road.position.set(-1, 0.02, 0); gRace.add(road);
    const dashMat = M.glow(0xcfd6e2, { transparent: true, opacity: 0.55 });
    const dashes = [];
    for (const z of [-0.85, 1.0]) for (let i = 0; i < 12; i++) { const d = box(1.0, 0.005, 0.1, dashMat); d.position.set(0, 0.045, z); gRace.add(d); dashes.push(d); }
    const startL = box(0.25, 0.006, 6.4, M.glow(0xffffff)); startL.position.y = 0.046; gRace.add(startL);
    const finish = new THREE.Group(); gRace.add(finish);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { const c = box(0.2, 0.006, 0.4, M.glow((i + j) % 2 ? 0x111111 : 0xffffff)); c.position.set(j * 0.2, 0.047, -3.0 + i * 0.4); finish.add(c); }
    const vehicles = { car: makeCar(0xd8332f), moto: makeMoto(0x2f6fd8), bike: makeBicycle(0x5ce1a9) };
    KEYS.forEach((k) => { vehicles[k].position.z = LANES[k]; gRace.add(vehicles[k]); });
    const labels = {}; KEYS.forEach((k) => { labels[k] = stage.label('', [0, 0, 0], gRace, k === 'car' ? 'hot' : ''); });
    const arrows = {}; KEYS.forEach((k) => { arrows[k] = force(0xffb547, 0.04, 0.22); gRace.add(arrows[k]); });
    const chR = board(gRace, 3.3, 2.33, 600, 424, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Speed in the race');
      const { X, Y } = axes(g, w, h, { y1: 62, xMax: 12, yMax: 120, xTicks: [0, 3, 6, 9, 12], yTicks: [0, 40, 80, 120], xFmt: (v) => v + ' s', yFmt: (v) => v + ' km/h' });
      KEYS.forEach((k) => line(g, rs.trace[k], X, Y, RACERS[k].col, 5));
      g.font = 'bold 17px sans-serif'; let x = w - 300;
      KEYS.forEach((k) => { g.fillStyle = RACERS[k].col; g.fillText(RACERS[k].name, x, 34); x += g.measureText(RACERS[k].name).width + 14; });
    }, [4.1, 2.75, -1.9]);
    chR.mesh.rotation.y = -0.2;

    // ---------------------------------------------------------------- corner
    const ringG = new THREE.Group(); gCorner.add(ringG);
    let ringR = 0, ring = null, ringDash = null;
    const buildRing = (r) => {
      if (ring) { ringG.remove(ring, ringDash); ring.geometry.dispose(); ringDash.geometry.dispose(); }
      ring = new THREE.Mesh(new THREE.RingGeometry(r - 3.5, r + 3.5, Math.min(512, Math.round(r * 8)), 1), M.matte(0x2a2e37, { side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.receiveShadow = true; ringG.add(ring);
      const n = Math.round((TAU * r) / 4);
      ringDash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.01, 1.8), M.glow(0xcfd6e2, { transparent: true, opacity: 0.6 }), n);
      const o = new THREE.Object3D();
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU; for (const dr of [-2.2]) { o.position.set(Math.sin(a) * (r + dr), 0.012, Math.cos(a) * (r + dr)); o.rotation.set(0, a + Math.PI / 2, 0); o.updateMatrix(); ringDash.setMatrixAt(i, o.matrix); } }
      ringDash.instanceMatrix.needsUpdate = true; ringG.add(ringDash);
      ringR = r;
    };
    const lean = new THREE.Group(); gCorner.add(lean);
    const cMoto = makeMoto(0x2f6fd8), cBike = makeBicycle(0x5ce1a9); lean.add(cMoto, cBike);
    const fW = force(0xff5a5a, 0.045, 0.22), fN = force(0xffb547, 0.045, 0.22), fC = force(0x5ce1a9, 0.05, 0.24); gCorner.add(fW, fN, fC);
    const lW = stage.label('', [0, 0, 0], gCorner), lN = stage.label('', [0, 0, 0], gCorner), lC = stage.label('', [0, 0, 0], gCorner, 'hot'), lCen = stage.label('', [0, 0, 0], gCorner);
    let cur = { v: 50 / KMH, r: 40, m: 215 };
    const chC = board(gCorner, 3.0, 2.2, 560, 410, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Lean angle needed', `on a ${Math.round(cur.r)} m bend`);
      const { X, Y, x1 } = axes(g, w, h, { y1: 62, xMax: 110, yMax: 60, xTicks: [0, 30, 60, 90], yTicks: [0, 20, 40, 60], xFmt: (v) => v + ' km/h', yFmt: (v) => v + '°' });
      const pts = []; for (let k = 0; k <= 110; k += 2) pts.push([k, Math.min(62, corner(k / KMH, cur.r).th / (Math.PI / 180))]);
      g.save(); g.beginPath(); g.rect(0, 50, w, h); g.clip(); line(g, pts, X, Y, '#7aa2ff', 5); g.restore();
      g.strokeStyle = 'rgba(255,90,90,.6)'; g.setLineDash([7, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(0), Y(45)); g.lineTo(x1, Y(45)); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,90,90,.85)'; g.font = '16px sans-serif'; g.fillText('grip runs out (μ = 1)', X(2), Y(45) - 8);
      const th = corner(cur.v, cur.r).th / (Math.PI / 180); dot(g, X(cur.v * KMH), Y(Math.min(60, th)), '#fff', 9);
    }, [5.0, 1.9, 2.3]);
    chC.mesh.rotation.y = -Math.PI / 2 + 0.25;

    // ---------------------------------------------------------------- state
    let S = null, focus = '', kR = '', kC = '', phase = 0, skid = 0;
    const restart = () => { rs.t = -0.6; rs.wait = 0; rs.done = false; KEYS.forEach((k) => { rs.d[k] = 0; rs.v[k] = 0; rs.trace[k].length = 0; }); };
    restart();

    return {
      restart,
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        const narrow = fitNarrow(stage, [lW, lN, lCen]);
        if (s.focus !== focus) { focus = s.focus; gRace.visible = focus === 'race'; gCorner.visible = focus === 'corner'; const v = VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); restart(); }

        if (focus === 'race') {
          if (rs.wait > 0) { rs.wait -= dt; if (rs.wait <= 0) restart(); }
          else {
            rs.t += dt;
            if (rs.t > 0) {
              const n = 5, h = dt / n;
              for (let i = 0; i < n; i++) KEYS.forEach((k) => { if (rs.d[k] < DIST) { const r = drive(RACERS[k], rs.v[k], s.extra); rs.v[k] = Math.max(0, rs.v[k] + r.a * h); rs.d[k] += rs.v[k] * h; } else rs.v[k] = Math.max(0, rs.v[k] - 6 * h); });
              KEYS.forEach((k) => { const tr = rs.trace[k]; if (rs.t <= 12 && (!tr.length || rs.t - tr[tr.length - 1][0] > 0.1)) tr.push([rs.t, rs.v[k] * KMH]); });
              if (rs.t > 13.5 || KEYS.every((k) => rs.d[k] >= DIST)) rs.wait = 2;
            }
          }
          const lead = Math.min(DIST + 6, Math.max(...KEYS.map((k) => rs.d[k])));
          const shift = LEAD - lead;
          KEYS.forEach((k) => {
            const veh = vehicles[k], x = Math.max(BACK, rs.d[k] + shift);
            const dx = x - veh.position.x; veh.position.x = x; veh.roll?.(Math.max(0, dx));
            const r = drive(RACERS[k], rs.v[k], s.extra);
            arrows[k].aim([x - (k === 'car' ? 2.3 : 1.1), 0.35, LANES[k]], [1, 0, 0], rs.t > 0 && rs.d[k] < DIST ? r.Fd / 1800 + 0.25 : 0);
            const behind = lead - rs.d[k];
            labels[k].position.set(x - 0.2, k === 'car' ? 1.95 : 2.1, LANES[k]);
            labels[k].element.innerHTML = `${RACERS[k].name} <b>${Math.round(rs.v[k] * KMH)} km/h</b>${behind > 0.5 && rs.d[k] + shift < BACK ? ` · ${Math.round(behind)} m back` : ''}`;
          });
          dashes.forEach((d, i) => { const j = i % 12; d.position.x = ((((j * 2.2 + shift) % 26.4) + 26.4) % 26.4) - 13.2 + 0.5; });
          startL.position.x = shift; startL.visible = shift > -14;
          finish.position.x = DIST + shift; finish.visible = DIST + shift < 12;
          const kk = `${rs.trace.car.length}|${s.extra}`; if (kk !== kR) { kR = kk; chR.redraw(); }
        }

        if (focus === 'corner') {
          const v = s.kmh / KMH, r = s.r, c = corner(v, r), m = s.rider === 'bike' ? 85 : 215;
          if (Math.abs(r - ringR) > 0.5) buildRing(r);
          ringG.position.set(0, 0, -r);
          phase -= (v / r) * dt; ringG.rotation.y = phase;
          const over = c.mu > MU;
          skid = approach(skid, over ? 1 : 0, 3, dt);
          const th = Math.min(c.th, Math.atan(MU)) + skid * 0.25;
          cMoto.visible = s.rider !== 'bike'; cBike.visible = s.rider === 'bike';
          lean.rotation.x = -th;
          lean.position.z = skid * 0.6;
          const H = s.rider === 'bike' ? 1.0 : 0.72;                   // centre of mass height with rider, m
          const com = [0, H * Math.cos(th), -H * Math.sin(th) + lean.position.z];
          const W = m * G, Fc = m * Math.min(c.a, MU * G), SC = s.rider === 'bike' ? 1 / 800 : 1 / 2000;
          fW.aim(com, [0, -1, 0], W * SC);
          fN.aim([0, 0.02, lean.position.z], [0, W, -Fc], Math.hypot(W, Fc) * SC);
          fC.aim(com, [0, 0, -1], Fc * SC);
          lW.position.set(0, 0.35, 0.75); lW.element.innerHTML = `weight <b>${fmt(W, 0)} N</b>`;
          lN.position.set(0, 0.12, -0.75 + lean.position.z); lN.element.innerHTML = 'road’s push';
          lC.position.set(0, com[1] + 0.35, com[2] - Fc * SC); lC.element.innerHTML = over ? '<b>Not enough grip: skidding!</b>' : `towards the centre: <b>${fmt(Fc, 0)} N</b>`;
          lCen.position.set(0, 0.1, -Math.min(r, 14)); lCen.element.innerHTML = `centre of the bend, ${Math.round(r)} m away →`;
          void narrow;
          cur = { v, r, m };
          const kk = `${s.kmh}|${s.r}`; if (kk !== kC) { kC = kk; chC.redraw(); }
        }
      },
      readout: (s) => {
        if (s.focus === 'corner') {
          const v = s.kmh / KMH, c = corner(v, s.r), m = s.rider === 'bike' ? 85 : 215, over = c.mu > MU;
          return `<div class="big ${over ? 'no' : ''}">${over ? 'Too fast: the tyres can’t grip that hard' : `Lean ${Math.round(c.th / (Math.PI / 180))}° into the turn`}</div>
            <div class="row"><span>Acceleration to the centre, v² ÷ r</span><b>${c.a.toFixed(1)} m/s² (${(c.a / G).toFixed(2)} g)</b></div>
            <div class="row"><span>Force needed, F = m v² ÷ r</span><b>${fmt(m * c.a, 0)} N on ${m} kg</b></div>
            <div class="row"><span>Grip needed, μ = v² ÷ gr</span><b>${c.mu.toFixed(2)}${over ? ' (max about 1)' : ''}</b></div>
            <small>Twice the speed needs four times the force. ${s.rider === 'bike' ? 'The bicycle mass includes an 85 kg rider and bike.' : '215 kg: a 150 cc motorcycle with its rider.'}</small>`;
        }
        const rows = KEYS.map((k) => {
          const r = RACERS[k], d = drive(r, 0.01, s.extra), t60 = timeTo(r, s.extra, 60 / KMH);
          return `<div class="row"><span>${r.name}: ${fmt(d.Fd, 0)} N ÷ ${fmt(d.m, 0)} kg</span><b>${(d.Fd / d.m).toFixed(1)} m/s² · ${isFinite(t60) ? `0–60 in ${t60.toFixed(1)} s` : 'never 60'}</b></div>`;
        }).join('');
        const pw = (k) => Math.round(RACERS[k].P / (RACERS[k].m + s.extra));
        return `<div class="big">a = F ÷ m, off the line</div>${rows}
          <small>Power-to-weight: car ${pw('car')} W/kg, motorcycle ${pw('moto')}, bicycle ${pw('bike')}. It decides who pulls away once they are moving.</small>`;
      },
    };
  },
};
