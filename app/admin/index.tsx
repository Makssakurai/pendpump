import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { SimpleChart } from '../../src/components/SimpleChart';
import { Skeleton } from '../../src/components/Skeleton';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { Toast } from '../../src/components/Toast';
import { AnimatedNumber } from '../../src/components/anim/AnimatedNumber';
import { FadeInView } from '../../src/components/anim/FadeInView';
import { PressableScale } from '../../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../../src/theme';
import { useT } from '../../src/i18n';
import { useSettings } from '../../src/store/settingsStore';
import { useOrders } from '../../src/store/orderStore';
import { useProfile } from '../../src/store/profileStore';
import { getMachines, getOrders, resetMockApi } from '../../src/api';
import { Machine, Order } from '../../src/api/types';
import { formatDayMonth, formatPLN, localDateKey } from '../../src/lib/format';

type Range = 7 | 14;

export default function AdminDashboard() {
  const dict = useT();
  const router = useRouter();
  const logout = useSettings(s => s.logoutAdmin);
  const clearOrders = useOrders(s => s.clearAll);
  const resetProfile = useProfile(s => s.resetProfile);

  const [orders, setOrders] = useState<Order[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(7);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    const [o, m] = await Promise.all([getOrders(), getMachines()]);
    setOrders(o);
    setMachines(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const validOrders = useMemo(
    () => orders.filter(o => o.status !== 'pending'),
    [orders],
  );

  const revenue = useMemo(
    () => validOrders.reduce((s, o) => s + o.totalPrice, 0),
    [validOrders],
  );

  const salesByDay = useMemo(() => {
    const now = new Date();
    const days: { key: string; label: string; ts: number; value: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      days.push({ key, label: formatDayMonth(d.toISOString()), ts: d.getTime(), value: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.key, i] as const));
    validOrders.forEach(o => {
      const k = localDateKey(new Date(o.createdAt));
      const i = idx.get(k);
      if (i !== undefined) days[i].value += 1;
    });
    return days.map(d => ({ label: d.label, value: d.value }));
  }, [range, validOrders]);

  const revenueByMachine = useMemo(() => {
    const byId = new Map<string, number>();
    validOrders.forEach(o => {
      byId.set(o.machineId, (byId.get(o.machineId) ?? 0) + o.totalPrice);
    });
    return machines.map(m => ({
      label: m.name.replace('Vendpump ', ''),
      value: Math.round((byId.get(m.id) ?? 0) * 100) / 100,
    }));
  }, [machines, validOrders]);

  const topRecipes = useMemo(() => {
    const counts = new Map<string, number>();
    validOrders.forEach(o => {
      counts.set(o.recipeName, (counts.get(o.recipeName) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }, [validOrders]);

  const handleReset = async () => {
    await resetMockApi();
    await clearOrders();
    await resetProfile();
    setResetOpen(false);
    setToast(dict.admin.reset.done);
    await load();
  };

  return (
    <Screen wide>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.topRow}>
          <Text style={styles.h1}>{dict.admin.dashboard.title}</Text>
          <Button
            title={dict.admin.logout}
            variant="ghost"
            onPress={async () => { await logout(); router.replace('/'); }}
            icon="log-out-outline"
          />
        </View>

        {loading ? (
          <View style={{ gap: spacing.sm }}>
            <Skeleton height={90} />
            <Skeleton height={140} />
            <Skeleton height={180} />
          </View>
        ) : (
          <>
            <View style={styles.kpis}>
              <KPICard label={dict.admin.dashboard.sales} value={validOrders.length} unit={dict.admin.dashboard.ordersUnit} icon="bag-check-outline" />
              <KPICard label={dict.admin.dashboard.revenue} value={revenue} formatter={n => formatPLN(n, { cents: false })} icon="cash-outline" />
              <KPICard label={dict.admin.dashboard.orders} value={orders.length} icon="receipt-outline" />
            </View>

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{dict.admin.dashboard.salesPerDay}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Chip label={dict.admin.dashboard.range7} active={range === 7} onPress={() => setRange(7)} />
                  <Chip label={dict.admin.dashboard.range14} active={range === 14} onPress={() => setRange(14)} />
                </View>
              </View>
              <SimpleChart data={salesByDay} unit="" />
            </Card>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>{dict.admin.dashboard.revenuePerMachine}</Text>
              <SimpleChart data={revenueByMachine} unit=" zł" color={colors.yellow400} />
            </Card>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>{dict.admin.dashboard.topRecipes}</Text>
              <SimpleChart data={topRecipes} unit="" />
            </Card>

            <View style={styles.navGrid}>
              <NavCard icon="cube-outline" label={dict.admin.nav.inventory} onPress={() => router.push('/admin/inventory')} />
              <NavCard icon="receipt-outline" label={dict.admin.nav.orders} onPress={() => router.push('/admin/orders')} />
              <NavCard icon="flask-outline" label={dict.admin.nav.ingredients} onPress={() => router.push('/admin/ingredients')} />
              <NavCard icon="book-outline" label={dict.admin.nav.recipes} onPress={() => router.push('/admin/recipes')} />
              <NavCard icon="refresh-outline" label={dict.admin.nav.reset} onPress={() => setResetOpen(true)} />
            </View>
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={resetOpen}
        title={dict.admin.reset.title}
        message={dict.admin.reset.hint}
        confirmLabel={dict.admin.reset.button}
        cancelLabel={dict.common.cancel}
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
      <Toast message={toast} onHide={() => setToast(null)} tone="success" />
    </Screen>
  );
}

function KPICard({
  label,
  value,
  unit,
  icon,
  formatter,
}: {
  label: string;
  value: number;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  formatter?: (n: number) => string;
}) {
  return (
    <FadeInView>
      <Card style={styles.kpi}>
        <View style={styles.kpiIcon}>
          <Ionicons name={icon} size={20} color={colors.blue600} />
        </View>
        <Text style={styles.kpiLabel}>{label}</Text>
        <AnimatedNumber
          value={value}
          formatter={n => `${formatter ? formatter(n) : Math.round(n)}${unit ? ` ${unit}` : ''}`}
          style={styles.kpiValue}
        />
      </Card>
    </FadeInView>
  );
}

function NavCard({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ flex: 1, minWidth: 140 }}>
      <Card style={styles.navCard}>
        <Ionicons name={icon} size={22} color={colors.blue600} />
        <Text style={styles.navLabel}>{label}</Text>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  h1: { color: colors.navy900, fontFamily: font.bold, fontSize: 26 },
  kpis: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  kpi: { flex: 1, minWidth: 160, gap: spacing.xs },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  kpiLabel: { color: colors.slate500, fontFamily: font.medium, fontSize: 12 },
  kpiValue: { color: colors.navy900, fontFamily: font.bold, fontSize: 22 },
  section: { marginBottom: spacing.lg, gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  sectionTitle: { color: colors.navy900, fontFamily: font.semibold, fontSize: 16 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  navCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  navLabel: { color: colors.navy900, fontFamily: font.semibold, fontSize: 14 },
});
