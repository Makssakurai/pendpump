import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '../i18n';

const LANG_KEY = 'vendpump:lang';
const ADMIN_KEY = 'vendpump:adminUnlocked';

interface SettingsState {
  lang: Lang;
  adminUnlocked: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (lang: Lang) => Promise<void>;
  unlockAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
}

// Demo-only password. Keep the on-screen hint in admin gate.
const ADMIN_PASSWORD = 'vendpump2024';

export const useSettings = create<SettingsState>((set, get) => ({
  lang: 'pl',
  adminUnlocked: false,
  hydrated: false,
  hydrate: async () => {
    const [langRaw, adminRaw] = await Promise.all([
      AsyncStorage.getItem(LANG_KEY),
      AsyncStorage.getItem(ADMIN_KEY),
    ]);
    const validLang: Lang = langRaw === 'en' || langRaw === 'ru' ? langRaw : 'pl';
    set({
      lang: validLang,
      adminUnlocked: adminRaw === '1',
      hydrated: true,
    });
  },
  setLanguage: async (lang) => {
    set({ lang });
    await AsyncStorage.setItem(LANG_KEY, lang);
  },
  unlockAdmin: async (password) => {
    const ok = password === ADMIN_PASSWORD;
    if (ok) {
      set({ adminUnlocked: true });
      await AsyncStorage.setItem(ADMIN_KEY, '1');
    }
    return ok;
  },
  logoutAdmin: async () => {
    set({ adminUnlocked: false });
    await AsyncStorage.removeItem(ADMIN_KEY);
  },
}));

// Convenience non-hook read
export function currentLang(): Lang {
  return useSettings.getState().lang;
}