import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Toast } from '../../src/components/Toast';
import { FadeInView } from '../../src/components/anim/FadeInView';
import { colors, font, radius, spacing } from '../../src/theme';
import { useT } from '../../src/i18n';
import { getIngredients, getMachines, refillMachineIngredient } from '../../src/api';
import { Ingredient, Machine } from '../../src/api/types';

const LOW_THRESHOLD = 150;
const REFILL_AMOUNT = 500;

export default function Inventory() {
  const dict = useT();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([getMachines(), getIngredients()]);
    setMachines(m);
    setIngredients(i);
  }, []);

  useEffect(() => { load(); }, [load]);

  const refill = async (machineId: string, ingredientId: string) => {
    await refillMachineIngredient(machineId, ingredientId, REFILL_AMOUNT);
    await load();
    setToast(`+${REFILL_AMOUNT} g`);
  };

  return (
    <Screen wide padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        {machines.map(m => (
          <FadeInView key={m.id}>
            <Card style={styles.machine}>
              <View style={styles.machineHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.machineName}>{m.name}</Text>
                  <Text style={styles.machineLoc}>{m.location}</Text>
                </View>
                <Ionicons name="location-outline" size={18} color={colors.blue600} />
              </View>
              {ingredients.map(ing => {
                const level = m.levels[ing.id] ?? 0;
                const low = level < LOW_THRESHOLD;
                const pct = Math.max(0.05, Math.min(1, level / 1000));
                return (
                  <View key={ing.id} style={styles.ingRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.ingHead}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={[styles.ingLevel, low && { color: colors.danger }]}>
                          {level} g
                        </Text>
                      </View>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            { width: `${pct * 100}%`, backgroundColor: low ? colors.danger : colors.blue500 },
                          ]}
                        />
                      </View>
                      {low ? (
                        <Text style={styles.lowLabel}>{dict.admin.inventory.lowStock}</Text>
                      ) : null}
                    </View>
                    <Button
                      title={dict.admin.inventory.refill}
                      variant="secondary"
                      onPress={() => refill(m.id, ing.id)}
                      style={{ paddingVertical: spacing.sm, minHeight: 40, marginLeft: spacing.md }}
                      icon="add"
                    />
                  </View>
                );
              })}
            </Card>
          </FadeInView>
        ))}
      </ScrollView>
      <Toast message={toast} onHide={() => setToast(null)} tone="success" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  machine: { marginBottom: spacing.lg, gap: spacing.md },
  machineHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  machineName: { color: colors.navy900, fontFamily: font.semibold, fontSize: 16 },
  machineLoc: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  ingHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  ingName: { color: colors.navy900, fontFamily: font.medium, fontSize: 13 },
  ingLevel: { color: colors.slate500, fontFamily: font.semibold, fontSize: 12 },
  track: { height: 8, backgroundColor: colors.blue50, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  lowLabel: { color: colors.danger, fontFamily: font.medium, fontSize: 11, marginTop: 2 },
});
