import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, X, Info } from 'lucide-react-native';
import { swipeApi } from '@/lib/api';
import type { Offer } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

const CATEGORY_COLORS: Record<string, string> = {
  wellness: '#8B5CF6', fitness: '#F59E0B', food: '#EF4444',
  travel: '#3B82F6', learning: '#06B6D4', health: '#22C55E',
};

const CATEGORY_EMOJI: Record<string, string> = {
  wellness: '🧘', fitness: '🏋️', food: '🍽️',
  travel: '✈️', learning: '📚', health: '❤️',
};

export default function SwipeScreen() {
  const router = useRouter();
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

  if (loading) return <View style={styles.center}><ActivityIndicator color="#22C55E" size="large" /></View>;

  if (done || currentIndex >= deck.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>You've seen everything!</Text>
        <Text style={styles.doneSub}>New offers drop daily. Check back soon.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.doneBtnText}>Browse All Offers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const offer = deck[currentIndex];
  const color = CATEGORY_COLORS[offer.category] || '#22C55E';
  const emoji = CATEGORY_EMOJI[offer.category] || '🎁';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Deal Swipe</Text>
      <Text style={styles.sub}>Swipe right to save · left to skip</Text>

      <View style={styles.cardArea}>
        {/* Next card (behind) */}
        {deck[currentIndex + 1] && (
          <View style={[styles.card, styles.cardBehind]}>
            <View style={[styles.cardBanner, { backgroundColor: (CATEGORY_COLORS[deck[currentIndex + 1].category] || '#22C55E') + '30' }]} />
          </View>
        )}

        {/* Current card */}
        <Animated.View
          style={[styles.card, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
          {...panResponder.panHandlers}
        >
          <Animated.View style={[styles.likeBadge, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>LIKE 💚</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeBadge, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>SKIP 👋</Text>
          </Animated.View>

          <View style={[styles.cardBanner, { backgroundColor: color + '30' }]}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={[styles.badge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.badgeText, { color }]}>{offer.category}</Text>
            </View>
            <Text style={styles.cardTitle}>{offer.title}</Text>
            <Text style={styles.cardPrice}>{Number(offer.price).toLocaleString()} {offer.currency}</Text>
            {offer.description ? <Text style={styles.cardDesc} numberOfLines={3}>{offer.description}</Text> : null}
            <Text style={styles.cardCity}>📍 {offer.city}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnNope]} onPress={() => forceSwipe('dislike')}>
          <X size={28} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.infoBtn} onPress={() => router.push(`/offers/${offer.id}`)}>
          <Info size={20} color="#A1A1AA" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnLike]} onPress={() => forceSwipe('like')}>
          <Heart size={28} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>{deck.length - currentIndex} offers left</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111', paddingTop: 60 },
  center: { flex: 1, backgroundColor: '#111111', justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 20 },
  sub: { color: '#A1A1AA', fontSize: 13, paddingHorizontal: 20, marginTop: 4, marginBottom: 16 },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBehind: { top: 10, transform: [{ scale: 0.96 }] },
  cardBanner: { height: 200, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 64 },
  cardBody: { padding: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  cardPrice: { fontSize: 26, fontWeight: '900', color: '#22C55E', marginBottom: 10 },
  cardDesc: { color: '#A1A1AA', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  cardCity: { color: '#A1A1AA', fontSize: 13 },
  likeBadge: { position: 'absolute', top: 24, left: 20, zIndex: 10, backgroundColor: '#22C55E20', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 2, borderColor: '#22C55E' },
  likeText: { color: '#22C55E', fontWeight: '900', fontSize: 18 },
  nopeBadge: { position: 'absolute', top: 24, right: 20, zIndex: 10, backgroundColor: '#EF444420', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 2, borderColor: '#EF4444' },
  nopeText: { color: '#EF4444', fontWeight: '900', fontSize: 18 },
  buttons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 24 },
  btn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  btnNope: { borderColor: '#EF4444', backgroundColor: '#EF444415' },
  btnLike: { borderColor: '#22C55E', backgroundColor: '#22C55E15' },
  infoBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2A2A2A' },
  count: { color: '#A1A1AA', textAlign: 'center', fontSize: 12, paddingBottom: 16 },
  doneEmoji: { fontSize: 64, marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  doneSub: { color: '#A1A1AA', textAlign: 'center', marginBottom: 24 },
  doneBtn: { backgroundColor: '#22C55E', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  doneBtnText: { color: '#111', fontWeight: '700', fontSize: 15 },
});
