import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import { shakeApi } from '@/lib/api';

interface ShakeStatus { credits: number; tries_today: number; tries_remaining: number; }
interface ShakeResult { won: boolean; prize_type: string; prize_description: string; xp_earned: number; credits_remaining: number; tries_remaining: number; }

const PRIZE_EMOJI: Record<string, string> = {
  xp: '⚡', badge: '🏅', discount: '🏷️', voucher: '☕', credit: '💎',
};

export default function ShakeScreen() {
  const [status, setStatus] = useState<ShakeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [shaking, setShaking] = useState(false);
  const [result, setResult] = useState<ShakeResult | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const loadStatus = async () => {
    try {
      const res = await shakeApi.status();
      setStatus(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const runShakeAnimation = () =>
    new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 15, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -15, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start(() => resolve());
    });

  const handlePlay = async () => {
    if (!status) return;
    if (status.credits < 1) {
      Alert.alert('No Credits', 'You need at least 1 credit to play.');
      return;
    }
    if (status.tries_remaining <= 0) {
      Alert.alert('Daily Limit', 'You have used all 3 tries for today. Come back tomorrow!');
      return;
    }
    setShaking(true);
    setResult(null);
    await runShakeAnimation();
    try {
      const res = await shakeApi.play();
      setResult(res.data);
      setStatus((prev) => prev ? {
        ...prev,
        credits: res.data.credits_remaining,
        tries_remaining: res.data.tries_remaining,
        tries_today: prev.tries_today + 1,
      } : null);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setShaking(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#22C55E" size="large" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shake Shake 🎰</Text>
      <Text style={styles.sub}>Spend 1 credit for a chance to win prizes!</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{status?.credits ?? 0}</Text>
          <Text style={styles.statLabel}>Credits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{status?.tries_remaining ?? 0}</Text>
          <Text style={styles.statLabel}>Tries left today</Text>
        </View>
      </View>

      <Animated.View style={[styles.shakeBox, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.shakeEmoji}>{shaking ? '🎲' : result ? (PRIZE_EMOJI[result.prize_type] || '🎁') : '🎁'}</Text>
      </Animated.View>

      {result && (
        <View style={[styles.resultCard, result.won && styles.resultCardWin]}>
          <Text style={styles.resultTitle}>{result.won ? '🎉 You Won!' : 'Better luck next time!'}</Text>
          <Text style={styles.resultPrize}>{result.prize_description}</Text>
          {result.xp_earned > 0 && <Text style={styles.resultXP}>+{result.xp_earned} XP earned</Text>}
        </View>
      )}

      <TouchableOpacity
        style={[styles.shakeBtn, (shaking || (status?.tries_remaining ?? 0) <= 0 || (status?.credits ?? 0) < 1) && styles.shakeBtnDisabled]}
        onPress={handlePlay}
        disabled={shaking || (status?.tries_remaining ?? 0) <= 0 || (status?.credits ?? 0) < 1}
        activeOpacity={0.8}
      >
        <Text style={styles.shakeBtnText}>{shaking ? 'Shaking...' : '🤲 Shake! (1 credit)'}</Text>
      </TouchableOpacity>

      <View style={styles.rules}>
        <Text style={styles.rulesTitle}>How it works</Text>
        <Text style={styles.rulesText}>• 1 credit per shake · Max 3 tries/day</Text>
        <Text style={styles.rulesText}>• Win XP, badges, discounts, or special vouchers</Text>
        <Text style={styles.rulesText}>• Credits reset when your employer tops up</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111', paddingTop: 60, paddingHorizontal: 24 },
  center: { flex: 1, backgroundColor: '#111111', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  sub: { color: '#A1A1AA', fontSize: 14, marginTop: 6, marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 16, padding: 18, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '900', color: '#22C55E' },
  statLabel: { color: '#A1A1AA', fontSize: 12, marginTop: 4 },
  shakeBox: { alignItems: 'center', marginBottom: 28 },
  shakeEmoji: { fontSize: 96 },
  resultCard: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#2A2A2A' },
  resultCardWin: { borderColor: '#22C55E', backgroundColor: '#22C55E10' },
  resultTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  resultPrize: { color: '#A1A1AA', fontSize: 15 },
  resultXP: { color: '#22C55E', fontWeight: '700', marginTop: 8 },
  shakeBtn: { backgroundColor: '#22C55E', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 28 },
  shakeBtnDisabled: { opacity: 0.35 },
  shakeBtnText: { color: '#111111', fontSize: 17, fontWeight: '800' },
  rules: { backgroundColor: '#1E1E1E', borderRadius: 14, padding: 16 },
  rulesTitle: { color: '#FFFFFF', fontWeight: '700', marginBottom: 8 },
  rulesText: { color: '#A1A1AA', fontSize: 13, marginBottom: 4 },
});
