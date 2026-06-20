import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, spacing } from '@/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>P</Text>
        </View>
        <Text style={styles.wordmark}>Perka</Text>
        <Text style={styles.headline}>Your benefits,{'\n'}your way.</Text>
        <Text style={styles.subtext}>Discover perks, request rewards,{'\n'}and enjoy what matters to you.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Sign in"
          variant="filled"
          onPress={() => router.push('/(auth)/login')}
        />
        <PrimaryButton
          title="Create account"
          variant="bordered"
          onPress={() => router.push('/(auth)/register')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.screenX,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoLetter: {
    fontSize: 40,
    fontFamily: fonts.bold,
    color: colors.ink,
    lineHeight: 48,
  },
  wordmark: {
    fontSize: 36,
    fontFamily: fonts.bold,
    color: colors.ink,
    letterSpacing: -1,
  },
  headline: {
    fontSize: 42,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -1.5,
    lineHeight: 50,
    marginTop: 8,
  },
  subtext: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.labelSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
});
