import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, Sparkles } from 'lucide-react-native';
import { aiApi, usersApi } from '@/lib/api';
import { OfferCard } from '@/components/OfferCard';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import type { AIConciergeResponse, Offer } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  categories?: string[];
  packageTitle?: string;
  offers?: Offer[];
}

const CATEGORIES = ['WELLNESS', 'FITNESS', 'FOOD', 'TRAVEL', 'LEARNING'];

const QUICK_PROMPTS = [
  "I'm burnt out",
  'I want to get fit',
  'Plan a weekend escape',
  'Surprise me with a food pick',
  'Find a learning offer',
];

// ─── Bubble components ────────────────────────────────────────────────────────

function AIBubble({ msg, onCategoryPress }: { msg: Message; onCategoryPress?: (cat: string) => void }) {
  return (
    <View style={styles.aiBubble}>
      <Text style={styles.aiBubbleText}>{msg.text}</Text>
      {msg.categories && msg.categories.length > 0 && (
        <View style={styles.catRow}>
          {msg.categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={styles.catChip}
              onPress={() => onCategoryPress?.(c)}
              activeOpacity={0.7}
            >
              <Text style={styles.catChipText}>{c.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {msg.packageTitle && (
        <View style={styles.packageChip}>
          <Sparkles size={11} color={colors.ink} strokeWidth={2} />
          <Text style={styles.packageChipText}>Suggested: {msg.packageTitle}</Text>
        </View>
      )}
      {msg.offers && msg.offers.length > 0 && (
        <View style={styles.offersWrap}>
          {msg.offers.map((o) => <OfferCard key={o.id} offer={o} />)}
        </View>
      )}
    </View>
  );
}

function UserBubble({ msg }: { msg: Message }) {
  return (
    <View style={styles.userBubbleWrap}>
      <View style={styles.userBubble}>
        <Text style={styles.userBubbleText}>{msg.text}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersApi.me()
      .then((res) => {
        const name: string = res.data.full_name ?? '';
        const first = name.split(' ')[0];
        setUserName(first);
        setMessages([
          {
            id: '0',
            role: 'ai',
            text: `Hi ${first} — I'm your Perka concierge. Tell me how you're feeling this week and I'll find perks that match.`,
            categories: ['wellness', 'fitness', 'food', 'travel', 'learning'],
          },
        ]);
      })
      .catch(() => {
        setMessages([
          {
            id: '0',
            role: 'ai',
            text: "Hi — I'm your Perka concierge. Tell me how you're feeling this week and I'll find perks that match.",
            categories: ['wellness', 'fitness', 'food', 'travel', 'learning'],
          },
        ]);
      });
  }, []);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const res = await aiApi.concierge(msg);
      const data: AIConciergeResponse = res.data;
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.reply,
        categories: data.suggested_categories ?? [],
        packageTitle: data.suggested_package_title ?? undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', text: "Sorry, I couldn't connect right now. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerIcon}>
          <Sparkles size={22} color={colors.ink} strokeWidth={2} />
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Concierge</Text>
          <Text style={styles.headerSub}>POWERED BY PERKA</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={[styles.chatContent, { paddingBottom: 12 }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) =>
          msg.role === 'ai'
            ? <AIBubble key={msg.id} msg={msg} onCategoryPress={(cat) => send(`Show me ${cat} offers`)} />
            : <UserBubble key={msg.id} msg={msg} />
        )}

        {loading && (
          <View style={styles.aiBubble}>
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={colors.labelSecondary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts */}
      <View style={styles.quickWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
          keyboardShouldPersistTaps="always"
        >
          {QUICK_PROMPTS.map((p) => (
            <TouchableOpacity
              key={p}
              style={styles.quickChip}
              onPress={() => {
                setInput('');
                send(p);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
        <TextInput
          style={styles.input}
          placeholder="Message Concierge..."
          placeholderTextColor={colors.labelTertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          multiline={false}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
          activeOpacity={0.75}
        >
          <ArrowUp size={18} color={colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: spacing.screenX, paddingBottom: 14,
    backgroundColor: colors.paper,
  },
  headerIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.lime,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.4 },
  headerSub: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 1, marginTop: 1 },

  chat: { flex: 1 },
  chatContent: { paddingHorizontal: spacing.screenX, gap: 10, paddingTop: 4 },

  // AI bubble
  aiBubble: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: 18,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    gap: 12,
  },
  aiBubbleText: { fontSize: 16, fontFamily: fonts.regular, color: colors.ink, lineHeight: 24 },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.ink,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  catChipText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink, letterSpacing: 0.5 },

  packageChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.lime, borderRadius: radius.pill,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
  },
  packageChipText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.ink },

  offersWrap: { gap: 8, width: '100%' },

  // User bubble
  userBubbleWrap: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    paddingHorizontal: 18, paddingVertical: 14,
    maxWidth: '80%',
  },
  userBubbleText: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink, lineHeight: 22 },

  typingDots: { paddingVertical: 4 },

  // Quick prompts
  quickWrap: { backgroundColor: colors.paper, paddingTop: 6, paddingBottom: 2 },
  quickRow: { paddingHorizontal: spacing.screenX, gap: 8, paddingVertical: 2 },
  quickChip: {
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 11,
    shadowColor: colors.ink, shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  quickChipText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.screenX, paddingTop: 10,
    backgroundColor: colors.paper,
  },
  input: {
    flex: 1, height: 50,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 20, fontSize: 16,
    fontFamily: fonts.regular, color: colors.ink,
  },
  sendBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.labelSecondary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
