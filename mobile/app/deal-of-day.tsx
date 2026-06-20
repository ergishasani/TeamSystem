import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, MapPin, Users } from 'lucide-react-native';
import { dealsApi, requestsApi } from '@/lib/api';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingState } from '@/components/LoadingState';

const CATEGORY_COLORS: Record<string, string> = {
  wellness: '#8B5CF6', fitness: '#F59E0B', food: '#EF4444',
  travel: '#3B82F6', learning: '#06B6D4', health: '#22C55E',
};

export default function DealOfDayScreen() {
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    dealsApi.today()
      .then((res) => setDeal(res.data))
      .catch(() => setDeal(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async () => {
    if (!deal) return;
    Alert.alert(
      "Today's Deal",
      `Request "${deal.offer.title}" for ${(deal.deal_price ?? deal.offer.price).toLocaleString()} ALL?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            setRequesting(true);
            try {
              const res = await requestsApi.create({ offer_id: deal.offer_id, request_type: 'single_offer' });
              Alert.alert('Submitted!', 'Your request is pending approval.', [
                { text: 'View', onPress: () => router.push(`/requests/${res.data.id}`) },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.detail || 'Request failed');
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingState />;

  if (!deal) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Today's Drop" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No deal today. Check back tomorrow!</Text>
        </View>
      </View>
    );
  }

  const offer = deal.offer;
  const color = CATEGORY_COLORS[offer.category] || '#22C55E';
  const dealPrice = deal.deal_price ?? offer.price;
  const originalPrice = Number(offer.price);
  const hasDiscount = dealPrice < originalPrice;
  const remaining = deal.quantity_limit ? deal.quantity_limit - deal.quantity_claimed : null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Today's Drop 🔥" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: color + '25' }]}>
          <Text style={styles.bannerLabel}>DEAL OF THE DAY</Text>
          <Text style={styles.bannerEmoji}>🌟</Text>
        </View>

        <View style={styles.body}>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{offer.category}</Text>
          </View>
          <Text style={styles.offerTitle}>{offer.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.dealPrice}>{Number(dealPrice).toLocaleString()} ALL</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{originalPrice.toLocaleString()} ALL</Text>
            )}
          </View>

          {hasDiscount && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>
                You save {(originalPrice - Number(dealPrice)).toLocaleString()} ALL
              </Text>
            </View>
          )}

          {offer.description ? <Text style={styles.description}>{offer.description}</Text> : null}

          <View style={styles.metaRow}>
            <MapPin size={14} color="#A1A1AA" />
            <Text style={styles.metaText}>{offer.city}</Text>
          </View>

          {remaining !== null && (
            <View style={styles.metaRow}>
              <Users size={14} color="#A1A1AA" />
              <Text style={styles.metaText}>{remaining} spots remaining</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Clock size={14} color="#F59E0B" />
            <Text style={[styles.metaText, { color: '#F59E0B' }]}>Available today only</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={`Claim Deal · ${Number(dealPrice).toLocaleString()} ALL`}
          onPress={handleRequest}
          loading={requesting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { paddingBottom: 120 },
  banner: { height: 200, justifyContent: 'center', alignItems: 'center' },
  bannerLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 13, letterSpacing: 3, opacity: 0.6 },
  bannerEmoji: { fontSize: 72, marginTop: 8 },
  body: { padding: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  offerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 8 },
  dealPrice: { fontSize: 32, fontWeight: '900', color: '#22C55E' },
  originalPrice: { fontSize: 18, color: '#6B7280', textDecorationLine: 'line-through' },
  savingsBadge: { backgroundColor: '#22C55E20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  savingsText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  description: { color: '#A1A1AA', fontSize: 15, lineHeight: 24, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metaText: { color: '#A1A1AA', fontSize: 14 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { color: '#A1A1AA', fontSize: 16 },
});
