import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Offer } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  wellness: '#8B5CF6', fitness: '#F59E0B', food: '#EF4444',
  travel: '#3B82F6', learning: '#06B6D4', health: '#22C55E',
};

const CATEGORY_ICONS: Record<string, string> = {
  wellness: '🧘', fitness: '💪', food: '🥗',
  travel: '✈️', learning: '📚', health: '🦷',
};

interface Props {
  offer: Offer;
  compact?: boolean;
}

export function OfferCard({ offer, compact }: Props) {
  const router = useRouter();
  const color = CATEGORY_COLORS[offer.category] || '#22C55E';
  const icon = CATEGORY_ICONS[offer.category] || '🎁';

  if (compact) {
    return (
      <TouchableOpacity style={[styles.compact, { borderColor: color + '40' }]} onPress={() => router.push(`/offers/${offer.id}`)}>
        <View style={[styles.compactIcon, { backgroundColor: color + '20' }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.compactTitle} numberOfLines={2}>{offer.title}</Text>
        <Text style={[styles.compactPrice, { color }]}>{offer.price.toLocaleString()}</Text>
        <Text style={styles.compactCurrency}>{offer.currency}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/offers/${offer.id}`)} activeOpacity={0.8}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{icon} {offer.category}</Text>
          </View>
          {offer.is_limited_drop && <Text style={styles.limited}>⚡ Drop</Text>}
        </View>
        <Text style={styles.title} numberOfLines={2}>{offer.title}</Text>
        <View style={styles.bottomRow}>
          <Text style={[styles.price, { color }]}>{offer.price.toLocaleString()} {offer.currency}</Text>
          <Text style={styles.city}>{offer.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  colorBar: { width: 4 },
  body: { flex: 1, padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  limited: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 17, fontWeight: '800' },
  city: { color: '#A1A1AA', fontSize: 12 },
  // Compact
  compact: { width: 140, backgroundColor: '#1E1E1E', borderRadius: 16, padding: 14, borderWidth: 1 },
  compactIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconText: { fontSize: 20 },
  compactTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 8, lineHeight: 18 },
  compactPrice: { fontSize: 16, fontWeight: '900' },
  compactCurrency: { color: '#A1A1AA', fontSize: 11 },
});
