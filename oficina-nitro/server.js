// Servidor da Oficina Nitro: arquivos do jogo (public/) + API online simples.
// A API guarda tudo em data/online.json. Cada jogador tem um id e um segredo
// gerados no navegador; só quem tem o segredo pode escrever nos documentos daquele id.
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(HERE, 'public');
const DATA = join(HERE, 'data', 'online.json');
const PORT = Number(process.env.PORT) || 5174;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const COLLECTIONS = new Set(['players', 'entries', 'votes', 'likes']);
const ID_RE = /^[a-zA-Z0-9_-]{4,40}$/;

let db = { docs: {}, secrets: {}, saves: {} };
try { db = { ...db, ...JSON.parse(await readFile(DATA, 'utf8')) }; } catch {}
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await mkdir(join(HERE, 'data'), { recursive: true });
    await writeFile(DATA, JSON.stringify(db));
  }, 500);
}

const hash = (s) => createHash('sha256').update(String(s)).digest('hex');
function authorize(id, secret) {
  if (!secret || secret.length < 10) return false;
  if (!db.secrets[id]) { db.secrets[id] = hash(secret); return true; }
  return db.secrets[id] === hash(secret);
}

function readBody(req, limit = 400 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('grande demais')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function api(req, res, parts) {
  if (parts[0] === 'ping') return json(res, 200, { ok: true });
  const secret = req.headers['x-secret'];
  if (parts[0] === 'c' && COLLECTIONS.has(parts[1])) {
    const col = (db.docs[parts[1]] ||= {});
    if (parts.length === 2 && req.method === 'GET') return json(res, 200, Object.entries(col).map(([id, d]) => ({ id, ...d })));
    const id = parts[2];
    if (!ID_RE.test(id || '')) return json(res, 400, { error: 'id inválido' });
    if (req.method === 'GET') return col[id] ? json(res, 200, { id, ...col[id] }) : json(res, 404, { error: 'não encontrado' });
    if (req.method === 'PUT') {
      if (!authorize(id, secret)) return json(res, 403, { error: 'sem permissão' });
      const body = await readBody(req);
      if (typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'corpo inválido' });
      col[id] = body;
      persist();
      return json(res, 200, { ok: true });
    }
  }
  if (parts[0] === 'save' && ID_RE.test(parts[1] || '')) {
    const id = parts[1];
    if (!authorize(id, secret)) return json(res, 403, { error: 'sem permissão' });
    if (req.method === 'GET') return json(res, 200, db.saves[id] || null);
    if (req.method === 'PUT') { db.saves[id] = await readBody(req, 600 * 1024); persist(); return json(res, 200, { ok: true }); }
  }
  return json(res, 404, { error: 'rota desconhecida' });
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname.slice(5).split('/').filter(Boolean));
    const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(ROOT, path);
    if (!file.startsWith(ROOT)) throw new Error('forbidden');
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    if (!res.headersSent) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404'); }
  }
}).listen(PORT, () => console.log(`Oficina Nitro rodando em http://localhost:${PORT} (online em /api)`));
