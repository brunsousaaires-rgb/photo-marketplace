/**
 * Fonte única de verdade para dados da marca 2L Veículos.
 *
 * Tudo marcado como CONFIRMADO veio de fontes públicas reais:
 * - Instagram @2lveiculoss (bio, link de WhatsApp, destaques)
 * - Site institucional https://2lveiculos.com.br/
 *
 * Tudo marcado como PENDENTE precisa ser preenchido pela 2L Veículos —
 * nada foi inventado. Procure por "PENDENTE" neste arquivo para achar
 * rapidamente o que falta.
 */

export const site = {
  name: '2L Veículos',
  handle: '@2lveiculoss',
  instagramUrl: 'https://www.instagram.com/2lveiculoss/',

  // CONFIRMADO — bio do Instagram
  tagline: '12 anos de experiência em veículos.',
  services: ['Compra', 'Venda', 'Troca', 'Financiamento'],

  // CONFIRMADO — bio do Instagram + site institucional
  city: 'Trindade',
  state: 'GO',
  address: 'Av. Manoel Monteiro, Jardim Salvador, nº 80 — Trindade/GO',

  // CONFIRMADO — número extraído do link wa.me na bio do Instagram
  whatsappPrimary: '5562985169550',
  // CONFIRMADO — número informado no site institucional (2lveiculos.com.br)
  whatsappSecondary: '5562984561510',

  // CONFIRMADO — texto do site institucional (2lveiculos.com.br)
  missionStatement:
    'Oferecer as melhores ofertas com responsabilidade e dedicação, ajudando a realizar sonhos e construir relações de confiança.',
  siteTagline: 'As melhores ofertas de carros e financiamento.',

  // CONFIRMADO — "12 anos de experiência em veículos" (bio Instagram)
  yearsInMarket: 12,

  // PENDENTE — a 2L não publicou publicamente número de veículos vendidos
  // ou de clientes atendidos. Preencha quando tiver o dado real.
  vehiclesSold: undefined as number | undefined,
  happyCustomers: undefined as number | undefined,

  // CONFIRMADO — diferenciais citados na bio e no site institucional
  differentials: [
    {
      index: '01',
      title: 'Veículos Selecionados',
      description: 'Cada carro passa por uma curadoria antes de chegar até você.',
    },
    {
      index: '02',
      title: 'Negociação Transparente',
      description: 'Compra, venda e troca com clareza do início ao fim.',
    },
    {
      index: '03',
      title: 'Financiamento Facilitado',
      description: 'Condições de financiamento pensadas para o seu momento.',
    },
    {
      index: '04',
      title: 'Do Primeiro Contato à Entrega',
      description: 'Acompanhamento próximo em cada etapa da negociação.',
    },
  ],

  social: {
    instagram: 'https://www.instagram.com/2lveiculoss/',
    // PENDENTE — outras redes sociais não confirmadas publicamente
    facebook: undefined as string | undefined,
  },
} as const;

export function whatsappLink(message: string, number: string = site.whatsappPrimary) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
