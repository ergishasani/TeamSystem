import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Building2, Phone, MessageCircle, Sparkles, Flame, Leaf, Dumbbell, UtensilsCrossed, Plane, BookOpen, Heart, Tag, Gift, Handshake } from 'lucide-react-native';

const DEAL_CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  wellness: Leaf, fitness: Dumbbell, food: UtensilsCrossed,
  travel: Plane, learning: BookOpen, health: Heart,
};

const PLAY_CARDS = [
  { icon: Heart,      label: 'Deal Swipe',  sub: 'Swipe to teach AI',    circleColor: '#BFEF45', route: '/(tabs)/swipe'   },
  { icon: Gift,       label: 'Shake Shake', sub: '3 tries / day',         circleColor: '#BFEF45', route: '/(tabs)/shake'   },
  { icon: Handshake,  label: 'Collabs',     sub: '2-provider bundles',    circleColor: '#BAE6FD', route: '/collabs' },
] as const;
import { useAuthStore } from '@/store/authStore';
import { walletApi, offersApi, packagesApi, challengesApi, dealsApi, requestsApi, aiApi } from '@/lib/api';
import { WalletCard } from '@/components/WalletCard';
import { PackageCard } from '@/components/PackageCard';
import { OfferCard } from '@/components/OfferCard';
import { ChallengeCard } from '@/components/ChallengeCard';
import { EmptyState } from '@/components/EmptyState';
import { HomeContentSkeleton } from '@/components/Skeleton';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Wallet, Package, Offer, Challenge, AiPick } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [todayDeal, setTodayDeal] = useState<any>(null);
  const [aiPick, setAiPick] = useState<AiPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [w, p, o, c, deal, pick] = await Promise.all([
      walletApi.getWallet(),
      packagesApi.list(),
      offersApi.list({ limit: 6 }),
      challengesApi.list(),
      dealsApi.today().catch(() => null),
      aiApi.pick().catch(() => null),
    ]);
    setWallet(w.data);
    setPackages(p.data.slice(0, 3));
    setOffers(o.data.items?.slice(0, 4) ?? []);
    setChallenges(c.data.slice(0, 2));
    if (deal) setTodayDeal(deal.data);
    if (pick) setAiPick(pick.data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      {/* Static header: always visible */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
          <Text style={styles.subtitle}>Welcome to Perka</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.75} onPress={() => router.push('/notifications' as any)}>
          <Bell size={20} color={colors.ink} strokeWidth={1.75} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {loading ? <HomeContentSkeleton /> : (
        <>

        {/* Wallet */}
        {wallet && (
          <WalletCard
            wallet={wallet}
            onRequestPerk={() => router.push('/(tabs)/explore')}
          />
        )}

        {/* Your AI Pick Today */}
        {aiPick && (
          <>
            <View style={styles.newDropsHeader}>
              <Text style={styles.newDropsTitle}>Your AI Pick Today</Text>
              <Text style={styles.newDropsSub}>One offer, hand-picked</Text>
            </View>
            <TouchableOpacity
              style={styles.aiPickCard}
              onPress={() => router.push(`/offers/${aiPick.offer_id}` as any)}
              activeOpacity={0.88}
            >
              <View style={styles.aiPickCircle} pointerEvents="none" />

              <View style={styles.aiPickBadge}>
                <Sparkles size={12} color={colors.ink} strokeWidth={2} />
                <Text style={styles.aiPickBadgeText}>AI Pick</Text>
              </View>

              <Text style={styles.aiPickName}>{aiPick.title}</Text>
              {aiPick.provider_name && (
                <Text style={styles.aiPickProvider}>{aiPick.provider_name}</Text>
              )}
              <Text style={styles.aiPickDesc} numberOfLines={2}>{aiPick.reason}</Text>

              <View style={styles.aiPickFooter}>
                <Text style={styles.aiPickPrice}>{aiPick.price.toLocaleString()} ALL</Text>
                <TouchableOpacity
                  style={styles.requestBtn}
                  activeOpacity={0.85}
                  onPress={async () => {
                    try {
                      await requestsApi.create({ offer_id: aiPick.offer_id, request_type: 'single_offer' });
                      router.push('/(tabs)/wallet');
                    } catch { /* budget error handled server-side */ }
                  }}
                >
                  <Text style={styles.requestBtnText}>Request →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Today's Drop */}
        {todayDeal && (() => {
          const hoursLeft = Math.max(1, 23 - new Date().getHours());
          const dealPrice = Number(todayDeal.deal_price ?? todayDeal.offer?.price);
          const origPrice = Number(todayDeal.offer?.price);
          const hasDiscount = todayDeal.deal_price && dealPrice < origPrice;
          const DealIcon = DEAL_CATEGORY_ICONS[todayDeal.offer?.category] ?? Tag;
          return (
            <>
              <View style={styles.todayDropHeader}>
                <View>
                  <Text style={styles.newDropsTitle}>Today's Drop</Text>
                  <Text style={styles.newDropsSub}>Limited time, limited quantity</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/deal-of-day')} activeOpacity={0.7}>
                  <Text style={styles.todayDropOpen}>Open →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.dealCard}
                onPress={() => router.push('/deal-of-day')}
                activeOpacity={0.88}
              >
                {/* Top badges row */}
                <View style={styles.dealBadgesRow}>
                  <View style={styles.dealOfDayBadge}>
                    <Flame size={12} color={colors.white} strokeWidth={2} />
                    <Text style={styles.dealOfDayText}>Deal of the Day</Text>
                  </View>
                  <View style={styles.dealTimeBadge}>
                    <Text style={styles.dealTimeText}>{hoursLeft}h left</Text>
                  </View>
                </View>

                <Text style={styles.dealTitle}>{todayDeal.offer?.title}</Text>
                {todayDeal.offer?.provider_name && (
                  <Text style={styles.dealProvider}>{todayDeal.offer.provider_name}</Text>
                )}

                <View style={styles.dealBottom}>
                  <View style={styles.dealPriceRow}>
                    <Text style={styles.dealBigPrice}>{dealPrice.toLocaleString()} ALL</Text>
                    {hasDiscount && (
                      <Text style={styles.dealOldPrice}>{origPrice.toLocaleString()} ALL</Text>
                    )}
                  </View>
                  <DealIcon size={68} color="rgba(0,0,0,0.15)" strokeWidth={1.25} />
                </View>
              </TouchableOpacity>
            </>
          );
        })()}

        {/* Play & Discover */}
        <View style={styles.newDropsHeader}>
          <Text style={styles.newDropsTitle}>Play & discover</Text>
          <Text style={styles.newDropsSub}>Games & activities</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: spacing.screenX }}
          contentContainerStyle={styles.playStrip}
        >
          {PLAY_CARDS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.playCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.playCircle, { backgroundColor: item.circleColor }]}>
                <item.icon size={28} color="#1a1a1a" strokeWidth={1.75} />
              </View>
              <Text style={styles.playCardTitle}>{item.label}</Text>
              <Text style={styles.playCardSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Services */}
        <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>Services</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: spacing.screenX }}
          contentContainerStyle={styles.servicesStrip}
        >
          {[
            { icon: Building2,     label: 'Providers', onPress: () => router.push('/(tabs)/explore') },
            { icon: Phone,         label: 'Concierge', onPress: () => router.push('/concierge' as any) },
            { icon: MessageCircle, label: 'Support',   onPress: () => router.push('/help' as any) },
          ].map(({ icon: Icon, label, onPress }) => (
            <TouchableOpacity key={label} style={styles.serviceBtn} onPress={onPress} activeOpacity={0.8}>
              <View style={styles.serviceIconWrap}>
                <Icon size={20} color={colors.ink} strokeWidth={1.75} />
              </View>
              <Text style={styles.serviceBtnLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


        {/* For You — AI packages */}
        {packages.length > 0 && (
          <>
            <View style={styles.forYouHeader}>
              <View>
                <Text style={styles.forYouTitle}>For You</Text>
                <Text style={styles.forYouSub}>Curated by Perka Intelligence</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.7}>
                <Text style={styles.forYouExplore}>Explore →</Text>
              </TouchableOpacity>
            </View>
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </>
        )}

        {/* New Drops */}
        <View style={styles.newDropsHeader}>
          <View>
            <Text style={styles.newDropsTitle}>New Drops</Text>
            <Text style={styles.newDropsSub}>Fresh this week</Text>
          </View>
        </View>
        {offers.length === 0 ? (
          <EmptyState message="No offers available yet." />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: spacing.screenX }}
            contentContainerStyle={styles.horizontal}
          >
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} compact />
            ))}
          </ScrollView>
        )}

{/* Active Challenges */}
        {challenges.length > 0 && (
          <>
            <View style={styles.newDropsHeader}>
              <Text style={styles.newDropsTitle}>Active Challenges</Text>
              <Text style={styles.newDropsSub}>Earn XP, unlock perks</Text>
            </View>
            <ChallengeCard challenges={challenges} />
          </>
        )}
        </>)}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginTop: 3,
  },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.paper,
  },

  sectionTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sectionTitleStandalone: {
    paddingHorizontal: spacing.screenX,
    marginTop: 32,
    marginBottom: 14,
  },
  horizontal: {
    gap: 12,
  },

  // Services strip
  servicesStrip: {
    gap: 10,
  },
  serviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  serviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceBtnLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },

  // For You section
  forYouHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    marginTop: 32,
    marginBottom: 16,
  },
  forYouTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  forYouSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginTop: 3,
  },
  forYouExplore: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
  },

  // New Drops / shared section header
  newDropsHeader: {
    paddingHorizontal: spacing.screenX,
    marginBottom: 14,
    marginTop: 32,
  },
  newDropsTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  newDropsSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginTop: 3,
  },

  // AI Pick Today card
  aiPickCard: {
    marginHorizontal: spacing.screenX,
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: 20,
    overflow: 'hidden',
    gap: 10,
  },
  aiPickCircle: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EDE9FF',
  },
  aiPickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  aiPickBadgeText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  aiPickName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  aiPickProvider: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginBottom: 4,
  },
  aiPickDesc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    lineHeight: 20,
  },
  aiPickFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  aiPickPrice: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
  },
  requestBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  requestBtnText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },

  // Today's Drop
  todayDropHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    marginBottom: 14,
    marginTop: 28,
  },
  todayDropOpen: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  dealCard: {
    marginHorizontal: spacing.screenX,
    backgroundColor: '#FFAB40',
    borderRadius: radius['2xl'],
    padding: 20,
    gap: 8,
    overflow: 'hidden',
  },
  dealBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dealOfDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dealOfDayText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  dealTimeBadge: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dealTimeText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  dealTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  dealProvider: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.55)',
  },
  dealBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dealBigPrice: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  dealOldPrice: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.4)',
    textDecorationLine: 'line-through',
  },

  // Play & Discover
  playStrip: {
    gap: 12,
  },
  playCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    paddingBottom: 24,
    width: 220,
  },
  playCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  playCardTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  playCardSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    marginTop: 4,
  },

});
