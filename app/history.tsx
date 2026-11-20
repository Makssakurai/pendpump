import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { Badge } from '../src/components/Badge';
import { Button } from '../src/components/Button';
import { FadeInView } from '../src/components/anim/FadeInView';
import { colors, font, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { useOrders } from '../src/store/orderStore';
import { useCart } from '../src/store/cartStore';
import { formatPLN, formatDate } from '../src/lib/format';
import { Order, OrderStatus } from '../src/api/types';

const statusTone: Record<OrderStatus, 'blue' | 'yellow' | 'success' | 'danger'> = {
  pending: 'yellow',
  paid: 'blue',
  mixing: 'blue',
  ready: 'success',
  picked_up: 'success',
};

export default function History() {
  const dict = useT();
  const router = useRouter();
  const history = useOrders(s => s.history);
  const addToCart = useCart(s => s.add);

  const handleReorder = (order: Order) => {
    if (order.items && order.items.length > 0) {
      // Restore each distinct shake with its exact quantity and unit price
      for (const entry of order.items) {
        addToCart(entry.recipe, entry.unitPrice, entry.quantity);
      }
    } else {
      // Legacy fallback: strip any accidental " ×N" suffix if present
      const cleanName = order.recipeSnapshot.name.replace(/\s*×\d+$/, '');
      addToCart({ ...order.recipeSnapshot, name: cleanName }, order.totalPrice, 1);
    }
    router.push('/cart');
  };

  return (
    <Screen scroll={false}>
      <FlatList
        data={history}
        keyExtractor={o => o.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={colors.blue200} />
            <Text style={styles.emptyTitle}>{dict.history.empty}</Text>
            <Text style={styles.emptyHint}>{dict.history.emptyHint}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FadeInView>
            <Card style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.name} numberOfLines={2}>{item.recipeName}</Text>
                <Badge label={dict.history.statuses[item.status]} tone={statusTone[item.status]} />
              </View>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              <View style={styles.rowBottom}>
                <Text style={styles.price}>
                  {item.paidWithPass ? 'Vendpump Pass (0,00 zł)' : formatPLN(item.totalPrice)}
                </Text>
                <Button
                  title={dict.history.orderAgain}
                  variant="secondary"
                  onPress={() => handleReorder(item)}
                  icon="refresh-outline"
                  style={styles.againBtn}
                />
              </View>
            </Card>
          </FadeInView>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyTitle: { color: colors.navy900, fontFamily: font.semibold, fontSize: 18, marginTop: spacing.md },
  emptyHint: { color: colors.slate500, fontFamily: font.regular, fontSize: 14, textAlign: 'center' },
  card: { gap: spacing.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { color: colors.navy900, fontFamily: font.semibold, fontSize: 15, flex: 1 },
  date: { color: colors.slate500, fontFamily: font.regular, fontSize: 12 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  price: { color: colors.navy900, fontFamily: font.bold, fontSize: 15 },
  againBtn: { paddingVertical: spacing.sm, minHeight: 40 },
});
