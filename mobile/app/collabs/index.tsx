import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Handshake, ArrowRight } from 'lucide-react-native';
import { collaborationsApi } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface CollabItem {
  id: number;
  offer_id: number;
  provider_id: number;
  price_share: number;
  provider_name: string | null;
  offer_title: string | null;
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

function providerLine(items: CollabItem[]): string {
  const names: string[] = [];
  for (const item of items) {
    if (item.provider_name && !names.includes(item.provider_name)) {
      names.push(item.provider_name);
    }
  }
  return names.join(' × ');
}

function formatPrice(n: number): string {
  return n.toLocaleString('sq-AL');
}

function CollabCard({ collab, onPress }: { collab: Collab; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {/* Top row: icon + save badge */}
      <View style={styles.cardTop}>
        <Handshake size={22} color={colors.ink} strokeWidth={1.75} />
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>Save {collab.save_percent}%</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{collab.title}</Text>

      {/* Provider names */}
      <Text style={styles.cardProviders}>{providerLine(collab.items)}</Text>

      {/* Description */}
      {collab.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{collab.description}</Text>
      ) : null}

      {/* Price row */}
      <View style={styles.priceRow}>
        <Text style={styles.bundledPrice}>
          {formatPrice(collab.total_price)}{' '}
          <Text style={styles.currency}>{collab.currency}</Text>
        </Text>
        <Text style={styles.originalPrice}>
          {formatPrice(collab.original_price)} {collab.currency}
        </Text>
        <View style={styles.arrowWrap}>
          <ArrowRight size={18} color={colors.labelSecondary} strokeWidth={1.75} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CollabsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await collaborationsApi.list().then((r) => setCollabs(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collabs</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {/* Hero */}
        <Text style={styles.heroTitle}>Provider Collabs</Text>
        <Text style={styles.heroSub}>Two providers, one bundle. Better price, smarter routine.</Text>

        {loading ? (
          <View style={{ gap: 14, marginTop: 8 }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} height={140} borderRadius={20} />)}
          </View>
        ) : collabs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No collabs available right now.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {collabs.map((c) => (
              <CollabCard
                key={c.id}
                collab={c}
                onPress={() => router.push(`/collabs/${c.id}` as any)}
              />
            ))}
          </View>
        )}

        {/* How collabs work */}
        <Text style={styles.howTitle}>How collabs work</Text>
        <View style={styles.howCard}>
          {[
            'Two or more providers join forces on a single bundle.',
            'Employer approves the whole package once.',
            'Each provider gets paid their share automatically.',
            'You get a better price and a more useful combo.',
          ].map((line) => (
            <Text key={line} style={styles.howLine}>· {line}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
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

  heroTitle: { fontSize: 30, fontFamily: fonts.bold, color: colors.ink, marginBottom: -8 },
  heroSub: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 22 },

  center: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary },

  list: { gap: 14 },

  // Collab card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: 22,
    gap: 6,
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  saveBadge: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  saveBadgeText: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  cardTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.ink, lineHeight: 28 },
  cardProviders: { fontSize: 14, fontFamily: fonts.medium, color: '#5D9A2A', marginBottom: 2 },
  cardDesc: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 20 },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 8,
  },
  bundledPrice: { fontSize: 26, fontFamily: fonts.bold, color: colors.ink },
  currency: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.ink },
  originalPrice: {
    fontSize: 15, fontFamily: fonts.regular, color: colors.labelTertiary,
    textDecorationLine: 'line-through', flex: 1,
  },
  arrowWrap: { marginLeft: 'auto' },

  // How collabs work
  howTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.ink },
  howCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: 22,
    gap: 10,
  },
  howLine: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 21 },
});
