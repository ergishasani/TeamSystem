import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import type { Card } from '@/types';
import { colors, fonts, radius } from '@/lib/theme';

interface Props {
  card: Card;
  onRemove: (id: number) => void;
  wide?: boolean;
}

function MastercardIcon() {
  return (
    <View style={mc.wrap}>
      <View style={[mc.circle, mc.red]} />
      <View style={[mc.circle, mc.orange]} />
    </View>
  );
}

const mc = StyleSheet.create({
  wrap: { width: 50, height: 30, position: 'relative' },
  circle: { width: 30, height: 30, borderRadius: 15, position: 'absolute', top: 0, opacity: 0.96 },
  red: { backgroundColor: '#E8284A', left: 0 },
  orange: { backgroundColor: '#F79E1B', left: 18 },
});

function LimeDebitCard({ card, onRemove, wide }: Props) {
  return (
    <View style={[styles.limeCard, wide && styles.limeCardWide]}>
      {/* Watermark */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.watermarkContainer}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Text key={i} style={styles.watermarkRow}>NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO.</Text>
          ))}
        </View>
      </View>

      {/* Remove button */}
      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(card.id)} activeOpacity={0.7}>
        <X size={12} color={colors.ink} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Top row */}
      <View style={styles.cardTopRow}>
        <Text style={styles.brandLogo}>P.</Text>
        <MastercardIcon />
      </View>

      {/* Bottom */}
      <View style={styles.cardBottom}>
        <Text style={styles.cardTypeLabel}>
          {card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)} Card
        </Text>
        <Text style={styles.cardNumber}>{'•••• '}{card.last_four}</Text>
      </View>
    </View>
  );
}

function DarkCreditCard({ card, onRemove, wide }: Props) {
  if (wide) {
    return (
      <View style={[styles.darkCard, styles.darkCardWide]}>
        {/* Watermark */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.watermarkContainer}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Text key={i} style={styles.watermarkRowDark}>NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO.</Text>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.removeBtnDark} onPress={() => onRemove(card.id)} activeOpacity={0.7}>
          <X size={12} color={colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.cardTopRow}>
          <Text style={styles.brandLogoDark}>P.</Text>
          <MastercardIcon />
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.darkCardTypeLabel}>
            {card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)} Card
          </Text>
          <Text style={styles.darkCardNumberWide}>{'•••• '}{card.last_four}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.darkCard}>
      <TouchableOpacity style={styles.removeBtnDark} onPress={() => onRemove(card.id)} activeOpacity={0.7}>
        <X size={12} color={colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.darkCardLabel}>
        {card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)}{'\n'}card
      </Text>
      <Text style={styles.darkCardNumber}>•••• {card.last_four}</Text>
    </View>
  );
}

export function CardItem({ card, onRemove, wide }: Props) {
  if (card.card_type === 'credit') {
    return <DarkCreditCard card={card} onRemove={onRemove} wide={wide} />;
  }
  return <LimeDebitCard card={card} onRemove={onRemove} wide={wide} />;
}

const CARD_HEIGHT = 158;
const CARD_HEIGHT_WIDE = 200;

const styles = StyleSheet.create({
  // ── Lime debit card ──────────────────────────────────────────────────────────
  limeCard: {
    width: 300,
    height: CARD_HEIGHT,
    backgroundColor: colors.lime,
    borderRadius: radius['2xl'],
    padding: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  limeCardWide: {
    width: undefined,
    height: CARD_HEIGHT_WIDE,
    padding: 26,
  },

  // ── Dark credit card ─────────────────────────────────────────────────────────
  darkCard: {
    width: 200,
    height: CARD_HEIGHT,
    backgroundColor: colors.ink,
    borderRadius: radius['2xl'],
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  darkCardWide: {
    width: undefined,
    height: CARD_HEIGHT_WIDE,
    padding: 26,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },

  // ── Watermark ────────────────────────────────────────────────────────────────
  watermarkContainer: {
    position: 'absolute',
    top: -20, left: -60, right: -60, bottom: -20,
    transform: [{ rotate: '-20deg' }],
    gap: 8,
    justifyContent: 'center',
  },
  watermarkRow: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: 'rgba(160,195,50,0.45)',
    letterSpacing: 1,
    lineHeight: 28,
  },
  watermarkRowDark: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: 'rgba(255,255,255,0.05)',
    letterSpacing: 1,
    lineHeight: 28,
  },

  // ── Shared layout ────────────────────────────────────────────────────────────
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLogo: { fontSize: 36, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -1 },
  brandLogoDark: { fontSize: 36, fontFamily: fonts.bold, color: colors.white, letterSpacing: -1 },

  cardBottom: { gap: 4 },
  cardTypeLabel: { fontSize: 13, fontFamily: fonts.medium, color: 'rgba(32,32,32,0.55)', letterSpacing: 0.1 },
  cardNumber: { fontSize: 20, fontFamily: fonts.mono, color: colors.ink, letterSpacing: 1 },

  darkCardTypeLabel: { fontSize: 13, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.1 },
  darkCardNumberWide: { fontSize: 20, fontFamily: fonts.mono, color: colors.white, letterSpacing: 1 },

  // ── Compact dark card (narrow, home scroll) ──────────────────────────────────
  darkCardLabel: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 10,
  },
  darkCardNumber: { fontSize: 13, fontFamily: fonts.mono, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 },

  // ── Remove buttons ───────────────────────────────────────────────────────────
  removeBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  removeBtnDark: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
});
