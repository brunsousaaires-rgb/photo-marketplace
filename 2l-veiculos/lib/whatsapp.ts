import { site, whatsappLink } from '@/data/site';
import type { Vehicle } from '@/types/vehicle';

export function vehicleInterestLink(vehicle: Vehicle, sellerWhatsapp?: string) {
  const name = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
  const message = `Olá! Vi o ${name} no site da 2L Veículos e gostaria de receber mais informações.`;
  return whatsappLink(message, sellerWhatsapp ?? site.whatsappPrimary);
}

export function generalContactLink() {
  return whatsappLink('Olá! Vim pelo site da 2L Veículos e gostaria de falar com vocês.');
}

export function contactPersonLink() {
  return whatsappLink(`Olá, ${site.contactName}! Vim pelo site da 2L Veículos e gostaria de falar com você.`);
}

export function sellerContactLink(sellerName: string, whatsapp: string) {
  return whatsappLink(
    `Olá, ${sellerName}! Vim pelo site da 2L Veículos e gostaria de falar com você.`,
    whatsapp
  );
}
