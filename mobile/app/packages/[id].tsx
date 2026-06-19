import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { packagesApi, requestsApi } from '@/lib/api';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingState } from '@/components/LoadingState';
import type { Package } from '@/types';

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
    if (!pkg) return;
    Alert.alert('Submit Request', `Submit package "${pkg.title}" for ${pkg.total_price.toLocaleString()} ${pkg.currency}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          setRequesting(true);
          try {
            const res = await requestsApi.create({ package_id: pkg.id, request_type: 'package', ai_reason: pkg.ai_reason ?? undefined });
            Alert.alert('Submitted!', 'Your request is pending employer approval.', [
              { text: 'Track Request', onPress: () => router.push(`/requests/${res.data.id}`) },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.detail || 'Submission failed');
          } finally {
            setRequesting(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;
  if (!pkg) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader title={pkg.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{pkg.title}</Text>
          <Text style={styles.heroPrice}>{pkg.total_price.toLocaleString()} {pkg.currency}</Text>
          {pkg.description && <Text style={styles.heroDesc}>{pkg.description}</Text>}
        </View>

        {pkg.ai_reason && (
          <View style={styles.aiCard}>
            <Text style={styles.aiLabel}>🤖 AI Reasoning</Text>
            <Text style={styles.aiText}>{pkg.ai_reason}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Included Offers ({pkg.items.length})</Text>
        {pkg.items.map((item, idx) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemNum}>#{idx + 1}</Text>
            <View style={styles.itemBody}>
              <Text style={styles.itemOfferText}>Offer #{item.offer_id}</Text>
              <Text style={styles.itemPrice}>{item.price_share.toLocaleString()} ALL</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title={`Submit Request · ${pkg.total_price.toLocaleString()} ${pkg.currency}`} onPress={handleRequest} loading={requesting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { paddingBottom: 120 },
  hero: { backgroundColor: '#1E1E1E', padding: 24, margin: 20, borderRadius: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  heroPrice: { fontSize: 32, fontWeight: '900', color: '#22C55E', marginBottom: 12 },
  heroDesc: { color: '#A1A1AA', fontSize: 15, lineHeight: 22 },
  aiCard: { backgroundColor: '#22C55E10', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 24, borderWidth: 1, borderColor: '#22C55E30' },
  aiLabel: { color: '#22C55E', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  aiText: { color: '#A1A1AA', fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 12 },
  itemCard: { backgroundColor: '#1E1E1E', marginHorizontal: 20, marginBottom: 8, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemNum: { color: '#22C55E', fontWeight: '800', fontSize: 16, width: 24 },
  itemBody: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemOfferText: { color: '#FFFFFF', fontSize: 15 },
  itemPrice: { color: '#22C55E', fontWeight: '700', fontSize: 15 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A' },
});
