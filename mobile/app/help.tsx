import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Search, MessageCircle, Mail, Phone, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '@/lib/theme';

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    id: '1',
    question: 'How does my monthly wallet work?',
    answer:
      'Each month your employer tops up your wallet. Unused balance does not roll over. Submit requests for offers or packages — once approved, the amount is deducted.',
  },
  {
    id: '2',
    question: 'What happens when an offer is approved?',
    answer:
      'Once your request is approved, the amount is deducted from your wallet and you receive a redemption code or booking confirmation from the provider.',
  },
  {
    id: '3',
    question: 'Can I cancel a pending request?',
    answer:
      'Yes — open your request from the Requests tab and tap Cancel. You can only cancel while the request is still pending. Once approved, cancellation must go through your HR team.',
  },
  {
    id: '4',
    question: 'How are AI Picks chosen?',
    answer:
      'Our AI analyses your interests, past requests, wallet balance, and popular choices among colleagues to recommend the most relevant offers for you.',
  },
  {
    id: '5',
    question: 'Are Shake Shake rewards real?',
    answer:
      'Yes! Every shake gives you a real reward — from bonus wallet credits to exclusive discount codes. You get one free shake per day.',
  },
  {
    id: '6',
    question: 'How do I redeem an offer?',
    answer:
      'After your request is approved go to the Redemptions tab, find your offer, and tap "Show code." Present the QR code or coupon code at the provider.',
  },
  {
    id: '7',
    question: 'Can I transfer credits to a colleague?',
    answer:
      'Yes — go to Home → Transfer Credits, pick a colleague and enter the amount. Credits are deducted from your monthly benefit budget and added to theirs.',
  },
];

// ─── FAQ accordion item ───────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.faqQuestion}>{question}</Text>
        {open
          ? <ChevronUp size={18} color={colors.labelTertiary} strokeWidth={2} />
          : <ChevronDown size={18} color={colors.labelTertiary} strokeWidth={2} />}
      </TouchableOpacity>
      {open && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return FAQS;
    const q = query.toLowerCase();
    return FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [query]);

  const handleLiveChat = () => router.push('/(tabs)/ai' as any);

  const handleEmail = () =>
    Linking.openURL('mailto:help@perka.al').catch(() =>
      Alert.alert('Could not open email', 'Contact us at help@perka.al')
    );

  const handleCall = () =>
    Linking.openURL('tel:+35542200000').catch(() =>
      Alert.alert('Could not open phone', 'Call us at +355 4 220 0000')
    );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.labelTertiary} strokeWidth={1.75} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles"
            placeholderTextColor={colors.labelTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Contact us */}
        {!query.trim() && (
          <>
            <Text style={styles.sectionLabel}>Contact us</Text>
            <View style={styles.contactCard}>
              <TouchableOpacity style={styles.contactRow} onPress={handleLiveChat} activeOpacity={0.8}>
                <View style={styles.contactIcon}>
                  <MessageCircle size={20} color={colors.labelSecondary} strokeWidth={1.75} />
                </View>
                <View style={styles.contactBody}>
                  <Text style={styles.contactName}>Live chat</Text>
                  <Text style={styles.contactSub}>Average reply 2 min</Text>
                </View>
                <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.75} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.contactRow} onPress={handleEmail} activeOpacity={0.8}>
                <View style={styles.contactIcon}>
                  <Mail size={20} color={colors.labelSecondary} strokeWidth={1.75} />
                </View>
                <View style={styles.contactBody}>
                  <Text style={styles.contactName}>Email</Text>
                </View>
                <Text style={styles.contactValue}>help@perka.al</Text>
                <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.75} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.contactRow} onPress={handleCall} activeOpacity={0.8}>
                <View style={styles.contactIcon}>
                  <Phone size={20} color={colors.labelSecondary} strokeWidth={1.75} />
                </View>
                <View style={styles.contactBody}>
                  <Text style={styles.contactName}>Call</Text>
                </View>
                <Text style={styles.contactValue}>+355 4 220 0000</Text>
                <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* FAQ */}
        <Text style={styles.sectionLabel}>
          {query.trim() ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'FAQ'}
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No articles found for "{query}".</Text>
            <TouchableOpacity onPress={handleLiveChat} activeOpacity={0.8}>
              <Text style={styles.emptyLink}>Chat with us instead →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((faq) => (
            <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
          ))
        )}
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

  content: { paddingHorizontal: spacing.screenX, gap: 14, paddingTop: 4 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 18, height: 52,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: fonts.regular, color: colors.ink },

  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  // Contact card
  contactCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden' },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16, gap: 14,
  },
  divider: { height: 1, backgroundColor: colors.paper, marginHorizontal: 18 },
  contactIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  contactBody: { flex: 1, gap: 2 },
  contactName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink },
  contactSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary },
  contactValue: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },

  // FAQ
  faqCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18,
  },
  faqHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  faqQuestion: {
    flex: 1, fontSize: 16, fontFamily: fonts.bold, color: colors.ink, lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.labelSecondary,
    lineHeight: 21, marginTop: 12,
  },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: colors.labelSecondary, textAlign: 'center' },
  emptyLink: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },
});
