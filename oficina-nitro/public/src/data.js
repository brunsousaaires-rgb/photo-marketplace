// Catálogos do jogo: construções, peças, carros, serviços e progressão.
// Tudo aqui é dado puro — servidor e cliente podem compartilhar.

export const TILE = 2; // tamanho de um quadrado do terreno em unidades 3D
export const GRID_W = 16;
export const GRID_H = 9;

export function xpNeed(level) {
  return Math.round(45 * level ** 1.55);
}

// limit: [[nível, quantidade máxima], ...]
export const BUILDINGS = {
  escritorio: { name: 'Escritório', w: 3, d: 3, fixed: true, icon: '🏢', desc: 'O coração da sua oficina.' },
  elevador: {
    name: 'Elevador', icon: '🔧', w: 2, d: 3, service: 'repair', unlock: 1, cat: 'servicos',
    cost: [0, 250, 900, 2500], limit: [[1, 2], [4, 3], [8, 4]],
    upCost: [180, 480, 1200, 2800], speed: [1, 1.3, 1.65, 2.05, 2.6],
    desc: 'Conserta carros: pneus, óleo, freios e motor.',
  },
  cabine: {
    name: 'Cabine de Estilo', icon: '🎨', w: 2, d: 3, service: 'custom', unlock: 1, cat: 'servicos',
    cost: [0, 3500], limit: [[1, 1], [7, 2]],
    upCost: [300, 800, 1800, 4000], tip: [0, 0.1, 0.2, 0.32, 0.45],
    desc: 'Pinte e personalize carros do jeito que o cliente pediu. Nível maior = gorjetas maiores.',
  },
  lavajato: {
    name: 'Lava-Jato', icon: '🫧', w: 2, d: 3, service: 'wash', unlock: 2, cat: 'servicos',
    cost: [300, 1600], limit: [[2, 1], [6, 2]],
    upCost: [160, 420, 1000, 2400], speed: [1, 1.3, 1.65, 2.05, 2.6],
    desc: 'Lavagem e polimento rápidos. Dinheiro fácil!',
  },
  loja: {
    name: 'Loja de Acessórios', icon: '🏪', w: 2, d: 2, unlock: 3, cat: 'servicos',
    cost: [400, 2200], limit: [[3, 1], [8, 2]],
    upCost: [250, 650, 1500, 3500], rate: [0.5, 0.85, 1.35, 2, 3], cap: [90, 200, 420, 800, 1400],
    desc: 'Vende acessórios sozinha. Toque para recolher o dinheiro.',
  },
  arvore: { name: 'Árvore', icon: '🌳', w: 1, d: 1, decor: true, fame: 2, cost: 60, unlock: 1, cat: 'decor' },
  flores: { name: 'Canteiro', icon: '🌷', w: 1, d: 1, decor: true, fame: 1, cost: 35, unlock: 1, cat: 'decor' },
  banco: { name: 'Banco', icon: '🪑', w: 1, d: 1, decor: true, fame: 3, cost: 90, unlock: 2, cat: 'decor' },
  poste: { name: 'Poste de Luz', icon: '💡', w: 1, d: 1, decor: true, fame: 3, cost: 120, unlock: 2, cat: 'decor' },
  pneus: { name: 'Pilha de Pneus', icon: '🛞', w: 1, d: 1, decor: true, fame: 4, cost: 150, unlock: 3, cat: 'decor' },
  refri: { name: 'Máquina de Refri', icon: '🥤', w: 1, d: 1, decor: true, fame: 6, cost: 260, unlock: 4, cat: 'decor' },
  bandeira: { name: 'Bandeira de Corrida', icon: '🏁', w: 1, d: 1, decor: true, fame: 8, cost: 400, unlock: 5, cat: 'decor' },
  placa: { name: 'Placa Neon', icon: '✨', w: 2, d: 1, decor: true, fame: 12, cost: 600, unlock: 5, cat: 'decor' },
  chafariz: { name: 'Chafariz', icon: '⛲', w: 2, d: 2, decor: true, fame: 18, cost: 950, unlock: 6, cat: 'decor' },
  trofeu: { name: 'Troféu Gigante', icon: '🏆', w: 2, d: 2, decor: true, fame: 30, cost: 1800, unlock: 7, cat: 'decor' },
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
    { id: 'padrao', name: 'Padrão', icon: '⚪', lvl: 1 },
    { id: 'esportiva', name: 'Esportiva', icon: '🔴', lvl: 1 },
    { id: 'cromada', name: 'Cromada', icon: '💿', lvl: 3 },
    { id: 'offroad', name: 'Off-road', icon: '🛞', lvl: 5 },
  ],
  spoiler: [
    { id: 'nenhum', name: 'Nenhum', icon: '—', lvl: 1 },
    { id: 'pequeno', name: 'Pequeno', icon: '▬', lvl: 1 },
    { id: 'grande', name: 'Asa Grande', icon: '✈️', lvl: 4 },
  ],
  neon: [
    { id: 'nenhum', name: 'Nenhum', icon: '—', lvl: 1 },
    { id: 'azul', name: 'Neon Azul', hex: '#35b8ff', lvl: 2 },
    { id: 'rosa', name: 'Neon Rosa', hex: '#ff4fd8', lvl: 4 },
    { id: 'verde', name: 'Neon Verde', hex: '#4dff7a', lvl: 6 },
    { id: 'dourado', name: 'Neon Dourado', hex: '#ffd23d', lvl: 8 },
  ],
  decal: [
    { id: 'nenhum', name: 'Nenhum', icon: '—', lvl: 1 },
    { id: 'listras', name: 'Listras', icon: '🏎️', lvl: 3 },
    { id: 'faixa', name: 'Faixa Lateral', icon: '〰️', lvl: 5 },
    { id: 'numero', name: 'Número', icon: '7️⃣', lvl: 7 },
  ],
};

export const PART_TABS = [
  { id: 'color', name: 'Cor', icon: '🎨' },
  { id: 'wheels', name: 'Rodas', icon: '🛞' },
  { id: 'spoiler', name: 'Aerofólio', icon: '🪽' },
  { id: 'neon', name: 'Neon', icon: '💡' },
  { id: 'decal', name: 'Adesivo', icon: '🏁' },
];

export const DEFAULT_PART = { wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum' };

export const CAR_TYPES = [
  { id: 'hatch', name: 'Hatch', lvl: 1, mult: 1 },
  { id: 'sedan', name: 'Sedã', lvl: 1, mult: 1.1 },
  { id: 'pickup', name: 'Picape', lvl: 3, mult: 1.3 },
  { id: 'esportivo', name: 'Esportivo', lvl: 5, mult: 1.7 },
  { id: 'van', name: 'Van', lvl: 7, mult: 1.45 },
];

export const JOBS = {
  repair: [
    { id: 'pneu', name: 'Trocar pneu', icon: '🛞', time: 8, pay: 30, xp: 6, lvl: 1 },
    { id: 'oleo', name: 'Troca de óleo', icon: '🛢️', time: 12, pay: 46, xp: 8, lvl: 2 },
    { id: 'freio', name: 'Freios', icon: '🛑', time: 18, pay: 72, xp: 11, lvl: 3 },
    { id: 'motor', name: 'Motor', icon: '⚙️', time: 28, pay: 135, xp: 18, lvl: 5 },
  ],
  wash: [
    { id: 'lavagem', name: 'Lavagem', icon: '🫧', time: 6, pay: 22, xp: 4, lvl: 2 },
    { id: 'polimento', name: 'Polimento', icon: '✨', time: 10, pay: 42, xp: 7, lvl: 4 },
  ],
};

export const SERVICE_OF = { repair: 'elevador', custom: 'cabine', wash: 'lavajato' };

export const PART_LABEL = { color: 'Cor', wheels: 'Rodas', spoiler: 'Aerofólio', neon: 'Neon', decal: 'Adesivo' };

export function part(kind, id) {
  return PARTS[kind].find((p) => p.id === id);
}

export function limitAt(type, level) {
  const def = BUILDINGS[type];
  if (!def.limit) return def.decor ? 99 : 1;
  let n = 0;
  for (const [lvl, max] of def.limit) if (level >= lvl) n = max;
  return n;
}

export const BUILDING_MAX_LEVEL = 5;

export const SHOP_NAMES = ['Oficina Nitro'];
