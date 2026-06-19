import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { requestsApi } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RequestStatusTimeline } from '@/components/RequestStatusTimeline';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState } from '@/components/LoadingState';
import type { BenefitRequest } from '@/types';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<BenefitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    requestsApi.getById(Number(id))
      .then((res) => setRequest(res.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Request',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const res = await requestsApi.cancel(Number(id));
            setRequest(res.data);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.detail || 'Cancel failed');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;
  if (!request) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Request Details" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{request.request_type === 'package' ? '📦 Package' : '🎁 Single Offer'}</Text>

          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>{request.total_amount.toLocaleString()} {request.currency}</Text>

          <Text style={styles.label}>Submitted</Text>
          <Text style={styles.value}>{new Date(request.submitted_at).toLocaleString()}</Text>

          {request.ai_reason && (
            <>
              <Text style={styles.label}>AI Reason</Text>
              <Text style={styles.value}>{request.ai_reason}</Text>
            </>
          )}

          {request.rejection_reason && (
            <>
              <Text style={styles.label}>Rejection Reason</Text>
              <Text style={[styles.value, { color: '#EF4444' }]}>{request.rejection_reason}</Text>
            </>
          )}
        </View>

        <RequestStatusTimeline request={request} />

        {request.status === 'approved' && (
          <PrimaryButton
            title="View Redemptions"
            onPress={() => router.push('/redemptions/' + request.id)}
            style={styles.actionBtn}
          />
        )}
      </ScrollView>

      {request.status === 'pending' && (
        <View style={styles.footer}>
          <PrimaryButton title="Cancel Request" onPress={handleCancel} loading={cancelling} variant="danger" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20, marginBottom: 24 },
  label: { color: '#A1A1AA', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16 },
  value: { color: '#FFFFFF', fontSize: 15, marginTop: 4 },
  amount: { fontSize: 28, fontWeight: '900', color: '#22C55E', marginTop: 4 },
  actionBtn: { marginTop: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A' },
});
