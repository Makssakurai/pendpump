import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { useReduceMotion } from './anim/useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface BarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

// Animated macro bars — plain Views animated with width %, no SVG animation.
export function MacroBar({ kcal, protein, carbs, fat }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.kcal}>{Math.round(kcal)} kcal</Text>
      <View style={styles.bars}>
        <Bar label="B" value={protein} max={50} color={colors.blue500} />
        <Bar label="W" value={carbs} max={60} color={colors.yellow400} />
        <Bar label="T" value={fat} max={20} color={colors.blue200} />
      </View>
    </View>
  );
}

function Bar({ label, value, max, color }: BarProps) {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(reduce ? value : 0)).current;

  useEffect(() => {
    if (reduce) {
      anim.setValue(value);
      return;
    }
    Animated.timing(anim, { toValue: value, duration: 400, useNativeDriver: false }).start();
  }, [anim, reduce, value]);

  const width = anim.interpolate({
    inputRange: [0, max],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={styles.barVal}>{Math.round(value)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  kcal: { color: colors.navy900, fontFamily: font.bold, fontSize: 20, marginBottom: spacing.sm },
  bars: { gap: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  barLabel: { color: colors.slate500, fontFamily: font.semibold, width: 18, fontSize: 12 },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: colors.blue50,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  fill: { height: '100%', borderRadius: radius.pill },
  barVal: {
    color: colors.navy900,
    fontFamily: font.semibold,
    width: 44,
    textAlign: 'right',
    fontSize: 12,
  },
});
