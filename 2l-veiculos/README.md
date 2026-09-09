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
- Estoque com cards premium, filtros (marca, categoria, câmbio, combustível, busca, ordenação).
- Página de veículo individual com galeria, especificações, opcionais, veículos semelhantes e CTA de WhatsApp com mensagem pré-preenchida.
- Seções institucionais: Sobre, Diferenciais, Experiência 2L, Instagram, Vendedores, CTA final.
- Menu mobile fullscreen, cursor customizado (desktop), loading screen, botão flutuante de WhatsApp, barra de progresso de scroll.
- SEO: metadata dinâmica por veículo, Open Graph, sitemap.xml, robots.txt, JSON-LD (`AutomotiveBusiness`).
- `prefers-reduced-motion` respeitado (desativa animações pesadas).

## ⚠️ O que precisa ser preenchido com dados reais

Todo esse conteúdo está **claramente marcado no código** (procure por `PENDENTE`) e não foi inventado:

| Item | Onde | Status |
|---|---|---|
| Estoque real de veículos (fotos, preço, km, etc.) | `data/vehicles.ts` | 6 veículos de **exemplo** (`isPlaceholder: true`), com fotos de banco de imagens (Unsplash) |
| Equipe de vendedores | `data/sellers.ts` | Array vazio, pronto para receber `{ id, name, role, image, whatsapp, bio }` |
| Fotos reais da loja/equipe/bastidores | `components/home/AboutSection.tsx`, `ExperienceSection.tsx`, `Hero.tsx` | Usando fotos de banco de imagens como placeholder |
| Número de veículos vendidos / clientes atendidos | `data/site.ts` (`vehiclesSold`, `happyCustomers`) | Não publicado publicamente — `undefined`, a seção só mostra o que existe |
| Horário de atendimento | `app/contato/page.tsx` | Não confirmado — mensagem indica consultar via WhatsApp |
| Posts reais do Instagram | `components/home/InstagramFeed.tsx` | Estrutura pronta para receber posts manualmente ou via integração com a API do Instagram |
| Outras redes sociais (Facebook etc.) | `data/site.ts` (`social.facebook`) | Não confirmado |

### Dados confirmados publicamente (usados no site)

Extraídos do Instagram [@2lveiculoss](https://www.instagram.com/2lveiculoss/) e do site institucional [2lveiculos.com.br](https://2lveiculos.com.br/):

- Nome: **2L Veículos**
- Localização: Trindade-GO — Av. Manoel Monteiro, Jardim Salvador, nº 80
- WhatsApp principal: (62) 98516-9550 · WhatsApp alternativo: (62) 98456-1510
- "12 anos de experiência em veículos" · Compra, Venda, Troca, Financiamento
- Missão: oferecer as melhores ofertas com responsabilidade e dedicação

Tudo isso está centralizado em [`data/site.ts`](./data/site.ts).

## Conectando dados reais no futuro

`data/vehicles.ts` e `data/sellers.ts` exportam funções simples (`getFeaturedVehicles`, `getVehicleBySlug`, etc.). Quando a 2L tiver um backend (Supabase, API própria, CMS), basta trocar essas funções por chamadas assíncronas — nenhum componente precisa mudar.

## Identidade visual

Paleta preta + dourado/bronze metálico, inspirada no logo da marca (fundo preto, "2L" em gradiente dourado). Tipografia: **Bebas Neue** (display, títulos grandes) + **Inter** (texto). Tokens de cor em `app/globals.css` e `tailwind.config.ts`.
