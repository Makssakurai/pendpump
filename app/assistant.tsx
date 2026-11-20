import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Chip } from '../src/components/Chip';
import { CupView } from '../src/components/CupView';
import { FadeInView } from '../src/components/anim/FadeInView';
import { TypingDots } from '../src/components/anim/TypingDots';
import { PressableScale } from '../src/components/anim/PressableScale';
import { colors, font, radius, spacing } from '../src/theme';
import { useT } from '../src/i18n';
import { getIngredients, getRecommendation } from '../src/api';
import { Ingredient, Recipe } from '../src/api/types';
import { useCart } from '../src/store/cartStore';
import { calcRecipe } from '../src/lib/pricing';
import { formatPLN } from '../src/lib/format';

interface Msg {
  id: string;
  from: 'user' | 'bot';
  text: string;
  recipe?: Recipe;
  reason?: string;
}

const quickKeys = ['masa', 'redukcja', 'wytrzymalosc', 'regeneracja'] as const;

export default function Assistant() {
  const dict = useT();
  const router = useRouter();
  const addToCart = useCart(s => s.add);
  const listRef = useRef<FlatList<Msg>>(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'w', from: 'bot', text: dict.assistant.welcome },
  ]);

  React.useEffect(() => { getIngredients().then(setIngredients); }, []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, from: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Parse weight (kg / кг) and trainings per week (x / razy / times / раз)
    const weightMatch = trimmed.match(/(\d{2,3})\s*(kg|кг)/i);
    const weight = weightMatch ? Number(weightMatch[1]) : undefined;
    const trainingMatch = trimmed.match(/(\d)\s*(x|razy|raz|times|раз|раза)/i);
    const trainingPerWeek = trainingMatch ? Number(trainingMatch[1]) : undefined;

    const rec = await getRecommendation({ goal: trimmed, weight, trainingPerWeek });
    // "Why this shake?" line, built from the dictionary so it follows the language
    const reasonBits = [
      dict.assistant.reason.goal.replace('{{goal}}', dict.goals[rec.goal].toLowerCase()),
    ];
    if (rec.weight && rec.proteinTarget) {
      reasonBits.push(
        dict.assistant.reason.weight
          .replace('{{kg}}', String(rec.weight))
          .replace('{{g}}', String(rec.proteinTarget)),
      );
    }
    if (rec.trainingPerWeek) {
      reasonBits.push(dict.assistant.reason.training.replace('{{n}}', String(rec.trainingPerWeek)));
    }
    // fake delay so typing indicator is visible
    await new Promise(r => setTimeout(r, 600));
    const botMsg: Msg = {
      id: `b-${Date.now()}`,
      from: 'bot',
      text: dict.assistant.whyThis,
      recipe: rec.recipe,
      reason: reasonBits.join(' · '),
    };
    setMessages(prev => [...prev, botMsg]);
    setTyping(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingBottom: spacing.md, gap: spacing.sm }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <FadeInView>
              <View style={[styles.bubble, item.from === 'user' ? styles.user : styles.bot]}>
                {item.from === 'bot' && item.recipe ? (
                  <View>
                    <View style={styles.recRow}>
                      <CupView
                        size={64}
                        fill={Math.min(1, item.recipe.ingredients.reduce((s, x) => s + x.amount, 0) / 70)}
                        flavor={item.recipe.flavor}
                      />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={styles.recName}>{item.recipe.name}</Text>
                        <Text style={styles.recSub}>
                          {item.recipe.cupSize} ml · {dict.builder.flavors[item.recipe.flavor]}
                        </Text>
                        <Text style={styles.recPrice}>
                          {formatPLN(calcRecipe(item.recipe, ingredients).price)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.reason}>{item.reason}</Text>
                    <Button
                      title={dict.assistant.addRecommended}
                      onPress={() => {
                        addToCart(item.recipe!, calcRecipe(item.recipe!, ingredients).price);
                        router.push('/cart');
                      }}
                      style={{ marginTop: spacing.sm }}
                      icon="bag-add-outline"
                    />
                  </View>
                ) : (
                  <Text style={styles.bubbleText}>{item.text}</Text>
                )}
              </View>
            </FadeInView>
          )}
          ListFooterComponent={
            typing ? (
              <View style={[styles.bubble, styles.bot, { width: 72 }]}>
                <TypingDots />
              </View>
            ) : null
          }
        />

        {messages.length <= 1 ? (
          <View style={styles.quickRow}>
            {quickKeys.map(k => (
              <Chip key={k} label={dict.assistant.quickReplies[k]} onPress={() => send(k)} />
            ))}
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={dict.assistant.placeholder}
            placeholderTextColor={colors.slate500}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <PressableScale
            onPress={() => send(input)}
            accessibilityRole="button"
            accessibilityLabel={dict.assistant.send}
            style={styles.sendBtn}
          >
            <Ionicons name="arrow-up" size={22} color={colors.white} />
          </PressableScale>
        </View>
        <Text style={styles.disclaimer}>{dict.assistant.disclaimer}</Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: spacing.md,
    borderRadius: radius.md,
    maxWidth: '88%',
  },
  user: { backgroundColor: colors.blue500, alignSelf: 'flex-end' },
  bot: { backgroundColor: colors.white, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.blue100 },
  bubbleText: { color: colors.navy900, fontFamily: font.regular, fontSize: 14 },
  recRow: { flexDirection: 'row', alignItems: 'center' },
  recName: { color: colors.navy900, fontFamily: font.semibold, fontSize: 15 },
  recSub: { color: colors.slate500, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  recPrice: { color: colors.blue600, fontFamily: font.bold, fontSize: 15, marginTop: spacing.xs },
  reason: { color: colors.navy700, fontFamily: font.medium, fontSize: 12, marginTop: spacing.sm },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.white,
    color: colors.navy900,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue100,
    paddingHorizontal: spacing.lg,
    fontFamily: font.regular,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    color: colors.slate500,
    fontFamily: font.regular,
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
