// Deterministic seed: same numbers on every reload — critical for a live pitch.
import { Ingredient, Recipe, Machine, Order, OrderStatus } from './types';
import { mulberry32 } from '../lib/prng';
import { calcRecipe } from '../lib/pricing';

export const seedIngredients: Ingredient[] = [
  { id: 'whey', name: 'Whey Protein', unit: 'g', pricePerUnit: 0.12, caloriesPerUnit: 4, proteinPerUnit: 0.8, carbsPerUnit: 0.1, fatPerUnit: 0.05, maxPerServing: 50, category: 'protein' },
  { id: 'vegan', name: 'Vegan Protein', unit: 'g', pricePerUnit: 0.15, caloriesPerUnit: 3.8, proteinPerUnit: 0.75, carbsPerUnit: 0.15, fatPerUnit: 0.04, maxPerServing: 50, category: 'protein' },
  { id: 'creatine', name: 'Kreatyna', unit: 'g', pricePerUnit: 0.2, caloriesPerUnit: 0, proteinPerUnit: 0, carbsPerUnit: 0, fatPerUnit: 0, maxPerServing: 5, category: 'creatine' },
  { id: 'bcaa', name: 'BCAA', unit: 'g', pricePerUnit: 0.25, caloriesPerUnit: 0, proteinPerUnit: 0, carbsPerUnit: 0, fatPerUnit: 0, maxPerServing: 10, category: 'bcaa' },
  { id: 'vitamins', name: 'Witaminy', unit: 'g', pricePerUnit: 0.3, caloriesPerUnit: 0, proteinPerUnit: 0, carbsPerUnit: 0, fatPerUnit: 0, maxPerServing: 3, category: 'vitamins' },
  { id: 'electrolytes', name: 'Elektrolity', unit: 'g', pricePerUnit: 0.18, caloriesPerUnit: 0, proteinPerUnit: 0, carbsPerUnit: 0, fatPerUnit: 0, maxPerServing: 8, category: 'electrolytes' },
];

export const seedRecipes: Recipe[] = [
  { id: 'r1', name: 'Mass Builder', goal: 'masa', cupSize: 500, base: 'milk', flavor: 'czekolada', isPreset: true, ingredients: [{ ingredientId: 'whey', amount: 40 }, { ingredientId: 'creatine', amount: 5 }, { ingredientId: 'electrolytes', amount: 4 }] },
  { id: 'r2', name: 'Lean Cut', goal: 'redukcja', cupSize: 300, base: 'water', flavor: 'truskawka', isPreset: true, ingredients: [{ ingredientId: 'whey', amount: 25 }, { ingredientId: 'bcaa', amount: 5 }, { ingredientId: 'vitamins', amount: 2 }] },
  { id: 'r3', name: 'Endurance Fuel', goal: 'wytrzymalosc', cupSize: 400, base: 'water', flavor: 'wanilia', isPreset: true, ingredients: [{ ingredientId: 'vegan', amount: 30 }, { ingredientId: 'electrolytes', amount: 6 }] },
  { id: 'r4', name: 'Recovery Pro', goal: 'regeneracja', cupSize: 400, base: 'lactose_free', flavor: 'czekolada', isPreset: true, ingredients: [{ ingredientId: 'whey', amount: 35 }, { ingredientId: 'bcaa', amount: 8 }, { ingredientId: 'creatine', amount: 3 }] },
  { id: 'r5', name: 'Vegan Power', goal: 'masa', cupSize: 500, base: 'water', flavor: 'bez_smaku', isPreset: true, ingredients: [{ ingredientId: 'vegan', amount: 45 }, { ingredientId: 'creatine', amount: 5 }] },
  { id: 'r6', name: 'Daily Vitamins', goal: 'regeneracja', cupSize: 300, base: 'water', flavor: 'wanilia', isPreset: true, ingredients: [{ ingredientId: 'whey', amount: 20 }, { ingredientId: 'vitamins', amount: 3 }, { ingredientId: 'electrolytes', amount: 4 }] },
  { id: 'r7', name: 'Pre-Workout Zest', goal: 'wytrzymalosc', cupSize: 300, base: 'water', flavor: 'truskawka', isPreset: true, ingredients: [{ ingredientId: 'whey', amount: 20 }, { ingredientId: 'bcaa', amount: 8 }, { ingredientId: 'electrolytes', amount: 6 }] },
  { id: 'r8', name: 'Night Recovery', goal: 'regeneracja', cupSize: 400, base: 'milk', flavor: 'wanilia', isPreset: true, ingredients: [{ ingredientId: 'whey', amount: 30 }, { ingredientId: 'vitamins', amount: 2 }] },
];

export const seedMachines: Machine[] = [
  { id: 'm1', name: 'Vendpump #1', location: 'Fitness Klub Radom, ul. Żeromskiego 12', distanceKm: 0.4, levels: { whey: 800, vegan: 500, creatine: 120, bcaa: 200, vitamins: 80, electrolytes: 300 } },
  { id: 'm2', name: 'Vendpump #2', location: 'CrossFit Radom, ul. Traugutta 5', distanceKm: 1.2, levels: { whey: 400, vegan: 600, creatine: 60, bcaa: 150, vitamins: 40, electrolytes: 200 } },
  { id: 'm3', name: 'Vendpump #3', location: 'Gym24 Radom, ul. Piłsudskiego 8', distanceKm: 2.1, levels: { whey: 1000, vegan: 300, creatine: 200, bcaa: 300, vitamins: 120, electrolytes: 500 } },
];

function hourWeight(h: number): number {
  if (h >= 6 && h <= 9) return 3;
  if (h >= 17 && h <= 21) return 4;
  if (h >= 12 && h <= 14) return 2;
  if (h >= 10 && h <= 16) return 1;
  if (h >= 22 || h <= 5) return 0.4;
  return 1;
}

export function generateSeedOrders(seed = 42): Order[] {
  const rnd = mulberry32(seed);
  const orders: Order[] = [];
  const now = new Date();
  const statusWeights: { s: OrderStatus; w: number }[] = [
    { s: 'picked_up', w: 0.7 },
    { s: 'ready', w: 0.1 },
    { s: 'mixing', w: 0.08 },
    { s: 'paid', w: 0.08 },
    { s: 'pending', w: 0.04 },
  ];
  const pickStatus = (): OrderStatus => {
    const r = rnd();
    let acc = 0;
    for (const { s, w } of statusWeights) {
      acc += w;
      if (r <= acc) return s;
    }
    return 'picked_up';
  };
  const pickHour = (): number => {
    for (let attempt = 0; attempt < 24; attempt++) {
      const h = Math.floor(rnd() * 24);
      if (rnd() * 4 <= hourWeight(h)) return h;
    }
    return 12;
  };

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(rnd() * 14);
    const day = new Date(now);
    day.setDate(day.getDate() - daysAgo);
    day.setHours(pickHour(), Math.floor(rnd() * 60), 0, 0);

    const recipe = seedRecipes[Math.floor(rnd() * seedRecipes.length)];
    const machine = seedMachines[Math.floor(rnd() * seedMachines.length)];
    const totals = calcRecipe(recipe, seedIngredients);
    const status = pickStatus();
    const pickupCode = String(Math.floor(100000 + rnd() * 900000));

    orders.push({
      id: `ord-${i}`,
      createdAt: day.toISOString(),
      recipeName: recipe.name,
      recipeSnapshot: recipe,
      items: [{ recipe, quantity: 1, unitPrice: totals.price }],
      totalPrice: totals.price,
      status,
      machineId: machine.id,
      pickupCode,
      qrData: `vendpump://pickup/${pickupCode}`,
    });
  }
  return orders;
}
