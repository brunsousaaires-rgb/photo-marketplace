import { Instagram, MessageCircle, MapPin } from "lucide-react";
import { navLinks, site } from "@/lib/site.config";
import { whatsappUrlGeneral } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer id="contato" className="relative border-t border-white/8 bg-black py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-turquoise-500/50 font-display text-sm font-bold text-turquoise-300">
                ZV
              </span>
              <span className="font-display text-sm font-semibold uppercase tracking-widest text-white">
                Zequinha <span className="text-turquoise-300">Veículos</span>
              </span>
            </span>
            <p className="mt-5 max-w-xs text-sm text-white/45">{site.tagline}</p>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/40">
              <MapPin size={15} className="text-turquoise-400" />
              {site.location}
            </p>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-widest text-white/40">
              Navegação
            </p>
            <ul className="flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-turquoise-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-widest text-white/40">
              Contato
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={whatsappUrlGeneral()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-turquoise-300"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-turquoise-300"
              >
                <Instagram size={15} />@{site.instagramHandle}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 text-[11px] text-white/30 sm:flex-row">
          <p>© {new Date().getFullYear()} Zequinha Veículos. Todos os direitos reservados.</p>
          <p>{site.location}</p>
        </div>
      </div>
    </footer>
  );
}
