import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { walletApi } from '@/lib/api';
import { WalletCard } from '@/components/WalletCard';
import type { Wallet, BenefitRequest } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
  cancelled: '#6B7280',
};

export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<BenefitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [w, h] = await Promise.all([walletApi.getWallet(), walletApi.getHistory()]);
        setWallet(w.data);
        setHistory(h.data);
      } catch (err) {
        console.error(err);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Wallet</Text>

      {wallet && <WalletCard wallet={wallet} />}

      <Text style={styles.sectionTitle}>Request History</Text>
      {history.length === 0 ? (
        <Text style={styles.empty}>No requests yet.</Text>
      ) : (
        history.map((req) => (
          <View key={req.id} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyType}>{req.request_type === 'package' ? '📦 Package' : '🎁 Offer'}</Text>
              <Text style={styles.historyDate}>{new Date(req.submitted_at).toLocaleDateString('sq-AL')}</Text>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyAmount}>{req.total_amount.toLocaleString()} {req.currency}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[req.status] + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[req.status] }]}>{req.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { paddingBottom: 100 },
  center: { flex: 1, backgroundColor: '#111111', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, marginTop: 28, marginBottom: 12 },
  empty: { color: '#A1A1AA', textAlign: 'center', marginTop: 20 },
  historyItem: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {},
  historyType: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  historyDate: { color: '#A1A1AA', fontSize: 12, marginTop: 4 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
