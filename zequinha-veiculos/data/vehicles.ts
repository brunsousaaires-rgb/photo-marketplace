/**
 * Estoque da Zequinha Veículos.
 *
 * Listagens de demonstração com fotos reais dos modelos (fonte: Wikimedia
 * Commons, licença livre) — os veículos específicos (ano, km, preço) são
 * fictícios, para ilustrar como o site fica com o estoque completo.
 * Assim que a loja enviar o estoque real (com fotos próprias tiradas do
 * veículo específico à venda), basta substituir os campos abaixo.
 *
 * Para adicionar/editar um veículo, edite o array `vehicles`. Para trocar
 * uma foto de exemplo por uma foto real da loja, salve o arquivo em
 * `public/vehicles/<slug>/01.jpg` e atualize `images`.
 */

export type VehicleCategory =
  | "suv"
  | "sedan"
  | "hatch"
  | "picape"
  | "utilitario";

export type VehicleStatus = "disponivel" | "reservado" | "vendido";

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  /** Nome completo de exibição, ex: "Fiat Toro Freedom" */
  fullName: string;
  /** Ano modelo/fabricação como texto (ex: "2022/2023"). null = a definir */
  year: string | null;
  mileageKm: number | null;
  transmission: "Manual" | "Automático" | null;
  fuel: string | null;
  /** Preço em reais. null = "Consulte" */
  price: number | null;
  category: VehicleCategory;
  status: VehicleStatus;
  featured: boolean;
  /** true quando `images` aponta para fotos reais do modelo. */
  hasRealPhotos: boolean;
  images: string[];
  description?: string;
}

export const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  suv: "SUVs",
  sedan: "Sedans",
  hatch: "Hatch",
  picape: "Picapes",
  utilitario: "Utilitários",
};

export const vehicles: Vehicle[] = [
  {
    id: "fiat-toro",
    slug: "fiat-toro",
    brand: "Fiat",
    model: "Toro",
    fullName: "Fiat Toro Freedom 1.8 AT6",
    year: "2022/2023",
    mileageKm: 38500,
    transmission: "Automático",
    fuel: "Flex",
    price: 129900,
    category: "picape",
    status: "disponivel",
    featured: true,
    hasRealPhotos: true,
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/6/60/Fiat_Toro_%28r%29.png",
      "https://upload.wikimedia.org/wikipedia/commons/1/1c/2020_Fiat_Toro_Ultra.jpg",
    ],
    description:
      "A Fiat Toro é a protagonista da Zequinha Veículos: motorização 1.8 flex, câmbio automático AT6 e revisões em dia. Excelente estado de conservação, pronta para negócio.",
  },
  {
    id: "ram-rampage",
    slug: "ram-rampage",
    brand: "RAM",
    model: "Rampage",
    fullName: "RAM Rampage Rebel 2.0 Turbo Diesel 4x4",
    year: "2023/2024",
    mileageKm: 15800,
    transmission: "Automático",
    fuel: "Diesel",
    price: 219900,
    category: "picape",
    status: "disponivel",
    featured: true,
    hasRealPhotos: true,
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/5/57/2024_Ram_Rampage_Rebel_%28Brazil%29_front_view.png",
    ],
    description:
      "Picape média com tração 4x4, motor turbodiesel e pacote Rebel completo. Poucos donos, km baixa e todas as revisões feitas na concessionária.",
  },
  {
    id: "hyundai-hb20",
    slug: "hyundai-hb20",
    brand: "Hyundai",
    model: "HB20",
    fullName: "Hyundai HB20 Comfort 1.0",
    year: "2021/2022",
    mileageKm: 42000,
    transmission: "Manual",
    fuel: "Flex",
    price: 74900,
    category: "hatch",
    status: "disponivel",
    featured: false,
    hasRealPhotos: true,
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/9/99/2023_Hyundai_HB20_1.0_T-GDi_Platinum_Plus_%28Brazil%29_front_view_02.png",
    ],
    description:
      "Hatch econômico, ideal para o dia a dia na cidade. Único dono, documentação em dia e pneus novos.",
  },
  {
    id: "honda-civic",
    slug: "honda-civic",
    brand: "Honda",
    model: "Civic",
    fullName: "Honda Civic EXL 2.0",
    year: "2018/2019",
    mileageKm: 61200,
    transmission: "Automático",
    fuel: "Flex",
    price: 108500,
    category: "sedan",
    status: "disponivel",
    featured: false,
    hasRealPhotos: true,
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/6/6f/Honda_Civic_2016.jpg",
    ],
    description:
      "Sedan completo, motor 2.0 automático, interior em couro e multimídia original. Carro de garagem, sem uso de aplicativo.",
  },
  {
    id: "jeep-renegade",
    slug: "jeep-renegade",
    brand: "Jeep",
    model: "Renegade",
    fullName: "Jeep Renegade Sport 1.3 Turbo",
    year: "2020/2021",
    mileageKm: 55000,
    transmission: "Automático",
    fuel: "Flex",
    price: 89900,
    category: "suv",
    status: "disponivel",
    featured: false,
    hasRealPhotos: true,
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Brazilian_Jeep_Renegade.jpg",
    ],
    description:
      "SUV compacto, motor 1.3 turbo flex e câmbio automático. Ótimo custo-benefício para quem busca robustez com economia.",
  },
  {
    id: "fiat-strada",
    slug: "fiat-strada",
    brand: "Fiat",
    model: "Strada",
    fullName: "Fiat Strada Endurance 1.4",
    year: "2021/2022",
    mileageKm: 48300,
    transmission: "Manual",
    fuel: "Flex",
    price: 84900,
    category: "utilitario",
    status: "disponivel",
    featured: false,
    hasRealPhotos: true,
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/1/1b/Fiat_Strada_III_front_20100515.jpg",
    ],
    description:
      "Picape compacta, robusta e econômica. Ideal para trabalho e uso pessoal, com caçamba ampla e baixo consumo.",
  },
  {
    id: "chevrolet-onix",
    slug: "chevrolet-onix",
    brand: "Chevrolet",
    model: "Onix",
    fullName: "Chevrolet Onix LT 1.0",
    year: "2022/2023",
    mileageKm: 29500,
    transmission: "Manual",
    fuel: "Flex",
    price: 72900,
    category: "hatch",
    status: "disponivel",
    featured: false,
    hasRealPhotos: true,
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c9/Chevrolet_Onix_%28second_generation%2C_front_view%29.jpg",
    ],
    description:
      "Um dos hatches mais vendidos do Brasil. Baixa quilometragem, revisado e pronto para rodar.",
  },
];

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

export function getFeaturedVehicles(): Vehicle[] {
  return vehicles.filter((v) => v.featured);
}
