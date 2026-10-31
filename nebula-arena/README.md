# 🌌 Nébula Arena

Arena de tiro top-down para navegador, com progressão roguelite. Você coleta cristais de energia, sobe de nível, escolhe melhorias e derruba os outros jogadores para virar o **Rei da Arena 👑**.

> **Fase atual:** modo de teste com **15 bots (NPCs)**. A arquitetura já está separada para virar **online multiplayer** sem reescrever o jogo (veja o roteiro abaixo).

## ▶️ Como rodar

```bash
cd nebula-arena
npm start          # abre em http://localhost:5173
```

Não tem dependências: só precisa de Node 18+. Também dá para servir a pasta `public/` em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages).

```bash
npm test           # simula 3 minutos de partida só com bots e verifica o estado
```

## 🎮 Controles

| Ação | Desktop | Celular |
|---|---|---|
| Mover | WASD / setas | Joystick na metade esquerda |
| Mirar e atirar | Mouse + segurar clique (ou **F** = tiro automático) | Joystick na metade direita |
| Dash (com invencibilidade) | Espaço / Shift / clique direito | Botão DASH |
| Escolher melhoria | 1 · 2 · 3 ou clique | Toque na carta |
| Som | M | Botão 🔊 |

## 🔁 O que prende o jogador

- **Ciclo curto de recompensa:** cristais a cada segundo, nível a cada poucos segundos no começo e 3 cartas de melhoria por nível (12 melhorias, cada uma com níveis).
- **Risco e recompensa:** quem morre solta 35% da pontuação no chão, e quem mata ganha XP e cura. Derrubar o **Rei** (o 1º do ranking) vale +50%.
- **Momentos de destaque:** anúncios de *Abate Duplo*, *Em Chamas*, *Imparável*, *Top 3*, além de tremor de tela, partículas e sons sintetizados.
- **Meta-progressão:** cada partida dá XP de conta, que desbloqueia cores (até o arco-íris no nível 10). Recordes ficam salvos.
- **Recomeço instantâneo:** *Enter* na tela de morte e você já está de volta.
- **Bots com personalidade:** agressivo, caçador, coletor, equilibrado e covarde, cada um com habilidade de mira própria. Eles esquivam com dash, fogem com pouca vida e escolhem melhorias conforme o estilo.

## 🧱 Arquitetura (pensada para o online)

```
public/
  shared/          ← lógica pura, sem DOM: roda no navegador E no servidor
    constants.js   tamanhos, tempos, power-ups, curva de XP
    sim.js         simulação: movimento, tiros, dano, XP, orbes, rei, snapshot()
    upgrades.js    melhorias de nível
    bots.js        IA dos NPCs (gera o mesmo "input" que um humano)
  src/             ← só cliente
    localGame.js   sessão local (sim + bots no navegador)
    main.js        loop, HUD, menu, tela de morte
    render.js      Canvas 2D: câmera, glow, partículas, minimapa
    input.js       teclado/mouse/touch → { mx, my, angle, shoot, dash }
    audio.js       efeitos sonoros via WebAudio
    profile.js     progresso da conta (localStorage)
server.js          servidor estático (vira o servidor do jogo online)
```

O ponto principal é que **o cliente só conversa com a sessão** (`join`, `setInput`, `chooseUpgrade`, `respawn`, `update`, `drainEvents`, `world`). Hoje quem implementa essa interface é o `LocalGame`. No online, um `OnlineGame` com a mesma interface vai falar com o servidor por WebSocket.

## 🌐 Roteiro para o online

1. **Servidor autoritativo:** `server.js` passa a rodar `shared/sim.js` a 60 ticks/s, recebe `input` de cada jogador via WebSocket (`ws`) e envia `snapshot()` + eventos a 20–30 Hz.
2. **Cliente `OnlineGame`:** usa a mesma interface do `LocalGame`, com interpolação dos outros jogadores e predição do próprio movimento.
3. **Bots completam as salas:** o servidor mantém, por exemplo, 16 participantes por sala e coloca bots onde faltam humanos (`bots.js` já funciona no servidor).
4. **Contas e ranking global:** o perfil sai do `localStorage` e vai para o banco (Supabase/Postgres), com ranking diário e semanal.
5. **Anti-trapaça:** o servidor valida tudo (o cliente só envia intenção), com limite de taxa de input e de tiro.
6. **Deploy:** Node num host com WebSocket (Fly.io, Railway, Render) e salas por região.
