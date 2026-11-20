import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Toast } from '../../src/components/Toast';
import { FadeInView } from '../../src/components/anim/FadeInView';
import { PressableScale } from '../../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../../src/theme';
import { useT } from '../../src/i18n';
import { getOrders, getMachines, updateOrderStatus } from '../../src/api';
import { Machine, Order, OrderStatus } from '../../src/api/types';
import { formatDate, formatPLN } from '../../src/lib/format';

const statuses: OrderStatus[] = ['pending', 'paid', 'mixing', 'ready', 'picked_up'];
const tone: Record<OrderStatus, 'blue' | 'yellow' | 'success' | 'danger'> = {
  pending: 'yellow',
  paid: 'blue',
  mixing: 'blue',
  ready: 'success',
  picked_up: 'success',
};

export default function AdminOrders() {
  const dict = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [o, m] = await Promise.all([getOrders(), getMachines()]);
    setOrders(o.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setMachines(m);
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, s: OrderStatus) => {
    await updateOrderStatus(id, s);
    await load();
    setToast(`${dict.admin.orders.status}: ${dict.history.statuses[s]}`);
  };

  const machineName = (id: string) => machines.find(m => m.id === id)?.name ?? id;

  return (
    <Screen wide padded={false}>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl }}
        ListEmptyComponent={<Text style={styles.empty}>{dict.admin.orders.empty}</Text>}
        renderItem={({ item }) => (
          <FadeInView>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>{item.recipeName}</Text>
                  <Badge label={dict.history.statuses[item.status]} tone={tone[item.status]} />
                </View>
                <Text style={styles.meta}>
                  {formatDate(item.createdAt)} · {machineName(item.machineId)}
                </Text>
                <Text style={styles.price}>{formatPLN(item.totalPrice)}</Text>
                <View style={styles.statusRow}>
                  {statuses.map(s => {
                    const active = s === item.status;
                    return (
                      <PressableScale
                        key={s}
                        onPress={() => changeStatus(item.id, s)}
                        accessibilityRole="button"
                        accessibilityLabel={dict.history.statuses[s]}
                        style={[styles.statusBtn, active && styles.statusBtnActive]}
                      >
                        <Text style={[styles.statusTxt, active && { color: colors.white }]}>
                          {dict.history.statuses[s]}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            </Card>
          </FadeInView>
        )}
      />
      <Toast message={toast} onHide={() => setToast(null)} tone="info" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.slate500, fontFamily: font.regular, textAlign: 'center', paddingVertical: spacing.xxl },
  row: { gap: spacing.xs },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { color: colors.navy900, fontFamily: font.semibold, fontSize: 14, flex: 1 },
  meta: { color: colors.slate500, fontFamily: font.regular, fontSize: 12 },
  price: { color: colors.navy900, fontFamily: font.bold, fontSize: 14 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  statusBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue100,
    minHeight: 32,
  },
  statusBtnActive: { backgroundColor: colors.blue500, borderColor: colors.blue600 },
  statusTxt: { color: colors.navy700, fontFamily: font.medium, fontSize: 11 },
});
