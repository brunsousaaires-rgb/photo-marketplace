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
| Compra **terrenos** | 6 terrenos em volta da oficina (direita, esquerda e fundos), cada um com nível mínimo e preço, e só quando encosta num terreno seu. Placa "À VENDA" no mapa ou aba Expansões; o piso sobe do chão com poeira e confete |
| Compra a **Pista de Corrida** | Fica atrás da oficina, com arquibancada |
| **Leilão → Restauração → Garagem** | Compre uma sucata, restaure (etapas: funilaria, pintura, montagem…), personalize, prepare motor, turbo e pneus. Depois **corra** ou **venda** com lucro |
| Corre na pista | Contagem regressiva, 4 carros, câmera seguindo você e botão **NITRO** (3 cargas). Prêmios e troféus, que dão fama |

| Atende **clientes conhecidos** | 8 personagens com retrato, carro próprio e uma história em 5 capítulos (Seu Zé, Vó Cida, Tião do Frete, Dona Marlene, Sargento Pires, Ritinha Racer, Kaio Influencer, Dr. Augusto). A amizade dá presentes e aparece no **Álbum** |
| Atende **chamados de guincho** | Minijogo: dirija o guincho pela avenida trocando de faixa, desvie de cones, barreiras, óleo e carros, pegue moedas e reboque o carro, que vira um conserto bem pago |
| Abre **caixas de prêmio** | Bronze, prata e ouro (corridas, evento, amigos, guincho perfeito e concurso) com **13 peças raras**: cromado, camaleão, perolado, fosco, rodas Turbina e Aro Neon, Asa Drift, chamas, relâmpago, xadrez, neon arco-íris… Peça rara como extra dá gorjeta muito maior |
| Joga o **evento da semana** | Muda sozinho pela semana do calendário: Semana do Neon, Rali da Lama, Copa Nitro e Festival do Pastel, com pontos e peça exclusiva |
| Contrata a **equipe** | 8 funcionários com habilidades (mecânico, lavador, pintora, frentista, gerente, vendedor, restaurador e piloto), treino até nível 3 e cor de uniforme |
| Enfrenta a **chuva** | Chove de verdade na cena, com céu escuro, som de chuva e muito carro enlameado para o lava-jato |
| Tira **fotos** | Estúdio com 4 cenários e 4 ângulos para salvar a foto do carro |
| Joga **online** | Visita e curte a oficina dos amigos, desafia o melhor carro deles na pista, vota no **concurso semanal** do carro mais bonito (os 3 primeiros ganham caixas) e salva o jogo na nuvem |

**Cidade e trânsito:** em volta da oficina tem praça com calçadão de ondas, chafariz e coreto, lojinhas, igreja, prédio, campinho, parque com lago e patinhos, parquinho, mercadinho, ponto de ônibus e o letreiro NITRO no morro. Entre 4 e 8 veículos circulam por **rotas de waypoints**: entram por uma ponta do mapa e saem por outra, fazem curvas suaves nos cruzamentos, param no **semáforo** da rua transversal e dão a vez para a avenida no cruzamento sem semáforo. Seis modelos cartoon (hatch, sedã, picape, esportivo, van e jipe), mais táxi e van de entrega.

**Câmera livre:** arrastar (mouse ou um dedo, com inércia), zoom na rodinha ou com dois dedos sempre no ponto do cursor ou dos dedos, limites do mapa e botão de voltar para a oficina.

**Trânsito de verdade:** nenhum carro atravessa outro. As vagas de espera nunca ficam na frente da entrada de um box. A rua tem mão e contramão, os carros freiam e seguem o da frente, olham para trás antes de entrar na faixa e reservam o espaço da manobra. Quem chegou primeiro tem a preferência, e retornos em U, saídas de ré e pedestres são respeitados. Na pista, os carros ultrapassam pela outra faixa ou seguem colados atrás, inclusive ao dar volta em retardatários.

**No celular:** quando um cliente esperando, um serviço pronto ou um chamado fica fora da tela, aparece uma setinha na borda; é só tocar nela. A loja vira uma lista compacta, a câmera vai até a construção que você está posicionando e, com o celular deitado, a Cabine de Estilo abre em painel lateral para o carro continuar visível. O Menu ganhou configurações de música, efeitos, vibração (Android) e tela cheia.

**Para o jogador voltar:** missões que se renovam, presente diário com sequência de dias, loja e obras que continuam enquanto você está fora (até 8 h), dicas de novidades a cada nível, campeonatos cada vez mais difíceis e uma coleção de carros para completar.

**Som:** música de fundo própria (composta e tocada pelo jogo, sem arquivos), mais abafada à noite, passarinhos de dia e grilos à noite. Música e efeitos têm botões separados.

## 🌐 Online

- **No link publicado do Claude:** o jogo usa o banco de dados compartilhado do próprio link. Compartilhe com os amigos com permissão de **Contribuidor** e todos aparecem nas Oficinas, no concurso e nos desafios. O salvamento na nuvem é privado de cada pessoa.
- **Rodando com `npm start`:** o `server.js` oferece a mesma API em `/api` e guarda tudo em `data/online.json`. Cada navegador recebe um id e um segredo, e só quem tem o segredo escreve nos próprios dados.

## 🧱 Arquitetura

```
public/src/
  data.js     catálogos: construções, peças, carros, serviços, terrenos, corridas, curva de XP
  logic.js    regras e economia — funções puras sobre um estado JSON (sem 3D e sem DOM)
  models.js   modelos 3D feitos em código: carros, pessoas, construções, decoração, pista
  world.js    cena 3D: câmera, terreno expansível, dia/noite, trânsito, pedestres, obras, efeitos
  traffic.js  trânsito: corpos dos carros, freio, preferência, entrada na faixa, sem sobreposição
  roads.js    rede de ruas: faixas com sentido, cruzamentos, curvas, rotas e tipos de veículo
  city.js     a cidade em volta (praça, lojas, parque, campinho...) juntada em blocos por região
  race.js     corrida: física simples, IA dos rivais, ultrapassagem, nitro, câmera seguindo
  garage.js   garagem: coleção, leilão, preparação, inscrição nas corridas
  preview.js  miniaturas 3D das peças/construções e visualizador giratório da garagem
  icons.js    ícones desenhados em SVG
  audio.js    música e efeitos sintetizados (WebAudio)
  tow.js      minijogo do guincho
  photo.js    estúdio de fotos
  online.js   camada online (banco do link publicado ou API do server.js) e nuvem
  social.js   telas online: oficinas, visita, curtidas, desafios, concurso, perfil
  extras.js   menu, clientes fixos, álbum, caixas, peças raras, evento, equipe, foto
  main.js     interface: balões, personalização, loja, missões, níveis, toque/arrastar/zoom, salvamento
```

## 🧭 Como crescer o mapa

- **Novo terreno:** acrescente um item em `LAND` (`data.js`) com `x, z, w, h` na grade, `cost`, `lvl` e `needs` (terrenos que precisam vir antes). A cerca, a placa, a compra e a animação saem sozinhas.
- **Nova rua:** acrescente faixas (com sentido) e, se for o caso, um nó de cruzamento em `buildRoads()` (`roads.js`). As rotas são recalculadas sozinhas; desenhe o asfalto em `city.js`.
- **Novo tipo de veículo:** acrescente em `VEHICLE_KINDS` (`roads.js`) o modelo, a velocidade e a frequência.

O save tem versão (`v: 3`) e `migrate()` converte saves antigos sem perder moedas, XP, nível, construções ou terrenos.

## 🔜 Próximos passos

O online já existe. Para um jogo grande, o passo seguinte é o servidor validar as ações com o mesmo `logic.js` (anti-trapaça), já que hoje cada jogador calcula as próprias moedas.
