import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, Compass, Sparkles, Wallet, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, fonts } from '@/lib/theme';

function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      {/* Lime dot indicator above icon */}
      <View style={[styles.dot, focused && styles.dotVisible]} />
      <Icon
        size={22}
        color={focused ? colors.ink : colors.labelTertiary}
        strokeWidth={focused ? 2 : 1.5}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.separator,
          elevation: 0,
          shadowColor: 'transparent',
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.labelTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.semiBold,
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingTop: 4,
          paddingBottom: insets.bottom > 0 ? 0 : 6,
        },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ focused }) => <TabIcon icon={Home}          focused={focused} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore',  tabBarIcon: ({ focused }) => <TabIcon icon={Compass}       focused={focused} /> }} />
      <Tabs.Screen name="wallet"  options={{ title: 'Wallet',   tabBarIcon: ({ focused }) => <TabIcon icon={Wallet}        focused={focused} /> }} />
      <Tabs.Screen name="ai"      options={{ title: 'AI',       tabBarIcon: ({ focused }) => <TabIcon icon={Sparkles}     focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile',  tabBarIcon: ({ focused }) => <TabIcon icon={User}          focused={focused} /> }} />

      {/* Hidden from tab bar — accessible via navigation */}
      <Tabs.Screen name="swipe" options={{ href: null }} />
      <Tabs.Screen name="shake" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: colors.lime,
  },
});
