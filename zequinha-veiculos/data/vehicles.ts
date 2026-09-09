/**
 * Estoque da Zequinha Veículos.
 *
 * IMPORTANTE — DADOS REAIS:
 * Este arquivo NÃO deve conter carros, preços, quilometragem ou anos
 * inventados. Cada veículo abaixo deve ser preenchido pela loja com
 * informações reais.
 *
 * Enquanto a loja não envia fotos profissionais de um veículo, marque
 * `hasRealPhotos: false` — os componentes usam, nesse caso, a ilustração
 * vetorial da marca (ToroSilhouette) em vez de fingir uma foto real.
 * Assim que houver fotos reais, adicione os caminhos em `images` (ex.:
 * "/vehicles/toro/01.jpg") e mude `hasRealPhotos` para `true`.
 *
 * Para adicionar um novo veículo, copie o objeto de exemplo abaixo e
 * preencha com os dados reais informados pela loja.
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
  /** true somente quando existirem fotos reais em `images` */
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
    fullName: "Fiat Toro",
    // Ano, km, câmbio, combustível e preço reais ainda não informados pela loja.
    year: null,
    mileageKm: null,
    transmission: null,
    fuel: null,
    price: null,
    category: "picape",
    status: "disponivel",
    featured: true,
    hasRealPhotos: false,
    images: [],
    description:
      "A Fiat Toro é a protagonista visual da Zequinha Veículos — assim que a loja enviar as fotos reais e a ficha completa deste veículo, esta página será atualizada automaticamente.",
  },
];

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

export function getFeaturedVehicles(): Vehicle[] {
  return vehicles.filter((v) => v.featured);
}
