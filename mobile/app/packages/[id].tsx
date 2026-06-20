import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Sparkles, Layers, ArrowUpRight, Calendar,
  Dumbbell, Leaf, UtensilsCrossed, Plane, BookOpen, Stethoscope, Tag,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { packagesApi, requestsApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { colors, fonts, radius, spacing, categoryColor } from '@/lib/theme';
import type { Package, PackageItem } from '@/types';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  wellness: Leaf, fitness: Dumbbell, food: UtensilsCrossed,
  travel: Plane, learning: BookOpen, health: Stethoscope,
};

function uniqueCategories(items: PackageItem[]): string[] {
  return [...new Set(items.map((i) => i.category))];
}

function earliestExpiry(items: PackageItem[]): Date | null {
  const dates = items
    .map((i) => i.valid_until ? new Date(i.valid_until) : null)
    .filter((d): d is Date => d !== null);
  if (!dates.length) return null;
  return dates.reduce((min, d) => d < min ? d : min);
}

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    packagesApi.getById(Number(id))
      .then((res) => setPkg(res.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async () => {
    if (!pkg || requesting) return;
    setRequesting(true);
    try {
      const res = await requestsApi.create({
        package_id: pkg.id,
        request_type: 'package',
        ai_reason: pkg.ai_reason ?? undefined,
      });
      router.push(`/requests/${res.data.id}` as any);
    } catch (err: any) {
      Alert.alert('Request failed', err?.response?.data?.detail ?? 'Something went wrong. Try again.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!pkg) return null;

  const cats = uniqueCategories(pkg.items);
  const expiry = earliestExpiry(pkg.items);
  const expiryStr = expiry
    ? expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header — just back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            {pkg.ai_reason ? (
              <View style={styles.aiBadge}>
                <Sparkles size={12} color={colors.white} strokeWidth={1.5} />
                <Text style={styles.aiBadgeText}>AI CURATED</Text>
              </View>
            ) : <View />}
            <TouchableOpacity style={styles.arrowBtn} activeOpacity={0.8}>
              <ArrowUpRight size={18} color={colors.white} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{pkg.title}</Text>
            {pkg.description && (
              <Text style={styles.heroDesc}>{pkg.description}</Text>
            )}
          </View>
        </View>

        {/* Price + offer count row */}
        <View style={styles.priceRow}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>BUNDLE PRICE</Text>
            <Text style={styles.priceAmount}>
              {pkg.total_price.toLocaleString()} {pkg.currency}
            </Text>
          </View>
          <View style={styles.offerCountCard}>
            <Layers size={24} color={colors.white} strokeWidth={1.75} />
            <Text style={styles.offerCountNum}>{pkg.items.length}</Text>
            <Text style={styles.offerCountLabel}>OFFERS</Text>
          </View>
        </View>

        {/* Why this bundle */}
        {pkg.ai_reason && (
          <View style={styles.whyCard}>
            <View style={styles.whyHeader}>
              <Sparkles size={14} color={colors.labelTertiary} strokeWidth={1.5} />
              <Text style={styles.whyLabel}>WHY THIS BUNDLE</Text>
            </View>
            <Text style={styles.whyText}>"{pkg.ai_reason}"</Text>
          </View>
        )}

        {/* Categories + Valid through */}
        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>CATEGORIES</Text>
            <View style={styles.catPills}>
              {cats.map((cat) => (
                <View key={cat} style={styles.catPill}>
                  <View style={[styles.catDot, { backgroundColor: categoryColor(cat) }]} />
                  <Text style={styles.catPillText}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          {expiryStr && (
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>VALID THROUGH</Text>
              <View style={styles.expiryRow}>
                <Calendar size={18} color={colors.ink} strokeWidth={1.5} />
                <Text style={styles.expiryDate}>{expiryStr}</Text>
              </View>
              <Text style={styles.expirySub}>Earliest expiry</Text>
            </View>
          )}
        </View>

        {/* What's inside */}
        <View style={styles.insideHeader}>
          <Text style={styles.insideTitle}>WHAT'S INSIDE</Text>
          <Text style={styles.insideCount}>{pkg.items.length} items</Text>
        </View>

        <View style={styles.itemsGrid}>
          {pkg.items.map((item, idx) => {
            const cat = item.category ?? 'wellness';
            const catColor = categoryColor(cat);
            const IconComp = CATEGORY_ICONS[cat] ?? Tag;
            const offerTitle = item.offer_title ?? `Offer #${item.offer_id}`;
            const providerName = item.provider_name ?? null;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => router.push(`/offers/${item.offer_id}` as any)}
                activeOpacity={0.88}
              >
                <View style={styles.itemTopRow}>
                  <View style={[styles.itemIcon, { backgroundColor: catColor + '33' }]}>
                    <IconComp size={20} color={catColor} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.itemIndex}>{idx + 1}/{pkg.items.length}</Text>
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={3}>{offerTitle}</Text>
                  {providerName && (
                    <Text style={styles.itemProvider} numberOfLines={1}>{providerName}</Text>
                  )}
                </View>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>{item.price_share.toLocaleString()} ALL</Text>
                  <View style={styles.itemArrow}>
                    <ArrowUpRight size={18} color={colors.ink} strokeWidth={2} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, requesting && { opacity: 0.6 }]}
          onPress={handleRequest}
          disabled={requesting}
          activeOpacity={0.88}
        >
          <Text style={styles.submitBtnText}>
            {requesting ? 'Purchasing...' : `Purchase · ${pkg.total_price.toLocaleString()} ${pkg.currency}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },

  content: { paddingHorizontal: spacing.screenX, gap: 12, paddingTop: 4 },

  // Hero
  heroCard: {
    backgroundColor: colors.lime,
    borderRadius: radius['2xl'],
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.ink, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  aiBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.white, letterSpacing: 0.6 },
  arrowBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center',
  },
  heroBottom: { gap: 6, marginTop: 14 },
  heroTitle: { fontSize: 30, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -1, lineHeight: 36 },
  heroDesc: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(0,0,0,0.55)', lineHeight: 21 },

  // Price row
  priceRow: { flexDirection: 'row', gap: 10 },
  priceCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20, gap: 4,
  },
  priceLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 1 },
  priceAmount: { fontSize: 32, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.8 },
  offerCountCard: {
    width: 90, backgroundColor: colors.ink, borderRadius: radius['2xl'],
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  offerCountNum: { fontSize: 34, fontFamily: fonts.bold, color: colors.white, letterSpacing: -1 },
  offerCountLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2 },

  // Why card
  whyCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 18, gap: 10,
  },
  whyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whyLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 1 },
  whyText: { fontSize: 16, fontFamily: fonts.medium, color: colors.ink, lineHeight: 25, letterSpacing: -0.2 },

  // Meta row
  metaRow: { flexDirection: 'row', gap: 10 },
  metaCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16, gap: 10,
  },
  metaLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 1 },
  catPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.paper, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catPillText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.ink },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expiryDate: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },
  expirySub: { fontSize: 12, fontFamily: fonts.regular, color: colors.labelTertiary },

  // What's inside
  insideHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
  },
  insideTitle: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 1 },
  insideCount: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary },

  // Items grid
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemCard: {
    width: '47.5%',
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 16, justifyContent: 'space-between', minHeight: 180,
  },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  itemIcon: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  itemIndex: { fontSize: 12, fontFamily: fonts.regular, color: colors.labelTertiary },
  itemBody: { gap: 4, flex: 1 },
  itemTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink, lineHeight: 21, letterSpacing: -0.2 },
  itemProvider: { fontSize: 12, fontFamily: fonts.regular, color: colors.success },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  itemPrice: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
  itemArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenX, paddingTop: 12,
    backgroundColor: colors.paper,
  },
  submitBtn: {
    height: 56, borderRadius: radius.pill,
    backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center',
  },
  submitBtnText: { fontSize: 16, fontFamily: fonts.bold, color: colors.white, letterSpacing: -0.2 },
});
