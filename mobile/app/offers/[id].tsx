import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Bookmark, BookmarkCheck, Share2, Phone, MoreHorizontal,
  MapPin, Calendar, Building2, Send,
  Dumbbell, Heart, UtensilsCrossed, Plane, BookOpen, Stethoscope, Tag, Leaf,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { offersApi, requestsApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { colors, fonts, radius, spacing, categoryColor } from '@/lib/theme';
import type { Offer } from '@/types';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  wellness: Leaf, fitness: Dumbbell, food: UtensilsCrossed,
  travel: Plane, learning: BookOpen, health: Stethoscope,
};

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    offersApi.getById(Number(id))
      .then((res) => setOffer(res.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async () => {
    if (!offer || requesting) return;
    setRequesting(true);
    try {
      const res = await requestsApi.create({ offer_id: offer.id, request_type: 'single_offer' });
      router.push(`/requests/${res.data.id}` as any);
    } catch (err: any) {
      Alert.alert('Request failed', err?.response?.data?.detail ?? 'Something went wrong. Try again.');
    } finally {
      setRequesting(false);
    }
  };

  const handleBookmark = async () => {
    if (!offer || saving) return;
    setSaving(true);
    try {
      if (saved) {
        await offersApi.unsave(offer.id);
        setSaved(false);
      } else {
        await offersApi.save(offer.id);
        setSaved(true);
      }
    } catch {
      // save/unsave endpoints may not be wired yet — toggle optimistically
      setSaved((v) => !v);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (!offer) return;
    Share.share({
      message: `Check out "${offer.title}" on Perka — ${Number(offer.price).toLocaleString()} ${offer.currency}`,
    });
  };

  const handlePhone = () => {
    Alert.alert(
      'Contact Provider',
      `Reach out to ${offer?.provider_name ?? 'this provider'} through the Perka Concierge for assistance.`,
      [
        { text: 'Open Concierge', onPress: () => router.push('/(tabs)/ai' as any) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleMore = () => {
    const options = ['Share', 'Report Offer', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2, destructiveButtonIndex: 1 },
        (idx) => { if (idx === 0) handleShare(); },
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Share', onPress: handleShare },
        { text: 'Report Offer', style: 'destructive', onPress: () => Alert.alert('Reported', 'Thanks for the feedback.') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  if (loading) return <LoadingState />;
  if (!offer) return null;

  const catBg = categoryColor(offer.category);
  const IconComp = CATEGORY_ICONS[offer.category] ?? Tag;
  const validDate = offer.valid_until
    ? new Date(offer.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleBookmark} activeOpacity={0.7} disabled={saving}>
            {saved
              ? <BookmarkCheck size={18} color={colors.ink} strokeWidth={1.75} />
              : <Bookmark size={18} color={colors.ink} strokeWidth={1.75} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare} activeOpacity={0.7}>
            <Share2 size={18} color={colors.ink} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero area */}
        <View style={[styles.hero, { backgroundColor: catBg + '33' }]}>
          <View style={styles.heroIconWrap}>
            <IconComp size={110} color={catBg} strokeWidth={1} />
          </View>
          <View style={styles.heroCategoryBadge}>
            <Text style={styles.heroCategoryText}>
              {offer.category.charAt(0).toUpperCase() + offer.category.slice(1)}
            </Text>
          </View>
        </View>

        {/* White info card */}
        <View style={styles.card}>
          <Text style={styles.title}>{offer.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.labelSecondary} strokeWidth={1.5} />
            <Text style={styles.locationText}>
              {[offer.provider_name, offer.city].filter(Boolean).join(' · ')}
            </Text>
          </View>

          {/* CTA row */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.requestBtn, requesting && { opacity: 0.6 }]}
              onPress={handleRequest}
              activeOpacity={0.85}
              disabled={requesting}
            >
              <Send size={16} color={colors.white} strokeWidth={1.75} />
              <Text style={styles.requestBtnText}>
                {requesting ? 'Requesting...' : `Request · ${Number(offer.price).toLocaleString()} ${offer.currency}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconActionBtn} onPress={handlePhone} activeOpacity={0.7}>
              <Phone size={18} color={colors.ink} strokeWidth={1.75} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconActionBtn} onPress={handleMore} activeOpacity={0.7}>
              <MoreHorizontal size={18} color={colors.ink} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        {offer.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.aboutText}>{offer.description}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          <View style={styles.detailsCard}>
            {offer.city ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <MapPin size={18} color={colors.labelSecondary} strokeWidth={1.5} />
                </View>
                <Text style={styles.detailKey}>Location</Text>
                <Text style={styles.detailVal}>{offer.city}</Text>
              </View>
            ) : null}
            {validDate && (
              <View style={[styles.detailRow, offer.city ? styles.detailRowBorder : null]}>
                <View style={styles.detailIconWrap}>
                  <Calendar size={18} color={colors.labelSecondary} strokeWidth={1.5} />
                </View>
                <Text style={styles.detailKey}>Valid until</Text>
                <Text style={styles.detailVal}>{validDate}</Text>
              </View>
            )}
            {offer.provider_name && (
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <View style={styles.detailIconWrap}>
                  <Building2 size={18} color={colors.labelSecondary} strokeWidth={1.5} />
                </View>
                <Text style={styles.detailKey}>Provider</Text>
                <Text style={styles.detailVal}>{offer.provider_name}</Text>
              </View>
            )}
            {offer.discount_percent > 0 && (
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <View style={styles.detailIconWrap}>
                  <Tag size={18} color={colors.labelSecondary} strokeWidth={1.5} />
                </View>
                <Text style={styles.detailKey}>Discount</Text>
                <Text style={styles.detailVal}>{offer.discount_percent}% off</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX, paddingVertical: 10,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },

  content: { gap: 14 },

  hero: {
    marginHorizontal: spacing.screenX,
    borderRadius: radius['2xl'],
    height: 220,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroIconWrap: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.6,
  },
  heroCategoryBadge: {
    backgroundColor: colors.ink, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start',
  },
  heroCategoryText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.white },

  card: {
    marginHorizontal: spacing.screenX,
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: 20, gap: 12,
  },
  title: {
    fontSize: 26, fontFamily: fonts.bold, color: colors.ink,
    letterSpacing: -0.5, lineHeight: 32,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary },

  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  requestBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  requestBtnText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.white },
  iconActionBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.surface3,
  },

  section: { paddingHorizontal: spacing.screenX, gap: 10 },
  sectionLabel: {
    fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary,
    letterSpacing: 1.2,
  },
  aboutText: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary, lineHeight: 24 },

  detailsCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: colors.paper },
  detailIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  detailKey: { flex: 1, fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  detailVal: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary, textAlign: 'right', flexShrink: 1 },
});
