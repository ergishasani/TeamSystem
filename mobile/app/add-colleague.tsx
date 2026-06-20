import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const DEPARTMENTS = ['Engineering', 'Design', 'Sales', 'People', 'Marketing', 'Finance', 'Operations'];

export default function AddColleagueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim() || !email.includes('@')) e.email = 'Valid email is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      await authApi.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: 'perka2026',
        role: 'employee',
      });
      setDone(true);
    } catch (err: any) {
      Alert.alert('Failed to add', err?.response?.data?.detail ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.successWrap, { paddingTop: insets.top }]}>
        <View style={styles.successCircle}>
          <Check size={36} color={colors.ink} strokeWidth={2.5} />
        </View>
        <Text style={styles.successTitle}>Colleague added!</Text>
        <Text style={styles.successSub}>
          {fullName} has been added to your company on Perka.
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.back()}
          activeOpacity={0.88}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Add Colleague</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Fields card */}
          <View style={styles.fieldsCard}>
            {/* Full name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput
                style={[styles.fieldInput, errors.fullName && styles.fieldInputError]}
                placeholder="e.g. Arta Hoxha"
                placeholderTextColor={colors.labelTertiary}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: '' })); }}
                autoCapitalize="words"
              />
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            <View style={styles.fieldDivider} />

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Work email</Text>
              <TextInput
                style={[styles.fieldInput, errors.email && styles.fieldInputError]}
                placeholder="colleague@company.al"
                placeholderTextColor={colors.labelTertiary}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>
          </View>

          {/* Department */}
          <Text style={styles.sectionLabel}>Department</Text>
          <View style={styles.deptGrid}>
            {DEPARTMENTS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.deptPill, department === d && styles.deptPillActive]}
                onPress={() => setDepartment(d === department ? '' : d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.deptPillText, department === d && styles.deptPillTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.note}>
            The colleague will receive an invitation and can log in with their email. Default password: perka2026
          </Text>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.addBtn, loading && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color={colors.ink} size="small" />
              : <Text style={styles.addBtnText}>Add Colleague</Text>}
          </TouchableOpacity>
        </View>
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

  content: { paddingHorizontal: spacing.screenX, paddingTop: 4, gap: 16 },

  fieldsCard: {
    backgroundColor: colors.white, borderRadius: radius['2xl'], overflow: 'hidden',
  },
  field: { padding: 18, gap: 6 },
  fieldDivider: { height: 1, backgroundColor: colors.paper, marginHorizontal: 18 },
  fieldLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 0.5 },
  fieldInput: {
    fontSize: 17, fontFamily: fonts.semiBold, color: colors.ink,
    paddingVertical: 4, paddingHorizontal: 0,
  },
  fieldInputError: { color: colors.destructive },
  errorText: { fontSize: 12, fontFamily: fonts.regular, color: colors.destructive, marginTop: 2 },

  sectionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.labelTertiary, letterSpacing: 0.5 },

  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  deptPill: {
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  deptPillActive: { backgroundColor: colors.ink },
  deptPillText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.labelSecondary },
  deptPillTextActive: { color: colors.white },

  note: {
    fontSize: 12, fontFamily: fonts.regular, color: colors.labelTertiary,
    lineHeight: 18, textAlign: 'center', paddingHorizontal: 8,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenX, paddingTop: 12,
    backgroundColor: colors.paper,
  },
  addBtn: {
    height: 58, borderRadius: radius.pill,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },

  successWrap: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.screenX },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5, marginBottom: 10 },
  successSub: { fontSize: 16, fontFamily: fonts.regular, color: colors.labelSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  doneBtn: {
    height: 56, paddingHorizontal: 48, borderRadius: radius.pill,
    backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontFamily: fonts.bold, color: colors.white },
});
