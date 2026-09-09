export type VehicleCategory =
  | 'SUV'
  | 'Sedã'
  | 'Hatch'
  | 'Picape'
  | 'Esportivo'
  | 'Outros';

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  modelYear?: number;
  /** Alguns anúncios reais da 2L não informam km — nesse caso fica undefined. */
  mileage?: number;
  /** Texto livre como cadastrado pela 2L (ex.: "Automático", "Manual"). Pode vir vazio. */
  transmission?: string;
  /** Texto livre como cadastrado pela 2L (ex.: "Flex", "Diesel"). Pode vir vazio. */
  fuel?: string;
  color?: string;
  price: number;
  category: VehicleCategory;
  images: string[];
  description: string;
  features: string[];
  sellerId?: string;
  featured: boolean;
  /**
   * true = veículo de exemplo/placeholder, ainda não é estoque real da 2L.
   * Troque por `false` (ou remova o item) assim que substituir pelos dados reais.
   */
  isPlaceholder?: boolean;
}
