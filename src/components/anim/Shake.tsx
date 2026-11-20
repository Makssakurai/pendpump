import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  children: React.ReactNode;
  trigger: number; // change the number to trigger a shake
  style?: StyleProp<ViewStyle>;
}

// Horizontal shake. `trigger` should change whenever you want a shake.
export function Shake({ children, trigger, style }: Props) {
  const reduce = useReduceMotion();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce || trigger === 0) return;
    const seq = Animated.sequence([
      Animated.timing(translateX, { toValue: 6, duration: 40, useNativeDriver: USE_NATIVE }),
      Animated.timing(translateX, { toValue: -6, duration: 60, useNativeDriver: USE_NATIVE }),
      Animated.timing(translateX, { toValue: 4, duration: 60, useNativeDriver: USE_NATIVE }),
      Animated.timing(translateX, { toValue: 0, duration: 60, useNativeDriver: USE_NATIVE }),
    ]);
    seq.start();
    return () => { seq.stop(); };
  }, [reduce, translateX, trigger]);

  return (
    <Animated.View style={[style, { transform: [{ translateX }] }]}>{children}</Animated.View>
  );
}
