import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("pt-BR")} km`;
}

export function formatPrice(price: number | null): string {
  if (price === null) return "Consulte";
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
