import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, Platform, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight, Pencil, User, Mail, Phone, MapPin,
  Bookmark, Star, Trophy, Award,
  Bell, Globe, ShieldCheck, Settings,
  CircleHelp, LogOut,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { usersApi, offersApi, onboardingApi } from '@/lib/api';
import { ProfileContentSkeleton } from '@/components/Skeleton';
import { colors, fonts, radius, spacing } from '@/lib/theme';

// ─── Row component ────────────────────────────────────────────────────────────

function Row({
  icon: Icon,
  iconBg,
  label,
  value,
  onPress,
  danger,
  divider = true,
}: {
  icon: any;
  iconBg?: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  divider?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.rowIcon, iconBg ? { backgroundColor: iconBg } : null]}>
          <Icon size={18} color={danger ? colors.destructive : colors.labelSecondary} strokeWidth={1.75} />
        </View>
        <Text style={[styles.rowLabel, danger && { color: colors.destructive }]}>{label}</Text>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        <ChevronRight size={16} color={danger ? colors.destructive : colors.labelTertiary} strokeWidth={1.75} />
      </TouchableOpacity>
      {divider && <View style={styles.rowDivider} />}
    </>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// ─── Inline field edit ────────────────────────────────────────────────────────

function promptEdit(fieldLabel: string, current: string, onSave: (val: string) => void) {
  Alert.prompt(
    `Edit ${fieldLabel}`,
    undefined,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: (val: string | undefined) => { if (val?.trim()) onSave(val.trim()); } },
    ],
    'plain-text',
    current,
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, setUser } = useAuthStore();

  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [myStats, setMyStats] = useState<{ rank: number | null; xp: number; streak_count: number; redemption_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const BADGES_TOTAL = 8;
  const badgesEarned = myStats
    ? [
        myStats.xp > 0,
        (myStats.streak_count ?? 0) >= 7,
        myStats.redemption_count >= 1,
        myStats.redemption_count >= 2,
        myStats.redemption_count >= 5,
        myStats.xp >= 5000,
        myStats.xp >= 8000,
        (myStats.rank ?? 999) <= 10,
      ].filter(Boolean).length
    : null;

  const loadProfile = useCallback(async () => {
    await Promise.all([
      offersApi.getSaved().then((r) => setSavedCount(Array.isArray(r.data) ? r.data.length : 0)).catch(() => {}),
      onboardingApi.getInterests().then((r) => {
        const data = r.data;
        if (Array.isArray(data)) {
          setInterests(data.map((i: any) => i.category ?? i));
        } else {
          setInterests(data.interests ?? []);
        }
      }).catch(() => {}),
      usersApi.myStats().then((r) => setMyStats(r.data)).catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    loadProfile().finally(() => setLoading(false));
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const initials = user?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  // ── Avatar picker ──────────────────────────────────────────────────────────
  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
    setUploadingAvatar(true);
    try {
      const res = await usersApi.update({ avatar_url: base64Uri });
      setUser(res.data);
    } catch {
      Alert.alert('Error', 'Could not save your photo. Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Field edits ────────────────────────────────────────────────────────────
  const editField = useCallback(async (field: 'full_name' | 'phone' | 'address', label: string, current: string) => {
    if (Platform.OS === 'ios') {
      promptEdit(label, current, async (val) => {
        try {
          const res = await usersApi.update({ [field]: val });
          setUser(res.data);
        } catch { Alert.alert('Error', 'Could not save changes.'); }
      });
    } else {
      // Android: Alert.prompt not supported — show prefill Alert
      Alert.alert(`Edit ${label}`, `Current: ${current || 'not set'}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: async () => {
          try { const res = await usersApi.update({ [field]: '' }); setUser(res.data); } catch {}
        }},
      ]);
    }
  }, [setUser]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Choose your preferred language', [
      { text: 'English', onPress: async () => { try { const r = await usersApi.update({ language: 'en' }); setUser(r.data); } catch {} } },
      { text: 'Albanian (Shqip)', onPress: async () => { try { const r = await usersApi.update({ language: 'sq' }); setUser(r.data); } catch {} } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const languageLabel = user?.language === 'sq' ? 'Albanian' : 'English';
  const interestsLabel = interests.length > 0
    ? interests.slice(0, 3).map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')
    : 'Not set';

  return (
    <View style={styles.container}>
      {/* Static header: always visible */}
      <View style={[styles.staticHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleAvatarPress} activeOpacity={0.85}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color={colors.ink} />
                : <Pencil size={14} color={colors.ink} strokeWidth={2} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {loading ? <ProfileContentSkeleton /> : (
        <>

      {/* Personal info */}
      <SectionLabel title="Personal info" />
      <Card>
        <Row icon={User}    label="Name"         value={user?.full_name}   onPress={() => editField('full_name', 'Name', user?.full_name ?? '')} />
        <Row icon={Mail}    label="E-mail"        value={user?.email}       onPress={() => Alert.alert('E-mail', user?.email ?? '')} />
        <Row icon={Phone}   label="Phone number"  value={user?.phone || 'Add phone'}   onPress={() => editField('phone', 'Phone number', user?.phone ?? '')} />
        <Row icon={MapPin}  label="Home address"  value={user?.address || 'Add address'} onPress={() => editField('address', 'Home address', user?.address ?? '')} divider={false} />
      </Card>

      {/* Benefits */}
      <SectionLabel title="Benefits" />
      <Card>
        <Row icon={Bookmark} label="Saved Offers"     value={savedCount !== null ? `${savedCount} saved` : undefined} onPress={() => router.push('/saved-offers' as any)} />
        <Row icon={Star}     label="My Taste Profile" value={interestsLabel}   onPress={() => router.push('/taste-profile' as any)} />
        <Row icon={Trophy}   label="Leaderboard"      value={myStats?.rank != null ? `You're #${myStats.rank} this month` : undefined} onPress={() => router.push('/leaderboard' as any)} />
        <Row icon={Award}    label="Achievements"     value={badgesEarned != null ? `${badgesEarned} of ${BADGES_TOTAL} badges` : undefined} onPress={() => router.push('/achievements' as any)} divider={false} />
      </Card>

      {/* Preferences */}
      <SectionLabel title="Preferences" />
      <Card>
        <Row icon={Bell}        label="Notifications"     onPress={() => router.push('/notifications' as any)} />
        <Row icon={Globe}       label="Language"          value={languageLabel} onPress={handleLanguage} />
        <Row icon={ShieldCheck} label="Privacy & Security" onPress={() => router.push('/privacy' as any)} />
        <Row icon={Settings}    label="All Settings"      onPress={() => router.push('/settings' as any)} divider={false} />
      </Card>

      {/* Support */}
      <SectionLabel title="Support" />
      <Card>
        <Row icon={CircleHelp} label="Help Center" onPress={() => router.push('/help' as any)} divider={false} />
      </Card>

      <Text style={styles.version}>Perka v2.4.1 · Made in Tirana</Text>

      {/* Sign out */}
      <Card>
        <Row icon={LogOut} label="Sign Out" onPress={handleLogout} danger divider={false} />
      </Card>
        </>)}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  staticHeader: { paddingHorizontal: spacing.screenX, paddingBottom: 8, backgroundColor: colors.paper },
  content: { paddingHorizontal: spacing.screenX, gap: 12 },

  pageTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.ink, textAlign: 'center', marginBottom: 8 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 4 },
  avatarWrap: { position: 'relative', width: 100, height: 100 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 36, fontFamily: fonts.bold, color: colors.ink },
  editBadge: {
    position: 'absolute', bottom: 0, right: -4,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3,
  },

  // Section label
  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  // Card
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, gap: 14 },
  rowIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowLabel: { flex: 1, fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink },
  rowValue: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, maxWidth: 140 },
  rowDivider: { height: 1, backgroundColor: colors.paper, marginLeft: 72 },

  version: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary, textAlign: 'left', paddingLeft: 4 },
});
