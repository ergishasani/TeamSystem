import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, X, Inbox } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { swipeApi } from '@/lib/api';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Offer } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

const CATEGORY_EMOJI: Record<string, string> = {
  wellness: 'ðŸ§˜', fitness: 'ðŸ‹ï¸', food: 'ðŸ½ï¸',
  travel: 'âœˆï¸', learning: 'ðŸ“š', health: 'â¤ï¸',
};

const categoryColor = (cat: string): string =>
  (colors.categories as Record<string, string>)[cat] ?? colors.lime;

export default function SwipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [deck, setDeck] = useState<Offer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    swipeApi.getDeck().then((res) => {
      setDeck(res.data.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const recordSwipe = async (direction: 'like' | 'dislike') => {
    const offer = deck[currentIndex];
    if (!offer) return;
    try { await swipeApi.swipe(offer.id, direction); } catch { /* offline-safe */ }
    const next = currentIndex + 1;
    if (next >= deck.length) setDone(true);
    setCurrentIndex(next);
    position.setValue({ x: 0, y: 0 });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.spring(position, { toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy }, useNativeDriver: false }).start(() => recordSwipe('like'));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.spring(position, { toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy }, useNativeDriver: false }).start(() => recordSwipe('dislike'));
        } else {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'like' | 'dislike') => {
    const toX = direction === 'like' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, { toValue: { x: toX, y: 0 }, duration: 250, useNativeDriver: false }).start(() => recordSwipe(direction));
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.ink} size="large" />
      </View>
    );
  }

  if (done || currentIndex >= deck.length) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <View style={styles.emptyCircle}>
          <Inbox size={40} color={colors.ink} strokeWidth={1.5} />
        </View>
        <Text style={styles.doneTitle}>All caught up!</Text>
        <Text style={styles.doneSub}>New offers drop daily. Check back soon.</Text>
        <PrimaryButton
          variant="lime"
          title="Browse All Offers"
          onPress={() => router.push('/(tabs)/explore')}
          style={styles.doneBtn}
        />
      </View>
    );
  }

  const offer = deck[currentIndex];
  const catColor = categoryColor(offer.category);
  const emoji = CATEGORY_EMOJI[offer.category] || 'ðŸŽ';
  const nextOffer = deck[currentIndex + 1];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Discover</Text>
        <Text style={styles.countBadge}>{deck.length - currentIndex} left</Text>
      </View>
      <Text style={styles.sub}>Swipe right to save Â· left to skip</Text>

      {/* Card stack */}
      <View style={styles.cardArea}>
        {/* Next card (behind) */}
        {nextOffer && (
          <View style={[styles.card, styles.cardBehind]}>
            <View style={[styles.iconArea, { backgroundColor: categoryColor(nextOffer.category) + '30' }]} />
          </View>
        )}

        {/* Current card */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* LIKE badge */}
          <Animated.View style={[styles.likeBadge, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>
          {/* PASS badge */}
          <Animated.View style={[styles.nopeBadge, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>PASS</Text>
          </Animated.View>

          {/* Category icon area */}
          <View style={[styles.iconArea, { backgroundColor: catColor + '25' }]}>
            <View style={[styles.iconCircle, { backgroundColor: catColor }]}>
              <Text style={styles.cardEmoji}>{emoji}</Text>
            </View>
          </View>

          {/* Card body */}
          <View style={styles.cardBody}>
            <View style={[styles.categoryPill, { backgroundColor: catColor + '20' }]}>
              <Text style={[styles.categoryPillText, { color: catColor === colors.lime ? colors.ink : catColor }]}>
                {offer.category}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{offer.title}</Text>
            <Text style={styles.cardPrice}>{Number(offer.price).toLocaleString()} {offer.currency}</Text>
            {offer.description ? (
              <Text style={styles.cardDesc} numberOfLines={3}>{offer.description}</Text>
            ) : null}
            <Text style={styles.cardCity}>{offer.city}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnCircleX} onPress={() => forceSwipe('dislike')} activeOpacity={0.8}>
          <X size={28} color={colors.labelSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCircleHeart} onPress={() => forceSwipe('like')} activeOpacity={0.8}>
          <Heart size={28} color={colors.ink} strokeWidth={2} fill={colors.ink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.screenX,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenX,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  header: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  countBadge: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginBottom: 20,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: SCREEN_WIDTH - spacing.screenX * 2,
    backgroundColor: colors.white,
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardBehind: {
    top: 12,
    transform: [{ scale: 0.96 }],
  },
  iconArea: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 48,
  },
  cardBody: {
    padding: spacing.cardPad,
    paddingTop: 18,
    paddingBottom: 24,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  categoryPillText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    textTransform: 'capitalize',
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 10,
  },
  cardDesc: {
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardCity: {
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    fontSize: 13,
  },
  likeBadge: {
    position: 'absolute',
    top: 24,
    left: 20,
    zIndex: 10,
    backgroundColor: colors.lime,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  likeText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: 1,
  },
  nopeBadge: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 10,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(32,32,32,0.10)',
  },
  nopeText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: 1,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 20,
  },
  btnCircleX: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(32,32,32,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  btnCircleHeart: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  doneTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 8,
  },
  doneSub: {
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 32,
  },
  doneBtn: {
    width: '100%',
  },
});
