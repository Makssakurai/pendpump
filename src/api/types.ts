// Shared types for the mock API and UI.

export type Goal = 'masa' | 'redukcja' | 'wytrzymalosc' | 'regeneracja' | 'custom';
export type Flavor = 'czekolada' | 'wanilia' | 'truskawka' | 'bez_smaku';
export type LiquidBase = 'water' | 'milk' | 'lactose_free';
export type CupSize = 300 | 400 | 500;
export type IngredientCategory = 'protein' | 'creatine' | 'bcaa' | 'vitamins' | 'electrolytes';

export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'ml';
  pricePerUnit: number;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  maxPerServing: number;
  category: IngredientCategory;
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  goal: Goal;
  cupSize: CupSize;
  base?: LiquidBase; // default 'water' if omitted
  ingredients: RecipeIngredient[];
  flavor: Flavor;
  isPreset: boolean;
}

export interface Machine {
  id: string;
  name: string;
  location: string; // club address in Radom
  distanceKm: number; // mock walking distance
  levels: Record<string, number>; // ingredientId -> grams
}

export type OrderStatus = 'pending' | 'paid' | 'mixing' | 'ready' | 'picked_up';

export interface OrderItemSnapshot {
  recipe: Recipe;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  createdAt: string;
  recipeName: string;
  recipeSnapshot: Recipe; // backwards compat
  items?: OrderItemSnapshot[]; // full multi-item cart snapshot for accurate reorder
  totalPrice: number;
  paidWithPass?: boolean;
  status: OrderStatus;
  machineId: string;
  pickupCode: string;
  qrData: string;
}

// Recommendation result — a recipe plus the facts behind it.
// The human-readable "why" is built in the UI from the i18n dictionary,
// so it follows the selected language (PL / EN / RU).
export interface Recommendation {
  recipe: Recipe;
  goal: Goal;
  weight?: number;
  proteinTarget?: number;
  trainingPerWeek?: number;
}

export type Discipline = 'strength' | 'crossfit' | 'running' | 'combat' | 'weightloss';

export interface GymGoalItem {
  id: string;
  discipline: Discipline;
  title: string;
  target: string;
  progress: number; // 0..100
}

export type PassTier = 'starter' | 'pro' | 'unlimited';

export interface UserProfile {
  name: string;
  weightKg: number;
  heightCm: number;
  age: number;
  preferredBase: LiquidBase;
  passTier: PassTier | null;
  passCredits: number;
  gymGoals: GymGoalItem[];
}
