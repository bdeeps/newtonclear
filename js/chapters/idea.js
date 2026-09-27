// Chapter 1: Newton's three laws as three live experiments on a 9 m track (1 scene unit = 1 m).
// Law 1: a puck launched at v0 slides with kinetic friction μk, so it slows at a = μk·g and stops
//   after d = v0² ÷ (2μk·g). With μk = 0 it never slows. The μ values named for surfaces are rough
//   textbook figures (e.g. Serway & Jewett, Physics for Scientists and Engineers, table 5.1).
// Law 2: a cart on an air track (friction negligible) pushed by a steady force F: a = F ÷ m,
//   v = a·t, x = ½·a·t², momentum p = m·v.
// Law 3: two skaters push apart with force F for 0.4 s. Each feels the same force the other way,
//   so each gains momentum F·Δt in opposite directions: m₁v₁ = −m₂v₂ and the total stays zero.
//   Ice friction on skates is tiny (μ ≈ 0.003–0.007), so it is left out over a few seconds.
import { THREE, M, box, approach, clamp } from '../kit.js';
import { G, board, panelBg, axes, dot, title, line, force, makeCart, makePerson, ruler, fitNarrow, fmt, sgn } from '../newton.js';

const X0 = -4, X1 = 4.2;                   // start and end of each run, m
const PUSH_T = 0.4;                        // skaters' push lasts 0.4 s
const SURF = [[0, 'nothing: like an air track, or space'], [0.02, 'ice'], [0.1, 'a polished floor'], [0.3, 'wood'], [0.5, 'carpet']];
const surfName = (mu) => SURF.reduce((a, b) => (Math.abs(b[0] - mu) < Math.abs(a[0] - mu) ? b : a))[1];
const VIEWS = {
  law1: { pos: [0.3, 3.1, 7.9], target: [0.3, 1.75, 0] },
  law2: { pos: [0.3, 3.1, 7.9], target: [0.3, 1.75, 0] },
  law3: { pos: [0.3, 3.2, 7.9], target: [0.3, 1.95, 0] },
};

export default {
  id: 'idea',
  short: 'The laws, live',
  title: 'Three rules for everything that moves',
  subtitle: 'Things keep going, force changes motion, and every push pushes back.',
  view: VIEWS.law1,
  learn: `<p>In 1687 Isaac Newton wrote down three rules that describe how everything moves, from a cricket ball to the Moon.</p>
    <p><b>1. The law of inertia.</b> Something that is still stays still, and something that is moving keeps moving in a straight line at the same speed, <b>unless a force acts on it</b>. A puck on ice slows down only because friction pushes back on it. Take the friction away and it would glide for ever. This laziness of matter is called <b>inertia</b>.</p>
    <p><b>2. F = m × a.</b> A force makes things <b>accelerate</b>, which means change their speed or direction. Twice the force, twice the acceleration. Twice the mass, half the acceleration. Force is measured in <b>newtons</b> (N): one newton gives 1 kg an extra 1 m/s of speed every second. A newton is about the weight of a small apple.</p>
    <p><b>3. Action and reaction.</b> Forces come in pairs. When you push on something, it pushes back on you <b>just as hard</b>, the other way. Two skaters who push apart both move, and the lighter one moves faster.</p>
    <p>A useful quantity ties them together: <b>momentum</b>, p = m × v. A force changes momentum, and in a push between two things, what one gains the other loses.</p>
    <p class="tip"><b>Try it:</b> set friction to zero and watch the puck never slow down. Then give the cart more mass with the same force, and make a light skater push a heavy one.</p>`,
  terms: [
    { t: 'Inertia', d: 'The way matter resists any change in its motion. More mass means more inertia.' },
    { t: 'Force', d: 'A push or a pull, measured in newtons (N). Forces change how things move.' },
    { t: 'Acceleration', d: 'How fast the velocity changes, in metres per second, every second (m/s²).' },
    { t: 'Newton (N)', d: 'The force that makes 1 kg speed up by 1 m/s every second. About the weight of a 100 g apple.' },
    { t: 'Friction', d: 'The force between surfaces that rub, always acting against the sliding.' },
    { t: 'Momentum (p)', d: 'Mass × velocity. It is what a force changes, and it is shared out in every push.' },
  ],
  defaults: { law: 'law1', mu: 0.1, v0: 4, F: 4, m: 2, m1: 40, m2: 80, push: 200 },
  controls: [
    { key: 'law', type: 'seg', label: 'Show', options: [{ v: 'law1', label: '1 · Inertia' }, { v: 'law2', label: '2 · F = ma' }, { v: 'law3', label: '3 · Push back' }] },
    { key: 'mu', type: 'range', label: 'Law 1: friction under the puck (μ)', min: 0, max: 0.5, step: 0.01, ends: ['none', 'carpet'], fmt: (v) => v.toFixed(2), hint: 'Roughly: ice 0.02, polished floor 0.1, wood 0.3.' },
    { key: 'v0', type: 'range', label: 'Law 1: launch speed', min: 1, max: 6, step: 0.1, ends: ['1 m/s', '6 m/s'], fmt: (v) => v.toFixed(1) + ' m/s' },
    { key: 'F', type: 'range', label: 'Law 2: steady push on the cart (F)', min: 0, max: 10, step: 0.5, ends: ['0 N', '10 N'], fmt: (v) => v.toFixed(1) + ' N' },
    { key: 'm', type: 'range', label: 'Law 2: cart mass (m)', min: 1, max: 10, step: 1, ends: ['1 kg', '10 kg'], fmt: (v) => v + ' kg', hint: 'Each brass block is 1 kg; the empty cart is 1 kg.' },
    { key: 'm1', type: 'range', label: 'Law 3: left skater', min: 25, max: 100, step: 1, ends: ['25 kg', '100 kg'], fmt: (v) => v + ' kg' },
    { key: 'm2', type: 'range', label: 'Law 3: right skater', min: 25, max: 100, step: 1, ends: ['25 kg', '100 kg'], fmt: (v) => v + ' kg' },
    { key: 'push', type: 'range', label: 'Law 3: how hard they push', min: 50, max: 400, step: 10, ends: ['50 N', '400 N'], fmt: (v) => v + ' N for 0.4 s' },
    { key: 'go', type: 'buttons', label: 'Start again', items: [{ label: 'Launch the puck', act: (s, inst) => { s.law = 'law1'; inst.restart('law1'); } }, { label: 'Release the cart', act: (s, inst) => { s.law = 'law2'; inst.restart('law2'); } }, { label: 'Push apart', act: (s, inst) => { s.law = 'law3'; inst.restart('law3'); } }] },
  ],
  quiz: [
    { q: 'A puck slides across perfectly frictionless ice. What happens to its speed?', options: ['It slowly runs out of force and stops', 'It stays exactly the same', 'It speeds up', 'It slows, but only a little'], answer: 1, why: 'Newton’s first law: with no force acting, the velocity does not change. Things don’t need a force to keep moving, only to change their motion.' },
    { q: 'A 2 kg cart is pushed with a steady 6 N. What is its acceleration?', options: ['12 m/s²', '3 m/s²', '0.33 m/s²', '8 m/s²'], answer: 1, why: 'a = F ÷ m = 6 ÷ 2 = 3 m/s². Every second it goes 3 m/s faster.' },
    { q: 'A 40 kg child and an 80 kg adult on skates push apart. Who pushes harder, and who moves faster?', options: ['The adult pushes harder; the adult moves faster', 'They push equally hard; the child moves twice as fast', 'The child pushes harder; the child moves faster', 'They push equally hard; they move at the same speed'], answer: 1, why: 'Newton’s third law makes the forces equal and opposite. The same force on half the mass gives twice the speed, so the momenta cancel.' },
  ],
  reel: [
    { ms: 5400, caption: 'Second law: acceleration equals force divided by mass. Double the mass, half the acceleration.', set: { law: 'law2', F: 6, m: 2 }, act: (s, inst) => inst.restart('law2'), anim: { m: [1, 6] }, spin: 0 },
    { ms: 5000, caption: 'Third law: every push pushes back just as hard. The lighter skater moves faster.', set: { law: 'law3', m1: 40, m2: 80, push: 250 }, act: (s, inst) => inst.restart('law3'), spin: 0.1 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const st1 = { x: X0, v: 0, t: 0, wait: 0 };
    const st2 = { x: X0, v: 0, t: 0, wait: 0 };
    const st3 = { t: -0.6, xA: -0.52, xB: 0.52, vA: 0, vB: 0, mA: 40, mB: 80, wait: 0 };
    const groups = { law1: new THREE.Group(), law2: new THREE.Group(), law3: new THREE.Group() };
    Object.values(groups).forEach((g) => root.add(g));

    // ---------------------------------------------------------------- law 1: the puck
    const L1 = groups.law1;
    const surfMat = M.matte(0xbfe6ff, { roughness: 0.4 });
    const deck = box(9.4, 0.12, 1.5, surfMat); deck.position.set(0, 0.06, 0); L1.add(deck);
    L1.add(ruler(-4.5, 4.5, 0.6, 0.125));
    for (const x of [-4.75, 4.75]) { const end = box(0.1, 0.22, 1.5, M.matte(0x4a505c)); end.position.set(x, 0.11, 0); L1.add(end); }
    const puck = new THREE.Group(); L1.add(puck);
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 40), M.matte(0x15171c, { roughness: 0.6 })); pBody.position.y = 0.18; pBody.castShadow = true; puck.add(pBody);
    const pRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 8, 40), M.glow(0x7aa2ff)); pRing.rotation.x = Math.PI / 2; pRing.position.y = 0.245; puck.add(pRing);
    const vArrow1 = force(0x5ce1a9); L1.add(vArrow1);
    const fArrow1 = force(0xff7a59); L1.add(fArrow1);
    const lPuck = stage.label('', [0, 0.9, 0], puck, 'hot');
    const lSurf = stage.label('', [2.6, 0.2, 1.05], L1);
    const trace1 = [];
    const ch1 = board(L1, 3.6, 1.8, 640, 320, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Speed of the puck', 'while it slides');
      const { X, Y } = axes(g, w, h, { y1: 56, y0: h - 50, xMax: 6, yMax: 6, xTicks: [0, 1, 2, 3, 4, 5, 6], yTicks: [0, 2, 4, 6], xFmt: (v) => v + ' s', yFmt: (v) => v + ' m/s' });
      line(g, trace1, X, Y, '#5ce1a9', 5);
      if (trace1.length) { const [t, v] = trace1[trace1.length - 1]; dot(g, X(Math.min(6, t)), Y(v), '#5ce1a9', 8); }
    }, [2.55, 2.45, -1.0]);

    // ---------------------------------------------------------------- law 2: the cart
    const L2 = groups.law2;
    const track = box(9.4, 0.1, 0.7, M.metal(0xb9bec8, { roughness: 0.3 })); track.position.set(0, 0.05, 0); L2.add(track);
    for (const x of [-4.5, 4.5]) { const leg = box(0.12, 0.05, 0.9, M.matte(0x4a505c)); leg.position.set(x, 0.025, 0); L2.add(leg); }
    L2.add(ruler(-4.5, 4.5, 0.48, 0.105));
    const cart = makeCart(0x3b82f6); cart.position.y = 0.03; L2.add(cart);
    const fArrow2 = force(0xffb547, 0.045, 0.24); L2.add(fArrow2);
    const vArrow2 = force(0x5ce1a9); L2.add(vArrow2);
    const lF = stage.label('', [0, 0, 0], L2, 'hot');
    const lCart = stage.label('', [0, 1.35, 0], cart);
    const trace2 = [];
    const ch2 = board(L2, 3.3, 2.53, 600, 460, (g, w, h) => {
      panelBg(g, w, h); title(g, 'The cart, second by second');
      const rows = [['acceleration', 'm/s²', 10, '#ffb547', 1], ['velocity', 'm/s', 12, '#5ce1a9', 2], ['position', 'm', 12, '#8ef0ff', 3]];
      rows.forEach(([name, unit, max, col, k], i) => {
        const top = 58 + i * 132, bot = top + 100;
        const X = (t) => 84 + (t / 5) * (w - 112), Y = (v) => bot - (v / max) * (bot - top);
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(84, top); g.lineTo(84, bot); g.lineTo(w - 28, bot); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '17px sans-serif';
        g.fillText(`${max} ${unit}`, 80 - g.measureText(`${max} ${unit}`).width, top + 12); g.fillText('0', 64, bot + 5);
        g.fillStyle = col; g.font = 'bold 18px sans-serif'; g.fillText(name, 96, top + 14);
        if (i === 2) { g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; for (const t of [0, 1, 2, 3, 4, 5]) g.fillText(t + ' s', X(t) - 10, bot + 22); }
        line(g, trace2.map((p) => [p[0], Math.min(max, p[k])]), X, Y, col, 5);
      });
    }, [2.6, 2.55, -1.0]);

    // ---------------------------------------------------------------- law 3: skaters
    const L3 = groups.law3;
    const rink = box(10, 0.08, 4, M.matte(0xe4f1fb, { roughness: 0.25 })); rink.position.set(0, 0.04, 0); L3.add(rink);
    for (const z of [-2.05, 2.05]) { const b = box(10, 0.4, 0.1, M.plastic(0xf2f4f7)); b.position.set(0, 0.2, z); L3.add(b); }
    const mark = box(0.06, 0.005, 4, M.glow(0xff5a5a)); mark.position.set(0, 0.085, 0); L3.add(mark);
    const skA = makePerson({ shirt: 0xe0663a, pants: 0x2b3242 }); L3.add(skA);
    const skB = makePerson({ shirt: 0x3b6fd8, pants: 0x1f2a3a }); skB.rotation.y = Math.PI; L3.add(skB);
    for (const p of [skA, skB]) p.legs.forEach((l) => { const blade = box(0.3, 0.02, 0.02, M.metal(0xd8dde6)); blade.position.set(0.05, -0.93, 0); l.add(blade); });
    const fA = force(0xffb547, 0.04, 0.22), fB = force(0xffb547, 0.04, 0.22); L3.add(fA, fB);
    const vA = force(0x5ce1a9), vB = force(0x5ce1a9); L3.add(vA, vB);
    const lA = stage.label('', [0, 2.35, 0], skA, 'hot');
    const lB = stage.label('', [0, 2.35, 0], skB, 'hot');
    const lPush = stage.label('', [0, 1.95, 0.9], L3);
    const ch3 = board(L3, 3.0, 2.09, 560, 390, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Momentum, p = m × v');
      const pA = st3.mA * st3.vA, pB = st3.mB * st3.vB, MAX = 160;
      const mid = h / 2 + 18, Xc = w / 2, sc = (w / 2 - 40) / MAX;
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(Xc, 60); g.lineTo(Xc, h - 40); g.stroke();
      const bar = (y, p, col, label) => {
        g.fillStyle = col; const L = clamp(p, -MAX, MAX) * sc; g.fillRect(Math.min(Xc, Xc + L), y - 18, Math.abs(L), 36);
        g.font = '18px sans-serif'; g.fillStyle = '#e8eef8'; const t = `${label}: ${sgn(p, 0)} kg·m/s`;
        g.fillText(t, p < 0 ? Xc + 12 : Xc - 12 - g.measureText(t).width, y + 6);
      };
      bar(mid - 70, pA, '#e0663a', 'left');
      bar(mid - 10, pB, '#3b6fd8', 'right');
      bar(mid + 50, pA + pB, '#5ce1a9', 'total');
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '16px sans-serif'; g.fillText('← to the left', 30, h - 16); g.fillText('to the right →', w - 136, h - 16);
    }, [2.9, 3.1, -2.0]);

    // ---------------------------------------------------------------- state
    let S = null, law = '', k1 = '', k2 = '', k3 = '';
    const restart = (which) => {
      if (which === 'law1') { Object.assign(st1, { x: X0, v: S ? S.v0 : 4, t: 0, wait: 0 }); trace1.length = 0; }
      if (which === 'law2') { Object.assign(st2, { x: X0, v: 0, t: 0, wait: 0 }); trace2.length = 0; }
      if (which === 'law3') Object.assign(st3, { t: -0.6, xA: -0.52, xB: 0.52, vA: 0, vB: 0, wait: 0 });
    };
    restart('law1'); restart('law2');

    return {
      restart,
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        fitNarrow(stage, [lSurf, lPush]);
        if (s.law !== law) { law = s.law; for (const k in groups) groups[k].visible = k === law; const v = VIEWS[law]; stage.setView(v.pos, v.target, 1.0); restart(law); }

        if (law === 'law1') {
          // ---- inertia and friction
          surfMat.color.setHex(0xbfe6ff).lerp(new THREE.Color(0x8a5a3c), clamp(s.mu / 0.5, 0, 1));
          if (st1.wait > 0) { st1.wait -= dt; if (st1.wait <= 0) restart('law1'); }
          else {
            const n = 4, h = dt / n;
            for (let i = 0; i < n; i++) { if (st1.v > 0) { st1.v = Math.max(0, st1.v - s.mu * G * h); st1.x += st1.v * h; st1.t += h; } }
            if (st1.t < 6.05 && (trace1.length === 0 || st1.t - trace1[trace1.length - 1][0] > 0.05)) trace1.push([st1.t, st1.v]);
            if (st1.x > X1) { st1.x = X1; st1.wait = 0.9; }
            else if (st1.v <= 0) st1.wait = 1.6;
          }
          puck.position.x = st1.x;
          vArrow1.aim([st1.x, 0.72, 0], [1, 0, 0], st1.v * 0.28);
          fArrow1.aim([st1.x - 0.25, 0.17, 0], [-1, 0, 0], st1.v > 0 ? s.mu * 3.2 : 0);
          lPuck.element.innerHTML = st1.v > 0 ? `<b>${st1.v.toFixed(2)} m/s</b>` : 'stopped';
          lSurf.element.innerHTML = `Surface: ${surfName(s.mu)}`;
          const kk = `${trace1.length}|${st1.t.toFixed(2)}`; if (kk !== k1) { k1 = kk; ch1.redraw(); }
        }

        if (law === 'law2') {
          // ---- F = ma on an air track
          cart.setLoad(Math.round(s.m) - 1);
          const a = s.F / s.m;
          if (st2.wait > 0) { st2.wait -= dt; if (st2.wait <= 0) restart('law2'); }
          else {
            const n = 4, h = dt / n;
            for (let i = 0; i < n; i++) { st2.v += a * h; st2.x += st2.v * h; st2.t += h; }
            if (st2.t <= 5.02 && (trace2.length === 0 || st2.t - trace2[trace2.length - 1][0] > 0.05)) trace2.push([st2.t, a, st2.v, st2.x - X0]);
            if (st2.x > X1 || st2.t > 7) { st2.x = Math.min(st2.x, X1); st2.wait = 1.1; }
          }
          const dx = st2.x - cart.position.x; cart.position.x = st2.x; cart.roll(dx);
          const moving = st2.wait <= 0;
          fArrow2.aim([st2.x - 0.45 - s.F * 0.16, 0.24, 0], [1, 0, 0], moving ? s.F * 0.16 : 0);
          vArrow2.aim([st2.x, 1.1, 0], [1, 0, 0], st2.v * 0.12);
          lF.position.set(st2.x - 0.45 - s.F * 0.08, 0.62, 0.3);
          lF.visible = moving && s.F > 0;
          lF.element.innerHTML = `F = <b>${s.F.toFixed(1)} N</b>`;
          lCart.element.innerHTML = `${s.m} kg · <b>${st2.v.toFixed(2)} m/s</b>`;
          lCart.position.y = 1.0 + Math.floor((s.m - 1 + 2) / 3) * 0.08;
          const kk = `${trace2.length}|${s.m}|${s.F}`; if (kk !== k2) { k2 = kk; ch2.redraw(); }
        }

        if (law === 'law3') {
          // ---- action and reaction
          st3.mA = s.m1; st3.mB = s.m2;
          const sc = (m) => Math.pow(m / 75, 1 / 3);
          skA.scale.setScalar(sc(s.m1)); skB.scale.setScalar(sc(s.m2));
          let pushing = false;
          if (st3.wait > 0) { st3.wait -= dt; if (st3.wait <= 0) restart('law3'); }
          else {
            st3.t += dt;
            if (st3.t > 0 && st3.t <= PUSH_T) { pushing = true; st3.vA -= (s.push / s.m1) * dt; st3.vB += (s.push / s.m2) * dt; }
            if (st3.t > PUSH_T + 0.02 && st3.t - dt <= PUSH_T + 0.02) { st3.vA = -(s.push * PUSH_T) / s.m1; st3.vB = (s.push * PUSH_T) / s.m2; }
            st3.xA += st3.vA * dt; st3.xB += st3.vB * dt;
            if (st3.xA < -4.4 || st3.xB > 4.4) st3.wait = 1.0;
          }
          const armA = clamp(0.52 * 2 / Math.max(1.04, st3.xB - st3.xA), 0, 1);
          skA.position.x = st3.xA - 0.48 * sc(s.m1); skB.position.x = st3.xB + 0.48 * sc(s.m2);
          const reach = st3.t < PUSH_T + 0.1;
          skA.pose({ arm: reach ? 1.45 : 0.4, lean: reach ? 0.08 : -0.05, stride: 0.12 });
          skB.pose({ arm: reach ? 1.45 : 0.4, lean: reach ? 0.08 : -0.05, stride: 0.12 });
          fA.aim([st3.xA - 0.1, 1.45, 0.35], [-1, 0, 0], pushing ? s.push / 180 : 0);
          fB.aim([st3.xB + 0.1, 1.45, 0.35], [1, 0, 0], pushing ? s.push / 180 : 0);
          vA.aim([skA.position.x, 0.25, 0.7], [-1, 0, 0], Math.abs(st3.vA) * 0.7);
          vB.aim([skB.position.x, 0.25, 0.7], [1, 0, 0], Math.abs(st3.vB) * 0.7);
          lA.element.innerHTML = `${s.m1} kg · <b>${Math.abs(st3.vA).toFixed(2)} m/s</b>`;
          lB.element.innerHTML = `${s.m2} kg · <b>${Math.abs(st3.vB).toFixed(2)} m/s</b>`;
          lA.position.y = 2.2; lB.position.y = 2.2;
          lPush.position.set((st3.xA + st3.xB) / 2, 0.15, 1.5);
          lPush.visible = pushing; lPush.element.innerHTML = `Each pushes the other with <b>${s.push} N</b>`;
          void armA;
          const kk = `${st3.vA.toFixed(3)}|${st3.vB.toFixed(3)}`; if (kk !== k3) { k3 = kk; ch3.redraw(); }
        }
      },
      readout: (s) => {
        if (s.law === 'law2') {
          const a = s.F / s.m, t = Math.min(st2.t, 99);
          return `<div class="big">a = F ÷ m = ${s.F.toFixed(1)} ÷ ${s.m} = ${a.toFixed(2)} m/s²</div>
            <div class="row"><span>Time since release</span><b>${t.toFixed(2)} s</b></div>
            <div class="row"><span>Velocity, v = a × t</span><b>${st2.v.toFixed(2)} m/s</b></div>
            <div class="row"><span>Distance, x = ½ a t²</span><b>${(st2.x - X0).toFixed(2)} m</b></div>
            <div class="row"><span>Momentum, p = m × v</span><b>${(s.m * st2.v).toFixed(1)} kg·m/s</b></div>
            <small>${s.F === 0 ? 'No force, no acceleration: the cart stays put.' : 'The same push on twice the mass gives half the acceleration.'}</small>`;
        }
        if (s.law === 'law3') {
          const J = s.push * PUSH_T, vA = J / s.m1, vB = J / s.m2;
          return `<div class="big">Equal pushes, ${vA >= vB ? `the left skater ${(vA / vB).toFixed(1)}× faster` : `the right skater ${(vB / vA).toFixed(1)}× faster`}</div>
            <div class="row"><span>Force on each, for 0.4 s</span><b>${s.push} N, opposite ways</b></div>
            <div class="row"><span>Left: v = F·t ÷ m</span><b>${vA.toFixed(2)} m/s ←</b></div>
            <div class="row"><span>Right: v = F·t ÷ m</span><b>${vB.toFixed(2)} m/s →</b></div>
            <div class="row"><span>Momentum: left + right</span><b>−${(s.m1 * vA).toFixed(0)} + ${(s.m2 * vB).toFixed(0)} = 0</b></div>
            <small>Before the push the total momentum was zero, and it still is.</small>`;
        }
        const stopD = s.mu > 0 ? (s.v0 * s.v0) / (2 * s.mu * G) : Infinity;
        return `<div class="big">${s.mu === 0 ? 'No friction: it never slows down' : `Friction slows it by ${(s.mu * G).toFixed(2)} m/s every second`}</div>
          <div class="row"><span>Speed now</span><b>${st1.v.toFixed(2)} m/s</b></div>
          <div class="row"><span>Friction force per kg, μ × g</span><b>${(s.mu * G).toFixed(2)} N</b></div>
          <div class="row"><span>Stops after, v₀² ÷ 2μg</span><b>${isFinite(stopD) ? (stopD > 999 ? 'over 1 km' : stopD.toFixed(1) + ' m') : 'never'}</b></div>
          <small>${stopD > X1 - X0 ? `It would slide off the end of the ${(X1 - X0).toFixed(0)} m track. ` : ''}It isn’t running out of push: friction is taking its speed away.</small>`;
      },
    };
  },
};
