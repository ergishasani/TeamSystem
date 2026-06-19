import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { walletApi, offersApi, packagesApi, challengesApi } from '@/lib/api';
import { WalletCard } from '@/components/WalletCard';
import { PackageCard } from '@/components/PackageCard';
import { OfferCard } from '@/components/OfferCard';
import { ChallengeCard } from '@/components/ChallengeCard';
import { EmptyState } from '@/components/EmptyState';
import type { Wallet, Package, Offer, Challenge } from '@/types';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
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

      <Text style={styles.sectionTitle}>Recommended Packages</Text>
      {packages.length === 0 ? (
        <EmptyState message="No packages available yet." />
      ) : (
        packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)
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
});
