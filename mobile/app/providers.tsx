import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Search, MapPin, Star,
  Leaf, Dumbbell, UtensilsCrossed, Plane, BookOpen, Heart,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { providersApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Provider {
  id: number;
  name: string;
  category: string;
  city: string;
  rating: number;
  offer_count: number;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'wellness', label: 'Wellness', color: '#9B8FE8', dot: '#9B8FE8' },
  { key: 'fitness',  label: 'Fitness',  color: colors.lime, dot: colors.lime },
  { key: 'food',     label: 'Food',     color: '#F5A623', dot: '#F5A623' },
  { key: 'travel',   label: 'Travel',   color: '#7EC8E3', dot: '#7EC8E3' },
  { key: 'learning', label: 'Learning', color: '#F0C040', dot: '#F0C040' },
  { key: 'health',   label: 'Health',   color: '#F28B9A', dot: '#F28B9A' },
];

function categoryColor(cat: string) {
  return CATEGORIES.find((c) => c.key === cat)?.color ?? '#CCCCCC';
}

function CategoryIcon({ category, size = 22 }: { category: string; size?: number }) {
  const col = '#fff';
  const props = { size, color: col, strokeWidth: 1.75 };
  switch (category) {
    case 'wellness': return <Leaf {...props} />;
    case 'fitness':  return <Dumbbell {...props} />;
    case 'food':     return <UtensilsCrossed {...props} />;
    case 'travel':   return <Plane {...props} />;
    case 'learning': return <BookOpen {...props} />;
    case 'health':   return <Heart {...props} />;
    default:         return <Leaf {...props} />;
  }
}

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({ provider, onPress }: { provider: Provider; onPress: () => void }) {
  const bgColor = categoryColor(provider.category);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAvatar, { backgroundColor: bgColor }]}>
        <CategoryIcon category={provider.category} size={24} />
      </View>
      <Text style={styles.cardName} numberOfLines={2}>{provider.name}</Text>
      <View style={styles.cardMeta}>
        <MapPin size={12} color={colors.labelTertiary} strokeWidth={1.75} />
        <Text style={styles.cardCity}>{provider.city}</Text>
      </View>
      <View style={styles.cardRating}>
        <Star size={13} color={colors.ink} fill={colors.ink} strokeWidth={0} />
        <Text style={styles.cardRatingText}>
          {Number(provider.rating).toFixed(1)} · {provider.offer_count} offer{provider.offer_count !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProvidersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const load = useCallback((cat?: string | null, q?: string) => {
    setLoading(true);
    providersApi.list({ category: cat ?? undefined, q: q || undefined })
      .then((res) => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(activeCategory, query), 300);
    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  const handleCategory = (key: string) => {
    const next = activeCategory === key ? null : key;
    setActiveCategory(next);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Providers</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.labelTertiary} strokeWidth={1.75} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers"
            placeholderTextColor={colors.labelTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => handleCategory(cat.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.filterDot, { backgroundColor: cat.dot }]} />
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 24 },
          ]}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <Text style={styles.countLabel}>
              {providers.length} provider{providers.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={
            <EmptyState title="No providers found" message="Try a different search or filter." />
          }
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={() => router.push(`/provider/${item.id}` as any)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const CARD_GAP = 12;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },

  searchWrap: { paddingHorizontal: spacing.screenX, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 18, height: 52,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: fonts.regular, color: colors.ink },

  filtersScroll: { flexGrow: 0, marginBottom: 18 },
  filtersRow: { paddingHorizontal: spacing.screenX, gap: 10 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  filterPillActive: { backgroundColor: colors.ink },
  filterDot: { width: 10, height: 10, borderRadius: 5 },
  filterLabel: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink },
  filterLabelActive: { color: colors.white },

  countLabel: {
    fontSize: 20, fontFamily: fonts.bold, color: colors.ink,
    letterSpacing: -0.4, marginBottom: 14,
  },

  grid: { paddingHorizontal: spacing.screenX, paddingTop: 2 },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: 18,
    gap: 8,
  },
  cardAvatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  cardName: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardCity: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardRatingText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.ink },
});
