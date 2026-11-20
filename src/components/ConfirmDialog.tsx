import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Custom dialog — Alert.alert doesn't work on web.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Anuluj',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              onPress={onCancel}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? 'accent' : 'primary'}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,42,102,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.navy900, fontFamily: font.bold, fontSize: 18 },
  message: { color: colors.navy700, fontFamily: font.regular, fontSize: 14 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
