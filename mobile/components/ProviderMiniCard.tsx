import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import type { Provider } from '@/types';

interface Props {
  provider: Provider;
  onPress?: () => void;
}

export function ProviderMiniCard({ provider, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{provider.name.charAt(0)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
        <Text style={styles.category}>{provider.category} · {provider.city}</Text>
      </View>
      <View style={styles.rating}>
        <Star size={12} color="#F59E0B" fill="#F59E0B" />
        <Text style={styles.ratingText}>{provider.rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 8,
  },
  avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#22C55E20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#22C55E', fontWeight: '800', fontSize: 18 },
  body: { flex: 1 },
  name: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  category: { color: '#A1A1AA', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#F59E0B', fontWeight: '700', fontSize: 13 },
});
