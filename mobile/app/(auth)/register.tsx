import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.register({ full_name: fullName, email: email.trim().toLowerCase(), password, role: 'employee', company_id: 1 });
      await login(email.trim().toLowerCase(), password);
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style="dark" />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Perka and start exploring your benefits.</Text>
        </View>

        {/* Single card with all 4 fields */}
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Arta Hoxha"
              placeholderTextColor={colors.labelTertiary}
              value={fullName}
              onChangeText={(v) => { setFullName(v); setError(''); }}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="you@company.al"
              placeholderTextColor={colors.labelTertiary}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="••••••••"
              placeholderTextColor={colors.labelTertiary}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              secureTextEntry
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="••••••••"
              placeholderTextColor={colors.labelTertiary}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
              secureTextEntry
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleRegister}
          activeOpacity={0.82}
          disabled={loading}
        >
          <Text style={styles.createBtnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity style={styles.footerWrap} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
          <Text style={styles.footerText}>
            Already have an account?{'  '}
            <Text style={styles.footerLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.screenX,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  titleBlock: {
    marginBottom: 28,
  },
  title: {
    fontSize: 36,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    marginBottom: 16,
    overflow: 'hidden',
  },
  fieldRow: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.labelSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink,
    height: 28,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginHorizontal: 18,
  },
  error: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.destructive,
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.semiBold,
  },
  footerWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
  },
  footerLink: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
});
