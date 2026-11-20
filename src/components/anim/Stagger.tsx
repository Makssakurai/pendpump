import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { FadeInView } from './FadeInView';

interface Props {
  children: React.ReactNode[];
  gap?: number;
  staggerMs?: number;
  style?: StyleProp<ViewStyle>;
}

// Renders children in a column with 80ms staggered fade-in.
export function Stagger({ children, gap = 8, staggerMs = 80, style }: Props) {
  return (
    <View style={[{ gap }, style]}>
      {children.map((child, i) => (
        <FadeInView key={i} delay={i * staggerMs}>
          {child}
        </FadeInView>
      ))}
    </View>
  );
}
