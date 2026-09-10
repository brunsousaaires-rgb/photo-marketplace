/**
 * Configuração central da Zequinha Veículos.
 * Edite aqui: número de WhatsApp, Instagram, localização e mensagens.
 * O número de WhatsApp NUNCA deve ser hardcoded em outro lugar do código —
 * sempre importe `site.whatsappNumber` ou use os helpers em `lib/whatsapp.ts`.
 */

export const site = {
  name: "Zequinha Veículos",
  shortName: "Zequinha",
  tagline: "Qualidade e confiança em cada negócio.",
  description:
    "Zequinha Veículos em Trindade - GO. Compra, venda e troca de carros com qualidade, confiança e transparência.",
  city: "Trindade",
  state: "GO",
  location: "Trindade – GO",
  // Número real extraído do link do Instagram (wa.me/5562985272711).
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5562985272711",
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "zequinha_veiculos",
  instagramUrl: `https://instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "zequinha_veiculos"}`,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.zequinhaveiculos.com.br",
  // Endereço completo ainda não informado — deixar preparado para quando
  // a Zequinha fornecer o endereço exato (será usado no mapa e no Schema.org).
  address: {
    street: null as string | null,
    postalCode: null as string | null,
    lat: null as number | null,
    lng: null as number | null,
  },
};

export const whatsappMessages = {
  general:
    "Olá, Zequinha Veículos! Vim pelo site e gostaria de conhecer os veículos disponíveis.",
  vehicle: (modelLabel: string) =>
    `Olá! Vi o ${modelLabel} no site da Zequinha Veículos e gostaria de saber mais informações.`,
  sell: "Olá, Zequinha Veículos! Quero avaliar meu carro para venda.",
  trade: "Olá, Zequinha Veículos! Quero avaliar meu carro para troca.",
};

export const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Estoque", href: "#estoque" },
  { label: "Destaques", href: "#destaques" },
  { label: "Sobre", href: "#sobre" },
  { label: "Clientes", href: "#clientes" },
  { label: "Contato", href: "#contato" },
];
