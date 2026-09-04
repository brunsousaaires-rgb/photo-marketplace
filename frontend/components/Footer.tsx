import Link from 'next/link';
import { Camera } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <div className="flex items-center gap-2 text-ink-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-950 text-accent-400">
            <Camera className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-semibold">Photo Marketplace</span>
        </div>
        <p className="text-center text-sm text-ink-900/50">
          © {new Date().getFullYear()} Photo Marketplace. Fotografias com marca d’água até a confirmação da compra.
        </p>
        <div className="flex gap-5 text-sm text-ink-900/60">
          <Link href="/" className="hover:text-ink-950">Explorar</Link>
          <Link href="/register" className="hover:text-ink-950">Vender fotos</Link>
        </div>
      </div>
    </footer>
  );
}
