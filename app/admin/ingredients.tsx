import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { Toast } from '../../src/components/Toast';
import { FadeInView } from '../../src/components/anim/FadeInView';
import { PressableScale } from '../../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../../src/theme';
import { useT } from '../../src/i18n';
import {
  addIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
  resetMockApi,
} from '../../src/api';
import { Ingredient, IngredientCategory } from '../../src/api/types';
import { useSettings } from '../../src/store/settingsStore';
import { useOrders } from '../../src/store/orderStore';

const categories: IngredientCategory[] = ['protein', 'creatine', 'bcaa', 'vitamins', 'electrolytes'];

interface Draft {
  name: string;
  pricePerUnit: string;
  caloriesPerUnit: string;
  proteinPerUnit: string;
  carbsPerUnit: string;
  fatPerUnit: string;
  maxPerServing: string;
  category: IngredientCategory;
}

const emptyDraft: Draft = {
  name: '',
  pricePerUnit: '0.10',
  caloriesPerUnit: '0',
  proteinPerUnit: '0',
  carbsPerUnit: '0',
  fatPerUnit: '0',
  maxPerServing: '10',
  category: 'protein',
};

export default function AdminIngredients() {
  const dict = useT();
  const logout = useSettings(s => s.logoutAdmin);
  const clearOrders = useOrders(s => s.clearAll);
  const [list, setList] = useState<Ingredient[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showNew, setShowNew] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async () => { setList(await getIngredients()); }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!draft.name.trim()) return;
    await addIngredient({
      name: draft.name.trim(),
      unit: 'g',
      pricePerUnit: Number(draft.pricePerUnit) || 0,
      caloriesPerUnit: Number(draft.caloriesPerUnit) || 0,
      proteinPerUnit: Number(draft.proteinPerUnit) || 0,
      carbsPerUnit: Number(draft.carbsPerUnit) || 0,
      fatPerUnit: Number(draft.fatPerUnit) || 0,
      maxPerServing: Number(draft.maxPerServing) || 1,
      category: draft.category,
    });
    setDraft(emptyDraft);
    setShowNew(false);
    setToast('OK');
    await load();
  };

  const patch = async (id: string, p: Partial<Ingredient>) => {
    await updateIngredient(id, p);
    await load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await deleteIngredient(toDelete);
    setToDelete(null);
    await load();
  };

  const doReset = async () => {
    await resetMockApi();
    await clearOrders();
    setResetOpen(false);
    setToast(dict.admin.reset.done);
    await load();
    await logout();
  };

  return (
    <Screen wide padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        <View style={styles.topBar}>
          <Button
            title={dict.admin.ingredients.addNew}
            onPress={() => setShowNew(v => !v)}
            icon={showNew ? 'close' : 'add'}
            variant={showNew ? 'secondary' : 'primary'}
          />
          <Button
            title={dict.admin.reset.button}
            variant="accent"
            onPress={() => setResetOpen(true)}
            icon="refresh-outline"
          />
        </View>

        {showNew ? (
          <FadeInView>
            <Card style={styles.form}>
              <Text style={styles.formTitle}>{dict.admin.ingredients.addNew}</Text>
              <Field label={dict.admin.ingredients.name} value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} />
              <View style={styles.grid2}>
                <Field label={dict.admin.ingredients.pricePerGram} value={draft.pricePerUnit} numeric onChange={v => setDraft(d => ({ ...d, pricePerUnit: v }))} />
                <Field label={dict.admin.ingredients.maxPerServing} value={draft.maxPerServing} numeric onChange={v => setDraft(d => ({ ...d, maxPerServing: v }))} />
                <Field label={dict.admin.ingredients.kcalPerGram} value={draft.caloriesPerUnit} numeric onChange={v => setDraft(d => ({ ...d, caloriesPerUnit: v }))} />
                <Field label={dict.admin.ingredients.proteinPerGram} value={draft.proteinPerUnit} numeric onChange={v => setDraft(d => ({ ...d, proteinPerUnit: v }))} />
                <Field label={dict.admin.ingredients.carbsPerGram} value={draft.carbsPerUnit} numeric onChange={v => setDraft(d => ({ ...d, carbsPerUnit: v }))} />
                <Field label={dict.admin.ingredients.fatPerGram} value={draft.fatPerUnit} numeric onChange={v => setDraft(d => ({ ...d, fatPerUnit: v }))} />
              </View>
              <Text style={styles.label}>{dict.admin.ingredients.category}</Text>
              <View style={styles.chips}>
                {categories.map(c => (
                  <Chip
                    key={c}
                    label={dict.admin.categories[c]}
                    active={draft.category === c}
                    onPress={() => setDraft(d => ({ ...d, category: c }))}
                  />
                ))}
              </View>
              <Button title={dict.common.save} onPress={create} icon="checkmark-outline" />
            </Card>
          </FadeInView>
        ) : null}

        {list.map(ing => (
          <FadeInView key={ing.id}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{ing.name}</Text>
                <Text style={styles.meta}>
                  {dict.admin.categories[ing.category]} · max {ing.maxPerServing} g · {ing.caloriesPerUnit} kcal/g
                </Text>
                <View style={styles.inline}>
                  <Text style={styles.inlineLabel}>{dict.admin.ingredients.pricePerGram}</Text>
                  <NumberInput value={ing.pricePerUnit} onChange={v => patch(ing.id, { pricePerUnit: v })} />
                </View>
              </View>
              <PressableScale
                onPress={() => setToDelete(ing.id)}
                accessibilityRole="button"
                accessibilityLabel={dict.common.delete}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </PressableScale>
            </Card>
          </FadeInView>
        ))}
      </ScrollView>

      <ConfirmDialog
        visible={toDelete !== null}
        title={dict.admin.ingredients.deleteConfirm}
        message={dict.admin.ingredients.deleteHint}
        confirmLabel={dict.common.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmDialog
        visible={resetOpen}
        title={dict.admin.reset.title}
        message={dict.admin.reset.hint}
        confirmLabel={dict.admin.reset.button}
        cancelLabel={dict.common.cancel}
        onConfirm={doReset}
        onCancel={() => setResetOpen(false)}
      />
      <Toast message={toast} onHide={() => setToast(null)} tone="success" />
    </Screen>
  );
}

function Field({ label, value, onChange, numeric }: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  return (
    <View style={{ flex: 1, minWidth: 140 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholderTextColor={colors.slate500}
      />
    </View>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  return (
    <TextInput
      style={[styles.input, { width: 90 }]}
      value={txt}
      keyboardType="numeric"
      onChangeText={setTxt}
      onEndEditing={() => {
        const n = Number(txt);
        if (!Number.isFinite(n) || n < 0) { setTxt(String(value)); return; }
        if (n !== value) onChange(n);
      }}
    />
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  form: { marginBottom: spacing.lg, gap: spacing.sm },
  formTitle: { color: colors.navy900, fontFamily: font.semibold, fontSize: 16 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  name: { color: colors.navy900, fontFamily: font.semibold, fontSize: 15 },
  meta: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  inlineLabel: { color: colors.slate500, fontFamily: font.medium, fontSize: 12 },
  deleteBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
