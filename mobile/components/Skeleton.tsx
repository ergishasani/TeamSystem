import { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

// ─── Base skeleton box ────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, borderRadius = radius.md, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.separator, opacity }, style]}
    />
  );
}

// ─── Pre-built skeleton shapes ────────────────────────────────────────────────

export function SkeletonWalletCard() {
  return (
    <View style={{ marginHorizontal: spacing.screenX, gap: 12 }}>
      <Skeleton height={160} borderRadius={radius['2xl']} />
    </View>
  );
}

export function SkeletonOfferCard() {
  return (
    <View style={{ gap: 10, backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16 }}>
      <Skeleton height={140} borderRadius={radius.lg} />
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={12} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="30%" height={16} />
        <Skeleton width={60} height={30} borderRadius={radius.pill} />
      </View>
    </View>
  );
}

export function SkeletonPackageCard() {
  return (
    <View style={{ gap: 8, backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="50%" height={12} />
        </View>
      </View>
      <Skeleton height={1} style={{ marginVertical: 4 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={14} />
      </View>
    </View>
  );
}

export function SkeletonRow({ avatar = false }: { avatar?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
      {avatar && <Skeleton width={40} height={40} borderRadius={20} />}
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={50} height={14} />
    </View>
  );
}

export function SkeletonCardItem({ wide }: { wide?: boolean }) {
  return (
    <Skeleton
      width={wide ? undefined : 300}
      height={wide ? 200 : 158}
      borderRadius={radius['2xl']}
      style={wide ? undefined : undefined}
    />
  );
}

// ─── Content-only skeleton layouts (header lives outside ScrollView) ──────────

export function HomeContentSkeleton() {
  return (
    <View style={{ paddingBottom: 40, gap: 24, paddingTop: 4 }}>
      <SkeletonWalletCard />

      <View style={{ paddingHorizontal: spacing.screenX, gap: 10 }}>
        <Skeleton width="40%" height={18} />
        <SkeletonOfferCard />
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ paddingHorizontal: spacing.screenX }}>
          <Skeleton width="30%" height={18} />
        </View>
        <View style={{ paddingHorizontal: spacing.screenX, flexDirection: 'row', gap: 12 }}>
          <Skeleton width={300} height={158} borderRadius={radius['2xl']} />
          <Skeleton width={200} height={158} borderRadius={radius['2xl']} />
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.screenX, gap: 12 }}>
        <Skeleton width="35%" height={18} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <Skeleton width={58} height={58} borderRadius={29} />
              <Skeleton width={48} height={11} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.screenX, gap: 12 }}>
        <Skeleton width="40%" height={18} />
        <SkeletonOfferCard />
        <SkeletonOfferCard />
      </View>
    </View>
  );
}

export function ExploreScreenSkeleton() {
  return (
    <View style={{ paddingHorizontal: spacing.screenX, paddingTop: 8, gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[80, 60, 70, 55, 75].map((w, i) => (
          <Skeleton key={i} width={w} height={34} borderRadius={radius.pill} />
        ))}
      </View>
      <SkeletonOfferCard />
      <SkeletonOfferCard />
      <SkeletonOfferCard />
    </View>
  );
}

export function WalletContentSkeleton() {
  return (
    <View style={{ paddingBottom: 40, gap: 24, paddingHorizontal: spacing.screenX, paddingTop: 8 }}>
      <Skeleton height={160} borderRadius={radius['2xl']} />

      <View style={{ gap: 10 }}>
        <Skeleton width="30%" height={18} />
        <Skeleton height={200} borderRadius={radius['2xl']} />
        <Skeleton height={200} borderRadius={radius['2xl']} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={70} height={32} borderRadius={radius.pill} />
        ))}
      </View>

      <View style={{ backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i}>
            <SkeletonRow />
            {i < 4 && <View style={{ height: 1, backgroundColor: colors.paper, marginHorizontal: 16 }} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProfileContentSkeleton() {
  return (
    <View style={{ paddingBottom: 40, gap: 20, paddingHorizontal: spacing.screenX, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 14, gap: 6, alignItems: 'center' }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="80%" height={11} />
          </View>
        ))}
      </View>

      {[0, 1, 2].map((s) => (
        <View key={s} style={{ gap: 8 }}>
          <Skeleton width="30%" height={14} />
          <View style={{ backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i}>
                <SkeletonRow avatar />
                {i < 3 && <View style={{ height: 1, backgroundColor: colors.paper, marginHorizontal: 16 }} />}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
