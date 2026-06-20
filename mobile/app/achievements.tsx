import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Flame, Heart, Dumbbell, Coffee,
  BookOpen, Plane, Sparkles, Award, Lock,
} from 'lucide-react-native';
import { usersApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Stats {
  xp: number;
  level: number;
  streak_count: number;
  rank: number | null;
  redemption_count: number;
}

interface Badge {
  id: string;
  label: string;
  icon: any;
  bg: string;
  unlocked: (s: Stats) => boolean;
}

const BADGES: Badge[] = [
  { id: 'streak7',     label: '7-day streak',  icon: Flame,    bg: '#FDBA74', unlocked: (s) => s.streak_count >= 7 },
  { id: 'first_swipe', label: 'First swipe',   icon: Heart,    bg: '#C4B5FD', unlocked: (s) => s.xp > 0 },
  { id: 'move_week',   label: 'Move week',     icon: Dumbbell, bg: '#CAED64', unlocked: (s) => s.redemption_count >= 1 },
  { id: 'local_taste', label: 'Local taste',   icon: Coffee,   bg: '#FDBA74', unlocked: (s) => s.redemption_count >= 2 },
  { id: 'learner',     label: 'Learner',       icon: BookOpen, bg: '#FDE68A', unlocked: (s) => s.redemption_count >= 5 },
  { id: 'explorer',    label: 'Explorer',      icon: Plane,    bg: '#93C5FD', unlocked: (s) => s.xp >= 5000 },
  { id: 'ai_believer', label: 'AI Believer',   icon: Sparkles, bg: '#CAED64', unlocked: (s) => s.xp >= 8000 },
  { id: 'top10',       label: 'Top 10',        icon: Award,    bg: '#FBCFE8', unlocked: (s) => (s.rank ?? 999) <= 10 },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.myStats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const earned = stats ? BADGES.filter((b) => b.unlocked(stats)).length : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lime} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Counter card */}
          <View style={styles.counterCard}>
            <Text style={styles.counterText}>
              <Text style={styles.counterNum}>{earned}</Text>
              <Text style={styles.counterTotal}> / {BADGES.length}</Text>
            </Text>
            <Text style={styles.counterSub}>
              Badges earned. Keep using Perka to unlock the rest.
            </Text>
          </View>

          {/* All badges */}
          <Text style={styles.sectionLabel}>All badges</Text>
          <View style={styles.grid}>
            {BADGES.map((badge) => {
              const unlocked = stats ? badge.unlocked(stats) : false;
              const Icon = badge.icon;
              return (
                <View key={badge.id} style={styles.badgeCard}>
                  <View style={styles.iconWrap}>
                    <View style={[
                      styles.iconCircle,
                      { backgroundColor: unlocked ? badge.bg : '#E5E7EB' },
                    ]}>
                      <Icon
                        size={32}
                        color={unlocked ? 'rgba(0,0,0,0.55)' : '#9CA3AF'}
                        strokeWidth={1.5}
                      />
                    </View>
                    {!unlocked && (
                      <View style={styles.lockOverlay}>
                        <Lock size={14} color={colors.labelTertiary} strokeWidth={2} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]}>
                    {badge.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.screenX, gap: 20, paddingTop: 4 },

  // Counter card
  counterCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 24, gap: 8,
  },
  counterText: { lineHeight: 52 },
  counterNum: { fontSize: 52, fontFamily: fonts.bold, color: colors.ink },
  counterTotal: { fontSize: 36, fontFamily: fonts.bold, color: colors.labelTertiary },
  counterSub: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary },

  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },

  // Grid — 3 columns
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: {
    width: '30%',
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 16, alignItems: 'center', gap: 10,
    flexGrow: 1,
  },
  iconWrap: { position: 'relative', width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34,
    justifyContent: 'center', alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2,
  },
  badgeLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.ink, textAlign: 'center' },
  badgeLabelLocked: { color: colors.labelTertiary },
});
