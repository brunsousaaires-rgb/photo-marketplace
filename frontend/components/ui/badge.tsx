import { cn } from '@/lib/utils';

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-ink-950/5 px-2.5 py-1 text-xs font-medium text-ink-900',
        className
      )}
    >
      {children}
    </span>
  );
}
