// Regras de trânsito da oficina: cada carro olha à frente e freia antes de encostar em outro.
// Os corpos são retângulos orientados no chão (vista de cima), testados por eixos separadores.

// Retângulo do carro no chão, com uma folguinha para para-choque e aerofólio.
export function bodyOf(g, pad = 0.12) {
  const u = g.userData, h = g.rotation.y, s = g.scale.x || 1;
  return {
    x: g.position.x, z: g.position.z,
    ux: Math.sin(h), uz: Math.cos(h),
    hl: ((u.length || 3.4) / 2 + pad) * s,
    hw: ((u.width || 1.7) / 2 + pad) * s,
  };
}

// Pessoa: um quadradinho no chão.
export function personBody(x, z, r = 0.32) {
  return { x, z, ux: 1, uz: 0, hl: r, hw: r };
}

// Faixa logo à frente do corpo, na direção (mx, mz) em que ele vai andar.
export function probe(b, mx, mz, look, extraW = 0.04) {
  const c = b.hl + look / 2;
  return { x: b.x + mx * c, z: b.z + mz * c, ux: mx, uz: mz, hl: look / 2, hw: b.hw + extraW };
}

// Dois retângulos orientados se encostam?
export function hit(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const axes = [a.ux, a.uz, -a.uz, a.ux, b.ux, b.uz, -b.uz, b.ux];
  for (let i = 0; i < 8; i += 2) {
    const ax = axes[i], az = axes[i + 1];
    const ra = a.hl * Math.abs(a.ux * ax + a.uz * az) + a.hw * Math.abs(-a.uz * ax + a.ux * az);
    const rb = b.hl * Math.abs(b.ux * ax + b.uz * az) + b.hw * Math.abs(-b.uz * ax + b.ux * az);
    if (Math.abs(dx * ax + dz * az) > ra + rb) return false;
  }
  return true;
}

const approach = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));

// Decide a velocidade de cada carro neste quadro e anda com ele pelo caminho.
// Carro: { g, path:[{x,z,rev,soft,hold,watch,wide}], speed, cur, heading, prio, parked, ghost, wait, onDone }
// watch = { dir, lo, hi }: faixa a vigiar para trás (sentido dir, entre z=lo e z=hi) antes de começar o trecho.
// people: corpos de pedestres andando (os carros esperam eles passarem).
export function stepVehicles(list, dt, { people = [], frozen = () => false, lerpAngle }) {
  for (const v of list) {
    v.body = bodyOf(v.g);
    // Durante uma manobra larga (retorno), os outros enxergam o carro maior e mantêm distância.
    v.obody = v.path.length && v.path[0].wide && v.path[0].moved ? bodyOf(v.g, 0.9) : v.body;
    // Entrando numa faixa (depois de começar): reserva o trecho da faixa ao lado e logo atrás.
    const c = v.path.length ? v.path[0].claim : null;
    v.claim = c && (!c.first || v.path[0].moved) ? { x: v.g.position.x - c.dir * 2.25, z: c.z, ux: 1, uz: 0, hl: 4.75, hw: 1.0, dir: c.dir } : null;
    v.blk = null;
    v.near = false;
    v.blkPerson = false;
    v.step = 0;
    v.frozen = frozen(v);
  }
  for (const v of list) {
    v.holding = false;
    if (!v.path.length || v.frozen) continue;
    const p = v.path[0];
    if (!p.go) {
      if (p.hold && p.hold(v)) { v.holding = true; v.holdT = (v.holdT || 0) + dt; continue; }
      p.go = true;
      v.holdT = 0;
    }
    const g = v.g;
    const dx = p.x - g.position.x, dz = p.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    v.dist = dist;
    if (dist > 1e-4) { v.mx = dx / dist; v.mz = dz / dist; }
    const last = v.path.length === 1;
    v.want = last ? Math.min(v.speed, 1.5 + dist * 2.4) : v.speed;
    if (p.vmax) v.want = Math.min(v.want, p.vmax); // devagar nas curvas
    if (v.ghost > 0) { v.ghost -= dt; continue; }
    if (v.mx === undefined) continue;
    const look = 0.9 + (v.cur || 0) * 0.3;
    // Quase chegando num ponto de curva: olha para onde vai virar, não para o ponto.
    let px = v.mx, pz = v.mz, soft = p.soft;
    const nx = v.path[1];
    if (dist < 1.2 && nx) {
      const ex = nx.x - g.position.x, ez = nx.z - g.position.z, el = Math.hypot(ex, ez);
      if (el > 1e-3) { px = ex / el; pz = ez / el; soft = soft || nx.soft; }
    }
    const far = probe(v.body, px, pz, look);
    const near = probe(v.body, px, pz, 0.75);
    // Entrando numa faixa ou cruzando uma (p.watch): antes de começar o trecho, olha bem para trás
    // e espera quem já vem vindo. Depois de começar, quem está na faixa é que espera.
    const w = p.watch && !p.moved ? p.watch : null;
    // Bem para trás (até ~27): quem sai parado demora para pegar velocidade.
    // Esperando há mais de 2 s, ganha passagem: só vigia quem está bem perto e os de trás freiam.
    const reach = (p.waited || 0) > 2 ? 4.5 : 14;
    const back = w ? { x: g.position.x - w.dir * (reach - 0.5), z: (w.lo + w.hi) / 2, ux: 1, uz: 0, hl: reach, hw: (w.hi - w.lo) / 2 } : null;
    // Carro andando é vigiado de longe; carro parado, só se estiver bem do lado da manobra.
    const backNear = w ? { x: g.position.x - w.dir * 2.75, z: back.z, ux: 1, uz: 0, hl: 3.25, hw: back.hw } : null;
    v.blks = [];
    let watched = false;
    for (const o of list) {
      if (o === v || o.frozen || o.ghost > 0) continue;
      if (soft && o.parked) continue;
      let t = Infinity, isNear = false;
      // Alguém entrando na faixa à frente reservou um trecho: quem vem atrás no mesmo sentido para antes dele.
      if (o.claim && px * o.claim.dir > 0.5 && (o.body.x - v.body.x) * o.claim.dir > 0 && (hit(far, o.claim) || hit(v.body, o.claim))) {
        v.blks.push({ o, t: 0, near: hit(near, o.claim) });
        continue;
      }
      const moving = (o.cur || 0) >= 0.5;
      // (quem está segurando numa entrada não sai do lugar até a gente passar, então não conta)
      if (back && !o.parked && !o.holding && o.path?.length && (moving ? (o.mx || 0) * w.dir > 0.3 && hit(back, o.obody) : hit(backNear, o.obody))) { t = 0; watched = true; }
      else {
        if (!hit(far, o.obody)) continue;
        // Já encostados: só bloqueia se o outro estiver à frente (andar pioraria).
        if (hit(v.body, o.obody) && (o.body.x - v.body.x) * px + (o.body.z - v.body.z) * pz <= 0) continue;
        isNear = hit(near, o.obody);
        // Mesmo sentido e andando: acompanha. Parado, cruzando ou de frente: para.
        const ahead = (o.body.x - v.body.x) * px + (o.body.z - v.body.z) * pz > v.body.hl;
        const same = ahead && o.path?.length && (o.cur || 0) > 0.3 && o.mx !== undefined ? px * o.mx + pz * o.mz : 0;
        t = isNear ? 0 : same > 0.6 ? o.cur * 0.85 : 0;
      }
      v.blks.push({ o, t, near: isNear });
    }
    if (watched) p.waited = (p.waited || 0) + dt;
    if (!v.blks.length) for (const pb of people) if (hit(far, pb) && !hit(v.body, pb)) { v.blkPerson = true; break; }
  }
  // Preferência: quando dois carros (ou uma roda deles) esperam um pelo outro,
  // quem chegou primeiro passa e os outros esperam.
  // Primeiro critério: passa quem ainda tem espaço livre logo à frente; empatou, passa o mais antigo.
  const stopOn = (a, b) => a.blks?.find((x) => x.o === b && x.t === 0);
  const goesFirst = (v, o, mine, theirs) => (mine.near !== theirs.near ? !mine.near : (v.prio || 0) < (o.prio || 0));
  for (const v of list) {
    if (!v.blks?.length) continue;
    v.blks = v.blks.filter((x) => {
      if (x.t !== 0) return true;
      const theirs = stopOn(x.o, v);
      return !(theirs && goesFirst(v, x.o, x, theirs));
    });
  }
  for (const v of list) {
    if (!v.blks?.length) continue;
    // Roda de 3 ou mais: segue a corrente de quem está parado esperando; se voltar em v e v for o mais antigo, v passa.
    const seen = [v];
    let cur = v.blks.find((x) => x.t === 0)?.o;
    while (cur && seen.length < 8 && !seen.includes(cur)) { seen.push(cur); cur = cur.blks?.find((x) => x.t === 0)?.o; }
    if (cur === v && seen.every((o) => (v.prio || 0) <= (o.prio || 0))) v.blks = v.blks.filter((x) => !(x.t === 0 && seen.includes(x.o)));
  }
  for (const v of list) {
    v.blkTarget = Infinity;
    for (const x of v.blks || []) if (x.t < v.blkTarget || (x.t === v.blkTarget && x.near)) { v.blkTarget = x.t; v.blk = x.o; v.near = x.near; }
  }
  for (const v of list) {
    if (!v.path.length || v.frozen || v.holding || v.mx === undefined) { if (!v.path.length || v.holding) v.cur = 0; continue; }
    let target = v.want;
    if (v.blk) target = Math.min(target, v.blkTarget);
    else if (v.blkPerson) target = 0;
    const cur = v.cur || 0;
    const rate = target < cur ? (v.near ? 70 : 32) : 11;
    v.cur = approach(cur, target, rate * dt);
    // Válvula de segurança: se ficou travado muito tempo sem motivo, passa devagar e o jogo nunca congela.
    // Fila legítima (alguém lá na frente esperando sinal, vez ou entrada) não conta.
    let legit = false;
    for (let o = v.blk, k = 0; o && k < 12; o = o.blk, k++) if (o.holding) { legit = true; break; }
    v.wait = v.cur < 0.05 && (v.blk || v.blkPerson) && !legit ? (v.wait || 0) + dt : 0;
    if (v.wait > 8) { v.ghost = 2.5; v.wait = 0; }
    const p = v.path[0], g = v.g;
    const step = v.cur * dt;
    if (v.dist > 1e-3 && step > 0) {
      const want = Math.atan2(v.mx, v.mz) + (p.rev ? Math.PI : 0);
      v.heading = lerpAngle(v.heading, want, Math.min(1, dt * 9));
      g.rotation.y = v.heading;
    }
    if (step >= v.dist) {
      g.position.x = p.x;
      g.position.z = p.z;
      v.path.shift();
      if (!v.path.length && v.onDone) { const cb = v.onDone; v.onDone = null; cb(v); }
    } else if (step > 0) {
      g.position.x += v.mx * step;
      g.position.z += v.mz * step;
      p.moved = true;
    }
    v.step = Math.min(step, v.dist);
    v.rev = !!p.rev;
  }
}
