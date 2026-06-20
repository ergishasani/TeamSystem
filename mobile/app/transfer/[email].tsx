import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { walletApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const QUICK_AMOUNTS = [
  { label: '500', value: 500 },
  { label: '1k', value: 1000 },
  { label: '2k', value: 2000 },
  { label: '5k', value: 5000 },
];

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TransferAmountScreen() {
  const { email, name, dept } = useLocalSearchParams<{ email: string; name: string; dept: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const decodedEmail = decodeURIComponent(email);
  const decodedName = decodeURIComponent(name ?? '');
  const decodedDept = decodeURIComponent(dept ?? '');

  const handleSend = async () => {
    if (!decodedEmail || loading) return;
    setLoading(true);
    try {
      await walletApi.transfer(decodedEmail, amount);
      setDone(true);
    } catch (err: any) {
      Alert.alert('Transfer failed', err?.response?.data?.detail ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: insets.top }]}>
        <View style={styles.successCircle}>
          <Check size={36} color={colors.ink} strokeWidth={2.5} />
        </View>
        <Text style={styles.successTitle}>Transfer sent!</Text>
        <Text style={styles.successSub}>
          {amount.toLocaleString()} ALL sent to {decodedName}.
        </Text>
        <TouchableOpacity
          style={[styles.sendBtn, { marginTop: 32, backgroundColor: colors.ink }]}
          onPress={() => router.push('/(tabs)/wallet' as any)}
          activeOpacity={0.88}
        >
          <Text style={[styles.sendBtnText, { color: colors.white }]}>Back to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Credits</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.body}>
        {/* Recipient */}
        <View style={styles.recipientCard}>
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientInitials}>{initials(decodedName)}</Text>
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{decodedName}</Text>
            {decodedDept ? (
              <Text style={styles.recipientDept}>{decodedDept}</Text>
            ) : (
              <Text style={styles.recipientDept}>{decodedEmail}</Text>
            )}
          </View>
        </View>

        {/* Amount display */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{amount.toLocaleString()} ALL</Text>
        </View>

        {/* Quick amounts */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((q) => (
            <TouchableOpacity
              key={q.value}
              style={[styles.quickPill, amount === q.value && styles.quickPillActive]}
              onPress={() => setAmount(q.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickPillText, amount === q.value && styles.quickPillTextActive]}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>
          Credits are deducted from your monthly benefit budget.
        </Text>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.sendBtn, loading && { opacity: 0.7 }]}
          onPress={handleSend}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color={colors.ink} size="small" />
            : <Text style={styles.sendBtnText}>
                Send {amount.toLocaleString()} ALL to {decodedName.split(' ')[0]}
              </Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  successContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.screenX },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },

  body: { flex: 1, paddingHorizontal: spacing.screenX, paddingTop: 8, gap: 14 },

  recipientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 18,
  },
  recipientAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  recipientInitials: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  recipientInfo: { flex: 1, gap: 3 },
  recipientName: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink },
  recipientDept: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },

  amountCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    paddingHorizontal: 24, paddingVertical: 22,
    alignItems: 'center', gap: 6,
  },
  amountLabel: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelTertiary },
  amountValue: { fontSize: 48, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -2 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickPill: {
    flex: 1, height: 50, borderRadius: radius.pill,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  quickPillActive: { backgroundColor: colors.ink },
  quickPillText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  quickPillTextActive: { color: colors.white },

  note: {
    fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 16,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenX, paddingTop: 12,
    backgroundColor: colors.paper,
  },
  sendBtn: {
    height: 58, borderRadius: radius.pill,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnText: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5, marginBottom: 10 },
  successSub: { fontSize: 16, fontFamily: fonts.regular, color: colors.labelSecondary, textAlign: 'center', lineHeight: 24 },
});
