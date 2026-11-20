import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

// Inline header inside Screen. Used by admin and most customer screens.
export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  title: { color: colors.navy900, fontFamily: font.bold, fontSize: 24 },
  subtitle: { color: colors.slate500, fontFamily: font.regular, fontSize: 14, marginTop: 2 },
});
