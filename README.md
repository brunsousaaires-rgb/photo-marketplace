# 📸 Photo Marketplace

Uma plataforma web moderna e profissional para venda de fotos em alta resolução com marca d'água automática, autenticação segura, processamento de pagamentos e sistema de download HD.

## 🚀 Landing Page de Portfólio

Este repositório também inclui, em [`frontend/`](./frontend), uma landing page standalone (Next.js + Tailwind + Framer Motion) para divulgar um portfólio de criação de sites e soluções com IA. Veja [`frontend/README.md`](./frontend/README.md) para detalhes de como rodar, personalizar e configurar o Supabase do formulário de contato.

## 🚗 Zequinha Veículos

Em [`zequinha-veiculos/`](./zequinha-veiculos) está o site institucional da **Zequinha Veículos** (Trindade – GO): uma experiência automotiva cinematográfica em Next.js + TypeScript + Tailwind + GSAP + Framer Motion, com abertura animada da Fiat Toro, estoque filtrável, páginas de veículo, avaliação para venda/troca e integração com WhatsApp. Veja [`zequinha-veiculos/README.md`](./zequinha-veiculos/README.md) para rodar e adicionar dados reais da loja.

## 🧘 ARTIKO — Infoproduto de protocolos de movimento

Em [`artiko/`](./artiko) está o **ARTIKO**, um infoproduto digital feito para venda em plataformas como Cakto, Kiwify ou Shopify: um quiz-app (Vite + React + TypeScript + Tailwind + Framer Motion) que monta um protocolo de exercícios de 6 semanas para dor de ombro, coluna, joelho ou quadril, com paywall animado e uma página de vendas completa. Veja [`artiko/README.md`](./artiko/README.md) para rodar, configurar o link de checkout e publicar.

## ✨ Features Principais

- 🔐 **Autenticação**: Sistema de login/registro seguro com JWT
- 📷 **Upload de Fotos**: Interface intuitiva para upload com validação
- 💧 **Marca d'Água Automática**: Aplicação automática de marca d'água em pré-visualizações
- 🛒 **Carrinho de Compras**: Gerenciamento completo de carrinho
- 💳 **Pagamentos**: Integração com Stripe/PayPal
- 📥 **Download HD**: Sistema de download em múltiplas resoluções
- 👤 **Perfil de Fotógrafo**: Dashboard com analytics e gerenciamento de portfólio
- 🔍 **Galeria Responsiva**: Visualização profissional de fotos

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** - React framework com SSR
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização responsiva
- **Shadcn UI** - Componentes profissionais
- **React Query** - Gerenciamento de estado

### Backend
- **Node.js + Express** OU **Python FastAPI**
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **AWS S3** - Armazenamento de imagens

### Infra
- **Docker** - Containerização
- **Vercel/AWS** - Hospedagem

## 📋 Estrutura do Projeto

```
photo-marketplace/
├── frontend/                 # Aplicação Next.js
│   ├── app/                 # Rotas e layouts
│   ├── components/          # Componentes React
│   ├── lib/                 # Utilitários
│   ├── public/              # Assets estáticos
│   └── styles/              # CSS global
├── backend/                 # API Express/FastAPI
│   ├── src/
│   │   ├── models/          # Modelos de dados
│   │   ├── routes/          # Endpoints
│   │   ├── controllers/      # Lógica de negócio
│   │   ├── middleware/       # Autenticação, validação
│   │   └── utils/           # Utilitários
│   └── config/              # Configurações
├── docker-compose.yml       # Orquestração
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Python 3.9+ (se usar FastAPI)
- Docker & Docker Compose
- PostgreSQL

### Instalação

```bash
# Clone o repositório
git clone https://github.com/brunsousaaires-rgb/photo-marketplace.git
cd photo-marketplace

# Instale dependências do frontend
cd frontend
npm install

# Instale dependências do backend
cd ../backend
npm install  # ou pip install -r requirements.txt

# Configure variáveis de ambiente
cp .env.example .env

# Inicie com Docker Compose
docker-compose up
```

## 📚 Documentação

- [Frontend Setup](./frontend/README.md)
- [Backend Setup](./backend/README.md)
- [API Documentation](./backend/API.md)
- [Database Schema](./backend/SCHEMA.md)

## 📝 Features Roadmap

- [ ] Autenticação com email/senha
- [ ] Autenticação social (Google, GitHub)
- [ ] Upload e validação de fotos
- [ ] Geração automática de marca d'água
- [ ] Sistema de carrinho
- [ ] Integração Stripe
- [ ] Dashboard do fotógrafo
- [ ] Sistema de avaliações
- [ ] Busca e filtros
- [ ] Analytics
- [ ] Mobile responsivo

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 Licença

MIT License - veja [LICENSE](LICENSE)

## 👥 Autores

- [@brunsousaaires-rgb](https://github.com/brunsousaaires-rgb)

---

**Começando?** Veja nossa [documentação completa](./docs/GETTING_STARTED.md)