import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart, Dumbbell, UtensilsCrossed, Plane, BookOpen,
  Stethoscope, Sparkles, Clapperboard, Trophy, Cpu, Palette, Music,
} from 'lucide-react-native';
import { onboardingApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const ALL_INTERESTS = [
  'Wellness', 'Fitness', 'Food', 'Travel', 'Learning',
  'Health', 'Entertainment', 'Beauty', 'Sport', 'Tech', 'Art', 'Music',
] as const;

type Interest = typeof ALL_INTERESTS[number];

const INTEREST_ICONS: Record<Interest, React.ReactNode> = {
  Wellness:      <Heart size={20} color="inherit" strokeWidth={1.5} />,
  Fitness:       <Dumbbell size={20} color="inherit" strokeWidth={1.5} />,
  Food:          <UtensilsCrossed size={20} color="inherit" strokeWidth={1.5} />,
  Travel:        <Plane size={20} color="inherit" strokeWidth={1.5} />,
  Learning:      <BookOpen size={20} color="inherit" strokeWidth={1.5} />,
  Health:        <Stethoscope size={20} color="inherit" strokeWidth={1.5} />,
  Entertainment: <Clapperboard size={20} color="inherit" strokeWidth={1.5} />,
  Beauty:        <Sparkles size={20} color="inherit" strokeWidth={1.5} />,
  Sport:         <Trophy size={20} color="inherit" strokeWidth={1.5} />,
  Tech:          <Cpu size={20} color="inherit" strokeWidth={1.5} />,
  Art:           <Palette size={20} color="inherit" strokeWidth={1.5} />,
  Music:         <Music size={20} color="inherit" strokeWidth={1.5} />,
};

const MAX = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : prev.length < MAX
        ? [...prev, cat]
        : prev
    );
  };

  const handleSave = async () => {
    if (selected.length !== MAX) {
      Alert.alert('Choose 5', 'Please select exactly 5 interests to continue.');
      return;
    }
    setLoading(true);
    try {
      await onboardingApi.saveInterests(selected);
      router.replace('/(tabs)/');
    } catch {
      Alert.alert('Error', 'Could not save your interests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = selected.length === MAX;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>What matters{'\n'}to you?</Text>
        <Text style={styles.subtitle}>
          Pick exactly 5 to personalize your feed.
        </Text>
        <View style={[styles.counter, isComplete && styles.counterComplete]}>
          <Text style={[styles.counterText, isComplete && styles.counterTextComplete]}>
            {selected.length} / {MAX} selected
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {ALL_INTERESTS.map((cat) => {
          const isSelected = selected.includes(cat);
          const iconColor = isSelected ? colors.ink : colors.labelSecondary;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => toggle(cat)}
              activeOpacity={0.75}
            >
              <View style={styles.pillIconWrap}>
                {React.cloneElement(
                  INTEREST_ICONS[cat] as React.ReactElement<any>,
                  { color: iconColor }
                )}
              </View>
              <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.cta, isComplete && styles.ctaActive]}
          onPress={handleSave}
          disabled={!isComplete || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.ink} size="small" />
          ) : (
            <Text style={styles.ctaText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: spacing.screenX,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  counter: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  counterComplete: {
    backgroundColor: colors.lime,
  },
  counterText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.labelSecondary,
  },
  counterTextComplete: {
    color: colors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenX,
    gap: 10,
    paddingBottom: 40,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: colors.lime,
    borderColor: 'transparent',
  },
  pillIconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.labelSecondary,
  },
  pillLabelSelected: {
    color: colors.ink,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.screenX,
    paddingTop: 16,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: 'rgba(32,32,32,0.06)',
  },
  cta: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface3,
    opacity: 0.5,
  },
  ctaActive: {
    backgroundColor: colors.lime,
    opacity: 1,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
});
