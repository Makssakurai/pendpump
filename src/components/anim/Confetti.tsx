import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { useReduceMotion } from './useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  count?: number;
  width?: number;
  height?: number;
}

interface Piece {
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: string;
}

// Falling confetti built from Animated.Views (no SVG animation).
export function Confetti({ count = 14, width = 320, height = 260 }: Props) {
  const reduce = useReduceMotion();
  const pieces = useMemo<Piece[]>(() => {
    const palette = [colors.yellow400, colors.yellow300, colors.blue400, colors.blue200];
    return Array.from({ length: count }, (_, i) => ({
      x: (i / count) * width + Math.random() * 20 - 10,
      delay: Math.random() * 250,
      duration: 1200 + Math.random() * 700,
      color: palette[i % palette.length],
      size: 6 + Math.random() * 6,
      rotate: `${Math.round(Math.random() * 360)}deg`,
    }));
  }, [count, width]);

  const values = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduce) return;
    const anims = values.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: pieces[i].duration,
        delay: pieces[i].delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USE_NATIVE,
      }),
    );
    const group = Animated.parallel(anims);
    group.start();
    return () => { group.stop(); };
  }, [pieces, reduce, values]);

  return (
    <View pointerEvents="none" style={[styles.wrap, { width, height }]}>
      {pieces.map((p, i) => {
        const translateY = values[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, height + 20],
        });
        const opacity = values[i].interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: radius.sm / 2,
              opacity,
              transform: [{ translateY }, { rotate: p.rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0 },
});
