import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { offersApi } from '@/lib/api';
import { OfferCard } from '@/components/OfferCard';
import { CategoryPill } from '@/components/CategoryPill';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import type { Offer } from '@/types';

const CATEGORIES = ['All', 'wellness', 'fitness', 'food', 'travel', 'learning', 'health'];

export default function ExploreScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchOffers = async (category?: string, searchQuery?: string) => {
    setLoading(true);
    try {
      const params: any = { limit: 20 };
      if (category && category !== 'All') params.category = category;
      if (searchQuery) params.search = searchQuery;
      const res = await offersApi.list(params);
      setOffers(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

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
      <View style={styles.topBar}>
        <Text style={styles.title}>Explore Benefits</Text>
        <TextInput
          style={styles.search}
          placeholder="Search offers..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={handleSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {CATEGORIES.map((cat) => (
            <CategoryPill key={cat} label={cat} active={activeCategory === cat} onPress={() => handleCategory(cat)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.count}>{total} offers found</Text>
          {offers.length === 0 ? (
            <EmptyState message="No offers found. Try a different category." />
          ) : (
            offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  topBar: { paddingTop: 60, paddingBottom: 12, backgroundColor: '#111111' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 16 },
  search: {
    marginHorizontal: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 12,
  },
  pills: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  count: { color: '#A1A1AA', fontSize: 13, marginBottom: 16, marginTop: 8 },
});
