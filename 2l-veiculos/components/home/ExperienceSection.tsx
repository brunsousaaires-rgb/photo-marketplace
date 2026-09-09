import Image from 'next/image';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

/**
 * PENDENTE: substituir estas imagens de banco por fotos/vídeos reais dos
 * bastidores da 2L (entrega de chaves, equipe, clientes, loja) assim que
 * estiverem disponíveis em alta resolução.
 */
const gallery = [
  {
    src: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
    span: 'lg:col-span-2 lg:row-span-2',
    aspect: 'aspect-square lg:aspect-auto',
  },
  {
    src: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    span: '',
    aspect: 'aspect-[4/3]',
  },
  {
    src: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80',
    span: '',
    aspect: 'aspect-[4/3]',
  },
];

export default function ExperienceSection() {
  return (
    <section className="relative bg-bg-elevated px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel>Experiência 2L</SectionLabel>
          <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
            Não é só sobre
            <br />
            <span className="text-gradient-gold">comprar um carro.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {gallery.map((item, i) => (
            <Reveal key={i} delay={i * 0.08} className={`relative overflow-hidden rounded-2xl ${item.aspect} ${item.span}`}>
              <Image
                src={item.src}
                alt="Momento da experiência 2L Veículos"
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
