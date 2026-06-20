import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ArrowDownToLine,
  ArrowLeftRight,
  MessageCircle,
  CheckCircle,
  Phone,
  Mail,
} from 'lucide-react-native';
import { walletApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Wallet } from '@/types';

export type ServiceMode = 'topup' | 'transfer' | 'support' | null;

interface Props {
  mode: ServiceMode;
  wallet: Wallet | null;
  onClose: () => void;
  onWalletUpdated: (w: Wallet) => void;
}

// ─── Top Up ───────────────────────────────────────────────────────────────────

function TopUpSheet({ wallet, onClose, onWalletUpdated }: Omit<Props, 'mode'>) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const QUICK = [1000, 2500, 5000, 10000];

  const handleTopUp = async () => {
    const val = parseFloat(amount.replace(/,/g, ''));
    if (!val || val <= 0) { setError('Enter a valid amount.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await walletApi.topUp(val);
      onWalletUpdated(res.data);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Top-up failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIcon}><CheckCircle size={36} color={colors.ink} strokeWidth={1.5} /></View>
        <Text style={styles.successTitle}>Top-up successful!</Text>
        <Text style={styles.successSub}>
          {parseFloat(amount.replace(/,/g, '')).toLocaleString()} ALL added to your balance.
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.82}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.iconRow}>
        <View style={[styles.sheetIcon, { backgroundColor: colors.lime }]}>
          <ArrowDownToLine size={24} color={colors.ink} strokeWidth={1.75} />
        </View>
        <Text style={styles.sheetTitle}>Top Up</Text>
      </View>

      <Text style={styles.balanceLabel}>Current balance</Text>
      <Text style={styles.balanceAmount}>
        {wallet?.remaining_amount.toLocaleString() ?? '—'} {wallet?.currency ?? 'ALL'}
      </Text>

      {/* Quick amounts */}
      <Text style={styles.fieldLabel}>Quick amounts</Text>
      <View style={styles.quickRow}>
        {QUICK.map((q) => (
          <TouchableOpacity
            key={q}
            style={[styles.quickPill, amount === String(q) && styles.quickPillActive]}
            onPress={() => { setAmount(String(q)); setError(''); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickPillText, amount === String(q) && styles.quickPillTextActive]}>
              {q.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom amount */}
      <Text style={styles.fieldLabel}>Or enter amount (ALL)</Text>
      <View style={styles.formCard}>
        <View style={styles.fieldRow}>
          <TextInput
            style={styles.amountInput}
            placeholder="5,000"
            placeholderTextColor={colors.labelTertiary}
            value={amount}
            onChangeText={(v) => { setAmount(v.replace(/[^0-9]/g, '')); setError(''); }}
            keyboardType="numeric"
          />
          <Text style={styles.currencyLabel}>ALL</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
        onPress={handleTopUp}
        activeOpacity={0.82}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.white} size="small" />
          : <Text style={styles.actionBtnText}>Top Up</Text>
        }
      </TouchableOpacity>
    </>
  );
}

// ─── Transfer ─────────────────────────────────────────────────────────────────

function TransferSheet({ wallet, onClose, onWalletUpdated }: Omit<Props, 'mode'>) {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ to_name: string; amount: number; currency: string } | null>(null);

  const handleTransfer = async () => {
    if (!email.trim()) { setError('Enter recipient email.'); return; }
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError('Enter a valid amount.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await walletApi.transfer(email.trim(), val);
      setResult(res.data);
      // Refresh wallet balance
      const w = await walletApi.getWallet();
      onWalletUpdated(w.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Transfer failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIcon}><CheckCircle size={36} color={colors.ink} strokeWidth={1.5} /></View>
        <Text style={styles.successTitle}>Transfer sent!</Text>
        <Text style={styles.successSub}>
          {result.amount.toLocaleString()} {result.currency} sent to {result.to_name}.
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.82}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.iconRow}>
        <View style={[styles.sheetIcon, { backgroundColor: colors.surface2 }]}>
          <ArrowLeftRight size={24} color={colors.ink} strokeWidth={1.75} />
        </View>
        <Text style={styles.sheetTitle}>Transfer</Text>
      </View>

      <Text style={styles.balanceLabel}>Available balance</Text>
      <Text style={styles.balanceAmount}>
        {wallet?.remaining_amount.toLocaleString() ?? '—'} {wallet?.currency ?? 'ALL'}
      </Text>

      <View style={styles.formCard}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Recipient email</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="colleague@company.al"
            placeholderTextColor={colors.labelTertiary}
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Amount (ALL)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="1,000"
            placeholderTextColor={colors.labelTertiary}
            value={amount}
            onChangeText={(v) => { setAmount(v.replace(/[^0-9]/g, '')); setError(''); }}
            keyboardType="numeric"
          />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
        onPress={handleTransfer}
        activeOpacity={0.82}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.white} size="small" />
          : <Text style={styles.actionBtnText}>Send Transfer</Text>
        }
      </TouchableOpacity>
    </>
  );
}

// ─── Support ──────────────────────────────────────────────────────────────────

function SupportSheet() {
  const contacts = [
    { icon: Phone, label: 'Call support', sub: '+355 4 123 4567', color: colors.lime },
    { icon: Mail, label: 'Email us', sub: 'support@perka.al', color: colors.surface2 },
    { icon: MessageCircle, label: 'Live chat', sub: 'Available 9:00 – 18:00', color: colors.surface2 },
  ];

  return (
    <>
      <View style={styles.iconRow}>
        <View style={[styles.sheetIcon, { backgroundColor: colors.surface2 }]}>
          <MessageCircle size={24} color={colors.ink} strokeWidth={1.75} />
        </View>
        <Text style={styles.sheetTitle}>Support</Text>
      </View>
      <Text style={styles.supportSub}>We're here to help. Reach out any time.</Text>

      {contacts.map(({ icon: Icon, label, sub, color }) => (
        <TouchableOpacity key={label} style={styles.contactRow} activeOpacity={0.8}>
          <View style={[styles.contactIcon, { backgroundColor: color }]}>
            <Icon size={20} color={colors.ink} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>{label}</Text>
            <Text style={styles.contactSub}>{sub}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─── Root modal ───────────────────────────────────────────────────────────────

export function ServiceModal({ mode, wallet, onClose, onWalletUpdated }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}}>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.handle} />

              {/* Close button */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={18} color={colors.ink} strokeWidth={2} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {mode === 'topup' && (
                  <TopUpSheet wallet={wallet} onClose={onClose} onWalletUpdated={onWalletUpdated} />
                )}
                {mode === 'transfer' && (
                  <TransferSheet wallet={wallet} onClose={onClose} onWalletUpdated={onWalletUpdated} />
                )}
                {mode === 'support' && <SupportSheet />}
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: spacing.screenX,
    width: 36, height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Sheet header
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  sheetIcon: {
    width: 52, height: 52,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
  },

  // Balance display
  balanceLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
    marginBottom: 20,
  },

  // Quick amounts
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickPill: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickPillActive: { backgroundColor: colors.ink },
  quickPillText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  quickPillTextActive: { color: colors.white },

  // Form card
  formCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.xl,
    marginBottom: 12,
    overflow: 'hidden',
  },
  fieldRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink,
    height: 26,
    padding: 0,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginHorizontal: 16,
  },
  amountInput: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.ink,
    padding: 0,
    flex: 1,
  },
  currencyLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginLeft: 8,
    alignSelf: 'flex-end',
    paddingBottom: 4,
  },

  // Action button
  actionBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { color: colors.white, fontSize: 17, fontFamily: fonts.semiBold },

  // Error
  error: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.destructive,
    marginBottom: 12,
  },

  // Success
  successWrap: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  successIcon: {
    width: 72, height: 72,
    borderRadius: radius['2xl'],
    backgroundColor: colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  doneBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    height: 52,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: { color: colors.white, fontSize: 16, fontFamily: fonts.semiBold },

  // Support
  supportSub: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface2,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 10,
  },
  contactIcon: {
    width: 44, height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  contactSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary, marginTop: 2 },
});
