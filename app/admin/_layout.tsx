import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { colors, font, radius, spacing } from '../../src/theme';
import { useSettings } from '../../src/store/settingsStore';
import { useT } from '../../src/i18n';

export default function AdminLayout() {
  const dict = useT();
  const router = useRouter();
  const unlocked = useSettings(s => s.adminUnlocked);
  const unlock = useSettings(s => s.unlockAdmin);
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // If user logs out, the guard re-renders automatically.
    setError(false);
  }, [unlocked]);

  if (!unlocked) {
    return (
      <Screen>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <Ionicons name="lock-closed" size={28} color={colors.blue600} />
          </View>
          <Text style={styles.gateTitle}>{dict.admin.gate.title}</Text>
          <Card style={styles.gateCard}>
            <TextInput
              style={styles.input}
              placeholder={dict.admin.gate.passwordPlaceholder}
              placeholderTextColor={colors.slate500}
              secureTextEntry
              value={pass}
              onChangeText={t => { setPass(t); setError(false); }}
              onSubmitEditing={async () => {
                setChecking(true);
                const ok = await unlock(pass);
                setChecking(false);
                if (!ok) setError(true);
              }}
            />
            <Text style={styles.hint}>{dict.admin.gate.hint}</Text>
            {error ? <Text style={styles.error}>{dict.admin.gate.wrongPassword}</Text> : null}
            <Button
              title={checking ? dict.common.loading : dict.admin.gate.login}
              onPress={async () => {
                setChecking(true);
                const ok = await unlock(pass);
                setChecking(false);
                if (!ok) setError(true);
              }}
              disabled={checking}
              icon="log-in-outline"
            />
            <Button
              title={dict.admin.gate.back}
              onPress={() => router.replace('/')}
              variant="ghost"
            />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.navy900,
        headerTitleStyle: { fontFamily: font.semibold, color: colors.navy900 },
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: dict.admin.nav.dashboard }} />
      <Stack.Screen name="inventory" options={{ title: dict.admin.nav.inventory }} />
      <Stack.Screen name="orders" options={{ title: dict.admin.nav.orders }} />
      <Stack.Screen name="ingredients" options={{ title: dict.admin.nav.ingredients }} />
      <Stack.Screen name="recipes" options={{ title: dict.admin.nav.recipes }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  gateIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: { color: colors.navy900, fontFamily: font.bold, fontSize: 22 },
  gateCard: { width: '100%', maxWidth: 360, gap: spacing.md },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue100,
    paddingHorizontal: spacing.lg,
    color: colors.navy900,
    fontFamily: font.regular,
  },
  hint: { color: colors.slate500, fontFamily: font.regular, fontSize: 11 },
  error: { color: colors.danger, fontFamily: font.medium, fontSize: 12 },
});
