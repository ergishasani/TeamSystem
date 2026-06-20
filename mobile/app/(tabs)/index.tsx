import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { walletApi, offersApi, packagesApi, challengesApi, dealsApi } from '@/lib/api';
import { WalletCard } from '@/components/WalletCard';
import { PackageCard } from '@/components/PackageCard';
import { OfferCard } from '@/components/OfferCard';
import { ChallengeCard } from '@/components/ChallengeCard';
import { EmptyState } from '@/components/EmptyState';
import type { Wallet, Package, Offer, Challenge } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  wellness: '#8B5CF6', fitness: '#F59E0B', food: '#EF4444',
  travel: '#3B82F6', learning: '#06B6D4', health: '#22C55E',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [todayDeal, setTodayDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [w, p, o, c] = await Promise.all([
          walletApi.getWallet(),
          packagesApi.list(),
          offersApi.list({ limit: 6 }),
          challengesApi.list(),
        ]);
        setWallet(w.data);
        setPackages(p.data.slice(0, 3));
        setOffers(o.data.items?.slice(0, 4) ?? []);
        setChallenges(c.data.slice(0, 2));

        // Deal of the day — non-blocking
        dealsApi.today().then((res) => setTodayDeal(res.data)).catch(() => null);
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#22C55E" size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey, {user?.full_name?.split(' ')[0]} 👋</Text>
        <Text style={styles.subtitle}>Ready to explore your benefits?</Text>
      </View>

      {wallet && <WalletCard wallet={wallet} />}

      {/* Deal of the Day hero */}
      {todayDeal && (
        <>
          <Text style={styles.sectionTitle}>🔥 Today's Drop</Text>
          <TouchableOpacity
            style={[styles.dealCard, { borderColor: (CATEGORY_COLORS[todayDeal.offer?.category] || '#22C55E') + '60' }]}
            onPress={() => router.push('/deal-of-day')}
            activeOpacity={0.85}
          >
            <View style={styles.dealLeft}>
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>DEAL OF THE DAY</Text>
              </View>
              <Text style={styles.dealTitle}>{todayDeal.offer?.title}</Text>
              <View style={styles.dealPriceRow}>
                <Text style={styles.dealPrice}>{Number(todayDeal.deal_price ?? todayDeal.offer?.price).toLocaleString()} ALL</Text>
                {todayDeal.deal_price && todayDeal.deal_price < todayDeal.offer?.price && (
                  <Text style={styles.dealOriginal}>{Number(todayDeal.offer?.price).toLocaleString()}</Text>
                )}
              </View>
              {todayDeal.quantity_limit && (
                <Text style={styles.dealStock}>
                  {todayDeal.quantity_limit - todayDeal.quantity_claimed} spots left
                </Text>
              )}
            </View>
            <Text style={styles.dealArrow}>→</Text>
          </TouchableOpacity>
        </>
      )}

      {/* AI Spotlight — top package */}
      {packages[0] && (
        <>
          <Text style={styles.sectionTitle}>✨ Your AI Pick</Text>
          <View style={styles.spotlightCard}>
            <Text style={styles.spotlightLabel}>🤖 Recommended for you</Text>
            <Text style={styles.spotlightTitle}>{packages[0].title}</Text>
            <Text style={styles.spotlightPrice}>{Number(packages[0].total_price).toLocaleString()} ALL</Text>
            {packages[0].description ? <Text style={styles.spotlightDesc} numberOfLines={2}>{packages[0].description}</Text> : null}
            <TouchableOpacity style={styles.spotlightBtn} onPress={() => router.push(`/packages/${packages[0].id}`)}>
              <Text style={styles.spotlightBtnText}>View Package →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Recommended Packages</Text>
      {packages.length === 0 ? (
        <EmptyState message="No packages available yet." />
      ) : (
        packages.slice(1).map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)
      )}

      <Text style={styles.sectionTitle}>New Drops</Text>
      {offers.length === 0 ? (
        <EmptyState message="No offers available yet." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
          {offers.map((offer) => <OfferCard key={offer.id} offer={offer} compact />)}
        </ScrollView>
      )}

      {challenges.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          {challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { paddingBottom: 100 },
  center: { flex: 1, backgroundColor: '#111111', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 15, color: '#A1A1AA', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, marginTop: 28, marginBottom: 12 },
  horizontal: { paddingHorizontal: 20, gap: 12 },
  dealCard: {
    marginHorizontal: 20, backgroundColor: '#1E1E1E', borderRadius: 16,
    padding: 18, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5,
  },
  dealLeft: { flex: 1 },
  dealBadge: { backgroundColor: '#F59E0B20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  dealBadgeText: { color: '#F59E0B', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dealTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  dealPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  dealPrice: { color: '#22C55E', fontSize: 20, fontWeight: '900' },
  dealOriginal: { color: '#6B7280', fontSize: 13, textDecorationLine: 'line-through' },
  dealStock: { color: '#F59E0B', fontSize: 12, marginTop: 4 },
  dealArrow: { color: '#22C55E', fontSize: 22, fontWeight: '800' },
  spotlightCard: {
    marginHorizontal: 20, backgroundColor: '#22C55E15', borderRadius: 18,
    padding: 20, borderWidth: 1.5, borderColor: '#22C55E40',
  },
  spotlightLabel: { color: '#22C55E', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  spotlightTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  spotlightPrice: { color: '#22C55E', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  spotlightDesc: { color: '#A1A1AA', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  spotlightBtn: { backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  spotlightBtnText: { color: '#111111', fontWeight: '700', fontSize: 14 },
});
