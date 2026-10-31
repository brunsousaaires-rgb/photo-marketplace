// Servidor do Nébula Arena: arquivos do jogo + multiplayer em tempo real (WebSocket em /ws).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Room } from './server/room.js';
import { CFG } from './public/shared/constants.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const PORT = Number(process.env.PORT) || 5173;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const rooms = [];
let roomSeq = 1;
function pickRoom() {
  let room = rooms.find((r) => r.hasRoom());
  if (!room) { room = new Room(roomSeq++); rooms.push(room); }
  return room;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, rooms: rooms.map((r) => ({ id: r.id, humans: r.humans, players: r.world.players.size })) }));
      return;
    }
    const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(ROOT, path);
    if (!file.startsWith(ROOT)) throw new Error('forbidden');
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404');
  }
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4 * 1024 });
wss.on('connection', (ws) => {
  let room = null, id = null, budget = 200, lastRefill = Date.now();
  ws.on('message', (data) => {
    // Limite simples de mensagens por segundo (anti-flood).
    const now = Date.now();
    budget = Math.min(200, budget + ((now - lastRefill) / 1000) * 120);
    lastRefill = now;
    if (--budget < 0) return;
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'join' && !room) {
      room = pickRoom();
      id = room.join(ws, msg);
      console.log(`+ ${msg.name} entrou na sala ${room.id} (${room.humans} humanos)`);
    } else if (room && id) {
      room.handle(id, msg);
    }
  });
  ws.on('close', () => {
    if (room && id) {
      room.leave(id);
      console.log(`- jogador saiu da sala ${room.id} (${room.humans} humanos)`);
      if (room.humans === 0 && rooms.length > 1) rooms.splice(rooms.indexOf(room), 1);
    }
  });
});

// Laço fixo de 60 ticks/s para todas as salas.
const TICK_MS = 1000 / CFG.tickRate;
let next = performance.now();
function loop() {
  const now = performance.now();
  let n = 0;
  while (now >= next && n < 5) {
    for (const r of rooms) if (r.humans > 0) r.tick();
    next += TICK_MS;
    n++;
  }
  if (now - next > 250) next = now; // servidor ficou muito para trás: não tenta compensar tudo
  setTimeout(loop, Math.max(0, next - performance.now()));
}
loop();

server.listen(PORT, () => console.log(`Nébula Arena rodando em http://localhost:${PORT} (online em /ws)`));
