# 🔧 Oficina Nitro

Jogo 3D de construir e gerenciar uma **oficina de carros personalizados**, com visual cartunesco: modelos fofos, cores fortes, botões "de borracha" e animações com quique.

Clientes chegam com carros quebrados, sujos ou querendo personalizar. Você conserta, lava, pinta e equipa os carros, ganha moedas e expande a oficina com novos serviços e decorações.

## ▶️ Como jogar

```bash
cd oficina-nitro
npm start          # abre em http://localhost:5174
```

Não precisa instalar nada além do Node 18+. O 3D (Three.js) e as fontes vêm de CDN, então precisa de internet. Também funciona em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages): basta publicar a pasta `public/`.

```bash
npm test           # simula 40 minutos de jogo automático e confere as regras
```

## 🎮 Como funciona

| Você faz | O que acontece |
|---|---|
| Toca no carro do cliente | Ele entra no serviço certo: 🔧 Elevador, 🫧 Lava-Jato ou 🎨 Cabine de Estilo |
| Toca várias vezes no serviço | Acelera o trabalho (⚡) |
| Toca nas moedas | Recebe o pagamento e o carro vai embora buzinando |
| Personaliza na Cabine | Escolhe **cor, rodas, aerofólio, neon e adesivo**. Acertar o pedido dá ⭐⭐⭐ e peças extras dão gorjeta |
| Constrói (🛠️) | Novos elevadores, lava-jato, loja de acessórios (renda passiva) e decorações |
| Decora | Cada decoração dá ⭐ **fama**, que traz clientes mais rápido e gorjetas maiores |
| Melhora construções | Até ★★★★★: serviços mais rápidos, mais gorjeta e mais renda |

**Para o jogador voltar:** missões que se renovam, presente diário com sequência de dias, a loja que acumula dinheiro enquanto você está fora (até 8 h), níveis que liberam peças, cores, carros (hatch, sedã, picape, esportivo e van) e construções novas. Também há um tutorial guiado nos primeiros minutos.

**Regra de construção:** todo serviço precisa de um corredor livre até a rua (a faixa de asfalto amarela). O jogo não deixa construir em cima dele.

O progresso fica salvo no navegador (localStorage).

## 🧱 Arquitetura

```
public/src/
  data.js     catálogos: construções, peças, carros, serviços, curva de XP
  logic.js    regras e economia — funções puras sobre um estado JSON (sem 3D e sem DOM)
  models.js   modelos 3D feitos em código: carros por peças, construções, decoração, mecânicos
  world.js    cena 3D: câmera isométrica, terreno, rua, carros andando, partículas, modo construção
  main.js     interface: balões, personalização, loja, missões, níveis, toque/arrastar/zoom, salvamento
  audio.js    efeitos sonoros sintetizados (WebAudio)
```

## 🌐 Caminho para o online

Como `logic.js` é puro e o estado é JSON, o online entra sem reescrever o jogo:

1. **Conta e salvamento na nuvem:** o estado vai para um banco (Supabase/Postgres), e o jogador continua de qualquer aparelho.
2. **Servidor valida as ações:** o cliente envia "construir X em (x,z)", "entregar personalização Y" e o servidor roda o mesmo `logic.js` para conferir (anti-trapaça).
3. **Social:** visitar a oficina dos amigos, ranking de fama e uma vitrine de carros personalizados com votação semanal.
4. **Eventos:** clientes VIP e desafios de temporada.
