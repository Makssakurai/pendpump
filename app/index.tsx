import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../src/components/Card';
import { Badge } from '../src/components/Badge';
import { CupView } from '../src/components/CupView';
import { PressableScale } from '../src/components/anim/PressableScale';
import { FadeInView } from '../src/components/anim/FadeInView';
import { Stagger } from '../src/components/anim/Stagger';
import { Pulse } from '../src/components/anim/Pulse';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { useSettings } from '../src/store/settingsStore';
import { useOrders } from '../src/store/orderStore';
import { useCart, cartCount } from '../src/store/cartStore';
import { useProfile } from '../src/store/profileStore';
import { getIngredients, getMachines, getPresetRecipes } from '../src/api';
import { Ingredient, Machine, Recipe, Goal } from '../src/api/types';
import { calcRecipe } from '../src/lib/pricing';
import { formatPLN } from '../src/lib/format';

const goalIcons: Record<Goal, keyof typeof Ionicons.glyphMap> = {
  masa: 'barbell-outline',
  redukcja: 'flame-outline',
  wytrzymalosc: 'flash-outline',
  regeneracja: 'leaf-outline',
  custom: 'options-outline',
};

export default function Welcome() {
  const dict = useT();
  const router = useRouter();
  const lang = useSettings(s => s.lang);
  const setLanguage = useSettings(s => s.setLanguage);
  const profile = useProfile(s => s.profile);
  const favourites = useOrders(s => s.favourites);
  const customPresets = useOrders(s => s.customPresets);
  const toggleFavourite = useOrders(s => s.toggleFavourite);
  const items = useCart(s => s.items);
  const addToCart = useCart(s => s.add);
  const count = cartCount(items);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [presets, setPresets] = useState<Recipe[]>([]);
  const [nearestMachine, setNearestMachine] = useState<Machine | null>(null);

  useEffect(() => {
    (async () => {
      const [i, p, m] = await Promise.all([
        getIngredients(),
        getPresetRecipes(),
        getMachines(),
      ]);
      setIngredients(i);
      setPresets(p);
      setNearestMachine(m[0] ?? null);
    })();
  }, []);

  const goals: Goal[] = ['masa', 'redukcja', 'wytrzymalosc', 'regeneracja', 'custom'];

  const cycleLanguage = () => {
    const next = lang === 'pl' ? 'en' : lang === 'en' ? 'ru' : 'pl';
    setLanguage(next);
  };

  const addFavourite = async (r: Recipe) => {
    await toggleFavourite(r);
  };
  const isFav = (id: string) => favourites.some(r => r.id === id);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Enriched Decorative Hero */}
      <LinearGradient
        colors={[colors.navy900, colors.blue600, colors.blue500]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Decorative background rings */}
        <View style={styles.decorOrbTop} pointerEvents="none" />
        <View style={styles.decorOrbBottom} pointerEvents="none" />

        {/* Top bar */}
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.wordmark}>Vendpump</Text>
            <Text style={styles.greetingSub}>
              {dict.welcome.greeting.replace('{{name}}', profile.name || 'Athlete')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <PressableScale
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel={dict.welcome.profile}
              style={styles.iconBtn}
            >
              <Ionicons name="person-outline" size={19} color={colors.white} />
            </PressableScale>
            <PressableScale
              onPress={cycleLanguage}
              accessibilityRole="button"
              accessibilityLabel={dict.welcome.language}
              style={styles.iconBtn}
            >
              <Text style={styles.iconBtnText}>{lang.toUpperCase()}</Text>
            </PressableScale>
            <PressableScale
              onPress={() => router.push('/cart')}
              accessibilityRole="button"
              accessibilityLabel={dict.cart.title}
              style={styles.iconBtn}
            >
              <Ionicons name="bag-outline" size={20} color={colors.white} />
              {count > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{count}</Text>
                </View>
              ) : null}
            </PressableScale>
          </View>
        </View>

        {/* Live machine status bar */}
        {nearestMachine ? (
          <View style={styles.machinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.machinePillText} numberOfLines={1}>
              {nearestMachine.name} ·{' '}
              {dict.welcome.nearestMachine.replace(
                '{{km}}',
                String(nearestMachine.distanceKm),
              )}
            </Text>
            <View style={styles.onlineTag}>
              <Text style={styles.onlineTagText}>{dict.welcome.online}</Text>
            </View>
          </View>
        ) : null}

        {/* Hero Showcase Card with floating badges + animated CupView */}
        <View style={styles.heroShowcase}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={styles.tagline}>{dict.tagline}</Text>
            <View style={styles.macroPillRow}>
              <View style={styles.heroMiniTag}>
                <Ionicons name="flash" size={12} color={colors.yellow400} />
                <Text style={styles.heroMiniTagText}>45s mix</Text>
              </View>
              <View style={styles.heroMiniTag}>
                <Ionicons name="nutrition" size={12} color={colors.yellow400} />
                <Text style={styles.heroMiniTagText}>40g+ protein</Text>
              </View>
            </View>
          </View>

          <View style={styles.cupHalo}>
            <Pulse>
              <CupView size={92} cupSize={400} fill={0.65} flavor="czekolada" base="milk" animated />
            </Pulse>
          </View>
        </View>

        {/* Vendpump Pass quick banner inside hero */}
        <PressableScale
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel={dict.welcome.passBannerTitle}
        >
          <View style={styles.passStrip}>
            <View style={styles.passIconBox}>
              <Ionicons name="ticket" size={18} color={colors.navy900} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passStripTitle}>{dict.welcome.passBannerTitle}</Text>
              <Text style={styles.passStripSub}>
                {profile.passCredits > 0
                  ? dict.welcome.passBannerCredits.replace('{{count}}', String(profile.passCredits))
                  : dict.welcome.passBannerEmpty}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.yellow400} />
          </View>
        </PressableScale>
      </LinearGradient>

      <View style={{ padding: spacing.xl, gap: spacing.xl }}>
        {/* My Saved Presets (if user saved custom presets) */}
        {customPresets.length > 0 ? (
          <View>
            <Text style={styles.h2}>{dict.welcome.myPresets}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.md }}
            >
              {customPresets.map(r => {
                const totals = calcRecipe(r, ingredients);
                return (
                  <FadeInView key={r.id}>
                    <Card style={[styles.presetCard, styles.myPresetCard]}>
                      <View style={styles.presetTop}>
                        <CupView
                          size={58}
                          cupSize={r.cupSize}
                          fill={Math.min(1, r.ingredients.reduce((s, x) => s + x.amount, 0) / 60)}
                          flavor={r.flavor}
                          base={r.base ?? 'water'}
                        />
                        <Badge label={dict.builder.bases[r.base ?? 'water']} tone="blue" />
                      </View>
                      <Text style={styles.presetName} numberOfLines={1}>{r.name}</Text>
                      <Text style={styles.presetSub}>
                        {r.cupSize} ml · {dict.builder.flavors[r.flavor]}
                      </Text>
                      <View style={styles.presetBottom}>
                        <Badge label={`${totals.kcal} kcal`} tone="yellow" />
                        <Text style={styles.presetPrice}>{formatPLN(totals.price)}</Text>
                      </View>
                      <PressableScale
                        onPress={() => {
                          addToCart(r, totals.price);
                          router.push('/cart');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={dict.builder.addToCart}
                        style={styles.presetAdd}
                      >
                        <Ionicons name="add" size={18} color={colors.white} />
                        <Text style={styles.presetAddText}>{dict.builder.addToCart}</Text>
                      </PressableScale>
                    </Card>
                  </FadeInView>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Goals */}
        <View>
          <Text style={styles.h2}>{dict.welcome.subtitle}</Text>
          <Stagger>
            {goals.map(g => (
              <PressableScale
                key={g}
                onPress={() => router.push({ pathname: '/builder', params: { goal: g } })}
                accessibilityRole="button"
                accessibilityLabel={dict.goals[g]}
              >
                <Card style={styles.goalCard}>
                  <View style={styles.goalIcon}>
                    <Ionicons name={goalIcons[g]} size={22} color={colors.blue600} />
                  </View>
                  <Text style={styles.goalLabel}>{dict.goals[g]}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.slate500} />
                </Card>
              </PressableScale>
            ))}
          </Stagger>
        </View>

        {/* Assistant CTA */}
        <PressableScale
          onPress={() => router.push('/assistant')}
          accessibilityRole="button"
          accessibilityLabel={dict.welcome.openAssistant}
        >
          <LinearGradient
            colors={[colors.blue100, colors.blue50]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCard}
          >
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={22} color={colors.blue600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>{dict.welcome.openAssistant}</Text>
              <Text style={styles.aiHint}>{dict.welcome.aiHint}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.blue600} />
          </LinearGradient>
        </PressableScale>

        {/* Popular presets */}
        <View>
          <Text style={styles.h2}>{dict.welcome.popularShakes}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.md }}
          >
            {presets.map(r => {
              const totals = calcRecipe(r, ingredients);
              const fav = isFav(r.id);
              return (
                <FadeInView key={r.id}>
                  <Card style={styles.presetCard}>
                    <View style={styles.presetTop}>
                      <CupView
                        size={60}
                        cupSize={r.cupSize}
                        fill={Math.min(1, r.ingredients.reduce((s, x) => s + x.amount, 0) / 60)}
                        flavor={r.flavor}
                        base={r.base ?? 'water'}
                      />
                      <PressableScale
                        onPress={() => addFavourite(r)}
                        accessibilityRole="button"
                        accessibilityLabel={fav ? dict.builder.removeFromFavourites : dict.builder.addToFavourites}
                        style={styles.heartBtn}
                      >
                        <Ionicons
                          name={fav ? 'heart' : 'heart-outline'}
                          size={20}
                          color={fav ? colors.yellow400 : colors.slate500}
                        />
                      </PressableScale>
                    </View>
                    <Text style={styles.presetName} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.presetSub}>
                      {r.cupSize} ml · {dict.builder.bases[r.base ?? 'water']} · {dict.builder.flavors[r.flavor]}
                    </Text>
                    <View style={styles.presetBottom}>
                      <Badge label={`${totals.kcal} kcal`} tone="yellow" />
                      <Text style={styles.presetPrice}>{formatPLN(totals.price)}</Text>
                    </View>
                    <PressableScale
                      onPress={() => { addToCart(r, totals.price); router.push('/cart'); }}
                      accessibilityRole="button"
                      accessibilityLabel={dict.builder.addToCart}
                      style={styles.presetAdd}
                    >
                      <Ionicons name="add" size={18} color={colors.white} />
                      <Text style={styles.presetAddText}>{dict.builder.addToCart}</Text>
                    </PressableScale>
                  </Card>
                </FadeInView>
              );
            })}
          </ScrollView>
        </View>

        {/* Quick links */}
        <Stagger staggerMs={60}>
          <QuickLink
            icon="person-circle-outline"
            label={dict.welcome.profile}
            onPress={() => router.push('/profile')}
          />
          <QuickLink
            icon="heart-outline"
            label={dict.welcome.favourites}
            onPress={() => router.push('/favourites')}
          />
          <QuickLink
            icon="time-outline"
            label={dict.welcome.history}
            onPress={() => router.push('/history')}
          />
          <QuickLink
            icon="settings-outline"
            label={dict.welcome.admin}
            onPress={() => router.push('/admin')}
          />
        </Stagger>
      </View>
    </ScrollView>
  );
}

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Card style={styles.quickRow}>
        <View style={styles.quickIcon}>
          <Ionicons name={icon} size={20} color={colors.blue600} />
        </View>
        <Text style={styles.quickLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.slate500} />
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.lg * 1.5,
    borderBottomRightRadius: radius.lg * 1.5,
    gap: spacing.md,
    overflow: 'hidden',
  },
  decorOrbTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
  },
  decorOrbBottom: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordmark: {
    color: colors.yellow400,
    fontFamily: font.bold,
    fontSize: 28,
    letterSpacing: 0.5,
  },
  greetingSub: {
    color: colors.blue100,
    fontFamily: font.medium,
    fontSize: 13,
    marginTop: 1,
  },
  iconBtn: {
    minWidth: 42,
    minHeight: 42,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  iconBtnText: {
    color: colors.white,
    fontFamily: font.semibold,
    fontSize: 13,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.yellow400,
    borderRadius: radius.pill,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: colors.navy900,
    fontFamily: font.bold,
    fontSize: 11,
  },
  machinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(15, 42, 102, 0.45)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  machinePillText: {
    flex: 1,
    color: colors.white,
    fontFamily: font.medium,
    fontSize: 12,
  },
  onlineTag: {
    backgroundColor: 'rgba(47, 182, 124, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  onlineTagText: {
    color: colors.white,
    fontFamily: font.semibold,
    fontSize: 10,
  },
  heroShowcase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tagline: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  macroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,42,102,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  heroMiniTagText: {
    color: colors.white,
    fontFamily: font.semibold,
    fontSize: 11,
  },
  cupHalo: {
    width: 108,
    height: 118,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(15, 42, 102, 0.65)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.35)',
  },
  passIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.yellow400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passStripTitle: {
    color: colors.yellow400,
    fontFamily: font.bold,
    fontSize: 13,
  },
  passStripSub: {
    color: colors.white,
    fontFamily: font.regular,
    fontSize: 11,
    opacity: 0.9,
  },
  h2: {
    color: colors.navy900,
    fontFamily: font.bold,
    fontSize: 20,
    marginBottom: spacing.md,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: {
    flex: 1,
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 16,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.blue200,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 16,
  },
  aiHint: {
    color: colors.navy700,
    fontFamily: font.regular,
    fontSize: 13,
    marginTop: 2,
  },
  presetCard: {
    width: 240,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  myPresetCard: {
    borderColor: colors.blue400,
    borderWidth: 1.5,
  },
  presetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heartBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetName: {
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 16,
  },
  presetSub: {
    color: colors.slate500,
    fontFamily: font.regular,
    fontSize: 12,
  },
  presetBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  presetPrice: {
    color: colors.navy900,
    fontFamily: font.bold,
    fontSize: 16,
  },
  presetAdd: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.blue500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  presetAddText: {
    color: colors.white,
    fontFamily: font.semibold,
    fontSize: 13,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    flex: 1,
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 15,
  },
});