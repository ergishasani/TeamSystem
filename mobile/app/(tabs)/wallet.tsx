import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gift, Package, ChevronRight, Heart } from 'lucide-react-native';
import { walletApi, requestsApi } from '@/lib/api';
import { WalletCard } from '@/components/WalletCard';
import { WalletContentSkeleton } from '@/components/Skeleton';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Wallet, BenefitRequest } from '@/types';

type HistoryTab = 'all' | 'active' | 'past';

const ACTIVE_STATUSES = new Set(['pending', 'reviewing']);
const PAST_STATUSES = new Set(['approved', 'rejected', 'cancelled']);

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  reviewing: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Reviewing' },
  approved:  { bg: '#D9F99D', text: '#4D7C0F', label: 'Approved' },
  rejected:  { bg: '#FEE2E2', text: '#DC2626', label: 'Rejected' },
  cancelled: { bg: '#F3F4F6', text: '#9CA3AF', label: 'Cancelled' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [historyTab, setHistoryTab] = useState<HistoryTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, r] = await Promise.all([
        walletApi.getWallet(),
        requestsApi.myRequests(),
      ]);
      setWallet(w.data);
      setRequests(r.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredRequests = requests.filter((r) => {
    if (historyTab === 'active') return ACTIVE_STATUSES.has(r.status);
    if (historyTab === 'past') return PAST_STATUSES.has(r.status);
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Static title — always visible */}
      <View style={[styles.titleRow, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {loading ? <WalletContentSkeleton /> : (
        <>

      {wallet && (
        <WalletCard wallet={wallet} />
      )}

      {/* Donate unused balance nudge */}
      {wallet && wallet.remaining_amount > 0 && (
        <TouchableOpacity
          style={styles.donateNudge}
          onPress={() => router.push('/donate' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.donateIcon}>
            <Heart size={20} color={colors.ink} strokeWidth={2} />
          </View>
          <View style={styles.donateBody}>
            <Text style={styles.donateTitle}>Donate unused balance</Text>
            <Text style={styles.donateSub}>
              {wallet.remaining_amount.toLocaleString()} {wallet.currency} left — give it before it resets
            </Text>
          </View>
          <ChevronRight size={18} color={colors.labelTertiary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* History tabs */}
      <View style={styles.tabTrack}>
        {(['all', 'active', 'past'] as HistoryTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, historyTab === t && styles.tabPillActive]}
            onPress={() => setHistoryTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, historyTab === t && styles.tabLabelActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Request history */}
      <Text style={styles.historyTitle}>Request history</Text>

      {filteredRequests.length === 0 ? (
        <Text style={styles.empty}>No requests yet.</Text>
      ) : (
        <View style={styles.historyCard}>
          {filteredRequests.map((req, index) => {
            const s = STATUS_STYLE[req.status] ?? STATUS_STYLE.cancelled;
            const Icon = req.request_type === 'package' ? Package : Gift;
            const typeLabel = req.request_type === 'package' ? 'Package' : 'Offer';
            return (
              <View key={req.id}>
                {index > 0 && <View style={styles.rowDivider} />}
                <TouchableOpacity
                  style={styles.historyRow}
                  onPress={() => router.push(`/requests/${req.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyIcon}>
                    <Icon size={20} color={colors.labelSecondary} strokeWidth={1.5} />
                  </View>
                  <View style={styles.historyBody}>
                    <Text style={styles.historyRowTitle} numberOfLines={1}>
                      {req.title ?? typeLabel + ' Request'}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {formatDate(req.submitted_at)} · {typeLabel}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      {req.total_amount.toLocaleString()} {req.currency}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.5} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
        </>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  titleRow: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 16,
  },
  content: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
    paddingHorizontal: spacing.screenX,
    marginBottom: 20,
  },
  // Donate nudge
  donateNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    marginHorizontal: spacing.screenX,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  donateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donateBody: { flex: 1, gap: 3 },
  donateTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink, letterSpacing: -0.2 },
  donateSub: { fontSize: 12, fontFamily: fonts.regular, color: colors.labelSecondary },

  // History tab control
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    marginHorizontal: spacing.screenX,
    marginTop: 28,
    marginBottom: 20,
    padding: 4,
    height: 48,
  },
  tabPill: {
    flex: 1,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: colors.ink,
  },
  tabLabel: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.labelSecondary,
  },
  tabLabelActive: {
    color: colors.white,
  },

  historyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
    marginHorizontal: spacing.screenX,
    marginBottom: 14,
  },

  // Grouped history card
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    marginHorizontal: spacing.screenX,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.paper,
    marginHorizontal: 16,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyBody: {
    flex: 1,
    gap: 3,
  },
  historyRowTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  historyMeta: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  historyAmount: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  empty: {
    color: colors.labelSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
