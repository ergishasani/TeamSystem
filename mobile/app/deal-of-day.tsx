import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Clock,
  Flame,
  Users,
  UtensilsCrossed,
  Leaf,
  Dumbbell,
  Plane,
  BookOpen,
  Heart,
  Tag,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dealsApi, requestsApi } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { colors, fonts, radius, spacing } from "@/lib/theme";

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  food: UtensilsCrossed,
  wellness: Leaf,
  fitness: Dumbbell,
  travel: Plane,
  learning: BookOpen,
  health: Heart,
};

export default function DealOfDayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    dealsApi
      .today()
      .then((res) => setDeal(res.data))
      .catch(() => setDeal(null))
      .finally(() => setLoading(false));
  }, []);

  const handleClaim = async () => {
    if (!deal || requesting) return;
    setRequesting(true);
    try {
      const res = await requestsApi.create({
        offer_id: deal.offer_id,
        request_type: "single_offer",
      });
      router.push(`/requests/${res.data.id}` as any);
    } catch (err: any) {
      Alert.alert(
        "Could not claim",
        err?.response?.data?.detail ?? "Something went wrong. Try again.",
      );
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (!deal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Drop</Text>
          <View style={{ width: 44 }} />
        </View>
        <EmptyState
          title="No deal today"
          message="Check back tomorrow for a fresh drop."
        />
      </View>
    );
  }

  const offer = deal.offer;
  const dealPrice = Number(deal.deal_price ?? offer.price);
  const origPrice = Number(offer.price);
  const hasDiscount = deal.deal_price && dealPrice < origPrice;
  const savings = origPrice - dealPrice;
  const hoursLeft = Math.max(1, 23 - new Date().getHours());
  const remaining =
    deal.quantity_limit != null
      ? deal.quantity_limit - deal.quantity_claimed
      : null;
  const claimed =
    deal.quantity_limit != null
      ? Math.round((deal.quantity_claimed / deal.quantity_limit) * 100)
      : null;
  const DealIcon = CATEGORY_ICONS[offer?.category] ?? Tag;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Drop</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Orange hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Deal of the Day</Text>
          </View>

          <Text style={styles.heroTitle}>{offer.title}</Text>
          {offer.provider_name && (
            <Text style={styles.heroProvider}>{offer.provider_name}</Text>
          )}

          <View style={styles.heroPriceRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.priceInline}>
                <Text style={styles.heroPrice}>
                  {dealPrice.toLocaleString()} ALL
                </Text>
                {hasDiscount && (
                  <Text style={styles.heroOrigPrice}>
                    {origPrice.toLocaleString()} ALL
                  </Text>
                )}
              </View>
              {hasDiscount && (
                <View style={[styles.savingsBadge, { marginTop: 10 }]}>
                  <Text style={styles.savingsText}>
                    Save {savings.toLocaleString()} ALL
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.heroIconWrap} pointerEvents="none">
              <DealIcon size={80} color="rgba(0,0,0,0.12)" strokeWidth={1.25} />
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Clock size={18} color={colors.labelSecondary} strokeWidth={1.5} />
            <Text style={styles.statValue}>{hoursLeft}h</Text>
            <Text style={styles.statLabel}>EXPIRES IN</Text>
          </View>
          {remaining !== null && (
            <View style={styles.statCard}>
              <Flame
                size={18}
                color={colors.labelSecondary}
                strokeWidth={1.5}
              />
              <Text style={styles.statValue}>
                {remaining}/{deal.quantity_limit}
              </Text>
              <Text style={styles.statLabel}>REMAINING</Text>
            </View>
          )}
          {claimed !== null && (
            <View style={styles.statCard}>
              <Users
                size={18}
                color={colors.labelSecondary}
                strokeWidth={1.5}
              />
              <Text style={styles.statValue}>{claimed}%</Text>
              <Text style={styles.statLabel}>CLAIMED</Text>
            </View>
          )}
        </View>

        {/* Details card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailCategory}>
            {offer.category?.toUpperCase()}
          </Text>
          {offer.description && (
            <Text style={styles.detailDesc}>{offer.description}</Text>
          )}
          {(offer.city || offer.valid_until) && (
            <Text style={styles.detailMeta}>
              {[
                offer.city,
                offer.valid_until &&
                  `Valid until ${new Date(offer.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" })}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}
        </View>

        {/* How drops work */}
        <Text style={styles.howTitle}>How drops work</Text>
        <View style={styles.howCard}>
          {[
            "One curated offer per day at a deep discount.",
            "Limited quantity & countdown — first come, first served.",
            "Approval is instant if it fits your monthly budget.",
          ].map((text, i) => (
            <View key={i} style={[styles.howRow, i > 0 && styles.howRowBorder]}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.howText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push(`/offers/${deal.offer_id}` as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBtnText}>View offer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.claimBtn, requesting && { opacity: 0.6 }]}
          onPress={handleClaim}
          activeOpacity={0.85}
          disabled={requesting}
        >
          <Text style={styles.claimBtnText}>
            {requesting ? "Requesting..." : "Claim drop"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenX,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink },

  content: { paddingHorizontal: spacing.screenX, paddingTop: 4, gap: 16 },

  heroCard: {
    backgroundColor: "#FFAB40",
    borderRadius: radius["2xl"],
    padding: 22,
    gap: 10,
    overflow: "hidden",
  },
  heroBadge: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  heroBadgeText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroProvider: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "rgba(0,0,0,0.55)",
  },
  heroPriceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 4 },
  heroIconWrap: { justifyContent: "flex-end", paddingBottom: 4 },
  priceInline: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  heroPrice: {
    fontSize: 30,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
  },
  heroOrigPrice: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: "rgba(0,0,0,0.4)",
    textDecorationLine: "line-through",
  },
  savingsBadge: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  savingsText: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 14,
    gap: 4,
    alignItems: "flex-start",
  },
  statValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.labelTertiary,
    letterSpacing: 0.5,
  },

  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: radius["2xl"],
    padding: 20,
    gap: 10,
  },
  detailCategory: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.labelTertiary,
    letterSpacing: 1.2,
  },
  detailDesc: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    lineHeight: 24,
  },
  detailMeta: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
  },

  howTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  howCard: {
    backgroundColor: colors.white,
    borderRadius: radius["2xl"],
    overflow: "hidden",
  },
  howRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  howRowBorder: { borderTopWidth: 1, borderTopColor: colors.paper },
  howNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  howNumText: { fontSize: 13, fontFamily: fonts.bold, color: colors.white },
  howText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    lineHeight: 22,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: spacing.screenX,
    paddingTop: 16,
    backgroundColor: colors.paper,
  },
  viewBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.surface3,
  },
  viewBtnText: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink },
  claimBtn: {
    flex: 2,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    justifyContent: "center",
    alignItems: "center",
  },
  claimBtnText: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
});
