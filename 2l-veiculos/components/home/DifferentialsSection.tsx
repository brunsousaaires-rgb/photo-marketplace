import { site } from '@/data/site';
import Reveal from '@/components/ui/Reveal';

export default function DifferentialsSection() {
  return (
    <section className="relative border-y border-white/5 bg-bg px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 divide-y divide-white/5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {site.differentials.map((item, i) => (
            <Reveal key={item.index} delay={i * 0.08} className="px-0 py-8 sm:px-8 sm:py-0">
              <span className="font-display text-2xl text-gold">{item.index}</span>
              <h3 className="mt-3 font-display text-xl uppercase leading-tight text-ink sm:text-2xl">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
