import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import type { Wallet } from '@/types';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Props {
  wallet: Wallet;
}

export function WalletCard({ wallet }: Props) {
  const [hidden, setHidden] = useState(false);

  const balance = wallet.remaining_amount.toLocaleString();
  const used = wallet.used_amount.toLocaleString();
  const budget = wallet.monthly_budget.toLocaleString();
  const progress = Math.min(wallet.monthly_budget > 0 ? wallet.used_amount / wallet.monthly_budget : 0, 1);

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

      {/* Budget progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>

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
    marginBottom: 20,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.ink,
    minWidth: 8,
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
