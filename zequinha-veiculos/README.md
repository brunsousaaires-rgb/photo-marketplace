# Zequinha Veículos — Site

Experiência digital automotiva para a **Zequinha Veículos** (Trindade – GO),
construída com Next.js 14 (App Router), TypeScript, Tailwind CSS, GSAP e
Framer Motion.

Abertura cinematográfica com a Fiat Toro entrando em alta velocidade, freando
e parando no centro da tela, seguida por estoque filtrável, página de
veículo, seções de destaque, compra/venda/troca com formulário de avaliação,
mural de clientes, Instagram e WhatsApp — tudo com o visual preto / branco /
turquesa da marca.

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

## Como adicionar dados reais

Este projeto foi construído para **nunca inventar informações da loja**.
Enquanto os dados reais não são enviados, o site usa estados vazios/"em
breve" honestos em vez de conteúdo fictício. Para publicar com dados reais:

### 1. Veículos — `data/vehicles.ts`

Copie o objeto de exemplo (Fiat Toro) e preencha `year`, `mileageKm`,
`transmission`, `fuel` e `price` com os dados reais. Assim que houver fotos
profissionais do veículo:

1. Salve as imagens em `public/vehicles/<slug>/01.jpg`, `02.jpg`, ...
2. Preencha `images: ["/vehicles/<slug>/01.jpg", ...]`
3. Mude `hasRealPhotos` para `true`

Enquanto `hasRealPhotos` for `false`, o card e a página do veículo mostram a
ilustração vetorial da marca (`ToroSilhouette`) em vez de fingir uma foto
real — isso é intencional.

### 2. Clientes — `data/clients.ts`

Array vazio por padrão. Adicione um objeto por cliente real (nome, foto em
`public/clients/`, veículo e depoimento opcionais). Nada aqui deve ser
inventado.

### 3. Instagram — `data/instagram.ts`

Vazio por padrão (não fazemos scraping do Instagram). Para mostrar posts
reais, integre a Instagram Basic Display/Graph API e popule este array no
servidor. Os números de seguidores/publicações exibidos em
`components/sections/InstagramSection.tsx` são os valores públicos reais do
perfil @zequinha_veiculos capturados no momento da criação do site — **atualize-os
periodicamente**, pois mudam com o tempo.

### 4. Localização — `lib/site.config.ts`

`site.address` está com os campos em `null`. Assim que a Zequinha informar o
endereço completo, preencha e conecte um mapa (Google Maps embed ou Mapbox)
na página — o campo já está preparado.

### 5. Formulário de avaliação

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
  ui/                      primitivos (Reveal, Counter, cursor, botão magnético)
  vehicles/                ToroHero, ToroSilhouette, VehicleCard, VehicleGallery, VehicleFilters
  sections/                Stock, FeaturedVehicle, CompraVendaTroca, Sobre, ClientGallery, InstagramSection, Footer
data/                      vehicles.ts, clients.ts, instagram.ts
lib/                       site.config.ts, whatsapp.ts, utils.ts
```

## Notas técnicas

- A abertura (`components/vehicles/ToroHero.tsx`) simula profundidade e
  física com transforms (translate/scale/rotate/blur) sobre uma ilustração
  vetorial em camadas — não há vídeo nem modelo 3D real. Se um vídeo ou
  modelo 3D real da Toro ficar disponível no futuro, ele pode substituir o
  `ToroSilhouette` mantendo a mesma timeline de GSAP.
- `prefers-reduced-motion` é respeitado: a abertura cinematográfica vira um
  fade simples e o smooth scroll (Lenis) é desativado.
- O botão do WhatsApp nunca tem o número hardcoded — sempre via
  `lib/whatsapp.ts` + `NEXT_PUBLIC_WHATSAPP_NUMBER`.
