import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { FadeInView } from '../src/components/anim/FadeInView';
import { PressableScale } from '../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { useCart, cartSubtotal, cartCount } from '../src/store/cartStore';
import { useOrders } from '../src/store/orderStore';
import { useProfile } from '../src/store/profileStore';
import { addOrder, getMachines, machineCanServe, decrementMachineStock } from '../src/api';
import { Machine, Order } from '../src/api/types';
import { formatPLN } from '../src/lib/format';

const methods = ['pass', 'blik', 'card', 'applePay', 'googlePay'] as const;
type Method = (typeof methods)[number];

const methodIcons: Record<Method, keyof typeof Ionicons.glyphMap> = {
  pass: 'ticket-outline',
  blik: 'flash-outline',
  card: 'card-outline',
  applePay: 'logo-apple',
  googlePay: 'logo-google',
};

export default function Payment() {
  const dict = useT();
  const router = useRouter();
  const items = useCart(s => s.items);
  const clear = useCart(s => s.clear);
  const addToHistory = useOrders(s => s.addToHistory);
  const passCredits = useProfile(s => s.profile.passCredits);
  const consumePassCredit = useProfile(s => s.consumePassCredit);

  const subtotal = cartSubtotal(items);
  const totalShakes = cartCount(items);
  const canUsePass = passCredits >= totalShakes && totalShakes > 0;

  const [method, setMethod] = useState<Method>(canUsePass ? 'pass' : 'blik');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMachines().then(list => {
      setMachines(list);
      const firstOk = list.find(m => items.every(i => machineCanServe(m, i.recipe)));
      setMachineId(firstOk?.id ?? null);
    });
  }, [items]);

  if (items.length === 0) {
    return (
      <Screen>
        <Text style={styles.empty}>{dict.payment.emptyCart}</Text>
        <Button title={dict.payment.emptyCartAction} onPress={() => router.replace('/')} variant="secondary" style={{ marginTop: spacing.lg }} />
      </Screen>
    );
  }

  const machineAvailable = (m: Machine) => items.every(i => machineCanServe(m, i.recipe));

  const pay = async () => {
    if (!machineId) return;
    if (method === 'pass' && !canUsePass) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const machine = machines.find(m => m.id === machineId);
    if (!machine) { setLoading(false); return; }

    let paidWithPass = false;
    if (method === 'pass') {
      const ok = await consumePassCredit(totalShakes);
      if (!ok) { setLoading(false); return; }
      paidWithPass = true;
    }

    const pickupCode = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date().toISOString();
    const firstRecipe = items[0].recipe;

    const order: Order = {
      id: `ord-${Date.now()}`,
      createdAt: now,
      recipeName: items.map(i => (i.quantity > 1 ? `${i.recipe.name} ×${i.quantity}` : i.recipe.name)).join(', '),
      recipeSnapshot: firstRecipe,
      items: items.map(i => ({
        recipe: i.recipe,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      totalPrice: paidWithPass ? 0 : subtotal,
      paidWithPass,
      status: 'paid',
      machineId,
      pickupCode,
      qrData: `vendpump://pickup/${pickupCode}`,
    };

    for (const item of items) {
      for (let k = 0; k < item.quantity; k++) {
        await decrementMachineStock(machineId, item.recipe);
      }
    }
    await addOrder(order);
    await addToHistory(order);
    clear();
    setLoading(false);
    router.replace({
      pathname: '/order-confirmed',
      params: {
        code: pickupCode,
        machineId,
        orderId: order.id,
        flavor: firstRecipe.flavor,
        base: firstRecipe.base ?? 'water',
        cupSize: String(firstRecipe.cupSize),
      },
    });
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>{dict.payment.amount}</Text>
          <Text style={styles.amountValue}>
            {method === 'pass' ? formatPLN(0) : formatPLN(subtotal)}
          </Text>
          {method === 'pass' ? (
            <Text style={styles.passHint}>
              {dict.payment.usePassHint.replace('{{needed}}', String(totalShakes))}
            </Text>
          ) : null}
        </Card>

        <Text style={styles.section}>{dict.payment.chooseMachine}</Text>
        <View style={{ gap: spacing.sm }}>
          {machines.map(m => {
            const ok = machineAvailable(m);
            const selected = machineId === m.id;
            return (
              <PressableScale
                key={m.id}
                onPress={() => ok && setMachineId(m.id)}
                accessibilityRole="button"
                accessibilityLabel={m.name}
                disabled={!ok}
              >
                <Card
                  style={[
                    styles.machineRow,
                    selected && styles.machineSelected,
                    !ok && { opacity: 0.5 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.machineName}>{m.name}</Text>
                    <Text style={styles.machineLoc}>{m.location}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.machineDist}>
                      {dict.payment.machineDistance.replace('{{km}}', String(m.distanceKm))}
                    </Text>
                    <Text style={[styles.machineTag, { color: ok ? colors.success : colors.danger }]}>
                      {ok ? dict.payment.machineAvailable : dict.payment.machineUnavailable}
                    </Text>
                  </View>
                </Card>
              </PressableScale>
            );
          })}
        </View>

        <Text style={styles.section}>{dict.payment.title}</Text>
        <View style={{ gap: spacing.sm }}>
          {methods.map(m => {
            const isPass = m === 'pass';
            const disabled = isPass && !canUsePass;
            const selected = method === m;
            const label = isPass
              ? canUsePass
                ? dict.payment.usePass.replace('{{count}}', String(passCredits))
                : dict.payment.notEnoughPass
                    .replace('{{count}}', String(passCredits))
                    .replace('{{needed}}', String(totalShakes))
              : dict.payment.methods[m];

            return (
              <PressableScale
                key={m}
                onPress={() => !disabled && setMethod(m)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={{ opacity: disabled ? 0.45 : 1 }}
              >
                <FadeInView>
                  <Card style={[styles.methodRow, selected && styles.methodSelected]}>
                    <Ionicons
                      name={methodIcons[m]}
                      size={22}
                      color={isPass ? colors.navy900 : colors.blue600}
                    />
                    <Text style={styles.methodName}>{label}</Text>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Card>
                </FadeInView>
              </PressableScale>
            );
          })}
        </View>

        <Button
          title={
            loading
              ? dict.payment.processing
              : method === 'pass'
                ? dict.payment.confirmPass
                : dict.payment.confirm
          }
          onPress={pay}
          disabled={loading || !machineId || (method === 'pass' && !canUsePass)}
          variant={method === 'pass' ? 'accent' : 'primary'}
          style={{ marginTop: spacing.xl }}
          icon={method === 'pass' ? 'ticket-outline' : 'lock-closed-outline'}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.navy900, fontFamily: font.semibold, fontSize: 18, textAlign: 'center' },
  amountCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
  amountLabel: { color: colors.slate500, fontFamily: font.medium, fontSize: 13 },
  amountValue: { color: colors.navy900, fontFamily: font.bold, fontSize: 32 },
  passHint: { color: colors.success, fontFamily: font.semibold, fontSize: 12, marginTop: 2 },
  section: { color: colors.navy900, fontFamily: font.semibold, fontSize: 16, marginTop: spacing.xl, marginBottom: spacing.sm },
  machineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  machineSelected: { borderColor: colors.blue500, borderWidth: 2 },
  machineName: { color: colors.navy900, fontFamily: font.semibold, fontSize: 15 },
  machineLoc: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  machineDist: { color: colors.blue600, fontFamily: font.semibold, fontSize: 12 },
  machineTag: { fontFamily: font.semibold, fontSize: 11, marginTop: 2 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodSelected: { borderColor: colors.blue500, borderWidth: 2 },
  methodName: { flex: 1, color: colors.navy900, fontFamily: font.semibold, fontSize: 14 },
  radio: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.blue200, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.blue500 },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.blue500 },
});
