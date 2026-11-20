import React from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { PressableScale } from './anim/PressableScale';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// Pastel pill chip used for cup size, flavor, goals.
export function Chip({ label, active, onPress, style }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.chip,
        active ? styles.active : styles.inactive,
        style,
      ]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inactive: { backgroundColor: colors.blue50, borderColor: colors.blue100 },
  active: { backgroundColor: colors.blue500, borderColor: colors.blue600 },
  text: { fontFamily: font.medium, fontSize: 14 },
  textInactive: { color: colors.navy700 },
  textActive: { color: colors.white, fontFamily: font.semibold },
});
