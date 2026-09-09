/**
 * Fonte única de verdade para dados da marca 2L Veículos.
 *
 * Tudo marcado como CONFIRMADO veio de fontes públicas reais:
 * - Instagram @2lveiculoss (bio, link de WhatsApp)
 * - Site institucional oficial https://2lveiculos.netlify.app/
 *   (inclusive o conteúdo servido por /api/config, que alimenta o site deles)
 *
 * Tudo marcado como PENDENTE precisa ser preenchido pela 2L Veículos —
 * nada foi inventado. Procure por "PENDENTE" neste arquivo para achar
 * rapidamente o que falta.
 */

export const site = {
  name: '2L Veículos',
  handle: '@2lveiculoss',
  instagramUrl: 'https://www.instagram.com/2lveiculoss/',

  // CONFIRMADO — texto de contato do site institucional
  contactName: 'Lucas',

  // CONFIRMADO — copy real do site institucional (heroKicker/heroTitle/heroText)
  kicker: 'Compra • Venda • Troca • Financiamento • Consignação',
  heroTitle: 'Seu próximo veículo está na 2L.',
  heroText:
    'Veículos selecionados, atendimento direto e boas oportunidades para comprar, vender, trocar ou financiar.',

  // CONFIRMADO — "serviceText" do site institucional
  tagline: 'Compra, venda, troca, financiamento e consignação de automóveis com qualidade e procedência.',
  services: ['Compra', 'Venda', 'Troca', 'Financiamento', 'Consignação', 'Avaliação'],

  // CONFIRMADO — bio do Instagram + site institucional
  city: 'Trindade',
  state: 'GO',
  // CONFIRMADO — endereço completo do site institucional (mais preciso que a bio do Instagram)
  address: 'Av. Manoel Monteiro, 80 — Jardim Salvador, Trindade/GO, 75388-565',
  // CONFIRMADO — texto literal do site institucional
  hours: 'Consulte o horário de atendimento pelo WhatsApp',

  // CONFIRMADO — número extraído do link wa.me na bio do Instagram e do site institucional
  whatsappPrimary: '5562985169550',
  // CONFIRMADO — segundo número visível na fachada da loja / site institucional
  whatsappSecondary: '5562984561510',

  // CONFIRMADO — "whyTitle"/"whyText" do site institucional
  missionStatement:
    'Atendimento próximo, variedade de veículos e soluções para compra, venda, troca, financiamento e consignação.',
  siteTagline: 'Confiança construída em cada negociação.',

  // CONFIRMADO — "12 anos de experiência em veículos" (bio Instagram)
  yearsInMarket: 12,

  // PENDENTE — a 2L não publicou publicamente número de veículos vendidos
  // ou de clientes atendidos. Preencha quando tiver o dado real.
  vehiclesSold: undefined as number | undefined,
  happyCustomers: undefined as number | undefined,

  // CONFIRMADO — "benefits" do site institucional (whyTitle: "Por que comprar na 2L?")
  differentials: [
    {
      index: '01',
      title: 'Qualidade e Procedência',
      description: 'Veículos apresentados com informações claras para você negociar com mais segurança.',
    },
    {
      index: '02',
      title: 'Compra, Venda e Troca',
      description: 'A 2L trabalha com diferentes formatos de negociação para facilitar seu próximo negócio.',
    },
    {
      index: '03',
      title: 'Financiamento',
      description: 'Consulte condições de entrada e financiamento diretamente com a equipe.',
    },
    {
      index: '04',
      title: 'Atendimento Direto',
      description: 'Fale com a 2L Veículos pelo WhatsApp e faça sua proposta.',
    },
  ],

  // CONFIRMADO — seção de negociação do site institucional (financiamento/consignação/avaliação)
  finance: {
    title: 'Vamos fazer um bom negócio?',
    text: 'Escolha uma opção e fale diretamente com a equipe da 2L Veículos pelo WhatsApp.',
    financeTitle: 'Simule seu financiamento',
    financeText: 'Envie seus dados iniciais e receba atendimento para encontrar a melhor condição.',
    tradeTitle: 'Venda, troque ou deixe seu veículo em consignação',
    tradeText: 'Conte os dados do seu carro para receber uma avaliação inicial da equipe.',
  },

  // CONFIRMADO — seção de prova social ("Clientes") do site institucional
  proof: {
    title: 'Clientes satisfeitos. Negócios realizados.',
    text: 'Entregas reais da 2L Veículos. Confiança construída em cada negociação.',
  },

  social: {
    instagram: 'https://www.instagram.com/2lveiculoss/',
    // PENDENTE — outras redes sociais não confirmadas publicamente
    facebook: undefined as string | undefined,
  },
} as const;

export function whatsappLink(message: string, number: string = site.whatsappPrimary) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
