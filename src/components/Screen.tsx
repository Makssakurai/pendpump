import React from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;      // default true
  wide?: boolean;        // admin pages can use up to 960px
  padded?: boolean;      // default true
  background?: string;
  contentStyle?: ViewStyle;
}

// Phone-sized column on web, full width on native.
// When `scroll=false`, the inner content is flex:1 so a FlatList can fill it (A2 fix).
export function Screen({
  children,
  scroll = true,
  wide = false,
  padded = true,
  background,
  contentStyle,
}: Props) {
  const maxWidth = wide ? 960 : 430;

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[
        padded && { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        { flex: 1 },
        padded && { padding: spacing.xl },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, background ? { backgroundColor: background } : null]}>
      <View style={[styles.column, { maxWidth }]}>{inner}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web'
      ? ({
          // subtle pastel frame so the phone column stands out on a projector
          boxShadow: '0 0 40px rgba(42,91,215,0.06)',
          borderRadius: radius.lg,
          overflow: 'hidden',
        } as object)
      : {}),
  },
});
