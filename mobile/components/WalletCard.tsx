import { View, Text, StyleSheet } from 'react-native';
import type { Wallet } from '@/types';

interface Props {
  wallet: Wallet;
}

export function WalletCard({ wallet }: Props) {
  const percent = wallet.monthly_budget > 0
    ? Math.round((wallet.remaining_amount / wallet.monthly_budget) * 100)
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Available Balance</Text>
          <Text style={styles.balance}>{wallet.remaining_amount.toLocaleString()}</Text>
          <Text style={styles.currency}>{wallet.currency} / month</Text>
        </View>
        <View style={styles.xpBox}>
          <Text style={styles.xpLevel}>Lv.{wallet.level}</Text>
          <Text style={styles.xpVal}>{wallet.xp} XP</Text>
          {wallet.streak_count > 0 && <Text style={styles.streak}>🔥 {wallet.streak_count}</Text>}
        </View>
      </View>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.subLabel}>Used</Text>
          <Text style={styles.subVal}>{wallet.used_amount.toLocaleString()} {wallet.currency}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.subLabel}>Pending</Text>
          <Text style={[styles.subVal, { color: '#F59E0B' }]}>{wallet.pending_amount.toLocaleString()} {wallet.currency}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  label: { color: '#A1A1AA', fontSize: 13 },
  balance: { fontSize: 36, fontWeight: '900', color: '#22C55E', marginTop: 4 },
  currency: { color: '#A1A1AA', fontSize: 13 },
  xpBox: { alignItems: 'flex-end' },
  xpLevel: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  xpVal: { color: '#22C55E', fontSize: 13, fontWeight: '600' },
  streak: { color: '#F59E0B', fontSize: 13, marginTop: 4 },
  barBg: { height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, marginBottom: 16 },
  barFill: { height: 6, backgroundColor: '#22C55E', borderRadius: 3 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { color: '#A1A1AA', fontSize: 12 },
  subVal: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginTop: 2 },
});
