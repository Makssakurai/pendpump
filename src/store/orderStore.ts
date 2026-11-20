// Favourites, custom saved presets + history persisted via AsyncStorage.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, OrderStatus, Recipe } from '../api/types';
import { updateOrderStatus as apiUpdateOrderStatus } from '../api';

const FAV_KEY = 'vendpump:favourites:v2';
const PRESETS_KEY = 'vendpump:customPresets:v1';
const HIST_KEY = 'vendpump:history:v2';

interface OrderState {
  favourites: Recipe[];
  customPresets: Recipe[];
  history: Order[];
  loadPersisted: () => Promise<void>;
  toggleFavourite: (recipe: Recipe) => Promise<void>;
  saveCustomPreset: (recipe: Recipe) => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;
  addToHistory: (order: Order) => Promise<void>;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useOrders = create<OrderState>((set, get) => ({
  favourites: [],
  customPresets: [],
  history: [],
  loadPersisted: async () => {
    const [favRaw, presetsRaw, histRaw] = await Promise.all([
      AsyncStorage.getItem(FAV_KEY),
      AsyncStorage.getItem(PRESETS_KEY),
      AsyncStorage.getItem(HIST_KEY),
    ]);
    set({
      favourites: favRaw ? (JSON.parse(favRaw) as Recipe[]) : [],
      customPresets: presetsRaw ? (JSON.parse(presetsRaw) as Recipe[]) : [],
      history: histRaw ? (JSON.parse(histRaw) as Order[]) : [],
    });
  },
  toggleFavourite: async (recipe) => {
    const exists = get().favourites.find(r => r.id === recipe.id);
    const next = exists
      ? get().favourites.filter(r => r.id !== recipe.id)
      : [...get().favourites, recipe];
    set({ favourites: next });
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  },
  saveCustomPreset: async (recipe) => {
    const saved: Recipe = {
      ...recipe,
      id: `preset-${Date.now()}`,
      isPreset: false,
    };
    const next = [saved, ...get().customPresets];
    set({ customPresets: next });
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  },
  deleteCustomPreset: async (id) => {
    const next = get().customPresets.filter(r => r.id !== id);
    set({ customPresets: next });
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  },
  addToHistory: async (order) => {
    const next = [order, ...get().history];
    set({ history: next });
    await AsyncStorage.setItem(HIST_KEY, JSON.stringify(next));
  },
  updateStatus: async (orderId, status) => {
    const next = get().history.map(o => (o.id === orderId ? { ...o, status } : o));
    set({ history: next });
    await AsyncStorage.setItem(HIST_KEY, JSON.stringify(next));
    await apiUpdateOrderStatus(orderId, status);
  },
  clearAll: async () => {
    set({ favourites: [], customPresets: [], history: [] });
    await Promise.all([
      AsyncStorage.removeItem(FAV_KEY),
      AsyncStorage.removeItem(PRESETS_KEY),
      AsyncStorage.removeItem(HIST_KEY),
    ]);
  },
}));
