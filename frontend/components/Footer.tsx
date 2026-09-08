import { site } from "@/lib/site.config";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-white/40 sm:flex-row">
        <span>
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </span>
        <div className="flex gap-5">
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="hover:text-white/70">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
