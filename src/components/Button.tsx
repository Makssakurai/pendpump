import React from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { PressableScale } from './anim/PressableScale';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// Big touch-friendly button. Primary is a blue gradient; accent is yellow with
// navy text (only use yellow sparingly).
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  accessibilityLabel,
}: Props) {
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={variant === 'primary' ? colors.white : variant === 'accent' ? colors.navy900 : colors.navy900}
          style={{ marginRight: spacing.sm }}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          variant === 'primary' && { color: colors.white },
          variant === 'secondary' && { color: colors.navy900 },
          variant === 'accent' && { color: colors.navy900 },
          variant === 'ghost' && { color: colors.blue600 },
        ]}
      >
        {title}
      </Text>
    </>
  );

  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.blue500, colors.blue600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          {content}
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={[
            variant === 'accent' ? colors.yellow400 : variant === 'secondary' ? colors.white : 'transparent',
            variant === 'accent' ? colors.yellow300 : variant === 'secondary' ? colors.blue50 : 'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            variant === 'secondary' && styles.outline,
            variant === 'ghost' && { backgroundColor: 'transparent' },
          ]}
        >
          {content}
        </LinearGradient>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outline: { borderWidth: 1, borderColor: colors.blue200 },
  text: { fontFamily: font.semibold, fontSize: 16 },
});
