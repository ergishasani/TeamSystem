import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Download } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestsApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { BenefitRequest } from '@/types';

type Tab = 'monthly' | 'yearly';

interface Statement {
  key: string;
  label: string;
  approvedCount: number;
  totalAmount: number;
  currency: string;
  isOpen: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildMonthly(requests: BenefitRequest[]): Statement[] {
  const now = new Date();
  const map = new Map<string, { year: number; month: number; requests: BenefitRequest[] }>();

  for (const req of requests) {
    const d = new Date(req.submitted_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) map.set(key, { year: d.getFullYear(), month: d.getMonth(), requests: [] });
    map.get(key)!.requests.push(req);
  }

  return Array.from(map.values())
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .map(({ year, month, requests: reqs }) => {
      const approved = reqs.filter((r) => r.status === 'approved');
      const isOpen = year === now.getFullYear() && month === now.getMonth();
      return {
        key: `${year}-${month}`,
        label: `${MONTH_NAMES[month]} ${year}`,
        approvedCount: approved.length,
        totalAmount: approved.reduce((s, r) => s + r.total_amount, 0),
        currency: reqs[0]?.currency ?? 'ALL',
        isOpen,
      };
    });
}

function buildYearly(requests: BenefitRequest[]): Statement[] {
  const now = new Date();
  const map = new Map<number, BenefitRequest[]>();

  for (const req of requests) {
    const year = new Date(req.submitted_at).getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(req);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, reqs]) => {
      const approved = reqs.filter((r) => r.status === 'approved');
      return {
        key: String(year),
        label: String(year),
        approvedCount: approved.length,
        totalAmount: approved.reduce((s, r) => s + r.total_amount, 0),
        currency: reqs[0]?.currency ?? 'ALL',
        isOpen: year === now.getFullYear(),
      };
    });
}

export default function StatementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('monthly');
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestsApi.myRequests()
      .then((res) => {
        const all: BenefitRequest[] = res.data;
        setStatements(tab === 'monthly' ? buildMonthly(all) : buildYearly(all));
      })
      .catch(() => setStatements([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    requestsApi.myRequests().then((res) => {
      const all: BenefitRequest[] = res.data;
      setStatements(tab === 'monthly' ? buildMonthly(all) : buildYearly(all));
    });
  }, [tab]);

  const handleDownload = (statement: Statement) => {
    Share.share({
      message: `Perka Statement — ${statement.label}\nApproved: ${statement.approvedCount} requests\nTotal: ${statement.totalAmount.toLocaleString()} ${statement.currency}`,
      title: `Perka Statement ${statement.label}`,
    }).catch(() =>
      Alert.alert('PDF Export', `Statement for ${statement.label} — PDF export coming soon.`)
    );
  };

  if (loading) return <LoadingState />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statements</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab toggle */}
      <View style={styles.tabTrack}>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'monthly' && styles.tabPillActive]}
          onPress={() => setTab('monthly')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabLabel, tab === 'monthly' && styles.tabLabelActive]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'yearly' && styles.tabPillActive]}
          onPress={() => setTab('yearly')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabLabel, tab === 'yearly' && styles.tabLabelActive]}>Yearly</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {statements.length === 0 ? (
          <Text style={styles.empty}>No statements yet.</Text>
        ) : (
          statements.map((stmt) => (
            <View key={stmt.key} style={styles.card}>
              {/* Icon */}
              <View style={styles.iconWrap}>
                <FileText size={22} color={colors.labelSecondary} strokeWidth={1.5} />
              </View>

              {/* Label + meta */}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{stmt.label}</Text>
                <Text style={styles.cardMeta}>
                  {stmt.approvedCount} approved · {stmt.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>

              {/* Amount + PDF */}
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>
                  {stmt.totalAmount.toLocaleString()} {stmt.currency}
                </Text>
                <TouchableOpacity
                  style={styles.pdfBtn}
                  onPress={() => handleDownload(stmt)}
                  activeOpacity={0.7}
                >
                  <Download size={13} color={colors.labelSecondary} strokeWidth={2} />
                  <Text style={styles.pdfLabel}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },

  tabTrack: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    marginHorizontal: spacing.screenX,
    marginBottom: 20,
    padding: 4,
    height: 52,
  },
  tabPill: {
    flex: 1, borderRadius: radius.pill,
    justifyContent: 'center', alignItems: 'center',
  },
  tabPillActive: { backgroundColor: colors.ink },
  tabLabel: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  tabLabelActive: { color: colors.white },

  list: { paddingHorizontal: spacing.screenX, gap: 12 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.paper,
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },
  cardMeta: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },

  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardAmount: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pdfLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.labelSecondary },

  empty: {
    textAlign: 'center', marginTop: 60,
    fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary,
  },
});
