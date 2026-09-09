import { Suspense } from 'react';
import type { Metadata } from 'next';
import { vehicles } from '@/data/vehicles';
import VehicleExplorer from '@/components/vehicles/VehicleExplorer';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

export const metadata: Metadata = {
  title: 'Estoque de Veículos',
  description:
    'Confira o estoque completo de veículos da 2L Veículos em Trindade-GO. Filtre por marca, categoria, câmbio e combustível.',
};

export default function VeiculosPage() {
  return (
    <div className="bg-bg px-6 pb-24 pt-36 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel>Estoque</SectionLabel>
          <h1 className="mt-4 max-w-2xl font-display text-5xl uppercase leading-[0.95] text-ink sm:text-6xl">
            Encontre o seu <span className="text-gradient-gold">próximo carro.</span>
          </h1>
        </Reveal>

        <div className="mt-12">
          <Suspense fallback={null}>
            <VehicleExplorer vehicles={vehicles} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
