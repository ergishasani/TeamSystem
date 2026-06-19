import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Package } from '@/types';

interface Props {
  pkg: Package;
}

export function PackageCard({ pkg }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/packages/${pkg.id}`)} activeOpacity={0.8}>
      <View style={styles.top}>
        <Text style={styles.title}>{pkg.title}</Text>
        <Text style={styles.price}>{pkg.total_price.toLocaleString()} {pkg.currency}</Text>
      </View>
      {pkg.ai_reason && (
        <Text style={styles.reason} numberOfLines={2}>🤖 {pkg.ai_reason}</Text>
      )}
      <Text style={styles.items}>{pkg.items.length} items · {pkg.city}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  price: { fontSize: 17, fontWeight: '800', color: '#22C55E' },
  reason: { color: '#A1A1AA', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  items: { color: '#555', fontSize: 12, fontWeight: '600' },
});
