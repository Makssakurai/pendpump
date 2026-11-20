import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { CupView } from '../src/components/CupView';
import { Confetti } from '../src/components/anim/Confetti';
import { FadeInView } from '../src/components/anim/FadeInView';
import { Pulse } from '../src/components/anim/Pulse';
import { PressableScale } from '../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { useOrders } from '../src/store/orderStore';
import { getMachines } from '../src/api';
import { CupSize, Flavor, LiquidBase, Machine, OrderStatus } from '../src/api/types';

const USE_NATIVE = Platform.OS !== 'web';

export default function OrderConfirmed() {
  const dict = useT();
  const router = useRouter();
  const { code, machineId, orderId, flavor, base, cupSize } = useLocalSearchParams<{
    code: string;
    machineId: string;
    orderId: string;
    flavor?: Flavor;
    base?: LiquidBase;
    cupSize?: string;
  }>();
  const updateStatus = useOrders(s => s.updateStatus);

  const cupFlavor: Flavor = (flavor as Flavor) ?? 'czekolada';
  const cupBase: LiquidBase = (base as LiquidBase) ?? 'water';
  const parsedSize = Number(cupSize);
  const volume: CupSize = parsedSize === 300 || parsedSize === 500 ? parsedSize : 400;

  const [status, setStatus] = useState<OrderStatus>('paid');
  const [machine, setMachine] = useState<Machine | null>(null);
  const [progress, setProgress] = useState(0);

  const checkScale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    getMachines().then(list => setMachine(list.find(m => m.id === machineId) ?? null));
  }, [machineId]);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: USE_NATIVE, speed: 10, bounciness: 10 }),
        Animated.timing(ringScale, { toValue: 1.8, duration: 700, useNativeDriver: USE_NATIVE, easing: Easing.out(Easing.ease) }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 700, useNativeDriver: USE_NATIVE }),
      ]),
    ]).start();
  }, [checkScale, ringOpacity, ringScale]);

  useEffect(() => {
    if (!orderId) return;
    const t1 = setTimeout(async () => {
      setStatus('mixing');
      await updateStatus(orderId, 'mixing');
    }, 700);
    const t2 = setTimeout(async () => {
      setStatus('ready');
      await updateStatus(orderId, 'ready');
    }, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [orderId, updateStatus]);

  useEffect(() => {
    if (status !== 'mixing') return;
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(1, p + 0.04);
      setProgress(p);
      if (p >= 1) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  const simulatePickup = async () => {
    if (!orderId) return;
    setStatus('picked_up');
    await updateStatus(orderId, 'picked_up');
  };

  const stepIndex = status === 'paid' ? 0 : status === 'mixing' ? 1 : 2;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl * 2 }}>
        <View style={styles.confettiWrap} pointerEvents="none">
          <Confetti width={360} height={300} />
        </View>

        <View style={styles.checkWrap}>
          <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={44} color={colors.white} />
          </Animated.View>
        </View>

        <Text style={styles.h1}>{dict.order.confirmed}</Text>
        <Text style={styles.sub}>{dict.order.confirmedHint}</Text>

        <FadeInView delay={300}>
          <Card style={styles.qrCard}>
            <QRCode
              value={`vendpump://pickup/${code}`}
              size={180}
              backgroundColor={colors.white}
              color={colors.navy900}
            />
            <Text style={styles.qrHint}>{dict.order.scanQr}</Text>
            <View style={styles.codeRow}>
              {String(code ?? '').split('').map((d, i) => (
                <FadeInView key={i} delay={400 + i * 60}>
                  <Text style={styles.codeDigit}>{d}</Text>
                </FadeInView>
              ))}
            </View>
            <Text style={styles.codeLabel}>{dict.order.pickupCode}</Text>
          </Card>
        </FadeInView>

        <Card style={styles.machineCard}>
          <Ionicons name="location-outline" size={18} color={colors.blue600} />
          <View style={{ flex: 1 }}>
            <Text style={styles.machineName}>{machine?.name ?? dict.order.machine}</Text>
            <Text style={styles.machineLoc}>{machine?.location ?? ''}</Text>
          </View>
        </Card>

        {/* Mixing stage with actual ordered flavor, base, and cupSize */}
        <View style={styles.mixingWrap}>
          {status === 'mixing' ? (
            <Pulse>
              <CupView
                size={130}
                cupSize={volume}
                fill={Math.min(0.9, 0.3 + progress * 0.6)}
                flavor={cupFlavor}
                base={cupBase}
                animated
              />
            </Pulse>
          ) : status === 'ready' || status === 'picked_up' ? (
            <CupView size={130} cupSize={volume} fill={0.9} flavor={cupFlavor} base={cupBase} animated />
          ) : (
            <CupView size={130} cupSize={volume} fill={0.2} flavor={cupFlavor} base={cupBase} />
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {(['paid', 'mixing', 'ready'] as const).map((step, idx) => {
            const active = idx === stepIndex;
            const done = idx < stepIndex || status === 'picked_up';
            return (
              <View key={step} style={styles.stepItem}>
                <Pulse min={1} max={active ? 1.15 : 1}>
                  <View
                    style={[
                      styles.stepDot,
                      done && styles.stepDotDone,
                      active && !done && styles.stepDotActive,
                    ]}
                  >
                    {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                  </View>
                </Pulse>
                <Text style={[styles.stepLabel, (active || done) && { color: colors.navy900 }]}>
                  {dict.order.steps[step]}
                </Text>
              </View>
            );
          })}
        </View>

        {status === 'ready' ? (
          <Card style={styles.readyCard}>
            <Ionicons name="notifications" size={22} color={colors.success} />
            <Text style={styles.readyText}>{dict.order.ready}</Text>
          </Card>
        ) : status === 'picked_up' ? (
          <Card style={styles.readyCard}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.readyText}>{dict.order.pickedUp}</Text>
          </Card>
        ) : null}

        {status === 'ready' ? (
          <Button
            title={dict.order.simulatePickup}
            onPress={simulatePickup}
            variant="secondary"
            style={{ marginTop: spacing.lg }}
          />
        ) : null}

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button title={dict.order.orderAgain} onPress={() => router.replace('/')} icon="refresh-outline" />
          <PressableScale onPress={() => router.replace('/')} accessibilityRole="button" accessibilityLabel={dict.order.home}>
            <Text style={styles.homeLink}>{dict.order.home}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  confettiWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  checkWrap: { alignItems: 'center', justifyContent: 'center', height: 140, marginTop: spacing.lg },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
  },
  checkCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { color: colors.navy900, fontFamily: font.bold, fontSize: 24, textAlign: 'center', marginTop: spacing.lg },
  sub: { color: colors.slate500, fontFamily: font.regular, fontSize: 14, textAlign: 'center', marginTop: spacing.xs },
  qrCard: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  qrHint: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, textAlign: 'center' },
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  codeDigit: {
    color: colors.navy900,
    fontFamily: font.bold,
    fontSize: 28,
    letterSpacing: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.yellow100,
    borderRadius: radius.sm,
    minWidth: 32,
    textAlign: 'center',
  },
  codeLabel: { color: colors.slate500, fontFamily: font.medium, fontSize: 12 },
  machineCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  machineName: { color: colors.navy900, fontFamily: font.semibold, fontSize: 14 },
  machineLoc: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  mixingWrap: { alignItems: 'center', marginVertical: spacing.xl },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.md },
  stepItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.blue200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  stepDotActive: { borderColor: colors.blue500, backgroundColor: colors.blue100 },
  stepDotDone: { borderColor: colors.success, backgroundColor: colors.success },
  stepLabel: { color: colors.slate500, fontFamily: font.medium, fontSize: 12 },
  readyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  readyText: { color: colors.navy900, fontFamily: font.semibold, fontSize: 14, flex: 1 },
  homeLink: { color: colors.blue600, fontFamily: font.semibold, fontSize: 14, textAlign: 'center', paddingVertical: spacing.md },
});
