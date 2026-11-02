// Qual visual usar: o novo ("premium", padrão) ou o clássico, para comparar.
// Muda no Menu (Visual novo) ou pelo endereço: ?visual=classic / ?visual=premium.
function read() {
  try {
    const q = new URLSearchParams(location.search).get('visual');
    if (q) return q !== 'classic';
    return localStorage.getItem('oficina.visual') !== 'classic';
  } catch {
    return true;
  }
}

export const VISUAL = { premium: read() };

export function setVisual(premium) {
  try { localStorage.setItem('oficina.visual', premium ? 'premium' : 'classic'); } catch {}
  const u = new URL(location.href);
  u.searchParams.delete('visual');
  location.replace(u.toString());
}

// Área do protótipo (a oficina, a avenida da frente e os arredores), em coordenadas do mundo.
export const PROTO_ZONE = { x0: -24, x1: 64, z0: -14, z1: 32 };
export const inProto = (x, z) => x >= PROTO_ZONE.x0 && x <= PROTO_ZONE.x1 && z >= PROTO_ZONE.z0 && z <= PROTO_ZONE.z1;
