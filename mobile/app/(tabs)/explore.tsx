import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Shuffle, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { offersApi } from '@/lib/api';
import { OfferCard } from '@/components/OfferCard';
import { CategoryPill } from '@/components/CategoryPill';
import { EmptyState } from '@/components/EmptyState';
import { ExploreScreenSkeleton } from '@/components/Skeleton';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Offer } from '@/types';

const CATEGORIES = ['All', 'wellness', 'fitness', 'food', 'travel', 'learning', 'health'];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchOffers = useCallback(async (category?: string, searchQuery?: string) => {
    try {
      const params: any = { limit: 20 };
      if (category && category !== 'All') params.category = category;
      if (searchQuery) params.search = searchQuery;
      const res = await offersApi.list(params);
      setOffers(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOffers().finally(() => setLoading(false));
  }, [fetchOffers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers(activeCategory === 'All' ? undefined : activeCategory, search || undefined);
    setRefreshing(false);
  }, [fetchOffers, activeCategory, search]);

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    fetchOffers(cat === 'All' ? undefined : cat, search || undefined);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchOffers(activeCategory === 'All' ? undefined : activeCategory, text || undefined);
  };

  return (
    <View style={styles.container}>
      {/* Sticky top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Explore</Text>

        {/* Search pill */}
        <View style={styles.searchRow}>
          <Search size={16} color={colors.labelTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search offers..."
            placeholderTextColor={colors.labelTertiary}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
        </View>

        {/* Providers banner */}
        <TouchableOpacity style={styles.swipeBanner} onPress={() => router.push('/providers' as any)} activeOpacity={0.8}>
          <View style={styles.swipeIconWrap}>
            <Shuffle size={18} color={colors.ink} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.swipeTitle}>Browse Providers</Text>
            <Text style={styles.swipeSub}>Explore all partner brands</Text>
          </View>
          <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.5} />
        </TouchableOpacity>

        {/* Swipe to Discover banner */}
        <TouchableOpacity style={styles.swipeBanner} onPress={() => router.push('/(tabs)/swipe')} activeOpacity={0.8}>
          <View style={styles.swipeIconWrap}>
            <Shuffle size={18} color={colors.ink} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.swipeTitle}>Swipe to Discover</Text>
            <Text style={styles.swipeSub}>Find offers with a swipe</Text>
          </View>
          <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.5} />
        </TouchableOpacity>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => handleCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {loading ? (
          <ExploreScreenSkeleton />
        ) : (
          <>
            <Text style={styles.count}>{total} offers found</Text>
            {offers.length === 0 ? (
              <EmptyState message="No offers found. Try a different category." />
            ) : (
              offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  topBar: {
    backgroundColor: colors.paper,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.ink,
    paddingHorizontal: spacing.screenX,
    marginBottom: 14,
  },

  // Search pill
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    marginHorizontal: spacing.screenX,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
    height: 44,
  },

  pills: {
    paddingHorizontal: spacing.screenX,
    gap: 8,
    paddingVertical: 4,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  list: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: 24,
  },
  count: {
    color: colors.labelSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  swipeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.screenX,
    marginBottom: 12,
    paddingHorizontal: spacing.cardPad,
    paddingVertical: 14,
  },
  swipeIconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.lime,
    justifyContent: 'center', alignItems: 'center',
  },
  swipeTitle: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 15 },
  swipeSub: { color: colors.labelSecondary, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
});
