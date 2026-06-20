import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Handshake, Dumbbell, Utensils, Sparkles,
  MapPin, BookOpen, HeartPulse, ArrowRight,
} from 'lucide-react-native';
import { collaborationsApi, requestsApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface CollabItem {
  id: number;
  offer_id: number;
  provider_id: number;
  price_share: number;
  provider_name: string | null;
  offer_title: string | null;
  offer_price: number | null;
}

interface Collab {
  id: number;
  title: string;
  description: string | null;
  total_price: number;
  original_price: number;
  save_percent: number;
  currency: string;
  city: string;
  is_active: boolean;
  items: CollabItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  fitness: colors.lime,
  wellness: '#C4B5FD',
  food: '#FDBA74',
  travel: '#93C5FD',
  learning: '#FDE68A',
  health: '#BBF7D0',
  beauty: '#FBCFE8',
  default: '#E2E8F0',
};

const CATEGORY_ICONS: Record<string, any> = {
  fitness: Dumbbell,
  food: Utensils,
  wellness: Sparkles,
  travel: MapPin,
  learning: BookOpen,
  health: HeartPulse,
};

function guessCategory(providerName: string | null): string {
  if (!providerName) return 'default';
  const n = providerName.toLowerCase();
  if (n.includes('fit') || n.includes('gym') || n.includes('sport') || n.includes('padel')) return 'fitness';
  if (n.includes('spa') || n.includes('wellness') || n.includes('yoga')) return 'wellness';
  if (n.includes('bowl') || n.includes('food') || n.includes('cafe') || n.includes('din') || n.includes('coffee')) return 'food';
  if (n.includes('trip') || n.includes('travel') || n.includes('tour')) return 'travel';
  if (n.includes('skill') || n.includes('academy') || n.includes('learn')) return 'learning';
  if (n.includes('dental') || n.includes('care') || n.includes('health') || n.includes('clinic')) return 'health';
  return 'default';
}

function formatPrice(n: number): string {
  return n.toLocaleString('sq-AL');
}

// Unique providers for payment split
function paymentSplit(items: CollabItem[]): { provider_name: string; amount: number }[] {
  const map: Record<string, number> = {};
  for (const item of items) {
    const name = item.provider_name ?? 'Unknown';
    map[name] = (map[name] ?? 0) + item.price_share;
  }
  return Object.entries(map).map(([provider_name, amount]) => ({ provider_name, amount }));
}

export default function CollabDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [collab, setCollab] = useState<Collab | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!id) return;
    collaborationsApi.getById(Number(id))
      .then((r) => setCollab(r.data))
      .catch(() => Alert.alert('Error', 'Could not load collab details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async () => {
    if (!collab) return;
    Alert.alert(
      'Request bundle',
      `Submit a request for "${collab.title}" (${formatPrice(collab.total_price)} ${collab.currency})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            setRequesting(true);
            try {
              await requestsApi.create({
                collaboration_id: collab.id,
                request_type: 'collab',
              });
              Alert.alert(
                'Request submitted',
                'Your employer will be notified. You can track the status in your requests.',
                [{ text: 'OK', onPress: () => router.back() }],
              );
            } catch (e: any) {
              const detail = e?.response?.data?.detail;
              Alert.alert('Error', typeof detail === 'string' ? detail : 'Failed to submit request.');
            } finally {
              setRequesting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.lime} />
      </View>
    );
  }

  if (!collab) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Collab not found.</Text>
      </View>
    );
  }

  const split = paymentSplit(collab.items);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collab</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          {/* Icon + badge */}
          <View style={styles.heroTop}>
            <Handshake size={22} color={colors.ink} strokeWidth={1.75} />
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>
                Bundle · Save {formatPrice(collab.original_price - collab.total_price)} {collab.currency}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>{collab.title}</Text>

          {/* Provider names */}
          <Text style={styles.heroProviders}>
            {split.map((s) => s.provider_name).join(' × ')}
          </Text>

          {/* Description */}
          {collab.description ? (
            <Text style={styles.heroDesc}>{collab.description}</Text>
          ) : null}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.bundledPrice}>
              {formatPrice(collab.total_price)}{' '}
              <Text style={styles.currency}>{collab.currency}</Text>
            </Text>
            <Text style={styles.originalPrice}>
              {formatPrice(collab.original_price)} {collab.currency}
            </Text>
          </View>
        </View>

        {/* What's included */}
        <Text style={styles.sectionTitle}>What's included</Text>
        <View style={styles.includedList}>
          {collab.items.map((item) => {
            const category = guessCategory(item.provider_name);
            const bg = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
            const Icon = CATEGORY_ICONS[category] ?? Handshake;
            return (
              <View key={item.id} style={styles.includedCard}>
                <View style={[styles.includedIcon, { backgroundColor: bg }]}>
                  <Icon size={18} color={colors.ink} strokeWidth={1.75} />
                </View>
                <View style={styles.includedInfo}>
                  <Text style={styles.includedTitle}>{item.offer_title ?? 'Offer'}</Text>
                  <Text style={styles.includedProvider}>{item.provider_name}</Text>
                </View>
                <Text style={styles.includedPrice}>
                  {item.offer_price != null ? `${formatPrice(item.offer_price)} ${collab.currency}` : ''}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Payment split */}
        <Text style={styles.sectionTitle}>Payment split</Text>
        <View style={styles.splitCard}>
          {split.map((s, i) => (
            <View key={s.provider_name} style={[styles.splitRow, i < split.length - 1 && styles.splitDivider]}>
              <ArrowRight size={14} color={colors.labelTertiary} strokeWidth={1.75} style={{ marginRight: 10 }} />
              <Text style={styles.splitProvider}>{s.provider_name}</Text>
              <Text style={styles.splitAmount}>{formatPrice(s.amount)} {collab.currency}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.splitNote}>
          Employer approves once. Each provider is paid their share automatically.
        </Text>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, requesting && styles.ctaBtnDisabled]}
          onPress={handleRequest}
          activeOpacity={0.85}
          disabled={requesting}
        >
          {requesting
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.ctaBtnText}>Request bundle</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.screenX, paddingVertical: 14,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: fonts.bold, color: colors.ink },
  headerRight: { width: 44 },

  content: { paddingHorizontal: spacing.screenX, gap: 20, paddingTop: 4 },

  // Hero card
  heroCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 22, gap: 8,
    shadowColor: colors.ink, shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  saveBadge: {
    backgroundColor: colors.lime, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  saveBadgeText: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  heroTitle: { fontSize: 26, fontFamily: fonts.bold, color: colors.ink, lineHeight: 32 },
  heroProviders: { fontSize: 14, fontFamily: fonts.medium, color: colors.labelSecondary },
  heroDesc: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 4 },
  bundledPrice: { fontSize: 28, fontFamily: fonts.bold, color: colors.ink },
  currency: { fontSize: 18, fontFamily: fonts.semiBold },
  originalPrice: {
    fontSize: 15, fontFamily: fonts.regular, color: colors.labelTertiary,
    textDecorationLine: 'line-through',
  },

  sectionTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.ink },

  // What's included
  includedList: { gap: 10 },
  includedCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: colors.ink, shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  includedIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  includedInfo: { flex: 1 },
  includedTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  includedProvider: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary, marginTop: 2 },
  includedPrice: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink, flexShrink: 0 },

  // Payment split
  splitCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden',
    shadowColor: colors.ink, shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  splitRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  splitDivider: { borderBottomWidth: 1, borderBottomColor: colors.paper },
  splitProvider: { flex: 1, fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  splitAmount: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  splitNote: {
    fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary,
    lineHeight: 19, marginTop: -8,
  },

  // Sticky CTA
  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.separator,
  },
  ctaBtn: {
    backgroundColor: colors.ink, borderRadius: radius.pill,
    height: 56, justifyContent: 'center', alignItems: 'center',
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.white },
});
