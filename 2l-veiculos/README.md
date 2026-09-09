# 2L Veículos — Site Institucional

Site premium e cinematográfico para a **2L Veículos** (Trindade/GO), construído com Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion e Lenis (smooth scroll).

## Como rodar

```bash
cd 2l-veiculos
npm install
npm run dev
```

Acesse `http://localhost:3000`.

```bash
npm run build   # build de produção
npm run start   # servir o build
npm run lint    # checagem de lint
```

## O que já está pronto

- Hero cinematográfico com abertura em fases (escuridão → carro → texto), parallax de scroll e navbar que se transforma ao rolar.
- Estoque real da 2L (27 veículos) com cards premium, filtros (marca, categoria, câmbio, combustível, busca, ordenação).
- Página de veículo individual com galeria, especificações, opcionais, veículos semelhantes e CTA de WhatsApp com mensagem pré-preenchida.
- Seções institucionais: Sobre, Diferenciais, Clientes (prova social com entregas reais), Financiamento/Consignação/Avaliação, Instagram, Vendedores, CTA final.
- Menu mobile fullscreen, cursor customizado (desktop), loading screen, botão flutuante de WhatsApp, barra de progresso de scroll.
- SEO: metadata dinâmica por veículo, Open Graph, sitemap.xml, robots.txt, JSON-LD (`AutomotiveBusiness`).
- `prefers-reduced-motion` respeitado (desativa animações pesadas).

## Dados reais utilizados

Todo o conteúdo do site vem de fontes públicas reais da 2L Veículos — nada foi inventado:

- **Instagram** [@2lveiculoss](https://www.instagram.com/2lveiculoss/) (bio, WhatsApp)
- **Site institucional oficial** [2lveiculos.netlify.app](https://2lveiculos.netlify.app/), incluindo o endpoint público `/api/config` que alimenta a vitrine deles (estoque, textos, endereço, contato)

Isso inclui:

- Nome, endereço completo (`Av. Manoel Monteiro, 80 — Jardim Salvador, Trindade/GO, 75388-565`), os dois números de WhatsApp, e o nome do contato atual (**Lucas**)
- Textos institucionais reais (tagline, "por que comprar na 2L", copy de financiamento/consignação, prova social)
- **Estoque real** (27 veículos, com marca/modelo/versão/ano/km/câmbio/combustível/cor/preço e fotos reais) em [`data/vehicles.ts`](./data/vehicles.ts) — as fotos ficam hospedadas no domínio oficial da 2L
- Fotos reais da fachada da loja e de entregas de veículos (Hero, Sobre, seção "Clientes")

Tudo centralizado em [`data/site.ts`](./data/site.ts) e [`data/vehicles.ts`](./data/vehicles.ts), com comentários `CONFIRMADO`/`PENDENTE` indicando a origem de cada dado.

### ⚠️ O que ainda falta

| Item | Onde | Status |
|---|---|---|
| Equipe de vendedores (fotos + nomes além do Lucas) | `data/sellers.ts` | Array vazio, pronto para receber `{ id, name, role, image, whatsapp, bio }` |
| Número de veículos vendidos / clientes atendidos | `data/site.ts` (`vehiclesSold`, `happyCustomers`) | Não publicado publicamente — `undefined`, a seção só mostra o que existe |
| Horário de atendimento exato | `app/contato/page.tsx` | O próprio site institucional pede para consultar via WhatsApp |
| Posts reais do Instagram no feed do site | `components/home/InstagramFeed.tsx` | Estrutura pronta para receber posts manualmente ou via integração com a API do Instagram |
| Outras redes sociais (Facebook etc.) | `data/site.ts` (`social.facebook`) | Não confirmado |

### Importante sobre o estoque

O estoque em `data/vehicles.ts` é um **retrato do momento em que foi extraído** do site institucional da 2L. Carros vendidos saem do estoque e novos entram com frequência — atualize esta lista periodicamente (o ideal é conectar a uma fonte de dados que a 2L já mantenha atualizada, como o painel que gera o `/api/config` do site institucional deles, ou um backend próprio).

## Conectando dados reais no futuro

`data/vehicles.ts` e `data/sellers.ts` exportam funções simples (`getFeaturedVehicles`, `getVehicleBySlug`, etc.). Quando a 2L tiver um backend (Supabase, API própria, CMS), basta trocar essas funções por chamadas assíncronas — nenhum componente precisa mudar.

## Identidade visual

Paleta preta + dourado/bronze metálico, inspirada no logo real da marca (fundo preto/cinza grafite, "2L" em relevo dourado). Tipografia: **Bebas Neue** (display, títulos grandes) + **Inter** (texto). Tokens de cor em `app/globals.css` e `tailwind.config.ts`.
