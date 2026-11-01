# 🔧 Oficina Nitro

Jogo 3D de construir e gerenciar uma **oficina de carros personalizados**, com visual cartunesco: modelos fofos, cores fortes, botões "de borracha", animações com quique, dia e noite e uma rua cheia de vida.

Clientes chegam com carros quebrados, sujos, enferrujados ou querendo personalizar. Você conserta, lava, abastece, pinta e equipa os carros, ganha moedas e expande a oficina até ter **posto de combustível, showroom, box de restauração e uma pista de corrida**.

## ▶️ Como jogar

```bash
cd oficina-nitro
npm start          # abre em http://localhost:5174
```

Não precisa instalar nada além do Node 18+. O 3D (Three.js) e as fontes vêm de CDN, então precisa de internet. Também funciona em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages): basta publicar a pasta `public/`.

```bash
npm test           # simula 60 minutos de jogo automático e confere as regras
```

## 🎮 Como funciona

| Você faz | O que acontece |
|---|---|
| Toca no carro do cliente | O balão mostra **exatamente o que ele quer** (o serviço, ou a cor, a roda e o aerofólio pedidos) e a carinha fica brava se demorar. O carro entra no serviço certo |
| Toca várias vezes no serviço | Acelera o trabalho (⚡). Serviços longos mostram as etapas: "Desmontando… Retificando… Montando…" |
| Toca nas moedas | Recebe o pagamento e o carro vai embora buzinando e dando pulinho |
| Personaliza na Cabine de Estilo | **Cor, rodas, aerofólio, neon e adesivo**, com miniaturas 3D de cada peça. Acertar o pedido dá ⭐⭐⭐ e peças extras dão gorjeta |
| Atende **clientes VIP** 👑 | Pedidos mais difíceis, pagam 2,5x |
| Constrói (com obra e andaime) | Elevadores, lava-jato, **posto de combustível**, loja de peças (renda passiva), **box de restauração**, **showroom** e 15 decorações |
| Compra **terrenos vizinhos** | A oficina cresce para o lado (placa "À VENDA") |
| Compra a **Pista de Corrida** | Fica atrás da oficina, com arquibancada |
| **Leilão → Restauração → Garagem** | Compre uma sucata, restaure (etapas: funilaria, pintura, montagem…), personalize, prepare motor, turbo e pneus. Depois **corra** ou **venda** com lucro |
| Corre na pista | Contagem regressiva, 4 carros, câmera seguindo você e botão **NITRO** (3 cargas). Prêmios e troféus, que dão fama |

**Para o jogador voltar:** missões que se renovam, presente diário com sequência de dias, loja e obras que continuam enquanto você está fora (até 8 h), dicas de novidades a cada nível, campeonatos cada vez mais difíceis e uma coleção de carros para completar.

**Som:** música de fundo própria (composta e tocada pelo jogo, sem arquivos), mais abafada à noite, passarinhos de dia e grilos à noite. Música e efeitos têm botões separados.

## 🧱 Arquitetura

```
public/src/
  data.js     catálogos: construções, peças, carros, serviços, terrenos, corridas, curva de XP
  logic.js    regras e economia — funções puras sobre um estado JSON (sem 3D e sem DOM)
  models.js   modelos 3D feitos em código: carros, pessoas, construções, decoração, pista
  world.js    cena 3D: câmera, terreno expansível, dia/noite, trânsito, pedestres, obras, efeitos
  race.js     corrida: física simples, IA dos rivais, nitro, câmera seguindo
  garage.js   garagem: coleção, leilão, preparação, inscrição nas corridas
  preview.js  miniaturas 3D das peças/construções e visualizador giratório da garagem
  icons.js    ícones desenhados em SVG
  audio.js    música e efeitos sintetizados (WebAudio)
  main.js     interface: balões, personalização, loja, missões, níveis, toque/arrastar/zoom, salvamento
```

## 🌐 Caminho para o online

Como `logic.js` é puro e o estado é JSON, o online entra sem reescrever o jogo:

1. **Conta e salvamento na nuvem:** o estado vai para um banco (Supabase/Postgres), e o jogador continua de qualquer aparelho.
2. **Servidor valida as ações:** o cliente envia "construir X em (x,z)", "entregar personalização Y" e o servidor roda o mesmo `logic.js` para conferir (anti-trapaça).
3. **Corridas contra amigos:** os rivais da pista passam a ser carros reais de outros jogadores (fantasmas das melhores voltas).
4. **Social:** visitar a oficina dos amigos, ranking de fama e uma vitrine semanal dos carros mais bonitos, com votação.
