import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing } from '../src/theme';
import { useOrders } from '../src/store/orderStore';
import { useSettings } from '../src/store/settingsStore';
import { useProfile } from '../src/store/profileStore';
import { useT } from '../src/i18n';

export default function RootLayout() {
  const dict = useT();
  const loadPersisted = useOrders(s => s.loadPersisted);
  const loadProfile = useProfile(s => s.loadProfile);
  const hydrate = useSettings(s => s.hydrate);
  const hydrated = useSettings(s => s.hydrated);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    ...Ionicons.font,
  });

  const boot = useCallback(async () => {
    await Promise.all([hydrate(), loadPersisted(), loadProfile()]);
  }, [hydrate, loadPersisted, loadProfile]);

  useEffect(() => { boot(); }, [boot]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>Vendpump</Text>
        <Text style={styles.splashTagline}>{dict.tagline}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: dict.profile.title }} />
        <Stack.Screen name="builder" options={{ title: dict.builder.title }} />
        <Stack.Screen name="assistant" options={{ title: dict.assistant.title }} />
        <Stack.Screen name="cart" options={{ title: dict.cart.title }} />
        <Stack.Screen name="payment" options={{ title: dict.payment.title }} />
        <Stack.Screen
          name="order-confirmed"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen name="favourites" options={{ title: dict.favourites.title }} />
        <Stack.Screen name="history" options={{ title: dict.history.title }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  splashLogo: {
    color: colors.yellow400,
    fontFamily: font.bold,
    fontSize: 36,
    letterSpacing: 1,
  },
  splashTagline: {
    color: colors.white,
    fontFamily: font.medium,
    fontSize: 14,
    opacity: 0.9,
  },
});
