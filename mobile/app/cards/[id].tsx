import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Snowflake, Eye, EyeOff, SlidersHorizontal,
  CreditCard, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardsApi, walletApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Card, Wallet } from '@/types';

interface HistoryItem {
  id: number;
  title: string | null;
  request_type: string;
  total_amount: number;
  currency: string;
  status: string;
  submitted_at: string;
}

function MastercardBadge() {
  return (
    <View style={mc.wrap}>
      <View style={[mc.circle, mc.red]} />
      <View style={[mc.circle, mc.orange]} />
    </View>
  );
}
const mc = StyleSheet.create({
  wrap: { width: 48, height: 30, position: 'relative' },
  circle: { width: 30, height: 30, borderRadius: 15, position: 'absolute', top: 0, opacity: 0.95 },
  red: { backgroundColor: '#E8284A', left: 0 },
  orange: { backgroundColor: '#F79E1B', left: 18 },
});

function formatActivityDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function deriveExpiry(createdAt: string): string {
  const d = new Date(createdAt);
  const expYear = (d.getFullYear() + 4) % 100;
  const expMonth = String(d.getMonth() + 1).padStart(2, '0');
  return `${expMonth} / ${expYear}`;
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [card, setCard] = useState<Card | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    Promise.all([
      cardsApi.list(),
      walletApi.getWallet(),
      walletApi.getHistory(),
    ])
      .then(([cardsRes, walletRes, historyRes]) => {
        const found = cardsRes.data.find((c: Card) => c.id === Number(id));
        if (!found) { router.back(); return; }
        setCard(found);
        setWallet(walletRes.data);
        setHistory(historyRes.data.slice(0, 6));
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleFreeze = () => {
    setFrozen((v) => !v);
    Alert.alert(
      frozen ? 'Card unfrozen' : 'Card frozen',
      frozen
        ? 'Your card is now active again.'
        : 'All transactions on this card have been paused.',
      [{ text: 'OK' }],
    );
  };

  if (loading) return <LoadingState />;
  if (!card) return null;

  const isDebit = card.card_type === 'debit';
  const balance = wallet?.remaining_amount ?? 0;
  const currency = wallet?.currency ?? 'ALL';
  const expiry = deriveExpiry(card.created_at);
  const typeLabel = `${card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)} · Virtual`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Card visual */}
        <View style={[styles.cardVisual, isDebit ? styles.cardLime : styles.cardDark]}>
          {/* Watermark */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.watermarkWrap}>
              {Array.from({ length: 9 }).map((_, i) => (
                <Text key={i} style={[styles.watermarkRow, isDebit ? styles.watermarkLight : styles.watermarkDark]}>
                  {'NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO.'}
                </Text>
              ))}
            </View>
          </View>

          {/* Top row */}
          <View style={styles.cardTopRow}>
            <Text style={[styles.brandLogo, !isDebit && { color: colors.white }]}>P.</Text>
            <MastercardBadge />
          </View>

          {/* Freeze indicator */}
          {frozen && (
            <View style={styles.frozenBanner}>
              <Snowflake size={14} color={colors.white} strokeWidth={2} />
              <Text style={styles.frozenText}>Frozen</Text>
            </View>
          )}

          {/* Bottom */}
          <View style={styles.cardBottom}>
            <Text style={[styles.cardTypeLabel, !isDebit && { color: 'rgba(255,255,255,0.6)' }]}>
              {card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)} Card
            </Text>
            <Text style={[styles.cardNumber, !isDebit && { color: colors.white }]}>
              {'•••• '}{card.last_four}
            </Text>
          </View>
        </View>

        {/* Balance + actions */}
        <View style={styles.infoCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceAmount}>
            {hideBalance ? '•••• ALL' : `${balance.toLocaleString()} ${currency}`}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleFreeze} activeOpacity={0.8}>
              <Snowflake size={22} color={frozen ? colors.info : colors.ink} strokeWidth={1.75} />
              <Text style={styles.actionLabel}>Freeze</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setHideBalance((v) => !v)} activeOpacity={0.8}>
              {hideBalance
                ? <EyeOff size={22} color={colors.ink} strokeWidth={1.75} />
                : <Eye size={22} color={colors.ink} strokeWidth={1.75} />}
              <Text style={styles.actionLabel}>{hideBalance ? 'Show' : 'Hide'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/wallet' as any)} activeOpacity={0.8}>
              <SlidersHorizontal size={22} color={colors.ink} strokeWidth={1.75} />
              <Text style={styles.actionLabel}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card details */}
        <Text style={styles.sectionTitle}>Card details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <CreditCard size={18} color={colors.labelSecondary} strokeWidth={1.5} />
            </View>
            <Text style={styles.detailKey}>Number</Text>
            <Text style={styles.detailVal}>•••• •••• •••• {card.last_four}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailBorder]}>
            <View style={styles.detailIcon}>
              <CreditCard size={18} color={colors.labelSecondary} strokeWidth={1.5} />
            </View>
            <Text style={styles.detailKey}>Type</Text>
            <Text style={styles.detailVal}>{typeLabel}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailBorder]}>
            <View style={styles.detailIcon}>
              <CreditCard size={18} color={colors.labelSecondary} strokeWidth={1.5} />
            </View>
            <Text style={styles.detailKey}>Expires</Text>
            <Text style={styles.detailVal}>{expiry}</Text>
          </View>
        </View>

        {/* Recent activity */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <View style={styles.detailsCard}>
              {history.map((item, i) => {
                const isPositive = item.total_amount < 0;
                const amount = Math.abs(item.total_amount);
                const label = item.title ?? (item.request_type === 'package' ? 'Package benefit' : 'Benefit request');
                const typeStr = item.request_type.replace('_', ' ');
                const dateStr = formatActivityDate(item.submitted_at);

                return (
                  <View key={item.id}>
                    {i > 0 && <View style={styles.detailBorder} />}
                    <View style={styles.activityRow}>
                      <View style={styles.activityIcon}>
                        {isPositive
                          ? <ArrowDownLeft size={18} color={colors.success} strokeWidth={2} />
                          : <ArrowUpRight size={18} color={colors.labelSecondary} strokeWidth={2} />}
                      </View>
                      <View style={styles.activityBody}>
                        <Text style={styles.activityTitle} numberOfLines={1}>{label}</Text>
                        <Text style={styles.activityMeta}>
                          {typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} · {dateStr}
                        </Text>
                      </View>
                      <Text style={[styles.activityAmount, isPositive && { color: colors.success }]}>
                        {isPositive ? '+' : '-'}{amount.toLocaleString()} {item.currency}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
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
  headerTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink },

  content: { paddingHorizontal: spacing.screenX, gap: 16, paddingTop: 4 },

  // Card visual
  cardVisual: {
    borderRadius: radius['2xl'],
    padding: 24,
    height: 220,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardLime: { backgroundColor: colors.lime },
  cardDark: { backgroundColor: colors.ink },
  watermarkWrap: {
    position: 'absolute', top: -20, left: -60, right: -60, bottom: -20,
    transform: [{ rotate: '-20deg' }],
    gap: 6, justifyContent: 'center',
  },
  watermarkRow: { fontSize: 17, fontFamily: fonts.bold, letterSpacing: 1, lineHeight: 30 },
  watermarkLight: { color: 'rgba(160,195,50,0.45)' },
  watermarkDark: { color: 'rgba(255,255,255,0.07)' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLogo: { fontSize: 32, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  frozenBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(74,133,232,0.85)',
    borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 6,
  },
  frozenText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.white },
  cardBottom: { gap: 4 },
  cardTypeLabel: { fontSize: 13, fontFamily: fonts.medium, color: colors.ink, opacity: 0.7 },
  cardNumber: { fontSize: 20, fontFamily: fonts.mono, color: colors.ink, letterSpacing: 2 },

  // Balance card
  infoCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20, gap: 18,
  },
  balanceLabel: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },
  balanceAmount: { fontSize: 36, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -1, marginTop: -4 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: colors.paper, borderRadius: radius.xl,
    paddingVertical: 16, alignItems: 'center', gap: 8,
  },
  actionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.ink },

  sectionTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  // Details card
  detailsCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  detailBorder: { borderTopWidth: 1, borderTopColor: colors.paper },
  detailIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  detailKey: { flex: 1, fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  detailVal: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary },

  // Activity
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  activityBody: { flex: 1, gap: 3 },
  activityTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  activityMeta: { fontSize: 12, fontFamily: fonts.regular, color: colors.labelSecondary },
  activityAmount: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
});
