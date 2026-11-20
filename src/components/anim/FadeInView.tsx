import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ViewStyle, StyleProp } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
}

const USE_NATIVE = Platform.OS !== 'web';

// Fade + slide in on mount. Works on web and native.
export function FadeInView({ children, delay = 0, duration = 320, offsetY = 8, style }: Props) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduce ? 0 : offsetY)).current;

  useEffect(() => {
    if (reduce) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: USE_NATIVE }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: USE_NATIVE }),
    ]).start();
  }, [delay, duration, opacity, reduce, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
