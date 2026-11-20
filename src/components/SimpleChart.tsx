import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { useReduceMotion } from './anim/useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Bar {
  label: string;
  value: number;
}

interface Props {
  data: Bar[];
  unit?: string;
  color?: string;
}

// Horizontal bar chart: bars grow from 0, staggered, and are animated by width%.
export function SimpleChart({ data, unit = '', color = colors.blue500 }: Props) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <View style={styles.wrap}>
      {data.length === 0 ? (
        <Text style={styles.empty}>—</Text>
      ) : (
        data.map((d, i) => (
          <ChartBar
            key={`${d.label}-${i}`}
            label={d.label}
            value={d.value}
            max={max}
            unit={unit}
            color={color}
            delay={i * 60}
          />
        ))
      )}
    </View>
  );
}

function ChartBar({
  label,
  value,
  max,
  unit,
  color,
  delay,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  delay: number;
}) {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(reduce ? value : 0)).current;

  useEffect(() => {
    if (reduce) {
      anim.setValue(value);
      return;
    }
    Animated.timing(anim, {
      toValue: value,
      duration: 500,
      delay,
      useNativeDriver: false,
    }).start();
  }, [anim, delay, reduce, value]);

  const width = anim.interpolate({
    inputRange: [0, max],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={styles.val}>
        {Math.round(value)}
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  empty: { color: colors.slate500, fontFamily: font.regular, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  label: { color: colors.slate500, fontFamily: font.medium, width: 110, fontSize: 12 },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.blue50,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  fill: { height: '100%', borderRadius: radius.pill },
  val: {
    color: colors.navy900,
    fontFamily: font.semibold,
    width: 56,
    textAlign: 'right',
    fontSize: 12,
  },
});
