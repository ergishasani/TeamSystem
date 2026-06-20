import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Eye, BarChart2, MapPin, Mail, Download, ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts, radius, spacing } from '@/lib/theme';

function ToggleRow({
  icon: Icon,
  label,
  sub,
  value,
  onChange,
  divider = true,
}: {
  icon: any; label: string; sub: string;
  value: boolean; onChange: (v: boolean) => void; divider?: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <Icon size={18} color={colors.labelSecondary} strokeWidth={1.75} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowSub}>{sub}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#D1D5DB', true: colors.lime }}
          thumbColor={colors.white}
          ios_backgroundColor="#D1D5DB"
        />
      </View>
      {divider && <View style={styles.divider} />}
    </>
  );
}

function NavRow({ icon: Icon, label, sub, onPress, divider = true }: {
  icon: any; label: string; sub?: string; onPress: () => void; divider?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.rowIcon}>
          <Icon size={18} color={colors.labelSecondary} strokeWidth={1.75} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </View>
        <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.75} />
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

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [usageAnalytics, setUsageAnalytics] = useState(true);
  const [locationOffers, setLocationOffers] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleDownload = () => {
    Alert.alert('Download my data', 'We\'ll prepare your data export and send it to your email address within 24 hours.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request export', onPress: () => Alert.alert('Request sent', 'You\'ll receive an email with your data soon.') },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel title="Visibility" />
        <Card>
          <ToggleRow
            icon={Eye}
            label="Show on leaderboard"
            sub="Display your name on team boards"
            value={showOnLeaderboard}
            onChange={setShowOnLeaderboard}
            divider={false}
          />
        </Card>

        <SectionLabel title="Data" />
        <Card>
          <ToggleRow
            icon={BarChart2}
            label="Usage analytics"
            sub="Help us improve Perka"
            value={usageAnalytics}
            onChange={setUsageAnalytics}
          />
          <ToggleRow
            icon={MapPin}
            label="Location-based offers"
            sub="Find perks near you"
            value={locationOffers}
            onChange={setLocationOffers}
          />
          <ToggleRow
            icon={Mail}
            label="Marketing emails"
            sub="Weekly digest & new partners"
            value={marketingEmails}
            onChange={setMarketingEmails}
            divider={false}
          />
        </Card>
        <Text style={styles.note}>Used only to improve recommendations. Never sold.</Text>

        <SectionLabel title="Your data" />
        <Card>
          <NavRow
            icon={Download}
            label="Download my data"
            sub="Export as JSON"
            onPress={handleDownload}
            divider={false}
          />
        </Card>
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
  divider: { height: 1, backgroundColor: colors.paper, marginLeft: 72 },
  note: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary, marginTop: -4 },
});
