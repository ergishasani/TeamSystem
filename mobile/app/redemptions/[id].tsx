import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Share2, CircleCheck, Tag, Hash, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { redemptionsApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { colors, fonts, radius, spacing } from '@/lib/theme';

// Try to import QR code library; graceful fallback if not installed
let QRCode: React.ComponentType<{ value: string; size: number; backgroundColor: string; color: string }> | null = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch {
  QRCode = null;
}

interface Redemption {
  id: number;
  request_id: number;
  offer_id: number;
  provider_id: number;
  qr_code: string;
  status: string;
  offer_title: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
}

const STATUS_CONFIG: Record<string, { color: string; outerBg: string; label: string }> = {
  active:   { color: '#3A7D44', outerBg: '#D6F0DB', label: 'ACTIVE · READY TO REDEEM' },
  redeemed: { color: colors.labelSecondary, outerBg: colors.paper, label: 'REDEEMED' },
  expired:  { color: '#D94F4F', outerBg: '#FFE5E5', label: 'EXPIRED' },
};

function DetailRow({
  icon: Icon,
  label,
  value,
  divider,
}: {
  icon: any;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <>
      {divider && <View style={styles.detailDivider} />}
      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Icon size={18} color={colors.labelSecondary} strokeWidth={1.75} />
        </View>
        <Text style={styles.detailName}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </>
  );
}

export default function RedemptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    redemptionsApi.getById(Number(id))
      .then((res) => setRedemption(res.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!redemption) return;
    try {
      await Share.share({
        message: `My Perka redemption code: ${redemption.qr_code}`,
        title: 'Perka Redemption Code',
      });
    } catch {}
  };

  if (loading) return <LoadingState />;
  if (!redemption) return null;

  const cfg = STATUS_CONFIG[redemption.status] ?? STATUS_CONFIG.active;

  const expiresStr = redemption.expires_at
    ? new Date(redemption.expires_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

  const offerLabel = redemption.offer_title ?? `Offer #${redemption.offer_id}`;
  const idLabel = `RD${redemption.id}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redemption</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Share2 size={19} color={colors.ink} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status indicator */}
        <View style={styles.statusWrap}>
          <View style={[styles.statusOuter, { backgroundColor: cfg.outerBg }]}>
            <CircleCheck size={30} color={cfg.color} strokeWidth={1.75} />
          </View>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* QR card */}
        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            {QRCode ? (
              <QRCode
                value={redemption.qr_code}
                size={220}
                backgroundColor={colors.white}
                color={colors.ink}
              />
            ) : (
              /* Pixel-grid fallback renders the code visually */
              <View style={styles.qrFallback}>
                <Text style={styles.qrFallbackText}>{redemption.qr_code}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Code + hint */}
        <Text style={styles.codeText}>{redemption.qr_code}</Text>
        <Text style={styles.codeHint}>
          Show this code to the provider to redeem your benefit.
        </Text>

        {/* Details */}
        <Text style={styles.sectionLabel}>Redemption</Text>
        <View style={styles.detailsCard}>
          <DetailRow icon={Tag}      label="Offer"   value={offerLabel} />
          <DetailRow icon={Hash}     label="ID"      value={idLabel} divider />
          <DetailRow icon={Calendar} label="Expires" value={expiresStr} divider />
          {redemption.redeemed_at && (
            <DetailRow
              icon={CircleCheck}
              label="Redeemed"
              value={new Date(redemption.redeemed_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
              divider
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  shareBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },

  content: { paddingHorizontal: spacing.screenX, paddingTop: 8, gap: 14, alignItems: 'center' },

  // Status
  statusWrap: { alignItems: 'center', gap: 12 },
  statusOuter: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  statusLabel: { fontSize: 13, fontFamily: fonts.bold, letterSpacing: 1 },

  // QR
  qrCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 20, alignSelf: 'stretch', alignItems: 'center',
  },
  qrBox: {
    width: 240, height: 240,
    justifyContent: 'center', alignItems: 'center',
  },
  qrFallback: {
    width: 240, height: 240,
    backgroundColor: colors.paper, borderRadius: radius.lg,
    justifyContent: 'center', alignItems: 'center', padding: 12,
  },
  qrFallbackText: {
    fontSize: 8, fontFamily: fonts.mono ?? fonts.semiBold,
    color: colors.ink, textAlign: 'center', lineHeight: 14, letterSpacing: 1,
  },

  // Code
  codeText: {
    fontSize: 14, fontFamily: fonts.mono ?? fonts.semiBold,
    color: colors.ink, letterSpacing: 3, textAlign: 'center',
  },
  codeHint: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 16,
  },

  // Details
  sectionLabel: {
    fontSize: 18, fontFamily: fonts.bold, color: colors.ink,
    letterSpacing: -0.3, alignSelf: 'flex-start',
  },
  detailsCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    paddingHorizontal: 18, alignSelf: 'stretch',
  },
  detailDivider: { height: 1, backgroundColor: colors.paper },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  detailIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  detailName: { flex: 1, fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
  detailValue: { fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary },
});
