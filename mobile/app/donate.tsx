import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { charitiesApi, walletApi, requestsApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Charity, Wallet } from '@/types';

const PERCENTS = [
  { label: '25%', value: 25 },
  { label: '50%', value: 50 },
  { label: 'All', value: 100 },
];

const CATEGORY_COLOR: Record<string, string> = {
  environment: '#6db347', education: '#4a85e8', health: '#ff9aa8',
  community: '#c9a8ff', animals: '#ffb86b', children: '#ffd66b', other: '#a1a4ab',
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function DonateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [charities, setCharities] = useState<Charity[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Charity | null>(null);
  const [percent, setPercent] = useState(25);

  const load = useCallback(async () => {
    try {
      const [c, w] = await Promise.all([charitiesApi.list(), walletApi.getWallet()]);
      setCharities(c.data);
      setWallet(w.data);
    } catch {
      setCharities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remaining = wallet?.remaining_amount ?? 0;
  const currency = wallet?.currency ?? 'ALL';
  const amount = percent === 100 ? remaining : round2((remaining * percent) / 100);

  const handleDonate = async () => {
    if (!selected) return;
    if (remaining <= 0) {
      Alert.alert('No balance', 'You have no remaining wallet balance to donate this month.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestsApi.donate(
        percent === 100
          ? { charity_id: selected.id, donate_full_remaining: true }
          : { charity_id: selected.id, amount },
      );
      const approved = res.data?.status === 'approved';
      Alert.alert(
        approved ? 'Thank you for giving back! 💚' : 'Donation submitted',
        approved
          ? `${amount.toLocaleString()} ${currency} donated to ${selected.name}.`
          : `Your ${amount.toLocaleString()} ${currency} donation to ${selected.name} is pending employer approval.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Donation failed', err?.response?.data?.detail ?? 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donate</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screenX, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Donation amount</Text>
          <Text style={styles.amountValue}>
            {amount.toLocaleString()} <Text style={styles.amountCurrency}>{currency}</Text>
          </Text>
          <Text style={styles.remainingHint}>
            {remaining.toLocaleString()} {currency} unused this month
          </Text>
        </View>

        {/* Percent pills */}
        <View style={styles.quickRow}>
          {PERCENTS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.quickPill, percent === p.value && styles.quickPillActive]}
              onPress={() => setPercent(p.value)}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickPillText, percent === p.value && styles.quickPillTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Charity picker */}
        <Text style={styles.sectionLabel}>Choose a charity</Text>
        {charities.length === 0 ? (
          <EmptyState
            title="No charities available"
            message="Charity donations aren't enabled for your company yet."
          />
        ) : (
          <View style={styles.listCard}>
            {charities.map((c, i) => {
              const active = selected?.id === c.id;
              const tint = CATEGORY_COLOR[c.category] ?? colors.labelTertiary;
              return (
                <View key={c.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={[styles.row, active && styles.rowSelected]}
                    onPress={() => setSelected(c)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.charityIcon, { backgroundColor: tint + '33' }]}>
                      <Heart size={20} color={tint} strokeWidth={2} />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowName} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.rowCat}>
                        {c.category}{c.is_platform_wide ? ' · Platform charity' : ''}
                      </Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <Check size={14} color={colors.ink} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.donateBtn, (!selected || submitting || remaining <= 0) && styles.donateBtnDisabled]}
          onPress={handleDonate}
          disabled={!selected || submitting || remaining <= 0}
          activeOpacity={0.9}
        >
          {submitting
            ? <ActivityIndicator color={colors.ink} size="small" />
            : (
              <Text style={styles.donateBtnText}>
                {selected ? `Donate ${amount.toLocaleString()} ${currency}` : 'Pick a charity'}
              </Text>
            )}
        </TouchableOpacity>
      </View>
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

  amountCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center', gap: 6, marginTop: 8,
  },
  amountLabel: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelTertiary },
  amountValue: { fontSize: 48, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -2 },
  amountCurrency: { fontSize: 48, fontFamily: fonts.bold, color: colors.ink },
  remainingHint: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },

  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickPill: {
    flex: 1, height: 52, borderRadius: radius.pill,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  quickPillActive: { backgroundColor: colors.ink },
  quickPillText: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  quickPillTextActive: { color: colors.white },

  sectionLabel: {
    fontSize: 18, fontFamily: fonts.bold, color: colors.ink,
    letterSpacing: -0.3, marginTop: 28, marginBottom: 14,
  },

  listCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.paper, marginHorizontal: 18 },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  rowSelected: { backgroundColor: colors.lime + '22' },

  charityIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, gap: 3 },
  rowName: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  rowCat: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary, textTransform: 'capitalize' },

  radio: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: colors.surface3, justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { backgroundColor: colors.lime, borderColor: colors.lime },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenX, paddingTop: 12, backgroundColor: colors.paper,
  },
  donateBtn: {
    height: 60, borderRadius: radius.pill,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  donateBtnDisabled: { opacity: 0.5 },
  donateBtnText: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },
});
