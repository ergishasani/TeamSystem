import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Send, MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const QUICK_PROMPTS = [
  'Plan a weekend with my wallet',
  'Surprise me with a wellness pick',
  'Find a learning offer under 5,000 ALL',
  'Book a team lunch spot',
];

interface AIReply {
  reply: string;
  suggested_categories?: string[];
  suggested_package_title?: string;
}

export default function ConciergeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<AIReply | null>(null);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || loading) return;
    setLoading(true);
    setReply(null);
    try {
      const res = await aiApi.concierge(text);
      setReply(res.data);
    } catch (err: any) {
      Alert.alert('Could not send', err?.response?.data?.detail ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (prompt: string) => {
    setMessage(prompt);
    setReply(null);
  };

  const handleLiveChat = () => {
    router.push('/(tabs)/ai' as any);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:concierge@perka.al').catch(() =>
      Alert.alert('Could not open email', 'Send us an email at concierge@perka.al')
    );
  };

  const handleCall = () => {
    Linking.openURL('tel:+35542200000').catch(() =>
      Alert.alert('Could not open phone', 'Call us at +355 4 220 0000')
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Concierge</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Sparkles size={13} color={colors.ink} strokeWidth={2} />
              <Text style={styles.heroBadgeText}>HUMAN + AI</Text>
            </View>
            <Text style={styles.heroTitle}>Need help choosing?{'\n'}We'll plan it for you.</Text>
            <Text style={styles.heroSub}>
              A real Perka concierge with your full wallet context — usually replies in 5 minutes.
            </Text>
          </View>

          {/* Quick start */}
          <Text style={styles.sectionLabel}>Quick start</Text>
          <View style={styles.quickList}>
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.quickPill}
                onPress={() => handleQuick(prompt)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickPillText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Your request */}
          <Text style={styles.sectionLabel}>Your request</Text>
          <View style={styles.textareaCard}>
            <TextInput
              style={styles.textarea}
              placeholder="What are you looking for?"
              placeholderTextColor={colors.labelTertiary}
              value={message}
              onChangeText={(v) => { setMessage(v); setReply(null); }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* AI reply */}
          {reply && (
            <View style={styles.replyCard}>
              <View style={styles.replyBadge}>
                <Sparkles size={12} color={colors.ink} strokeWidth={2} />
                <Text style={styles.replyBadgeText}>Concierge reply</Text>
              </View>
              <Text style={styles.replyText}>{reply.reply}</Text>
              {(reply.suggested_categories?.length ?? 0) > 0 && (
                <View style={styles.tags}>
                  {reply.suggested_categories!.map((cat) => (
                    <View key={cat} style={styles.tag}>
                      <Text style={styles.tagText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}
              {reply.suggested_package_title && (
                <Text style={styles.packageHint}>
                  Suggested package: {reply.suggested_package_title}
                </Text>
              )}
            </View>
          )}

          {/* Send button */}
          <TouchableOpacity
            style={[styles.sendBtn, (!message.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color={colors.ink} size="small" />
              : (
                <>
                  <Send size={19} color={colors.ink} strokeWidth={2} />
                  <Text style={styles.sendBtnText}>Send request</Text>
                </>
              )}
          </TouchableOpacity>

          {/* Or reach us directly */}
          <Text style={styles.sectionLabel}>Or reach us directly</Text>
          <View style={styles.contactCard}>
            <TouchableOpacity style={styles.contactRow} onPress={handleLiveChat} activeOpacity={0.8}>
              <View style={styles.contactIcon}>
                <MessageCircle size={20} color={colors.labelSecondary} strokeWidth={1.75} />
              </View>
              <View style={styles.contactBody}>
                <Text style={styles.contactName}>Live chat</Text>
                <Text style={styles.contactSub}>2 min avg</Text>
              </View>
              <ChevronRight size={16} color={colors.labelTertiary} strokeWidth={1.75} />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity style={styles.contactRow} onPress={handleEmail} activeOpacity={0.8}>
              <View style={styles.contactIcon}>
                <Mail size={20} color={colors.labelSecondary} strokeWidth={1.75} />
              </View>
              <View style={styles.contactBody}>
                <Text style={styles.contactName}>Email</Text>
              </View>
              <Text style={styles.contactValue}>concierge@perka.al</Text>
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity style={styles.contactRow} onPress={handleCall} activeOpacity={0.8}>
              <View style={styles.contactIcon}>
                <Phone size={20} color={colors.labelSecondary} strokeWidth={1.75} />
              </View>
              <View style={styles.contactBody}>
                <Text style={styles.contactName}>Call</Text>
              </View>
              <Text style={styles.contactValue}>+355 4 220 0000</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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

  // Hero
  heroCard: {
    backgroundColor: colors.ink, borderRadius: radius['2xl'],
    padding: 22, gap: 12,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.lime, borderRadius: radius.pill,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
  },
  heroBadgeText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink, letterSpacing: 0.5 },
  heroTitle: {
    fontSize: 24, fontFamily: fonts.bold, color: colors.white,
    lineHeight: 30, letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },

  // Sections
  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  // Quick prompts
  quickList: { gap: 8 },
  quickPill: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    paddingHorizontal: 18, paddingVertical: 16,
  },
  quickPillText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink },

  // Textarea
  textareaCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 18, minHeight: 120,
  },
  textarea: {
    fontSize: 16, fontFamily: fonts.regular, color: colors.ink,
    lineHeight: 24, flex: 1, minHeight: 90,
  },

  // Reply
  replyCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'],
    padding: 18, gap: 10,
  },
  replyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.lime, borderRadius: radius.pill,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
  },
  replyBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.ink },
  replyText: { fontSize: 15, fontFamily: fonts.regular, color: colors.ink, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: colors.paper, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.ink },
  packageHint: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.labelSecondary, fontStyle: 'italic' },

  // Send button
  sendBtn: {
    height: 58, borderRadius: radius.pill,
    backgroundColor: colors.lime,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  // Contact
  contactCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16, gap: 14,
  },
  contactDivider: { height: 1, backgroundColor: colors.paper, marginHorizontal: 18 },
  contactIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center',
  },
  contactBody: { flex: 1, gap: 2 },
  contactName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.ink },
  contactSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelTertiary },
  contactValue: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },
});
