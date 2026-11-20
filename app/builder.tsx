import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { Chip } from '../src/components/Chip';
import { Button } from '../src/components/Button';
import { Stepper } from '../src/components/Stepper';
import { MacroBar } from '../src/components/MacroBar';
import { CupView } from '../src/components/CupView';
import { AnimatedNumber } from '../src/components/anim/AnimatedNumber';
import { FadeInView } from '../src/components/anim/FadeInView';
import { Shake } from '../src/components/anim/Shake';
import { Toast } from '../src/components/Toast';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { getIngredients, getPresetRecipes } from '../src/api';
import { CupSize, Flavor, Goal, Ingredient, LiquidBase, Recipe } from '../src/api/types';
import { useCart } from '../src/store/cartStore';
import { useOrders } from '../src/store/orderStore';
import { useProfile } from '../src/store/profileStore';
import { calcRecipe, LIQUID_BASE_META } from '../src/lib/pricing';
import { formatPLN } from '../src/lib/format';

const cupSizes: CupSize[] = [300, 400, 500];
const flavors: Flavor[] = ['czekolada', 'wanilia', 'truskawka', 'bez_smaku'];
const bases: LiquidBase[] = ['water', 'milk', 'lactose_free'];

export default function Builder() {
  const dict = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ goal?: Goal }>();
  const goal: Goal = (params.goal as Goal) ?? 'custom';
  const addToCart = useCart(s => s.add);
  const toggleFavourite = useOrders(s => s.toggleFavourite);
  const saveCustomPreset = useOrders(s => s.saveCustomPreset);
  const preferredBase = useProfile(s => s.profile.preferredBase);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [cupSize, setCupSize] = useState<CupSize>(400);
  const [base, setBase] = useState<LiquidBase>(preferredBase ?? 'water');
  const [flavor, setFlavor] = useState<Flavor>('czekolada');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [presetName, setPresetName] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [list, presets] = await Promise.all([getIngredients(), getPresetRecipes()]);
      setIngredients(list);
      const preset = presets.find(p => p.goal === goal);
      const init: Record<string, number> = {};
      list.forEach(i => { init[i.id] = 0; });
      if (preset) {
        preset.ingredients.forEach(ri => {
          init[ri.ingredientId] = Math.min(
            ri.amount,
            list.find(i => i.id === ri.ingredientId)?.maxPerServing ?? ri.amount,
          );
        });
        setCupSize(preset.cupSize);
        setFlavor(preset.flavor);
        if (preset.base) setBase(preset.base);
      }
      setAmounts(init);
    })();
  }, [goal]);

  const recipe: Recipe = useMemo(() => ({
    id: `custom-${goal}-${cupSize}-${base}-${flavor}`,
    name: presetName.trim() || `${dict.goals[goal]} ${cupSize} ml`,
    goal,
    cupSize,
    base,
    flavor,
    isPreset: false,
    ingredients: Object.entries(amounts)
      .filter(([, v]) => v > 0)
      .map(([ingredientId, amount]) => ({ ingredientId, amount })),
  }), [amounts, base, cupSize, dict.goals, flavor, goal, presetName]);

  const totals = useMemo(() => calcRecipe(recipe, ingredients), [recipe, ingredients]);
  const hasAny = recipe.ingredients.length > 0;

  const layers = recipe.ingredients
    .map(ri => ingredients.find(i => i.id === ri.ingredientId))
    .filter((x): x is Ingredient => Boolean(x))
    .map(i => ({ category: i.category, grams: amounts[i.id] ?? 0 }));

  const totalGrams = recipe.ingredients.reduce((s, r) => s + r.amount, 0);
  const fill = Math.min(1, 0.25 + totalGrams / 70);

  const handleChange = (ing: Ingredient, v: number) => {
    if (v >= ing.maxPerServing) {
      setShakeTrigger(x => x + 1);
      setToast(`${ing.name}: ${dict.builder.maxReached} ${ing.maxPerServing} g`);
    }
    setAmounts(prev => ({ ...prev, [ing.id]: Math.max(0, Math.min(v, ing.maxPerServing)) }));
  };

  const handleAdd = () => {
    if (!hasAny) {
      setToast(dict.builder.nothingSelected);
      setShakeTrigger(x => x + 1);
      return;
    }
    addToCart(recipe, totals.price);
    router.push('/cart');
  };

  const handleSavePreset = async () => {
    if (!hasAny) {
      setToast(dict.builder.nothingSelected);
      setShakeTrigger(x => x + 1);
      return;
    }
    await saveCustomPreset(recipe);
    setToast(dict.builder.presetSaved);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl * 2 }}>
        <FadeInView>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{dict.builder.title}</Text>
              <Text style={styles.goalChip}>
                {dict.builder.goalLabel.replace('{{goal}}', dict.goals[goal])}
              </Text>
              <Text style={styles.baseSubLabel}>
                {dict.builder.bases[base]} · {dict.builder.flavors[flavor]}
              </Text>
            </View>
            <View style={styles.cupStage}>
              <CupView
                size={112}
                cupSize={cupSize}
                fill={fill}
                flavor={flavor}
                base={base}
                layers={layers}
                showVolumeBadge
              />
            </View>
          </View>
        </FadeInView>

        <Text style={styles.section}>{dict.builder.cupSize}</Text>
        <View style={styles.chips}>
          {cupSizes.map(s => (
            <Chip
              key={s}
              label={`${s} ml`}
              active={cupSize === s}
              onPress={() => setCupSize(s)}
            />
          ))}
        </View>

        <Text style={styles.section}>{dict.builder.liquidBase}</Text>
        <View style={styles.chips}>
          {bases.map(b => {
            const extra = LIQUID_BASE_META[b].extraPrice;
            const label =
              extra > 0
                ? `${dict.builder.bases[b]} (+${extra.toFixed(2)} zł)`
                : dict.builder.bases[b];
            return (
              <Chip
                key={b}
                label={label}
                active={base === b}
                onPress={() => setBase(b)}
              />
            );
          })}
        </View>

        <Text style={styles.section}>{dict.builder.ingredients}</Text>
        <Shake trigger={shakeTrigger}>
          <View style={{ gap: spacing.sm }}>
            {ingredients.map(ing => {
              const current = amounts[ing.id] ?? 0;
              const atMax = current >= ing.maxPerServing;
              return (
                <View key={ing.id}>
                  <Stepper
                    label={ing.name}
                    value={current}
                    min={0}
                    max={ing.maxPerServing}
                    step={ing.category === 'creatine' ? 1 : 5}
                    onChange={v => handleChange(ing, v)}
                    onMaxReached={() => handleChange(ing, ing.maxPerServing)}
                  />
                  {atMax ? (
                    <Text style={styles.maxLabel}>
                      {dict.builder.maxReached} · {ing.maxPerServing} g
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Shake>

        <Text style={styles.section}>{dict.builder.flavor}</Text>
        <View style={styles.chips}>
          {flavors.map(f => (
            <Chip
              key={f}
              label={dict.builder.flavors[f]}
              active={flavor === f}
              onPress={() => setFlavor(f)}
            />
          ))}
        </View>

        <Text style={styles.section}>{dict.builder.macros}</Text>
        <MacroBar
          kcal={totals.kcal}
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
        />

        <Card style={styles.priceCard}>
          <Text style={styles.priceLabel}>{dict.builder.price}</Text>
          <AnimatedNumber
            value={totals.price}
            formatter={n => formatPLN(n)}
            style={styles.priceValue}
          />
        </Card>

        {/* Save custom preset card */}
        <Card style={styles.savePresetCard}>
          <TextInput
            style={styles.presetInput}
            placeholder={dict.builder.presetNamePlaceholder}
            placeholderTextColor={colors.slate500}
            value={presetName}
            onChangeText={setPresetName}
          />
          <Button
            title={dict.builder.savePreset}
            variant="secondary"
            onPress={handleSavePreset}
            disabled={!hasAny}
            icon="bookmark-outline"
          />
        </Card>

        <Text style={styles.disclaimer}>{dict.common.notMedicalAdvice}</Text>

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          <Button
            title={dict.builder.addToCart}
            onPress={handleAdd}
            disabled={!hasAny}
            icon="bag-add-outline"
          />
          <Button
            title={dict.builder.addToFavourites}
            variant="ghost"
            onPress={() => toggleFavourite(recipe)}
            icon="heart-outline"
          />
        </View>
      </ScrollView>
      <Toast message={toast} onHide={() => setToast(null)} tone="success" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    minHeight: 165,
  },
  cupStage: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { color: colors.navy900, fontFamily: font.bold, fontSize: 26 },
  goalChip: {
    color: colors.blue600,
    fontFamily: font.semibold,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  baseSubLabel: {
    color: colors.slate500,
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 16,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  maxLabel: {
    color: colors.danger,
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  priceCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { color: colors.slate500, fontFamily: font.medium, fontSize: 14 },
  priceValue: { color: colors.navy900, fontFamily: font.bold, fontSize: 22 },
  savePresetCard: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  presetInput: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue100,
    paddingHorizontal: spacing.md,
    color: colors.navy900,
    fontFamily: font.regular,
    backgroundColor: colors.blue50,
  },
  disclaimer: {
    color: colors.slate500,
    fontFamily: font.regular,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
