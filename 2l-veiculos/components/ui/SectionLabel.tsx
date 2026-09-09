export default function SectionLabel({ children, index }: { children: React.ReactNode; index?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest2 text-gold">
      {index && <span className="text-ink-muted">{index}</span>}
      <span className="h-px w-8 bg-gold/60" />
      {children}
    </div>
  );
}
