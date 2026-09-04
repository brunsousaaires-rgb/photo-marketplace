# 📸 Photo Marketplace

Uma plataforma web moderna e profissional para venda de fotos em alta resolução, com marca d'água automática nas pré-visualizações, autenticação segura, pagamento com Stripe e download em HD liberado imediatamente após a compra.

## ✨ Features

- 🔐 **Autenticação** — registro/login com JWT, contas de comprador e fotógrafo
- 📷 **Upload de fotos** — interface com arrastar/soltar, validação de tipo e tamanho
- 💧 **Marca d'água automática** — aplicada em tempo real com `sharp` em toda pré-visualização pública
- 🖼️ **Galeria responsiva** — busca, filtro por categoria e ordenação por preço/recência
- 🛒 **Carrinho de compras** — persistente no navegador
- 💳 **Pagamentos com Stripe Checkout** — ou modo demo automático caso as chaves não estejam configuradas
- 📥 **Download HD** — liberado apenas após confirmação do pagamento, servido por rota autenticada (nunca por URL pública)
- 📊 **Painel do fotógrafo** — portfólio, receita, vendas e downloads
- 🗂️ **Minhas compras** — histórico com download a qualquer momento

## 🛠️ Stack

**Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand
**Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL · Sharp · Stripe
**Infra:** Docker Compose · armazenamento local em disco (padrão) ou AWS S3 (opcional)

## 📋 Estrutura

```
photo-marketplace/
├── frontend/            # Next.js (App Router)
│   ├── app/              # Páginas e rotas
│   ├── components/       # Componentes React (UI, galeria, upload...)
│   └── lib/               # API client, auth, carrinho, tipos
├── backend/              # API Express
│   ├── src/
│   │   ├── routes/        # Endpoints
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── middleware/     # Autenticação, upload, erros
│   │   └── utils/          # JWT, storage, marca d'água (sharp)
│   ├── prisma/            # Schema, migrations e seed
│   └── uploads/            # Armazenamento local (originais, previews, thumbs)
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
npm run seed                  # cria contas e fotos de exemplo
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

## 💳 Pagamentos

Configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` em `backend/.env` para usar o Stripe Checkout real. **Sem essas chaves**, o checkout roda em **modo demo**: o pedido é confirmado automaticamente para permitir testar o fluxo completo (carrinho → pagamento → download HD) localmente.

Para receber o webhook do Stripe em desenvolvimento:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

## 🔒 Como funciona a proteção das fotos

1. No upload, o backend gera três versões da imagem com `sharp`: **thumbnail** e **preview** (ambas com marca d'água diagonal repetida, servidas publicamente) e o **arquivo original** (guardado sem marca d'água).
2. O arquivo original nunca é exposto por URL pública — só é servido pela rota `GET /api/photos/:id/download`, protegida por autenticação, que verifica se o usuário tem um pedido **pago** contendo aquela foto (ou é o próprio fotógrafo).
3. Após a confirmação do pagamento, o botão de download em HD é liberado imediatamente na página da foto, no checkout e no histórico de compras.

## ☁️ Armazenamento

Por padrão as imagens são salvas em disco (`backend/uploads`). Para usar S3 em produção, defina no `.env` do backend:

```
STORAGE_DRIVER=s3
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

## 📝 Roadmap

- [x] Autenticação com e-mail/senha
- [x] Upload e validação de fotos
- [x] Marca d'água automática
- [x] Carrinho de compras
- [x] Integração Stripe (com modo demo)
- [x] Download HD protegido
- [x] Painel do fotógrafo com analytics
- [x] Busca e filtros por categoria/preço
- [ ] Autenticação social (Google, GitHub)
- [ ] Sistema de avaliações
- [ ] Coleções/álbuns

## 📄 Licença

MIT License — veja [LICENSE](LICENSE)

## 👥 Autores

- [@brunsousaaires-rgb](https://github.com/brunsousaaires-rgb)
