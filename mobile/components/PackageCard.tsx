import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  ArrowUpRight,
  Leaf,
  Dumbbell,
  UtensilsCrossed,
  Plane,
  BookOpen,
  Heart,
} from 'lucide-react-native';
import type { Package } from '@/types';
import { colors, fonts, radius, spacing, categoryColor } from '@/lib/theme';

interface Props {
  pkg: Package;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  wellness: Leaf,
  fitness: Dumbbell,
  food: UtensilsCrossed,
  travel: Plane,
  learning: BookOpen,
  health: Heart,
};

function CategoryCircle({ category, index }: { category: string; index: number }) {
  const bg = categoryColor(category);
  const Icon = CATEGORY_ICONS[category] ?? Sparkles;
  return (
    <View
      style={[
        styles.catCircle,
        { backgroundColor: bg, marginLeft: index > 0 ? -10 : 0, zIndex: 10 - index },
      ]}
    >
      <Icon size={16} color={colors.ink} strokeWidth={1.75} />
    </View>
  );
}

export function PackageCard({ pkg }: Props) {
  const router = useRouter();
  const visibleItems = pkg.items.slice(0, 3);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/packages/${pkg.id}`)}
      activeOpacity={0.88}
    >
      {/* Top row: badge + arrow button */}
      <View style={styles.topRow}>
        <View style={styles.aiBadge}>
          <Sparkles size={11} color={colors.ink} strokeWidth={2} />
          <Text style={styles.aiBadgeText}>AI PACKAGE</Text>
        </View>
        <View style={styles.arrowBtn}>
          <ArrowUpRight size={18} color={colors.white} strokeWidth={2} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{pkg.title}</Text>

      {/* Description */}
      {pkg.description ? (
        <Text style={styles.desc} numberOfLines={2}>{pkg.description}</Text>
      ) : pkg.ai_reason ? (
        <Text style={styles.desc} numberOfLines={2}>{pkg.ai_reason}</Text>
      ) : null}

      {/* Footer: category circles + count + price */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.circles}>
            {visibleItems.map((item, i) => (
              <CategoryCircle key={item.id} category={item.category} index={i} />
            ))}
          </View>
          <Text style={styles.offerCount}>{pkg.items.length} offer{pkg.items.length !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.price}>{pkg.total_price.toLocaleString()} ALL</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: spacing.cardPad,
    marginHorizontal: spacing.screenX,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 10,
  },
  desc: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circles: {
    flexDirection: 'row',
  },
  catCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  offerCount: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
  },
  price: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
  },
});
