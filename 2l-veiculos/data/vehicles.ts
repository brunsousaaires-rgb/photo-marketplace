import type { Vehicle } from '@/types/vehicle';

/**
 * PENDENTE — o estoque real da 2L Veículos (marca, modelo, ano, km, preço,
 * fotos) não pôde ser extraído do Instagram/site institucional de forma
 * confiável (as fotos do feed não trazem essas informações em texto).
 *
 * Os veículos abaixo são EXEMPLOS (isPlaceholder: true) apenas para
 * validar o layout, os filtros e a página de detalhe. As fotos são
 * imagens de banco de imagens (Unsplash), não fotos reais da 2L.
 *
 * Para publicar o estoque real:
 * 1. Substitua os itens deste array pelos veículos reais.
 * 2. Troque as imagens por fotos reais em /public/vehicles/<slug>/...
 * 3. Remova (ou marque como false) o campo `isPlaceholder`.
 *
 * Quando a 2L tiver um painel/CMS, esta função pode ser trocada por uma
 * chamada a uma API/Supabase sem alterar nenhum componente que a consome.
 */
export const vehicles: Vehicle[] = [
  {
    id: '1',
    slug: 'toyota-corolla-xei-2022',
    brand: 'Toyota',
    model: 'Corolla',
    version: 'XEi 2.0',
    year: 2022,
    modelYear: 2023,
    mileage: 38000,
    transmission: 'CVT',
    fuel: 'Flex',
    color: 'Prata',
    price: 129900,
    category: 'Sedã',
    images: [
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Sedã completo, revisado e pronto para rodar. Ótimo custo-benefício para quem busca conforto e economia no dia a dia.',
    features: ['Multimídia', 'Câmera de ré', 'Piloto automático', 'Bancos em couro', 'Ar-condicionado digital'],
    featured: true,
    isPlaceholder: true,
  },
  {
    id: '2',
    slug: 'jeep-compass-limited-2021',
    brand: 'Jeep',
    model: 'Compass',
    version: 'Limited',
    year: 2021,
    modelYear: 2021,
    mileage: 52000,
    transmission: 'Automático',
    fuel: 'Flex',
    color: 'Cinza Grafite',
    price: 139900,
    category: 'SUV',
    images: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1605559911160-a3d95d213904?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'SUV robusto, ideal para família e viagens. Interior espaçoso, tecnologia embarcada e excelente estado de conservação.',
    features: ['Teto solar', 'Central multimídia', 'Bancos elétricos', 'Sensor de estacionamento', 'Rodas de liga leve'],
    featured: true,
    isPlaceholder: true,
  },
  {
    id: '3',
    slug: 'chevrolet-onix-plus-2023',
    brand: 'Chevrolet',
    model: 'Onix Plus',
    version: 'Premier',
    year: 2023,
    modelYear: 2023,
    mileage: 18000,
    transmission: 'Automático',
    fuel: 'Flex',
    color: 'Branco',
    price: 96900,
    category: 'Sedã',
    images: [
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Seminovo com baixa quilometragem, único dono, todas as revisões em dia. Economia e tecnologia em um só carro.',
    features: ['MyLink com Android Auto/CarPlay', 'Controle de estabilidade', 'Faróis de LED', 'Ar-condicionado'],
    featured: true,
    isPlaceholder: true,
  },
  {
    id: '4',
    slug: 'volkswagen-polo-highline-2022',
    brand: 'Volkswagen',
    model: 'Polo',
    version: 'Highline TSI',
    year: 2022,
    modelYear: 2022,
    mileage: 29500,
    transmission: 'Automático',
    fuel: 'Flex',
    color: 'Vermelho',
    price: 104900,
    category: 'Hatch',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80',
    ],
    description: 'Hatch premium, motor turbo, ótima resposta e acabamento acima da média para a categoria.',
    features: ['Motor TSI turbo', 'Painel digital', 'Rodas aro 16', 'Multimídia com App-Connect'],
    featured: false,
    isPlaceholder: true,
  },
  {
    id: '5',
    slug: 'toyota-hilux-srv-2021',
    brand: 'Toyota',
    model: 'Hilux',
    version: 'SRV 4x4',
    year: 2021,
    modelYear: 2021,
    mileage: 64000,
    transmission: 'Automático',
    fuel: 'Diesel',
    color: 'Preto',
    price: 219900,
    category: 'Picape',
    images: [
      'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1605559911160-a3d95d213904?auto=format&fit=crop&w=1600&q=80',
    ],
    description: 'Picape de trabalho e lazer, tração 4x4, motor diesel potente e ótimo histórico de manutenção.',
    features: ['Tração 4x4', 'Diferencial bloqueado', 'Central multimídia', 'Bancos em couro'],
    featured: true,
    isPlaceholder: true,
  },
  {
    id: '6',
    slug: 'hyundai-hb20-comfort-2023',
    brand: 'Hyundai',
    model: 'HB20',
    version: 'Comfort Plus',
    year: 2023,
    modelYear: 2023,
    mileage: 12000,
    transmission: 'Manual',
    fuel: 'Flex',
    color: 'Prata',
    price: 78900,
    category: 'Hatch',
    images: [
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    ],
    description: 'Baixíssima quilometragem, praticamente zero. Ideal para o primeiro carro ou uso urbano.',
    features: ['Central multimídia', 'Vidros elétricos', 'Travas elétricas', 'Ar-condicionado'],
    featured: false,
    isPlaceholder: true,
  },
];

export function getFeaturedVehicles() {
  return vehicles.filter((vehicle) => vehicle.featured);
}

export function getVehicleBySlug(slug: string) {
  return vehicles.find((vehicle) => vehicle.slug === slug);
}

export function getRelatedVehicles(vehicle: Vehicle, limit = 3) {
  return vehicles
    .filter((item) => item.id !== vehicle.id && item.category === vehicle.category)
    .slice(0, limit)
    .concat(
      vehicles.filter((item) => item.id !== vehicle.id && item.category !== vehicle.category).slice(0, limit)
    )
    .slice(0, limit);
}

export const categories: { key: Vehicle['category']; label: string; image: string }[] = [
  {
    key: 'SUV',
    label: 'SUV',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'Sedã',
    label: 'Sedã',
    image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'Hatch',
    label: 'Hatch',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'Picape',
    label: 'Picape',
    image: 'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'Esportivo',
    label: 'Esportivo',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1400&q=80',
  },
];
