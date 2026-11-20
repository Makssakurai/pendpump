import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';
import { useReduceMotion } from './anim/useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radiusPx?: number;
  style?: StyleProp<ViewStyle>;
}

// Simple shimmer placeholder. Use while a screen loads its data.
export function Skeleton({ width = '100%', height = 16, radiusPx = radius.sm, style }: Props) {
  const reduce = useReduceMotion();
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.9, duration: 600, useNativeDriver: USE_NATIVE }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 600, useNativeDriver: USE_NATIVE }),
      ]),
    );
    loop.start();
    return () => { loop.stop(); };
  }, [reduce, shimmer]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.blue100,
          borderRadius: radiusPx,
          opacity: shimmer,
        },
        style,
      ]}
    />
  );
}
