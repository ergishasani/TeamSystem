import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, Trash2, Plus, X, Check } from 'lucide-react-native';
import { cardsApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Card {
  id: number;
  card_type: string;
  brand: string;
  last_four: string;
  expiry: string | null;
  is_primary: boolean;
}

const BRANDS = ['Visa', 'Mastercard', 'Amex', 'Other'] as const;
type Brand = typeof BRANDS[number];

// ─── Add card modal ───────────────────────────────────────────────────────────

function AddCardModal({
  visible,
  onClose,
  onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: (card: Card) => void;
}) {
  const insets = useSafeAreaInsets();
  const [brand, setBrand] = useState<Brand>('Visa');
  const [lastFour, setLastFour] = useState('');
  const [expiry, setExpiry] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setBrand('Visa'); setLastFour(''); setExpiry(''); setIsPrimary(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleAdd = async () => {
    if (lastFour.length !== 4 || !/^\d{4}$/.test(lastFour)) {
      Alert.alert('Invalid card', 'Enter the last 4 digits of your card number.');
      return;
    }
    if (expiry && !/^\d{2}\/\d{2}$/.test(expiry)) {
      Alert.alert('Invalid expiry', 'Enter expiry as MM/YY.');
      return;
    }
    setSaving(true);
    try {
      const res = await cardsApi.add({
        card_type: 'credit',
        brand,
        last_four: lastFour,
        expiry: expiry || '',
        is_primary: isPrimary,
      });
      onAdded(res.data);
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Could not add card.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modal.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modal.avoidWrap}
        >
          <View style={[modal.sheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={modal.handle} />

            {/* Header */}
            <View style={modal.header}>
              <Text style={modal.title}>Add new card</Text>
              <TouchableOpacity onPress={handleClose} style={modal.closeBtn} activeOpacity={0.75}>
                <X size={18} color={colors.labelSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Brand selector */}
            <Text style={modal.fieldLabel}>Card network</Text>
            <View style={modal.brandRow}>
              {BRANDS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[modal.brandPill, brand === b && modal.brandPillActive]}
                  onPress={() => setBrand(b)}
                  activeOpacity={0.8}
                >
                  <Text style={[modal.brandText, brand === b && modal.brandTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Last 4 */}
            <Text style={modal.fieldLabel}>Last 4 digits</Text>
            <TextInput
              style={modal.input}
              placeholder="4242"
              placeholderTextColor={colors.labelTertiary}
              keyboardType="number-pad"
              maxLength={4}
              value={lastFour}
              onChangeText={(t) => setLastFour(t.replace(/\D/g, ''))}
            />

            {/* Expiry */}
            <Text style={modal.fieldLabel}>Expiry date</Text>
            <TextInput
              style={modal.input}
              placeholder="MM/YY"
              placeholderTextColor={colors.labelTertiary}
              keyboardType="number-pad"
              maxLength={5}
              value={expiry}
              onChangeText={(t) => setExpiry(formatExpiry(t))}
            />

            {/* Primary toggle */}
            <View style={modal.toggleRow}>
              <Text style={modal.toggleLabel}>Set as primary card</Text>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: '#D1D5DB', true: colors.lime }}
                thumbColor={colors.white}
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            {/* Add button */}
            <TouchableOpacity
              style={[modal.addBtn, (lastFour.length !== 4 || saving) && modal.addBtnDisabled]}
              onPress={handleAdd}
              disabled={lastFour.length !== 4 || saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={modal.addBtnText}>Add card</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadCards = useCallback(async () => {
    try {
      const res = await cardsApi.list();
      setCards(res.data);
    } catch {
      Alert.alert('Error', 'Could not load your cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleDelete = (card: Card) => {
    Alert.alert(
      'Remove card',
      `Remove ${card.brand} ···· ${card.last_four} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setCards((prev) => prev.filter((c) => c.id !== card.id));
            try {
              await cardsApi.remove(card.id);
            } catch {
              setCards((prev) => [...prev, card]);
              Alert.alert('Error', 'Could not remove card.');
            }
          },
        },
      ],
    );
  };

  const handleSetPrimary = async (card: Card) => {
    if (card.is_primary) return;
    try {
      await cardsApi.setPrimary(card.id);
      setCards((prev) => prev.map((c) => ({ ...c, is_primary: c.id === card.id })));
    } catch {
      Alert.alert('Error', 'Could not update primary card.');
    }
  };

  const handleCardAdded = (card: Card) => {
    setCards((prev) => {
      const updated = card.is_primary
        ? prev.map((c) => ({ ...c, is_primary: false }))
        : [...prev];
      return [...updated, card].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment methods</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Cards on file</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.lime} />
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyCard}>
            <CreditCard size={40} color={colors.labelTertiary} strokeWidth={1.25} />
            <Text style={styles.emptyText}>No cards added yet</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {cards.map((c, idx) => (
              <View key={c.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleSetPrimary(c)}
                  activeOpacity={0.75}
                >
                  {/* Icon */}
                  <View style={styles.iconWrap}>
                    <CreditCard size={18} color={colors.labelSecondary} strokeWidth={1.75} />
                  </View>

                  {/* Info */}
                  <View style={styles.rowInfo}>
                    <Text style={styles.cardName}>
                      {c.brand} ···· {c.last_four}
                    </Text>
                    <Text style={styles.cardSub}>
                      {c.expiry ? `Expires ${c.expiry}` : 'No expiry set'}
                      {c.is_primary ? ' · Primary' : ''}
                    </Text>
                  </View>

                  {/* Delete */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(c)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.deleteBtnInner}>
                      <Trash2 size={16} color={colors.destructive} strokeWidth={1.75} />
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
                {idx < cards.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* Add new card */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
          <Plus size={18} color={colors.white} strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add new card</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddCardModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={handleCardAdded}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.screenX, paddingVertical: 14,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: fonts.bold, color: colors.ink },
  headerRight: { width: 44 },

  content: { paddingHorizontal: spacing.screenX, gap: 16, paddingTop: 4 },
  sectionLabel: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.ink },

  center: { paddingVertical: 40, alignItems: 'center' },
  emptyCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 40, alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary },

  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowInfo: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  cardSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary, marginTop: 2 },
  deleteBtn: { flexShrink: 0 },
  deleteBtnInner: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: colors.paper, marginLeft: 76 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.ink, borderRadius: radius.pill,
    paddingVertical: 18,
  },
  addBtnText: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.white },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────

const modal = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  avoidWrap: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12, gap: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.separator, alignSelf: 'center', marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 19, fontFamily: fonts.bold, color: colors.ink },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.paper,
    justifyContent: 'center', alignItems: 'center',
  },

  fieldLabel: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.labelSecondary, marginBottom: -4 },

  brandRow: { flexDirection: 'row', gap: 8 },
  brandPill: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: colors.paper, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  brandPillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  brandText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  brandTextActive: { color: colors.white },

  input: {
    height: 52, backgroundColor: colors.paper,
    borderRadius: radius.xl, paddingHorizontal: 18,
    fontSize: 16, fontFamily: fonts.regular, color: colors.ink,
  },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink },

  addBtn: {
    height: 54, borderRadius: radius.pill,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.white },
});
