'use client';

import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/lib/toast-store';
import { cn } from '@/lib/utils';

const icons = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant ?? 'default'];
        return (
          <div
            key={t.id}
            className="animate-fade-up pointer-events-auto flex items-start gap-3 rounded-xl border border-black/5 bg-white p-3.5 shadow-card-hover"
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                t.variant === 'success' && 'text-emerald-600',
                t.variant === 'error' && 'text-red-600',
                (!t.variant || t.variant === 'default') && 'text-ink-900'
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-950">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-900/70">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-ink-900/40 hover:text-ink-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
