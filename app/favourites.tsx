import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { CupView } from '../src/components/CupView';
import { FadeInView } from '../src/components/anim/FadeInView';
import { PressableScale } from '../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { useOrders } from '../src/store/orderStore';
import { useCart } from '../src/store/cartStore';
import { getIngredients } from '../src/api';
import { Ingredient } from '../src/api/types';
import { calcRecipe } from '../src/lib/pricing';
import { formatPLN } from '../src/lib/format';

export default function Favourites() {
  const dict = useT();
  const router = useRouter();
  const favourites = useOrders(s => s.favourites);
  const toggle = useOrders(s => s.toggleFavourite);
  const addToCart = useCart(s => s.add);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => { getIngredients().then(setIngredients); }, []);

  return (
    <Screen scroll={false}>
      <FlatList
        data={favourites}
        keyExtractor={r => r.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={48} color={colors.blue200} />
            <Text style={styles.emptyTitle}>{dict.favourites.empty}</Text>
            <Text style={styles.emptyHint}>{dict.favourites.emptyHint}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const totals = calcRecipe(item, ingredients);
          return (
            <FadeInView>
              <Card style={styles.row}>
                <CupView
                  size={56}
                  fill={Math.min(1, item.ingredients.reduce((s, x) => s + x.amount, 0) / 70)}
                  flavor={item.flavor}
                  animated={false}
                />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>{item.cupSize} ml · {dict.builder.flavors[item.flavor]}</Text>
                  <Text style={styles.price}>{formatPLN(totals.price)}</Text>
                </View>
                <PressableScale
                  onPress={() => { addToCart(item, totals.price); router.push('/cart'); }}
                  accessibilityRole="button"
                  accessibilityLabel={dict.favourites.addToCart}
                  style={styles.addBtn}
                >
                  <Ionicons name="add" size={20} color={colors.white} />
                </PressableScale>
                <PressableScale
                  onPress={() => toggle(item)}
                  accessibilityRole="button"
                  accessibilityLabel={dict.favourites.remove}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </PressableScale>
              </Card>
            </FadeInView>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyTitle: { color: colors.navy900, fontFamily: font.semibold, fontSize: 18, marginTop: spacing.md },
  emptyHint: { color: colors.slate500, fontFamily: font.regular, fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: colors.navy900, fontFamily: font.semibold, fontSize: 15 },
  sub: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  price: { color: colors.blue600, fontFamily: font.bold, fontSize: 14, marginTop: spacing.xs },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
