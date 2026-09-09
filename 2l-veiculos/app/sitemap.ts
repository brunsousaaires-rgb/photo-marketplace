import type { MetadataRoute } from 'next';
import { vehicles } from '@/data/vehicles';

const baseUrl = 'https://2lveiculos.com.br';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/veiculos', '/vendedores', '/sobre', '/contato'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  const vehicleRoutes = vehicles.map((vehicle) => ({
    url: `${baseUrl}/veiculos/${vehicle.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
