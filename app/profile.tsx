import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { Chip } from '../src/components/Chip';
import { Badge } from '../src/components/Badge';
import { Button } from '../src/components/Button';
import { CupView } from '../src/components/CupView';
import { Toast } from '../src/components/Toast';
import { FadeInView } from '../src/components/anim/FadeInView';
import { PressableScale } from '../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { useProfile, PASS_PLANS } from '../src/store/profileStore';
import { useOrders } from '../src/store/orderStore';
import { useCart } from '../src/store/cartStore';
import { getIngredients } from '../src/api';
import { Discipline, Ingredient, LiquidBase, PassTier } from '../src/api/types';
import { calcRecipe } from '../src/lib/pricing';
import { formatPLN } from '../src/lib/format';

const disciplines: Discipline[] = ['strength', 'crossfit', 'running', 'combat', 'weightloss'];
const bases: LiquidBase[] = ['water', 'milk', 'lactose_free'];
const tiers: PassTier[] = ['starter', 'pro', 'unlimited'];

const disciplineIcons: Record<Discipline, keyof typeof Ionicons.glyphMap> = {
  strength: 'barbell-outline',
  crossfit: 'flame-outline',
  running: 'walk-outline',
  combat: 'shield-outline',
  weightloss: 'trending-down-outline',
};

export default function ProfileScreen() {
  const dict = useT();
  const router = useRouter();
  const profile = useProfile(s => s.profile);
  const updateProfile = useProfile(s => s.updateProfile);
  const buyPass = useProfile(s => s.buyPass);
  const addGymGoal = useProfile(s => s.addGymGoal);
  const updateGoalProgress = useProfile(s => s.updateGoalProgress);
  const removeGymGoal = useProfile(s => s.removeGymGoal);

  const customPresets = useOrders(s => s.customPresets);
  const deleteCustomPreset = useOrders(s => s.deleteCustomPreset);
  const addToCart = useCart(s => s.add);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [name, setName] = useState(profile.name);
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [age, setAge] = useState(String(profile.age));

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalDiscipline, setGoalDiscipline] = useState<Discipline>('strength');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getIngredients().then(setIngredients);
  }, []);

  useEffect(() => {
    setName(profile.name);
    setWeight(String(profile.weightKg));
    setHeight(String(profile.heightCm));
    setAge(String(profile.age));
  }, [profile]);

  const saveStats = async () => {
    await updateProfile({
      name: name.trim() || 'Athlete',
      weightKg: Math.max(30, Number(weight) || 80),
      heightCm: Math.max(120, Number(height) || 175),
      age: Math.max(14, Number(age) || 20),
    });
    setToast(dict.profile.savedToast);
  };

  const handleActivatePass = async (tier: PassTier) => {
    await buyPass(tier);
    setToast(
      dict.profile.passActivated.replace('{{count}}', String(PASS_PLANS[tier].shakes)),
    );
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) return;
    await addGymGoal({
      discipline: goalDiscipline,
      title: goalTitle.trim(),
      target: goalTarget.trim() || '100%',
      progress: 15,
    });
    setGoalTitle('');
    setGoalTarget('');
    setShowGoalForm(false);
  };

  const handleShareProfile = async () => {
    const goalsSummary = profile.gymGoals
      .map(g => `• [${dict.profile.disciplines[g.discipline]}] ${g.title} (${g.target}) — ${g.progress}%`)
      .join('\n');
    const presetsSummary = customPresets
      .map(p => `🥤 ${p.name} (${p.cupSize}ml, ${dict.builder.flavors[p.flavor]})`)
      .join('\n');

    const message =
      `⚡ Vendpump Athlete Card — ${profile.name}\n` +
      `📊 ${profile.weightKg} kg · ${profile.heightCm} cm · ${profile.age} y.o.\n\n` +
      (goalsSummary ? `🎯 Gym Goals:\n${goalsSummary}\n\n` : '') +
      (presetsSummary ? `🔥 Favorite Mixes:\n${presetsSummary}\n\n` : '') +
      `Join me at Vendpump Radom!`;

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        setToast(dict.profile.shareCopied);
      } else {
        await Share.share({ message });
      }
    } catch {
      setToast(dict.profile.shareCopied);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl * 2, gap: spacing.lg }}>
        {/* Vendpump Pass Card */}
        <FadeInView>
          <LinearGradient
            colors={[colors.navy900, colors.blue600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.passCard}
          >
            <View style={styles.passHeader}>
              <View style={styles.passBadgeIcon}>
                <Ionicons name="ticket" size={22} color={colors.navy900} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.passTitle}>{dict.profile.passTitle}</Text>
                <Text style={styles.passSub}>{dict.profile.passSubtitle}</Text>
              </View>
            </View>

            <View style={styles.creditsBox}>
              <Text style={styles.creditsVal}>
                {dict.profile.creditsLeft.replace('{{count}}', String(profile.passCredits))}
              </Text>
              {profile.passTier ? (
                <Badge label={profile.passTier.toUpperCase()} tone="yellow" />
              ) : null}
            </View>

            <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
              {tiers.map(t => {
                const plan = PASS_PLANS[t];
                const isCurrent = profile.passTier === t;
                return (
                  <PressableScale
                    key={t}
                    onPress={() => handleActivatePass(t)}
                    accessibilityRole="button"
                    accessibilityLabel={dict.profile.plans[t]}
                  >
                    <View style={[styles.planRow, isCurrent && styles.planRowActive]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planName}>{dict.profile.plans[t]}</Text>
                        <Text style={styles.planMeta}>
                          {(plan.pricePLN / plan.shakes).toFixed(2)} zł / shake ({plan.discountLabel})
                        </Text>
                      </View>
                      <View style={styles.planPricePill}>
                        <Text style={styles.planPriceText}>{formatPLN(plan.pricePLN, { cents: false })}</Text>
                      </View>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </LinearGradient>
        </FadeInView>

        {/* Share Profile with Friends */}
        <Button
          title={dict.profile.shareProfile}
          onPress={handleShareProfile}
          variant="accent"
          icon="share-social-outline"
        />

        {/* Gym Goals by Discipline */}
        <Card style={{ gap: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{dict.profile.gymGoalsTitle}</Text>
            <PressableScale
              onPress={() => setShowGoalForm(v => !v)}
              accessibilityRole="button"
              accessibilityLabel={dict.profile.addGoal}
              style={styles.smallAddBtn}
            >
              <Ionicons name={showGoalForm ? 'close' : 'add'} size={18} color={colors.white} />
              <Text style={styles.smallAddText}>{dict.profile.addGoal}</Text>
            </PressableScale>
          </View>

          {showGoalForm ? (
            <View style={styles.goalForm}>
              <View style={styles.chips}>
                {disciplines.map(d => (
                  <Chip
                    key={d}
                    label={dict.profile.disciplines[d]}
                    active={goalDiscipline === d}
                    onPress={() => setGoalDiscipline(d)}
                  />
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder={dict.profile.goalTitlePlaceholder}
                placeholderTextColor={colors.slate500}
                value={goalTitle}
                onChangeText={setGoalTitle}
              />
              <TextInput
                style={styles.input}
                placeholder={dict.profile.goalTargetPlaceholder}
                placeholderTextColor={colors.slate500}
                value={goalTarget}
                onChangeText={setGoalTarget}
              />
              <Button title={dict.common.save} onPress={handleCreateGoal} icon="checkmark" />
            </View>
          ) : null}

          {profile.gymGoals.map(g => (
            <View key={g.id} style={styles.goalItem}>
              <View style={styles.goalTop}>
                <View style={styles.discBadge}>
                  <Ionicons name={disciplineIcons[g.discipline]} size={14} color={colors.blue600} />
                  <Text style={styles.discText}>{dict.profile.disciplines[g.discipline]}</Text>
                </View>
                <PressableScale
                  onPress={() => removeGymGoal(g.id)}
                  accessibilityRole="button"
                  accessibilityLabel={dict.common.delete}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </PressableScale>
              </View>
              <Text style={styles.goalTitle}>{g.title}</Text>
              <Text style={styles.goalTarget}>{g.target} · {g.progress}%</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${g.progress}%` }]} />
              </View>
              <View style={styles.progressControls}>
                <PressableScale
                  onPress={() => updateGoalProgress(g.id, g.progress - 10)}
                  style={styles.stepMini}
                >
                  <Text style={styles.stepMiniTxt}>-10%</Text>
                </PressableScale>
                <PressableScale
                  onPress={() => updateGoalProgress(g.id, g.progress + 10)}
                  style={styles.stepMini}
                >
                  <Text style={styles.stepMiniTxt}>+10%</Text>
                </PressableScale>
              </View>
            </View>
          ))}
        </Card>

        {/* My Saved Presets */}
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>{dict.profile.myPresetsTitle}</Text>
          {customPresets.length === 0 ? (
            <Text style={styles.emptyText}>{dict.profile.noPresets}</Text>
          ) : (
            customPresets.map(r => {
              const totals = calcRecipe(r, ingredients);
              return (
                <View key={r.id} style={styles.presetRow}>
                  <CupView
                    size={50}
                    cupSize={r.cupSize}
                    fill={0.7}
                    flavor={r.flavor}
                    base={r.base ?? 'water'}
                    animated={false}
                  />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.presetName}>{r.name}</Text>
                    <Text style={styles.presetMeta}>
                      {r.cupSize} ml · {dict.builder.bases[r.base ?? 'water']} · {dict.builder.flavors[r.flavor]}
                    </Text>
                    <Text style={styles.presetPrice}>{formatPLN(totals.price)} · {totals.kcal} kcal</Text>
                  </View>
                  <PressableScale
                    onPress={() => {
                      addToCart(r, totals.price);
                      router.push('/cart');
                    }}
                    style={styles.orderMiniBtn}
                  >
                    <Ionicons name="bag-add-outline" size={18} color={colors.white} />
                  </PressableScale>
                  <PressableScale
                    onPress={() => deleteCustomPreset(r.id)}
                    style={styles.delMiniBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </PressableScale>
                </View>
              );
            })
          )}
        </Card>

        {/* Personal Stats & Default Base */}
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>{dict.profile.personalData}</Text>
          <View>
            <Text style={styles.label}>{dict.profile.name}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>
          <View style={styles.statsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{dict.profile.weight}</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{dict.profile.height}</Text>
              <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{dict.profile.age}</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.label}>{dict.profile.defaultBase}</Text>
          <View style={styles.chips}>
            {bases.map(b => (
              <Chip
                key={b}
                label={dict.builder.bases[b]}
                active={profile.preferredBase === b}
                onPress={() => updateProfile({ preferredBase: b })}
              />
            ))}
          </View>

          <Button title={dict.common.save} onPress={saveStats} variant="secondary" icon="checkmark-circle-outline" />
        </Card>
      </ScrollView>
      <Toast message={toast} onHide={() => setToast(null)} tone="success" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  passCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  passBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.yellow400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passTitle: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 18,
  },
  passSub: {
    color: colors.blue100,
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 2,
  },
  creditsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  creditsVal: {
    color: colors.yellow400,
    fontFamily: font.bold,
    fontSize: 15,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  planRowActive: {
    borderColor: colors.yellow400,
    backgroundColor: 'rgba(255,200,61,0.16)',
  },
  planName: {
    color: colors.white,
    fontFamily: font.semibold,
    fontSize: 14,
  },
  planMeta: {
    color: colors.blue100,
    fontFamily: font.regular,
    fontSize: 11,
    marginTop: 2,
  },
  planPricePill: {
    backgroundColor: colors.yellow400,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  planPriceText: {
    color: colors.navy900,
    fontFamily: font.bold,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.navy900,
    fontFamily: font.bold,
    fontSize: 17,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.blue500,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  smallAddText: {
    color: colors.white,
    fontFamily: font.semibold,
    fontSize: 12,
  },
  goalForm: {
    backgroundColor: colors.blue50,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  goalItem: {
    backgroundColor: colors.blue50,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  goalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.blue100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  discText: {
    color: colors.blue600,
    fontFamily: font.semibold,
    fontSize: 11,
  },
  goalTitle: {
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 15,
    marginTop: 2,
  },
  goalTarget: {
    color: colors.slate500,
    fontFamily: font.medium,
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
  },
  progressControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  stepMini: {
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.blue200,
  },
  stepMiniTxt: {
    color: colors.navy700,
    fontFamily: font.semibold,
    fontSize: 11,
  },
  emptyText: {
    color: colors.slate500,
    fontFamily: font.regular,
    fontSize: 13,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue50,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  presetName: {
    color: colors.navy900,
    fontFamily: font.semibold,
    fontSize: 14,
  },
  presetMeta: {
    color: colors.slate500,
    fontFamily: font.regular,
    fontSize: 11,
    marginTop: 2,
  },
  presetPrice: {
    color: colors.blue600,
    fontFamily: font.bold,
    fontSize: 13,
    marginTop: 2,
  },
  orderMiniBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  delMiniBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.slate500,
    fontFamily: font.medium,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue100,
    paddingHorizontal: spacing.md,
    color: colors.navy900,
    fontFamily: font.regular,
    backgroundColor: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});