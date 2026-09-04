# 📸 Photo Marketplace

Plataforma para fotógrafos esportivos venderem fotos de eventos (vôlei, futevôlei, beach tennis, futebol, corrida, ciclismo...) em alta resolução. O fotógrafo cria o **evento**, sobe as fotos daquele dia; o atleta busca o evento onde jogou, vê as fotos com marca d'água e libera o download em HD assim que paga.

## ✨ Features

- 🔐 **Autenticação** — registro/login com JWT, contas de comprador e fotógrafo
- 🏆 **Eventos esportivos** — o fotógrafo organiza as fotos por evento (esporte, data, local, capa)
- 📷 **Upload em lote** — várias fotos de uma vez, com título e preço editáveis por foto
- 💧 **Marca d'água automática** — aplicada em tempo real com `sharp` em toda pré-visualização pública
- 🔎 **Busca por evento/esporte** — chips de esporte com contagem, busca por nome do evento ou cidade
- 🛒 **Carrinho de compras** — persistente no navegador, com barra de compra fixa no mobile
- 💳 **Pagamentos com Stripe Checkout** — ou modo demo automático caso as chaves não estejam configuradas
- 📥 **Download HD** — liberado apenas após confirmação do pagamento, servido por rota autenticada (nunca por URL pública)
- 📊 **Painel do fotógrafo** — eventos, portfólio, receita, vendas e downloads
- 🗂️ **Minhas compras** — histórico com download a qualquer momento
- 📱 **Mobile-first** — navegação inferior, grade em 2 colunas e botões de compra fixos no celular

## 🎨 Identidade visual

Tema escuro com verde-limão/ciano elétrico, tipografia condensada em caixa alta e cartões com marca d'água — inspirado em marketplaces de fotografia esportiva como o Foco Radical.

## 🛠️ Stack

**Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand
**Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL · Sharp · Stripe
**Infra:** Docker Compose · armazenamento local em disco (padrão) ou AWS S3 (opcional)

## 📋 Estrutura

```
photo-marketplace/
├── frontend/            # Next.js (App Router)
│   ├── app/              # Páginas: eventos, fotos, carrinho, painel...
│   ├── components/       # Componentes React (UI, EventCard, upload em lote...)
│   └── lib/               # API client, auth, carrinho, esportes, tipos
├── backend/              # API Express
│   ├── src/
│   │   ├── routes/        # Endpoints (auth, events, photos, payments, dashboard)
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── middleware/     # Autenticação, upload, erros
│   │   └── utils/          # JWT, storage, marca d'água (sharp), esportes
│   ├── prisma/            # Schema, migrations e seed
│   └── uploads/            # Armazenamento local (originais, previews, thumbs, capas)
├── render.yaml            # Deploy do backend + banco no Render
└── docker-compose.yml
```

## 🚀 Quick Start (Docker)

```bash
git clone https://github.com/brunsousaaires-rgb/photo-marketplace.git
cd photo-marketplace

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

Depois de subir os containers, rode as migrations e o seed (dados de exemplo) dentro do container do backend:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

## 🧑‍💻 Quick Start (local, sem Docker)

Pré-requisitos: Node.js 18+, PostgreSQL 14+.

```bash
# Backend
cd backend
npm install
cp .env.example .env          # ajuste DATABASE_URL se necessário
npx prisma migrate dev
npm run seed                  # cria contas, eventos e fotos de exemplo
npm run dev                   # http://localhost:5000

# Frontend (em outro terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3000
```

### Contas de demonstração (criadas pelo seed)

| Papel      | E-mail                    | Senha          |
|------------|----------------------------|----------------|
| Fotógrafo  | fotografo@exemplo.com      | fotografo123   |
| Comprador  | comprador@exemplo.com      | comprador123   |

## ☁️ Deploy em produção

Sugestão de stack gratuita para colocar no ar rapidamente: **Vercel** para o frontend + **Render** para a API e o banco Postgres.

### 1. Backend + banco de dados (Render)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/brunsousaaires-rgb/photo-marketplace)

O `render.yaml` na raiz já descreve o serviço da API e o banco Postgres (Render Blueprint). Ao clicar no botão acima:

1. O Render cria o banco Postgres e a API automaticamente, já conectando o `DATABASE_URL`.
2. As migrations (`prisma migrate deploy`) rodam sozinhas antes de cada start.
3. Anote a URL pública gerada para a API (ex: `https://photo-marketplace-api.onrender.com`) — você vai usá-la no passo 2.

### 2. Frontend (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brunsousaaires-rgb/photo-marketplace&root-directory=frontend&env=NEXT_PUBLIC_API_URL&envDescription=URL%20p%C3%BAblica%20da%20API%20no%20Render%2C%20com%20%2Fapi%20no%20final)

Ao importar o repositório na Vercel:

1. Defina **Root Directory** como `frontend` (a Vercel pede isso na tela de importação).
2. Configure a variável de ambiente `NEXT_PUBLIC_API_URL` com a URL da API do passo 1 + `/api` (ex: `https://photo-marketplace-api.onrender.com/api`).
3. Deploy. Anote a URL gerada pela Vercel (ex: `https://seu-app.vercel.app`).

### 3. Conectar as duas pontas

Volte ao serviço da API no Render → **Environment** → atualize `CLIENT_URL` com a URL da Vercel do passo 2 e reinicie o serviço (isso é o que libera o CORS para o frontend).

### ⚠️ Sobre armazenamento das fotos em produção

No plano gratuito do Render o disco é **efêmero** (as fotos enviadas somem a cada novo deploy). Para um marketplace de verdade, troque para S3 antes de divulgar o site:

```
STORAGE_DRIVER=s3
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

O código já tem suporte completo a S3 (`backend/src/utils/storage.ts`) — só falta preencher essas variáveis no Render. Se preferir manter armazenamento local, é necessário um plano pago do Render com **disco persistente** (veja o bloco comentado em `render.yaml`).

### 4. Pagamentos em produção

Configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` (chaves **live**, não `sk_test_...`) nas variáveis de ambiente da API no Render, e cadastre o endpoint de webhook no painel do Stripe apontando para `https://sua-api.onrender.com/api/payments/webhook`.

## 💳 Pagamentos (desenvolvimento)

Configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` em `backend/.env` para usar o Stripe Checkout real. **Sem essas chaves**, o checkout roda em **modo demo**: o pedido é confirmado automaticamente para permitir testar o fluxo completo (carrinho → pagamento → download HD) localmente.

Para receber o webhook do Stripe em desenvolvimento:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

## 🔒 Como funciona a proteção das fotos

1. No upload, o backend gera três versões da imagem com `sharp`: **thumbnail** e **preview** (ambas com marca d'água diagonal repetida, servidas publicamente) e o **arquivo original** (guardado sem marca d'água).
2. O arquivo original nunca é exposto por URL pública — só é servido pela rota `GET /api/photos/:id/download`, protegida por autenticação, que verifica se o usuário tem um pedido **pago** contendo aquela foto (ou é o próprio fotógrafo).
3. Após a confirmação do pagamento, o botão de download em HD é liberado imediatamente na página da foto, no checkout e no histórico de compras.

## 📝 Roadmap

- [x] Autenticação com e-mail/senha
- [x] Eventos esportivos com upload em lote
- [x] Marca d'água automática
- [x] Carrinho de compras
- [x] Integração Stripe (com modo demo)
- [x] Download HD protegido
- [x] Painel do fotógrafo com analytics
- [x] Busca e filtros por esporte/evento
- [x] Mobile-first (navegação inferior, botões fixos)
- [ ] Busca por número do peito/nome do atleta
- [ ] Autenticação social (Google, GitHub)
- [ ] Sistema de avaliações

## 📄 Licença

MIT License — veja [LICENSE](LICENSE)

## 👥 Autores

- [@brunsousaaires-rgb](https://github.com/brunsousaaires-rgb)
