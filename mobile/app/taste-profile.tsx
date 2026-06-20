import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check, Sparkles } from 'lucide-react-native';
import { onboardingApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

// ─── All categories (matches screenshot) ─────────────────────────────────────

const ALL_CATEGORIES = [
  'Fitness',
  'Wellness',
  'Food',
  'Travel',
  'Learning',
  'Health',
  'Beauty',
  'Family',
  'Technology',
  'Team Activities',
  'Entertainment',
  'Shopping',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TasteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing interests on mount
  useEffect(() => {
    onboardingApi.getInterests()
      .then((res) => {
        const data = res.data;
        // backend returns {id, category} array; category is already Title Case
        const cats: string[] = Array.isArray(data)
          ? data.map((i: any) => i.category ?? i)
          : (data.interests ?? []);
        setSelected(cats);
        setOriginal(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...original].sort());

  const handleSave = async () => {
    if (selected.length === 0) {
      Alert.alert('Select at least one', 'Please pick at least one category.');
      return;
    }
    setSaving(true);
    try {
      await onboardingApi.saveInterests(selected);
      setOriginal(selected);
      Alert.alert('Saved', 'Your taste profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Taste Profile</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lime} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero card */}
            <View style={styles.heroCard}>
              <View style={styles.aiTag}>
                <Sparkles size={13} color={colors.ink} strokeWidth={2} />
                <Text style={styles.aiTagText}>AI TUNED</Text>
              </View>
              <Text style={styles.heroTitle}>Your interests shape every recommendation</Text>
              <Text style={styles.heroBody}>
                Tap to add or remove categories. Perka uses this to choose your AI Pick, Drops, and Collabs.
              </Text>
            </View>

            {/* Section label */}
            <Text style={styles.sectionLabel}>All categories</Text>

            {/* 2-column grid */}
            <View style={styles.grid}>
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = selected.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggle(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {cat}
                    </Text>
                    {isSelected && (
                      <Check size={16} color={colors.white} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Sticky bottom button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.saveBtn, selected.length === 0 && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || selected.length === 0}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.ink} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  Save changes ({selected.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.screenX, paddingVertical: 14,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 20, fontFamily: fonts.bold, color: colors.ink,
  },
  headerRight: { width: 44 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: { paddingHorizontal: spacing.screenX, paddingTop: 4, gap: 20 },

  // Hero card
  heroCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 20, gap: 10,
  },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.lime, borderRadius: radius.pill,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
  },
  aiTagText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink, letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.ink, lineHeight: 27 },
  heroBody: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 21 },

  // Section label
  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },

  // 2-column grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    width: '47.5%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radius.xl,
    paddingHorizontal: 18, paddingVertical: 18,
  },
  pillSelected: { backgroundColor: colors.ink },
  pillText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  pillTextSelected: { color: colors.white },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenX, paddingTop: 12,
    backgroundColor: colors.paper,
  },
  saveBtn: {
    height: 58, borderRadius: radius.pill,
    backgroundColor: colors.lime,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.ink },
});
