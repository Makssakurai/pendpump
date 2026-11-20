import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Text, TextProps } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface Props extends Omit<TextProps, 'children'> {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
}

const USE_NATIVE = Platform.OS !== 'web';

// Tweens a displayed number. Keeps text native (no SVG animation).
export function AnimatedNumber({
  value,
  duration = 500,
  formatter = n => String(Math.round(n)),
  ...textProps
}: Props) {
  const reduce = useReduceMotion();
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const anim = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    if (reduce) {
      from.current = value;
      setDisplay(value);
      return;
    }
    const start = from.current;
    const id = anim.addListener(({ value: v }) => {
      // v holds the tween value; compute display value in range
      setDisplay(start + (value - start) * v);
    });
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE,
    }).start(() => {
      from.current = value;
      setDisplay(value);
    });
    return () => {
      anim.removeListener(id);
    };
  }, [anim, duration, reduce, value]);

  return <Text {...textProps}>{formatter(display)}</Text>;
}
