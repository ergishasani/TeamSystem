import { View, Text, StyleSheet } from 'react-native';
import type { Challenge } from '@/types';

interface Props {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: Props) {
  const TYPE_ICONS: Record<string, string> = { streak: '🔥', spending: '💰', category: '🏷️' };
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{TYPE_ICONS[challenge.type] || '🏆'}</Text>
      <View style={styles.body}>
        <Text style={styles.title}>{challenge.title}</Text>
        {challenge.description && <Text style={styles.desc}>{challenge.description}</Text>}
      </View>
      <View style={styles.reward}>
        <Text style={styles.rewardText}>+{challenge.reward}</Text>
        <Text style={styles.rewardLabel}>XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  icon: { fontSize: 28 },
  body: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  desc: { color: '#A1A1AA', fontSize: 13, marginTop: 3 },
  reward: { alignItems: 'center' },
  rewardText: { color: '#22C55E', fontSize: 18, fontWeight: '900' },
  rewardLabel: { color: '#A1A1AA', fontSize: 11 },
});
