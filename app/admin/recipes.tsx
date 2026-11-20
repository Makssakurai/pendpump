import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Badge } from '../../src/components/Badge';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { Toast } from '../../src/components/Toast';
import { FadeInView } from '../../src/components/anim/FadeInView';
import { PressableScale } from '../../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../../src/theme';
import { useT } from '../../src/i18n';
import {
  addRecipe,
  deleteRecipe,
  getIngredients,
  getRecipes,
} from '../../src/api';
import { CupSize, Flavor, Goal, Ingredient, Recipe } from '../../src/api/types';
import { calcRecipe } from '../../src/lib/pricing';
import { formatPLN } from '../../src/lib/format';

const goals: Goal[] = ['masa', 'redukcja', 'wytrzymalosc', 'regeneracja', 'custom'];
const cupSizes: CupSize[] = [300, 400, 500];
const flavors: Flavor[] = ['czekolada', 'wanilia', 'truskawka', 'bez_smaku'];

export default function AdminRecipes() {
  const dict = useT();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Draft for new preset
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('masa');
  const [cupSize, setCupSize] = useState<CupSize>(400);
  const [flavor, setFlavor] = useState<Flavor>('czekolada');
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [r, i] = await Promise.all([getRecipes(), getIngredients()]);
    setRecipes(r);
    setIngredients(i);
    const init: Record<string, number> = {};
    i.forEach(x => { init[x.id] = 0; });
    setAmounts(init);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    const recipe: Recipe = {
      id: `r-custom-${Date.now()}`,
      name: name.trim(),
      goal,
      cupSize,
      flavor,
      isPreset: true,
      ingredients: Object.entries(amounts)
        .filter(([, v]) => v > 0)
        .map(([ingredientId, amount]) => ({ ingredientId, amount })),
    };
    await addRecipe(recipe);
    setName('');
    setShowNew(false);
    setToast('OK');
    await load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await deleteRecipe(toDelete);
    setToDelete(null);
    await load();
  };

  return (
    <Screen wide padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        <View style={styles.topBar}>
          <Button
            title={dict.admin.recipes.addNew}
            onPress={() => setShowNew(v => !v)}
            icon={showNew ? 'close' : 'add'}
            variant={showNew ? 'secondary' : 'primary'}
          />
        </View>

        {showNew ? (
          <FadeInView>
            <Card style={styles.form}>
              <Text style={styles.label}>{dict.admin.recipes.name}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.slate500}
              />

              <Text style={styles.label}>{dict.admin.recipes.goal}</Text>
              <View style={styles.chips}>
                {goals.map(g => (
                  <Chip key={g} label={dict.goals[g]} active={goal === g} onPress={() => setGoal(g)} />
                ))}
              </View>

              <Text style={styles.label}>{dict.admin.recipes.cupSize}</Text>
              <View style={styles.chips}>
                {cupSizes.map(s => (
                  <Chip key={s} label={`${s} ml`} active={cupSize === s} onPress={() => setCupSize(s)} />
                ))}
              </View>

              <Text style={styles.label}>{dict.admin.recipes.flavor}</Text>
              <View style={styles.chips}>
                {flavors.map(f => (
                  <Chip key={f} label={dict.builder.flavors[f]} active={flavor === f} onPress={() => setFlavor(f)} />
                ))}
              </View>

              <Text style={styles.label}>{dict.admin.recipes.ingredients}</Text>
              {ingredients.map(ing => (
                <View key={ing.id} style={styles.ingRow}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <TextInput
                    style={[styles.input, { width: 100 }]}
                    value={String(amounts[ing.id] ?? 0)}
                    keyboardType="numeric"
                    onChangeText={txt => setAmounts(prev => ({ ...prev, [ing.id]: Math.max(0, Number(txt) || 0) }))}
                  />
                </View>
              ))}

              <Button title={dict.common.save} onPress={create} icon="checkmark-outline" />
            </Card>
          </FadeInView>
        ) : null}

        {recipes.map(r => {
          const t = calcRecipe(r, ingredients);
          return (
            <FadeInView key={r.id}>
              <Card style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{r.name}</Text>
                    <Badge
                      label={r.isPreset ? dict.admin.recipes.preset : dict.admin.recipes.custom}
                      tone={r.isPreset ? 'yellow' : 'blue'}
                    />
                  </View>
                  <Text style={styles.meta}>
                    {dict.goals[r.goal]} · {r.cupSize} ml · {dict.builder.flavors[r.flavor]}
                  </Text>
                  <Text style={styles.price}>{formatPLN(t.price)} · {t.kcal} kcal</Text>
                </View>
                <PressableScale
                  onPress={() => setToDelete(r.id)}
                  accessibilityRole="button"
                  accessibilityLabel={dict.common.delete}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </PressableScale>
              </Card>
            </FadeInView>
          );
        })}
      </ScrollView>

      <ConfirmDialog
        visible={toDelete !== null}
        title={dict.admin.recipes.deleteConfirm}
        confirmLabel={dict.common.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      <Toast message={toast} onHide={() => setToast(null)} tone="success" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  form: { marginBottom: spacing.lg, gap: spacing.sm },
  label: { color: colors.slate500, fontFamily: font.medium, fontSize: 12, marginTop: spacing.xs },
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue100,
    paddingHorizontal: spacing.md,
    color: colors.navy900,
    fontFamily: font.regular,
    backgroundColor: colors.white,
    marginTop: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  ingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ingName: { color: colors.navy900, fontFamily: font.medium, fontSize: 13, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { color: colors.navy900, fontFamily: font.semibold, fontSize: 15, flex: 1 },
  meta: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  price: { color: colors.navy900, fontFamily: font.bold, fontSize: 13, marginTop: spacing.xs },
  deleteBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
