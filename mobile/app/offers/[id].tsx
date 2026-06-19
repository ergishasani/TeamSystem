import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Tag, Calendar } from 'lucide-react-native';
import { offersApi, requestsApi } from '@/lib/api';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingState } from '@/components/LoadingState';
import type { Offer } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  wellness: '#8B5CF6', fitness: '#F59E0B', food: '#EF4444',
  travel: '#3B82F6', learning: '#06B6D4', health: '#22C55E',
};

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    offersApi.getById(Number(id))
      .then((res) => setOffer(res.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async () => {
    if (!offer) return;
    Alert.alert('Request Benefit', `Request "${offer.title}" for ${offer.price.toLocaleString()} ${offer.currency}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request',
        onPress: async () => {
          setRequesting(true);
          try {
            const res = await requestsApi.create({ offer_id: offer.id, request_type: 'single_offer' });
            Alert.alert('Submitted!', 'Your request is now pending employer approval.', [
              { text: 'View Request', onPress: () => router.push(`/requests/${res.data.id}`) },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.detail || 'Request failed');
          } finally {
            setRequesting(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;
  if (!offer) return null;

  const color = CATEGORY_COLORS[offer.category] || '#22C55E';

  return (
    <View style={styles.container}>
      <ScreenHeader title={offer.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.imagePlaceholder, { backgroundColor: color + '30' }]}>
          <Text style={[styles.categoryEmoji, { color }]}>{offer.category.toUpperCase()}</Text>
        </View>

        <View style={styles.body}>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{offer.category}</Text>
          </View>

          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.price}>{offer.price.toLocaleString()} {offer.currency}</Text>

          {offer.description && <Text style={styles.description}>{offer.description}</Text>}

          <View style={styles.metaRow}>
            <MapPin size={14} color="#A1A1AA" />
            <Text style={styles.metaText}>{offer.city}, {offer.country}</Text>
          </View>
          {offer.valid_until && (
            <View style={styles.metaRow}>
              <Calendar size={14} color="#A1A1AA" />
              <Text style={styles.metaText}>Valid until {new Date(offer.valid_until).toLocaleDateString()}</Text>
            </View>
          )}
          {offer.is_limited_drop && (
            <View style={styles.limitedBadge}>
              <Text style={styles.limitedText}>⚡ Limited Drop</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title={`Request · ${offer.price.toLocaleString()} ${offer.currency}`} onPress={handleRequest} loading={requesting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { paddingBottom: 120 },
  imagePlaceholder: { height: 220, justifyContent: 'center', alignItems: 'center' },
  categoryEmoji: { fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  body: { padding: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: '900', color: '#22C55E', marginBottom: 16 },
  description: { color: '#A1A1AA', fontSize: 15, lineHeight: 24, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metaText: { color: '#A1A1AA', fontSize: 14 },
  limitedBadge: { backgroundColor: '#F59E0B20', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-start' },
  limitedText: { color: '#F59E0B', fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A' },
});
