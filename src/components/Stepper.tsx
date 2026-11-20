import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { PressableScale } from './anim/PressableScale';
import { useReduceMotion } from './anim/useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  onMaxReached?: () => void;
}

// Pill stepper with round − / +. Value pops on change. Never exceeds [min,max].
export function Stepper({
  label,
  value,
  min = 0,
  max = 100,
  step = 5,
  unit = 'g',
  onChange,
  onMaxReached,
}: Props) {
  const reduce = useReduceMotion();
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduce) return;
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.1, duration: 120, useNativeDriver: USE_NATIVE }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: USE_NATIVE, speed: 30, bounciness: 6 }),
    ]).start();
  }, [pop, reduce, value]);

  const atMax = value >= max;

  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => {
    if (value >= max) {
      onMaxReached?.();
      return;
    }
    onChange(Math.min(max, value + step));
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <PressableScale
          onPress={dec}
          accessibilityRole="button"
          accessibilityLabel={`${label} minus`}
          style={styles.btn}
        >
          <Ionicons name="remove" size={20} color={colors.blue600} />
        </PressableScale>
        <Animated.View style={{ transform: [{ scale: pop }], minWidth: 76 }}>
          <Text style={styles.value}>
            {value} {unit}
          </Text>
        </Animated.View>
        <PressableScale
          onPress={inc}
          accessibilityRole="button"
          accessibilityLabel={`${label} plus`}
          style={[styles.btn, atMax && { backgroundColor: colors.yellow100 }]}
        >
          <Ionicons name="add" size={20} color={colors.blue600} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  label: { color: colors.navy900, fontFamily: font.medium, fontSize: 15, flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  value: {
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 15,
    textAlign: 'center',
  },
});
