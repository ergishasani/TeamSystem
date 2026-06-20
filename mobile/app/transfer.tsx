import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, ChevronRight, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usersApi } from '@/lib/api';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface Colleague {
  id: number;
  full_name: string;
  email: string;
  department: string | null;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function AvatarCircle({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials(name)}</Text>
    </View>
  );
}

export default function TransferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Colleague | null>(null);

  const load = useCallback((q?: string) => {
    usersApi.colleagues(q)
      .then((res) => setColleagues(res.data))
      .catch(() => setColleagues([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query || undefined), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handlePick = (colleague: Colleague) => {
    setSelected(colleague);
    router.push(`/transfer/${encodeURIComponent(colleague.email)}?name=${encodeURIComponent(colleague.full_name)}&dept=${encodeURIComponent(colleague.department ?? '')}` as any);
  };

  const handleConfirm = () => {
    if (!selected) return;
    router.push(`/transfer/${encodeURIComponent(selected.email)}?name=${encodeURIComponent(selected.full_name)}&dept=${encodeURIComponent(selected.department ?? '')}` as any);
  };

  if (loading) return <LoadingState />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Credits</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-colleague' as any)}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.labelTertiary} strokeWidth={1.75} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find a colleague"
            placeholderTextColor={colors.labelTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {colleagues.length === 0 ? (
          <EmptyState title="No colleagues found" message="Try a different name." />
        ) : (
          <>
            <Text style={styles.sectionLabel}>Recent</Text>
            <View style={styles.listCard}>
              {colleagues.map((c, i) => (
                <View key={c.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={[styles.row, selected?.id === c.id && styles.rowSelected]}
                    onPress={() => handlePick(c)}
                    activeOpacity={0.75}
                  >
                    <AvatarCircle name={c.full_name} />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowName}>{c.full_name}</Text>
                      {c.department && (
                        <Text style={styles.rowDept}>{c.department}</Text>
                      )}
                    </View>
                    <ChevronRight size={18} color={colors.labelTertiary} strokeWidth={1.75} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.pickBtn, !selected && styles.pickBtnDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.88}
          disabled={!selected}
        >
          <Text style={styles.pickBtnText}>
            {selected ? `Send to ${selected.full_name.split(' ')[0]}` : 'Pick a colleague'}
          </Text>
        </TouchableOpacity>
      </View>
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

  searchWrap: { paddingHorizontal: spacing.screenX, marginBottom: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 18, height: 52,
  },
  searchInput: {
    flex: 1, fontSize: 16, fontFamily: fonts.regular, color: colors.ink,
  },

  list: { paddingHorizontal: spacing.screenX, gap: 14 },
  sectionLabel: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  listCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.paper, marginHorizontal: 18 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16, gap: 14,
  },
  rowSelected: { backgroundColor: colors.lime + '22' },

  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.lime,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },

  rowBody: { flex: 1, gap: 3 },
  rowName: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  rowDept: { fontSize: 13, fontFamily: fonts.regular, color: colors.labelSecondary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenX, paddingTop: 12,
    backgroundColor: colors.paper,
  },
  pickBtn: {
    height: 58, borderRadius: radius.pill,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  pickBtnDisabled: { opacity: 0.5 },
  pickBtnText: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
});
