import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Sparkles, Flame, CircleCheck, Gift, CircleAlert, Bell,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationsApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Notification {
  id: number;
  title: string | null;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

// ─── Type → visual config ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { bg: string; Icon: any }> = {
  ai_pick:          { bg: '#9B8FE8', Icon: Sparkles },
  deal:             { bg: '#F5A623', Icon: Flame },
  request_approved: { bg: '#4CAF50', Icon: CircleCheck },
  shake_reward:     { bg: colors.lime, Icon: Gift },
  wallet_alert:     { bg: '#E8B84B', Icon: CircleAlert },
  info:             { bg: '#7EC8E3', Icon: Bell },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}M`;
  if (hrs < 24) return `${hrs}H`;
  if (days === 1) return 'YESTERDAY';
  return `${days}D`;
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onPress,
}: {
  notif: Notification;
  onPress: () => void;
}) {
  const { bg, Icon } = getConfig(notif.type);
  const title = notif.title ?? notif.type.replace(/_/g, ' ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Icon size={22} color={colors.ink} strokeWidth={1.75} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {!notif.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
        <Text style={styles.time}>{relativeTime(notif.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const ROUTE_MAP: Record<string, string> = {
  ai_pick:          '/(tabs)/ai',
  deal:             '/deal-of-day',
  request_approved: '/(tabs)/profile',
  shake_reward:     '/(tabs)/shake',
  wallet_alert:     '/(tabs)/wallet',
  info:             '/(tabs)/index',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    notificationsApi.list()
      .then((res) => setNotifs(res.data))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      Alert.alert('Error', 'Could not mark notifications as read.');
    }
  };

  const handlePress = async (notif: Notification) => {
    if (!notif.read) {
      notificationsApi.markRead(notif.id).catch(() => {});
      setNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    const route = ROUTE_MAP[notif.type] ?? '/(tabs)/index';
    router.push(route as any);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  if (loading) return <LoadingState />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={handleMarkAll}
          disabled={unreadCount === 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.markAll, unreadCount === 0 && styles.markAllDisabled]}>
            Mark all
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {notifs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Bell size={36} color={colors.labelTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifs.map((n) => (
            <NotifRow key={n.id} notif={n} onPress={() => handlePress(n)} />
          ))
        )}

        {notifs.length > 0 && (
          <View style={styles.caughtUpWrap}>
            <View style={styles.caughtUpPill}>
              <Text style={styles.caughtUpText}>You're all caught up</Text>
            </View>
          </View>
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
  markAll: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  markAllDisabled: { color: colors.labelTertiary },

  list: { paddingHorizontal: spacing.screenX, paddingTop: 8, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 18,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, flex: 1 },
  unreadDot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.lime, flexShrink: 0,
  },
  message: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 20 },
  time: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.labelTertiary, marginTop: 2, letterSpacing: 0.3 },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: fonts.regular, color: colors.labelTertiary },

  caughtUpWrap: { alignItems: 'center', paddingTop: 16 },
  caughtUpPill: {
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  caughtUpText: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary },
});
