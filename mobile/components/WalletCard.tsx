import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import type { Wallet } from '@/types';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Props {
  wallet: Wallet;
  onRequestPerk?: () => void;
}

export function WalletCard({ wallet, onRequestPerk }: Props) {
  const [hidden, setHidden] = useState(false);

  const balance = wallet.remaining_amount.toLocaleString();
  const used = wallet.used_amount.toLocaleString();
  const budget = wallet.monthly_budget.toLocaleString();

  return (
    <View style={styles.card}>
      {/* Top: label + eye toggle */}
      <View style={styles.topRow}>
        <Text style={styles.label}>Your balance</Text>
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setHidden((h) => !h)} activeOpacity={0.7}>
          {hidden
            ? <EyeOff size={18} color={colors.labelSecondary} strokeWidth={1.5} />
            : <Eye size={18} color={colors.labelSecondary} strokeWidth={1.5} />
          }
        </TouchableOpacity>
      </View>

      {/* Balance */}
      <Text style={styles.balance}>
        {hidden ? '••••• ALL' : `${balance} ${wallet.currency}`}
      </Text>

      {/* CTA */}
      <TouchableOpacity style={styles.cta} onPress={onRequestPerk} activeOpacity={0.82}>
        <Text style={styles.ctaText}>Request a perk</Text>
      </TouchableOpacity>

      {/* Footer: used + budget */}
      <View style={styles.footRow}>
        <Text style={styles.footLabel}>
          Used <Text style={styles.footBold}>{used} {wallet.currency}</Text>
        </Text>
        <Text style={styles.footLabel}>
          Budget <Text style={styles.footBold}>{budget} {wallet.currency}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: spacing.cardPad,
    marginHorizontal: spacing.screenX,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balance: {
    fontSize: 48,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -2,
    marginBottom: 24,
  },
  cta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.semiBold,
  },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
  },
  footBold: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
});
