// Catálogos do jogo: construções, peças, carros, serviços, corridas e progressão.
// Tudo aqui é dado puro — servidor e cliente podem compartilhar.

export const TILE = 2; // tamanho de um quadrado do terreno em unidades 3D
export const GRID_H = 9;
export const BASE_W = 16;

// Lote inicial (em quadrados da grade: x para a direita, z para a frente; a avenida fica em z = GRID_H).
export const BASE_LOT = { id: 'base', x: 0, z: 0, w: 16, h: 9 };

// Terrenos que podem ser comprados, em várias direções. Cada um precisa de nível, moedas
// e de encostar em terreno que você já tem ('needs' = todos estes antes).
// Para crescer o mapa no futuro, é só acrescentar um terreno aqui (e uma rua, se precisar, em roads.js).
export const LAND = [
  { id: 'leste1', name: 'Terreno vizinho', x: 16, z: 0, w: 6, h: 9, cols: 6, cost: 1200, lvl: 3, needs: [], desc: 'Mais 6 colunas de frente para a avenida.' },
  { id: 'leste2', name: 'Terreno da esquina', x: 22, z: 0, w: 6, h: 9, cols: 6, cost: 4500, lvl: 6, needs: ['leste1'], desc: 'A esquina inteira até a rua transversal.' },
  { id: 'fundos1', name: 'Quintal dos fundos', x: 0, z: -4, w: 14, h: 4, cost: 6500, lvl: 7, needs: [], desc: 'Aumenta a oficina para trás, de frente para a Rua dos Fundos.' },
  { id: 'oeste1', name: 'Terreno do parque', x: -7, z: 0, w: 7, h: 9, cost: 8000, lvl: 8, needs: [], desc: 'Do lado esquerdo, colado na rua lateral e no parque.' },
  { id: 'fundos2', name: 'Galpão dos fundos', x: 14, z: -4, w: 14, h: 4, cost: 11000, lvl: 9, needs: ['fundos1', 'leste2'], desc: 'O resto dos fundos, atrás dos terrenos da direita.' },
  { id: 'oeste2', name: 'Cantinho do parque', x: -7, z: -4, w: 7, h: 4, cost: 13000, lvl: 10, needs: ['oeste1', 'fundos1'], desc: 'Fecha o quadrado: o canto entre o parque e os fundos.' },
];
export const MAX_W = 28; // até onde o lote pode ir para a direita (em quadrados)
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
  guincho: {
    name: 'Base do Guincho', icon: '🚚', w: 2, d: 3, unlock: 4, cat: 'servicos', build: 12,
    cost: [1200], limit: [[4, 1]],
    upCost: [500, 1300, 3000, 6000], towPay: [1, 1.25, 1.5, 1.8, 2.2],
    desc: 'Atende chamados de carros quebrados pela cidade. Dirija o guincho e traga o carro!',
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
    { id: 'perolado', name: 'Perolado', hex: '#f4efe6', lvl: 99, rare: 'raro', pearl: true },
    { id: 'fosco', name: 'Preto Fosco', hex: '#2a2c33', lvl: 99, rare: 'raro', matte: true },
    { id: 'cromo', name: 'Cromado', hex: '#e8edf5', lvl: 99, rare: 'epico', chrome: true },
    { id: 'camaleao', name: 'Camaleão', hex: '#7a5cff', lvl: 99, rare: 'lendario', iris: true },
  ],
  wheels: [
    { id: 'padrao', name: 'Padrão', lvl: 1 },
    { id: 'esportiva', name: 'Esportiva', lvl: 1 },
    { id: 'cromada', name: 'Cromada', lvl: 3 },
    { id: 'offroad', name: 'Off-road', lvl: 5 },
    { id: 'raio', name: 'Raio Dourado', lvl: 99, rare: 'raro' },
    { id: 'neonrim', name: 'Aro Neon', lvl: 99, rare: 'epico' },
    { id: 'turbina', name: 'Turbina', lvl: 99, rare: 'lendario' },
  ],
  spoiler: [
    { id: 'nenhum', name: 'Nenhum', lvl: 1 },
    { id: 'pequeno', name: 'Lip', lvl: 1 },
    { id: 'grande', name: 'Asa GT', lvl: 4 },
    { id: 'ducktail', name: 'Rabo de Pato', lvl: 99, rare: 'raro' },
    { id: 'drift', name: 'Asa Drift', lvl: 99, rare: 'epico' },
  ],
  neon: [
    { id: 'nenhum', name: 'Nenhum', lvl: 1 },
    { id: 'azul', name: 'Neon Azul', hex: '#35b8ff', lvl: 2 },
    { id: 'rosa', name: 'Neon Rosa', hex: '#ff4fd8', lvl: 4 },
    { id: 'verde', name: 'Neon Verde', hex: '#4dff7a', lvl: 6 },
    { id: 'dourado', name: 'Neon Dourado', hex: '#ffd23d', lvl: 8 },
    { id: 'arcoiris', name: 'Neon Arco-íris', hex: '#ff4fd8', lvl: 99, rare: 'lendario', rainbow: true },
  ],
  decal: [
    { id: 'nenhum', name: 'Nenhum', lvl: 1 },
    { id: 'listras', name: 'Listras', lvl: 3 },
    { id: 'faixa', name: 'Faixa Lateral', lvl: 5 },
    { id: 'numero', name: 'Número', lvl: 7 },
    { id: 'xadrez', name: 'Xadrez', lvl: 99, rare: 'raro' },
    { id: 'relampago', name: 'Relâmpago', lvl: 99, rare: 'raro' },
    { id: 'chamas', name: 'Chamas', lvl: 99, rare: 'epico' },
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
  { id: 'jipe', name: 'Jipe', lvl: 4, mult: 1.35, speed: 12.6, value: 1600 },
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

// ===================== Atualização 3 =====================

export const RARITY = {
  raro: { name: 'Raro', color: '#36b8ff', dup: 300 },
  epico: { name: 'Épico', color: '#a86bff', dup: 800 },
  lendario: { name: 'Lendário', color: '#ffb300', dup: 2000 },
};

export const RARE_PARTS = Object.entries(PARTS).flatMap(([kind, list]) => list.filter((p) => p.rare).map((p) => ({ kind, ...p })));

// Caixas de prêmio: chance de cada raridade (o resto vira moedas).
export const CRATES = {
  bronze: { name: 'Caixa de Bronze', color: '#d08a4a', odds: { raro: 0.25 }, coins: [80, 200] },
  prata: { name: 'Caixa de Prata', color: '#c9ced8', odds: { raro: 0.6, epico: 0.25 }, coins: [200, 450] },
  ouro: { name: 'Caixa de Ouro', color: '#ffcc33', odds: { raro: 0.3, epico: 0.45, lendario: 0.25 }, coins: [500, 1000] },
};

// Clientes fixos com história (5 capítulos de amizade).
export const CHARACTERS = [
  {
    id: 'ze', name: 'Seu Zé', lvl: 1, bio: 'Aposentado. Cuida do hatch branco como se fosse um filho.',
    face: { skin: '#f1c09a', hair: '#e8e0d0', style: 'careca', mustache: true },
    car: { type: 'hatch', color: 'branco' }, kinds: ['repair', 'wash'],
    lines: [
      'Esse carro tem 30 anos e nunca me deixou na mão. Cuida bem dele, hein?',
      'Comprei ele com o primeiro salário de motorista de ônibus. Bons tempos...',
      'Minha neta disse que eu falo mais do carro do que dela. Ela tem razão!',
      'Vou te contar um segredo: o freio de mão nunca funcionou. Agora funciona!',
      'Você é o único mecânico em quem eu confio. Pode me chamar de Zé, só Zé.',
    ],
    gifts: { 3: { coins: 300 }, 5: { crate: 'prata' } },
  },
  {
    id: 'cida', name: 'Vó Cida', lvl: 2, bio: 'Faz o melhor bolo de fubá do bairro e não perde a novela.',
    face: { skin: '#f1c09a', hair: '#d8dce4', style: 'coque', glasses: true },
    car: { type: 'hatch', color: 'rosa' }, kinds: ['wash', 'repair'],
    lines: [
      'Meu filho, o carro está fazendo um barulhinho... tipo "tec tec tec".',
      'Trouxe bolo de fubá para a equipe! Ainda está quentinho.',
      'Meu falecido Alfredo também era mecânico. Você me lembra ele.',
      'Contei para as amigas do bingo da sua oficina. Prepare-se!',
      'Você agora é meu neto de coração. Domingo tem almoço lá em casa!',
    ],
    gifts: { 3: { coins: 250 }, 5: { crate: 'prata' } },
  },
  {
    id: 'tiao', name: 'Tião do Frete', lvl: 2, bio: 'Faz frete com a picape pela cidade inteira, de sol a sol.',
    face: { skin: '#8a5a3a', hair: '#1f1f24', style: 'curto', hat: '#2f7bea', mustache: true },
    car: { type: 'pickup', color: 'verde' }, kinds: ['repair', 'fuel'],
    lines: [
      'Rapidinho, chefe! Tenho uma geladeira para entregar em meia hora.',
      'Essa picape já carregou mudança, piano e até um bode. Não pergunta.',
      'Indiquei você para os caminhoneiros da estrada. Vai lotar aqui!',
      'Fiz um frete para a pista de corrida. Vi uns carros lindos lá!',
      'Se precisar de qualquer coisa, frete de graça para você. Palavra de Tião!',
    ],
    gifts: { 3: { coins: 350 }, 5: { crate: 'prata' } },
  },
  {
    id: 'marlene', name: 'Dona Marlene', lvl: 3, bio: 'Leva a criançada da escola na van amarela todo dia.',
    face: { skin: '#c98a5e', hair: '#3a2a1e', style: 'coque', glasses: true },
    car: { type: 'van', color: 'amarelo' }, kinds: ['repair', 'fuel', 'wash'],
    lines: [
      'As crianças pintaram a van de canetinha de novo. Tem jeito?',
      'Hoje é aniversário do Pedrinho! Ele pediu para ver a oficina.',
      'Uma mãe reclamou que a van é mais limpa que a casa dela. Obrigada!',
      'As crianças fizeram um desenho de você. Está na geladeira da escola.',
      'Você é oficialmente o mecânico da escola. Tem até crachá!',
    ],
    gifts: { 3: { coins: 400 }, 5: { crate: 'prata' } },
  },
  {
    id: 'pires', name: 'Sargento Pires', lvl: 4, bio: 'Policial rodoviário. Gosta de tudo em ordem e no horário.',
    face: { skin: '#8a5a3a', hair: '#1f1f24', style: 'curto', hat: '#1d2b4f' },
    car: { type: 'sedan', color: 'branco', decal: 'faixa' }, kinds: ['repair', 'fuel'],
    lines: [
      'Vistoria de rotina. Brincadeira! O pneu furou numa perseguição.',
      'Sua oficina passou na fiscalização. Nota dez em organização.',
      'Peguei um motorista a 180 por hora... de bicicleta. Não acreditei.',
      'O comandante quer trazer a frota inteira para cá.',
      'Considere-se condecorado: Mecânico de Honra da Rodoviária!',
    ],
    gifts: { 3: { coins: 500 }, 5: { crate: 'ouro' } },
  },
  {
    id: 'ritinha', name: 'Ritinha Racer', lvl: 4, bio: 'Pilota nos fins de semana e vive no limite do conta-giros.',
    face: { skin: '#f6d2b4', hair: '#c98a2a', style: 'rabo' },
    car: { type: 'esportivo', color: 'vermelho', wheels: 'esportiva', spoiler: 'grande' }, kinds: ['custom', 'repair'],
    lines: [
      'Preciso desse carro voando até sábado. Tem corrida!',
      'Ganhei a bateria! Seu acerto de suspensão fez toda a diferença.',
      'Ouvi dizer que você tem uma pista... topa um racha amistoso?',
      'Quebrei o recorde da volta! Quero te dar um pedaço do troféu.',
      'Quando eu for campeã nacional, seu nome vai no meu macacão.',
    ],
    gifts: { 3: { crate: 'bronze' }, 5: { crate: 'ouro' } },
  },
  {
    id: 'kaio', name: 'Kaio Influencer', lvl: 5, bio: 'Tudo vira post. Quer o carro mais chamativo da cidade.',
    face: { skin: '#f1c09a', hair: '#ff6fb5', style: 'topete', shades: true },
    car: { type: 'esportivo', color: 'rosa' }, kinds: ['custom'],
    lines: [
      'E aí, galera! Hoje estou na Oficina Nitro! Faz um carro que dê view!',
      'O vídeo bombou! 2 milhões de views. Você está famoso!',
      'Meus seguidores querem saber o nome do seu pintor. É segredo?',
      'Vou fazer uma collab: "Um dia como mecânico". Topa?',
      'Você é o maior parceiro do canal. Esse carro é a nossa marca!',
    ],
    gifts: { 3: { fame: 15 }, 5: { crate: 'ouro' } },
  },
  {
    id: 'augusto', name: 'Dr. Augusto', lvl: 6, bio: 'Advogado exigente. Paga muito bem, mas cobra perfeição.',
    face: { skin: '#c98a5e', hair: '#7a7a7a', style: 'curto', glasses: true },
    car: { type: 'sedan', color: 'preto', wheels: 'cromada' }, kinds: ['custom', 'wash'],
    lines: [
      'Espero o serviço impecável. Tenho audiência em uma hora.',
      'Hm. Aceitável. Muito aceitável, na verdade.',
      'Um cliente meu perguntou onde mando o carro. Indiquei você.',
      'Confesso: já não confio em outra oficina. Não espalhe.',
      'Considere-me um amigo. E um cliente para a vida toda.',
    ],
    gifts: { 3: { coins: 900 }, 5: { crate: 'ouro' } },
  },
];

// Eventos semanais (mudam pela semana do calendário).
export const EVENTS = [
  { id: 'neon', name: 'Semana do Neon', color: '#ff4fd8', desc: 'Clientes loucos por neon! Personalizações com neon valem o dobro de pontos.', points: { custom_neon: 20, custom: 8, deliver: 2 }, neonBoost: true, reward: { part: 'neon:arcoiris' } },
  { id: 'lama', name: 'Rali da Lama', color: '#a0703a', desc: 'Chove muito e os carros chegam enlameados. Lavagens valem pontos.', points: { wash: 12, deliver: 2, custom: 5 }, rainBoost: 2.5, reward: { part: 'decal:chamas' } },
  { id: 'nitro', name: 'Copa Nitro', color: '#ff8a2a', desc: 'Corridas, guinchos e preparação valem pontos. Corridas dão caixas melhores.', points: { race: 30, win: 40, tune: 10, tow: 25, deliver: 2 }, crateBoost: true, reward: { part: 'wheels:raio' } },
  { id: 'pastel', name: 'Festival do Pastel', color: '#ffb300', desc: 'A loja vende o dobro. Abastecer e recolher a loja valem pontos.', points: { fuel: 10, loja: 8, deliver: 2 }, lojaBoost: 2, reward: { part: 'color:perolado' } },
];
export const EVENT_MILESTONES = [
  { pts: 100, coins: 500 },
  { pts: 250, crate: 'prata' },
  { pts: 500, part: true },
];

// Equipe contratável.
export const STAFF_ROLES = {
  mecanico: { name: 'Mecânico Relâmpago', icon: 'motor', desc: 'Elevadores mais rápidos', effect: 'repairSpeed', base: 0.25, cost: 800, lvl: 3 },
  lavador: { name: 'Lavador Turbo', icon: 'lavagem', desc: 'Lava-jato mais rápido', effect: 'washSpeed', base: 0.3, cost: 700, lvl: 3 },
  pintora: { name: 'Pintora Caprichosa', icon: 'estilo', desc: 'Gorjetas maiores na personalização', effect: 'customTip', base: 0.15, cost: 1200, lvl: 3 },
  frentista: { name: 'Frentista Simpático', icon: 'bomba', desc: 'Posto paga mais', effect: 'fuelPay', base: 0.25, cost: 900, lvl: 4 },
  gerente: { name: 'Gerente Carismática', icon: 'face-ok', desc: 'Clientes mais pacientes e mais fama', effect: 'patience', base: 0.3, fame: 10, cost: 1500, lvl: 4 },
  vendedor: { name: 'Vendedor da Loja', icon: 'moeda', desc: 'Loja de peças rende mais', effect: 'lojaRate', base: 0.4, cost: 1000, lvl: 4 },
  restaurador: { name: 'Restaurador Artesão', icon: 'restauro', desc: 'Restauração mais rápida', effect: 'restoreSpeed', base: 0.3, cost: 1800, lvl: 5 },
  piloto: { name: 'Piloto de Testes', icon: 'corrida', desc: 'Seus carros correm mais', effect: 'raceTop', base: 0.6, cost: 2000, lvl: 6 },
};
export const STAFF_NAMES = ['Juninho', 'Paty', 'Beto', 'Lu', 'Careca', 'Dani', 'Feijão', 'Rose', 'Tuca', 'Neide', 'Gugu', 'Bia'];
export const STAFF_LEVEL_MULT = [1, 1.6, 2.2];
export const TEAM_SIZE = [[3, 1], [5, 2], [7, 3], [9, 4], [11, 5], [13, 6], [15, 8]];
export const UNIFORMS = ['#2f7bea', '#e8473c', '#46c35a', '#ff8a2a', '#8a5cf0', '#1d2b4f', '#ff4fa3', '#ffc93c'];
