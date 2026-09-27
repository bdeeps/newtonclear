// Chapter 5: where Newton's laws bend, and a myth.
// Fast: special relativity (Einstein, 1905). Momentum p = γ·m·v with γ = 1/√(1 − v²/c²), kinetic
//   energy (γ − 1)·m·c². Newton's p = m·v is the low-speed limit. γ = 1.005 at 0.1c, 1.155 at 0.5c,
//   2.294 at 0.9c. LHC protons at 6.8 TeV have γ = 6,800 GeV ÷ 0.938 GeV ≈ 7,250 (CERN).
// Drum: a washing machine drum of radius 0.25 m (as in WasherClear) spinning at n rpm: ω = 2πn/60,
//   the wall pushes the clothes inward with a = ω²r (about 400 g at 1,200 rpm). Water that slips
//   through a hole has nothing pushing it round, so it leaves along the tangent at v = ωr. Seen
//   from the spinning drum the same water seems flung outward by a "centrifugal force": a
//   fictitious force that appears only in a rotating (non-inertial) frame of reference.
// Fall: Apollo 15, 2 August 1971: David Scott dropped a 1.32 kg geological hammer and a 0.03 kg
//   falcon feather on the Moon (g = 1.62 m/s²); they landed together (NASA NSSDCA, "The Apollo 15
//   Hammer-Feather Drop"). In air the feather is held back by drag: dv/dt = g(1 − v²/vt²), with
//   terminal speeds of roughly 0.8 m/s for the feather and 40 m/s for the hammer (estimates).
import { THREE, M, box, beam, sphere, torus, clamp, approach } from '../kit.js';
import { G, G_MOON, TAU, board, panelBg, axes, dot, title, line, force, makePerson, dots, rng, fitNarrow, fmt } from '../newton.js';

export const gamma = (b) => 1 / Math.sqrt(1 - b * b);
const DR = 0.25, SD = 8, SLOW_D = 50;        // drum radius (m), scene units per metre, slow motion
const TUB = 0.31;
const H0 = 1.2, SLOW_F = 3;                  // drop height (m) and slow motion for the fall
const PLACES = {
  air: { name: 'On Earth, in air', g: G, vtF: 0.8, vtH: 40 },
  vacuum: { name: 'On Earth, in a vacuum chamber', g: G, vtF: Infinity, vtH: Infinity },
  moon: { name: 'On the Moon', g: G_MOON, vtF: Infinity, vtH: Infinity },
};
const VIEWS = {
  fast: { pos: [-1.2, 2.4, 8.2], target: [0.6, 1.8, 0] },
  drum: { pos: [1.9, 2.9, 11.0], target: [1.9, 3.0, 0] },
  fall: { pos: [0.5, 2.0, 5.4], target: [0.5, 1.45, 0.3] },
};

export default {
  id: 'limits',
  short: 'Where they break',
  title: 'Too fast, too small, too spun',
  subtitle: 'Near light speed, inside atoms and in spinning rooms, Newton needs help.',
  view: VIEWS.fast,
  learn: `<p>Newton's laws have sent people to the Moon, but they are not the last word.</p>
    <p><b>Very fast.</b> In 1905 Albert Einstein showed that momentum is really <b>p = γmv</b>, where <b>γ = 1 ÷ √(1 − v²/c²)</b> and c is the speed of light. At everyday speeds γ is 1 to many decimal places, so Newton is perfect. At 10% of light speed γ is 1.005, at half light speed 1.155, and at 90% it is 2.29. Push harder and harder and you add momentum, but the speed only creeps closer to c, never past it. Protons in the Large Hadron Collider have γ of about 7,000.</p>
    <p><b>Very small.</b> Inside atoms, electrons don't follow neat paths at all. They are described by <b>quantum mechanics</b> (1925 onwards), which gives chances rather than certainties. Newton's laws come back once you average over huge numbers of atoms.</p>
    <p><b>Spinning rooms.</b> Newton's laws hold for someone who isn't accelerating. Inside a spinning washing machine drum, water seems to be flung outwards by a <b>"centrifugal force"</b>. Watched from outside, nothing pushes it out: the drum stops pushing it round, and it simply carries straight on through the holes. That's the first law again. See WasherClear.</p>
    <p><b>Myth-buster:</b> “Heavy things fall faster.” Aristotle thought so, and it feels right. But a heavier object has more weight <i>and</i> more inertia, and the two cancel: a = F ÷ m = mg ÷ m = g. Only air resistance slows a feather. On 2 August 1971, astronaut David Scott dropped a hammer and a falcon feather on the Moon, and they hit the ground together.</p>
    <p class="tip"><b>Try it:</b> slide towards light speed and watch γ shoot up. Ride along with the drum, then watch from outside. Finally drop the hammer and feather in air, in a vacuum, and on the Moon.</p>`,
  terms: [
    { t: 'Speed of light (c)', d: '299,792,458 m/s. Nothing with mass can reach it.' },
    { t: 'Lorentz factor (γ)', d: '1 ÷ √(1 − v²/c²). How much relativity changes momentum, time and length.' },
    { t: 'Quantum mechanics', d: 'The physics of atoms and smaller, where particles act partly like waves.' },
    { t: 'Inertial frame', d: 'A point of view that isn’t accelerating or spinning. Newton’s laws hold there as written.' },
    { t: 'Centrifugal force', d: 'An outward “force” felt only in a spinning frame. It is really inertia.' },
    { t: 'Terminal velocity', d: 'The speed at which air resistance balances weight, so a falling thing stops speeding up.' },
  ],
  defaults: { focus: 'fast', beta: 0.5, rpm: 800, frame: 'ground', place: 'air' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'fast', label: 'Near light speed' }, { v: 'drum', label: 'Spinning drum' }, { v: 'fall', label: 'Hammer and feather' }] },
    { key: 'beta', type: 'range', label: 'Speed, as a share of light speed', min: 0, max: 0.995, step: 0.005, ends: ['0', '99.5% of c'], fmt: (v) => (v * 100).toFixed(1) + '% of c' },
    { key: 'rpm', type: 'range', label: 'Drum spin speed', min: 200, max: 1400, step: 50, ends: ['200 rpm', '1,400 rpm'], fmt: (v) => Math.round(v) + ' rpm' },
    { key: 'frame', type: 'seg', label: 'Watch the drum from', options: [{ v: 'ground', label: 'Outside' }, { v: 'drum', label: 'Riding in the drum' }] },
    { key: 'place', type: 'seg', label: 'Drop them', options: [{ v: 'air', label: 'In air' }, { v: 'vacuum', label: 'In a vacuum' }, { v: 'moon', label: 'On the Moon' }] },
    { key: 'go', type: 'buttons', label: 'Hammer and feather', items: [{ label: 'Drop them again', act: (s, inst) => { s.focus = 'fall'; inst.drop(); } }] },
  ],
  quiz: [
    { q: 'A spaceship is at 90% of light speed. Compared with Newton’s m × v, its real momentum is about…', options: ['the same', '2.3 times bigger', '10 times smaller', 'infinite'], answer: 1, why: 'γ = 1 ÷ √(1 − 0.9²) ≈ 2.29, and p = γmv.' },
    { q: 'In a washing machine’s spin, what makes water leave the clothes?', options: ['A real outward force from the motor', 'Nothing pushes it round any more, so it carries straight on, through the holes', 'The water gets heavier', 'Air pressure'], answer: 1, why: 'The drum wall pushes the clothes inward to keep them circling. Water that slips through a hole feels no such push and flies off along the tangent: inertia.' },
    { q: 'Why did the hammer and feather land together on the Moon?', options: ['The Moon’s gravity is weak', 'With no air, both fall with acceleration g: more weight, but also more inertia', 'The feather was heavy', 'The hammer was hollow'], answer: 1, why: 'a = F ÷ m = mg ÷ m = g for any mass. On Earth only air resistance holds the feather back.' },
  ],
  reel: [
    { ms: 5000, caption: 'Near light speed, momentum grows as γmv. At 90% of light speed γ is 2.3.', set: { focus: 'fast' }, anim: { beta: [0.1, 0.95] }, spin: 0 },
    { ms: 5000, caption: 'Water leaving a spinning drum isn’t flung out. It just carries straight on.', set: { focus: 'drum', rpm: 1000, frame: 'ground' }, spin: 0 },
    { ms: 5600, caption: 'Myth: heavy things fall faster. Without air, a hammer and a feather land together.', set: { focus: 'fall', place: 'moon' }, act: (s, inst) => inst.drop(), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    let focus = '', curRpm = 800, spin = 0, kF = '', kD = '', kH = '', place = '', narrow = false;
    const gFast = new THREE.Group(), gDrum = new THREE.Group(), gFall = new THREE.Group(); root.add(gFast, gDrum, gFall);

    // ---------------------------------------------------------------- near light speed
    const ship = new THREE.Group(); ship.position.set(-0.6, 1.8, 0); gFast.add(ship);
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 2.2, 32), M.metal(0xd8dde6, { roughness: 0.3 })); hull.rotation.z = -Math.PI / 2; ship.add(hull);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 32), M.metal(0xe4e8ee, { roughness: 0.25 })); nose.rotation.z = -Math.PI / 2; nose.position.x = 1.5; ship.add(nose);
    for (let i = 0; i < 3; i++) { const fin = box(0.6, 0.04, 0.5, M.plastic(0xd8332f)); const h = new THREE.Group(); h.rotation.x = (i / 3) * TAU; fin.position.set(-0.85, 0, 0.5); h.add(fin); ship.add(h); }
    const glowM = M.glow(0x7aa2ff, { transparent: true, opacity: 0.8 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1, 24), glowM); flame.rotation.z = Math.PI / 2; ship.add(flame);
    const window1 = sphere(0.1, M.glow(0x8ef0ff), 16); window1.position.set(0.7, 0.2, 0.26); ship.add(window1);
    const NS = 260, stars = dots(NS, 0.03, 0xffffff); gFast.add(stars);
    const srnd = rng(5), starP = Array.from({ length: NS }, () => [srnd() * 24 - 12, srnd() * 6 - 1.2, -srnd() * 8 - 1.5]);
    const streak = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.5, toneMapped: false }), NS); streak.frustumCulled = false; gFast.add(streak);
    const lShip = stage.label('', [0, 0.8, 0], ship, 'hot');
    let curB = 0.5;
    const chFast = board(gFast, 3.0, 2.3, 600, 460, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Momentum at speed v', 'per unit mass × c');
      const { X, Y, x0, x1, y1 } = axes(g, w, h, { y1: 62, xMax: 1, yMax: 4, xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 1, 2, 3, 4], xFmt: (v) => (v === 1 ? 'c' : v + 'c'), yFmt: String });
      const nw = [[0, 0], [1, 1]], ein = []; for (let b = 0; b < 0.9999; b += 0.004) { const p = gamma(b) * b; if (p > 4.2) break; ein.push([b, p]); }
      line(g, nw, X, Y, 'rgba(255,181,71,.9)', 4, [9, 7]); line(g, ein, X, Y, '#7aa2ff', 5);
      g.strokeStyle = 'rgba(255,90,90,.6)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(X(1), y1); g.lineTo(X(1), Y(0)); g.stroke(); g.setLineDash([]);
      g.font = 'bold 18px sans-serif'; g.fillStyle = '#ffb547'; g.fillText('Newton: mv', X(0.55), Y(0.55) + 30); g.fillStyle = '#7aa2ff'; g.fillText('Einstein: γmv', X(0.52), Y(2.6));
      for (const b of [0.1, 0.5, 0.9]) dot(g, X(b), Y(gamma(b) * b), '#7aa2ff', 6);
      dot(g, X(curB), Y(Math.min(4, gamma(curB) * curB)), '#fff', 10);
      void x0; void x1;
    }, [3.3, 2.2, -1.2]);
    chFast.mesh.rotation.y = -0.25;

    // ---------------------------------------------------------------- spinning drum (1 unit = 10 cm)
    const DC = new THREE.Vector3(0.9, 2.25, 0), Rs = DR * SD;
    const tubM = new THREE.Mesh(new THREE.CylinderGeometry(TUB * SD, TUB * SD, 1.4, 64, 1, true), M.clear(0xcfe8ff, 0.1)); tubM.rotation.x = Math.PI / 2; tubM.position.copy(DC); tubM.position.z = -0.7; gDrum.add(tubM);
    const tubBack = new THREE.Mesh(new THREE.CircleGeometry(TUB * SD, 64), M.matte(0x2a2e37)); tubBack.position.set(DC.x, DC.y, -1.4); gDrum.add(tubBack);
    const tubRing = torus(TUB * SD, 0.06, M.plastic(0xeef1f5)); tubRing.position.set(DC.x, DC.y, 0); gDrum.add(tubRing);
    const drum = new THREE.Group(); drum.position.copy(DC); gDrum.add(drum);
    const NH = 36;
    for (let i = 0; i < NH; i++) {
      const a = (i / NH) * TAU, seg = box(0.08, (TAU * Rs) / NH - 0.12, 1.2, M.metal(0xc9ced8, { roughness: 0.35 }));
      seg.position.set(Math.cos(a) * Rs, Math.sin(a) * Rs, -0.7); seg.rotation.z = a; drum.add(seg);
    }
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5, lift = box(0.45, 0.25, 1.1, M.plastic(0xeef1f5)); lift.position.set(Math.cos(a) * (Rs - 0.2), Math.sin(a) * (Rs - 0.2), -0.7); lift.rotation.z = a; drum.add(lift); }
    const sock = box(0.25, 0.7, 0.6, M.matte(0xe0663a)); sock.position.set(Rs - 0.18, 0, -0.35); drum.add(sock);
    const markA = sphere(0.09, M.glow(0xffb547), 12); markA.position.set(0, Rs, 0.02); drum.add(markA);
    const ND = 160, wet = dots(ND, 0.05, 0x8ef0ff); gDrum.add(wet);
    const drnd = rng(21);
    const drops = Array.from({ length: ND }, (_, i) => ({ phi: drnd() * TAU, wait: drnd() * 1.2, out: false, p: [0, 0], v: [0, 0], life: 0 }));
    const fIn = force(0x5ce1a9, 0.05, 0.22), fOut = force(0xff5a5a, 0.05, 0.22); gDrum.add(fIn, fOut);
    const lIn = stage.label('', [0, 0, 0], gDrum, 'hot'), lOut = stage.label('', [0, 0, 0], gDrum), lSlowD = stage.label(`shown ${SLOW_D}× slower`, [DC.x, DC.y - Rs - 1.2, 0.5], gDrum);
    const chDrum = board(gDrum, 2.7, 2.1, 560, 436, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Push needed to keep circling');
      const { X, Y } = axes(g, w, h, { y1: 62, xMax: 1400, yMax: 600, xTicks: [0, 400, 800, 1200], yTicks: [0, 200, 400, 600], xFmt: (v) => v, yFmt: (v) => v + ' g', xLabel: 'rpm' });
      const pts = []; for (let n = 0; n <= 1400; n += 20) { const wv = (TAU * n) / 60; pts.push([n, (wv * wv * DR) / G]); }
      line(g, pts, X, Y, '#5ce1a9', 5);
      const wv = (TAU * curRpm) / 60; dot(g, X(curRpm), Y((wv * wv * DR) / G), '#fff', 9);
    }, [5.4, 2.6, -1.2]);
    chDrum.mesh.rotation.y = -0.2;

    // ---------------------------------------------------------------- hammer and feather
    const ground = new THREE.Mesh(new THREE.CircleGeometry(5, 64), M.matte(0x8a8f99, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = 0.005; ground.receiveShadow = true; gFall.add(ground);
    const craterM = M.matte(0x6f747d, { roughness: 1 });
    const craters = []; for (const [x, z, r] of [[-2, -1.5, 0.6], [2.4, -2.2, 0.8], [-1.2, 1.8, 0.4]]) { const c = torus(r, 0.08, craterM, 24); c.rotation.x = Math.PI / 2; c.position.set(x, 0.02, z); gFall.add(c); craters.push(c); }
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3.2, 48, 1, true), M.clear(0xcfe8ff, 0.12)); chamber.position.set(0.2, 1.6, 0); gFall.add(chamber);
    const person = makePerson({ shirt: 0xeef1f5, pants: 0xdfe3ea, skin: 0xc68b64 }); person.rotation.y = -Math.PI / 2; gFall.add(person);
    const helmet = sphere(0.19, M.clear(0xffd27a, 0.55, { depthWrite: true }), 24); helmet.position.set(0, 0.74 + 0.02, 0); person.body.add(helmet);
    const pack = box(0.22, 0.6, 0.5, M.matte(0xeef1f5)); pack.position.set(-0.26, 0.4, 0); person.body.add(pack);
    person.pose({ arm: 1.5 });
    const HZ = 0.6, XH = 0.23, XF = -0.23;
    const hammer = new THREE.Group(); gFall.add(hammer);
    hammer.add(beam([0, -0.18, 0], [0, 0.14, 0], 0.018, M.matte(0x6b4a2b)));
    const head = box(0.2, 0.05, 0.05, M.metal(0x9aa3b2)); head.position.y = 0.15; hammer.add(head);
    const feather = new THREE.Group(); gFall.add(feather);
    feather.add(beam([0, -0.14, 0], [0, 0.16, 0], 0.005, M.matte(0xe8e2d0)));
    const vane = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), M.matte(0x8a6a4a, { side: THREE.DoubleSide })); vane.scale.set(0.8, 2.2, 1); vane.position.set(0.035, 0.03, 0); feather.add(vane);
    const lH = stage.label('', [0, 0, 0], gFall, 'hot'), lF = stage.label('', [0, 0, 0], gFall), lPlace = stage.label('', [0.3, 0.05, 1.7], gFall);
    const tr = { h: [], f: [] };
    const chFall = board(gFall, 2.4, 1.8, 560, 420, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Height as they fall');
      const { X, Y } = axes(g, w, h, { y1: 62, xMax: 2, yMax: 1.6, xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [0, 0.5, 1, 1.5], xFmt: (v) => v + ' s', yFmt: (v) => v + ' m' });
      line(g, tr.f, X, Y, '#e8e2d0', 5); line(g, tr.h, X, Y, '#ffb547', 5);
      g.font = 'bold 18px sans-serif'; g.fillStyle = '#ffb547'; g.fillText('hammer', w - 190, 34); g.fillStyle = '#e8e2d0'; g.fillText('feather', w - 100, 34);
    }, [2.55, 1.7, -0.8]);
    chFall.mesh.rotation.y = -0.3;

    // ---------------------------------------------------------------- state
    const fall = { t: -0.5, yh: H0, yf: H0, vh: 0, vf: 0, wait: 0 };
    const drop = () => { Object.assign(fall, { t: -0.5, yh: H0, yf: H0, vh: 0, vf: 0, wait: 0 }); tr.h.length = 0; tr.f.length = 0; };
    const tmp = new THREE.Object3D();

    return {
      drop,
      update(dt, s) {
        dt = Math.max(0, dt);
        narrow = fitNarrow(stage, [lSlowD, lOut, lPlace]);
        if (s.focus !== focus) { focus = s.focus; gFast.visible = focus === 'fast'; gDrum.visible = focus === 'drum'; gFall.visible = focus === 'fall'; const v = VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); drop(); }

        if (focus === 'fast') {
          const b = s.beta, gm = gamma(b);
          const vis = b * 30;                                          // visual speed of the stars
          for (let i = 0; i < NS; i++) {
            const p = starP[i]; p[0] -= vis * dt * (0.6 + 0.4 * ((i % 7) / 7)); if (p[0] < -12) p[0] += 24;
            const L = Math.max(0.02, b * 2.2);
            tmp.position.set(p[0] + L / 2, p[1], p[2]); tmp.scale.set(L, 1, 1); tmp.updateMatrix(); streak.setMatrixAt(i, tmp.matrix);
            stars.place(i, p[0], p[1], p[2], 1);
          }
          streak.instanceMatrix.needsUpdate = true; stars.done();
          flame.scale.set(1, 0.4 + b * 1.6, 1); flame.position.x = -1.1 - (0.4 + b * 1.6) / 2;
          lShip.element.innerHTML = `γ = <b>${gm < 10 ? gm.toFixed(3) : gm.toFixed(1)}</b>`;
          if (Math.abs(b - curB) > 0.0005 || kF === '') { curB = b; kF = 'x'; chFast.redraw(); }
        }

        if (focus === 'drum') {
          const w = (TAU * s.rpm) / 60, wv = w / SLOW_D;               // real and shown angular speed
          spin += wv * dt;
          const frameAng = s.frame === 'drum' ? spin : 0;             // rotate the view with the drum
          drum.rotation.z = spin - frameAng;
          const tdt = dt / SLOW_D;
          for (let i = 0; i < ND; i++) {
            const q = drops[i];
            if (!q.out) {
              q.wait -= dt;
              const a = q.phi + spin;
              q.p = [Math.cos(a) * (Rs - 0.12), Math.sin(a) * (Rs - 0.12)];
              if (q.wait <= 0) { q.out = true; q.life = 0; const vt = w * DR * SD; q.v = [-Math.sin(a) * vt, Math.cos(a) * vt]; }
            } else {
              q.life += dt;
              q.v[1] -= G * SD * tdt;
              q.p[0] += q.v[0] * tdt; q.p[1] += q.v[1] * tdt;
              if (Math.hypot(q.p[0], q.p[1]) > TUB * SD - 0.05 || q.life > 3) { q.out = false; q.phi = drnd() * TAU; q.wait = 0.3 + drnd() * 1.4; }
            }
            // draw in the chosen frame
            const c = Math.cos(-frameAng), sn = Math.sin(-frameAng);
            const x = q.p[0] * c - q.p[1] * sn, y = q.p[0] * sn + q.p[1] * c;
            wet.place(i, DC.x + x, DC.y + y, -0.2, q.out ? 1 : 0.7);
          }
          wet.done();
          // forces on the sock: the wall pushes it inward; in the drum's frame an outward pull seems to balance it
          const sa = spin - frameAng, sx = Math.cos(sa) * (Rs - 0.35), sy = Math.sin(sa) * (Rs - 0.35);
          const aG = (w * w * DR) / G, len = 0.5 + Math.min(1.6, aG / 300);
          fIn.aim([DC.x + sx, DC.y + sy, 0.3], [-Math.cos(sa), -Math.sin(sa), 0], len);
          fOut.visible = s.frame === 'drum';
          if (s.frame === 'drum') fOut.aim([DC.x + sx, DC.y + sy, 0.3], [Math.cos(sa), Math.sin(sa), 0], len);
          lIn.position.set(DC.x + sx * 0.3, DC.y + sy * 0.3 + 0.35, 0.4); lIn.element.innerHTML = `wall pushes in: <b>${Math.round(aG)} g</b>`;
          lOut.visible = s.frame === 'drum' && !narrow;
          lOut.position.set(DC.x + Math.cos(sa) * (Rs + 1.3), DC.y + Math.sin(sa) * (Rs + 1.3), 0.4); lOut.element.innerHTML = '“centrifugal force”: felt, but nothing pushes';
          curRpm = s.rpm;
          const kk = `${s.rpm}`; if (kk !== kD) { kD = kk; chDrum.redraw(); }
        }

        if (focus === 'fall') {
          const P = PLACES[s.place] || PLACES.air;
          if (s.place !== place) { place = s.place; drop(); ground.material.color.setHex(place === 'moon' ? 0x8a8f99 : 0x5a4a3c); craters.forEach((c) => { c.visible = place === 'moon'; }); chamber.visible = place === 'vacuum'; helmet.visible = pack.visible = place === 'moon'; lPlace.element.innerHTML = P.name + (place === 'moon' ? ': g = 1.62 m/s²' : ': g = 9.81 m/s²'); }
          if (fall.wait > 0) { fall.wait -= dt; if (fall.wait <= 0) drop(); }
          else {
            fall.t += dt / SLOW_F;
            if (fall.t > 0) {
              const n = 4, h = dt / SLOW_F / n;
              for (let k = 0; k < n; k++) {
                if (fall.yh > 0) { fall.vh += P.g * (1 - (fall.vh / P.vtH) ** 2) * h; fall.yh = Math.max(0, fall.yh - fall.vh * h); }
                if (fall.yf > 0) { fall.vf += P.g * (1 - (fall.vf / P.vtF) ** 2) * h; fall.yf = Math.max(0, fall.yf - fall.vf * h); }
              }
              if (fall.t <= 2.05 && (!tr.h.length || fall.t - tr.h[tr.h.length - 1][0] > 0.02)) { tr.h.push([fall.t, fall.yh]); tr.f.push([fall.t, fall.yf]); }
              if ((fall.yh <= 0 && fall.yf <= 0) || fall.t > 2.1) fall.wait = 1.6;
            }
          }
          hammer.position.set(XH, fall.yh + 0.18, HZ); hammer.rotation.z = fall.yh <= 0 ? 1.45 : 0;
          if (fall.yh <= 0) hammer.position.y = 0.03;
          feather.position.set(XF, fall.yf + 0.14, HZ); feather.rotation.z = fall.yf <= 0 ? 1.5 : (P.vtF < 99 && fall.t > 0 ? Math.sin(fall.t * 9) * 0.25 : 0);
          if (fall.yf <= 0) feather.position.y = 0.01;
          person.pose({ arm: fall.t > 0 ? 1.2 : 1.5 });
          lH.position.set(XH + 0.75, Math.max(0.3, fall.yh + 0.2), HZ); lH.element.innerHTML = `hammer 1.32 kg · <b>${fall.vh.toFixed(2)} m/s</b>`;
          lF.position.set(XF - 0.75, Math.max(0.3, fall.yf + 0.2), HZ); lF.element.innerHTML = `feather 30 g · <b>${fall.vf.toFixed(2)} m/s</b>`;
          const kk = `${tr.h.length}|${s.place}`; if (kk !== kH) { kH = kk; chFall.redraw(); }
        }
      },
      readout: (s) => {
        if (s.focus === 'drum') {
          const w = (TAU * s.rpm) / 60, a = w * w * DR;
          return `<div class="big">${Math.round(a / G)} g at the drum wall</div>
            <div class="row"><span>Turning speed, ω = 2πn ÷ 60</span><b>${w.toFixed(1)} rad/s</b></div>
            <div class="row"><span>Acceleration to the centre, ω²r</span><b>${fmt(a, 0)} m/s²</b></div>
            <div class="row"><span>Push to hold 1 g of water, m ω² r</span><b>${(a / 1000).toFixed(2)} N</b></div>
            <div class="row"><span>Speed it leaves at, ω r</span><b>${(w * DR).toFixed(1)} m/s</b></div>
            <small>${s.frame === 'drum' ? 'From inside, an outward “centrifugal force” seems to fling the water. It is only inertia, seen from a spinning point of view.' : 'From outside, each drop leaves in a straight line along the tangent. Nothing pushes it outward.'}</small>`;
        }
        if (s.focus === 'fall') {
          const P = PLACES[s.place] || PLACES.air;
          return `<div class="big">${s.place === 'air' ? 'Air holds the feather back' : 'Same acceleration: they land together'}</div>
            <div class="row"><span>Hammer: weight ÷ mass</span><b>${(1.32 * P.g).toFixed(2)} N ÷ 1.32 kg = ${P.g.toFixed(2)} m/s²</b></div>
            <div class="row"><span>Feather: weight ÷ mass</span><b>${(0.03 * P.g).toFixed(3)} N ÷ 0.03 kg = ${P.g.toFixed(2)} m/s²</b></div>
            <div class="row"><span>Time to fall ${H0} m, without air</span><b>${Math.sqrt((2 * H0) / P.g).toFixed(2)} s</b></div>
            <small>${s.place === 'air' ? 'The feather soon reaches a terminal speed of under 1 m/s, where air drag balances its weight.' : 'The hammer has 44 times the weight, and 44 times the inertia. They cancel.'}</small>`;
        }
        const b = s.beta, gm = gamma(b);
        const err = (gm - 1) * 100;
        return `<div class="big">γ = ${gm < 100 ? gm.toFixed(3) : fmt(gm, 0)}${b >= 0.9 ? ': Newton is way off' : b >= 0.3 ? ': Newton is noticeably off' : ': Newton is nearly right'}</div>
          <div class="row"><span>Speed</span><b>${fmt(b * 299792.458, 0)} km/s</b></div>
          <div class="row"><span>Real momentum ÷ Newton's m v</span><b>${gm.toFixed(3)} (${err < 0.1 ? err.toFixed(3) : err.toFixed(1)}% more)</b></div>
          <div class="row"><span>Kinetic energy ÷ Newton's ½mv²</span><b>${b > 0.001 ? (((gm - 1) * 2) / (b * b)).toFixed(3) : '1.000'}</b></div>
          <small>At 0.1c γ is 1.005, at 0.5c 1.155, at 0.9c 2.294. It grows without limit as v nears c.</small>`;
      },
    };
  },
};
