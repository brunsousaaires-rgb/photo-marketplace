export type Transmission = 'Automático' | 'Manual' | 'CVT' | 'Automatizado';

export type FuelType = 'Flex' | 'Gasolina' | 'Diesel' | 'Híbrido' | 'Elétrico';

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
  mileage: number;
  transmission: Transmission;
  fuel: FuelType;
  color: string;
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
