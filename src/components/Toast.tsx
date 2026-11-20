import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { useReduceMotion } from './anim/useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  message: string | null;
  tone?: 'info' | 'success' | 'danger';
  onHide?: () => void;
  duration?: number;
}

// Minimal toast. Show by setting a non-null message from the caller.
export function Toast({ message, tone = 'info', onHide, duration = 2200 }: Props) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: USE_NATIVE }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: USE_NATIVE }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: USE_NATIVE }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: USE_NATIVE }),
      ]).start(() => onHide?.());
    }, duration);
    return () => clearTimeout(t);
  }, [duration, message, onHide, opacity, reduce, translateY]);

  if (!message) return null;

  const bg =
    tone === 'success' ? colors.success :
    tone === 'danger' ? colors.danger :
    colors.blue600;
  const icon =
    tone === 'success' ? 'checkmark-circle' :
    tone === 'danger' ? 'alert-circle' :
    'information-circle';

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity, transform: [{ translateY }], backgroundColor: bg }]}
    >
      <Ionicons name={icon} size={18} color={colors.white} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    zIndex: 100,
  },
  text: { color: colors.white, fontFamily: font.semibold, fontSize: 14, flex: 1 },
});
