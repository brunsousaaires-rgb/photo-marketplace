// Catálogos do jogo: construções, peças, carros, serviços, corridas e progressão.
// Tudo aqui é dado puro — servidor e cliente podem compartilhar.

export const TILE = 2; // tamanho de um quadrado do terreno em unidades 3D
export const GRID_H = 9;
export const BASE_W = 16;

// Terrenos vizinhos que podem ser comprados (expandem o lote para a direita).
export const LAND = [
  { id: 'leste1', name: 'Terreno vizinho', cols: 6, cost: 1200, lvl: 3 },
  { id: 'leste2', name: 'Terreno da esquina', cols: 6, cost: 4500, lvl: 6 },
];
export const MAX_W = BASE_W + LAND.reduce((a, l) => a + l.cols, 0);
export const TRACK = { name: 'Pista de Corrida', cost: 6000, lvl: 6 };

export function xpNeed(level) {
  return Math.round(45 * level ** 1.55);
}

// limit: [[nível, quantidade máxima], ...]   build: segundos de obra
export const BUILDINGS = {
  escritorio: { name: 'Escritório', w: 3, d: 3, fixed: true, icon: '🏢', desc: 'O coração da sua oficina.' },
  elevador: {
    name: 'Elevador', icon: '🔧', w: 2, d: 3, service: 'repair', unlock: 1, cat: 'servicos', build: 8,
    cost: [0, 250, 900, 2500], limit: [[1, 2], [4, 3], [8, 4]],
    upCost: [180, 480, 1200, 2800], speed: [1, 1.3, 1.65, 2.05, 2.6],
    desc: 'Consertos: pneus, óleo, freios, suspensão, funilaria e motor.',
  },
  cabine: {
    name: 'Cabine de Estilo', icon: '🎨', w: 2, d: 3, service: 'custom', unlock: 1, cat: 'servicos', build: 10,
    cost: [0, 3500], limit: [[1, 1], [7, 2]],
    upCost: [300, 800, 1800, 4000], tip: [0, 0.1, 0.2, 0.32, 0.45],
    desc: 'Pinte e personalize do jeito que o cliente pediu. Nível maior = gorjetas maiores.',
  },
  lavajato: {
    name: 'Lava-Jato', icon: '🫧', w: 2, d: 3, service: 'wash', unlock: 2, cat: 'servicos', build: 8,
    cost: [300, 1600], limit: [[2, 1], [6, 2]],
    upCost: [160, 420, 1000, 2400], speed: [1, 1.3, 1.65, 2.05, 2.6],
    desc: 'Lavagem, polimento e higienização. Dinheiro rápido!',
  },
  loja: {
    name: 'Loja de Peças', icon: '🏪', w: 2, d: 2, unlock: 3, cat: 'servicos', build: 8,
    cost: [400, 2200], limit: [[3, 1], [8, 2]],
    upCost: [250, 650, 1500, 3500], rate: [0.5, 0.85, 1.35, 2, 3], cap: [90, 200, 420, 800, 1400],
    desc: 'Vende peças sozinha, até enquanto você está fora. Toque para recolher.',
  },
  posto: {
    name: 'Posto de Combustível', icon: '⛽', w: 3, d: 3, service: 'fuel', unlock: 4, cat: 'servicos', build: 12,
    cost: [900, 3200], limit: [[4, 1], [9, 2]],
    upCost: [400, 1000, 2400, 5000], speed: [1, 1.3, 1.65, 2.05, 2.6],
    desc: 'Abastece e calibra pneus. Clientes rápidos o dia inteiro.',
  },
  restauracao: {
    name: 'Box de Restauração', icon: '🛠️', w: 2, d: 3, service: 'restore', unlock: 5, cat: 'servicos', build: 14,
    cost: [1500, 5000], limit: [[5, 1], [10, 2]],
    upCost: [600, 1500, 3500, 7000], speed: [1, 1.3, 1.65, 2.05, 2.6],
    desc: 'Restaure carros comprados no leilão para sua coleção, para correr ou vender.',
  },
  showroom: {
    name: 'Showroom', icon: '🏬', w: 3, d: 3, unlock: 5, cat: 'servicos', build: 14,
    cost: [2000], limit: [[5, 1]],
    desc: 'Expõe até 3 carros da sua coleção. Cada carro exposto dá +5 de fama.',
  },
  arvore: { name: 'Árvore', icon: '🌳', w: 1, d: 1, decor: true, fame: 2, cost: 60, unlock: 1, cat: 'decor', build: 2 },
  flores: { name: 'Canteiro', icon: '🌷', w: 1, d: 1, decor: true, fame: 1, cost: 35, unlock: 1, cat: 'decor', build: 2 },
  banco: { name: 'Banco', icon: '🪑', w: 1, d: 1, decor: true, fame: 3, cost: 90, unlock: 2, cat: 'decor', build: 2 },
  poste: { name: 'Poste de Luz', icon: '💡', w: 1, d: 1, decor: true, fame: 3, cost: 120, unlock: 2, cat: 'decor', build: 2 },
  pneus: { name: 'Pilha de Pneus', icon: '🛞', w: 1, d: 1, decor: true, fame: 4, cost: 150, unlock: 3, cat: 'decor', build: 2 },
  palmeira: { name: 'Palmeira', icon: '🌴', w: 1, d: 1, decor: true, fame: 4, cost: 160, unlock: 3, cat: 'decor', build: 2 },
  refri: { name: 'Máquina de Refri', icon: '🥤', w: 1, d: 1, decor: true, fame: 6, cost: 260, unlock: 4, cat: 'decor', build: 3 },
  bandeira: { name: 'Bandeira de Corrida', icon: '🏁', w: 1, d: 1, decor: true, fame: 8, cost: 400, unlock: 5, cat: 'decor', build: 3 },
  placa: { name: 'Placa Neon', icon: '✨', w: 2, d: 1, decor: true, fame: 12, cost: 600, unlock: 5, cat: 'decor', build: 4 },
  foodtruck: { name: 'Food Truck de Pastel', icon: '🥟', w: 2, d: 1, decor: true, fame: 11, cost: 700, unlock: 5, cat: 'decor', build: 4 },
  outdoor: { name: 'Outdoor', icon: '🪧', w: 2, d: 1, decor: true, fame: 14, cost: 900, unlock: 6, cat: 'decor', build: 5 },
  chafariz: { name: 'Chafariz', icon: '⛲', w: 2, d: 2, decor: true, fame: 18, cost: 950, unlock: 6, cat: 'decor', build: 5 },
  trofeu: { name: 'Troféu Gigante', icon: '🏆', w: 2, d: 2, decor: true, fame: 30, cost: 1800, unlock: 7, cat: 'decor', build: 6 },
  estatua: { name: 'Monumento Nitro', icon: '🗽', w: 2, d: 2, decor: true, fame: 26, cost: 2200, unlock: 8, cat: 'decor', build: 6 },
};

export const PARTS = {
  color: [
    { id: 'vermelho', name: 'Vermelho', hex: '#e8473c', lvl: 1 },
    { id: 'azul', name: 'Azul', hex: '#2f7bea', lvl: 1 },
    { id: 'branco', name: 'Branco', hex: '#f2f1ec', lvl: 1 },
    { id: 'preto', name: 'Preto', hex: '#2b2d36', lvl: 1 },
    { id: 'amarelo', name: 'Amarelo', hex: '#ffc93c', lvl: 1 },
    { id: 'verde', name: 'Verde', hex: '#46c35a', lvl: 2 },
    { id: 'laranja', name: 'Laranja', hex: '#ff8a2a', lvl: 2 },
    { id: 'rosa', name: 'Rosa', hex: '#ff6fb5', lvl: 4 },
    { id: 'roxo', name: 'Roxo', hex: '#8a5cf0', lvl: 4 },
    { id: 'ciano', name: 'Ciano', hex: '#33d0e0', lvl: 6 },
    { id: 'dourado', name: 'Dourado', hex: '#e8b33a', lvl: 6, metal: true },
    { id: 'prata', name: 'Prata', hex: '#c9ced8', lvl: 8, metal: true },
  ],
  wheels: [
    { id: 'padrao', name: 'Padrão', lvl: 1 },
    { id: 'esportiva', name: 'Esportiva', lvl: 1 },
    { id: 'cromada', name: 'Cromada', lvl: 3 },
    { id: 'offroad', name: 'Off-road', lvl: 5 },
  ],
  spoiler: [
    { id: 'nenhum', name: 'Nenhum', lvl: 1 },
    { id: 'pequeno', name: 'Lip', lvl: 1 },
    { id: 'grande', name: 'Asa GT', lvl: 4 },
  ],
  neon: [
    { id: 'nenhum', name: 'Nenhum', lvl: 1 },
    { id: 'azul', name: 'Neon Azul', hex: '#35b8ff', lvl: 2 },
    { id: 'rosa', name: 'Neon Rosa', hex: '#ff4fd8', lvl: 4 },
    { id: 'verde', name: 'Neon Verde', hex: '#4dff7a', lvl: 6 },
    { id: 'dourado', name: 'Neon Dourado', hex: '#ffd23d', lvl: 8 },
  ],
  decal: [
    { id: 'nenhum', name: 'Nenhum', lvl: 1 },
    { id: 'listras', name: 'Listras', lvl: 3 },
    { id: 'faixa', name: 'Faixa Lateral', lvl: 5 },
    { id: 'numero', name: 'Número', lvl: 7 },
  ],
};

export const PART_TABS = [
  { id: 'color', name: 'Cor', icon: 'tab-cor' },
  { id: 'wheels', name: 'Rodas', icon: 'tab-rodas' },
  { id: 'spoiler', name: 'Aerofólio', icon: 'tab-aerofolio' },
  { id: 'neon', name: 'Neon', icon: 'tab-neon' },
  { id: 'decal', name: 'Adesivo', icon: 'tab-adesivo' },
];

// Preço para trocar peças nos carros da SUA coleção.
export const PART_COST = { color: 60, wheels: 150, spoiler: 120, neon: 200, decal: 80 };

export const DEFAULT_PART = { wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum' };

export const CAR_TYPES = [
  { id: 'hatch', name: 'Hatch', lvl: 1, mult: 1, speed: 12.5, value: 900 },
  { id: 'sedan', name: 'Sedã', lvl: 1, mult: 1.1, speed: 13, value: 1100 },
  { id: 'pickup', name: 'Picape', lvl: 3, mult: 1.3, speed: 12.2, value: 1500 },
  { id: 'esportivo', name: 'Esportivo', lvl: 5, mult: 1.7, speed: 15, value: 2600 },
  { id: 'van', name: 'Van', lvl: 7, mult: 1.45, speed: 11.8, value: 1700 },
];

// Preparação de desempenho dos carros da coleção.
export const PERF = {
  motor: { name: 'Motor', desc: 'Velocidade máxima', start: 1, max: 5, cost: [300, 700, 1500, 3000] },
  turbo: { name: 'Turbo', desc: 'Aceleração', start: 0, max: 3, cost: [500, 1200, 2600] },
  pneus: { name: 'Pneus de corrida', desc: 'Aderência nas curvas', start: 1, max: 3, cost: [250, 700] },
};

export const JOBS = {
  repair: [
    { id: 'pneu', name: 'Pneu furado', icon: 'pneu', time: 8, pay: 30, xp: 6, lvl: 1 },
    { id: 'oleo', name: 'Troca de óleo', icon: 'oleo', time: 14, pay: 50, xp: 8, lvl: 2 },
    { id: 'freio', name: 'Freios', icon: 'freio', time: 22, pay: 80, xp: 11, lvl: 3 },
    { id: 'suspensao', name: 'Suspensão', icon: 'mola', time: 35, pay: 125, xp: 15, lvl: 3 },
    { id: 'funilaria', name: 'Funilaria', icon: 'martelo', time: 50, pay: 175, xp: 20, lvl: 4, rust: true, stages: ['Desamassando', 'Lixando', 'Retocando'] },
    { id: 'motor', name: 'Conserto do motor', icon: 'motor', time: 75, pay: 270, xp: 28, lvl: 5, stages: ['Abrindo o capô', 'Trocando peças', 'Testando'] },
    { id: 'revisao', name: 'Revisão completa', icon: 'revisao', time: 120, pay: 430, xp: 40, lvl: 6, stages: ['Checklist', 'Fluidos', 'Freios', 'Motor', 'Teste na rua'] },
    { id: 'retifica', name: 'Retífica do motor', icon: 'motor', time: 180, pay: 680, xp: 60, lvl: 8, stages: ['Desmontando', 'Retificando', 'Montando', 'Amaciando'] },
  ],
  wash: [
    { id: 'lavagem', name: 'Lavagem', icon: 'lavagem', time: 6, pay: 22, xp: 4, lvl: 2 },
    { id: 'polimento', name: 'Polimento', icon: 'polimento', time: 10, pay: 42, xp: 7, lvl: 4 },
    { id: 'higienizacao', name: 'Higienização interna', icon: 'aspirador', time: 18, pay: 80, xp: 12, lvl: 6 },
  ],
  fuel: [
    { id: 'abastecer', name: 'Abastecer', icon: 'bomba', time: 6, pay: 26, xp: 4, lvl: 4 },
    { id: 'calibrar', name: 'Calibrar pneus', icon: 'calibrar', time: 4, pay: 14, xp: 3, lvl: 4 },
    { id: 'completo', name: 'Tanque cheio + ducha', icon: 'bomba', time: 12, pay: 55, xp: 8, lvl: 7 },
  ],
};

export const SERVICE_OF = { repair: 'elevador', custom: 'cabine', wash: 'lavajato', fuel: 'posto', restore: 'restauracao' };

export const RACE_TIERS = [
  { id: 'amador', name: 'Copa Amador', lvl: 6, fee: 150, prize: [700, 350, 150], rival: 12.8, laps: 2 },
  { id: 'regional', name: 'Taça Regional', lvl: 8, fee: 400, prize: [2000, 1000, 450], rival: 14.4, laps: 2 },
  { id: 'nacional', name: 'GP Nacional', lvl: 10, fee: 1000, prize: [5200, 2500, 1000], rival: 16.2, laps: 3 },
  { id: 'lenda', name: 'Desafio das Lendas', lvl: 12, fee: 2500, prize: [12000, 5500, 2200], rival: 18.2, laps: 3 },
];

export const RIVAL_NAMES = ['Turbo Tião', 'Dona Marlene', 'Zé do Escapamento', 'Ritinha Racer', 'Barão do Asfalto', 'Cid Nitro', 'Mestre Kombi', 'Lu Pé-de-Chumbo', 'Biscoito', 'Capitão Cambio'];

export const PART_LABEL = { color: 'Cor', wheels: 'Rodas', spoiler: 'Aerofólio', neon: 'Neon', decal: 'Adesivo' };

export function part(kind, id) {
  return PARTS[kind].find((p) => p.id === id);
}

export function carType(id) {
  return CAR_TYPES.find((t) => t.id === id) || CAR_TYPES[0];
}

export function limitAt(type, level) {
  const def = BUILDINGS[type];
  if (!def.limit) return def.decor ? 99 : 1;
  let n = 0;
  for (const [lvl, max] of def.limit) if (level >= lvl) n = max;
  return n;
}

export const BUILDING_MAX_LEVEL = 5;
export const UPGRADE_TIME = [6, 15, 30, 60];
