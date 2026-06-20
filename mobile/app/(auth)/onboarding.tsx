import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { onboardingApi } from '@/lib/api';

const ALL_INTERESTS = [
  'Fitness', 'Wellness', 'Food', 'Travel', 'Learning',
  'Health', 'Beauty', 'Family', 'Technology', 'Team Activities',
  'Entertainment', 'Shopping',
];

const ICONS: Record<string, string> = {
  Fitness: '🏋️', Wellness: '🧘', Food: '🍽️', Travel: '✈️', Learning: '📚',
  Health: '❤️', Beauty: '💄', Family: '👨‍👩‍👧', Technology: '💻',
  'Team Activities': '🤝', Entertainment: '🎭', Shopping: '🛍️',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.length < 5 ? [...prev, cat] : prev
    );
  };

  const handleSave = async () => {
    if (selected.length !== 5) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What do you love?</Text>
        <Text style={styles.subtitle}>
          Choose your top 5 interests so we can personalize your benefits.
        </Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{selected.length} / 5 selected</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {ALL_INTERESTS.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => toggle(cat)}
              activeOpacity={0.8}
            >
              <Text style={styles.pillIcon}>{ICONS[cat]}</Text>
              <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, selected.length !== 5 && styles.btnDisabled]}
          onPress={handleSave}
          disabled={selected.length !== 5 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.btnText}>Let's Go →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  header: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#A1A1AA', lineHeight: 22 },
  counter: {
    marginTop: 16, backgroundColor: '#22C55E20', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start',
  },
  counterText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, paddingBottom: 120 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1E1E1E', borderRadius: 50,
    paddingHorizontal: 18, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#2A2A2A',
  },
  pillSelected: { backgroundColor: '#22C55E20', borderColor: '#22C55E' },
  pillIcon: { fontSize: 20 },
  pillLabel: { color: '#A1A1AA', fontSize: 14, fontWeight: '600' },
  pillLabelSelected: { color: '#22C55E' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  btn: { backgroundColor: '#22C55E', borderRadius: 14, padding: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#111111', fontSize: 17, fontWeight: '800' },
});
