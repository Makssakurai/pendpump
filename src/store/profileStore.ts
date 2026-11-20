import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Discipline, GymGoalItem, LiquidBase, PassTier, UserProfile } from '../api/types';

const PROFILE_KEY = 'vendpump:profile:v1';

export const PASS_PLANS: Record<
  PassTier,
  { shakes: number; pricePLN: number; discountLabel: string }
> = {
  starter: { shakes: 5, pricePLN: 59, discountLabel: '-15%' },
  pro: { shakes: 12, pricePLN: 125, discountLabel: '-25%' },
  unlimited: { shakes: 30, pricePLN: 269, discountLabel: '-35%' },
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Maksym',
  weightKg: 85,
  heightCm: 182,
  age: 19,
  preferredBase: 'water',
  passTier: 'pro',
  passCredits: 4,
  gymGoals: [
    {
      id: 'g-1',
      discipline: 'strength',
      title: 'Wyciskanie leżąc (Bench Press)',
      target: '110 kg × 5',
      progress: 78,
    },
    {
      id: 'g-2',
      discipline: 'crossfit',
      title: '150 g białka dziennie',
      target: '30 dni z rzędu',
      progress: 64,
    },
  ],
};

interface ProfileState {
  profile: UserProfile;
  loaded: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  buyPass: (tier: PassTier) => Promise<void>;
  consumePassCredit: (count?: number) => Promise<boolean>;
  addGymGoal: (goal: Omit<GymGoalItem, 'id'>) => Promise<void>;
  updateGoalProgress: (id: string, progress: number) => Promise<void>;
  removeGymGoal: (id: string) => Promise<void>;
  resetProfile: () => Promise<void>;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  loaded: false,
  loadProfile: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        set({ profile: { ...DEFAULT_PROFILE, ...JSON.parse(raw) }, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
  updateProfile: async (patch) => {
    const next = { ...get().profile, ...patch };
    set({ profile: next });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  },
  buyPass: async (tier) => {
    const plan = PASS_PLANS[tier];
    const current = get().profile;
    const next: UserProfile = {
      ...current,
      passTier: tier,
      passCredits: current.passCredits + plan.shakes,
    };
    set({ profile: next });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  },
  consumePassCredit: async (count = 1) => {
    const current = get().profile;
    if (current.passCredits < count) return false;
    const next: UserProfile = {
      ...current,
      passCredits: current.passCredits - count,
    };
    set({ profile: next });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    return true;
  },
  addGymGoal: async (goal) => {
    const current = get().profile;
    const item: GymGoalItem = { ...goal, id: `goal-${Date.now()}` };
    const next = { ...current, gymGoals: [item, ...current.gymGoals] };
    set({ profile: next });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  },
  updateGoalProgress: async (id, progress) => {
    const current = get().profile;
    const clamped = Math.max(0, Math.min(100, progress));
    const next = {
      ...current,
      gymGoals: current.gymGoals.map(g => (g.id === id ? { ...g, progress: clamped } : g)),
    };
    set({ profile: next });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  },
  removeGymGoal: async (id) => {
    const current = get().profile;
    const next = {
      ...current,
      gymGoals: current.gymGoals.filter(g => g.id !== id),
    };
    set({ profile: next });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  },
  resetProfile: async () => {
    set({ profile: DEFAULT_PROFILE });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
  },
}));
