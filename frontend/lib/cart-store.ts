'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Photo } from './types';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  thumbUrl: string;
  photographerName?: string;
}

interface CartState {
  items: CartItem[];
  add: (photo: Photo) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (photo) => {
        if (get().items.some((i) => i.id === photo.id)) return;
        set((state) => ({
          items: [
            ...state.items,
            { id: photo.id, title: photo.title, price: photo.price, thumbUrl: photo.thumbUrl, photographerName: photo.photographer?.name },
          ],
        }));
      },
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: 'pm_cart' }
  )
);

export function useCartTotal() {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.price, 0));
}
