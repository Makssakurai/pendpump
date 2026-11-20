import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { CupView } from '../src/components/CupView';
import { FadeInView } from '../src/components/anim/FadeInView';
import { PressableScale } from '../src/components/anim/PressableScale';
import { AnimatedNumber } from '../src/components/anim/AnimatedNumber';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { useCart, cartSubtotal } from '../src/store/cartStore';
import { formatPLN } from '../src/lib/format';

export default function Cart() {
  const dict = useT();
  const router = useRouter();
  const items = useCart(s => s.items);
  const increment = useCart(s => s.increment);
  const decrement = useCart(s => s.decrement);
  const remove = useCart(s => s.remove);
  const subtotal = cartSubtotal(items);

  return (
    <Screen scroll={false}>
      <FlatList
        data={items}
        keyExtractor={i => i.key}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={48} color={colors.blue200} />
            <Text style={styles.emptyTitle}>{dict.cart.empty}</Text>
            <Text style={styles.emptyHint}>{dict.cart.emptyHint}</Text>
            <Button title={dict.common.back} variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
          </View>
        }
        renderItem={({ item }) => (
          <FadeInView>
            <Card style={styles.row}>
              <CupView
                size={52}
                cupSize={item.recipe.cupSize}
                fill={Math.min(1, item.recipe.ingredients.reduce((s, x) => s + x.amount, 0) / 70)}
                flavor={item.recipe.flavor}
                base={item.recipe.base ?? 'water'}
                animated={false}
              />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.name}>{item.recipe.name}</Text>
                <Text style={styles.sub}>
                  {item.recipe.cupSize} ml · {dict.builder.bases[item.recipe.base ?? 'water']} · {dict.builder.flavors[item.recipe.flavor]}
                </Text>
              </View>
              <View style={styles.qtyRow}>
                <PressableScale
                  onPress={() => decrement(item.key)}
                  accessibilityRole="button"
                  accessibilityLabel="-"
                  style={styles.qtyBtn}
                >
                  <Ionicons name="remove" size={16} color={colors.blue600} />
                </PressableScale>
                <Text style={styles.qty}>{item.quantity}</Text>
                <PressableScale
                  onPress={() => increment(item.key)}
                  accessibilityRole="button"
                  accessibilityLabel="+"
                  style={styles.qtyBtn}
                >
                  <Ionicons name="add" size={16} color={colors.blue600} />
                </PressableScale>
              </View>
              <Text style={styles.price}>{formatPLN(item.price * item.quantity)}</Text>
              <PressableScale
                onPress={() => remove(item.key)}
                accessibilityRole="button"
                accessibilityLabel={dict.cart.remove}
                style={styles.removeBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </PressableScale>
            </Card>
          </FadeInView>
        )}
      />

      {items.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{dict.cart.total}</Text>
            <AnimatedNumber
              value={subtotal}
              formatter={n => formatPLN(n)}
              style={styles.totalValue}
            />
          </View>
          <Button title={dict.cart.pay} onPress={() => router.push('/payment')} icon="card-outline" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyTitle: { color: colors.navy900, fontFamily: font.semibold, fontSize: 18, marginTop: spacing.md },
  emptyHint: { color: colors.slate500, fontFamily: font.regular, fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { color: colors.navy900, fontFamily: font.semibold, fontSize: 14 },
  sub: { color: colors.slate500, fontFamily: font.regular, fontSize: 11, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { color: colors.navy900, fontFamily: font.semibold, minWidth: 20, textAlign: 'center' },
  price: { color: colors.navy900, fontFamily: font.bold, fontSize: 13, minWidth: 66, textAlign: 'right' },
  removeBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.blue100, gap: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.navy900, fontFamily: font.semibold, fontSize: 16 },
  totalValue: { color: colors.navy900, fontFamily: font.bold, fontSize: 22 },
});
