import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Login failed. Check your credentials.';
      setError(msg);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style="dark" />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back. Pick up where you left off.</Text>
      </View>

      {/* Form card — both fields inside one white card */}
      <View style={styles.card}>
        {/* Email */}
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

        {/* Password */}
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
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Sign In button */}
      <TouchableOpacity
        style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]}
        onPress={handleLogin}
        activeOpacity={0.82}
        disabled={isLoading}
      >
        <Text style={styles.signInText}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
      </TouchableOpacity>

      {/* Forgot password */}
      <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
          <Text style={styles.footerText}>
            New to Perka?{'  '}
            <Text style={styles.footerLink}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </View>
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

  // Single white card with both fields
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

  // CTA
  signInBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signInBtnDisabled: {
    opacity: 0.5,
  },
  signInText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.semiBold,
  },

  // Forgot
  forgotWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },

  // Footer pinned to bottom
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
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
