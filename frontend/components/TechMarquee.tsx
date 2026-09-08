const items = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "OpenAI / IA Generativa",
  "Supabase",
  "Vercel",
  "Automação de Fluxos",
  "APIs & Integrações",
  "React",
  "Node.js",
];

export default function TechMarquee() {
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-surface/60 py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
      <div className="flex w-max animate-marquee gap-12">
        {loop.map((item, i) => (
          <span
            key={i}
            className="whitespace-nowrap font-display text-lg font-medium text-white/25 transition-colors hover:text-white/60"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
