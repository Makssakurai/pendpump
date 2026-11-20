// Mock API. All functions async so they can be swapped for fetch() later.
import { seedIngredients, seedRecipes, seedMachines, generateSeedOrders } from './seed';
import {
  Goal,
  Ingredient,
  Recipe,
  Machine,
  Order,
  OrderStatus,
  Recommendation,
} from './types';

// In-memory state (reset() will restore it to the deterministic seed).
function makeInitial() {
  return {
    ingredients: seedIngredients.map(i => ({ ...i })) as Ingredient[],
    recipes: seedRecipes.map(r => ({ ...r, ingredients: r.ingredients.map(x => ({ ...x })) })) as Recipe[],
    machines: seedMachines.map(m => ({ ...m, levels: { ...m.levels } })) as Machine[],
    orders: generateSeedOrders(),
  };
}
let state = makeInitial();

export async function resetMockApi(): Promise<void> {
  state = makeInitial();
}

// ---- Ingredients ----------------------------------------------------------

export async function getIngredients(): Promise<Ingredient[]> {
  return state.ingredients.map(i => ({ ...i }));
}

export async function updateIngredient(
  id: string,
  patch: Partial<Ingredient>,
): Promise<Ingredient | null> {
  const idx = state.ingredients.findIndex(i => i.id === id);
  if (idx === -1) return null;
  state.ingredients[idx] = { ...state.ingredients[idx], ...patch };
  return { ...state.ingredients[idx] };
}

export async function addIngredient(ing: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  const created: Ingredient = { ...ing, id: `ing-${Date.now()}` };
  state.ingredients.push(created);
  return { ...created };
}

export async function deleteIngredient(id: string): Promise<boolean> {
  const before = state.ingredients.length;
  state.ingredients = state.ingredients.filter(i => i.id !== id);
  return state.ingredients.length < before;
}

// ---- Recipes --------------------------------------------------------------

export async function getRecipes(): Promise<Recipe[]> {
  return state.recipes.map(r => ({ ...r, ingredients: r.ingredients.map(x => ({ ...x })) }));
}

export async function getPresetRecipes(): Promise<Recipe[]> {
  return (await getRecipes()).filter(r => r.isPreset);
}

export async function addRecipe(recipe: Recipe): Promise<Recipe> {
  state.recipes.push(recipe);
  return recipe;
}

export async function updateRecipe(id: string, patch: Partial<Recipe>): Promise<Recipe | null> {
  const idx = state.recipes.findIndex(r => r.id === id);
  if (idx === -1) return null;
  state.recipes[idx] = { ...state.recipes[idx], ...patch };
  return { ...state.recipes[idx] };
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const before = state.recipes.length;
  state.recipes = state.recipes.filter(r => r.id !== id);
  return state.recipes.length < before;
}

// ---- Machines & stock ----------------------------------------------------

export async function getMachines(): Promise<Machine[]> {
  return state.machines.map(m => ({ ...m, levels: { ...m.levels } }));
}

export async function refillMachineIngredient(
  machineId: string,
  ingredientId: string,
  amount: number,
): Promise<Machine | null> {
  const m = state.machines.find(x => x.id === machineId);
  if (!m) return null;
  m.levels[ingredientId] = (m.levels[ingredientId] ?? 0) + amount;
  return { ...m, levels: { ...m.levels } };
}

// Subtract every required gram from the machine's stock.
export async function decrementMachineStock(
  machineId: string,
  recipe: Recipe,
): Promise<boolean> {
  const m = state.machines.find(x => x.id === machineId);
  if (!m) return false;
  for (const r of recipe.ingredients) {
    const have = m.levels[r.ingredientId] ?? 0;
    if (have < r.amount) return false;
  }
  for (const r of recipe.ingredients) {
    m.levels[r.ingredientId] = (m.levels[r.ingredientId] ?? 0) - r.amount;
  }
  return true;
}

// Check whether the machine can serve this recipe (all ingredients in stock).
export function machineCanServe(machine: Machine, recipe: Recipe): boolean {
  return recipe.ingredients.every(r => (machine.levels[r.ingredientId] ?? 0) >= r.amount);
}

// ---- Orders ---------------------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  return state.orders.map(o => ({ ...o }));
}

export async function addOrder(order: Order): Promise<Order> {
  state.orders.push(order);
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  const idx = state.orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  state.orders[idx] = { ...state.orders[idx], status };
  return { ...state.orders[idx] };
}

// ---- Recommendations (mock, single swappable function) -------------------

interface RecInput {
  goal: string;
  weight?: number;
  trainingPerWeek?: number;
}

// Reads Polish + English + Russian keywords and returns a recommended preset.
export async function getRecommendation(input: RecInput): Promise<Recommendation> {
  const presets = await getPresetRecipes();
  const goal = normalizeGoal(input.goal);
  const proteinTarget = input.weight ? clamp(input.weight * 0.35, 20, 50) : 30;

  // Pick preset by goal first, then adjust protein toward target by picking the
  // preset in the same goal whose protein amount is closest to target.
  const inGoal = presets.filter(r => r.goal === goal);
  const pool = inGoal.length > 0 ? inGoal : presets;
  const proteinOf = (r: Recipe): number =>
    r.ingredients
      .filter(x => x.ingredientId === 'whey' || x.ingredientId === 'vegan')
      .reduce((s, x) => s + x.amount, 0);
  const best = pool.reduce<Recipe>((acc, r) => {
    const da = Math.abs(proteinOf(acc) - proteinTarget);
    const db = Math.abs(proteinOf(r) - proteinTarget);
    return db < da ? r : acc;
  }, pool[0]);

  return {
    recipe: best,
    goal,
    weight: input.weight,
    proteinTarget: input.weight ? Math.round(proteinTarget) : undefined,
    trainingPerWeek: input.trainingPerWeek,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeGoal(raw: string): Goal {
  const s = raw.toLowerCase();
  if (/(masa|mass|bulk|масс|набор)/.test(s)) return 'masa';
  if (/(redukc|cut|lean|lose|сушк|похуд|сброс|редукц)/.test(s)) return 'redukcja';
  if (/(wytrzym|endur|stamina|cardio|выносл|кардио)/.test(s)) return 'wytrzymalosc';
  if (/(regener|recover|recovery|восстанов|регенер)/.test(s)) return 'regeneracja';
  return 'custom';
}
