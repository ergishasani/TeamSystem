import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  TouchableOpacity, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, X, Inbox } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { swipeApi } from '@/lib/api';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { getOfferImage } from '@/lib/offerImages';
import type { Offer } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
// A quick flick that hasn't crossed SWIPE_THRESHOLD should still register as a swipe.
const VELOCITY_THRESHOLD = 0.75;
const EXIT_DURATION = 220;

const CATEGORY_EMOJI: Record<string, string> = {
  wellness: '🧘', fitness: '🏋️', food: '🍽️',
  travel: '✈️', learning: '📚', health: '❤️',
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
  const [isAnimating, setIsAnimating] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  // Drives the "next card" growing into place as the top card is dragged away.
  const dragProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    swipeApi.getDeck().then((res) => {
      setDeck(res.data.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const cardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH - 100, -SCREEN_WIDTH * 0.9, 0, SCREEN_WIDTH * 0.9, SCREEN_WIDTH + 100],
    outputRange: [0, 1, 1, 1, 0],
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

  // Next card scales/lifts up as the current one is dragged away, in either direction.
  const nextCardScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
    extrapolate: 'clamp',
  });
  const nextCardTranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
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
    dragProgress.setValue(0);
    setIsAnimating(false);
  };

  const animateOff = (direction: 'like' | 'dislike', velocity = 0) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const toX = direction === 'like' ? SCREEN_WIDTH + 150 : -SCREEN_WIDTH - 150;
    // Faster flicks exit faster, slow releases ease out — feels like the deck is responding to you.
    const speed = Math.min(Math.max(Math.abs(velocity), 0.8), 3);
    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: EXIT_DURATION / speed,
      useNativeDriver: false,
    }).start(() => recordSwipe(direction));
  };

  const snapBack = () => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        tension: 60,
        useNativeDriver: false,
      }),
      Animated.spring(dragProgress, { toValue: 0, useNativeDriver: false }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating,
      onMoveShouldSetPanResponder: () => !isAnimating,
      onPanResponderMove: (_, gesture) => {
        // Vertical drift is damped so the card mostly tracks the horizontal swipe.
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.4 });
        dragProgress.setValue(Math.min(Math.abs(gesture.dx) / SWIPE_THRESHOLD, 1));
      },
      onPanResponderRelease: (_, gesture) => {
        const pastThreshold = Math.abs(gesture.dx) > SWIPE_THRESHOLD;
        const fastFlick = Math.abs(gesture.vx) > VELOCITY_THRESHOLD;
        if ((pastThreshold || fastFlick) && gesture.dx > 0) {
          animateOff('like', gesture.vx);
        } else if ((pastThreshold || fastFlick) && gesture.dx < 0) {
          animateOff('dislike', gesture.vx);
        } else {
          snapBack();
        }
      },
      onPanResponderTerminate: snapBack,
    })
  ).current;

  const forceSwipe = (direction: 'like' | 'dislike') => {
    if (isAnimating) return;
    setIsAnimating(true);
    Animated.timing(dragProgress, { toValue: 1, duration: EXIT_DURATION, useNativeDriver: false }).start();
    const toX = direction === 'like' ? SCREEN_WIDTH + 150 : -SCREEN_WIDTH - 150;
    Animated.timing(position, { toValue: { x: toX, y: 0 }, duration: EXIT_DURATION, useNativeDriver: false }).start(() => recordSwipe(direction));
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
  const emoji = CATEGORY_EMOJI[offer.category] || '🎁';
  const offerImg = getOfferImage(offer.title, offer.category);
  const nextOffer = deck[currentIndex + 1];
  const nextImg = nextOffer ? getOfferImage(nextOffer.title, nextOffer.category) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Discover</Text>
        <Text style={styles.countBadge}>{deck.length - currentIndex} left</Text>
      </View>
      <Text style={styles.sub}>Swipe right to save · left to skip</Text>

      {/* Card stack */}
      <View style={styles.cardArea}>
        {/* Next card (behind) — grows into place as the top card is dragged off */}
        {nextOffer && (
          <Animated.View
            style={[
              styles.card,
              styles.cardBehind,
              { transform: [{ scale: nextCardScale }, { translateY: nextCardTranslateY }] },
            ]}
          >
            <View style={[styles.imageArea, { backgroundColor: categoryColor(nextOffer.category) + '25' }]}>
              {nextImg ? (
                <Image source={nextImg} style={styles.imagePhoto} resizeMode="cover" />
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: categoryColor(nextOffer.category) }]}>
                  <Text style={styles.cardEmoji}>{CATEGORY_EMOJI[nextOffer.category] || '🎁'}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Current card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: cardOpacity, transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
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

          {/* Photo area — real photo when we have one, category fallback otherwise */}
          <View style={[styles.imageArea, !offerImg && { backgroundColor: catColor + '25' }]}>
            {offerImg ? (
              <Image source={offerImg} style={styles.imagePhoto} resizeMode="cover" />
            ) : (
              <View style={[styles.iconCircle, { backgroundColor: catColor }]}>
                <Text style={styles.cardEmoji}>{emoji}</Text>
              </View>
            )}
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
        <TouchableOpacity style={styles.btnCircleX} onPress={() => forceSwipe('dislike')} activeOpacity={0.8} disabled={isAnimating}>
          <X size={28} color={colors.labelSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCircleHeart} onPress={() => forceSwipe('like')} activeOpacity={0.8} disabled={isAnimating}>
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
    top: 0,
  },
  imageArea: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
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
