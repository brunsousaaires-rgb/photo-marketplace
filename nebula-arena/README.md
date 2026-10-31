# 🌌 Nébula Arena

Arena de tiro top-down para navegador, com progressão roguelite. Você coleta cristais de energia, sobe de nível, escolhe melhorias e derruba os outros jogadores para virar o **Rei da Arena 👑**.

> **Modos:** **Online** (várias pessoas na mesma arena, com bots completando a sala até 16 participantes) e **Treino com bots** (roda só no navegador).

## ▶️ Como rodar

```bash
cd nebula-arena
npm start          # abre em http://localhost:5173
```

Precisa de Node 18+ (`npm install` instala o `ws`, única dependência). Abra o endereço em duas abas ou dois computadores da mesma rede para jogarem juntos.

Só a pasta `public/` numa hospedagem estática roda apenas o modo treino.

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
    onlineGame.js  sessão online (WebSocket, suavização entre snapshots)
server/room.js     sala online: simulação autoritativa a 60 ticks/s + bots
server.js          arquivos do jogo + WebSocket em /ws + /health
```

O ponto principal é que **o cliente só conversa com a sessão** (`join`, `setInput`, `chooseUpgrade`, `respawn`, `update`, `drainEvents`, `world`). Hoje quem implementa essa interface é o `LocalGame`. No online, um `OnlineGame` com a mesma interface vai falar com o servidor por WebSocket.

## 🌐 Como o online funciona

- O servidor roda a mesma `shared/sim.js` a 60 ticks/s e é a única autoridade. O cliente só envia a intenção (`mover`, `mirar`, `atirar`, `dash`, `melhoria`), já validada e com limite de mensagens.
- Ele envia 20 snapshots por segundo para cada jogador, só com os orbes, tiros e eventos perto dele, o que economiza banda.
- Cada sala tem até 24 humanos. Os bots completam até 16 participantes e saem quando entra gente. Uma sala nova abre quando a anterior lota.

## 🚀 Publicar na internet (Render, grátis)

1. Crie uma conta em https://render.com e conecte o GitHub.
2. Clique em **New → Blueprint** e escolha este repositório. O `render.yaml` na raiz já configura tudo.
3. Em ~2 minutos sai um link `https://nebula-arena-xxxx.onrender.com`, e é só mandar para os amigos.

No plano gratuito o servidor "dorme" depois de 15 minutos sem acesso, e a primeira entrada demora uns 30 segundos.

## 🔜 Próximos passos

1. Contas e ranking global salvos em banco (Supabase/Postgres), com ranking diário e semanal.
2. Predição do movimento do próprio jogador, para ficar ainda mais responsivo com internet lenta.
3. Salas por região e escolha de sala/convite de amigos.
