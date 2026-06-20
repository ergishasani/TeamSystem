import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Leaf, Dumbbell, UtensilsCrossed, Plane, BookOpen, Heart } from 'lucide-react-native';
import type { Offer } from '@/types';
import { colors, fonts, radius, spacing, categoryColor } from '@/lib/theme';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  wellness: Leaf,
  fitness: Dumbbell,
  food: UtensilsCrossed,
  travel: Plane,
  learning: BookOpen,
  health: Heart,
};

interface Props {
  offer: Offer;
  compact?: boolean;
}

export function OfferCard({ offer, compact }: Props) {
  const router = useRouter();
  const catColor = categoryColor(offer.category);
  const Icon = CATEGORY_ICONS[offer.category] ?? Leaf;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/offers/${offer.id}`)}
        activeOpacity={0.85}
      >
        {/* Colored image area */}
        <View style={[styles.imageArea, { backgroundColor: catColor }]}>
          <View style={styles.catPill}>
            <Text style={styles.catPillText}>
              {offer.category.charAt(0).toUpperCase() + offer.category.slice(1)}
            </Text>
          </View>
          <View style={styles.bigIcon}>
            <Icon size={72} color="rgba(0,0,0,0.2)" strokeWidth={1.25} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{offer.title}</Text>
          {offer.provider_name ? (
            <Text style={styles.provider} numberOfLines={1}>{offer.provider_name}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {offer.price.toLocaleString()} {offer.currency}
            </Text>
            {offer.is_limited_drop && (
              <View style={styles.limitedBadge}>
                <Text style={styles.limitedText}>Limited</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // List row
  return (
    <TouchableOpacity style={styles.row} onPress={() => router.push(`/offers/${offer.id}`)} activeOpacity={0.8}>
      <View style={[styles.rowIcon, { backgroundColor: catColor + '28' }]}>
        <Icon size={20} color={catColor} strokeWidth={1.75} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>{offer.title}</Text>
          {offer.is_limited_drop && (
            <View style={styles.limitedBadgeSm}>
              <Text style={styles.limitedTextSm}>Limited</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowMeta}>
          {offer.provider_name ?? offer.category} · {offer.city}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{offer.price.toLocaleString()}</Text>
        <Text style={styles.rowCurrency}>{offer.currency}</Text>
      </View>
      <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact card
  card: {
    width: 240,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 8,
  },
  imageArea: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
  },
  catPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  catPillText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  bigIcon: {
    alignSelf: 'flex-start',
  },
  content: {
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 3,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  provider: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  limitedBadge: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  limitedText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },

  // Row (full)
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.cardPad,
    paddingVertical: spacing.rowY,
    gap: 12,
  },
  rowIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { color: colors.ink, fontSize: 15, fontFamily: fonts.semiBold, flex: 1 },
  rowMeta: { color: colors.labelSecondary, fontSize: 12, fontFamily: fonts.medium, textTransform: 'capitalize' },
  rowRight: { alignItems: 'flex-end', marginRight: 4 },
  rowPrice: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  rowCurrency: { color: colors.labelTertiary, fontSize: 11, fontFamily: fonts.medium },
  limitedBadgeSm: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  limitedTextSm: { fontSize: 10, fontFamily: fonts.bold, color: colors.ink },
});
