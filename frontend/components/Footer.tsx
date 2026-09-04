import Link from 'next/link';
import { Camera } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-950 pb-16 text-white md:pb-0">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500 text-ink-950">
            <Camera className="h-4 w-4" />
          </span>
          <span className="font-display text-base uppercase tracking-wide">Photo Marketplace</span>
        </div>
        <p className="text-center text-sm text-white/40">
          © {new Date().getFullYear()} Photo Marketplace. Fotos com marca d’água até a confirmação da compra.
        </p>
        <div className="flex gap-5 text-sm text-white/60">
          <Link href="/" className="hover:text-accent-500">Buscar eventos</Link>
          <Link href="/register" className="hover:text-accent-500">Sou fotógrafo</Link>
        </div>
      </div>
    </footer>
  );
}
