// Ícones desenhados para o jogo (SVG), no mesmo estilo: contorno azul-marinho grosso e cores chapadas.
const S = 'stroke="#1d2b4f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const S2 = 'stroke="#1d2b4f" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
const line = (d, color, w = 4) => `<path d="${d}" fill="none" stroke="#1d2b4f" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const star4 = (x, y, r, fill) => `<path d="M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28}Z" fill="${fill}" ${S2}/>`;
const carSide = (fill, y = 0) => `<path d="M5 ${32 + y} q0 -6 6 -6 l6 -7 h13 l7 7 q6 0 6 6 v5 h-38z" fill="${fill}" ${S}/><path d="M19 ${21 + y} h10 l5 5 h-17z" fill="#bfe0ff" ${S2}/><circle cx="14" cy="${37 + y}" r="5" fill="#2b2d36" ${S2}/><circle cx="35" cy="${37 + y}" r="5" fill="#2b2d36" ${S2}/>`;

const ICONS = {
  pneu: `<ellipse cx="22" cy="25" rx="17" ry="15" fill="#2b2d36" ${S}/><circle cx="22" cy="24" r="8" fill="#c3c8d2" ${S2}/><circle cx="22" cy="24" r="2.5" fill="#1d2b4f"/><path d="M8 33 q14 7 28 0" fill="none" stroke="#4a4f5c" stroke-width="2"/><circle cx="40" cy="35" r="4" fill="#fff" ${S2}/><circle cx="44" cy="28" r="2.6" fill="#fff" ${S2}/>`,
  oleo: `<path d="M9 22h19l7 6v13H9z" fill="#ffc93c" ${S}/><rect x="13" y="14" width="9" height="8" rx="2" fill="#e8473c" ${S}/>${line('M35 29 L44 22', '#9aa3b2', 3)}<path d="M42 30 q-4 6 0 8 q4 -2 0 -8z" fill="#22252e" ${S2}/><rect x="13" y="28" width="14" height="6" rx="2" fill="#fff" ${S2}/>`,
  freio: `<circle cx="22" cy="26" r="17" fill="#c3c8d2" ${S}/><circle cx="22" cy="26" r="6" fill="#8a93a5" ${S2}/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${22 + Math.cos(i * 1.047) * 11.5}" cy="${26 + Math.sin(i * 1.047) * 11.5}" r="1.8" fill="#1d2b4f"/>`).join('')}<path d="M27 7 a19 19 0 0 1 16 14 l-8 3 a11 11 0 0 0 -10 -9z" fill="#e8473c" ${S}/>`,
  mola: `<rect x="12" y="5" width="24" height="6" rx="2" fill="#5a6070" ${S}/>${line('M15 14 L33 18 L15 23 L33 28 L15 33 L33 37', '#e8473c', 4)}<rect x="12" y="38" width="24" height="6" rx="2" fill="#5a6070" ${S}/>`,
  martelo: `${line('M9 41 L29 21', '#c98a4b', 5)}<rect x="22" y="7" width="22" height="11" rx="2" transform="rotate(45 33 12.5)" fill="#9aa3b2" ${S}/>${star4(11, 13, 8, '#ffd23d')}`,
  motor: `<rect x="8" y="19" width="30" height="20" rx="4" fill="#8a93a5" ${S}/><rect x="12" y="10" width="22" height="10" rx="3" fill="#e8473c" ${S}/><rect x="38" y="23" width="6" height="11" rx="2" fill="#5a6070" ${S2}/><rect x="3" y="25" width="6" height="8" rx="2" fill="#5a6070" ${S2}/><circle cx="17" cy="29" r="3.2" fill="#1d2b4f"/><circle cx="29" cy="29" r="3.2" fill="#1d2b4f"/><path d="M14 14h4M22 14h4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  revisao: `<rect x="9" y="8" width="30" height="36" rx="4" fill="#ffffff" ${S}/><rect x="17" y="4" width="14" height="8" rx="3" fill="#9aa3b2" ${S}/>${line('M16 27 l6 6 l11 -12', '#46c35a', 4)}<path d="M15 18h18" stroke="#c3d6ee" stroke-width="2.5" stroke-linecap="round"/>`,
  lavagem: `<path d="M10 22h27l-3 21H13z" fill="#2f7bea" ${S}/><path d="M12 22 q11 -12 23 0" fill="none" ${S}/><circle cx="14" cy="13" r="5" fill="#bfeaff" ${S2}/><circle cx="25" cy="9" r="6" fill="#bfeaff" ${S2}/><circle cx="36" cy="14" r="4" fill="#bfeaff" ${S2}/><path d="M16 30h16" stroke="#8fc2ff" stroke-width="3" stroke-linecap="round"/>`,
  polimento: `${star4(21, 22, 16, '#ffd23d')}${star4(39, 36, 7, '#ffffff')}${star4(38, 9, 5, '#bfeaff')}`,
  aspirador: `<path d="M15 6 h14 a4 4 0 0 1 4 4 v20 h-22 v-20 a4 4 0 0 1 4 -4z" fill="#8a5cf0" ${S}/><path d="M9 30 h28 a4 4 0 0 1 4 4 v6 h-36 v-6 a4 4 0 0 1 4 -4z" fill="#8a5cf0" ${S}/><path d="M18 12v12M26 12v12" stroke="#b49bff" stroke-width="2.5" stroke-linecap="round"/>${star4(40, 12, 6, '#ffffff')}`,
  bomba: `<rect x="7" y="8" width="23" height="34" rx="4" fill="#46c35a" ${S}/><rect x="11" y="12" width="15" height="9" rx="2" fill="#d8ffe6" ${S2}/><rect x="5" y="40" width="27" height="5" rx="2" fill="#5a6070" ${S2}/><path d="M30 16 h6 a3 3 0 0 1 3 3 v15 a3 3 0 0 0 6 0 v-10 l-3 -4" fill="none" ${S}/><rect x="12" y="26" width="13" height="5" rx="2" fill="#ffffff" ${S2}/>`,
  calibrar: `<circle cx="24" cy="26" r="18" fill="#ffffff" ${S}/><path d="M11 32 a14 14 0 0 1 4 -15" fill="none" stroke="#e8473c" stroke-width="4" stroke-linecap="round"/><path d="M17 15 a14 14 0 0 1 14 0" fill="none" stroke="#ffc93c" stroke-width="4" stroke-linecap="round"/><path d="M33 17 a14 14 0 0 1 4 15" fill="none" stroke="#46c35a" stroke-width="4" stroke-linecap="round"/>${line('M24 26 L32 16', '#1d2b4f', 2)}<circle cx="24" cy="26" r="3.5" fill="#1d2b4f"/>`,
  restauro: `${carSide('#c26a2e', 2)}<circle cx="13" cy="30" r="2" fill="#7a3b1d"/><circle cx="31" cy="32" r="2.5" fill="#7a3b1d"/>${line('M30 4 L40 14', '#9aa3b2', 4)}<circle cx="41.5" cy="15.5" r="4.5" fill="#9aa3b2" ${S2}/>`,
  estilo: `<rect x="13" y="17" width="17" height="27" rx="4" fill="#ff4fa3" ${S}/><rect x="13" y="25" width="17" height="6" fill="#ffffff" ${S2}/><rect x="16" y="10" width="11" height="8" rx="2" fill="#9aa3b2" ${S}/><rect x="19" y="5" width="6" height="6" rx="1.5" fill="#1d2b4f"/><circle cx="35" cy="9" r="3" fill="#ff9fd4"/><circle cx="40" cy="5" r="2.2" fill="#ff9fd4"/><circle cx="41" cy="13" r="2.6" fill="#ffd23d"/><circle cx="36" cy="17" r="2" fill="#8fd3ff"/>`,
  'tab-cor': '',
  'tab-rodas': `<circle cx="24" cy="24" r="19" fill="#2b2d36" ${S}/><circle cx="24" cy="24" r="12" fill="#e9edf3" ${S2}/>${[0, 1, 2, 3, 4].map((i) => `<path d="M24 24 L${24 + Math.cos(i * 1.2566 - 1.57) * 11} ${24 + Math.sin(i * 1.2566 - 1.57) * 11}" stroke="#e8473c" stroke-width="3.5" stroke-linecap="round"/>`).join('')}<circle cx="24" cy="24" r="3.5" fill="#1d2b4f"/>`,
  'tab-aerofolio': `<path d="M3 36 q0 -7 7 -7 h20 l7 -6 h8 v13 z" fill="#2f7bea" ${S}/><circle cx="14" cy="37" r="5" fill="#2b2d36" ${S2}/><rect x="20" y="9" width="25" height="6" rx="2" fill="#1d2b4f" transform="rotate(-6 32 12)"/>${line('M30 15 v8 M40 14 v8', '#1d2b4f', 2)}`,
  'tab-neon': `<ellipse cx="24" cy="40" rx="21" ry="6" fill="#ff4fd8" opacity=".55"/><ellipse cx="24" cy="40" rx="13" ry="3.5" fill="#ffb3f0"/>${carSide('#1d2b4f', -4)}`,
  'tab-adesivo': `<rect x="12" y="3" width="24" height="42" rx="10" fill="#2f7bea" ${S}/><rect x="19" y="4" width="3.6" height="40" fill="#ffffff"/><rect x="25.4" y="4" width="3.6" height="40" fill="#ffffff"/><rect x="15" y="14" width="18" height="8" rx="2.5" fill="#27385c" ${S2}/>`,
  construir: `${line('M10 40 L30 20', '#c98a4b', 5)}<rect x="23" y="7" width="20" height="10" rx="2" transform="rotate(45 33 12)" fill="#9aa3b2" ${S}/>${line('M38 40 L18 20', '#9aa3b2', 5)}<circle cx="16" cy="18" r="6" fill="#9aa3b2" ${S2}/><circle cx="16" cy="18" r="2.5" fill="#1d2b4f"/>`,
  missoes: `<rect x="9" y="8" width="30" height="36" rx="4" fill="#ffffff" ${S}/><rect x="17" y="4" width="14" height="8" rx="3" fill="#ffc93c" ${S}/><path d="M15 20h4M23 20h11M15 28h4M23 28h11M15 36h4M23 36h8" stroke="#1d2b4f" stroke-width="3" stroke-linecap="round"/>`,
  garagem: `<path d="M3 21 L24 6 L45 21 V43 H3Z" fill="#ff8a2a" ${S}/><rect x="10" y="22" width="28" height="21" fill="#ffffff" ${S2}/><path d="M10 27h28M10 32h28" stroke="#c3d6ee" stroke-width="2"/><path d="M13 42 q0 -4 4 -4 l3 -4 h8 l3 4 q4 0 4 4z" fill="#e8473c" ${S2}/>`,
  corrida: `${line('M9 45 V5', '#9aa3b2', 3)}<path d="M11 6 h30 v20 h-30z" fill="#ffffff" ${S}/><path d="M11 6h7.5v5h-7.5zM26 6h7.5v5h-7.5zM18.5 11h7.5v5h-7.5zM33.5 11h7.5v5h-7.5zM11 16h7.5v5h-7.5zM26 16h7.5v5h-7.5zM18.5 21h7.5v5h-7.5zM33.5 21h7.5v5h-7.5z" fill="#1d2b4f"/>`,
  leilao: `${line('M8 42 L26 24', '#c98a4b', 5)}<rect x="20" y="8" width="22" height="12" rx="3" transform="rotate(45 31 14)" fill="#c98a4b" ${S}/><rect x="4" y="40" width="18" height="5" rx="2" fill="#5a6070" ${S2}/>`,
  trofeu: `<path d="M14 6h20v12a10 10 0 0 1 -20 0z" fill="#ffcc33" ${S}/><path d="M14 10h-6a6 6 0 0 0 6 9M34 10h6a6 6 0 0 1 -6 9" fill="none" ${S}/><rect x="21" y="28" width="6" height="8" fill="#ffcc33" ${S2}/><rect x="13" y="36" width="22" height="7" rx="2" fill="#8a5a3a" ${S}/>`,
  musica: `<path d="M18 36 V10 l20 -4 v26" fill="none" ${S}/><ellipse cx="13" cy="36" rx="6" ry="5" fill="#8a5cf0" ${S}/><ellipse cx="33" cy="32" rx="6" ry="5" fill="#8a5cf0" ${S}/><path d="M18 16 l20 -4" ${S}/>`,
  som: `<path d="M8 18h8l10 -9v30l-10 -9h-8z" fill="#2f7bea" ${S}/><path d="M31 17 a9 9 0 0 1 0 14M36 12 a15 15 0 0 1 0 24" fill="none" ${S}/>`,
  mudo: `<path d="M8 18h8l10 -9v30l-10 -9h-8z" fill="#9aa3b2" ${S}/><path d="M32 18 l10 12M42 18 l-10 12" ${S}/>`,
  vip: `<path d="M5 36 L9 12 L18 24 L24 8 L30 24 L39 12 L43 36Z" fill="#ffd23d" ${S}/><rect x="5" y="36" width="38" height="7" rx="2" fill="#ffb300" ${S}/><circle cx="24" cy="28" r="3.5" fill="#e8473c"/>`,
  moeda: `<circle cx="24" cy="24" r="19" fill="#ffd23d" ${S}/><circle cx="24" cy="24" r="13" fill="none" stroke="#f0a800" stroke-width="3"/><path d="M24 15v18" stroke="#9a6200" stroke-width="4" stroke-linecap="round"/>`,
  'face-ok': `<circle cx="24" cy="24" r="19" fill="#ffd23d" ${S}/><circle cx="17" cy="20" r="2.8" fill="#1d2b4f"/><circle cx="31" cy="20" r="2.8" fill="#1d2b4f"/><path d="M15 29 q9 8 18 0" fill="none" ${S}/>`,
  'face-meh': `<circle cx="24" cy="24" r="19" fill="#ffb84a" ${S}/><circle cx="17" cy="20" r="2.8" fill="#1d2b4f"/><circle cx="31" cy="20" r="2.8" fill="#1d2b4f"/><path d="M16 31 h16" ${S}/>`,
  'face-bad': `<circle cx="24" cy="24" r="19" fill="#ff6a4a" ${S}/><path d="M13 16 l7 3M35 16 l-7 3" ${S}/><circle cx="17" cy="22" r="2.6" fill="#1d2b4f"/><circle cx="31" cy="22" r="2.6" fill="#1d2b4f"/><path d="M15 34 q9 -7 18 0" fill="none" ${S}/>`,
  terreno: `<path d="M4 36 L24 26 L44 36 L24 46Z" fill="#7ccb5b" ${S}/>${line('M24 30 V8', '#8a5a3a', 3)}<rect x="24" y="8" width="17" height="11" rx="2" fill="#e8473c" ${S2}/>`,
};
ICONS['tab-cor'] = ICONS.estilo;

export function icon(name, cls = '') {
  const body = ICONS[name] || ICONS.revisao;
  return `<svg class="svgi ${cls}" viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
}

export function faceFor(pct) {
  return pct > 0.5 ? 'face-ok' : pct > 0.25 ? 'face-meh' : 'face-bad';
}
