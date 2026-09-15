import type { AreaId, EquipId } from "../data/routines";

const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_URL || "#preco";
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";

export function getCheckoutUrl(area?: AreaId | null, equip?: EquipId[] | null) {
  if (CHECKOUT_URL === "#preco") return CHECKOUT_URL;
  try {
    const url = new URL(CHECKOUT_URL);
    if (area) url.searchParams.set("area", area);
    if (equip && equip.length) url.searchParams.set("equip", equip.join(","));
    return url.toString();
  } catch {
    return CHECKOUT_URL;
  }
}

export function getWhatsappUrl(message: string) {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
