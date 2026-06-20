import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, ChevronRight,
  CreditCard, FileText, Bell, Globe, Moon,
  Fingerprint, ShieldCheck, Trash2,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { usersApi, cardsApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

function Row({
  icon: Icon,
  label,
  sub,
  value,
  onPress,
  danger,
  divider = true,
}: {
  icon: any; label: string; sub?: string; value?: string;
  onPress: () => void; danger?: boolean; divider?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.rowIcon, danger && { backgroundColor: '#FEE2E2' }]}>
          <Icon size={18} color={danger ? colors.destructive : colors.labelSecondary} strokeWidth={1.75} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, danger && { color: colors.destructive }]}>{label}</Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </View>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <ChevronRight size={16} color={danger ? colors.destructive : colors.labelTertiary} strokeWidth={1.75} />
      </TouchableOpacity>
      {divider && <View style={styles.divider} />}
    </>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useAuthStore();
  const [cardCount, setCardCount] = useState<number | null>(null);

  useEffect(() => {
    cardsApi.list().then((r) => setCardCount(r.data.length)).catch(() => {});
  }, []);

  const languageLabel = user?.language === 'sq' ? 'Albanian' : 'English';

  const handleLanguage = () => {
    Alert.alert('Language', 'Choose your preferred language', [
      {
        text: 'English',
        onPress: async () => {
          try { const r = await usersApi.update({ language: 'en' }); setUser(r.data); } catch {}
        },
      },
      {
        text: 'Albanian (Shqip)',
        onPress: async () => {
          try { const r = await usersApi.update({ language: 'sq' }); setUser(r.data); } catch {}
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This is permanent and removes all your redemptions and history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account deletion requested', 'Our team will process your request within 30 days.');
            logout();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel title="Account" />
        <Card>
          <Row
            icon={CreditCard}
            label="Payment methods"
            sub={cardCount != null ? `${cardCount} card${cardCount !== 1 ? 's' : ''} on file` : 'Payment methods'}
            onPress={() => router.push('/payment-methods' as any)}
          />
          <Row
            icon={FileText}
            label="Statements & invoices"
            onPress={() => Alert.alert('Statements', 'Statements and invoices are coming soon.')}
            divider={false}
          />
        </Card>

        <SectionLabel title="Preferences" />
        <Card>
          <Row
            icon={Bell}
            label="Notifications"
            sub="Push, email, in-app"
            onPress={() => router.push('/notifications' as any)}
          />
          <Row
            icon={Globe}
            label="Language"
            value={languageLabel}
            onPress={handleLanguage}
          />
          <Row
            icon={Moon}
            label="Appearance"
            value="Auto"
            onPress={() => Alert.alert('Appearance', 'Dark mode and theme settings are coming soon.')}
            divider={false}
          />
        </Card>

        <SectionLabel title="Security" />
        <Card>
          <Row
            icon={Fingerprint}
            label="Face ID & passcode"
            onPress={() => Alert.alert('Face ID', 'Biometric authentication settings are coming soon.')}
          />
          <Row
            icon={ShieldCheck}
            label="Privacy"
            onPress={() => router.push('/privacy' as any)}
            divider={false}
          />
        </Card>

        <Card>
          <Row
            icon={Trash2}
            label="Delete account"
            onPress={handleDeleteAccount}
            danger
            divider={false}
          />
        </Card>
        <Text style={styles.deleteNote}>
          Deleting your account is permanent and removes all redemptions and history.
        </Text>
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
  content: { paddingHorizontal: spacing.screenX, gap: 12, paddingTop: 4 },
  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, gap: 14 },
  rowIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink },
  rowSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },
  rowValue: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, marginRight: 2 },
  divider: { height: 1, backgroundColor: colors.paper, marginLeft: 72 },
  deleteNote: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary, marginTop: -4 },
});
