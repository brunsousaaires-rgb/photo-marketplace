import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { createThumbnail, createWatermarkedPreview, readOriginalMeta } from '../src/utils/watermark';
import { saveObject } from '../src/utils/storage';

const prisma = new PrismaClient();

const SAMPLE_PHOTOS = [
  { title: 'Amanhecer nas Montanhas', category: 'natureza', price: 39.9, colors: ['#ff9966', '#ff5e62', '#2c3e50'] },
  { title: 'Retrato em Luz Natural', category: 'retrato', price: 59.9, colors: ['#f7d794', '#e77f67', '#3b3b58'] },
  { title: 'Skyline ao Entardecer', category: 'urbano', price: 49.9, colors: ['#0f2027', '#203a43', '#2c5364'] },
  { title: 'Casamento ao Ar Livre', category: 'eventos', price: 69.9, colors: ['#fbc2eb', '#a6c1ee', '#ffffff'] },
  { title: 'Café Artesanal', category: 'produtos', price: 29.9, colors: ['#d1913c', '#ffd194', '#3e2723'] },
  { title: 'Trilha na Floresta', category: 'natureza', price: 34.9, colors: ['#134e5e', '#71b280', '#0b3d0b'] },
  { title: 'Retrato Urbano Noturno', category: 'retrato', price: 54.9, colors: ['#141e30', '#243b55', '#00d2ff'] },
  { title: 'Arquitetura Moderna', category: 'urbano', price: 44.9, colors: ['#8e9eab', '#eef2f3', '#485563'] },
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
    <circle cx="${(seedIndex * 233) % width}" cy="${(seedIndex * 157) % height}" r="260" fill="rgba(255,255,255,0.08)" />
    <circle cx="${width - ((seedIndex * 97) % width)}" cy="${height - ((seedIndex * 61) % height)}" r="180" fill="rgba(0,0,0,0.08)" />
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
      bio: 'Fotógrafa profissional especializada em natureza, retratos e eventos.',
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

  const existingPhotos = await prisma.photo.count({ where: { photographerId: photographer.id } });
  if (existingPhotos > 0) {
    console.log('Fotos de exemplo já existem, pulando geração de imagens.');
    return;
  }

  for (let i = 0; i < SAMPLE_PHOTOS.length; i++) {
    const sample = SAMPLE_PHOTOS[i];
    const original = await generateGradientImage(sample.colors, i + 1);
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
        title: sample.title,
        description: `${sample.title} — imagem em alta resolução, pronta para uso profissional.`,
        category: sample.category,
        price: sample.price,
        originalKey,
        previewKey,
        thumbKey,
        width: meta.width,
        height: meta.height,
      },
    });

    console.log(`  + ${sample.title}`);
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
