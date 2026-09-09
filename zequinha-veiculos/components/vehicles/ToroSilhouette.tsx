/**
 * Ilustração vetorial estilizada da Fiat Toro, usada como protagonista da
 * abertura cinematográfica e como espaço reservado nos cards/páginas de
 * veículo enquanto não há fotos profissionais reais.
 *
 * Não é uma foto — é um silhouette de marca desenhado em camadas (body,
 * cabine, rodas, faróis, lanternas, friso) para permitir animação
 * independente de cada parte via GSAP (usando os atributos data-part).
 *
 * Assim que a loja enviar fotos reais da Toro, substitua o uso deste
 * componente por <img> apontando para as fotos em `data/vehicles.ts`.
 */
export function ToroSilhouette({
  className,
  reflection = false,
}: {
  className?: string;
  reflection?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 900 400"
      className={className}
      style={reflection ? { transform: "scaleY(-1)" } : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="toroBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#20232b" />
          <stop offset="55%" stopColor="#101218" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        <linearGradient id="toroGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4dd8c9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="headlightGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eafffb" stopOpacity="1" />
          <stop offset="45%" stopColor="#7ee8dc" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22c7b5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wheelGrad" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#2a2d36" />
          <stop offset="70%" stopColor="#0d0e11" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>

      {/* sombra de contato */}
      <ellipse
        data-part="shadow"
        cx="450"
        cy="308"
        rx="410"
        ry="22"
        fill="#000000"
        opacity="0.55"
      />

      {/* corpo principal (capô, teto, caçamba) */}
      <path
        data-part="body"
        d="M55,300 L55,268 C55,255 65,244 82,236 C110,223 140,214 168,206 C190,200 208,195 228,186 C238,172 244,158 252,146 C266,128 284,117 308,110 C348,99 402,98 444,107 C462,111 470,121 470,138 L470,238 L795,238 C812,238 824,244 833,255 C840,264 843,272 843,282 L843,300 Z"
        fill="url(#toroBody)"
        stroke="#2a2d36"
        strokeWidth="1.5"
      />

      {/* friso / beltline turquesa */}
      <path
        data-part="beltline"
        d="M82,236 C110,223 140,214 168,206 C190,200 208,195 228,186 C238,172 244,158 252,146 C266,128 284,117 308,110 C348,99 402,98 444,107"
        fill="none"
        stroke="#22c7b5"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* vidro */}
      <path
        data-part="glass"
        d="M252,146 C266,128 284,117 308,110 C332,104 358,102 382,103 L382,150 L246,150 Z"
        fill="url(#toroGlass)"
        opacity="0.9"
      />

      {/* caçamba - linha divisória */}
      <line x1="470" y1="140" x2="470" y2="238" stroke="#2a2d36" strokeWidth="1.5" />
      <line x1="470" y1="180" x2="795" y2="180" stroke="#1e2027" strokeWidth="1" opacity="0.6" />

      {/* roda traseira */}
      <g data-part="wheel-rear">
        <circle cx="705" cy="300" r="64" fill="url(#wheelGrad)" stroke="#3a3e4a" strokeWidth="2" />
        <circle cx="705" cy="300" r="27" fill="none" stroke="#4dd8c9" strokeWidth="1.5" opacity="0.7" />
        <circle cx="705" cy="300" r="6" fill="#7ee8dc" />
      </g>

      {/* roda dianteira */}
      <g data-part="wheel-front">
        <circle cx="185" cy="300" r="64" fill="url(#wheelGrad)" stroke="#3a3e4a" strokeWidth="2" />
        <circle cx="185" cy="300" r="27" fill="none" stroke="#4dd8c9" strokeWidth="1.5" opacity="0.7" />
        <circle cx="185" cy="300" r="6" fill="#7ee8dc" />
      </g>

      {/* farol */}
      <g data-part="headlight">
        <circle cx="80" cy="233" r="20" fill="url(#headlightGlow)" />
        <ellipse cx="78" cy="232" rx="10" ry="7" fill="#eafffb" />
      </g>

      {/* lanterna traseira */}
      <g data-part="taillight">
        <rect x="828" y="248" width="8" height="26" rx="3" fill="#4dd8c9" opacity="0.9" />
      </g>

      {/* maçaneta / detalhe */}
      <rect data-part="handle" x="330" y="175" width="26" height="4" rx="2" fill="#3a3e4a" />
    </svg>
  );
}
