import { site, whatsappMessages } from "./site.config";

/** Monta uma URL wa.me com o número único configurado no site. */
export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${site.whatsappNumber}?text=${encoded}`;
}

export function whatsappUrlGeneral(): string {
  return buildWhatsAppUrl(whatsappMessages.general);
}

export function whatsappUrlForVehicle(modelLabel: string): string {
  return buildWhatsAppUrl(whatsappMessages.vehicle(modelLabel));
}

export function whatsappUrlSell(): string {
  return buildWhatsAppUrl(whatsappMessages.sell);
}

export function whatsappUrlTrade(): string {
  return buildWhatsAppUrl(whatsappMessages.trade);
}
