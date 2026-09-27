// Chapter 4: action and reaction. Two machines that move by pushing something the other way.
// Spray arm: the reaction-turbine model from DishwasherClear (js/dw.js). Each of 10 nozzles, 1.5 mm
// across, at radii 4–20 cm: jet speed v = Cv·√(2Δp/ρ), flow Q = Cd·A·√(2Δp/ρ) with Cv 0.95 and
// Cd 0.65 (standard short-orifice coefficients, White, Fluid Mechanics, ch. 6). A jet tilted by α
// pushes the arm back with ρQ·v·sinα; torque τ = Σ ρQ·r·(v·sinα − ω·r) against bearing friction
// τ0 = 0.008 N·m and drag k·ω² (k = 0.00297), calibrated to about 35 rpm at 0.5 bar and 25°.
// Fan: a 400 mm desk fan on a skateboard. The blades throw air forward at speed v through the swept
// area A = π × 0.2² m², so the air gains momentum ρ·A·v² every second and, by the third law, the
// fan is pushed back just as hard: F = ρAv². Air leaving at about 2.5, 3.5 and 4.5 m/s on low,
// medium and high is typical of such fans. Fan + board 5 kg, rolling resistance Crr 0.01.
// Ceiling fan note: 210 m³/min (a typical 1,200 mm fan's rating, as in FanClear) through 1.13 m²
// is 3.1 m/s, so F = ρ·Q·v ≈ 1.2 × 3.5 × 3.1 ≈ 13 N: the fan hangs about 1.3 kg lighter.
import { THREE, M, box, beam, clamp, approach } from '../kit.js';
import { G, RHO_AIR, RHO_W, TAU, board, panelBg, axes, title, line, force, makeDeskFan, dots, rng, fitNarrow, fmt } from '../newton.js';

// ---------------------------------------------------------------- spray arm (DishwasherClear)
const ARM = { r: [0.04, 0.08, 0.12, 0.16, 0.2], d: 1.5e-3, Cv: 0.95, Cd: 0.65, tau0: 0.008, k: 0.00297 };
export function armModel(pBar, alphaDeg) {
  const dp = pBar * 1e5, A = Math.PI * (ARM.d / 2) ** 2, vi = Math.sqrt((2 * Math.max(0, dp)) / RHO_W);
  const v = ARM.Cv * vi, Qn = ARM.Cd * A * vi, sa = Math.sin((alphaDeg * Math.PI) / 180);
  const sr = 2 * ARM.r.reduce((a, b) => a + b, 0), sr2 = 2 * ARM.r.reduce((a, b) => a + b * b, 0);
  const mdot = RHO_W * Qn, tauStall = mdot * sr * v * sa, b = mdot * sr2;
  let w = 0;
  if (tauStall > ARM.tau0) w = (-b + Math.sqrt(b * b + 4 * ARM.k * (tauStall - ARM.tau0))) / (2 * ARM.k);
  return { v, vUp: v * Math.cos((alphaDeg * Math.PI) / 180), vSide: v * sa, Qn, mdot, tauStall, w, rpm: (w * 60) / TAU, thrust: mdot * v * sa, total: 10 * mdot * v * sa };
}
const S = 8, SLOW = 6, AY = 0.6;               // scene units per metre, slow motion, arm height

// ---------------------------------------------------------------- fan on a skateboard
const FAN_V = [0, 2.5, 3.5, 4.5], FAN_A = Math.PI * 0.2 * 0.2, FAN_M = 5, CRR = 0.01;
export const fanThrust = (lvl) => RHO_AIR * FAN_A * FAN_V[lvl] ** 2;
const VIEWS = {
  arm: { pos: [0.6, 5.4, 4.6], target: [0.6, 1.2, 0] },
  fan: { pos: [0.5, 2.3, 5.8], target: [0.5, 1.55, 0] },
};

export default {
  id: 'pushback',
  short: 'Push and push back',
  title: 'Every push pushes back',
  subtitle: 'Throw water or air one way, and you get pushed the other.',
  view: VIEWS.arm,
  learn: `<p>Newton's third law says forces come in <b>pairs</b>. If A pushes B, then B pushes A just as hard, in the opposite direction. The two forces act on <b>different</b> things, so they don't cancel out.</p>
    <p>A dishwasher's <b>spray arms</b> have no motor. The little holes are drilled at a slant, so each jet shoots out backwards and a little sideways. The arm pushes the water back; the water pushes the arm forward. Ten tiny pushes add up to enough twist to spin the arm. See DishwasherClear.</p>
    <p>A <b>fan</b> works the same way with air. Its blades throw air forward, and the air shoves the fan backwards. Stand a desk fan on a skateboard and it rolls away from its own breeze. A ceiling fan pushes air down, so the air pushes it up: a big one hangs about <b>1.3 kg lighter</b> when running. See FanClear.</p>
    <p>A <b>rocket</b> is the purest example. It throws hot gas out of the back at thousands of metres per second, and the gas throws the rocket forward. It needs no air to push against, which is why rockets work in space.</p>
    <p>Even <b>walking</b> is the third law. Your foot pushes the ground backwards, and friction from the ground pushes you forwards. On slippery ice there is little friction to push you, so you can't get going.</p>
    <p class="tip"><b>Try it:</b> tilt the spray nozzles to 0° and the arm stops, however hard the pump pushes. Then put the fan on high and let the skateboard go.</p>`,
  terms: [
    { t: 'Action–reaction pair', d: 'Two equal and opposite forces that two objects exert on each other.' },
    { t: 'Thrust', d: 'The push a machine gets from throwing water, air or gas the other way.' },
    { t: 'Torque', d: 'A twisting force: force × distance from the centre.' },
    { t: 'Reaction turbine', d: 'A wheel or arm spun by the recoil of its own jets, like a lawn sprinkler.' },
    { t: 'Mass flow', d: 'How many kilograms of water or air a machine throws out each second.' },
  ],
  defaults: { focus: 'arm', bar: 0.5, tilt: 25, hold: false, lvl: 3 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'arm', label: 'Dishwasher spray arm' }, { v: 'fan', label: 'Fan on a skateboard' }] },
    { key: 'bar', type: 'range', label: 'Pump pressure', min: 0.1, max: 1, step: 0.05, ends: ['0.1 bar', '1 bar'], fmt: (v) => v.toFixed(2) + ' bar' },
    { key: 'tilt', type: 'range', label: 'Nozzle tilt', min: 0, max: 45, step: 1, ends: ['straight up', '45°'], fmt: (v) => Math.round(v) + '°' },
    { key: 'hold', type: 'toggle', label: 'Hold the arm still', hint: 'Feel the twist the jets make at a standstill.' },
    { key: 'lvl', type: 'seg', label: 'Fan speed', options: [{ v: 0, label: 'Off' }, { v: 1, label: 'Low' }, { v: 2, label: 'Medium' }, { v: 3, label: 'High' }] },
    { key: 'go', type: 'buttons', label: 'Skateboard', items: [{ label: 'Put it back and let go', act: (s, inst) => { s.focus = 'fan'; inst.restart(); } }] },
  ],
  quiz: [
    { q: 'A dishwasher spray arm has no motor. What makes it spin?', options: ['The water heater', 'The water jets push back on the arm as they leave the tilted holes', 'A magnet in the hub', 'Hot air rising'], answer: 1, why: 'Newton’s third law: the arm pushes the water out one way, and the water pushes the arm the other way.' },
    { q: 'A horse pulls a cart, and the cart pulls back on the horse just as hard. How can they move?', options: ['The horse pulls harder than the cart pulls back', 'The two forces act on different objects; the horse also pushes on the ground, and the ground pushes it forward', 'They can’t', 'The cart is lighter'], answer: 1, why: 'Action and reaction act on different bodies, so they never cancel. What moves the horse and cart is the ground pushing forward on the horse’s hooves.' },
    { q: 'Why can a rocket accelerate in empty space, where there is no air to push against?', options: ['It pushes on the stars', 'It throws its own exhaust backwards, and the exhaust pushes it forwards', 'Gravity pulls it along', 'It can’t'], answer: 1, why: 'The rocket and its exhaust push on each other. No air is needed.' },
  ],
  reel: [
    { ms: 5000, caption: 'No motor turns a dishwasher’s spray arm. Its slanted jets push it round.', set: { focus: 'arm', bar: 0.5, hold: false }, anim: { tilt: [0, 30] }, spin: 0.1 },
    { ms: 5000, caption: 'The fan throws air forward, and the air pushes the fan back. Every push pushes back.', set: { focus: 'fan', lvl: 3 }, act: (s, inst) => inst.restart(), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gArm = new THREE.Group(), gFan = new THREE.Group(); root.add(gArm, gFan);

    // ---------------------------------------------------------------- spray arm
    const tub = box(5.2, 0.12, 4.6, M.matte(0xc9ced8, { roughness: 0.35 })); tub.position.set(0, 0.06, 0); gArm.add(tub);
    const back = box(5.2, 3.2, 0.06, M.clear(0xdfe8f2, 0.12)); back.position.set(0, 1.6, -2.3); gArm.add(back);
    const sump = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.1, 32), M.metal(0x9aa3b2)); sump.position.set(0, 0.16, 0); gArm.add(sump);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, AY - 0.1, 20), M.plastic(0x9aa3b2)); stem.position.set(0, (AY + 0.1) / 2 + 0.05, 0); gArm.add(stem);
    const arm = new THREE.Group(); arm.position.y = AY; gArm.add(arm);
    const L = ARM.r[4] * S + 0.25;
    const armMesh = box(L * 2, 0.14, 0.34, M.plastic(0x8f98a8, { roughness: 0.4 })); arm.add(armMesh);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 24), M.plastic(0x6f7886)); arm.add(hub);
    const holes = [];
    for (const side of [1, -1]) for (const r of ARM.r) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 10), M.matte(0x1b1d22)); h.position.set(side * r * S, 0.075, 0); arm.add(h); holes.push({ side, r }); }
    const NJ = 900, drops = dots(NJ, 0.028, 0x8ef0ff); gArm.add(drops);
    const jet = Array.from({ length: NJ }, (_, i) => ({ k: i % 10, age: 1, delay: 0, p: [0, -9, 0], v: [0, 0, 0] }));
    const jrnd = rng(3);
    const jA = force(0x8ef0ff, 0.03, 0.18), rA = force(0xffb547, 0.045, 0.22); arm.add(jA, rA);
    const lJet = stage.label('', [0, 0, 0], arm), lReact = stage.label('', [0, 0, 0], arm, 'hot'), lSlowA = stage.label(`shown ${SLOW}× slower`, [-2.2, 0.2, 2.4], gArm);

    // ---------------------------------------------------------------- fan on a skateboard
    const floor = box(10, 0.06, 2.6, M.matte(0x6b5a48, { roughness: 0.8 })); floor.position.set(0, 0.03, 0); gFan.add(floor);
    for (let x = -4.5; x <= 4.5; x += 0.5) { const t = box(0.015, 0.004, 0.18, M.glow(0xc8d2e4, { transparent: true, opacity: 0.4 })); t.position.set(x, 0.063, 1.1); gFan.add(t); }
    const cart = new THREE.Group(); gFan.add(cart);
    const deck = box(0.8, 0.03, 0.22, M.plastic(0xe0663a)); deck.position.y = 0.12; cart.add(deck);
    const wheels = [];
    for (const x of [-0.28, 0.28]) for (const z of [-0.08, 0.08]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), M.plastic(0xf2c230)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.04, z); cart.add(w); wheels.push(w); }
    for (const x of [-0.28, 0.28]) { const tr = box(0.05, 0.04, 0.18, M.metal(0xb9bec8)); tr.position.set(x, 0.085, 0); cart.add(tr); }
    const fan = makeDeskFan(); fan.position.y = 0.135; cart.add(fan);
    const NA = 700, air = dots(NA, 0.02, 0xcfe8ff); gFan.add(air);
    const rnd = rng(11);
    const puffs = Array.from({ length: NA }, () => ({ x: rnd() * 3, a: rnd() * TAU, r: Math.sqrt(rnd()) * 0.2, x0: 0 }));
    const fAir = force(0x8ef0ff, 0.04, 0.22), fFan = force(0xffb547, 0.045, 0.22); gFan.add(fAir, fFan);
    const lAir = stage.label('', [0, 0, 0], gFan), lFan = stage.label('', [0, 0, 0], gFan, 'hot');
    const fs = { x: 2.2, v: 0, t: 0, wait: 0, trace: [] };
    const chF = board(gFan, 2.8, 1.9, 600, 408, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Skateboard’s speed, backwards');
      const { X, Y } = axes(g, w, h, { y1: 62, xMax: 6, yMax: 3, xTicks: [0, 2, 4, 6], yTicks: [0, 1, 2, 3], xFmt: (v) => v + ' s', yFmt: (v) => v + ' m/s' });
      line(g, fs.trace, X, Y, '#ffb547', 5);
    }, [2.6, 2.55, -1.6]);
    chF.mesh.rotation.y = -0.15;

    // ---------------------------------------------------------------- state
    let focus = '', ang = 0, w = 0, clock = 0, kF = '';
    const restart = () => { Object.assign(fs, { x: 2.2, v: 0, t: 0, wait: 0 }); fs.trace.length = 0; };

    return {
      restart,
      update(dt, s) {
        dt = Math.max(0, dt); clock += dt;
        fitNarrow(stage, [lSlowA, lJet]);
        if (s.focus !== focus) { focus = s.focus; gArm.visible = focus === 'arm'; gFan.visible = focus === 'fan'; const v = VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); restart(); }

        if (focus === 'arm') {
          const a = armModel(s.bar, s.tilt), target = s.hold ? 0 : a.w;
          w = approach(w, target, 1.5, dt / SLOW);
          ang -= (w * dt) / SLOW; arm.rotation.y = ang;
          const sa = Math.sin((s.tilt * Math.PI) / 180), ca = Math.cos((s.tilt * Math.PI) / 180), tdt = dt / SLOW;
          for (let i = 0; i < NJ; i++) {
            const q = jet[i];
            q.age += tdt;
            if (q.delay > 0) { q.delay -= tdt; drops.place(i, 0, -5, 0, 0.001); continue; }
            if (q.age > 0.08 || q.p[1] > 3.0 || q.p[1] < 0) {
              // re-emit from nozzle k at the arm's current angle
              const h = holes[q.k], r = h.r * S, c = Math.cos(ang), sn = Math.sin(ang);
              const px = h.side * r * c, pz = -h.side * r * sn;              // arm point in the world
              const tx = h.side * sn, tz = h.side * c;                         // unit vector for the arm's forward motion there
              q.p = [px, AY + 0.08, pz];
              const vt = -a.vSide + w * h.r;                                   // jet's sideways speed over the ground (m/s)
              q.v = [tx * vt * S, a.vUp * S, tz * vt * S];
              q.age = 0; q.delay = jrnd() * 0.035;
            }
            q.v[1] -= G * S * tdt;
            q.p[0] += q.v[0] * tdt; q.p[1] += q.v[1] * tdt; q.p[2] += q.v[2] * tdt;
            drops.place(i, q.p[0], q.p[1], q.p[2], s.bar > 0.05 ? 1 : 0.001);
          }
          drops.done();
          // arrows on the outer nozzle of the +x side (arm frame): the jet leans back (−z), the arm is pushed forward (+z)
          const rx = ARM.r[4] * S;
          jA.aim([rx, 0.1, 0], [0, ca, -sa], 0.9);
          rA.aim([rx, 0, 0.15], [0, 0, 1], a.thrust * 16);
          lJet.position.set(rx + 0.2, 1.15, -sa * 0.8); lJet.element.innerHTML = `jet ${a.v.toFixed(1)} m/s`;
          lReact.position.set(rx + 0.3, -0.05, 0.45 + a.thrust * 16); lReact.element.innerHTML = a.thrust > 0.0005 ? `push back <b>${(a.thrust * 1000).toFixed(0)} mN</b>` : 'no sideways push';
        }

        if (focus === 'fan') {
          const F = fanThrust(s.lvl), roll = CRR * FAN_M * G, net = F > roll ? F - roll : 0;
          if (fs.wait > 0) { fs.wait -= dt; if (fs.wait <= 0) restart(); }
          else {
            fs.t += dt;
            fs.v += (net / FAN_M) * dt;
            if (net === 0) fs.v = Math.max(0, fs.v - (roll / FAN_M) * dt);
            fs.x -= fs.v * dt;
            if (fs.t <= 6 && (!fs.trace.length || fs.t - fs.trace[fs.trace.length - 1][0] > 0.08)) fs.trace.push([fs.t, fs.v]);
            if (fs.x < -4.2) { fs.x = -4.2; fs.wait = 1.2; }
            if (fs.t > 12) fs.wait = 0.5;
          }
          const dx = fs.x - cart.position.x; cart.position.x = fs.x;
          wheels.forEach((wh) => { wh.rotation.y += dx / 0.035; });
          const va = FAN_V[s.lvl];
          fan.spin(va * dt * 6);
          for (let i = 0; i < NA; i++) {
            const p = puffs[i];
            p.x += (va * (1 - p.x / 4) + 0.3) * dt * (va > 0 ? 1 : 0);
            if (p.x > 3.2) { p.x = 0; p.a = rnd() * TAU; p.r = Math.sqrt(rnd()) * 0.2; }
            const spread = 1 + p.x * 0.35;
            air.place(i, fs.x + 0.25 + p.x, 0.935 + Math.cos(p.a) * p.r * spread, Math.sin(p.a) * p.r * spread, va > 0 ? 1 - p.x / 3.4 : 0.001);
          }
          air.done();
          const aL = F * 0.45;
          fAir.aim([fs.x + 0.4, 1.35, 0], [1, 0, 0], aL);
          fFan.aim([fs.x - 0.25, 1.35, 0], [-1, 0, 0], aL);
          lAir.position.set(fs.x + 0.6 + aL / 2, 1.6, 0); lAir.element.innerHTML = s.lvl ? `fan pushes air: <b>${F.toFixed(2)} N</b>` : 'fan off';
          lFan.position.set(fs.x - 0.35 - aL / 2, 1.6, 0); lFan.element.innerHTML = s.lvl ? `air pushes fan: <b>${F.toFixed(2)} N</b>` : '';
          lFan.visible = s.lvl > 0;
          const kk = `${fs.trace.length}`; if (kk !== kF) { kF = kk; chF.redraw(); }
        }
      },
      readout: (s) => {
        if (s.focus === 'fan') {
          const F = fanThrust(s.lvl), roll = CRR * FAN_M * G, net = Math.max(0, F - roll);
          return `<div class="big">${s.lvl ? `Air pushes the fan back with ${F.toFixed(2)} N` : 'Fan off: no push either way'}</div>
            <div class="row"><span>Air speed off the blades</span><b>${FAN_V[s.lvl].toFixed(1)} m/s</b></div>
            <div class="row"><span>Air thrown per second, ρAv</span><b>${(RHO_AIR * FAN_A * FAN_V[s.lvl]).toFixed(2)} kg/s</b></div>
            <div class="row"><span>Thrust, ρAv² minus rolling ${roll.toFixed(2)} N</span><b>${net.toFixed(2)} N</b></div>
            <div class="row"><span>Board's acceleration, F ÷ 5 kg</span><b>${(net / FAN_M).toFixed(2)} m/s²</b></div>
            <small>A 1,200 mm ceiling fan pushes about 13 N of air downwards, so it hangs about 1.3 kg lighter when it runs.</small>`;
        }
        const a = armModel(s.bar, s.tilt);
        return `<div class="big">${s.hold ? `Held still: the jets twist it with ${(a.tauStall * 1000).toFixed(0)} mN·m` : a.rpm > 0.5 ? `Spinning at ${Math.round(a.rpm)} rpm, with no motor` : 'Not enough twist to turn'}</div>
          <div class="row"><span>Jet speed, √(2Δp ÷ ρ)</span><b>${a.v.toFixed(1)} m/s</b></div>
          <div class="row"><span>Water per nozzle</span><b>${(a.mdot * 1000).toFixed(1)} g/s</b></div>
          <div class="row"><span>Sideways push per nozzle, ṁ v sin α</span><b>${(a.thrust * 1000).toFixed(0)} mN</b></div>
          <div class="row"><span>Twist from all 10, at a standstill</span><b>${(a.tauStall * 1000).toFixed(0)} mN·m</b></div>
          <small>${s.tilt < 1 ? 'Straight-up jets push the arm down, not round, so it sits still.' : 'Each jet is pushed out by the arm and pushes the arm back.'}</small>`;
      },
    };
  },
};
