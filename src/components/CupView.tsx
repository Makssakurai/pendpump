import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, flavorColors, baseTintColors, categoryColors, font, radius } from '../theme';
import { CupSize, Flavor, IngredientCategory, LiquidBase } from '../api/types';
import { useReduceMotion } from './anim/useReduceMotion';

const USE_NATIVE = Platform.OS !== 'web';

interface Layer {
  category: IngredientCategory;
  grams: number;
}

interface Props {
  size?: number;         // base px height
  cupSize?: CupSize;     // 300 | 400 | 500 — triggers smooth spring resize animation
  fill?: number;         // 0..1 liquid level
  flavor?: Flavor;
  base?: LiquidBase;     // water | milk | lactose_free
  layers?: Layer[];
  animated?: boolean;
  showVolumeBadge?: boolean;
}

const VOLUME_SCALE: Record<CupSize, { h: number; w: number }> = {
  300: { h: 0.84, w: 0.88 },
  400: { h: 1.0, w: 1.0 },
  500: { h: 1.18, w: 1.12 },
};

// Hero cup built entirely from Views. Smooth spring resize on cupSize change!
export function CupView({
  size = 160,
  cupSize = 400,
  fill = 0,
  flavor = 'czekolada',
  base = 'water',
  layers = [],
  animated = true,
  showVolumeBadge = false,
}: Props) {
  const reduce = useReduceMotion();
  const animFill = useRef(new Animated.Value(fill)).current;
  const waveA = useRef(new Animated.Value(0)).current;
  const waveB = useRef(new Animated.Value(0)).current;

  const targetDim = VOLUME_SCALE[cupSize] ?? VOLUME_SCALE[400];
  const animHeight = useRef(new Animated.Value(size * targetDim.h)).current;
  const animWidth = useRef(new Animated.Value(size * 0.72 * targetDim.w)).current;
  const splashScale = useRef(new Animated.Value(1)).current;

  // Animate cup size smoothly on 300 / 400 / 500 ml toggle
  useEffect(() => {
    const nextH = size * targetDim.h;
    const nextW = size * 0.72 * targetDim.w;
    if (!animated || reduce) {
      animHeight.setValue(nextH);
      animWidth.setValue(nextW);
      return;
    }
    Animated.parallel([
      Animated.spring(animHeight, {
        toValue: nextH,
        useNativeDriver: false,
        speed: 14,
        bounciness: 9,
      }),
      Animated.spring(animWidth, {
        toValue: nextW,
        useNativeDriver: false,
        speed: 14,
        bounciness: 9,
      }),
      Animated.sequence([
        Animated.timing(splashScale, { toValue: 1.06, duration: 140, useNativeDriver: USE_NATIVE }),
        Animated.spring(splashScale, { toValue: 1, useNativeDriver: USE_NATIVE, speed: 18, bounciness: 8 }),
      ]),
    ]).start();
  }, [animHeight, animWidth, animated, cupSize, reduce, size, splashScale, targetDim.h, targetDim.w]);

  useEffect(() => {
    if (!animated || reduce) {
      animFill.setValue(fill);
      return;
    }
    Animated.timing(animFill, {
      toValue: fill,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [animFill, animated, fill, reduce]);

  useEffect(() => {
    if (reduce) return;
    const loopA = Animated.loop(
      Animated.timing(waveA, { toValue: 1, duration: 3000, useNativeDriver: USE_NATIVE }),
    );
    const loopB = Animated.loop(
      Animated.timing(waveB, { toValue: 1, duration: 4000, useNativeDriver: USE_NATIVE }),
    );
    loopA.start();
    loopB.start();
    return () => { loopA.stop(); loopB.stop(); };
  }, [reduce, waveA, waveB]);

  const rim = size * 0.095;
  const liquidColor =
    flavor === 'bez_smaku' ? baseTintColors[base] : flavorColors[flavor];
  const clampedFill = Math.max(0, Math.min(1, fill));

  const liquidHeightPct = animFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const waveATranslate = waveA.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });
  const waveBTranslate = waveB.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -30],
  });

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale: splashScale }] }}>
      {/* rim */}
      <Animated.View
        style={[
          styles.rim,
          {
            width: animWidth,
            height: rim,
            borderRadius: rim / 2,
            backgroundColor: colors.white,
            borderColor: colors.blue200,
          },
        ]}
      />
      {/* cup body */}
      <Animated.View
        style={{
          width: animWidth,
          height: animHeight,
          borderRadius: rim / 2,
          borderWidth: 2,
          borderColor: colors.blue200,
          backgroundColor: base === 'water' ? colors.blue50 : baseTintColors[base],
          overflow: 'hidden',
          marginTop: -rim / 4,
        }}
      >
        {/* liquid */}
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: liquidHeightPct,
              backgroundColor: liquidColor,
            }}
          >
            {/* subtle milk sheen layer when milk/lactose_free selected */}
            {base !== 'water' && flavor !== 'bez_smaku' ? (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: baseTintColors[base],
                  opacity: 0.25,
                }}
              />
            ) : null}

            {/* thin category stripes on top of the base liquid */}
            {layers.slice(0, 3).map((layer, i) => {
              const t = layer.grams;
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: i * 4,
                    height: Math.min(6, Math.max(2, t / 4)),
                    backgroundColor: categoryColors[layer.category],
                    opacity: 0.85,
                  }}
                />
              );
            })}

            {/* gentle wave */}
            <Animated.View
              style={{
                position: 'absolute',
                top: -6,
                width: '140%',
                height: 14,
                borderRadius: 8,
                backgroundColor: colors.white,
                opacity: 0.3,
                transform: [{ translateX: waveATranslate }],
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                top: -3,
                width: '130%',
                height: 10,
                borderRadius: 6,
                backgroundColor: colors.white,
                opacity: 0.2,
                transform: [{ translateX: waveBTranslate }],
              }}
            />
          </Animated.View>
        </View>

        {/* measurement ticks on cup */}
        <View style={styles.ticksWrap} pointerEvents="none">
          <View style={styles.tick} />
          <View style={[styles.tick, { width: 10 }]} />
          <View style={styles.tick} />
        </View>

        {clampedFill === 0 ? <View style={styles.emptySheen} /> : null}
      </Animated.View>

      {showVolumeBadge ? (
        <View style={styles.volBadge}>
          <Text style={styles.volText}>{cupSize} ml</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rim: { borderWidth: 2, zIndex: 2 },
  emptySheen: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 8,
    height: '60%',
    borderRadius: 4,
    backgroundColor: colors.white,
    opacity: 0.4,
  },
  ticksWrap: {
    position: 'absolute',
    right: 6,
    top: '22%',
    bottom: '22%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tick: {
    width: 6,
    height: 1.5,
    backgroundColor: colors.blue400,
    opacity: 0.55,
    borderRadius: 1,
  },
  volBadge: {
    marginTop: 6,
    backgroundColor: colors.blue100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  volText: {
    color: colors.blue600,
    fontFamily: font.semibold,
    fontSize: 11,
  },
});
