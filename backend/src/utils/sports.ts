export const SPORTS = [
  { slug: 'volei-de-praia', label: 'Vôlei de Praia' },
  { slug: 'futevolei', label: 'Futevôlei' },
  { slug: 'beach-tennis', label: 'Beach Tennis' },
  { slug: 'volei-de-quadra', label: 'Vôlei de Quadra' },
  { slug: 'futebol', label: 'Futebol' },
  { slug: 'corrida', label: 'Corrida' },
  { slug: 'ciclismo', label: 'Ciclismo' },
  { slug: 'outros', label: 'Outros' },
] as const;

export const SPORT_SLUGS = SPORTS.map((s) => s.slug);
export type SportSlug = (typeof SPORT_SLUGS)[number];

export function sportLabel(slug: string): string {
  return SPORTS.find((s) => s.slug === slug)?.label ?? slug;
}
