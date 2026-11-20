import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  label: string;
  tone?: 'blue' | 'yellow' | 'success' | 'danger';
}

// Tiny pill label. Yellow variant is the "popul" tag / price badge.
export function Badge({ label, tone = 'blue' }: Props) {
  return (
    <View
      style={[
        styles.base,
        tone === 'blue' && { backgroundColor: colors.blue100 },
        tone === 'yellow' && { backgroundColor: colors.yellow100 },
        tone === 'success' && { backgroundColor: '#E1F6EC' },
        tone === 'danger' && { backgroundColor: '#FCE4E5' },
      ]}
    >
      <Text
        style={[
          styles.text,
          tone === 'blue' && { color: colors.blue600 },
          tone === 'yellow' && { color: colors.navy900 },
          tone === 'success' && { color: colors.success },
          tone === 'danger' && { color: colors.danger },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  text: { fontFamily: font.semibold, fontSize: 12 },
});
