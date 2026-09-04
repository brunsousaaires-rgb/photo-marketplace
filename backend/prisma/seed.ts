import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { createThumbnail, createWatermarkedPreview, readOriginalMeta } from '../src/utils/watermark';
import { saveObject } from '../src/utils/storage';

const prisma = new PrismaClient();

const EVENTS = [
  {
    title: 'Circuito Praia Vôlei — Etapa Santos',
    sport: 'volei-de-praia',
    location: 'Praia do Gonzaga, Santos - SP',
    eventDate: '2026-08-15',
    colors: ['#0a0a0a', '#101c14', '#c8ff00'],
    photos: [
      { title: 'Ataque na rede', price: 24.9 },
      { title: 'Defesa impossível', price: 24.9 },
      { title: 'Comemoração do ponto', price: 29.9 },
      { title: 'Saque decisivo', price: 19.9 },
    ],
  },
  {
    title: '2º Open Cristal de Futevôlei',
    sport: 'futevolei',
    location: 'Arena Cristal, Cristalina - GO',
    eventDate: '2026-08-22',
    colors: ['#0a0a0a', '#04262b', '#00e5c7'],
    photos: [
      { title: 'Bicicleta na área', price: 27.9 },
      { title: 'Dupla campeã', price: 34.9 },
      { title: 'Cabeceio na trave', price: 22.9 },
    ],
  },
  {
    title: 'Torneio Beach Tennis Barra',
    sport: 'beach-tennis',
    location: 'Barra da Tijuca, Rio de Janeiro - RJ',
    eventDate: '2026-09-01',
    colors: ['#0a0a0a', '#101014', '#a3ff12'],
    photos: [
      { title: 'Smash vencedor', price: 24.9 },
      { title: 'Dupla em ação', price: 24.9 },
      { title: 'Match point', price: 29.9 },
    ],
  },
  {
    title: 'Superliga Vôlei de Quadra — Semifinal',
    sport: 'volei-de-quadra',
    location: 'Ginásio Municipal, São Paulo - SP',
    eventDate: '2026-07-28',
    colors: ['#0a0a0a', '#0c1a2b', '#00e5ff'],
    photos: [
      { title: 'Cortada de ponta', price: 34.9 },
      { title: 'Bloqueio triplo', price: 34.9 },
      { title: 'Levantamento perfeito', price: 24.9 },
      { title: 'Vibração da vitória', price: 39.9 },
    ],
  },
  {
    title: 'Copa Amadores de Futebol — Final',
    sport: 'futebol',
    location: 'Campo do Bairro, Belo Horizonte - MG',
    eventDate: '2026-08-09',
    colors: ['#0a0a0a', '#1a2b0c', '#c8ff00'],
    photos: [
      { title: 'Gol de bicicleta', price: 29.9 },
      { title: 'Disputa de bola', price: 19.9 },
      { title: 'Comemoração do título', price: 39.9 },
    ],
  },
  {
    title: 'Corrida de Rua 10K Litoral',
    sport: 'corrida',
    location: 'Orla de Guarujá - SP',
    eventDate: '2026-09-05',
    colors: ['#0a0a0a', '#101014', '#00e5ff'],
    photos: [
      { title: 'Largada 10K', price: 17.9 },
      { title: 'Chegada emocionante', price: 22.9 },
      { title: 'Ritmo forte no percurso', price: 17.9 },
    ],
  },
  {
    title: 'Desafio Ciclismo Serra Acima',
    sport: 'ciclismo',
    location: 'Campos do Jordão - SP',
    eventDate: '2026-06-20',
    colors: ['#0a0a0a', '#0c1a2b', '#a3ff12'],
    photos: [
      { title: 'Subida da serra', price: 24.9 },
      { title: 'Pelotão em curva', price: 24.9 },
    ],
  },
];

async function generateGradientImage(colors: string[], seedIndex: number): Promise<Buffer> {
  const width = 1800;
  const height = 1200;
  const [c1, c2, c3] = colors;
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="55%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
    <circle cx="${(seedIndex * 233) % width}" cy="${(seedIndex * 157) % height}" r="260" fill="rgba(255,255,255,0.06)" />
    <circle cx="${width - ((seedIndex * 97) % width)}" cy="${height - ((seedIndex * 61) % height)}" r="180" fill="rgba(0,0,0,0.15)" />
    <polygon points="0,${height} ${width * 0.35},${height} ${width * 0.1},${height * 0.55}" fill="rgba(255,255,255,0.05)" />
  </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

async function main() {
  console.log('Semeando banco de dados...');

  const photographerPassword = await bcrypt.hash('fotografo123', 10);
  const buyerPassword = await bcrypt.hash('comprador123', 10);

  const photographer = await prisma.user.upsert({
    where: { email: 'fotografo@exemplo.com' },
    update: {},
    create: {
      name: 'Ana Fotógrafa',
      email: 'fotografo@exemplo.com',
      passwordHash: photographerPassword,
      role: 'PHOTOGRAPHER',
      bio: 'Cobertura fotográfica de eventos esportivos: vôlei, futevôlei, beach tennis e muito mais.',
    },
  });

  await prisma.user.upsert({
    where: { email: 'comprador@exemplo.com' },
    update: {},
    create: {
      name: 'Carlos Comprador',
      email: 'comprador@exemplo.com',
      passwordHash: buyerPassword,
      role: 'BUYER',
    },
  });

  const existingEvents = await prisma.event.count({ where: { photographerId: photographer.id } });
  if (existingEvents > 0) {
    console.log('Eventos de exemplo já existem, pulando geração de imagens.');
    return;
  }

  let seedIndex = 0;
  for (const eventData of EVENTS) {
    const event = await prisma.event.create({
      data: {
        photographerId: photographer.id,
        title: eventData.title,
        sport: eventData.sport,
        location: eventData.location,
        eventDate: new Date(eventData.eventDate),
      },
    });

    for (const photoData of eventData.photos) {
      seedIndex += 1;
      const original = await generateGradientImage(eventData.colors, seedIndex);
      const id = uuid();

      const meta = await readOriginalMeta(original);
      const preview = await createWatermarkedPreview(original);
      const thumb = await createThumbnail(original);

      const originalKey = `originals/${id}.jpg`;
      const previewKey = `previews/${id}.jpg`;
      const thumbKey = `thumbs/${id}.jpg`;

      await Promise.all([
        saveObject(originalKey, original, 'image/jpeg'),
        saveObject(previewKey, preview.buffer, 'image/jpeg'),
        saveObject(thumbKey, thumb.buffer, 'image/jpeg'),
      ]);

      await prisma.photo.create({
        data: {
          id,
          photographerId: photographer.id,
          eventId: event.id,
          title: photoData.title,
          description: `${photoData.title} — ${eventData.title}. Imagem em alta resolução, pronta para uso profissional.`,
          price: photoData.price,
          originalKey,
          previewKey,
          thumbKey,
          width: meta.width,
          height: meta.height,
        },
      });
    }

    console.log(`  + ${eventData.title} (${eventData.photos.length} fotos)`);
  }

  console.log('Seed concluído. Login fotógrafo: fotografo@exemplo.com / fotografo123');
  console.log('Login comprador: comprador@exemplo.com / comprador123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
