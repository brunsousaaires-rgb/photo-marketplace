import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-ink-900/15 bg-white px-3.5 text-sm text-ink-950 placeholder:text-ink-900/40',
        'outline-none transition focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-900/40',
        'outline-none transition focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-ink-900/80', className)} {...props} />;
}
