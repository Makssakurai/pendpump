import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { useReduceMotion } from './useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

// Three dots that bounce while "thinking".
export function TypingDots() {
  const reduce = useReduceMotion();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE }),
          Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE }),
        ]),
      );
    const loops = [make(a, 0), make(b, 150), make(c, 300)];
    loops.forEach(l => l.start());
    return () => { loops.forEach(l => l.stop()); };
  }, [a, b, c, reduce]);

  const styleFor = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
  });

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, styleFor(a)]} />
      <Animated.View style={[styles.dot, styleFor(b)]} />
      <Animated.View style={[styles.dot, styleFor(c)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.blue500 },
});
