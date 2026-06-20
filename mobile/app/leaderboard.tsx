import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Trophy, TrendingUp } from 'lucide-react-native';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Entry {
  rank: number;
  user_id: number;
  full_name: string;
  department: string | null;
  xp: number;
  is_me: boolean;
}

const TABS = ['Company', 'Team', 'Friends'] as const;
type Tab = typeof TABS[number];

function abbrev(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return parts[0];
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<Tab>('Company');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.leaderboard()
      .then((r) => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const me = entries.find((e) => e.is_me);
  const above = me ? entries.find((e) => e.rank === (me.rank) - 1) : null;
  const xpGap = me && above ? above.xp - me.xp : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.hero}>
          <Trophy size={34} color={colors.lime} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>
            You're #{me?.rank ?? '—'} this month
          </Text>
          {me && above ? (
            <Text style={styles.heroSub}>
              {xpGap} XP behind {above.full_name.split(' ')[0]} · keep going
            </Text>
          ) : me?.rank === 1 ? (
            <Text style={styles.heroSub}>You're at the top! Keep it up 🏆</Text>
          ) : null}
          <View style={styles.heroBadge}>
            <TrendingUp size={14} color={colors.ink} strokeWidth={2.5} />
            <Text style={styles.heroBadgeText}>+12% vs last month</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.lime} />
          </View>
        ) : (
          <View style={styles.card}>
            {entries.map((entry, idx) => (
              <View key={entry.user_id}>
                <View style={[styles.row, entry.is_me && styles.rowMe]}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{entry.rank}</Text>
                  </View>
                  <View style={styles.nameBlock}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{abbrev(entry.full_name)}</Text>
                      {entry.is_me && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.dept}>{entry.department ?? 'Employee'}</Text>
                  </View>
                  <Text style={styles.xp}>
                    <Text style={styles.xpNum}>{entry.xp.toLocaleString('en-US')}</Text>
                    <Text style={styles.xpLabel}> XP</Text>
                  </Text>
                </View>
                {idx < entries.length - 1 && !entry.is_me && !entries[idx + 1]?.is_me && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.screenX, paddingVertical: 14,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.07, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: fonts.bold, color: colors.ink },
  headerRight: { width: 44 },
  center: { paddingVertical: 40, alignItems: 'center' },
  content: { paddingHorizontal: spacing.screenX, gap: 16, paddingTop: 4 },

  // Hero
  hero: {
    backgroundColor: colors.ink, borderRadius: radius['2xl'],
    padding: 24, gap: 8,
  },
  heroTitle: { fontSize: 26, fontFamily: fonts.bold, color: colors.white, marginTop: 6 },
  heroSub: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.lime, borderRadius: radius.pill,
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, marginTop: 4,
  },
  heroBadgeText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink },

  // Tabs
  tabs: {
    flexDirection: 'row', backgroundColor: colors.paper,
    borderRadius: radius.pill, padding: 4,
    borderWidth: 1, borderColor: colors.separator,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.ink },
  tabText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  tabTextActive: { color: colors.white },

  // Entries card
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 14 },
  rowMe: { backgroundColor: '#F5FAE8' },
  rankCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rankText: { fontSize: 14, fontFamily: fonts.bold, color: colors.labelSecondary },
  nameBlock: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  youBadge: {
    backgroundColor: colors.ink, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  youBadgeText: { fontSize: 10, fontFamily: fonts.bold, color: colors.white, letterSpacing: 0.5 },
  dept: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },
  xp: { flexShrink: 0 },
  xpNum: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  xpLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  divider: { height: 1, backgroundColor: colors.paper, marginLeft: 68 },
});
