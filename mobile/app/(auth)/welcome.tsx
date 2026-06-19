import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Perka</Text>
        <Text style={styles.tagline}>Your benefits, your way.{'\n'}Discover. Request. Enjoy.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Get Started" onPress={() => router.push('/(auth)/register')} />
        <PrimaryButton
          title="Sign In"
          onPress={() => router.push('/(auth)/login')}
          variant="outline"
          style={styles.loginBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 120,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: -2,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    opacity: 0.85,
  },
  actions: {
    gap: 12,
  },
  loginBtn: {
    marginTop: 4,
  },
});
