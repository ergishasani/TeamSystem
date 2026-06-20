import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, ChevronRight } from 'lucide-react-native';
import type { Provider } from '@/types';
import { colors, fonts, radius } from '@/lib/theme';

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
        <Star size={12} color={colors.warning} fill={colors.warning} />
        <Text style={styles.ratingText}>{provider.rating}</Text>
      </View>
      <ChevronRight size={14} color={colors.labelTertiary} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.lime,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 18 },
  body: { flex: 1 },
  name: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 15 },
  category: { color: colors.labelSecondary, fontSize: 12, fontFamily: fonts.medium, marginTop: 3, textTransform: 'capitalize' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 },
});
