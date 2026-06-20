import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import type { RecommendedOffer } from '@/types';
import { colors, fonts, radius } from '@/lib/theme';

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
        <View style={styles.aiTag}>
          <Sparkles size={11} color={colors.ink} strokeWidth={2} />
          <Text style={styles.aiTagText}>{recommendation.category}</Text>
        </View>
        <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.5} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{recommendation.title}</Text>
      <Text style={styles.reason} numberOfLines={2}>{recommendation.reason}</Text>
      <Text style={styles.price}>{recommendation.price.toLocaleString()} <Text style={styles.currency}>{recommendation.currency}</Text></Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lime + '60',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.lime, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  aiTagText: { fontSize: 11, fontFamily: fonts.bold, color: colors.ink, textTransform: 'capitalize' },
  title: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 16, marginBottom: 6, lineHeight: 22 },
  reason: { color: colors.labelSecondary, fontSize: 13, fontFamily: fonts.regular, lineHeight: 18, marginBottom: 12 },
  price: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  currency: { fontSize: 13, fontFamily: fonts.medium, color: colors.labelTertiary },
});
