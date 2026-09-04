export interface SportInfo {
  slug: string;
  label: string;
  emoji: string;
}

export const SPORTS: SportInfo[] = [
  { slug: 'volei-de-praia', label: 'Vôlei de Praia', emoji: '🏐' },
  { slug: 'futevolei', label: 'Futevôlei', emoji: '🦵' },
  { slug: 'beach-tennis', label: 'Beach Tennis', emoji: '🎾' },
  { slug: 'volei-de-quadra', label: 'Vôlei de Quadra', emoji: '🏐' },
  { slug: 'futebol', label: 'Futebol', emoji: '⚽' },
  { slug: 'corrida', label: 'Corrida', emoji: '🏃' },
  { slug: 'ciclismo', label: 'Ciclismo', emoji: '🚴' },
  { slug: 'outros', label: 'Outros', emoji: '🏆' },
];

export function sportInfo(slug: string): SportInfo {
  return SPORTS.find((s) => s.slug === slug) ?? { slug, label: slug, emoji: '🏆' };
}
