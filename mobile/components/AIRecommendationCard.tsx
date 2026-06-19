import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { RecommendedOffer } from '@/types';

interface Props {
  recommendation: RecommendedOffer;
}

export function AIRecommendationCard({ recommendation }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/offers/${recommendation.offer_id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.top}>
        <Text style={styles.title}>{recommendation.title}</Text>
        <Text style={styles.price}>{recommendation.price.toLocaleString()} {recommendation.currency}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{recommendation.category}</Text>
      </View>
      <Text style={styles.reason}>🤖 {recommendation.reason}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22C55E10',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22C55E30',
    marginBottom: 10,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, flex: 1 },
  price: { color: '#22C55E', fontWeight: '800', fontSize: 16 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#22C55E20', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeText: { color: '#22C55E', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  reason: { color: '#A1A1AA', fontSize: 13, lineHeight: 18 },
});
