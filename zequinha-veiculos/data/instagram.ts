/**
 * Publicações do Instagram exibidas na seção "Acompanhe a Zequinha".
 *
 * Este projeto não faz scraping do Instagram. Para exibir posts reais,
 * integre a Instagram Basic Display API (ou Graph API) e popule este
 * array no servidor, ou substitua `InstagramSection` por um embed oficial.
 * Até lá, a seção mostra apenas o link direto para o perfil.
 */

export interface InstagramPost {
  id: string;
  image: string;
  caption?: string;
  permalink: string;
}

export const instagramPosts: InstagramPost[] = [];
