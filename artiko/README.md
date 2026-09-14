# ARTIKO — Movimento sem dor, todo dia

Infoproduto digital: um quiz-app que monta um protocolo de exercícios de 6 semanas
para dor de ombro, coluna, joelho ou quadril, com paywall para desbloquear o
protocolo completo, e uma página de vendas para tráfego de remarketing.

Feito para ser vendido em plataformas de checkout como **Cakto**, **Kiwify**,
**Hotmart** ou **Shopify**: o app roda como site estático, o botão de compra
aponta para o link de checkout dessas plataformas.

## Stack

- **Vite + React + TypeScript** — SPA leve, build rápido, ótimo desempenho em
  celular e desktop.
- **Tailwind CSS v4** — design system com os tokens de marca da ARTIKO.
- **Framer Motion** — todas as transições, microinterações e reveals de scroll.
- **React Router** — duas rotas: o quiz (`/`) e a página de oferta (`/oferta`).

## Rodando localmente

```bash
npm install
npm run dev       # ambiente de desenvolvimento em http://localhost:5173
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção localmente
```

## Estrutura

```
src/
  components/   # Logo, botões, cards de opção, tabs de resultado, FAQ, etc.
  data/         # routines.ts — as 4 áreas x 3 fases x exercícios
  lib/          # checkout.ts — monta a URL de compra a partir do env
  pages/
    QuizApp.tsx   # hero -> 3 perguntas -> resultado com paywall (rota "/")
    SalesPage.tsx # página de vendas completa (rota "/oferta")
```

## Configurando o link de checkout

Copie `.env.example` para `.env` e defina:

```
VITE_CHECKOUT_URL=https://pay.cakto.com.br/seu-produto
```

Todos os botões de compra (no paywall do quiz e na página de oferta) usam essa
URL, anexando `?area=ombro|coluna|joelho|quadril` quando a pessoa já respondeu
o quiz — útil para segmentar o checkout ou o pixel de conversão por área de dor.
Sem essa variável, os botões apontam para a seção de preço da própria página
(`#preco`), o que também funciona para uma primeira publicação.

## Modo revisão

Na tela de resultado do quiz, acessando com `?preview=1` na URL (ex:
`https://seudominio.com/?preview=1`) aparece um botão "Modo revisão" que
desbloqueia todas as semanas do protocolo sem precisar comprar — útil para
gravar vídeos de vendas ou revisar o conteúdo. Esse botão nunca aparece para
quem acessa sem esse parâmetro.

## Publicando

O projeto gera um site 100% estático (`npm run build` → pasta `dist/`), então
funciona em qualquer host: Vercel, Netlify, GitHub Pages, ou como página
incorporada dentro do checkout da própria plataforma de vendas.

## Fonte do material de marca

O brandbook, a página de vendas original e o roteiro do funil de lançamento
usados como referência para este app estão documentados nas conversas de
design do produto (paleta, tipografia — Fraunces + Work Sans — e princípios de
layout já aplicados aqui).
