import type { Seller } from '@/types/seller';

/**
 * PENDENTE — a equipe de vendedores da 2L Veículos não pôde ser identificada
 * publicamente (o Instagram e o site institucional não listam nomes,
 * fotos ou especialidades da equipe).
 *
 * A estrutura abaixo está pronta para receber os dados reais. Basta
 * adicionar um objeto por vendedor seguindo o formato de `Seller`:
 *
 * {
 *   id: 'nome-sobrenome',
 *   name: 'Nome do vendedor',
 *   role: 'Consultor de vendas',
 *   image: '/sellers/nome-sobrenome.jpg',
 *   whatsapp: '55629XXXXXXXX',
 *   bio: 'Uma frase curta de apresentação.',
 * }
 *
 * Enquanto a equipe não é cadastrada, a seção "Vendedores" do site
 * direciona automaticamente para o WhatsApp geral da loja.
 */
export const sellers: Seller[] = [];
