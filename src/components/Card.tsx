import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

// White card with 1px pastel border and soft blue shadow.
export function Card({ children, style, padding = spacing.lg }: Props) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.blue100,
    ...(shadow as object),
  },
});
