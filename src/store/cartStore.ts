// Cart with quantity +/- and totals. Merges identical recipes accurately.
import { create } from 'zustand';
import { Recipe } from '../api/types';

export interface CartEntry {
  key: string;
  recipe: Recipe;
  quantity: number;
  price: number; // price per 1 unit at time of add
}

export function recipeSignature(r: Recipe): string {
  const ingSig = [...r.ingredients]
    .sort((a, b) => a.ingredientId.localeCompare(b.ingredientId))
    .map(i => `${i.ingredientId}:${i.amount}`)
    .join(',');
  return `${r.name}|${r.cupSize}|${r.base ?? 'water'}|${r.flavor}|${ingSig}`;
}

interface CartState {
  items: CartEntry[];
  add: (recipe: Recipe, price: number, qty?: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (recipe, price, qty = 1) => {
    const key = recipeSignature(recipe);
    const existing = get().items.find(i => i.key === key);
    if (existing) {
      set({
        items: get().items.map(i =>
          i.key === key ? { ...i, quantity: i.quantity + qty } : i,
        ),
      });
    } else {
      set({ items: [...get().items, { key, recipe, price, quantity: qty }] });
    }
  },
  increment: (key) =>
    set({
      items: get().items.map(i =>
        i.key === key ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    }),
  decrement: (key) =>
    set({
      items: get()
        .items.map(i =>
          i.key === key ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i,
        )
        .filter(i => i.quantity > 0),
    }),
  remove: (key) => set({ items: get().items.filter(i => i.key !== key) }),
  clear: () => set({ items: [] }),
}));

export function cartSubtotal(items: CartEntry[]): number {
  return Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
}
export function cartCount(items: CartEntry[]): number {
  return items.reduce((s, i) => s + i.quantity, 0);
}
