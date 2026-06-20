import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, CreditCard, Wallet, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { walletApi, cardsApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Card } from '@/types';

const QUICK_AMOUNTS = [
  { label: '2k', value: 2000 },
  { label: '5k', value: 5000 },
  { label: '10k', value: 10000 },
  { label: '25k', value: 25000 },
];

type PayMethod = 'card' | 'bank';

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState(5000);
  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cardsApi.list()
      .then((res) => {
        setCards(res.data);
        setPayMethod(res.data.length > 0 ? 'card' : 'bank');
      })
      .catch(() => setPayMethod('bank'));
  }, []);

  const handleTopUp = async () => {
    setLoading(true);
    try {
      await walletApi.topUp(amount);
      Alert.alert(
        'Top-up successful!',
        `${amount.toLocaleString()} ALL added to your wallet.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Top-up failed', err?.response?.data?.detail ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const primaryCard = cards[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.body}>
        {/* Amount display */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            {amount.toLocaleString()} <Text style={styles.amountCurrency}>ALL</Text>
          </Text>
        </View>

        {/* Quick amount pills */}
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

        {/* Pay with */}
        <Text style={styles.payWithLabel}>Pay with</Text>

        <View style={styles.methodsCol}>
          {/* Card option — only if user has a card */}
          {primaryCard && (
            <TouchableOpacity
              style={[styles.methodRow, payMethod === 'card' && styles.methodRowActive]}
              onPress={() => setPayMethod('card')}
              activeOpacity={0.85}
            >
              <View style={[styles.methodIcon, payMethod === 'card' && styles.methodIconActive]}>
                <CreditCard size={22} color={payMethod === 'card' ? colors.white : colors.labelSecondary} strokeWidth={1.75} />
              </View>
              <View style={styles.methodBody}>
                <Text style={[styles.methodTitle, payMethod === 'card' && styles.methodTitleActive]}>
                  Card ending {primaryCard.last_four}
                </Text>
                <Text style={[styles.methodSub, payMethod === 'card' && styles.methodSubActive]}>
                  {primaryCard.card_type.charAt(0).toUpperCase() + primaryCard.card_type.slice(1)} · instant
                </Text>
              </View>
              <View style={[styles.radio, payMethod === 'card' && styles.radioActive]}>
                {payMethod === 'card' && <Check size={14} color={colors.ink} strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          )}

          {/* Bank transfer */}
          <TouchableOpacity
            style={[styles.methodRow, payMethod === 'bank' && styles.methodRowActive]}
            onPress={() => setPayMethod('bank')}
            activeOpacity={0.85}
          >
            <View style={[styles.methodIcon, payMethod === 'bank' && styles.methodIconActive]}>
              <Wallet size={22} color={payMethod === 'bank' ? colors.white : colors.labelSecondary} strokeWidth={1.75} />
            </View>
            <View style={styles.methodBody}>
              <Text style={[styles.methodTitle, payMethod === 'bank' && styles.methodTitleActive]}>
                Bank transfer
              </Text>
              <Text style={[styles.methodSub, payMethod === 'bank' && styles.methodSubActive]}>
                1-2 business days
              </Text>
            </View>
            <View style={[styles.radio, payMethod === 'bank' && styles.radioActive]}>
              {payMethod === 'bank' && <Check size={14} color={colors.ink} strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.addBtn, loading && { opacity: 0.7 }]}
          onPress={handleTopUp}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color={colors.ink} size="small" />
            : <Text style={styles.addBtnText}>Add {amount.toLocaleString()} ALL</Text>}
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

  body: { flex: 1, paddingHorizontal: spacing.screenX, paddingTop: 8, gap: 16 },

  // Amount card
  amountCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    paddingHorizontal: 24, paddingVertical: 22,
    alignItems: 'center', gap: 6,
  },
  amountLabel: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelTertiary },
  amountValue: { fontSize: 52, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -2 },
  amountCurrency: { fontSize: 52, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -2 },

  // Quick pills
  quickRow: { flexDirection: 'row', gap: 10 },
  quickPill: {
    flex: 1, height: 52, borderRadius: radius.pill,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  quickPillActive: { backgroundColor: colors.ink },
  quickPillText: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  quickPillTextActive: { color: colors.white },

  // Pay with
  payWithLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  methodsCol: { gap: 10 },

  methodRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    paddingHorizontal: 18, paddingVertical: 18, gap: 14,
  },
  methodRowActive: { backgroundColor: colors.ink },

  methodIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  methodIconActive: { backgroundColor: 'rgba(255,255,255,0.12)' },

  methodBody: { flex: 1, gap: 3 },
  methodTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  methodTitleActive: { color: colors.white },
  methodSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },
  methodSubActive: { color: 'rgba(255,255,255,0.55)' },

  radio: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: colors.surface3,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: {
    backgroundColor: colors.lime, borderColor: colors.lime,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.screenX, paddingTop: 12,
  },
  addBtn: {
    height: 60, borderRadius: radius.pill,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },
});
