import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

const USE_NATIVE = Platform.OS !== 'web';

// Spring scale-down on press. Use it for every button and card.
export function PressableScale({ children, style, scaleTo = 0.96, ...rest }: Props) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    if (!reduce) {
      Animated.spring(scale, { toValue: scaleTo, useNativeDriver: USE_NATIVE, speed: 40, bounciness: 0 }).start();
    }
    rest.onPressIn?.(e);
  };
  const onPressOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    if (!reduce) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE, speed: 40, bounciness: 6 }).start();
    }
    rest.onPressOut?.(e);
  };

  return (
    <Pressable {...rest} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
