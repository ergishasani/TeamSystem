import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CreditCard } from 'lucide-react-native';
import { cardsApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { Card } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: (card: Card) => void;
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function getLastFour(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '').slice(-4);
}

export function AddCardModal({ visible, onClose, onAdded }: Props) {
  const insets = useSafeAreaInsets();
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nameRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  const reset = () => {
    setCardNumber('');
    setCardName('');
    setExpiry('');
    setCvv('');
    setError('');
    setCardType('debit');
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 16) { setError('Enter a valid 16-digit card number.'); return; }
    if (!cardName.trim()) { setError('Enter the cardholder name.'); return; }
    const [mm] = expiry.split('/');
    if (expiry.length < 5 || parseInt(mm) < 1 || parseInt(mm) > 12) {
      setError('Enter a valid expiry date (MM/YY).');
      return;
    }
    if (cvv.length < 3) { setError('Enter a valid CVV.'); return; }

    setError('');
    setSaving(true);
    try {
      const lastFour = getLastFour(cardNumber);
      const res = await cardsApi.add({
        card_type: cardType,
        brand: 'Visa',
        last_four: lastFour,
        expiry,
        is_primary: false,
      });
      onAdded(res.data);
      reset();
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg ?? String(d)).join(', ')
        : typeof detail === 'string' ? detail : 'Failed to add card.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Live card preview values
  const displayNumber = cardNumber || '•••• •••• •••• ••••';
  const displayName = cardName || 'FULL NAME';
  const displayExpiry = expiry || 'MM/YY';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <Pressable onPress={() => {}}>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.sheetTitle}>Add a card</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <X size={18} color={colors.ink} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Live card preview */}
                <View style={[styles.cardPreview, cardType === 'credit' && styles.cardPreviewDark]}>
                  {/* Watermark */}
                  <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <View style={styles.wmContainer}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Text key={i} style={[styles.wmRow, cardType === 'credit' && styles.wmRowDark]}>
                          NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO. NEO.
                        </Text>
                      ))}
                    </View>
                  </View>

                  {/* Top row */}
                  <View style={styles.previewTop}>
                    <Text style={[styles.previewBrand, cardType === 'credit' && styles.textWhite]}>P.</Text>
                    {/* Mastercard circles */}
                    <View style={styles.mcWrap}>
                      <View style={[styles.mcCircle, { backgroundColor: '#E8284A', left: 0 }]} />
                      <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', left: 14 }]} />
                    </View>
                  </View>

                  {/* Card number */}
                  <Text style={[styles.previewNumber, cardType === 'credit' && styles.textWhite]}>
                    {displayNumber.replace(/\S{4}/g, (m, i) => (i > 0 ? ' ' + m : m))}
                  </Text>

                  {/* Bottom row */}
                  <View style={styles.previewBottom}>
                    <View>
                      <Text style={[styles.previewMeta, cardType === 'credit' && styles.metaDark]}>CARD HOLDER</Text>
                      <Text style={[styles.previewValue, cardType === 'credit' && styles.textWhite]}>{displayName.toUpperCase()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.previewMeta, cardType === 'credit' && styles.metaDark]}>EXPIRES</Text>
                      <Text style={[styles.previewValue, cardType === 'credit' && styles.textWhite]}>{displayExpiry}</Text>
                    </View>
                  </View>
                </View>

                {/* Card type picker */}
                <Text style={styles.label}>Card type</Text>
                <View style={styles.typePicker}>
                  {(['debit', 'credit'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typePill, cardType === t && styles.typePillActive]}
                      onPress={() => setCardType(t)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.typePillText, cardType === t && styles.typePillTextActive]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Form card */}
                <View style={styles.formCard}>
                  {/* Card number */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Card Number</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={colors.labelTertiary}
                      value={cardNumber}
                      onChangeText={(v) => {
                        setCardNumber(formatCardNumber(v));
                        setError('');
                      }}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => nameRef.current?.focus()}
                    />
                  </View>

                  <View style={styles.divider} />

                  {/* Cardholder name */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Cardholder Name</Text>
                    <TextInput
                      ref={nameRef}
                      style={styles.fieldInput}
                      placeholder="Arta Hoxha"
                      placeholderTextColor={colors.labelTertiary}
                      value={cardName}
                      onChangeText={(v) => { setCardName(v); setError(''); }}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => expiryRef.current?.focus()}
                    />
                  </View>

                  <View style={styles.divider} />

                  {/* Expiry + CVV side by side */}
                  <View style={styles.halfRow}>
                    <View style={[styles.fieldRow, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Expiry Date</Text>
                      <TextInput
                        ref={expiryRef}
                        style={styles.fieldInput}
                        placeholder="MM/YY"
                        placeholderTextColor={colors.labelTertiary}
                        value={expiry}
                        onChangeText={(v) => {
                          setExpiry(formatExpiry(v));
                          setError('');
                        }}
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() => cvvRef.current?.focus()}
                      />
                    </View>
                    <View style={styles.halfDivider} />
                    <View style={[styles.fieldRow, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>CVV</Text>
                      <TextInput
                        ref={cvvRef}
                        style={styles.fieldInput}
                        placeholder="•••"
                        placeholderTextColor={colors.labelTertiary}
                        value={cvv}
                        onChangeText={(v) => { setCvv(v.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                        keyboardType="numeric"
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                      />
                    </View>
                  </View>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* Save button */}
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  activeOpacity={0.82}
                  disabled={saving}
                >
                  <CreditCard size={18} color={colors.white} strokeWidth={2} style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Add Card'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  kav: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Live card preview
  cardPreview: {
    height: 190,
    backgroundColor: colors.lime,
    borderRadius: radius['2xl'],
    padding: 22,
    marginBottom: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardPreviewDark: {
    backgroundColor: colors.ink,
  },
  wmContainer: {
    position: 'absolute',
    top: -20, left: -60, right: -60, bottom: -20,
    transform: [{ rotate: '-18deg' }],
    gap: 10,
    justifyContent: 'center',
  },
  wmRow: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: 'rgba(160,195,50,0.4)',
    letterSpacing: 1,
    lineHeight: 26,
  },
  wmRowDark: {
    color: 'rgba(255,255,255,0.06)',
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBrand: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  textWhite: {
    color: colors.white,
  },
  mcWrap: {
    width: 42,
    height: 26,
    position: 'relative',
  },
  mcCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
    top: 0,
    opacity: 0.92,
  },
  previewNumber: {
    fontSize: 17,
    fontFamily: fonts.mono,
    color: colors.ink,
    letterSpacing: 2.5,
    textAlign: 'center',
    marginTop: 8,
  },
  previewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  previewMeta: {
    fontSize: 9,
    fontFamily: fonts.medium,
    color: 'rgba(32,32,32,0.5)',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metaDark: {
    color: 'rgba(255,255,255,0.4)',
  },
  previewValue: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.ink,
    letterSpacing: 0.4,
  },

  // Type picker
  label: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginBottom: 8,
  },
  typePicker: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typePill: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typePillActive: { backgroundColor: colors.ink },
  typePillText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  typePillTextActive: { color: colors.white },

  // Form card (login-style grouped card)
  formCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.xl,
    marginBottom: 12,
    overflow: 'hidden',
  },
  fieldRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginBottom: 5,
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink,
    height: 26,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginHorizontal: 16,
  },
  halfRow: {
    flexDirection: 'row',
  },
  halfDivider: {
    width: 1,
    backgroundColor: colors.separator,
    marginVertical: 12,
  },

  error: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.destructive,
    marginBottom: 12,
  },

  saveBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.semiBold,
  },
});
