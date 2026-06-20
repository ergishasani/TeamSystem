import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isHydrated, user, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isHydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !fontsLoaded) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isHydrated, user, fontsLoaded]);

  if (!fontsLoaded || !isHydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Screen name="(auth)/welcome" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="deal-of-day" options={{ presentation: 'card' }} />
        <Stack.Screen name="offers/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="packages/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="requests/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="redemptions/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}
