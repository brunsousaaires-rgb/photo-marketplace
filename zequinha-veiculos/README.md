# Zequinha Veículos — Site

Experiência digital automotiva para a **Zequinha Veículos** (Trindade – GO),
construída com Next.js 14 (App Router), TypeScript, Tailwind CSS, GSAP e
Framer Motion.

Abertura cinematográfica com um vídeo real de uma RAM Rampage branca sob luz
de estúdio (cortina abrindo, faróis acendendo, câmera em arco até assentar),
seguida por estoque filtrável com cards de hover físico (tilt 3D), página de
veículo, seções de destaque com parallax no scroll, compra/venda/troca com
formulário de avaliação (com estado de sucesso), mural de clientes,
Instagram e WhatsApp — tudo com o visual preto / branco / turquesa da marca.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # ajuste se necessário
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente

Veja `.env.example`. A mais importante é `NEXT_PUBLIC_WHATSAPP_NUMBER` — o
número único usado em **todo** o site (nunca hardcoded em outro lugar; tudo
passa por `lib/whatsapp.ts`).

## Sobre os dados do estoque

O estoque em `data/vehicles.ts` é uma **demonstração**: os modelos (Fiat
Toro, RAM Rampage, HB20, Civic, Renegade, Strada, Onix) são reais, mas ano,
km, preço e a foto específica de cada anúncio são fictícios/de exemplo —
as fotos vêm do Wikimedia Commons (licença livre), não são fotos do veículo
real à venda. Quando a loja tiver o estoque real:

1. Edite `data/vehicles.ts`: ajuste `year`, `mileageKm`, `transmission`,
   `fuel`, `price` e `description` para os dados reais de cada carro.
2. Troque as fotos: salve as fotos reais em
   `public/vehicles/<slug>/01.jpg`, `02.jpg`, ... e atualize `images` para
   apontar para elas (mantendo `hasRealPhotos: true`).
3. Adicione ou remova veículos copiando/apagando objetos do array.

Enquanto um veículo não tiver nenhuma foto (`hasRealPhotos: false` ou
`images: []`), o card e a página mostram um estado "Fotos em breve" em vez
de fingir uma foto real.

### Clientes — `data/clients.ts`

Array vazio por padrão. **Não foi possível puxar fotos automaticamente do
Instagram** (a Meta bloqueia scraping/acesso programático sem login e API
oficial), então o mural de clientes fica com um estado "em breve" honesto
em vez de usar fotos de pessoas que não são realmente clientes da loja.
Para popular de verdade: baixe manualmente as fotos do destaque
"Clientes" do Instagram @zequinha_veiculos, salve em `public/clients/` e
adicione um objeto por cliente (nome, foto, veículo/depoimento opcionais).

### Instagram — `data/instagram.ts`

Vazio por padrão (mesma limitação de scraping acima). Para mostrar posts
reais, integre a Instagram Basic Display/Graph API e popule este array no
servidor. Os números de seguidores/publicações exibidos em
`components/sections/InstagramSection.tsx` são os valores públicos reais do
perfil @zequinha_veiculos capturados no momento da criação do site —
**atualize-os periodicamente**, pois mudam com o tempo.

### Localização — `lib/site.config.ts`

`site.address` está com os campos em `null`. Assim que a Zequinha informar o
endereço completo, preencha e conecte um mapa (Google Maps embed ou Mapbox)
na página — o campo já está preparado.

### Vídeo de abertura — `public/hero/`

O vídeo do herói (`rampage-hero.mp4` / `.webm`, com `rampage-hero-poster.jpg`
como pôster) foi fornecido pelo usuário — uma RAM Rampage gerada por IA
(Gemini). Antes de entrar no site, o clipe original passou por três
tratamentos em `ffmpeg`:

1. Corte do primeiro frame (um flash branco de still de produto, ~1/24s).
2. Remoção da marca d'água de geração de IA (filtro `delogo`) no canto
   inferior direito.
3. Recodificação para web (H.264 + VP9/WebM, sem áudio, `faststart`).

Quando a loja tiver filmagem própria do veículo real (ou de qualquer outro
destaque), basta substituir os três arquivos em `public/hero/` mantendo os
mesmos nomes — `components/vehicles/VehicleHero.tsx` não precisa mudar.
O vídeo toca uma vez (sem loop) e para no último frame; com
`prefers-reduced-motion`, ele nunca chega a tocar — fica parado no pôster.

### Formulário de avaliação

`components/EvaluationForm.tsx` hoje monta uma mensagem de WhatsApp
pré-preenchida com os dados digitados (sem backend). Há um comentário
`TODO(backend)` no arquivo indicando onde plugar uma API/CRM real quando
existir.

## Estrutura

```
app/                      rotas (Next.js App Router)
  page.tsx                 home
  estoque/[slug]/page.tsx  página do veículo
components/
  ui/                      primitivos (Reveal, Counter, cursor, botão magnético, TiltCard)
  vehicles/                VehicleHero, VehicleCard, VehicleGallery, VehicleFilters
  sections/                Stock, FeaturedVehicle, CompraVendaTroca, Sobre, ClientGallery, InstagramSection, Footer
data/                      vehicles.ts, clients.ts, instagram.ts
lib/                       site.config.ts, whatsapp.ts, utils.ts
public/hero/               vídeo + pôster da abertura (ver seção acima)
```

## Notas técnicas

- A abertura (`components/vehicles/VehicleHero.tsx`) usa um `<video>` real
  (`public/hero/`) com uma cortina em `clip-path` que abre como em um
  comercial de carro, uma respiração sutil de zoom depois de assentado, e um
  acento turquesa da marca sincronizado com o momento em que o texto entra
  — sem WebGL, sem simulação de movimento.
- Os cards do estoque (`components/ui/TiltCard.tsx`) inclinam levemente em
  3D seguindo o cursor no hover, com brilho dinâmico — desliga sozinho em
  touch e `prefers-reduced-motion`.
- Todas as fotos de veículos são carregadas diretamente de URLs externas
  (Wikimedia Commons) via `next/image` — `next.config.js` permite qualquer
  host `https` (`remotePatterns`). Para produção, considere hospedar cópias
  próprias em `public/` para não depender da disponibilidade de terceiros.
- `prefers-reduced-motion` é respeitado: a abertura cinematográfica vira um
  fade simples e o smooth scroll (Lenis) é desativado.
- O botão do WhatsApp nunca tem o número hardcoded — sempre via
  `lib/whatsapp.ts` + `NEXT_PUBLIC_WHATSAPP_NUMBER`.
