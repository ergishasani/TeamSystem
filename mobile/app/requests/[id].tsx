import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Package, Sparkles, Calendar, Gift, ChevronRight, Check,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestsApi, redemptionsApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { BenefitRequest } from '@/types';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: colors.ink,          text: colors.white,          label: 'Pending' },
  approved:  { bg: colors.lime,         text: colors.ink,            label: 'Approved' },
  rejected:  { bg: '#FFE5E5',           text: '#D94F4F',             label: 'Rejected' },
  cancelled: { bg: colors.paper,        text: colors.labelSecondary, label: 'Cancelled' },
};

// ─── Timeline ─────────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'submitted', label: 'Submitted',    sub: 'Your request was received' },
  { key: 'review',    label: 'Under review', sub: 'An admin is reviewing your request' },
  { key: 'done',      label: 'Approved',     sub: 'Redemption ready' },
];

function stepsDone(status: string): number {
  if (status === 'pending')   return 1;
  if (status === 'approved')  return 3;
  if (status === 'rejected')  return 2;
  if (status === 'cancelled') return 1;
  return 1;
}

function Timeline({ status }: { status: string }) {
  const done = stepsDone(status);
  const steps = status === 'rejected'
    ? [
        STEPS[0],
        STEPS[1],
        { key: 'done', label: 'Rejected', sub: 'Request was declined' },
      ]
    : STEPS;

  return (
    <View style={tl.card}>
      {steps.map((step, i) => {
        const active = i < done;
        return (
          <View key={step.key} style={tl.stepWrap}>
            {/* Vertical line above (except first) */}
            {i > 0 && (
              <View style={[tl.line, i <= done - 1 && tl.lineActive]} />
            )}
            <View style={tl.row}>
              <View style={[tl.circle, active && tl.circleActive]}>
                {active && <Check size={14} color={colors.ink} strokeWidth={3} />}
              </View>
              <View style={tl.textWrap}>
                <Text style={[tl.label, active && tl.labelActive]}>{step.label}</Text>
                <Text style={tl.sub}>{step.sub}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const tl = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20, gap: 0 },
  stepWrap: { position: 'relative' },
  line: {
    position: 'absolute', left: 19, top: -16, width: 2, height: 18,
    backgroundColor: colors.paper,
  },
  lineActive: { backgroundColor: colors.lime },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 },
  circle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.paper,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  circleActive: { backgroundColor: colors.lime },
  textWrap: { flex: 1, gap: 3, paddingTop: 4 },
  label: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary },
  labelActive: { fontFamily: fonts.bold, color: colors.ink },
  sub: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary, lineHeight: 18 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<BenefitRequest | null>(null);
  const [redemptionId, setRedemptionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const rid = Number(id);
    requestsApi.getById(rid)
      .then((res) => {
        setRequest(res.data);
        if (res.data.status === 'approved') {
          return redemptionsApi.byRequest(rid).then((r) => {
            if (r.data.length > 0) setRedemptionId(r.data[0].id);
          }).catch(() => {});
        }
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = () => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Request', style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const res = await requestsApi.cancel(Number(id));
            setRequest(res.data);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.detail ?? 'Cancel failed');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;
  if (!request) return null;

  const badge = STATUS_BADGE[request.status] ?? STATUS_BADGE.pending;
  const title = request.title ?? (request.request_type === 'package' ? 'Package Request' : 'Offer Request');
  const submittedDate = new Date(request.submitted_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <View style={styles.typeIconWrap}>
                <Package size={18} color={colors.labelSecondary} strokeWidth={1.75} />
              </View>
              <View>
                <Text style={styles.typeLabel}>
                  {request.request_type === 'package' ? 'PACKAGE' : 'OFFER'}
                </Text>
                <Text style={styles.heroTitle}>{title}</Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <Text style={styles.amountLabel}>AMOUNT</Text>
          <Text style={styles.amountValue}>
            {request.total_amount.toLocaleString()} {request.currency}
          </Text>
        </View>

        {/* Progress */}
        <Text style={styles.sectionCaps}>PROGRESS</Text>
        <Timeline status={request.status} />

        {/* AI reason */}
        {request.ai_reason && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Sparkles size={13} color={colors.labelTertiary} strokeWidth={2} />
              <Text style={styles.aiHeaderText}>WHY WE SUGGESTED THIS</Text>
            </View>
            <Text style={styles.aiQuote}>"{request.ai_reason}"</Text>
          </View>
        )}

        {/* Rejection reason */}
        {request.rejection_reason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionLabel}>REASON FOR REJECTION</Text>
            <Text style={styles.rejectionText}>{request.rejection_reason}</Text>
          </View>
        )}

        {/* Details */}
        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={18} color={colors.labelSecondary} strokeWidth={1.75} />
            </View>
            <Text style={styles.detailName}>Submitted</Text>
            <Text style={styles.detailValue}>{submittedDate}</Text>
          </View>
        </View>

        {/* View redemption */}
        {request.status === 'approved' && (
          <TouchableOpacity
            style={styles.redemptionRow}
            onPress={() => {
              if (redemptionId) router.push(`/redemptions/${redemptionId}` as any);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.redemptionIcon}>
              <Gift size={22} color={colors.ink} strokeWidth={1.75} />
            </View>
            <Text style={styles.redemptionText}>View redemption</Text>
            <ChevronRight size={17} color={colors.labelTertiary} strokeWidth={1.75} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cancel footer */}
      {request.status === 'pending' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.85}
          >
            {cancelling
              ? <ActivityIndicator color="#D94F4F" size="small" />
              : <Text style={styles.cancelText}>Cancel Request</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },

  content: { paddingHorizontal: spacing.screenX, paddingTop: 4, gap: 14 },

  // Hero
  heroCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  heroLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  typeIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  typeLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 0.8 },
  heroTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3, marginTop: 2 },
  statusPill: {
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: 'flex-start', flexShrink: 0,
  },
  statusText: { fontSize: 13, fontFamily: fonts.bold },
  heroDivider: { height: 1, backgroundColor: colors.paper, marginVertical: 16 },
  amountLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 0.8, marginBottom: 4 },
  amountValue: { fontSize: 38, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -1 },

  sectionCaps: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 1 },
  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  // AI card
  aiCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20, gap: 12 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiHeaderText: { fontSize: 11, fontFamily: fonts.bold, color: colors.labelTertiary, letterSpacing: 1 },
  aiQuote: { fontSize: 17, fontFamily: fonts.regular, color: colors.ink, lineHeight: 26, fontStyle: 'italic' },

  // Rejection
  rejectionCard: {
    backgroundColor: '#FFF5F5', borderRadius: radius['2xl'], padding: 18,
    borderLeftWidth: 3, borderLeftColor: '#D94F4F', gap: 6,
  },
  rejectionLabel: { fontSize: 11, fontFamily: fonts.bold, color: '#D94F4F', letterSpacing: 0.8 },
  rejectionText: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 20 },

  // Details
  detailsCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  detailIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  detailName: { flex: 1, fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  detailValue: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary },

  // View redemption row
  redemptionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16,
  },
  redemptionIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  redemptionText: { flex: 1, fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink },

  // Footer cancel
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenX, paddingTop: 12,
    backgroundColor: colors.paper,
  },
  cancelBtn: {
    height: 56, borderRadius: radius.pill,
    backgroundColor: '#FFE5E5', justifyContent: 'center', alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontFamily: fonts.bold, color: '#D94F4F' },
});
