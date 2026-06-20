import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Send, Filter } from 'lucide-react-native';
import { aiApi, aiFilterApi } from '@/lib/api';
import { OfferCard } from '@/components/OfferCard';
import type { AIConciergeResponse, Offer } from '@/types';

type Mode = 'concierge' | 'filter';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  response?: AIConciergeResponse;
  offers?: Offer[];
}

export default function AIScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('concierge');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: "Hi! I'm Perka AI. Tell me how you're feeling or what you'd like to do, and I'll suggest the perfect benefits package for you. 🎯",
    },
  ]);
  const [filterMessages, setFilterMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: "Tell me what you're looking for and I'll find matching offers instantly! Try: 'Show me wellness offers under 5,000 ALL' 🔍",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const activeMessages = mode === 'concierge' ? messages : filterMessages;
  const setActiveMessages = mode === 'concierge' ? setMessages : setFilterMessages;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setActiveMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'filter') {
        const res = await aiFilterApi.filterOffers(text);
        const offers: Offer[] = res.data.items ?? [];
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: offers.length > 0
            ? `Found ${offers.length} offer${offers.length !== 1 ? 's' : ''} matching your request:`
            : 'No offers found for that search. Try different keywords!',
          offers,
        };
        setActiveMessages((prev) => [...prev, aiMsg]);
      } else {
        const res = await aiApi.concierge(text);
        const data: AIConciergeResponse = res.data;
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: data.reply,
          response: data,
        };
        setActiveMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      setActiveMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', text: 'Sorry, I had trouble connecting. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Concierge</Text>
        <Text style={styles.subtitle}>Powered by Perka Intelligence</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'concierge' && styles.modeBtnActive]}
            onPress={() => setMode('concierge')}
          >
            <Text style={[styles.modeBtnText, mode === 'concierge' && styles.modeBtnTextActive]}>🤖 Concierge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'filter' && styles.modeBtnActive]}
            onPress={() => setMode('filter')}
          >
            <Text style={[styles.modeBtnText, mode === 'filter' && styles.modeBtnTextActive]}>🔍 Filter Offers</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent}>
        {activeMessages.map((msg) => (
          <View key={msg.id}>
            <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>{msg.text}</Text>
              {(msg.response?.suggested_categories?.length ?? 0) > 0 && (
                <View style={styles.tags}>
                  {msg.response?.suggested_categories?.map((cat) => (
                    <View key={cat} style={styles.tag}>
                      <Text style={styles.tagText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}
              {msg.response?.suggested_package_title && (
                <Text style={styles.packageHint}>✨ Package: {msg.response.suggested_package_title}</Text>
              )}
            </View>
            {msg.offers && msg.offers.length > 0 && (
              <View style={styles.offersContainer}>
                {msg.offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            )}
          </View>
        ))}
        {loading && (
          <View style={styles.aiBubble}>
            <ActivityIndicator size="small" color="#22C55E" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={mode === 'filter' ? 'e.g. wellness under 5000 ALL...' : 'Ask me anything about your benefits...'}
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={loading}>
          <Send size={20} color="#111" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { color: '#A1A1AA', fontSize: 13, marginTop: 4, marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2A2A2A' },
  modeBtnActive: { backgroundColor: '#22C55E20', borderColor: '#22C55E' },
  modeBtnText: { color: '#A1A1AA', fontWeight: '600', fontSize: 13 },
  modeBtnTextActive: { color: '#22C55E' },
  chat: { flex: 1 },
  chatContent: { padding: 20, gap: 12, paddingBottom: 20 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 14 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#1E1E1E', borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#22C55E', borderBottomRightRadius: 4 },
  bubbleText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  userText: { color: '#111111', fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
  packageHint: { color: '#22C55E', fontSize: 13, marginTop: 8, fontWeight: '600' },
  offersContainer: { marginTop: 8, gap: 8 },
  inputRow: {
    flexDirection: 'row', padding: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: '#2A2A2A', backgroundColor: '#111111',
  },
  input: {
    flex: 1, backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14,
    color: '#FFFFFF', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A',
  },
  sendBtn: {
    backgroundColor: '#22C55E', width: 48, height: 48,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
});
