import { View, Text, StyleSheet } from 'react-native';
import type { Challenge } from '@/types';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Props {
  challenges: Challenge[];
}

export function ChallengeCard({ challenges }: Props) {
  return (
    <View style={styles.card}>
      {challenges.map((c, index) => {
        const pct = c.goal ? Math.min(c.progress / c.goal, 1) : 0;
        const pctLabel = Math.round(pct * 100) + '%';
        return (
          <View key={c.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              {/* Title + XP badge */}
              <View style={styles.topRow}>
                <Text style={styles.title}>{c.title}</Text>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>+{c.reward} XP</Text>
                </View>
              </View>
              {/* Description */}
              {c.description ? (
                <Text style={styles.desc}>{c.description}</Text>
              ) : null}
              {/* Progress bar + % */}
              <View style={styles.barRow}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct * 100}%` as any }]} />
                </View>
                <Text style={styles.pctLabel}>{pctLabel}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    marginHorizontal: spacing.screenX,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 12,
  },
  xpBadge: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  xpText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  desc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginBottom: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: colors.paper,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.ink,
    borderRadius: 4,
  },
  pctLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    width: 36,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.paper,
    marginHorizontal: 20,
  },
});
