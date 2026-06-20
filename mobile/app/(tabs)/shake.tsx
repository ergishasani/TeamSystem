import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import { Zap } from 'lucide-react-native';
import { shakeApi } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface ShakeStatus { credits: number; tries_today: number; tries_remaining: number; }
interface ShakeResult { won: boolean; prize_type: string; prize_description: string; xp_earned: number; credits_remaining: number; tries_remaining: number; }

const PRIZE_EMOJI: Record<string, string> = {
  xp: 'âš¡', badge: 'ðŸ…', discount: 'ðŸ·ï¸', voucher: 'â˜•', credit: 'ðŸ’Ž',
};

export default function ShakeScreen() {
  const [status, setStatus] = useState<ShakeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [result, setResult] = useState<ShakeResult | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  const loadStatus = useCallback(async () => {
    try {
      const res = await shakeApi.status();
      setStatus(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadStatus().finally(() => setLoading(false)); }, [loadStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  }, [loadStatus]);

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
    resultScale.setValue(0);
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
      // Animate result card pop-in
      Animated.spring(resultScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
      }).start();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setShaking(false);
    }
  };

  const isDisabled = shaking || (status?.tries_remaining ?? 0) <= 0 || (status?.credits ?? 0) < 1;
  const outOfCredits = !loading && (status?.credits ?? 0) < 1;
  const dailyLimitReached = !loading && (status?.tries_remaining ?? 0) <= 0 && (status?.credits ?? 0) >= 1;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ScreenHeader title="Shake & Win" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.ink} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Shake & Win" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {/* Credits display */}
        <View style={styles.creditsBlock}>
          <Text style={styles.creditsNumber}>{status?.credits ?? 0}</Text>
          <Text style={styles.creditsLabel}>credits remaining</Text>
        </View>

        {/* Tries indicator */}
        <View style={styles.triesRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.tryDot,
                i < (status?.tries_today ?? 0) ? styles.tryDotUsed : styles.tryDotAvail,
              ]}
            />
          ))}
          <Text style={styles.triesLabel}>
            {status?.tries_remaining ?? 0} of 3 tries left today
          </Text>
        </View>

        {/* Big shake target */}
        <Animated.View style={[styles.shakeTarget, { transform: [{ translateX: shakeAnim }] }]}>
          <TouchableOpacity
            style={styles.shakeTargetInner}
            onPress={handlePlay}
            disabled={isDisabled}
            activeOpacity={0.85}
          >
            <Zap size={48} color={colors.lime} strokeWidth={2} fill={colors.lime} />
            <Text style={styles.shakeLabel}>{shaking ? 'Shaking...' : 'Shake!'}</Text>
            <Text style={styles.shakeCost}>1 credit per shake</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Prize result card */}
        {result && (
          <Animated.View style={[styles.resultCard, { transform: [{ scale: resultScale }] }]}>
            <Text style={styles.resultEmoji}>{PRIZE_EMOJI[result.prize_type] || 'ðŸŽ'}</Text>
            <Text style={styles.resultTitle}>
              {result.won ? 'You Won!' : 'Better luck next time!'}
            </Text>
            <Text style={styles.resultDesc}>{result.prize_description}</Text>
            {result.xp_earned > 0 && (
              <Text style={styles.resultXP}>+{result.xp_earned} XP earned</Text>
            )}
            {result.won && (
              <PrimaryButton
                title="Claim Prize"
                variant="lime"
                onPress={() => {}}
                style={styles.claimBtn}
              />
            )}
          </Animated.View>
        )}

        {/* Daily limit message */}
        {dailyLimitReached && (
          <Text style={styles.limitMsg}>
            Daily limit reached. Come back tomorrow for 3 more tries!
          </Text>
        )}

        {/* Out of credits message */}
        {outOfCredits && (
          <Text style={styles.limitMsg}>
            You have no credits. Ask your employer to top up your balance.
          </Text>
        )}

        {/* Shake button (also shown below for quick tap) */}
        <PrimaryButton
          title={shaking ? 'Shaking...' : 'Shake! (1 credit)'}
          variant="lime"
          onPress={handlePlay}
          disabled={isDisabled}
          style={styles.shakeBtn}
        />

        {/* How it works */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>How it works</Text>
          <Text style={styles.rulesText}>1 credit per shake Â· Max 3 tries/day</Text>
          <Text style={styles.rulesText}>Win XP, badges, discounts, or special vouchers</Text>
          <Text style={styles.rulesText}>Credits reset when your employer tops up</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  creditsBlock: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 24,
  },
  creditsNumber: {
    fontSize: 48,
    fontFamily: fonts.bold,
    color: colors.ink,
    lineHeight: 56,
  },
  creditsLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginTop: 2,
  },
  triesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  tryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tryDotAvail: {
    backgroundColor: colors.lime,
  },
  tryDotUsed: {
    backgroundColor: 'rgba(32,32,32,0.12)',
  },
  triesLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginLeft: 4,
  },
  shakeTarget: {
    marginBottom: 32,
  },
  shakeTargetInner: {
    width: 160,
    height: 160,
    backgroundColor: colors.white,
    borderRadius: radius['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    gap: 6,
  },
  shakeLabel: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  shakeCost: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
  },
  resultCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: spacing.cardPad,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultDesc: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  resultXP: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.ink,
    marginBottom: 16,
  },
  claimBtn: {
    width: '100%',
  },
  limitMsg: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  shakeBtn: {
    width: '100%',
    marginBottom: 28,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: spacing.cardPad,
    gap: 6,
  },
  rulesTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.ink,
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    lineHeight: 19,
  },
});
