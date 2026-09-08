# Landing Page de Portfólio

Landing page para divulgar um portfólio de criação de sites e soluções com IA. Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion, com formulário de contato conectado ao Supabase.

## Como rodar localmente

```bash
cd frontend
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Acesse `http://localhost:3000`.

## Personalizar conteúdo

Todo o texto, links de contato e projetos do portfólio ficam em [`lib/site.config.ts`](./lib/site.config.ts) — edite esse arquivo para colocar seus dados reais (nome, e-mail, WhatsApp, redes sociais e os projetos que você quer mostrar).

## Formulário de contato + Supabase

O formulário em "Contato" salva as mensagens numa tabela `leads` no Supabase (via `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`). Se essas variáveis não estiverem configuradas, o formulário cai automaticamente para um `mailto:` usando o e-mail definido em `site.config.ts`.

A tabela `leads` tem RLS habilitado: qualquer pessoa pode inserir (enviar o formulário), mas somente você, autenticado no painel do Supabase, pode ler as mensagens.

## Deploy

O projeto está pronto para deploy na Vercel (framework Next.js detectado automaticamente). Configure as mesmas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) no painel do projeto na Vercel.
