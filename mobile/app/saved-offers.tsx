import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Leaf, Dumbbell, UtensilsCrossed, Plane,
  BookOpen, Heart, Stethoscope, MapPin, BookmarkMinus,
} from 'lucide-react-native';
import { offersApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Offer } from '@/types';

// ─── Category config ──────────────────────────────────────────────────────────

const CAT: Record<string, { color: string; icon: any }> = {
  wellness:  { color: '#C4B5FD', icon: Leaf },
  fitness:   { color: '#CAED64', icon: Dumbbell },
  food:      { color: '#FDBA74', icon: UtensilsCrossed },
  travel:    { color: '#93C5FD', icon: Plane },
  learning:  { color: '#FDE68A', icon: BookOpen },
  health:    { color: '#6EE7B7', icon: Stethoscope },
  lifestyle: { color: '#FCA5A5', icon: Heart },
};

function categoryConfig(cat: string) {
  return CAT[cat.toLowerCase()] ?? { color: '#E5E7EB', icon: MapPin };
}

// ─── Offer row ────────────────────────────────────────────────────────────────

function OfferRow({
  offer,
  onPress,
  onUnsave,
  divider,
}: {
  offer: Offer;
  onPress: () => void;
  onUnsave: () => void;
  divider: boolean;
}) {
  const { color, icon: Icon } = categoryConfig(offer.category);
  const formattedPrice = Number(offer.price).toLocaleString('en-US') + ' ' + (offer.currency || 'ALL');

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        {/* Category icon square */}
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          <Icon size={28} color="rgba(0,0,0,0.5)" strokeWidth={1.5} />
        </View>

        {/* Info */}
        <View style={styles.rowInfo}>
          <View style={styles.topLine}>
            <View style={styles.catPill}>
              <Text style={styles.catText}>
                {offer.category.charAt(0).toUpperCase() + offer.category.slice(1)}
              </Text>
            </View>
            <Text style={styles.price}>{formattedPrice}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{offer.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {offer.provider_name ? `${offer.provider_name} · ` : ''}{offer.city}
          </Text>
        </View>

        {/* Unsave */}
        <TouchableOpacity
          style={styles.unsaveBtn}
          onPress={onUnsave}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <BookmarkMinus size={18} color={colors.labelTertiary} strokeWidth={1.75} />
        </TouchableOpacity>
      </TouchableOpacity>
      {divider && <View style={styles.divider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedOffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await offersApi.getSaved();
      setOffers(Array.isArray(res.data) ? res.data : []);
    } catch {
      Alert.alert('Error', 'Could not load saved offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnsave = useCallback((offer: Offer) => {
    Alert.alert(
      'Remove saved offer',
      `Remove "${offer.title}" from your saved offers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setOffers((prev) => prev.filter((o) => o.id !== offer.id));
            try {
              await offersApi.unsave(offer.id);
            } catch {
              setOffers((prev) => [...prev, offer]);
              Alert.alert('Error', 'Could not remove offer. Try again.');
            }
          },
        },
      ],
    );
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Offers</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lime} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {offers.length} {offers.length === 1 ? 'offer' : 'offers'} saved · sorted by recent
          </Text>

          {offers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No saved offers yet</Text>
              <Text style={styles.emptyBody}>
                Browse the Explore tab and tap the bookmark icon to save offers here.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {offers.map((offer, idx) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  divider={idx < offers.length - 1}
                  onPress={() => router.push(`/offers/${offer.id}` as any)}
                  onUnsave={() => handleUnsave(offer)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.screenX, paddingVertical: 14,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: fonts.bold, color: colors.ink },
  headerRight: { width: 44 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: { paddingHorizontal: spacing.screenX, paddingTop: 4 },

  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, marginBottom: 14 },

  // Card
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconBox: {
    width: 72, height: 72, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowInfo: { flex: 1, gap: 4 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catPill: {
    backgroundColor: colors.paper, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  catText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  price: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  title: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink },
  meta: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },

  unsaveBtn: { paddingLeft: 6, flexShrink: 0 },

  divider: { height: 1, backgroundColor: colors.paper, marginLeft: 102 },

  // Empty
  emptyCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 32, alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.ink },
  emptyBody: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, textAlign: 'center', lineHeight: 21 },
});
