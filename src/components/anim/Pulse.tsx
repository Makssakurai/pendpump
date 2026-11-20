import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ViewStyle, StyleProp } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  children: React.ReactNode;
  min?: number;
  max?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

// Gentle scale pulse, used by the active mixing step.
export function Pulse({ children, min = 0.96, max = 1.04, duration = 900, style }: Props) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduce) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: max, duration, useNativeDriver: USE_NATIVE }),
        Animated.timing(scale, { toValue: min, duration, useNativeDriver: USE_NATIVE }),
      ]),
    );
    loop.start();
    return () => { loop.stop(); };
  }, [duration, max, min, reduce, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
  );
}
