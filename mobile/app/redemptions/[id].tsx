import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { redemptionsApi } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingState } from '@/components/LoadingState';
import type { Redemption } from '@/types';

const STATUS_CONFIG = {
  active: { color: '#22C55E', icon: CheckCircle, label: 'Active — Ready to Redeem' },
  redeemed: { color: '#A1A1AA', icon: CheckCircle, label: 'Already Redeemed' },
  expired: { color: '#EF4444', icon: XCircle, label: 'Expired' },
};

export default function RedemptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    redemptionsApi.getById(Number(id))
      .then((res) => setRedemption(res.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (!redemption) return null;

  const config = STATUS_CONFIG[redemption.status] || STATUS_CONFIG.active;
  const Icon = config.icon;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Redemption" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Icon size={48} color={config.color} />
          <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
        </View>

        {/* QR Code display — replace with react-native-qrcode-svg when ready */}
        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrCode}>{redemption.qr_code}</Text>
          </View>
          <Text style={styles.qrHint}>Show this code to the provider to redeem your benefit</Text>
        </View>

        <View style={styles.details}>
          <Row label="Redemption ID" value={`#${redemption.id}`} />
          <Row label="Offer" value={`Offer #${redemption.offer_id}`} />
          <Row label="Status" value={redemption.status} />
          {redemption.expires_at && (
            <Row label="Expires" value={new Date(redemption.expires_at).toLocaleDateString()} />
          )}
          {redemption.redeemed_at && (
            <Row label="Redeemed At" value={new Date(redemption.redeemed_at).toLocaleString()} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { padding: 20, paddingBottom: 60, alignItems: 'center' },
  statusCard: { alignItems: 'center', marginVertical: 32 },
  statusLabel: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  qrContainer: { width: '100%', alignItems: 'center', marginBottom: 32 },
  qrPlaceholder: {
    width: 200, height: 200, backgroundColor: '#FFFFFF',
    borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 12,
  },
  qrCode: { fontSize: 10, color: '#111111', fontFamily: 'monospace', textAlign: 'center', fontWeight: '700' },
  qrHint: { color: '#A1A1AA', fontSize: 13, textAlign: 'center', marginTop: 12 },
  details: { width: '100%', backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  rowLabel: { color: '#A1A1AA', fontSize: 14 },
  rowValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
