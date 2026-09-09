import Image from 'next/image';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import { site } from '@/data/site';

// Fotos reais de entrega de veículos da 2L Veículos (prova social do site institucional).
const gallery = [
  {
    src: 'https://2lveiculos.netlify.app/assets/provas-sociais-2l/entrega-2.jpg',
    span: 'lg:col-span-2 lg:row-span-2',
    aspect: 'aspect-square lg:aspect-auto',
  },
  {
    src: 'https://2lveiculos.netlify.app/assets/provas-sociais-2l/entrega-3.jpg',
    span: '',
    aspect: 'aspect-[4/3]',
  },
  {
    src: 'https://2lveiculos.netlify.app/assets/provas-sociais-2l/entrega-5.jpg',
    span: '',
    aspect: 'aspect-[4/3]',
  },
  {
    src: 'https://2lveiculos.netlify.app/assets/provas-sociais-2l/entrega-6.jpg',
    span: '',
    aspect: 'aspect-[4/3]',
  },
  {
    src: 'https://2lveiculos.netlify.app/assets/provas-sociais-2l/entrega-7.jpg',
    span: '',
    aspect: 'aspect-[4/3]',
  },
  {
    src: 'https://2lveiculos.netlify.app/assets/provas-sociais-2l/entrega-8.jpg',
    span: '',
    aspect: 'aspect-[4/3]',
  },
];

export default function ExperienceSection() {
  return (
    <section id="clientes" className="relative bg-bg-elevated px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel>Clientes</SectionLabel>
          <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
            Clientes satisfeitos.
            <br />
            <span className="text-gradient-gold">Negócios realizados.</span>
          </h2>
          <p className="mt-3 max-w-lg text-sm text-ink-muted">{site.proof.text}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {gallery.map((item, i) => (
            <Reveal key={i} delay={i * 0.06} className={`relative overflow-hidden rounded-2xl ${item.aspect} ${item.span}`}>
              <Image
                src={item.src}
                alt="Entrega real de veículo da 2L Veículos"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
