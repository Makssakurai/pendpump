// i18n with a real reactive hook (A1 fix).
import { useSettings } from '../store/settingsStore';
import { pl, Dict } from './pl';
import { en } from './en';
import { ru } from './ru';

const dictionaries = { pl, en, ru } as const;
export type Lang = keyof typeof dictionaries;
export type { Dict };

// useT subscribes to the lang in the store, so EVERY screen re-renders on change.
export function useT(): Dict {
  const lang = useSettings(s => s.lang);
  return dictionaries[lang];
}

// Non-hook accessor for very rare non-React uses (avoid in components).
export function getDict(lang: Lang): Dict {
  return dictionaries[lang];
}