FROM node:20-slim AS base
WORKDIR /app

# libvips é necessário para o sharp (processamento de imagens/marca d'água)
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]
