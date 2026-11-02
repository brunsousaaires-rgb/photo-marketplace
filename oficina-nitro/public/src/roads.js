// Rede de ruas por pontos de passagem (waypoints).
// Cada FAIXA tem sentido, uma lista de pontos e liga dois NÓS (cruzamentos) — ou começa/termina na beira do mapa.
// Nos cruzamentos as faixas se ligam com curvas suaves (Bézier). Uma ROTA é uma sequência de faixas
// de uma entrada do mapa até uma saída. Para crescer o mapa: acrescente faixas e nós em buildRoads().
//
// Mão de direção do jogo: o carro anda do lado esquerdo da rua no sentido dele
// (a avenida já era assim: ida pelo lado da oficina, volta pelo lado da praça).

export const ROAD = {
  C1: -19, // rua lateral (esquerda da oficina), cruza a avenida (longe da cerca do terreno da esquerda)
  C2: 66, // rua transversal (direita), cruza a avenida e tem semáforo
  BZ: -13, // Rua dos Fundos, liga a lateral à transversal por trás da oficina
  HALF: 3.5, // meia largura das ruas
  LANE: 1.6, // distância do centro da rua até o meio de cada faixa
  XMIN: -72, XMAX: 128, // pontas da avenida
  ZN: -44, // ponta norte da transversal
};

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// Curva entre o fim de uma faixa e o começo da próxima (passando pelo cruzamento).
function turnPoints(p0, d0, p1, d1, n = 6) {
  const cross = d0[0] * d1[1] - d0[1] * d1[0];
  if (Math.abs(cross) < 1e-3) return [p1]; // reto
  // Ponto de controle: onde a reta de chegada encontra a reta de saída.
  const w = sub(p1, p0);
  const t = (w[0] * d1[1] - w[1] * d1[0]) / cross;
  const c = [p0[0] + d0[0] * t, p0[1] + d0[1] * t];
  const out = [];
  for (let i = 1; i <= n; i++) {
    const k = i / n, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, e = k * k;
    out.push([a * p0[0] + b * c[0] + e * p1[0], a * p0[1] + b * c[1] + e * p1[1]]);
  }
  return out;
}

export function buildRoads({ D, passZ, trafZ }) {
  const { C1, C2, BZ, LANE: L, XMIN, XMAX, ZN } = ROAD;
  const zs = D + 56; // ponta sul das ruas transversais
  const northEdge = D - 0.6, southEdge = D + 12.8; // faixas de parada das ruas que chegam na avenida
  const S = 5.6; // recuo da faixa de parada até o centro do cruzamento (o bico do carro parado não atrapalha quem vira)
  const lanes = {};
  const lane = (id, a, b, from, to) => {
    lanes[id] = { id, pts: [a, b], from, to, dir: norm(sub(b, a)) };
  };
  // Avenida (ida +x no lado da oficina, volta -x no lado da praça).
  lane('AE1', [XMIN, passZ], [C1 - S, passZ], null, 'I1');
  lane('AE2', [C1 + S, passZ], [C2 - S, passZ], 'I1', 'I2');
  lane('AE3', [C2 + S, passZ], [XMAX, passZ], 'I2', null);
  lane('AW1', [XMAX, trafZ], [C2 + S, trafZ], null, 'I2');
  lane('AW2', [C2 - S, trafZ], [C1 + S, trafZ], 'I2', 'I1');
  lane('AW3', [C1 - S, trafZ], [XMIN, trafZ], 'I1', null);
  // Rua lateral: parte sul (vai para o bairro) e parte norte (sobe até a Rua dos Fundos).
  lane('C1S_out', [C1 + L, southEdge], [C1 + L, zs], 'I1', null);
  lane('C1S_in', [C1 - L, zs], [C1 - L, southEdge], null, 'I1');
  lane('C1N_up', [C1 - L, northEdge], [C1 - L, BZ + S], 'I1', 'I3');
  lane('C1N_down', [C1 + L, BZ + S], [C1 + L, northEdge], 'I3', 'I1');
  // Rua dos Fundos.
  lane('BE', [C1 + S, BZ - L], [C2 - S, BZ - L], 'I3', 'I4');
  lane('BW', [C2 - S, BZ + L], [C1 + S, BZ + L], 'I4', 'I3');
  // Rua transversal: norte (até a ponta do mapa), meio (fundos ↔ avenida) e sul.
  lane('C2F_up', [C2 - L, BZ - S], [C2 - L, ZN], 'I4', null);
  lane('C2F_in', [C2 + L, ZN], [C2 + L, BZ - S], null, 'I4');
  lane('C2M_up', [C2 - L, northEdge], [C2 - L, BZ + S], 'I2', 'I4');
  lane('C2M_down', [C2 + L, BZ + S], [C2 + L, northEdge], 'I4', 'I2');
  lane('C2S_out', [C2 + L, southEdge], [C2 + L, zs], 'I2', null);
  lane('C2S_in', [C2 - L, zs], [C2 - L, southEdge], null, 'I2');

  // Cruzamentos: caixa (onde ninguém deve parar) e qual eixo é a "preferencial".
  const nodes = {
    I1: { x: C1, z: (northEdge + southEdge) / 2, hx: ROAD.HALF + 0.6, hz: (southEdge - northEdge) / 2 + 0.2, main: 'x' },
    I2: { x: C2, z: (northEdge + southEdge) / 2, hx: ROAD.HALF + 0.6, hz: (southEdge - northEdge) / 2 + 0.2, main: 'x', signal: true },
    I3: { x: C1, z: BZ, hx: ROAD.HALF + 0.6, hz: ROAD.HALF + 0.6, main: null },
    I4: { x: C2, z: BZ, hx: ROAD.HALF + 0.6, hz: ROAD.HALF + 0.6, main: 'z' },
  };

  for (const [k, n] of Object.entries(nodes)) n.id = k;

  const out = (node) => Object.values(lanes).filter((l) => l.from === node);
  // Todas as rotas de uma entrada até uma saída, sem passar duas vezes no mesmo cruzamento.
  const routes = [];
  const walk = (path, seen) => {
    const last = path[path.length - 1];
    if (!last.to) { routes.push(path.map((l) => l.id)); return; }
    for (const nx of out(last.to)) {
      if (seen.has(nx.to)) continue;
      const u = nx.dir[0] * last.dir[0] + nx.dir[1] * last.dir[1];
      if (u < -0.9) continue; // sem retorno no meio do cruzamento
      walk([...path, nx], new Set([...seen, last.to]));
    }
  };
  for (const l of Object.values(lanes)) if (!l.from) walk([l], new Set());

  return { lanes, nodes, routes, ROAD };
}

// Transforma uma rota (lista de faixas) em pontos para o carro seguir.
// hooks(laneIn, laneOut, node) devolve uma espera (hold) para o ponto de entrada do cruzamento, se precisar.
export function routePoints(net, route, hooks = () => null) {
  const pts = [];
  route.forEach((id, i) => {
    const l = net.lanes[id];
    if (i === 0) pts.push({ x: l.pts[0][0], z: l.pts[0][1] });
    const next = net.lanes[route[i + 1]];
    // O carro anda até a faixa de parada (fim da faixa) e só espera ali, antes de entrar no cruzamento:
    // por isso a espera vai no primeiro ponto DEPOIS da faixa de parada.
    pts.push({ x: l.pts[1][0], z: l.pts[1][1] });
    if (next) {
      const turn = Math.abs(l.dir[0] * next.dir[1] - l.dir[1] * next.dir[0]) > 0.5;
      const hold = hooks(l, next, net.nodes[l.to]);
      turnPoints(l.pts[1], l.dir, next.pts[0], next.dir).forEach(([x, z], k) => pts.push({ x, z, vmax: turn ? 6 : null, hold: k === 0 ? hold : null }));
    }
  });
  return pts;
}

// Tipos de veículo que circulam pela cidade. Para acrescentar entrega, ônibus ou especiais no futuro,
// é só criar um tipo aqui (modelo, velocidade e com que frequência aparece).
export const VEHICLE_KINDS = {
  carro: { weight: 10, speed: [8, 12.5], spec: (pick) => ({ type: pick(['hatch', 'sedan', 'pickup', 'esportivo', 'van', 'jipe']) }) },
  taxi: { weight: 1.5, speed: [9, 12], spec: () => ({ type: 'sedan', color: 'amarelo', decal: 'xadrez' }) },
  entrega: { weight: 1.2, speed: [7, 9.5], spec: () => ({ type: 'van', color: 'branco', decal: 'listras' }) },
};
