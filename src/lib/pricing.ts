// ONE source of truth for price + macros. Use this everywhere.
import { Ingredient, LiquidBase, Recipe } from '../api/types';

export interface RecipeTotals {
  price: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Base cup + blending cost per size (in PLN).
const BASE_PRICE: Record<number, number> = { 300: 3, 400: 4, 500: 5 };

// Liquid base modifiers (per 100ml)
export const LIQUID_BASE_META: Record<
  LiquidBase,
  { extraPrice: number; kcalPer100: number; proteinPer100: number; carbsPer100: number; fatPer100: number }
> = {
  water: { extraPrice: 0, kcalPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0 },
  milk: { extraPrice: 1.5, kcalPer100: 45, proteinPer100: 3.3, carbsPer100: 4.8, fatPer100: 1.5 },
  lactose_free: { extraPrice: 2.0, kcalPer100: 46, proteinPer100: 3.3, carbsPer100: 4.8, fatPer100: 1.5 },
};

export function calcRecipe(recipe: Recipe, ingredients: Ingredient[]): RecipeTotals {
  const byId = new Map(ingredients.map(i => [i.id, i] as const));
  const baseType: LiquidBase = recipe.base ?? 'water';
  const baseMeta = LIQUID_BASE_META[baseType];
  const volumeFactor = recipe.cupSize / 100;

  let price = (BASE_PRICE[recipe.cupSize] ?? 4) + baseMeta.extraPrice;
  let kcal = baseMeta.kcalPer100 * volumeFactor;
  let protein = baseMeta.proteinPer100 * volumeFactor;
  let carbs = baseMeta.carbsPer100 * volumeFactor;
  let fat = baseMeta.fatPer100 * volumeFactor;

  for (const r of recipe.ingredients) {
    const ing = byId.get(r.ingredientId);
    if (!ing) continue;
    price += ing.pricePerUnit * r.amount;
    kcal += ing.caloriesPerUnit * r.amount;
    protein += ing.proteinPerUnit * r.amount;
    carbs += ing.carbsPerUnit * r.amount;
    fat += ing.fatPerUnit * r.amount;
  }
  return {
    price: Math.round(price * 100) / 100,
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
  };
}
