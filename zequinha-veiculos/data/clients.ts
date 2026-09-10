/**
 * Mural de clientes ("Clientes" no Instagram da Zequinha).
 *
 * REGRA: não inventar nomes, fotos ou depoimentos. Este array começa
 * vazio — a seção `ClientGallery` deve ser preenchida assim que a loja
 * fornecer as fotos reais (ex.: exportadas do destaque "Clientes" do
 * Instagram @zequinha_veiculos) e, opcionalmente, o depoimento de cada
 * cliente.
 */

export interface ClientStory {
  id: string;
  /** Nome real informado pelo cliente/loja. */
  name: string;
  /** Caminho da foto real (ex.: "/clients/01.jpg"). */
  image: string;
  /** Modelo do veículo negociado, se informado. */
  vehicle?: string;
  /** Depoimento real do cliente, se houver. */
  quote?: string;
}

export const clientStories: ClientStory[] = [];
